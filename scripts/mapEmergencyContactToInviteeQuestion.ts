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

async function mapEmergencyContactToInviteeQuestion() {
  try {
    console.log('Starting data mapping: emergency_contact_name → invitee_question for Free Consultations\n');
    console.log('='.repeat(100));

    // Step 1: Find all free consultation bookings where emergency_contact_name has data but invitee_question is empty
    const findQuery = `
      SELECT 
        booking_id,
        invitee_name,
        booking_resource_name,
        invitee_question,
        emergency_contact_name
      FROM bookings
      WHERE booking_resource_name ILIKE '%free consultation%'
        AND emergency_contact_name IS NOT NULL 
        AND emergency_contact_name != ''
        AND (invitee_question IS NULL OR invitee_question = '')
    `;

    const result = await pool.query(findQuery);

    if (result.rows.length === 0) {
      console.log('✅ No bookings found that need mapping.');
      console.log('All free consultation bookings either:');
      console.log('  - Already have invitee_question populated, OR');
      console.log('  - Have empty emergency_contact_name');
      return;
    }

    console.log(`\n📋 Found ${result.rows.length} booking(s) that need mapping:\n`);

    result.rows.forEach((booking, index) => {
      console.log(`[${index + 1}] ${booking.invitee_name} (ID: ${booking.booking_id})`);
      console.log(`    Current invitee_question: ${booking.invitee_question || '(empty)'}`);
      console.log(`    Will copy from emergency_contact_name: ${booking.emergency_contact_name.substring(0, 80)}...`);
      console.log('-'.repeat(100));
    });

    // Ask for confirmation
    console.log('\n⚠️  READY TO UPDATE');
    console.log('This will copy emergency_contact_name → invitee_question for the above bookings.');
    console.log('The emergency_contact_name will remain unchanged (not deleted).\n');

    // Perform the update
    const updateQuery = `
      UPDATE bookings
      SET invitee_question = emergency_contact_name
      WHERE booking_resource_name ILIKE '%free consultation%'
        AND emergency_contact_name IS NOT NULL 
        AND emergency_contact_name != ''
        AND (invitee_question IS NULL OR invitee_question = '')
    `;

    const updateResult = await pool.query(updateQuery);

    console.log(`\n✅ SUCCESS! Updated ${updateResult.rowCount} booking(s)\n`);

    // Verify the changes
    console.log('📊 VERIFICATION - Checking updated records:\n');
    console.log('='.repeat(100));

    for (const booking of result.rows) {
      const verifyResult = await pool.query(
        'SELECT invitee_name, invitee_question, emergency_contact_name FROM bookings WHERE booking_id = $1',
        [booking.booking_id]
      );

      const updated = verifyResult.rows[0];
      console.log(`\n✓ ${updated.invitee_name} (ID: ${booking.booking_id})`);
      console.log(`  invitee_question NOW: ${updated.invitee_question?.substring(0, 80)}...`);
      console.log(`  emergency_contact_name: ${updated.emergency_contact_name?.substring(0, 80)}...`);
    }

    console.log('\n' + '='.repeat(100));
    console.log('✅ Data mapping completed successfully!');

  } catch (error) {
    console.error('❌ Error during data mapping:', error);
  } finally {
    await pool.end();
  }
}

mapEmergencyContactToInviteeQuestion();
