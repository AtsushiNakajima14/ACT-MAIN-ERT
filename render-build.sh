#!/bin/bash

# Build the frontend
echo "Building frontend..."
npm run build

echo "Organizing files for production..."
if [ -d "dist/public" ]; then
  cp -r dist/public server/
  echo "✅ Static files copied to server/public"
fi

echo "🚀 Build complete - ready for Render deployment"