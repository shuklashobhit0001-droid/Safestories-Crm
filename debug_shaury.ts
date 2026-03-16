import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    console.log('Checking Shaury Khant bookings...\n');
    
    // Check bookings table
    const bookingsResult = await pool.query(`
      SELECT 
        invitee_name,
        invitee_email,
        invitee_phone,
        booking_host_name,
        booking_status,
        booking_start_at,
        booking_resource_name
      FROM bookings
      WHERE LOWER(invitee_name) LIKE '%shaury%'
      ORDER BY booking_start_at DESC
    `);
    
    console.log(`Found ${bookingsResult.rows.length} bookings for Shaury:`);
    bookingsResult.rows.forEach((row, i) => {
      console.log(`\n${i + 1}. ${row.invitee_name}`);
      console.log(`   Email: ${row.invitee_email}`);
      console.log(`   Phone: ${row.invitee_phone}`);
      console.log(`   Therapist: ${row.booking_host_name}`);
      console.log(`   Status: ${row.booking_status}`);
      console.log(`   Session: ${row.booking_resource_name}`);
      console.log(`   Date: ${row.booking_start_at}`);
    });
    
    // Check booking_requests table
    const requestsResult = await pool.query(`
      SELECT 
        client_name,
        client_email,
        client_whatsapp,
        therapist_name,
        therapy_type,
        created_at
      FROM booking_requests
      WHERE LOWER(client_name) LIKE '%shaury%'
      ORDER BY created_at DESC
    `);
    
    console.log(`\n\nFound ${requestsResult.rows.length} booking requests for Shaury:`);
    requestsResult.rows.forEach((row, i) => {
      console.log(`\n${i + 1}. ${row.client_name}`);
      console.log(`   Email: ${row.client_email}`);
      console.log(`   Phone: ${row.client_whatsapp}`);
      console.log(`   Therapist: ${row.therapist_name}`);
      console.log(`   Therapy: ${row.therapy_type}`);
      console.log(`   Created: ${row.created_at}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
})();
