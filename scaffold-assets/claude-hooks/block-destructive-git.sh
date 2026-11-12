#!/usr/bin/env bash
set -euo pipefail

# PreToolUse (Bash): block force-push to protected branches and destructive git.
#
# Matching is anchored to segments that actually invoke git, so a command whose
# quoted text merely mentions a rule (a commit message, a grep, a heredoc) is
# not denied.

source "$(dirname "$0")/_lib.sh"
hook_input

git_segments() {
  printf '%s' "$1" \
    | sed 's/&&/\n/g; s/||/\n/g; s/|/\n/g; s/;/\n/g' \
    | sed 's/^[[:space:]]*//' \
    | grep -E '^(sudo[[:space:]]+)?git[[:space:]]' || true
}

command="$(bash_command)"
segments="$(git_segments "$command")"

[ -n "$segments" ] || exit 0

if printf '%s\n' "$segments" | grep -qE '^(sudo[[:space:]]+)?git[[:space:]].*reset[[:space:]]+--hard'; then
  deny_tool 'Blocked: git reset --hard is not allowed for agents. Discard changes with a targeted git restore, or ask the user to run destructive git themselves.'
  exit 0
fi

if printf '%s\n' "$segments" | grep -qE '^(sudo[[:space:]]+)?git[[:space:]].*clean[[:space:]]+-[a-z]*f'; then
  deny_tool 'Blocked: git clean -f is not allowed for agents. Remove files individually, or ask the user to run destructive git themselves.'
  exit 0
fi

if printf '%s\n' "$segments" | grep -qE '^(sudo[[:space:]]+)?git[[:space:]].*push' \
  && printf '%s\n' "$segments" | grep -qE '(--force([^-]|$)|-f[[:space:]]|--force-with-lease)' \
  && printf '%s\n' "$segments" | grep -qE '(refs/heads/)?(main|staging)([:[:space:]]|$|/)'; then
  deny_tool 'Blocked: force push to main or staging. Branches here are stacked — push a feature branch with gh stack push and open a PR into staging.'
  exit 0
fi

exit 0
