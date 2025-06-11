import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigrations = async () => {
  console.log('🚀 Starting database migrations...');
  
  try {
    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by statements and execute each one
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      try {
        await query(statement);
      } catch (error) {
        // Log but don't fail for "already exists" errors
        if (!error.message.includes('already exists')) {
          console.error('Migration error:', error.message);
          throw error;
        }
      }
    }
    
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migrations if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      console.log('🎉 Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

export { runMigrations };