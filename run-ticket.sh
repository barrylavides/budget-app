#!/bin/bash
set -euo pipefail

ISSUE=$1
BRANCH=$2
MODEL_SHORT=${3:-sonnet}
EFFORT=${4:-}
REPO="barrylavides/budget-app"
MAX_RETRIES=3

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

PROMPT_BASE="$(cat <<PROMPT
You are implementing a ticket for the FamilyBudget app.

1. Run \`supabase start\` in the project root to start the local Supabase instance
2. Note the anon key and API URL from the output
3. Read the issue: gh issue view ${ISSUE} --repo ${REPO}
4. Read CLAUDE.md for project conventions
5. Read the PRD: gh issue view 1 --repo ${REPO}
6. Create and switch to branch: feat/${BRANCH}
7. Implement using /tdd (red-green-refactor loop)
8. Use the API URL and anon key from step 2 for Supabase connections
9. Run all tests: bun run test
10. Commit and push when all tests pass
11. Run \`supabase stop\` to shut down the local instance

Branch: feat/${BRANCH}
Issue: #${ISSUE}

ERROR HANDLING:
- If a command fails, read the error output, diagnose the root cause, and retry (up to 3 attempts per command)
- If \`supabase start\` fails, check Docker is accessible via the socket, check for port conflicts, and retry
- If tests fail, read the failure output, fix the code, and re-run
- Do NOT give up on the first error — investigate and fix before moving on
- Only stop if a problem is clearly unfixable (missing credentials, wrong architecture, etc.)
PROMPT
)"

ATTEMPT=0
LAST_OUTPUT=""

while [ $ATTEMPT -lt $MAX_RETRIES ]; do
  ATTEMPT=$((ATTEMPT + 1))

  if [ $ATTEMPT -eq 1 ]; then
    FULL_PROMPT="$PROMPT_BASE"
  else
    TAIL_OUTPUT=$(echo "$LAST_OUTPUT" | tail -80)
    FULL_PROMPT="$(cat <<RETRY
RETRY ATTEMPT ${ATTEMPT}/${MAX_RETRIES}

The previous run failed. Here is the tail of the output:

---
${TAIL_OUTPUT}
---

Diagnose what went wrong from the output above. Fix the issue and continue implementing the ticket. Do NOT start over from scratch — check what was already done (git log, existing files) and pick up where it left off.

Original task:
${PROMPT_BASE}
RETRY
)"
  fi

  echo "=== Ticket #${ISSUE} | branch: feat/${BRANCH} | model: ${MODEL_ID} | effort: ${EFFORT:-global default} | attempt: ${ATTEMPT}/${MAX_RETRIES} ==="

  set +e
  LAST_OUTPUT=$(docker run --rm -i \
    --network host \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v $HOME/.claude:/root/.claude \
    -v $HOME/.config/gh:/root/.config/gh \
    budget-agent \
    bash -c "git clone https://github.com/${REPO}.git . && claude --model ${MODEL_ID} ${EFFORT_FLAG} -p \"${FULL_PROMPT}\" --dangerously-skip-permissions" 2>&1)
  EXIT_CODE=$?
  set -e

  echo "$LAST_OUTPUT"

  if [ $EXIT_CODE -eq 0 ]; then
    echo "=== Done. Merge feat/${BRANCH} into main when ready. ==="
    exit 0
  fi

  if [ $ATTEMPT -lt $MAX_RETRIES ]; then
    echo "=== Attempt ${ATTEMPT} failed (exit code ${EXIT_CODE}). Retrying... ==="
  fi
done

echo "=== All ${MAX_RETRIES} attempts failed for ticket #${ISSUE}. Review the output above. ==="
exit 1
