# FamilyBudget — Development Workflow

## Table of Contents

- [Prerequisites](#prerequisites)
- [Ticket Execution Order](#ticket-execution-order)
- [Infrastructure Model](#infrastructure-model)
- [Agent Docker Setup](#agent-docker-setup)
- [Convenience Script](#convenience-script)
- [Running Agents — Sequential Tickets](#running-agents--sequential-tickets)
- [Running Agents — Parallel Tickets](#running-agents--parallel-tickets)
- [Merging Parallel Branches](#merging-parallel-branches)
- [Quick Reference](#quick-reference)

---

## Prerequisites

Before starting any tickets:

1. **Docker Desktop** — required for all containers (agents + Supabase)
2. **Claude Code** — installed and authenticated
3. **TDD skill** — install to `~/.claude/skills/tdd/`
4. **CLAUDE.md** — run `/init` in the project root to generate

No Supabase CLI on the host — it runs inside a Docker container with the Docker socket mounted.

---

## Ticket Execution Order

```
Phase 1 — Foundation (sequential, one at a time)
  #2  Project scaffold + local Supabase + schema    [HITL] [sonnet]
  #3  Month sidebar + create month                          [haiku]
  #4  Sources panel with balance tracking                   [haiku]
  #5  Expenses + category views                             [haiku]

Phase 2 — Features (parallel — 3 agents simultaneously)
  #6  Half views + overview dashboard               [feat/half-views]  [sonnet]
  #7  Payments + status tracking                    [feat/payments]    [sonnet]
  #8  Recurring expense templates                   [feat/recurring]   [haiku]

Phase 3 — Finish (sequential)
  #9  Statistics view                               [after #7 merges]  [haiku]
  #10 Polish + general UX                           [after #6-#9]      [sonnet]
  #11 Auth + Cloud Supabase + Vercel deploy         [HITL]             [sonnet]
```

**Model key:**
- `[sonnet]` = `claude-sonnet-4-6` — complex scaffolding, multi-component features, cross-cutting changes, infra/auth
- `[haiku]` = `claude-haiku-4-5-20251001` — single-feature CRUD where patterns are already established by earlier tickets

---

## Infrastructure Model

Every ticket gets a fresh, isolated environment: one agent container that starts its own Supabase instance. The agent container has the Supabase CLI installed and mounts `/var/run/docker.sock`, so it can spin up Supabase service containers as siblings on the host Docker daemon. After the ticket is done and pushed, everything is torn down. The next ticket starts clean.

### Per ticket (sequential)

```
┌──────────────────────────────────────────────┐
│  Docker Desktop                              │
│                                              │
│  ┌─────────────────┐  ┌──────────────────┐   │
│  │ supabase-t3     │  │ agent-t3         │   │
│  │ Postgres :54321 │←─│ claude -p        │   │
│  │ API      :54331 │  │ --skip-perms     │   │
│  │ Studio   :54323 │  │                  │   │
│  └─────────────────┘  └──────────────────┘   │
│                                              │
│  Both torn down after ticket merges.         │
│  Fresh pair created for next ticket.         │
└──────────────────────────────────────────────┘
```

### Per ticket (parallel phase)

```
┌────────────────────────────────────────────────────────────────────────┐
│  Docker Desktop                                                        │
│                                                                        │
│  ┌──────────────┐  ┌──────────┐   ┌──────────────┐  ┌──────────┐     │
│  │ supabase-t6  │←─│ agent-t6 │   │ supabase-t7  │←─│ agent-t7 │     │
│  │ :54421/:54431│  │ #6       │   │ :54521/:54531│  │ #7       │     │
│  └──────────────┘  └──────────┘   └──────────────┘  └──────────┘     │
│                                                                        │
│  ┌──────────────┐  ┌──────────┐                                       │
│  │ supabase-t8  │←─│ agent-t8 │   3 pairs running simultaneously.     │
│  │ :54621/:54631│  │ #8       │   All torn down after merge.          │
│  └──────────────┘  └──────────┘                                       │
└────────────────────────────────────────────────────────────────────────┘
```

**Resource usage:**
- Sequential: ~2GB RAM (1 Supabase + 1 agent)
- Parallel: ~6GB RAM (3 Supabase + 3 agents). Requires 16GB+ Mac.

---

## Agent Docker Setup

### Dockerfile

```dockerfile
FROM oven/bun:latest

RUN apt-get update && apt-get install -y \
  git \
  curl \
  docker.io \
  && rm -rf /var/lib/apt/lists/*

# GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
  | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
  | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
  && apt-get update && apt-get install -y gh

# Supabase CLI
RUN ARCH=$(dpkg --print-architecture) && \
  VERSION=$(curl -s https://api.github.com/repos/supabase/cli/releases/latest | grep '"tag_name"' | cut -d'"' -f4 | sed 's/^v//') && \
  curl -fsSL "https://github.com/supabase/cli/releases/latest/download/supabase_${VERSION}_linux_${ARCH}.deb" -o /tmp/supabase.deb && \
  dpkg -i /tmp/supabase.deb && \
  rm /tmp/supabase.deb

# Claude Code (global install + manual postinstall for native binary)
RUN bun install -g @anthropic-ai/claude-code \
  && CLAUDE_PKG=$(find /root -path "*/node_modules/@anthropic-ai/claude-code/install.cjs" 2>/dev/null | head -1) \
  && if [ -n "$CLAUDE_PKG" ]; then bun "$CLAUDE_PKG"; fi

# Non-root user (Claude Code blocks --dangerously-skip-permissions as root)
RUN useradd -m -s /bin/bash agent \
  && usermod -aG docker agent \
  && mkdir -p /home/agent/app \
  && chown agent:agent /home/agent/app

USER agent
WORKDIR /home/agent/app

CMD ["bash"]
```

`docker.io` is needed so the Supabase CLI inside the container can talk to the Docker daemon via the mounted socket.

### Build gotchas

Issues hit during the first build and how they were resolved:

| Problem | Cause | Fix |
|---------|-------|-----|
| `gpg: not found` when installing Supabase CLI via apt repo | `oven/bun` image doesn't include `gpg`, and `deb.supabase.com` doesn't resolve | Install via GitHub release `.deb` instead of apt repo |
| `npm: not found` when installing Claude Code | `oven/bun` image ships bun, not npm | Use `bun install -g` instead of `npm install -g` |
| `claude native binary not installed` | `bun install -g` doesn't run postinstall scripts needed for the platform-native binary | Run `install.cjs` manually after `bun install -g`: find the file and execute with `bun` |
| `failed to connect to postgres: dial tcp 127.0.0.1:54322: connection refused` | Supabase containers publish ports to the Docker VM's network; agent container has its own network namespace | Add `--network host` to `docker run` so agent shares the VM's network |
| `--dangerously-skip-permissions cannot be used with root/sudo privileges` | Container runs as root by default; Claude Code blocks skip-permissions for root | Add non-root `agent` user to Dockerfile with docker group access |
| `mounts denied: /app/supabase/snippets is not shared from the host` | Supabase Studio bind-mounts a container-internal path into a sibling container; Docker Desktop can't see it | Use `supabase start --exclude studio` (agent doesn't need the UI) |
| `Claude configuration file not found at: /root/.claude.json` | `.claude.json` lives at home root, not inside `.claude/`; wasn't being mounted | Mount `$HOME/.claude.json` into the container alongside `$HOME/.claude/` |
| 404 downloading Supabase `.deb` | Release asset filename includes the version number (e.g. `supabase_2.101.0_linux_arm64.deb`), not a generic `supabase_linux_arm64.deb` | Fetch version from GitHub API first, then build the URL dynamically |

### Build the image (one time)

```bash
docker build -t budget-agent .
```

---

## Convenience Script

`run-ticket.sh` in the project root. Two layers of error recovery:

1. **In-session resilience** — the prompt tells the agent to diagnose and retry failed commands (up to 3 times per command) instead of giving up on the first error
2. **Capped retry wrapper** — if the `claude` process itself crashes, the script restarts it (max 3 attempts), passing the last 80 lines of output so the next attempt can diagnose and continue where the previous one left off

### Why not Ralph Wiggum?

The [Ralph Wiggum technique](https://ghuntley.com/ralph/) runs the agent in an infinite loop — if it fails, feed the error back and retry forever. We use a capped variant instead because:

- **Fresh context per retry** — each restart is a new `claude -p` invocation with no memory of prior work. An infinite loop can redo or undo completed work on every iteration.
- **Token cost** — each retry pays for a full clone + prompt. Uncapped retries can burn through budget on a fundamentally broken environment (bad Dockerfile, missing credentials).
- **Unfixable errors exist** — wrong architecture, expired tokens, Docker daemon down. An infinite loop spins forever; a capped loop fails fast and tells you to look.

The first layer (in-session resilience) handles 90% of transient errors without any retry cost. The second layer (capped at 3) catches the remaining cases where the process itself dies.

### Usage

```bash
./run-ticket.sh <issue#> <branch-name> <model> [effort]

# Phase 1 — sequential
./run-ticket.sh 2 scaffold sonnet
./run-ticket.sh 3 month-sidebar haiku
./run-ticket.sh 4 sources-panel haiku
./run-ticket.sh 5 expenses haiku

# Phase 2 — parallel (3 terminals)
./run-ticket.sh 6 half-views sonnet
./run-ticket.sh 7 payments sonnet
./run-ticket.sh 8 recurring haiku

# With effort override
./run-ticket.sh 3 month-sidebar haiku low
```

---

## Running Agents — Sequential Tickets

Each sequential ticket follows this cycle: launch agent → agent starts Supabase + implements ticket → tear down → repeat.

### Step 1 — Run the agent

**Option A — Convenience script** (recommended):

```bash
./run-ticket.sh <issue#> <branch-name> <model>
# Example: ./run-ticket.sh 2 scaffold sonnet
```

See the model key in [Ticket Execution Order](#ticket-execution-order) for each ticket's recommended model.

**Option B — Manual docker run**:

```bash
docker run --rm -it \
  --network host \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v $HOME/.claude:/home/agent/.claude \
  -v $HOME/.claude.json:/home/agent/.claude.json \
  -v $HOME/.config/gh:/home/agent/.config/gh \
  budget-agent \
  bash -c "git clone https://github.com/barrylavides/budget-app.git . && claude --model <MODEL_ID> -p \"$(cat <<'PROMPT'
You are implementing a ticket for the FamilyBudget app.

1. Run `supabase start --exclude studio` in the project root to start the local Supabase instance
2. Note the anon key and API URL from the output
3. Read the issue: gh issue view <ISSUE_NUMBER> --repo barrylavides/budget-app
4. Read CLAUDE.md for project conventions
5. Read the PRD: gh issue view 1 --repo barrylavides/budget-app
6. Create and switch to branch: feat/<branch-name>
7. Implement using /tdd (red-green-refactor loop)
8. Use the API URL and anon key from step 2 for Supabase connections
9. Run all tests: bun run test
10. Commit and push when all tests pass
11. Run `supabase stop` to shut down the local instance

Branch: feat/<branch-name>
Issue: #<ISSUE_NUMBER>
PROMPT
)\" --dangerously-skip-permissions"
```

The agent container has the Supabase CLI and Docker CLI installed, and the host's Docker socket is mounted (`-v /var/run/docker.sock:/var/run/docker.sock`). When the agent runs `supabase start`, the CLI talks to Docker Desktop through that socket, which creates the Supabase containers (Postgres, API, Studio) as siblings — not nested inside the agent container:

```
Docker Desktop (host)
├── agent container        ← you started this
│   └── supabase start     ← talks to socket
├── supabase-db            ← Docker Desktop created these
├── supabase-api              because the socket request
├── supabase-studio           came through
```

### Step 2 — Merge on host, repeat

```bash
cd /Users/barry/Documents/projects/budget-app
git fetch origin
git merge origin/feat/<branch-name>
bun run test  # verify locally if you want
git push origin main
```

Then start from Step 1 for the next ticket.

---

## Running Agents — Parallel Tickets

After ticket #5 is merged to `main`, run all 3 in separate terminals. Each gets its own Supabase on different ports.

### Launch 3 agents (3 terminals)

Each agent starts its own Supabase instance, implements the ticket, and shuts Supabase down. Run the convenience script in 3 separate terminals — see [Convenience Script](#convenience-script) for the commands.

Each agent's `supabase start` will allocate its own ports automatically since they run in separate cloned repos inside separate containers.

---

## Merging Parallel Branches

After all 3 parallel agents finish, merge one at a time:

```bash
cd /Users/barry/Documents/projects/budget-app

# 1. Merge payments first (statistics ticket depends on it)
git fetch origin
git merge origin/feat/payments
bun run test

# 2. Merge half-views
git merge origin/feat/half-views
bun run test  # fix conflicts if any

# 3. Merge recurring
git merge origin/feat/recurring
bun run test  # fix conflicts if any

# Push
git push origin main
```

### Merge conflict risk

| Pair     | Risk     | Reason                                          |
|----------|----------|-------------------------------------------------|
| #6 vs #7 | **Low**  | Different UI components, different budget-engine functions |
| #6 vs #8 | **None** | Completely separate pages and data               |
| #7 vs #8 | **Low**  | #8 touches month creation, #7 touches expenses   |

If conflicts arise, they should be minor (import lists, router config). Resolve and re-run tests.

---

## Quick Reference

| Action | Command |
|--------|---------|
| Build agent image | `docker build -t budget-agent .` |
| Run a ticket | `./run-ticket.sh <issue#> <branch-name>` |
| Run frontend (host) | `bun run dev` |
| Run tests (host) | `bun run test` |
| View Supabase Studio | `http://localhost:54323` (while an agent is running) |
