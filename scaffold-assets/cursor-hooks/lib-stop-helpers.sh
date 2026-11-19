stop_followup() {
  emit_followup "$1"
}

emit_followup() {
  local reason="$1"
  jq -n --arg r "$reason" '{ followup_message: $r }'
}

hook_loop_count() {
  printf '%s' "$INPUT" | jq -r '.loop_count // 0'
}

hook_cwd() {
  printf '%s' "$INPUT" | jq -r '.cwd // empty'
}

hook_conversation_id() {
  printf '%s' "$INPUT" | jq -r '.conversation_id // .generation_id // "unknown"' | tr -cd 'a-zA-Z0-9._-'
}

stop_state_file() {
  local root state_dir
  root="${STOP_ROOT:-$(hook_cwd)}"
  [ -z "$root" ] && root="$(pwd)"
  state_dir="$root/.cursor/hooks-state"
  mkdir -p "$state_dir"
  printf '%s/%s.json' "$state_dir" "$(hook_conversation_id)"
}

changed_files_worktree() {
  {
    git diff --name-only HEAD 2>/dev/null
    git diff --cached --name-only 2>/dev/null
    git ls-files --others --exclude-standard 2>/dev/null
  } | sort -u
}

files_fingerprint() {
  printf '%s' "$1" | shasum -a 256 | awk '{print $1}'
}

changed_files_content_fingerprint() {
  local root="${STOP_ROOT:-$(hook_cwd)}"
  [ -z "$root" ] && root="$(pwd)"
  local file hash
  {
    while IFS= read -r file; do
      [ -z "$file" ] && continue
      if [ -f "$root/$file" ]; then
        hash="$(shasum -a 256 "$root/$file" | awk '{print $1}')"
        printf '%s:%s\n' "$file" "$hash"
      else
        printf '%s:deleted\n' "$file"
      fi
    done
  } | LC_ALL=C sort | shasum -a 256 | awk '{print $1}'
}

stop_notified_for_fingerprint() {
  local key="$1" fp="$2"
  local state_file stored
  state_file="$(stop_state_file)"
  [ ! -f "$state_file" ] && return 1
  stored="$(jq -r --arg k "$key" '.notified[$k] // empty' "$state_file" 2>/dev/null || true)"
  [ -n "$stored" ] && [ "$stored" = "$fp" ]
}

stop_mark_notified() {
  local key="$1" fp="$2"
  local state_file tmp
  state_file="$(stop_state_file)"
  tmp="$(mktemp)"
  if [ -f "$state_file" ]; then
    jq --arg k "$key" --arg fp "$fp" '.notified[$k] = $fp' "$state_file" >"$tmp"
  else
    jq -n --arg k "$key" --arg fp "$fp" '{notified: {($k): $fp}}' >"$tmp"
  fi
  mv "$tmp" "$state_file"
}

stop_clear_notified() {
  local key="$1"
  local state_file tmp
  state_file="$(stop_state_file)"
  [ ! -f "$state_file" ] && return 0
  tmp="$(mktemp)"
  jq --arg k "$key" 'del(.notified[$k])' "$state_file" >"$tmp"
  mv "$tmp" "$state_file"
}

run_pnpm() {
  if [ -x "${HOME}/.local/bin/mise" ]; then
    "${HOME}/.local/bin/mise" exec -- pnpm "$@"
  elif command -v mise >/dev/null 2>&1; then
    mise exec -- pnpm "$@"
  elif command -v pnpm >/dev/null 2>&1; then
    pnpm "$@"
  else
    return 127
  fi
}
