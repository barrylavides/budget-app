#!/bin/bash
set -euo pipefail

ISSUE=$1
BRANCH=$2
MODEL_SHORT=${3:-sonnet}
EFFORT=${4:-}
REPO="barrylavides/budget-app"
MAX_RETRIES=3
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
  opus)   MODEL_ID="claude-opus-4-6" ;;
  *)      MODEL_ID="$MODEL_SHORT" ;;
esac

EFFORT_FLAG=""
if [ -n "$EFFORT" ]; then
  EFFORT_FLAG="--effort ${EFFORT}"
fi

AGENT_HOME="/home/agent"

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

# Background ticker — keeps the elapsed timer moving during idle stretches
# (e.g. while the agent is thinking and producing no output).
heartbeat() {
  local start=$1
  while true; do
    sleep 10
    printf '  ⏱  still running — elapsed %s\n' "$(elapsed_since "$start")"
  done
}

write_base_prompt() {
  cat <<'STATICPROMPT'
You are implementing a ticket for the FamilyBudget app. You are running NON-INTERACTIVELY inside a Docker container. Do NOT ask for approval, confirmation, or permission at any point. Just execute.

WORKFLOW:

1. Run `supabase start` in the project root to start the local Supabase instance
2. Note the anon key and API URL from the output — you will need these
3. Read the issue thoroughly: gh issue view ISSUE_NUM --repo REPO_NAME
4. Read CLAUDE.md for project conventions
5. Read the PRD for full context: gh issue view 1 --repo REPO_NAME
6. Create and switch to branch: git checkout -b feat/BRANCH_NAME
7. Read the "Acceptance criteria" section of the issue carefully. Every checkbox is a requirement you MUST implement. Do not skip any.
8. Implement each acceptance criterion one by one using /tdd (red-green-refactor loop)
9. Use the API URL and anon key from step 2 for Supabase connections in .env.local
10. After implementing everything, run the full test suite: bun run test
11. VERIFY THE APP RUNS: Start the dev server (`bun run dev &`), then use Playwright to verify the app renders without errors:
    - Chromium is pre-installed in the container. Just add the dependency: `bun add -d @playwright/test`
    - Do NOT run `playwright install` — browsers are already available at the system level.
    - Write a smoke test that loads the app, checks for no console errors, and verifies key elements render (topbar, sidebar, content area)
    - Run: `bunx playwright test`
    - Kill the dev server after tests pass
    - If Playwright tests fail, fix the code until they pass. Import path errors, missing modules, and rendering failures must be fixed.
12. SELF-CHECK: Go back to the issue's acceptance criteria and verify EACH one is met. If any are not, implement them before proceeding.
13. Commit and push:
    - `git add -A && git commit -m "your message"`
    - `git push -u origin feat/BRANCH_NAME`
    - The work is LOST if you don't push. This is non-negotiable.
14. Run `supabase stop` to shut down the local instance

QUALITY BAR:
- A bare Vite scaffold is NOT sufficient. You must implement ALL acceptance criteria from the issue.
- If the issue says "Tailwind config extends theme with palette X" — configure those exact colors.
- If the issue says "app shell renders topbar, sidebar, content area" — build those components with proper styling.
- If the issue says "React Router wired with placeholder routes" — set up those exact routes.
- If the issue says "seed script inserts test data" — write and run that seed script.
- If the issue says "pure functions with unit tests" — write both the functions AND the tests.
- The app must actually render correctly in the browser, not show "Loading..." or unstyled text.

CRITICAL RULES:
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

  # Start the idle ticker, then stream docker output with a live elapsed-time
  # prefix on every line. Heartbeat is killed as soon as the run returns.
  heartbeat "$ATTEMPT_START" &
  HEARTBEAT_PID=$!

  set +e
  docker run --rm \
    --network host \
    -e ANTHROPIC_API_KEY \
    -e CLAUDE_CODE_OAUTH_TOKEN \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v $HOME/.claude:${AGENT_HOME}/.claude \
    -v $HOME/.claude.json:${AGENT_HOME}/.claude.json \
    -v $HOME/.config/gh:${AGENT_HOME}/.config/gh \
    -v ${WORK_DIR}:${AGENT_HOME}/project \
    -v ${PROMPT_FILE}:/tmp/prompt.txt:ro \
    budget-agent \
    bash -c "cd ${AGENT_HOME}/project && { [ -d .git ] || git clone https://github.com/${REPO}.git .; } && claude --model ${MODEL_ID} ${EFFORT_FLAG} -p \"\$(cat /tmp/prompt.txt)\" --dangerously-skip-permissions" < /dev/null 2>&1 \
    | while IFS= read -r line; do
        printf '[%s] %s\n' "$(elapsed_since "$ATTEMPT_START")" "$line"
      done \
    | tee "$ATTEMPT_LOG"
  EXIT_CODE=${PIPESTATUS[0]}
  set -e

  kill "$HEARTBEAT_PID" 2>/dev/null
  wait "$HEARTBEAT_PID" 2>/dev/null

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
      echo "  ⚙ Pushing feat/${BRANCH} to origin..."
      # Each run is a fresh full reimplementation on a dedicated feature branch,
      # so force-with-lease over any stale remote branch from a prior run.
      git push -u origin "feat/${BRANCH}" --force-with-lease 2>&1 || true
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
