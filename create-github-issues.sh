#!/bin/bash

# GitHub Issues Creation Script for Code Quality Review
# Run this script to create all 47 issues in your GitHub repository
# Make sure you have gh CLI installed and authenticated

set -e

echo "Creating GitHub Issues for Code Quality Review..."
echo "=================================================="
echo ""

# Color codes for output
RED='\033[0;31m'
ORANGE='\033[0;33m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Counter
CREATED=0

# ============================================================================
# CRITICAL PRIORITY ISSUES (2)
# ============================================================================

echo -e "${RED}Creating CRITICAL priority issues...${NC}"

# CRIT-001
echo "Creating issue: [CRITICAL] Missing Authentication on Projects API"
gh issue create \
  --title "[CRITICAL] Missing Authentication on Projects API" \
  --label "critical,security,bug" \
  --body-file .github/issues/CRIT-001.md
CREATED=$((CREATED + 1))
echo "✓ Created issue $CREATED"
echo ""

# CRIT-002
echo "Creating issue: [CRITICAL] Missing Authentication on Questions API"
gh issue create \
  --title "[CRITICAL] Missing Authentication on Questions API" \
  --label "critical,security,bug" \
  --body-file .github/issues/CRIT-002.md
CREATED=$((CREATED + 1))
echo "✓ Created issue $CREATED"
echo ""

# ============================================================================
# HIGH PRIORITY ISSUES (13)
# ============================================================================

echo -e "${ORANGE}Creating HIGH priority issues...${NC}"

# HIGH-001
echo "Creating issue: Standardize Error Response Format Across All APIs"
gh issue create \
  --title "Standardize Error Response Format Across All APIs" \
  --label "high,bug,consistency" \
  --body-file .github/issues/HIGH-001.md
CREATED=$((CREATED + 1))
echo "✓ Created issue $CREATED"
echo ""

# HIGH-002
echo "Creating issue: Enforce Middleware Usage on All API Routes"
gh issue create \
  --title "Enforce Middleware Usage on All API Routes" \
  --label "high,enhancement,consistency" \
  --body-file .github/issues/HIGH-002.md
CREATED=$((CREATED + 1))
echo "✓ Created issue $CREATED"
echo ""

# HIGH-003
echo "Creating issue: Remove Console Logs from Production Code"
gh issue create \
  --title "Remove Console Logs from Production Code" \
  --label "high,performance,tech-debt" \
  --body-file .github/issues/HIGH-003.md
CREATED=$((CREATED + 1))
echo "✓ Created issue $CREATED"
echo ""

# HIGH-004
echo "Creating issue: Refactor Large Context Providers for Better Performance"
gh issue create \
  --title "Refactor Large Context Providers for Better Performance" \
  --label "high,performance,refactoring" \
  --body-file .github/issues/HIGH-004.md
CREATED=$((CREATED + 1))
echo "✓ Created issue $CREATED"
echo ""

# HIGH-005
echo "Creating issue: Add Memoization to Expensive Operations"
gh issue create \
  --title "Add Memoization to Expensive Operations" \
  --label "high,performance,enhancement" \
  --body-file .github/issues/HIGH-005.md
CREATED=$((CREATED + 1))
echo "✓ Created issue $CREATED"
echo ""

# HIGH-006
echo "Creating issue: Implement Comprehensive Accessibility Features"
gh issue create \
  --title "Implement Comprehensive Accessibility Features" \
  --label "high,accessibility,enhancement" \
  --body-file .github/issues/HIGH-006.md
CREATED=$((CREATED + 1))
echo "✓ Created issue $CREATED"
echo ""

# HIGH-007
echo "Creating issue: Centralize Environment Variable Validation"
gh issue create \
  --title "Centralize Environment Variable Validation" \
  --label "high,enhancement,configuration" \
  --body-file .github/issues/HIGH-007.md
CREATED=$((CREATED + 1))
echo "✓ Created issue $CREATED"
echo ""

# HIGH-008
echo "Creating issue: Add Input Validation to All API Endpoints"
gh issue create \
  --title "Add Input Validation to All API Endpoints" \
  --label "high,security,enhancement" \
  --body-file .github/issues/HIGH-008.md
CREATED=$((CREATED + 1))
echo "✓ Created issue $CREATED"
echo ""

# HIGH-009
echo "Creating issue: Extract Duplicate LlamaCloud Integration Logic"
gh issue create \
  --title "Extract Duplicate LlamaCloud Integration Logic" \
  --label "high,refactoring,tech-debt" \
  --body-file .github/issues/HIGH-009.md
CREATED=$((CREATED + 1))
echo "✓ Created issue $CREATED"
echo ""

# HIGH-010
echo "Creating issue: Fix Infinite Loop Workarounds in Organization Context"
gh issue create \
  --title "Fix Infinite Loop Workarounds in Organization Context" \
  --label "high,bug,refactoring" \
  --body-file .github/issues/HIGH-010.md
CREATED=$((CREATED + 1))
echo "✓ Created issue $CREATED"
echo ""

# HIGH-011
echo "Creating issue: Optimize API Call Pattern in Multi-Step Response Hook"
gh issue create \
  --title "Optimize API Call Pattern in Multi-Step Response Hook" \
  --label "high,performance,enhancement" \
  --body-file .github/issues/HIGH-011.md
CREATED=$((CREATED + 1))
echo "✓ Created issue $CREATED"
echo ""

# HIGH-012
echo "Creating issue: Replace Magic Numbers with Named Constants"
gh issue create \
  --title "Replace Magic Numbers with Named Constants" \
  --label "high,tech-debt,maintainability" \
  --body-file .github/issues/HIGH-012.md
CREATED=$((CREATED + 1))
echo "✓ Created issue $CREATED"
echo ""

# HIGH-013
echo "Creating issue: Optimize Database Query Performance"
gh issue create \
  --title "Optimize Database Query Performance" \
  --label "high,performance,database" \
  --body-file .github/issues/HIGH-013.md
CREATED=$((CREATED + 1))
echo "✓ Created issue $CREATED"
echo ""

# ============================================================================
# MEDIUM PRIORITY ISSUES (20)
# ============================================================================

echo -e "${YELLOW}Creating MEDIUM priority issues...${NC}"

# MED-001 through MED-020
for i in {001..020}; do
  ISSUE_FILE=".github/issues/MED-${i}.md"
  if [ -f "$ISSUE_FILE" ]; then
    TITLE=$(head -n 1 "$ISSUE_FILE" | sed 's/^# //')
    echo "Creating issue: $TITLE"
    gh issue create \
      --title "$TITLE" \
      --label "medium,enhancement" \
      --body-file "$ISSUE_FILE"
    CREATED=$((CREATED + 1))
    echo "✓ Created issue $CREATED"
    echo ""
  fi
done

# ============================================================================
# LOW PRIORITY ISSUES (12)
# ============================================================================

echo -e "${GREEN}Creating LOW priority issues...${NC}"

# LOW-001 through LOW-012
for i in {001..012}; do
  ISSUE_FILE=".github/issues/LOW-${i}.md"
  if [ -f "$ISSUE_FILE" ]; then
    TITLE=$(head -n 1 "$ISSUE_FILE" | sed 's/^# //')
    echo "Creating issue: $TITLE"
    gh issue create \
      --title "$TITLE" \
      --label "low,enhancement" \
      --body-file "$ISSUE_FILE"
    CREATED=$((CREATED + 1))
    echo "✓ Created issue $CREATED"
    echo ""
  fi
done

echo ""
echo "=================================================="
echo -e "${GREEN}✓ Successfully created $CREATED GitHub issues!${NC}"
echo "=================================================="
echo ""
echo "View all issues at: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/issues"
