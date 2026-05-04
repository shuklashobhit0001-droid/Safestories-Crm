import pool from '../lib/db';

async function disableUser() {
  const userId = 3; // Ishika Mahajan
  
  try {
    console.log(`🔒 Disabling login for user ID: ${userId}...\n`);

    // Get user details before disabling
    const userBefore = await pool.query(
      'SELECT id, username, name, email, role, therapist_id, is_active FROM users WHERE id = $1',
      [userId]
    );

    if (userBefore.rows.length === 0) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('User Details:');
    console.log(`  Name: ${userBefore.rows[0].name}`);
    console.log(`  Username: ${userBefore.rows[0].username}`);
    console.log(`  Role: ${userBefore.rows[0].role}`);
    console.log(`  Therapist ID: ${userBefore.rows[0].therapist_id}`);
    console.log(`  Current Status: ${userBefore.rows[0].is_active ? '✅ ACTIVE' : '❌ DISABLED'}\n`);

    // Disable the user
    const result = await pool.query(
      'UPDATE users SET is_active = FALSE WHERE id = $1 RETURNING *',
      [userId]
    );

    if (result.rows.length > 0) {
      console.log('✅ User login has been DISABLED successfully!\n');
      console.log(`  New Status: ❌ DISABLED`);
      console.log(`  User "${result.rows[0].username}" can no longer login`);
      console.log(`  They will see: "Your account has been disabled. Please contact support."`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error disabling user:', error);
    process.exit(1);
  }
}

disableUser();
