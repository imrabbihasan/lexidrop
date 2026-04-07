#!/bin/bash

# Build Chrome Extension Package
echo "🚀 Building LexiDrop Client..."
cd client
npm run build
cd ..

echo "📂 Copying build to extension..."
# Clean previous dist
rm -rf extension/dist
# Copy new dist
cp -R client/dist extension/dist

echo "✅ Extension build ready in 'extension/'"
echo "👉 To Load: Open Chrome -> chrome://extensions -> Load Unpacked -> Select 'extension' folder."
echo "👉 To Pack: Click 'Pack extension' to create a .crx/.zip"
