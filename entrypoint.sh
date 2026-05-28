#!/bin/bash
# Runs as root, fixes Docker socket permissions, then drops to agent user.
if [ -S /var/run/docker.sock ]; then
  chmod 666 /var/run/docker.sock
fi

exec gosu agent "$@"
