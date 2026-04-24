import pool from '../lib/db';

async function migrateSalesRole() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting sales_role to role migration...');
    
    // Check current state
    const beforeCheck = await client.query(
      `SELECT id, username, role, sales_role FROM users WHERE sales_role = 'lead_manager'`
    );
    console.log(`\n📊 Found ${beforeCheck.rows.length} users with sales_role = 'lead_manager':`);
    beforeCheck.rows.forEach(user => {
      console.log(`  - ${user.username} (id: ${user.id}, current role: ${user.role})`);
    });

    if (beforeCheck.rows.length === 0) {
      console.log('\n✅ No users to migrate. Checking if column exists...');
      
      const columnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'sales_role'
      `);
      
      if (columnCheck.rows.length === 0) {
        console.log('✅ sales_role column already removed. Migration complete!');
        return;
      }
    }

    // Migrate users
    if (beforeCheck.rows.length > 0) {
      const updateResult = await client.query(
        `UPDATE users SET role = 'sales' WHERE sales_role = 'lead_manager'`
      );
      console.log(`\n✅ Updated ${updateResult.rowCount} users to role = 'sales'`);
    }

    // Verify migration
    const afterCheck = await client.query(
      `SELECT id, username, role FROM users WHERE role = 'sales'`
    );
    console.log(`\n✅ Verification - users with role = 'sales':`);
    afterCheck.rows.forEach(user => {
      console.log(`  - ${user.username} (id: ${user.id})`);
    });

    // Drop the sales_role column
    console.log('\n🗑️  Dropping sales_role column...');
    await client.query(`ALTER TABLE users DROP COLUMN IF EXISTS sales_role`);
    console.log('✅ sales_role column dropped successfully');

    console.log('\n🎉 Migration complete!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateSalesRole();
