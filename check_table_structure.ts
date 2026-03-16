import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    console.log('📋 Checking Bookings Table Structure...\n');
    
    // Get table columns
    const columnsResult = await pool.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bookings'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns in bookings table:');
    console.log('═══════════════════════════════════════════════════════\n');
    columnsResult.rows.forEach(col => {
      console.log(`   ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check for primary key or unique identifier
    const pkResult = await pool.query(`
      SELECT a.attname
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = 'bookings'::regclass
      AND i.indisprimary
    `);
    
    console.log('\n───────────────────────────────────────────────────────');
    if (pkResult.rows.length > 0) {
      console.log('Primary Key:');
      pkResult.rows.forEach(row => {
        console.log(`   ${row.attname}`);
      });
    } else {
      console.log('⚠️  No primary key found!');
    }
    
    console.log('\n═══════════════════════════════════════════════════════\n');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
})();
