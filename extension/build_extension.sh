#!/bin/bash

# Define the name of your zip file
NAME="LexiDrop_v1.1.2"

echo "🚀 Starting build for $NAME..."

# 1. Delete any old zip files to avoid confusion
rm -f *.zip

# 2. Create the ZIP file
# -r means recursive (include folders)
# -x means EXCLUDE these files from the zip
zip -r $NAME.zip . -x \
    "build_extension.sh" \
    ".DS_Store" \
    "*.git*" \
    "screenshots/*" \
    "node_modules/*" \
    ".vscode/*"

echo "------------------------------------------"
echo "✅ Done! Your package is ready: $NAME.zip"
echo "------------------------------------------"