#!/bin/bash

# GhostWheel Health Check Script
# Run this to verify everything is working after the fixes

echo "🔍 GhostWheel Health Check"
echo "=========================="
echo ""

# Check if server is running
echo "1. Checking if development server is running..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Server is running"
else
    echo "❌ Server is not running. Please start it with: npm run dev"
    exit 1
fi

echo ""
echo "2. Checking database connection..."
DB_CHECK=$(curl -s http://localhost:3000/api/debug/db)
if echo "$DB_CHECK" | grep -q '"status":"ok"'; then
    echo "✅ Database connected"
    echo "$DB_CHECK" | jq '.'
else
    echo "❌ Database connection failed"
    echo "$DB_CHECK" | jq '.'
    echo ""
    echo "💡 Tip: Make sure your database is set up. Run: npm run setup-db"
    exit 1
fi

echo ""
echo "3. Checking session/authentication..."
SESSION_CHECK=$(curl -s -b cookies.txt http://localhost:3000/api/debug/session)
if echo "$SESSION_CHECK" | grep -q '"authenticated":true'; then
    echo "✅ User is authenticated"
    echo "$SESSION_CHECK" | jq '.'
else
    echo "⚠️  User is not authenticated (this is OK if you haven't logged in)"
    echo "$SESSION_CHECK" | jq '.'
fi

echo ""
echo "4. Environment variables check..."
if [ -f .env.local ]; then
    echo "✅ .env.local file exists"
    
    if grep -q "STRAVA_CLIENT_ID" .env.local && \
       grep -q "STRAVA_CLIENT_SECRET" .env.local && \
       grep -q "POSTGRES_URL" .env.local; then
        echo "✅ Required environment variables appear to be set"
    else
        echo "⚠️  Some required environment variables may be missing"
        echo "   Required: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, POSTGRES_URL"
    fi
else
    echo "❌ .env.local file not found"
    echo "💡 Tip: Copy .env.example to .env.local and fill in your credentials"
fi

echo ""
echo "=========================="
echo "Health check complete!"
echo ""
echo "Next steps:"
echo "1. If not authenticated, log in via Strava"
echo "2. Visit http://localhost:3000/dashboard"
echo "3. If errors occur, check the terminal logs for detailed error messages"
echo ""







