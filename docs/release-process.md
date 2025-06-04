# Release Process

This project uses **Changesets** for versioning and automated releases.

## Creating a Changeset

Run `npm run changeset` after making user facing changes. This generates a new file in `.changeset/` describing the update and the version bump (patch, minor, or major).

## Version Bumping

Versions are updated by running `npm run version` which executes `changeset version`. This updates `package.json` and `CHANGELOG.md` based on pending changesets.

## Publishing

Merging to `main` triggers the `Release` GitHub Action defined in `.github/workflows/release.yml`. The workflow publishes the package to npm and pushes the updated changelog.

## CI/CD

Continuous integration is handled by `.github/workflows/ci.yml`. It installs dependencies, checks formatting, and runs the Jest test suite on every pull request and push to `main` or `next`.

## Automated Testing

The project contains unit and integration tests under `tests/`. Run `npm test` locally or rely on the CI workflow to ensure all tests pass before release.
