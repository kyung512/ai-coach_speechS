#!/bin/sh

echo "Starting application with environment variable injection..."

# Replace placeholders in JS files with actual environment variables
echo "Replacing PLACEHOLDER_SUPABASE_URL with $VITE_SUPABASE_URL"
find /app/dist -name "*.js" -type f -exec sed -i "s|PLACEHOLDER_SUPABASE_URL|$VITE_SUPABASE_URL|g" {} \;

echo "Replacing PLACEHOLDER_SUPABASE_KEY with environment variable"
find /app/dist -name "*.js" -type f -exec sed -i "s|PLACEHOLDER_SUPABASE_KEY|$VITE_SUPABASE_ANON_KEY|g" {} \;

echo "Replacing PLACEHOLDER_API_URL with $VITE_API_URL"
find /app/dist -name "*.js" -type f -exec sed -i "s|PLACEHOLDER_API_URL|$VITE_API_URL|g" {} \;

echo "Replacing PLACEHOLDER_TTS_ENGINE with $VITE_TTS_ENGINE"
find /app/dist -name "*.js" -type f -exec sed -i "s|PLACEHOLDER_TTS_ENGINE|$VITE_TTS_ENGINE|g" {} \;

echo "Starting server..."
exec node server/index.js