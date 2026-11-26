#!/usr/bin/env bash
# Install the packed package the way a user would and generate a project with it.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "${work}"' EXIT

fail() {
	echo "verify-package: $*" >&2
	exit 1
}

cd "${repo_root}"
tarball="$(npm pack --silent --pack-destination "${work}")"
contents="$(tar -tzf "${work}/${tarball}")"

for unwanted in package/src/ package/fixtures/ package/.cursor/ package/.github/ package/scripts/ package/dist/verifyScaffoldE2e; do
	if grep -q "^${unwanted}" <<<"${contents}"; then
		fail "the tarball should not include ${unwanted#package/}"
	fi
done

for needed in package/dist/index.js package/scaffold-assets/claude-hooks/handbook-drift-check.mjs package/README.md package/LICENSE; do
	grep -qx "${needed}" <<<"${contents}" || fail "the tarball is missing ${needed#package/}"
done

mkdir "${work}/install" "${work}/site"
(cd "${work}/install" && npm init -y >/dev/null && npm install --silent --no-audit --no-fund "${work}/${tarball}")

kickoff="${work}/install/node_modules/.bin/kickoff"
[[ -x "${kickoff}" ]] || fail "installing the package did not add a kickoff command"

"${kickoff}" --help | grep -q "kickoff handbook" || fail "kickoff --help did not run"

(cd "${work}/site" && "${kickoff}" --answers "${repo_root}/fixtures/scaffold-e2e/claude-static.json" --no-refresh >/dev/null)

for file in package.json docs/handbook/llms.md .claude/hooks/handbook-drift-check.mjs .claude/commands/handbook-review.md; do
	[[ -f "${work}/site/${file}" ]] || fail "the installed kickoff did not write ${file}"
done

echo "verify-package: ${tarball} installs and generates a project ($(wc -l <<<"${contents}" | tr -d ' ') files packed)"
