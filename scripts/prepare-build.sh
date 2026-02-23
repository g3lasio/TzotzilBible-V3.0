#!/bin/bash
# ============================================================
# Tzotzil Bible — Build Preparation Script
# Run this ONCE before every Archive in Xcode.
# Handles: force pull, auto build number, npm install, pod install.
#
# Usage (from project root):
#   bash scripts/prepare-build.sh
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
APP_CONFIG="$PROJECT_DIR/app.config.js"
INFO_PLIST="$PROJECT_DIR/ios/TzotzilBible/Info.plist"

echo ""
echo "========================================"
echo "  Tzotzil Bible — Build Preparation"
echo "========================================"

# ── 1. Force-clean pull from GitHub ──────────────────────────
echo ""
echo "▶ Step 1: Pulling latest changes from GitHub..."
cd "$PROJECT_DIR"

# Discard local conflicts that always block pull
git checkout -- ios/TzotzilBible/Info.plist 2>/dev/null || true
git clean -f android/app/src/main/assets/bible.db 2>/dev/null || true
git stash --include-untracked 2>/dev/null || true

git pull origin main
echo "✓ Pull complete."

# ── 2. Generate timestamp-based build number ─────────────────
echo ""
echo "▶ Step 2: Generating build number from timestamp..."

# Format: YYMMDDHHMM — always unique, always increasing
# iOS buildNumber (string): e.g. "2602231045"
# Android versionCode (int): e.g. 2602231045
BUILD_NUMBER=$(date '+%y%m%d%H%M')
VERSION_CODE=$(date '+%y%m%d%H%M' | sed 's/^0*//')  # strip leading zeros for int

echo "  New build number: $BUILD_NUMBER"

# Update app.config.js — replace whatever the current values are
sed -i '' "s/const BUILD_NUMBER = \"[^\"]*\"/const BUILD_NUMBER = \"$BUILD_NUMBER\"/" "$APP_CONFIG"
sed -i '' "s/const VERSION_CODE = [0-9]*/const VERSION_CODE = $VERSION_CODE/" "$APP_CONFIG"

# Update Info.plist CFBundleVersion directly
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $BUILD_NUMBER" "$INFO_PLIST"

echo "✓ Build number set to $BUILD_NUMBER."

# ── 3. Install npm dependencies ───────────────────────────────
echo ""
echo "▶ Step 3: Installing npm dependencies..."
npm install --silent
echo "✓ npm install complete."

# ── 4. Install CocoaPods ──────────────────────────────────────
echo ""
echo "▶ Step 4: Installing CocoaPods..."
cd "$PROJECT_DIR/ios"
pod install
cd "$PROJECT_DIR"
echo "✓ pod install complete."

# ── 5. Commit the new build number back to GitHub ────────────
echo ""
echo "▶ Step 5: Saving build number to GitHub..."
git add "$APP_CONFIG" "$INFO_PLIST"
git commit -m "chore(build): auto build number $BUILD_NUMBER ($(date '+%Y-%m-%d %H:%M'))"
git push origin main
echo "✓ Build number $BUILD_NUMBER committed and pushed."

# ── Done ──────────────────────────────────────────────────────
echo ""
echo "========================================"
echo "  ✅ Ready to Archive in Xcode!"
echo ""
echo "  Build: $BUILD_NUMBER"
echo "  Version: 7.0.0 ($(grep 'version:' $APP_CONFIG | head -1 | grep -o '[0-9.]*'))"
echo ""
echo "  Next steps:"
echo "  1. open ios/TzotzilBible.xcworkspace"
echo "  2. Select: Any iOS Device (arm64)"  
echo "  3. Product → Archive → Distribute App"
echo "========================================"
echo ""
