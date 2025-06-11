import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// If no DATABASE_URL, construct from individual components
if (!process.env.DATABASE_URL) {
  dbConfig.host = process.env.PGHOST || 'localhost';
  dbConfig.port = parseInt(process.env.PGPORT) || 5432;
  dbConfig.database = process.env.PGDATABASE || 'flexbook';
  dbConfig.user = process.env.PGUSER || 'postgres';
  dbConfig.password = process.env.PGPASSWORD || '';
  delete dbConfig.connectionString;
}

export const pool = new Pool(dbConfig);

// Test database connection
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();
    console.log('✅ Database connected at:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
};

// Helper function to execute queries
export const query = async (text, params = []) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🗃️  Query executed:', { text, duration: `${duration}ms`, rows: result.rowCount });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Query error:', { text, error: error.message });
    throw error;
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔌 Closing database connection pool...');
  await pool.end();
  console.log('✅ Database connection pool closed.');
});