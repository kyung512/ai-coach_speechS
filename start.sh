#!/bin/sh

echo "Starting application..."
echo "VITE_SUPABASE_URL is: $VITE_SUPABASE_URL"
echo "VITE_API_URL is: $VITE_API_URL"

echo "Starting server..."
exec node server/index.js