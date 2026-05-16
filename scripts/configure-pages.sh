#!/usr/bin/env bash

set -euo pipefail

repo="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
export GH_TOKEN="${PAGES_ADMIN_TOKEN:-${GITHUB_TOKEN:-}}"

api_headers=(
  -H "Accept: application/vnd.github+json"
  -H "X-GitHub-Api-Version: 2022-11-28"
)

warn_and_continue() {
  local message="$1"
  echo "::warning::${message}"
}

run_pages_request() {
  local method="$1"
  shift

  gh api "${api_headers[@]}" -X "$method" "$@"
}

pages_exists=true
if ! run_pages_request GET "repos/${repo}/pages" >/tmp/pages-site.json 2>/tmp/pages-site.err; then
  if grep -Eq 'HTTP 404|Not Found' /tmp/pages-site.err; then
    pages_exists=false
  elif grep -q "Resource not accessible by integration" /tmp/pages-site.err; then
    warn_and_continue "Skipping Pages configuration update because the workflow token cannot manage repository settings. Add a PAGES_ADMIN_TOKEN secret if you want workflow-managed Pages settings."
    exit 0
  else
    cat /tmp/pages-site.err >&2
    exit 1
  fi
fi

pages_args=(
  "repos/${repo}/pages"
  -f build_type=workflow
)

if [ -n "${PAGES_CNAME:-}" ]; then
  pages_args+=(-f cname="${PAGES_CNAME}")
fi

if [ "${pages_exists}" = true ]; then
  if ! run_pages_request PUT "${pages_args[@]}" >/dev/null 2>/tmp/pages-update.err; then
    if grep -q "Resource not accessible by integration" /tmp/pages-update.err; then
      warn_and_continue "Pages site already exists, but automatic settings updates need a PAGES_ADMIN_TOKEN secret."
    else
      cat /tmp/pages-update.err >&2
      exit 1
    fi
  fi
else
  if ! run_pages_request POST "${pages_args[@]}" >/dev/null 2>/tmp/pages-create.err; then
    if grep -q "Resource not accessible by integration" /tmp/pages-create.err; then
      warn_and_continue "The repository needs Pages enabled, but the workflow token cannot create the Pages site. Run scripts/configure-pages.sh locally with an admin-scoped gh auth token once."
      exit 0
    fi

    cat /tmp/pages-create.err >&2
    exit 1
  fi
fi

site_url="$(run_pages_request GET "repos/${repo}/pages" --jq '.html_url')"
if [ -n "${site_url}" ]; then
  if ! gh api "${api_headers[@]}" -X PATCH "repos/${repo}" -f homepage="${site_url}" >/dev/null 2>/tmp/repo-homepage.err; then
    if grep -q "Resource not accessible by integration" /tmp/repo-homepage.err; then
      warn_and_continue "Pages is configured, but updating the repository homepage still needs admin-scoped API access."
    else
      cat /tmp/repo-homepage.err >&2
      exit 1
    fi
  fi
fi

echo "Pages settings are aligned for ${repo}."
