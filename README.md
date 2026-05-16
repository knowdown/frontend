# Frontend

Static operator console for Knockdown, published from this repository with GitHub Pages.

## Deployment

Pushes to `main` trigger `.github/workflows/deploy-pages.yml`, which:

- ensures GitHub Pages settings are aligned through the GitHub API
- packages the static site files
- deploys the site with the official Pages actions

The workflow can manage repository-level Pages settings automatically when a `PAGES_ADMIN_TOKEN` secret is present. For one-time bootstrap, you can also run:

```bash
GITHUB_REPOSITORY=knowdown/frontend ./scripts/configure-pages.sh
```
