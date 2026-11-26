SHELL := /bin/bash
.SILENT: release

release:
	if [ -z "$(tag)" ]; then echo "tag is required (eg, make release tag=v1.3.0)."; exit 1; fi
	if [[ ! "$(tag)" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$$ ]]; then echo "Tag must look like vX.Y.Z (eg, v1.3.0); it becomes the npm version and the GitHub release name."; exit 1; fi
	git fetch --quiet --tags origin main
	if git rev-parse --quiet --verify "refs/tags/$(tag)" >/dev/null; then echo "Tag $(tag) already exists."; exit 1; fi
	git tag "$(tag)" origin/main
	git push origin "refs/tags/$(tag)"
	echo "Tagged origin/main ($$(git rev-parse --short origin/main)) as $(tag)."
	bash "$(CURDIR)/scripts/watch-release.sh" "$(tag)"
