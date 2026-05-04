import pool from '../lib/db';

async function addIsActiveColumn() {
  try {
    console.log('🔧 Adding is_active column to users table...');

    // Add is_active column
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
    `);

    console.log('✅ Column added successfully');

    // Add comment for documentation
    await pool.query(`
      COMMENT ON COLUMN users.is_active IS 'Controls whether user can login. FALSE = account disabled, TRUE = account active';
    `);

    console.log('✅ Column comment added');

    // Set all existing users to active by default
    const result = await pool.query(`
      UPDATE users SET is_active = TRUE WHERE is_active IS NULL;
    `);

    console.log(`✅ Updated ${result.rowCount} existing users to active status`);

    // Verify the column exists
    const verify = await pool.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'is_active';
    `);

    if (verify.rows.length > 0) {
      console.log('✅ Verification successful:', verify.rows[0]);
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\nUsage:');
    console.log('- To disable a user: UPDATE users SET is_active = FALSE WHERE username = \'username\';');
    console.log('- To enable a user: UPDATE users SET is_active = TRUE WHERE username = \'username\';');
    console.log('- To check status: SELECT username, is_active FROM users;');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addIsActiveColumn();
