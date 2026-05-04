import pool from '../lib/db';

async function verifyUserStatus() {
  try {
    console.log('🔍 Checking Ishika Mahajan status in database...\n');

    const result = await pool.query(
      'SELECT id, username, name, role, therapist_id, is_active FROM users WHERE id = 3'
    );

    if (result.rows.length === 0) {
      console.log('❌ User not found');
      process.exit(1);
    }

    const user = result.rows[0];
    console.log('Database Status:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Therapist ID: ${user.therapist_id}`);
    console.log(`  is_active: ${user.is_active}`);
    console.log(`  Status: ${user.is_active ? '✅ ACTIVE (CAN LOGIN)' : '❌ DISABLED (CANNOT LOGIN)'}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyUserStatus();
