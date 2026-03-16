import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    console.log('Testing API logic for Shaury...\n');
    
    const result = await pool.query(`
      SELECT 
        invitee_name,
        invitee_phone,
        invitee_email,
        booking_host_name,
        booking_resource_name,
        booking_status,
        booking_mode,
        CASE 
          WHEN booking_status IN ('cancelled', 'canceled', 'no_show', 'no show') THEN 0
          ELSE 1
        END as session_count,
        invitee_created_at as created_at,
        booking_start_at as latest_booking_date,
        booking_invitee_time
      FROM bookings
      WHERE LOWER(invitee_name) LIKE '%shaury%'
      
      UNION ALL
      
      SELECT 
        client_name as invitee_name,
        client_whatsapp as invitee_phone,
        client_email as invitee_email,
        therapist_name as booking_host_name,
        therapy_type as booking_resource_name,
        NULL as booking_status,
        NULL as booking_mode,
        0 as session_count,
        created_at,
        created_at as latest_booking_date,
        NULL as booking_invitee_time
      FROM booking_requests
      WHERE LOWER(client_name) LIKE '%shaury%'
    `);
    
    console.log(`Total rows: ${result.rows.length}\n`);
    
    // Simulate the grouping logic
    const clientMap = new Map();
    const emailToKey = new Map();
    const phoneToKey = new Map();
    
    result.rows.forEach((row, index) => {
      const email = row.invitee_email ? row.invitee_email.toLowerCase().trim() : null;
      const phone = row.invitee_phone ? row.invitee_phone.replace(/[\s\-\(\)\+]/g, '') : null;
      
      console.log(`\nRow ${index + 1}:`);
      console.log(`  Name: ${row.invitee_name}`);
      console.log(`  Email: ${email}`);
      console.log(`  Phone: ${phone}`);
      console.log(`  Session Count: ${row.session_count}`);
      console.log(`  Status: ${row.booking_status || 'N/A'}`);
      
      let key = null;
      
      // Find existing key by phone (primary) or email (fallback)
      if (phone && phoneToKey.has(phone)) {
        key = phoneToKey.get(phone);
        console.log(`  -> Found existing by PHONE, key: ${key}`);
        if (email && !emailToKey.has(email)) {
          emailToKey.set(email, key);
        }
      } else if (email && emailToKey.has(email)) {
        key = emailToKey.get(email);
        console.log(`  -> Found existing by EMAIL, key: ${key}`);
        if (phone && !phoneToKey.has(phone)) {
          phoneToKey.set(phone, key);
        }
      } else {
        key = phone || email;
        console.log(`  -> NEW CLIENT, key: ${key}`);
      }
      
      if (!key) return;
      
      // Track mappings
      if (email) emailToKey.set(email, key);
      if (phone) phoneToKey.set(phone, key);
      
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          invitee_name: row.invitee_name,
          session_count: 0
        });
      }
      
      const client = clientMap.get(key);
      const addCount = parseInt(row.session_count) || 0;
      client.session_count += addCount;
      console.log(`  -> Adding ${addCount} to count, new total: ${client.session_count}`);
    });
    
    console.log('\n\n=== FINAL RESULT ===');
    clientMap.forEach((client, key) => {
      console.log(`Key: ${key}`);
      console.log(`Name: ${client.invitee_name}`);
      console.log(`Total Sessions: ${client.session_count}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
})();
