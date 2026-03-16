import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    console.log('📊 Checking Total Bookings Statistics...\n');
    
    // Total bookings
    const totalResult = await pool.query(`
      SELECT COUNT(*) as total_bookings
      FROM bookings
    `);
    
    // Bookings by status
    const statusResult = await pool.query(`
      SELECT 
        booking_status,
        COUNT(*) as count
      FROM bookings
      GROUP BY booking_status
      ORDER BY count DESC
    `);
    
    // Bookings by therapist
    const therapistResult = await pool.query(`
      SELECT 
        booking_host_name,
        COUNT(*) as count
      FROM bookings
      GROUP BY booking_host_name
      ORDER BY count DESC
    `);
    
    // Bookings by month (last 6 months)
    const monthlyResult = await pool.query(`
      SELECT 
        TO_CHAR(booking_start_at, 'Mon YYYY') as month,
        COUNT(*) as count
      FROM bookings
      WHERE booking_start_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(booking_start_at, 'Mon YYYY'), DATE_TRUNC('month', booking_start_at)
      ORDER BY DATE_TRUNC('month', booking_start_at) DESC
    `);
    
    // Active bookings (confirmed, not cancelled/no-show)
    const activeResult = await pool.query(`
      SELECT COUNT(*) as active_bookings
      FROM bookings
      WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show')
    `);
    
    // Unique clients
    const clientsResult = await pool.query(`
      SELECT COUNT(DISTINCT invitee_email) as unique_clients
      FROM bookings
      WHERE invitee_email IS NOT NULL
    `);
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('                  BOOKING STATISTICS                   ');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log(`📅 Total Bookings (All Time): ${totalResult.rows[0].total_bookings}`);
    console.log(`✅ Active Bookings: ${activeResult.rows[0].active_bookings}`);
    console.log(`👥 Unique Clients: ${clientsResult.rows[0].unique_clients}\n`);
    
    console.log('───────────────────────────────────────────────────────');
    console.log('📊 Bookings by Status:');
    console.log('───────────────────────────────────────────────────────');
    statusResult.rows.forEach(row => {
      const status = row.booking_status || 'NULL';
      const percentage = ((row.count / totalResult.rows[0].total_bookings) * 100).toFixed(1);
      console.log(`   ${status.padEnd(20)} ${row.count.toString().padStart(5)} (${percentage}%)`);
    });
    
    console.log('\n───────────────────────────────────────────────────────');
    console.log('👨‍⚕️ Bookings by Therapist:');
    console.log('───────────────────────────────────────────────────────');
    therapistResult.rows.forEach(row => {
      const therapist = row.booking_host_name || 'Unknown';
      const percentage = ((row.count / totalResult.rows[0].total_bookings) * 100).toFixed(1);
      console.log(`   ${therapist.padEnd(25)} ${row.count.toString().padStart(5)} (${percentage}%)`);
    });
    
    console.log('\n───────────────────────────────────────────────────────');
    console.log('📆 Bookings by Month (Last 6 Months):');
    console.log('───────────────────────────────────────────────────────');
    monthlyResult.rows.forEach(row => {
      console.log(`   ${row.month.padEnd(15)} ${row.count.toString().padStart(5)} bookings`);
    });
    
    console.log('\n═══════════════════════════════════════════════════════\n');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
})();
