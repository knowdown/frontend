# Frontend

Static operator console for Knockdown, published from this repository with GitHub Pages.

## Architecture Notes

Implementation notes for the GitHub-backed async request broker pattern live here:

- [Request broker architecture](./docs/request-broker-architecture.md)
- [GitHub Actions workflow template](./docs/process-request.workflow-template.yml)

## Deployment

Pushes to `main` trigger `.github/workflows/deploy-pages.yml`, which:

- ensures GitHub Pages settings are aligned through the GitHub API
- packages the static site files
- deploys the site with the official Pages actions

The workflow can manage repository-level Pages settings automatically when a `PAGES_ADMIN_TOKEN` secret is present. For one-time bootstrap, you can also run:

```bash
GITHUB_REPOSITORY=knowdown/frontend ./scripts/configure-pages.sh
```
