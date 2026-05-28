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

WORKDIR /app

CMD ["bash"]
