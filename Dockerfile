FROM oven/bun:latest

RUN apt-get update && apt-get install -y \
  git \
  curl \
  docker.io \
  gosu \
  && rm -rf /var/lib/apt/lists/*

# GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
  | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
  | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
  && apt-get update && apt-get install -y gh

# Supabase CLI
RUN ARCH=$(dpkg --print-architecture) && \
  VERSION=$(curl -sL https://api.github.com/repos/supabase/cli/releases/latest | sed -n 's/.*"tag_name":"v\([^"]*\)".*/\1/p') && \
  curl -fsSL "https://github.com/supabase/cli/releases/download/v${VERSION}/supabase_${VERSION}_linux_${ARCH}.deb" -o /tmp/supabase.deb && \
  dpkg -i /tmp/supabase.deb && \
  rm /tmp/supabase.deb

# Claude Code (global install + manual postinstall for native binary)
RUN bun install -g @anthropic-ai/claude-code \
  && CLAUDE_PKG=$(find /root -path "*/node_modules/@anthropic-ai/claude-code/install.cjs" 2>/dev/null | head -1) \
  && if [ -n "$CLAUDE_PKG" ]; then bun "$CLAUDE_PKG"; fi

# Wrap supabase to always exclude studio on start (Studio bind-mounts fail in sibling containers)
RUN mv /usr/bin/supabase /usr/bin/supabase-real \
  && printf '#!/bin/bash\nif [ "$1" = "start" ]; then\n  shift\n  exec /usr/bin/supabase-real start --exclude studio "$@"\nfi\nexec /usr/bin/supabase-real "$@"\n' > /usr/bin/supabase \
  && chmod +x /usr/bin/supabase

# Playwright (Chromium only — shared location so agent user can access it)
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/playwright-browsers
RUN bunx playwright install --with-deps chromium \
  && chmod -R a+rX /opt/playwright-browsers

# Make claude accessible to all users
RUN chmod a+rx /root && chmod -R a+rX /root/.bun \
  && CLAUDE_BIN=$(find /root/.bun -name "claude" -path "*/claude-code-linux-*/claude" ! -path "*musl*" | head -1) \
  && ln -sf "$CLAUDE_BIN" /usr/local/bin/claude

# Non-root user (Claude Code blocks --dangerously-skip-permissions as root)
RUN useradd -m -s /bin/bash agent \
  && mkdir -p /home/agent/app \
  && chown agent:agent /home/agent/app

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

WORKDIR /home/agent/app

ENTRYPOINT ["entrypoint.sh"]
CMD ["bash"]
