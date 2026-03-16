import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

async function checkBeforeDelete() {
  try {
    console.log('Checking Free Consultation bookings before deleting emergency_contact_name...\n');
    console.log('='.repeat(100));

    // Find all free consultation bookings with emergency_contact_name data
    const query = `
      SELECT 
        booking_id,
        invitee_name,
        invitee_email,
        booking_resource_name,
        invitee_question,
        emergency_contact_name,
        emergency_contact_relation,
        emergency_contact_number,
        CASE 
          WHEN emergency_contact_name = invitee_question THEN true 
          ELSE false 
        END as data_matches
      FROM bookings
      WHERE booking_resource_name ILIKE '%free consultation%'
        AND (emergency_contact_name IS NOT NULL AND emergency_contact_name != '')
      ORDER BY booking_start_at DESC
    `;

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      console.log('✅ No free consultation bookings have emergency_contact_name data.');
      console.log('Nothing to delete!');
      return;
    }

    console.log(`\n📋 Found ${result.rows.length} free consultation booking(s) with emergency_contact_name data:\n`);

    let matchingCount = 0;
    let notMatchingCount = 0;

    result.rows.forEach((booking, index) => {
      const matches = booking.data_matches;
      if (matches) matchingCount++;
      else notMatchingCount++;

      console.log(`\n[${index + 1}] ${booking.invitee_name} (ID: ${booking.booking_id})`);
      console.log(`    Email: ${booking.invitee_email}`);
      console.log(`    Session: ${booking.booking_resource_name}`);
      
      console.log(`\n    📝 invitee_question:`);
      console.log(`       ${booking.invitee_question?.substring(0, 100) || '(empty)'}${booking.invitee_question?.length > 100 ? '...' : ''}`);
      
      console.log(`\n    🚨 emergency_contact_name:`);
      console.log(`       ${booking.emergency_contact_name?.substring(0, 100)}${booking.emergency_contact_name?.length > 100 ? '...' : ''}`);
      
      console.log(`\n    ⚖️  Data Match: ${matches ? '✅ YES - Safe to delete' : '❌ NO - Different data!'}`);
      
      if (!matches) {
        console.log(`\n    ⚠️  WARNING: emergency_contact_name has DIFFERENT data than invitee_question!`);
      }
      
      console.log('-'.repeat(100));
    });

    console.log('\n\n📊 SUMMARY:');
    console.log('='.repeat(100));
    console.log(`Total bookings with emergency_contact_name: ${result.rows.length}`);
    console.log(`Bookings where data MATCHES invitee_question: ${matchingCount} ✅ (Safe to delete)`);
    console.log(`Bookings where data DOES NOT MATCH: ${notMatchingCount} ⚠️  (Need review)`);

    if (notMatchingCount > 0) {
      console.log('\n⚠️  WARNING: Some bookings have different data in emergency_contact_name!');
      console.log('Review these carefully before proceeding with deletion.');
    }

    console.log('\n\n🗑️  PROPOSED ACTION:');
    console.log('='.repeat(100));
    console.log('Will DELETE (set to NULL) emergency_contact_name for ALL free consultation bookings.');
    console.log('This will clear the emergency contact fields:');
    console.log('  - emergency_contact_name → NULL');
    console.log('  - emergency_contact_relation → NULL');
    console.log('  - emergency_contact_number → NULL');
    console.log('\nThe invitee_question field will remain unchanged and keep all the data.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkBeforeDelete();
