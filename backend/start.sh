#!/bin/bash
set -e

echo "🚀 Starting FlexBook Production Server..."

# Wait for database to be ready (if using external DB)
if [ -n "$DATABASE_URL" ]; then
    echo "📡 Waiting for database connection..."
    until node -e "
        const { Pool } = require('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        pool.query('SELECT 1')
            .then(() => { console.log('Database connected!'); process.exit(0); })
            .catch(err => { console.error('Database connection failed:', err.message); process.exit(1); });
    "; do
        echo "⏳ Database not ready, waiting 5 seconds..."
        sleep 5
    done
fi

# Run database migrations
echo "🗄️  Running database migrations..."
cd /app/backend
npm run migrate

# Seed database with initial data (only in production if needed)
if [ "$SEED_DATABASE" = "true" ]; then
    echo "🌱 Seeding database..."
    npm run seed
fi

# Start the server
echo "🎯 Starting server on port ${PORT:-8080}..."
exec node src/server.js