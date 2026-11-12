#!/usr/bin/env bash
set -euo pipefail

# PreToolUse (Bash): commits go through scripts/git-commit.sh so .githooks/commit-msg
# can reject Co-authored-by trailers that tooling injects.
#
# The commit invocation is matched on a segment that actually runs git, and the
# trailer only on a line that starts one, so a message describing the rule is
# not itself denied.

source "$(dirname "$0")/_lib.sh"
hook_input

command="$(bash_command)"

commit_segments() {
  printf '%s' "$1" \
    | sed 's/&&/\n/g; s/||/\n/g; s/;/\n/g' \
    | sed 's/^[[:space:]]*//' \
    | grep -E '^(sudo[[:space:]]+)?git[[:space:]]+([^[:space:]]+[[:space:]]+)*commit([[:space:]]|$)' || true
}

if [ -z "$(commit_segments "$command")" ]; then
  exit 0
fi

if printf '%s' "$command" | grep -qiE '^[[:space:]]*Co-authored-by:'; then
  deny_tool 'Blocked: commit messages in this repo must not carry Co-authored-by trailers. Rewrite the message without co-author lines and retry.'
  exit 0
fi

if printf '%s' "$command" | grep -qE 'core\.hooksPath=\.githooks'; then
  exit 0
fi

deny_tool 'Blocked: use scripts/git-commit.sh (or git -c core.hooksPath=.githooks commit) so the commit-msg hook can reject Co-authored-by trailers.'
exit 0
