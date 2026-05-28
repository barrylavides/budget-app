#!/bin/bash
set -euo pipefail

ISSUE=$1
BRANCH=$2
MODEL_SHORT=${3:-sonnet}
REPO="barrylavides/budget-app"

case "$MODEL_SHORT" in
  haiku)  MODEL_ID="claude-haiku-4-5-20251001" ;;
  sonnet) MODEL_ID="claude-sonnet-4-6" ;;
  opus)   MODEL_ID="claude-opus-4-6" ;;
  *)      MODEL_ID="$MODEL_SHORT" ;;
esac

echo "=== Ticket #${ISSUE} | branch: feat/${BRANCH} | model: ${MODEL_ID} ==="
docker run --rm -it \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v $HOME/.claude:/root/.claude \
  -v $HOME/.config/gh:/root/.config/gh \
  budget-agent \
  bash -c "git clone https://github.com/${REPO}.git . && claude --model ${MODEL_ID} -p \"$(cat <<PROMPT
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
PROMPT
)\" --dangerously-skip-permissions"

echo "=== Done. Merge feat/${BRANCH} into main when ready. ==="
