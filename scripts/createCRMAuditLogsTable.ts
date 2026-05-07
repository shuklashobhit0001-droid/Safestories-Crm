import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createCRMAuditLogsTable() {
  const client = await pool.connect();
  
  try {
    console.log('Creating crm_audit_logs table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS crm_audit_logs (
        log_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        user_name VARCHAR(255),
        action_type VARCHAR(100) NOT NULL,
        action_description TEXT,
        lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
        lead_name VARCHAR(255),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB
      );
    `);
    
    console.log('✅ crm_audit_logs table created successfully');
    
    // Create indexes for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_crm_audit_logs_user_id ON crm_audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_crm_audit_logs_lead_id ON crm_audit_logs(lead_id);
      CREATE INDEX IF NOT EXISTS idx_crm_audit_logs_timestamp ON crm_audit_logs(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_crm_audit_logs_action_type ON crm_audit_logs(action_type);
    `);
    
    console.log('✅ Indexes created successfully');
    
  } catch (error) {
    console.error('❌ Error creating crm_audit_logs table:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createCRMAuditLogsTable();
