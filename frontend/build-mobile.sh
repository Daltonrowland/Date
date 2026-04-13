#!/bin/bash
set -e

echo "=== Building Relationship Scores for Mobile ==="

# Step 1: Build the React app
echo "Building React app..."
npm run build

# Step 2: Sync with Capacitor
echo "Syncing with Capacitor..."
npx cap sync

# Step 3: Open the IDE
if [ "$1" = "ios" ]; then
  echo "Opening Xcode..."
  npx cap open ios
elif [ "$1" = "android" ]; then
  echo "Opening Android Studio..."
  npx cap open android
else
  echo ""
  echo "Build complete! To open in an IDE run:"
  echo "  ./build-mobile.sh ios      # Open in Xcode"
  echo "  ./build-mobile.sh android  # Open in Android Studio"
fi
