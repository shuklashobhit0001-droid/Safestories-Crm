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

async function checkFreeConsultationEmergencyContact() {
  try {
    console.log('Checking Free Consultation bookings - invitee_question vs emergency_contact_name...\n');

    // Get all free consultation bookings
    const result = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        invitee_email,
        invitee_phone,
        booking_resource_name,
        booking_start_at,
        invitee_question,
        emergency_contact_name,
        emergency_contact_relation,
        emergency_contact_number
      FROM bookings
      WHERE booking_resource_name ILIKE '%free consultation%'
      ORDER BY booking_start_at DESC
      LIMIT 50
    `);

    if (result.rows.length === 0) {
      console.log('❌ No free consultation bookings found');
      return;
    }

    console.log(`✅ Found ${result.rows.length} free consultation booking(s)\n`);
    console.log('='.repeat(100));

    let hasInviteeQuestion = 0;
    let hasEmergencyContact = 0;
    let hasBoth = 0;
    let hasNeither = 0;

    result.rows.forEach((booking, index) => {
      const hasQuestion = !!booking.invitee_question;
      const hasEmergency = !!booking.emergency_contact_name;

      if (hasQuestion) hasInviteeQuestion++;
      if (hasEmergency) hasEmergencyContact++;
      if (hasQuestion && hasEmergency) hasBoth++;
      if (!hasQuestion && !hasEmergency) hasNeither++;

      console.log(`\n[${index + 1}] ${booking.invitee_name}`);
      console.log(`    Booking ID: ${booking.booking_id}`);
      console.log(`    Email: ${booking.invitee_email}`);
      console.log(`    Phone: ${booking.invitee_phone}`);
      console.log(`    Date: ${booking.booking_start_at}`);
      console.log(`    Session: ${booking.booking_resource_name}`);
      console.log(`\n    📝 invitee_question: ${hasQuestion ? '✅ HAS DATA' : '❌ EMPTY'}`);
      if (hasQuestion) {
        console.log(`       Value: ${booking.invitee_question?.substring(0, 100)}${booking.invitee_question?.length > 100 ? '...' : ''}`);
      }
      console.log(`\n    🚨 emergency_contact_name: ${hasEmergency ? '✅ HAS DATA' : '❌ EMPTY'}`);
      if (hasEmergency) {
        console.log(`       Name: ${booking.emergency_contact_name}`);
        console.log(`       Relation: ${booking.emergency_contact_relation || '(empty)'}`);
        console.log(`       Number: ${booking.emergency_contact_number || '(empty)'}`);
      }
      console.log('-'.repeat(100));
    });

    console.log('\n\n📊 SUMMARY STATISTICS:');
    console.log('='.repeat(100));
    console.log(`Total Free Consultation Bookings: ${result.rows.length}`);
    console.log(`\nBookings with invitee_question: ${hasInviteeQuestion} (${((hasInviteeQuestion/result.rows.length)*100).toFixed(1)}%)`);
    console.log(`Bookings with emergency_contact_name: ${hasEmergencyContact} (${((hasEmergencyContact/result.rows.length)*100).toFixed(1)}%)`);
    console.log(`Bookings with BOTH: ${hasBoth} (${((hasBoth/result.rows.length)*100).toFixed(1)}%)`);
    console.log(`Bookings with NEITHER: ${hasNeither} (${((hasNeither/result.rows.length)*100).toFixed(1)}%)`);

    console.log('\n\n🔍 DATA ANALYSIS:');
    console.log('='.repeat(100));
    
    // Check if invitee_question contains emergency contact info
    const questionsWithEmergency = result.rows.filter(b => 
      b.invitee_question && 
      (b.invitee_question.toLowerCase().includes('emergency') || 
       b.invitee_question.toLowerCase().includes('contact'))
    );
    
    if (questionsWithEmergency.length > 0) {
      console.log(`\n📌 Found ${questionsWithEmergency.length} bookings where invitee_question mentions "emergency" or "contact":`);
      questionsWithEmergency.slice(0, 5).forEach(b => {
        console.log(`\n   ${b.invitee_name} (${b.booking_id}):`);
        console.log(`   invitee_question: ${b.invitee_question?.substring(0, 150)}...`);
        console.log(`   emergency_contact_name: ${b.emergency_contact_name || '(empty)'}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkFreeConsultationEmergencyContact();
