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

async function deleteEmergencyContactFromFreeConsultations() {
  try {
    console.log('Deleting emergency_contact_name from Free Consultation bookings...\n');
    console.log('='.repeat(100));

    // Step 1: Get current data before deletion
    const beforeQuery = `
      SELECT 
        booking_id,
        invitee_name,
        invitee_question,
        emergency_contact_name,
        emergency_contact_relation,
        emergency_contact_number
      FROM bookings
      WHERE booking_resource_name ILIKE '%free consultation%'
        AND (emergency_contact_name IS NOT NULL AND emergency_contact_name != '')
      ORDER BY booking_start_at DESC
    `;

    const beforeResult = await pool.query(beforeQuery);

    console.log(`📋 Found ${beforeResult.rows.length} booking(s) to update\n`);

    // Step 2: Perform the deletion (set to NULL)
    const deleteQuery = `
      UPDATE bookings
      SET 
        emergency_contact_name = NULL,
        emergency_contact_relation = NULL,
        emergency_contact_number = NULL
      WHERE booking_resource_name ILIKE '%free consultation%'
        AND (emergency_contact_name IS NOT NULL AND emergency_contact_name != '')
    `;

    const deleteResult = await pool.query(deleteQuery);

    console.log(`✅ Successfully cleared emergency contact data from ${deleteResult.rowCount} booking(s)\n`);

    // Step 3: Verify the changes
    console.log('📊 VERIFICATION - Checking updated records:\n');
    console.log('='.repeat(100));

    for (const booking of beforeResult.rows) {
      const verifyResult = await pool.query(
        `SELECT 
          booking_id,
          invitee_name,
          invitee_question,
          emergency_contact_name,
          emergency_contact_relation,
          emergency_contact_number
        FROM bookings 
        WHERE booking_id = $1`,
        [booking.booking_id]
      );

      const updated = verifyResult.rows[0];
      console.log(`\n✓ ${updated.invitee_name} (ID: ${booking.booking_id})`);
      console.log(`  invitee_question: ${updated.invitee_question?.substring(0, 60)}...`);
      console.log(`  emergency_contact_name: ${updated.emergency_contact_name || '✅ NULL (deleted)'}`);
      console.log(`  emergency_contact_relation: ${updated.emergency_contact_relation || '✅ NULL (deleted)'}`);
      console.log(`  emergency_contact_number: ${updated.emergency_contact_number || '✅ NULL (deleted)'}`);
    }

    console.log('\n' + '='.repeat(100));
    console.log('✅ DELETION COMPLETED SUCCESSFULLY!');
    console.log('\nSummary:');
    console.log(`  - Cleared emergency contact data from ${deleteResult.rowCount} free consultation bookings`);
    console.log(`  - invitee_question data preserved for all bookings`);
    console.log(`  - Emergency contact fields now NULL for free consultations`);

  } catch (error) {
    console.error('❌ Error during deletion:', error);
  } finally {
    await pool.end();
  }
}

deleteEmergencyContactFromFreeConsultations();
