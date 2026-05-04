import pool from '../lib/db';

async function listAllUsers() {
  try {
    console.log('📋 Fetching all users from database...\n');

    const result = await pool.query(`
      SELECT 
        id,
        username,
        email,
        name,
        role,
        therapist_id,
        is_active,
        created_at
      FROM users
      ORDER BY role, name;
    `);

    if (result.rows.length === 0) {
      console.log('No users found in database.');
      process.exit(0);
    }

    console.log(`Total Users: ${result.rows.length}\n`);
    console.log('='.repeat(120));

    // Group by role
    const usersByRole = result.rows.reduce((acc, user) => {
      if (!acc[user.role]) acc[user.role] = [];
      acc[user.role].push(user);
      return acc;
    }, {} as Record<string, any[]>);

    for (const [role, users] of Object.entries(usersByRole)) {
      console.log(`\n${role.toUpperCase()} (${users.length})`);
      console.log('-'.repeat(120));
      
      users.forEach(user => {
        const status = user.is_active ? '✅ ACTIVE' : '❌ DISABLED';
        const therapistInfo = user.therapist_id ? ` | Therapist ID: ${user.therapist_id}` : '';
        
        console.log(`${status} | ID: ${user.id} | ${user.name || 'N/A'}`);
        console.log(`       Username: ${user.username} | Email: ${user.email || 'N/A'}${therapistInfo}`);
        console.log(`       Created: ${user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}`);
        console.log('');
      });
    }

    console.log('='.repeat(120));
    
    // Summary
    const activeCount = result.rows.filter(u => u.is_active).length;
    const disabledCount = result.rows.filter(u => u.is_active === false).length;
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total: ${result.rows.length}`);
    console.log(`   Active: ${activeCount}`);
    console.log(`   Disabled: ${disabledCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    process.exit(1);
  }
}

listAllUsers();
