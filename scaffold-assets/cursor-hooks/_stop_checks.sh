#!/usr/bin/env bash
# Shared stop-hook checks (sourced by session-stop-checks.sh and legacy *.sh scripts).

stop_section_handbook_drift() {
  local changed="$1"
  local code_changed docs_changed

  code_changed="$(printf '%s\n' "$changed" | grep -E '^src/.*\.(ts|tsx|css)$' || true)"
  docs_changed="$(printf '%s\n' "$changed" | grep -E '^docs/handbook/.*\.md$' || true)"

  if [ -z "$code_changed" ] || [ -n "$docs_changed" ]; then
    return 0
  fi

  printf '%s\n\n' "$(printf 'Handbook-drift check: this session changed code under src/ but no docs/handbook/*.md. If any change shifted documented behavior or conventions, update the matching chapter now (see docs/handbook/llms.md for routing). If nothing documented changed, reply that the handbook is still accurate.\n\nChanged code files:\n%s' "$code_changed")"
}

stop_section_lint_all() {
  local changed="$1" fp="$2"
  local meaningful_changed lint_output lint_status

  if stop_notified_for_fingerprint "lint_all" "$fp"; then
    return 0
  fi

  meaningful_changed="$(printf '%s\n' "$changed" | grep -E '^src/.*\.(ts|tsx|css)$|^\.jest/|^jest\.config\.(ts|js|mjs)$|^package\.json$|^pnpm-lock\.yaml$|^next\.config\.(ts|js|mjs)$' || true)"
  [ -z "$meaningful_changed" ] && return 0

  if ! run_pnpm --version >/dev/null 2>&1; then
    stop_mark_notified "lint_all" "$fp"
    printf '%s\n\n' "$(printf 'Lint check: meaningful source changes but pnpm is unavailable. Manual check: pnpm lint:all\n\nChanged files:\n%s' "$meaningful_changed")"
    return 0
  fi

  lint_output=""
  lint_status=0
  lint_output="$(run_pnpm lint:all 2>&1)" || lint_status=$?

  if [ "$lint_status" -ne 0 ]; then
    stop_mark_notified "lint_all" "$fp"
    printf '%s\n\n' "$(printf 'lint:all failed after substantive edits. Fix the issues below, then run `pnpm lint:all` again before finishing.\n\nChanged files:\n%s\n\nLint output:\n%s' "$meaningful_changed" "$lint_output")"
    return 0
  fi

  stop_clear_notified "lint_all"
}

stop_section_handbook_test_jest() {
  local changed="$1" fp="$2"
  local feature_tests_changed jest_output jest_status

  if stop_notified_for_fingerprint "handbook_test_jest" "$fp"; then
    return 0
  fi

  feature_tests_changed="$(printf '%s\n' "$changed" | grep -E '\.(spec|test|po)\.(ts|tsx)$' || true)"
  [ -z "$feature_tests_changed" ] && return 0

  if ! run_pnpm --version >/dev/null 2>&1; then
    stop_mark_notified "handbook_test_jest" "$fp"
    printf '%s\n\n' "$(printf 'Handbook test drift check: feature test files changed but pnpm is unavailable. Manual check: pnpm exec jest src/tests/utils/handbookTestRules.spec.ts --runInBand\n\nChanged test files:\n%s' "$feature_tests_changed")"
    return 0
  fi

  jest_output=""
  jest_status=0
  jest_output="$(run_pnpm exec jest src/tests/utils/handbookTestRules.spec.ts --runInBand --no-cache 2>&1)" || jest_status=$?

  if [ "$jest_status" -ne 0 ]; then
    stop_mark_notified "handbook_test_jest" "$fp"
    printf '%s\n\n' "$(printf 'Handbook testing drift check failed. Feature tests must mock src/api/urls — not query/mutation hooks under src/hooks/queries/ or src/hooks/mutations/, and no specs in those folders. Rules: src/tests/utils/handbookTestRules.ts. Handbook: docs/handbook/conventions.md (Do not test React Query).\n\nChanged test files:\n%s\n\nTest output:\n%s' "$feature_tests_changed" "$jest_output")"
    return 0
  fi

  stop_clear_notified "handbook_test_jest"
}
