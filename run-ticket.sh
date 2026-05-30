#!/bin/bash
set -euo pipefail

ISSUE=$1
BRANCH=$2
MODEL_SHORT=${3:-sonnet}
EFFORT=${4:-}
REPO="barrylavides/budget-app"
MAX_RETRIES=3
# Verification knobs (env-overridable):
#   MANUAL=1     fall back to the old interactive [y/n] sign-off
#   VERIFIER=0   skip the independent verifier agent (run deterministic gates only)
MANUAL=${MANUAL:-0}
VERIFIER=${VERIFIER:-1}
VERIFIER_MODEL="claude-sonnet-4-6"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="${SCRIPT_DIR}/logs"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="${LOG_DIR}/ticket-${ISSUE}-${TIMESTAMP}.log"
PROMPT_FILE=$(mktemp)
ATTEMPT_LOG=$(mktemp)
WORK_DIR="${SCRIPT_DIR}/workspaces/ticket-${ISSUE}"

mkdir -p "$LOG_DIR" "$WORK_DIR"
trap "rm -f $PROMPT_FILE $ATTEMPT_LOG" EXIT

case "$MODEL_SHORT" in
  haiku)  MODEL_ID="claude-haiku-4-5-20251001" ;;
  sonnet) MODEL_ID="claude-sonnet-4-6" ;;
  opus)   MODEL_ID="claude-opus-4-8" ;;
  *)      MODEL_ID="$MODEL_SHORT" ;;
esac

# Feature tickets touch DB + UI behavior; haiku has repeatedly under-implemented
# and mis-verified them. Warn (don't block) when running a feature ticket on haiku.
if [ "$MODEL_SHORT" = "haiku" ]; then
  echo "  ⚠ haiku is weak for data-backed UI tickets — sonnet is recommended for these."
fi

EFFORT_FLAG=""
if [ -n "$EFFORT" ]; then
  EFFORT_FLAG="--effort ${EFFORT}"
fi

AGENT_HOME="/home/agent"

# Host GitHub token, passed into the container so the agent can push over HTTPS
# itself (via `gh auth setup-git`). Empty if gh is absent/unauthenticated.
GH_TOKEN="$(gh auth token 2>/dev/null || true)"
export GH_TOKEN

elapsed_since() {
  local start=$1
  local now=$(date +%s)
  local secs=$((now - start))
  printf "%02d:%02d:%02d" $((secs/3600)) $(((secs%3600)/60)) $((secs%60))
}

print_divider() {
  printf '%.0s─' {1..70}
  echo
}

# Check every box, swap the label to `completed`, and close the issue.
close_issue() {
  local body_file=$1
  local checked
  checked=$(mktemp)
  sed 's/^- \[ \]/- [x]/' "$body_file" > "$checked"
  gh issue edit "$ISSUE" --repo "$REPO" --body-file "$checked" >/dev/null 2>&1 || true
  gh label create completed --repo "$REPO" --color 6F42C1 \
    --description "Implemented, merged, and verified" >/dev/null 2>&1 || true
  gh issue edit "$ISSUE" --repo "$REPO" \
    --remove-label "ready-for-agent" --add-label "completed" >/dev/null 2>&1 || true
  if gh issue close "$ISSUE" --repo "$REPO" \
       --comment "All acceptance criteria verified and signed off via run-ticket.sh. Closing." >/dev/null 2>&1; then
    echo "  ✔ Issue #${ISSUE} closed and labeled 'completed'."
  else
    echo "  ⚠ Issue close may have failed — check #${ISSUE} manually."
  fi
  rm -f "$checked"
}

# Fallback: interactive per-criterion sign-off (MANUAL=1). Reads from /dev/tty.
manual_sign_off() {
  echo ""
  print_divider
  echo "  MANUAL ACCEPTANCE CRITERIA SIGN-OFF — issue #${ISSUE}"
  print_divider
  printf "  Ready to verify acceptance criteria now? [y/N] "
  local ready=""
  read -r ready < /dev/tty 2>/dev/null || ready=""
  if [[ ! "$ready" =~ ^[Yy]$ ]]; then
    echo "  Skipped. Re-run verification later or close #${ISSUE} manually."
    return
  fi

  local body_file
  body_file=$(mktemp)
  if ! gh issue view "$ISSUE" --repo "$REPO" --json body -q .body > "$body_file" 2>/dev/null; then
    echo "  ⚠ Could not fetch issue #${ISSUE} from ${REPO}. Skipping."
    rm -f "$body_file"; return
  fi
  local criteria
  criteria=$(awk '
    /^##[[:space:]]+[Aa]cceptance criteria/ {inblock=1; next}
    inblock && /^##[[:space:]]/ {inblock=0}
    inblock && /^- \[[ xX]\]/ {print}
  ' "$body_file")
  if [ -z "$criteria" ]; then
    echo "  ⚠ No acceptance-criteria checklist found in issue #${ISSUE}."
    rm -f "$body_file"; return
  fi

  local total=0 failed=0 failed_list=""
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    total=$((total + 1))
    local text
    text=$(printf '%s' "$line" | sed -E 's/^- \[[ xX]\] //')
    echo ""; echo "  [${total}] ${text}"
    printf "      Passed? [y/n] "
    local ans=""
    read -r ans < /dev/tty 2>/dev/null || ans=""
    if [[ ! "$ans" =~ ^[Yy]$ ]]; then
      failed=$((failed + 1)); failed_list+="    ✘ ${text}"$'\n'
    fi
  done <<< "$criteria"

  echo ""; print_divider
  if [ "$failed" -eq 0 ]; then
    echo "  ✔ All ${total} acceptance criteria passed. Closing issue #${ISSUE}..."
    close_issue "$body_file"
  else
    echo "  ✘ ${failed}/${total} criteria failed — issue #${ISSUE} left OPEN:"
    printf "%s" "$failed_list"
  fi
  print_divider
  rm -f "$body_file"
}

# ── Shared-stack gate lock ───────────────────────────────────────────────────
# The host gates below all hit ONE local Supabase (project_id="project", fixed
# ports 54321/54322) and one Vite dev server (:5173). Running ./run-ticket.sh
# for several tickets in parallel therefore makes their gates clobber each
# other's database mid-test (a reseed/dev-server race), yielding bogus failures.
# Until per-ticket stacks exist (see plans/dev-phase-01.md → "Parallel gate
# isolation"), serialize the gate stage so siblings take turns on the one stack.
# Portable mkdir-lock (atomic across processes); macOS has no flock.
GATE_LOCK_DIR="${TMPDIR:-/tmp}/budget-app-gate.lock"
acquire_gate_lock() {
  local announced=0
  until mkdir "$GATE_LOCK_DIR" 2>/dev/null; do
    if [ "$announced" -eq 0 ]; then
      echo "  ⏳ [gate] shared local stack busy — waiting for another ticket's gate to finish…"
      announced=1
    fi
    # Reclaim a stale lock whose holder died without releasing.
    if [ -f "$GATE_LOCK_DIR/pid" ] && ! kill -0 "$(cat "$GATE_LOCK_DIR/pid" 2>/dev/null)" 2>/dev/null; then
      rm -rf "$GATE_LOCK_DIR"
    fi
    sleep 2
  done
  echo "$$" > "$GATE_LOCK_DIR/pid"
}
release_gate_lock() {
  # Only remove the lock if THIS process owns it (safe to call unconditionally).
  if [ -f "$GATE_LOCK_DIR/pid" ] && [ "$(cat "$GATE_LOCK_DIR/pid" 2>/dev/null)" = "$$" ]; then
    rm -rf "$GATE_LOCK_DIR"
  fi
  return 0
}

# Deterministic, host-side quality gates re-run on a CLEAN checkout — we do NOT
# trust the agent's self-assessment. Sets GATE_FAIL to the failing gate name.
# These catch exactly the failures that slipped through before: a broken
# tsconfig/type error (type-check, build) and ACs that don't really work (the
# agent's per-issue Playwright suite, run independently here).
run_host_gates() {
  local app_dir=$1
  GATE_FAIL=""
  if ! command -v bun >/dev/null 2>&1 || ! command -v supabase >/dev/null 2>&1; then
    echo "  ⚠ bun/supabase not on host — cannot run automated gates."
    GATE_FAIL="missing-tooling"; return 1
  fi
  pushd "$app_dir" >/dev/null

  pkill -f "vite" >/dev/null 2>&1 || true

  # Static guard: the agent runs in a container under /home/agent, and sometimes
  # bakes that absolute path into a source/test import. It resolves in the
  # container but not here on the host, so it would only blow up later as a
  # cryptic "Cannot find module". Catch it instantly and point at the offender.
  echo "  ⚙ [gate] no container-absolute paths"
  if grep -rIn "/home/agent" src e2e >/tmp/gate-paths.log 2>/dev/null; then
    GATE_FAIL="container-absolute path in source"
    echo "    ── offending lines (use relative or @-alias imports) ──"; cat /tmp/gate-paths.log
    popd >/dev/null; return 1
  fi

  echo "  ⚙ [gate] bun install"
  bun install >/tmp/gate-install.log 2>&1 || { GATE_FAIL="bun install"; popd >/dev/null; return 1; }

  # From here on we touch the shared local stack — serialize against sibling gates.
  acquire_gate_lock
  echo "  ⚙ [gate] supabase db reset (migrations + seed)"
  supabase start >/dev/null 2>&1 || true
  supabase db reset >/tmp/gate-dbreset.log 2>&1 || { GATE_FAIL="supabase db reset"; tail -15 /tmp/gate-dbreset.log; release_gate_lock; popd >/dev/null; return 1; }

  # Point the app at the real local stack with the REAL anon key.
  local url key
  url=$(supabase status -o json 2>/dev/null | sed -n 's/.*"API_URL": *"\([^"]*\)".*/\1/p')
  key=$(supabase status -o json 2>/dev/null | sed -n 's/.*"ANON_KEY": *"\([^"]*\)".*/\1/p')
  if [ -n "$url" ] && [ -n "$key" ]; then
    printf 'VITE_SUPABASE_URL=%s\nVITE_SUPABASE_ANON_KEY=%s\n' "$url" "$key" > .env.local
  fi

  local g
  for g in type-check build test; do
    echo "  ⚙ [gate] bun run $g"
    if ! bun run "$g" >"/tmp/gate-$g.log" 2>&1; then
      GATE_FAIL="bun run $g"; echo "    ── $g output (tail) ──"; tail -25 "/tmp/gate-$g.log"
      release_gate_lock; popd >/dev/null; return 1
    fi
  done

  # --workers=1: these AC specs share the one database with no per-test
  # isolation, and several mutate global rows / depend on ordering (e.g. an
  # `on delete set null` FK nulling a seeded payment, month fixtures, template
  # CRUD). Playwright's default parallel workers race each other on that shared
  # DB. Force serial execution so a ticket's suite is deterministic.
  echo "  ⚙ [gate] playwright AC suite (bunx playwright test --workers=1)"
  bunx playwright install chromium >/dev/null 2>&1 || true
  if ! bunx playwright test --workers=1 >/tmp/gate-pw.log 2>&1; then
    GATE_FAIL="playwright AC suite"; echo "    ── playwright output (tail) ──"; tail -30 /tmp/gate-pw.log
    pkill -f "vite" >/dev/null 2>&1 || true; release_gate_lock; popd >/dev/null; return 1
  fi
  pkill -f "vite" >/dev/null 2>&1 || true
  release_gate_lock; popd >/dev/null
  return 0
}

# Independent verifier AGENT (separate from the author). A fresh model reads the
# issue's acceptance criteria and the agent's e2e tests, judges whether each
# criterion is GENUINELY exercised (not just a render/smoke check), runs the
# suite, and emits a strict "VERDICT: PASS|FAIL". Sets VERIFIER_VERDICT.
run_verifier_agent() {
  VERIFIER_VERDICT="FAIL"
  if [ "$VERIFIER" != "1" ]; then
    echo "  ⓘ Verifier agent disabled (VERIFIER=0) — relying on deterministic gates only."
    VERIFIER_VERDICT="SKIPPED"; return 0
  fi
  local vprompt vcontainer vlog
  vprompt=$(mktemp); vlog=$(mktemp)
  cat > "$vprompt" <<VPROMPT
You are an INDEPENDENT VERIFIER running non-interactively. Do NOT implement features, do NOT modify code, do NOT commit or push. Your only job is to judge whether the work for issue ${ISSUE} GENUINELY satisfies its acceptance criteria.

1. supabase start, then supabase db reset (load migrations + seed).
2. gh issue view ${ISSUE} --repo ${REPO} — read the "## Acceptance criteria" checklist.
3. Read the e2e tests (especially e2e/issue-${ISSUE}-ac.spec.ts). For EACH acceptance criterion, decide whether a test GENUINELY exercises that behavior against real seeded data — clicking/submitting/navigating and asserting the real outcome. A test that only loads the page and checks the shell/topbar/sidebar render does NOT satisfy any criterion.
4. Run, and require all to pass: bun run type-check ; bun run build ; bun run test ; bunx playwright test --workers=1 (serial: the AC specs share one database with no per-test isolation, so parallel workers race each other).
5. A criterion FAILS verification if it has no genuine test, its test is a render/smoke-only check, or any gate fails.
6. Output a markdown table (criterion | genuinely tested? | notes), then as the VERY LAST LINE output exactly one of:
   VERDICT: PASS
   VERDICT: FAIL
VPROMPT

  echo "  🔎 Independent verifier agent (${VERIFIER_MODEL})..."
  vcontainer="budget-verify-t${ISSUE}-${TIMESTAMP}"
  docker rm -f "$vcontainer" >/dev/null 2>&1 || true
  set +e
  docker run -d --name "$vcontainer" \
    --network host \
    -e ANTHROPIC_API_KEY -e CLAUDE_CODE_OAUTH_TOKEN -e GH_TOKEN \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v "$HOME/.claude:${AGENT_HOME}/.claude" \
    -v "$HOME/.claude.json:${AGENT_HOME}/.claude.json" \
    -v "$HOME/.config/gh:${AGENT_HOME}/.config/gh" \
    -v "${WORK_DIR}:${AGENT_HOME}/project" \
    -v "${vprompt}:/tmp/vprompt.txt:ro" \
    budget-agent \
    bash -c "gh auth setup-git >/dev/null 2>&1 || true; cd ${AGENT_HOME}/project && git checkout feat/${BRANCH} 2>/dev/null; claude --model ${VERIFIER_MODEL} -p \"\$(cat /tmp/vprompt.txt)\" --dangerously-skip-permissions" \
    >/dev/null
  echo "  (headless verifier is silent until it finishes — heartbeat below confirms it's alive)"
  local v_start; v_start=$(date +%s)
  # Single reader loop (see run-attempt loop for the read -t / bash-3.2 EOF
  # rationale): log lines print on their own line; the heartbeat ticks IN PLACE
  # between them, and a still-running container distinguishes a timeout from EOF.
  local hb_live=0 line rc
  : > "$vlog"
  while :; do
    IFS= read -r -t 10 line; rc=$?
    if [ $rc -eq 0 ]; then
      [ "$hb_live" = 1 ] && printf '\n'
      hb_live=0
      # Terminal gets the elapsed prefix; $vlog gets the RAW line so the
      # `^[[:space:]]*VERDICT:` grep below can anchor at line start.
      printf '  [%s] %s\n' "$(elapsed_since "$v_start")" "$line"
      printf '%s\n' "$line" >> "$vlog"
    elif [ "$(docker inspect -f '{{.State.Running}}' "$vcontainer" 2>/dev/null)" = "true" ]; then
      printf '\r  ⏱  verifier still running — elapsed %s' "$(elapsed_since "$v_start")"
      hb_live=1
    else
      break
    fi
  done < <(docker logs -f "$vcontainer" 2>&1)
  [ "$hb_live" = 1 ] && printf '\n'
  docker wait "$vcontainer" >/dev/null 2>&1
  docker rm -f "$vcontainer" >/dev/null 2>&1 || true
  set -e

  if grep -qiE '^[[:space:]]*VERDICT:[[:space:]]*PASS' "$vlog"; then
    VERIFIER_VERDICT="PASS"
  else
    VERIFIER_VERDICT="FAIL"
  fi
  rm -f "$vprompt" "$vlog"
}

# Orchestrator: deterministic gates + independent verifier, then auto-close on
# all-green. No human in the loop by default (that was the point of the script).
# MANUAL=1 restores the old per-criterion [y/n] sign-off instead.
verify_and_close() {
  local app_dir=$1
  if ! command -v gh >/dev/null 2>&1; then
    echo "  ⚠ gh CLI not found on host — verify and close #${ISSUE} manually."
    return
  fi
  if [ "$MANUAL" = "1" ]; then
    manual_sign_off; return
  fi

  echo ""; print_divider
  echo "  AUTOMATED VERIFICATION — issue #${ISSUE}"
  print_divider

  if ! run_host_gates "$app_dir"; then
    echo ""; print_divider
    echo "  ✘ GATE FAILED: ${GATE_FAIL} — issue #${ISSUE} left OPEN."
    echo "  The agent's claim of success was not trusted, and the gate disproved it."
    echo "  Fix the code and re-run. (Gate logs: /tmp/gate-*.log)"
    print_divider
    return
  fi
  echo "  ✔ All deterministic gates passed (type-check, build, test, playwright)."

  run_verifier_agent
  if [ "$VERIFIER_VERDICT" = "FAIL" ]; then
    echo ""; print_divider
    echo "  ✘ Independent verifier returned VERDICT: FAIL — issue #${ISSUE} left OPEN."
    echo "  Gates were green but the verifier judged the AC coverage insufficient."
    print_divider
    return
  fi

  local body_file; body_file=$(mktemp)
  gh issue view "$ISSUE" --repo "$REPO" --json body -q .body > "$body_file" 2>/dev/null || true
  echo ""; print_divider
  echo "  ✔ Gates green + verifier ${VERIFIER_VERDICT}. Auto-closing issue #${ISSUE}..."
  close_issue "$body_file"
  print_divider
  rm -f "$body_file"

  print_run_locally "$app_dir"
}

# Print the routes THIS branch added, as clickable localhost URLs. Pulled from
# the diff of React Router <Route path="..."> defs against main, so it works for
# any ticket without hardcoding. The seeded month fills :yearMonth; any other
# :param is flagged since we can't know its value. Lets you reach a feature even
# when the ticket shipped the route but no sidebar/tab link to it.
print_new_routes() {
  local app_dir=$1
  command -v git >/dev/null 2>&1 || return 0
  local base
  base=$(git -C "$app_dir" rev-parse --verify -q origin/main 2>/dev/null) \
    || base=$(git -C "$app_dir" rev-parse --verify -q main 2>/dev/null) \
    || return 0

  local routes
  routes=$(git -C "$app_dir" diff "${base}...HEAD" -- src 2>/dev/null \
    | grep -E '^\+' \
    | grep -oE 'path="[^"]+"' \
    | sed -E 's/^path="//; s/"$//' \
    | grep -v '^/$' \
    | sort -u)

  if [ -z "$routes" ]; then
    echo "      (this branch added no new routes — navigate normally)"
    return 0
  fi
  local r path
  while IFS= read -r r; do
    path="${r//:yearMonth/2026-5}"
    if printf '%s' "$path" | grep -q ':'; then
      echo "      http://localhost:5173${path}   (replace :params with real ids)"
    else
      echo "      http://localhost:5173${path}"
    fi
  done <<EOF
$routes
EOF
}

# Detailed, copy-pasteable steps to run the verified branch by hand. Printed only
# after a PASS verdict, so you always know how to manually test what just shipped.
print_run_locally() {
  local app_dir=$1
  echo ""
  print_divider
  echo "  ▶ RUN IT YOURSELF — manually test feat/${BRANCH} (issue #${ISSUE})"
  print_divider
  echo "    cd ${app_dir}"
  cat <<'RUNHELP'

    supabase start          # boot local Postgres/Auth (no-op if already up)
    supabase db reset       # apply migrations + seed (incl. the dev auto-login user)

    # write .env.local with the REAL local anon key:
    URL=$(supabase status -o json | sed -n 's/.*"API_URL": *"\([^"]*\)".*/\1/p')
    KEY=$(supabase status -o json | sed -n 's/.*"ANON_KEY": *"\([^"]*\)".*/\1/p')
    printf 'VITE_SUPABASE_URL=%s\nVITE_SUPABASE_ANON_KEY=%s\n' "$URL" "$KEY" > .env.local

    bun install
    bun run dev             # open the printed localhost URL
RUNHELP
  echo ""
  echo "    No login screen — the seeded dev user is auto-signed-in, so seed data is visible."
  echo "    Stop with Ctrl-C; run 'supabase stop' to shut the local stack down."
  echo ""
  echo "    NOTE: a ticket can add a route without a sidebar/tab link to reach it"
  echo "    (the gates navigate by URL, so they pass regardless). If you don't see"
  echo "    this feature in the UI, open the route(s) this branch added directly:"
  print_new_routes "$app_dir"
  print_divider
}

write_base_prompt() {
  cat <<'STATICPROMPT'
You are implementing a ticket for the FamilyBudget app. You are running NON-INTERACTIVELY inside a Docker container. Do NOT ask for approval, confirmation, or permission at any point. Just execute.

WORKFLOW:

1. Start the local Supabase instance and LOAD THE SEED:
   - `supabase start` in the project root, then `supabase db reset` so migrations AND supabase/seed.sql are applied. `supabase start` alone does NOT reliably load the seed; `db reset` does.
   - Note the API URL and anon key from `supabase status`.
2. The seed creates a DEV USER and the app auto-signs-in as it in dev mode (src/lib/devAuth.ts). This is what makes RLS-gated data visible locally. If seed data does NOT appear in the running app, that is a BUG to fix — do not work around it.
3. Read the issue thoroughly: gh issue view ISSUE_NUM --repo REPO_NAME
4. Read CLAUDE.md for project conventions
5. Read the PRD for full context: gh issue view 1 --repo REPO_NAME
6. Create and switch to branch: git checkout -b feat/BRANCH_NAME
7. Read the "Acceptance criteria" section of the issue carefully. Every checkbox is a requirement you MUST implement. Do not skip any.
8. Implement each acceptance criterion one by one using /tdd (red-green-refactor loop)
9. Put the API URL and anon key from step 1 in .env.local (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). Use the REAL anon key printed by `supabase status` — never hand-craft or invent a JWT.

   ─── QUALITY GATES — ALL must pass before you commit. These are hard gates. ───
10. `bun run type-check` MUST exit 0. Fix every type error. Do NOT silence errors by weakening tsconfig. (A prop-name mismatch is a type error — these gates exist to catch exactly that.)
11. `bun run build` MUST exit 0.
12. `bun run test` MUST pass.
13. DYNAMIC, AC-DRIVEN PLAYWRIGHT VERIFICATION — the tests you write depend ENTIRELY on THIS issue's acceptance criteria:
    - Add the dependency: `bun add -d @playwright/test`. Chromium is pre-installed; do NOT run `playwright install`.
    - Create e2e/issue-ISSUE_NUM-ac.spec.ts. For EACH checkbox in the issue's "## Acceptance criteria", write at least one Playwright test, named after that criterion, that EXERCISES it against the running app with real seeded data — e.g. click the thing, assert the resulting navigation/highlight/value; open the form, submit it, assert the new row appears; toggle the control, assert the state change; assert the SEEDED data is actually visible.
    - A generic smoke test that only loads the page and checks that the shell/topbar/sidebar render is NOT acceptable and does NOT satisfy any acceptance criterion. Derive the tests from the issue text every time; they will differ per issue.
    - Run: `bunx playwright test --workers=1` (serial — the AC specs share one database with no per-test isolation, so Playwright's default parallel workers race each other on it and flake). All AC tests MUST pass. If they fail, fix the CODE (not the tests) until the criteria genuinely pass — EXCEPT when a pre-existing spec from ANOTHER issue fails only because YOUR new UI legitimately changed the page (e.g. a loose `getByText(...)` now matching multiple elements due to a feature you added); there, tighten that test's locator to a `data-testid` rather than reverting correct product behavior.
    - Kill the dev server afterward (`pkill -f vite`). Do NOT leave any background process running.
14. Commit and push:
    - `git add -A && git commit -m "your message"`
    - `git push -u origin feat/BRANCH_NAME`
    - The work is LOST if you don't push. This is non-negotiable.
15. Run `supabase stop` to shut down the local instance

QUALITY BAR:
- A bare Vite scaffold is NOT sufficient. You must implement ALL acceptance criteria from the issue.
- The app must actually render correctly in the browser with REAL DATA — not "Loading...", not "No data yet" when seed data exists, not unstyled text.
- "It renders without console errors" is NOT proof an acceptance criterion is met. Each criterion needs a test that demonstrates the actual behavior the criterion describes.
- type-check, build, test, and the AC Playwright suite must all be green on a clean checkout — an independent verifier re-runs them after you push and will reopen the ticket if any fail.

CRITICAL RULES:
- NEVER hardcode absolute filesystem paths (e.g. /home/agent/project/...) in source or tests. Such paths exist only inside THIS container; the independent verifier and the gates run on a DIFFERENT host where they do not resolve, so the test will fail with "Cannot find module". Use RELATIVE imports (e.g. "../src/budget-engine/index.ts") or the "@" alias instead.
- You are running non-interactively. Do NOT ask for approval, confirmation, or permission. Just execute.
- Do NOT propose a commit message and wait — run the git commit command directly.
- Do NOT stop after committing — you MUST push immediately after.
- Your job is not done until `git push` has completed successfully.

ERROR HANDLING:
- If a command fails, read the error output, diagnose the root cause, and retry (up to 3 attempts per command)
- If `supabase start` fails, check Docker is accessible via the socket, check for port conflicts, and retry
- If tests fail, read the failure output, fix the code, and re-run
- Do NOT give up on the first error — investigate and fix before moving on
- Only stop if a problem is clearly unfixable (missing credentials, wrong architecture, etc.)
STATICPROMPT
}

write_prompt() {
  local prompt_text
  prompt_text=$(write_base_prompt)
  prompt_text="${prompt_text//ISSUE_NUM/$ISSUE}"
  prompt_text="${prompt_text//REPO_NAME/$REPO}"
  prompt_text="${prompt_text//BRANCH_NAME/$BRANCH}"

  if [ "$ATTEMPT" -eq 1 ]; then
    cat <<EOF
${prompt_text}

Branch: feat/${BRANCH}
Issue: #${ISSUE}
EOF
  else
    local tail_output
    tail_output=$(tail -80 "$ATTEMPT_LOG")
    cat <<EOF
RETRY ATTEMPT ${ATTEMPT}/${MAX_RETRIES}

The previous run failed. Here is the tail of the output:

---
${tail_output}
---

Diagnose what went wrong from the output above. Fix the issue and continue implementing the ticket. Do NOT start over from scratch — check what was already done (git log, existing files) and pick up where it left off.

Original task:
${prompt_text}

Branch: feat/${BRANCH}
Issue: #${ISSUE}
EOF
  fi
}

ATTEMPT=0
RUN_START=$(date +%s)

echo ""
print_divider
echo "  TICKET #${ISSUE} — feat/${BRANCH}"
echo "  Model: ${MODEL_ID} | Effort: ${EFFORT:-default} | Max retries: ${MAX_RETRIES}"
echo "  Started: $(date '+%Y-%m-%d %H:%M:%S')"
print_divider
echo ""

while [ $ATTEMPT -lt $MAX_RETRIES ]; do
  ATTEMPT=$((ATTEMPT + 1))
  ATTEMPT_START=$(date +%s)

  write_prompt > "$PROMPT_FILE"

  print_divider
  echo "  ▶ ATTEMPT ${ATTEMPT}/${MAX_RETRIES}  —  $(date '+%H:%M:%S')"
  print_divider
  echo ""

  > "$ATTEMPT_LOG"

  # Run DETACHED with a name. Streaming the container's stdout via a pipe used to
  # hang: a dev server the agent left running held the pipe open, so the script
  # never saw the run finish. Detached mode ties completion to the container's
  # lifecycle (PID 1) instead — Docker reaps stray children on stop.
  CONTAINER="budget-agent-t${ISSUE}-${TIMESTAMP}-a${ATTEMPT}"
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true

  set +e
  docker run -d --name "$CONTAINER" \
    --network host \
    -e ANTHROPIC_API_KEY \
    -e CLAUDE_CODE_OAUTH_TOKEN \
    -e GH_TOKEN \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v $HOME/.claude:${AGENT_HOME}/.claude \
    -v $HOME/.claude.json:${AGENT_HOME}/.claude.json \
    -v $HOME/.config/gh:${AGENT_HOME}/.config/gh \
    -v ${WORK_DIR}:${AGENT_HOME}/project \
    -v ${PROMPT_FILE}:/tmp/prompt.txt:ro \
    budget-agent \
    bash -c "gh auth setup-git >/dev/null 2>&1 || true; cd ${AGENT_HOME}/project && { [ -d .git ] || git clone https://github.com/${REPO}.git .; } && claude --model ${MODEL_ID} ${EFFORT_FLAG} -p \"\$(cat /tmp/prompt.txt)\" --dangerously-skip-permissions" \
    >/dev/null
  RUN_RC=$?

  if [ $RUN_RC -ne 0 ]; then
    echo "  ⚠ docker run failed to start (rc ${RUN_RC})."
    EXIT_CODE=$RUN_RC
  else
    # Single reader loop so log lines and the heartbeat never race for the
    # terminal. macOS ships bash 3.2, where `read -t` returns rc 1 for BOTH a
    # timeout and real EOF — indistinguishable by status. So on any non-zero
    # read we ask Docker: still running means it was a timeout (no new log →
    # tick the elapsed counter IN PLACE with \r); stopped means the stream hit
    # EOF and drained, so we're done.
    HEARTBEAT_LIVE=0
    while :; do
      IFS= read -r -t 10 line; rc=$?
      if [ $rc -eq 0 ]; then
        # A real log line arrived — close any in-place heartbeat with a newline,
        # then print + persist the prefixed line.
        [ "$HEARTBEAT_LIVE" = 1 ] && printf '\n'
        HEARTBEAT_LIVE=0
        prefixed="[$(elapsed_since "$ATTEMPT_START")] $line"
        printf '%s\n' "$prefixed"
        printf '%s\n' "$prefixed" >> "$ATTEMPT_LOG"
      elif [ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null)" = "true" ]; then
        # Timed out with no new log — tick the same line, just bumping the time.
        printf '\r  ⏱  still running — elapsed %s' "$(elapsed_since "$ATTEMPT_START")"
        HEARTBEAT_LIVE=1
      else
        break   # container stopped → stream is at EOF
      fi
    done < <(docker logs -f "$CONTAINER" 2>&1)
    # Terminate a dangling in-place heartbeat so later output starts on a fresh line.
    [ "$HEARTBEAT_LIVE" = 1 ] && printf '\n'

    EXIT_CODE=$(docker wait "$CONTAINER" 2>/dev/null || echo 1)
  fi
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  set -e

  echo ""
  print_divider
  if [ $EXIT_CODE -eq 0 ]; then
    echo "  ✔ ATTEMPT ${ATTEMPT} SUCCEEDED  —  elapsed: $(elapsed_since $ATTEMPT_START)  —  total: $(elapsed_since $RUN_START)"
    print_divider

    # Commit and push only on success
    if [ -d "${WORK_DIR}/.git" ]; then
      pushd "${WORK_DIR}" > /dev/null
      git checkout -B "feat/${BRANCH}" 2>/dev/null || true
      if [ -n "$(git status --porcelain)" ]; then
        echo "  ⚙ Agent left uncommitted changes — committing from host..."
        git add -A
        git commit -m "feat(${BRANCH}): implement ticket #${ISSUE}" 2>&1 || true
      fi
      # The workspace clone's origin is HTTPS (no host credentials), so push via
      # the HOST repo's remote URL, which has working creds. The agent normally
      # pushes itself now (GH_TOKEN); this is the backstop. Surface failures.
      HOST_ORIGIN=$(git -C "${SCRIPT_DIR}" remote get-url origin 2>/dev/null || echo "origin")
      echo "  ⚙ Ensuring feat/${BRANCH} is pushed (via ${HOST_ORIGIN})..."
      if git push "${HOST_ORIGIN}" "feat/${BRANCH}:refs/heads/feat/${BRANCH}" --force-with-lease 2>&1; then
        echo "  ✔ feat/${BRANCH} is on origin."
      else
        echo "  ⚠ Push failed — work is committed in ${WORK_DIR}; push it manually."
      fi
      popd > /dev/null
    fi

    # Find the directory containing package.json (the app may live in a subdir)
    APP_DIR=$(find "${WORK_DIR}" -maxdepth 2 -name package.json -not -path "*/node_modules/*" | head -1 | xargs dirname 2>/dev/null)
    APP_DIR=${APP_DIR:-${WORK_DIR}}

    echo ""
    echo "  To run locally:"
    echo "    cd ${WORK_DIR}"
    echo "    supabase start"
    echo "    cd ${APP_DIR} && bun install && bun run dev"
    echo ""
    echo "  Merge feat/${BRANCH} into main when ready."
    print_divider

    verify_and_close "$APP_DIR"

    exit 0
  fi

  echo "  ✘ ATTEMPT ${ATTEMPT} FAILED (exit ${EXIT_CODE})  —  elapsed: $(elapsed_since $ATTEMPT_START)  —  total: $(elapsed_since $RUN_START)"
  print_divider

  cat "$ATTEMPT_LOG" >> "$LOG_FILE"
  echo "" >> "$LOG_FILE"

  if [ $ATTEMPT -lt $MAX_RETRIES ]; then
    echo ""
    echo "  Retrying..."
    echo ""
  fi
done

echo ""
print_divider
echo "  ✘ ALL ${MAX_RETRIES} ATTEMPTS FAILED  —  total: $(elapsed_since $RUN_START)"
echo "  Logs: ${LOG_FILE}"
echo ""
echo "  To continue locally:"
echo "    cd ${WORK_DIR}"
echo "    claude --model ${MODEL_ID} --resume"
print_divider
exit 1
