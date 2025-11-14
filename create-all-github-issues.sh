#!/bin/bash

# Script to create all 47 GitHub issues from code quality review
# Make sure you have gh CLI installed and authenticated

set -e

echo "==========================================="
echo "  Creating GitHub Issues for Code Quality"
echo "==========================================="
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ Error: GitHub CLI (gh) is not installed"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Error: Not authenticated with GitHub"
    echo "Run: gh auth login"
    exit 1
fi

# Function to create a single issue
create_issue() {
    local file=$1
    local title=$(head -n 1 "$file" | sed 's/^# //')
    local priority=$2
    local labels=$3

    echo "Creating: $title"

    gh issue create \
        --title "$title" \
        --body-file "$file" \
        --label "$labels" \
        2>&1 | grep -oP '(?<=https://github.com/).*' || echo "  ✓ Created"

    echo ""
}

# Counter
CREATED=0
FAILED=0

echo "Starting issue creation..."
echo ""

# ========================================
# CRITICAL PRIORITY (2 issues)
# ========================================
echo "🔴 Creating CRITICAL priority issues..."
echo ""

for file in .github/issues/CRIT-*.md; do
    if create_issue "$file" "CRITICAL" "critical,security,bug"; then
        CREATED=$((CREATED + 1))
    else
        FAILED=$((FAILED + 1))
    fi
done

# ========================================
# HIGH PRIORITY (13 issues)
# ========================================
echo "🟠 Creating HIGH priority issues..."
echo ""

for file in .github/issues/HIGH-*.md; do
    if create_issue "$file" "HIGH" "high,enhancement"; then
        CREATED=$((CREATED + 1))
    else
        FAILED=$((FAILED + 1))
    fi
done

# ========================================
# MEDIUM PRIORITY (20 issues)
# ========================================
echo "🟡 Creating MEDIUM priority issues..."
echo ""

for file in .github/issues/MED-*.md; do
    if create_issue "$file" "MEDIUM" "medium,enhancement"; then
        CREATED=$((CREATED + 1))
    else
        FAILED=$((FAILED + 1))
    fi
done

# ========================================
# LOW PRIORITY (12 issues)
# ========================================
echo "🟢 Creating LOW priority issues..."
echo ""

for file in .github/issues/LOW-*.md; do
    if create_issue "$file" "LOW" "low,enhancement"; then
        CREATED=$((CREATED + 1))
    else
        FAILED=$((FAILED + 1))
    fi
done

# ========================================
# Summary
# ========================================
echo ""
echo "==========================================="
echo "  Summary"
echo "==========================================="
echo "✅ Successfully created: $CREATED issues"
if [ $FAILED -gt 0 ]; then
    echo "❌ Failed: $FAILED issues"
fi
echo ""
echo "View all issues:"
echo "  gh issue list"
echo ""
echo "Or visit:"
REPO_URL=$(gh repo view --json url -q .url)
echo "  ${REPO_URL}/issues"
echo ""
