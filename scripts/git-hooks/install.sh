#!/usr/bin/env bash
# Install personal-playbook git hooks + filter config to .git/
#
# Run from anywhere:  bash <path>/scripts/git-hooks/install.sh
#
# This script installs:
#   1. pre-commit hook (commit-time null byte defense)
#   2. git config filter.strip-nul (add-time null byte defense, see .gitattributes)
#
# Re-run is safe (idempotent).
#
# See PROJECT_PLAYBOOK.md §3.12.5 for design rationale.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
HOOKS_DIR="$REPO_ROOT/.git/hooks"

if [ ! -d "$HOOKS_DIR" ]; then
    echo "Error: $HOOKS_DIR not found. Is this a git repo?" >&2
    exit 1
fi

# Step 1: Install hooks
installed=0
for src in "$SCRIPT_DIR"/*; do
    name=$(basename "$src")
    case "$name" in
        install.sh|install.ps1|README.md) continue ;;
    esac
    cp "$src" "$HOOKS_DIR/$name"
    chmod +x "$HOOKS_DIR/$name"
    echo "Installed hook: $HOOKS_DIR/$name"
    installed=$((installed + 1))
done

# Step 2: Configure git filter (Layer 2 defense, see .gitattributes)
echo ""
echo "Configuring filter.strip-nul (Layer 2 add-time defense)..."
git -C "$REPO_ROOT" config filter.strip-nul.clean "tr -d '\\000'"
git -C "$REPO_ROOT" config filter.strip-nul.smudge cat
# Not setting filter.strip-nul.required — missing config = identity passthrough = safe default
echo "  filter.strip-nul.clean  = tr -d '\\000'"
echo "  filter.strip-nul.smudge = cat"

echo ""
echo "Done. $installed hook(s) installed + filter configured."
echo ""
echo "Test hook (commit-time):"
echo "  echo -e 'a\\0b' > test.md && git add test.md && git commit -m 'test'"
echo ""
echo "Optional: re-stage existing files to apply filter retroactively:"
echo "  git add --renormalize ."
