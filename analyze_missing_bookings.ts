import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    console.log('🔍 Analyzing Database for Missing/Deleted Bookings...\n');
    
    // Total count
    const totalResult = await pool.query(`SELECT COUNT(*) as total FROM bookings`);
    console.log(`📊 Current Total: ${totalResult.rows[0].total} bookings\n`);
    
    // Check for duplicate booking_ids (shouldn't exist)
    const duplicatesResult = await pool.query(`
      SELECT booking_id, COUNT(*) as count
      FROM bookings
      WHERE booking_id IS NOT NULL
      GROUP BY booking_id
      HAVING COUNT(*) > 1
    `);
    
    if (duplicatesResult.rows.length > 0) {
      console.log('⚠️  DUPLICATE BOOKING IDs FOUND:');
      duplicatesResult.rows.forEach(row => {
        console.log(`   ${row.booking_id}: ${row.count} times`);
      });
      console.log();
    }
    
    // Check for NULL booking_ids
    const nullIdsResult = await pool.query(`
      SELECT COUNT(*) as null_count
      FROM bookings
      WHERE booking_id IS NULL
    `);
    
    if (parseInt(nullIdsResult.rows[0].null_count) > 0) {
      console.log(`⚠️  ${nullIdsResult.rows[0].null_count} bookings have NULL booking_id\n`);
    }
    
    // Analyze bookings by creation date (last 10 days)
    const dailyResult = await pool.query(`
      SELECT 
        DATE(invitee_created_at) as date,
        COUNT(*) as bookings_created,
        STRING_AGG(DISTINCT booking_host_name, ', ') as therapists
      FROM bookings
      WHERE invitee_created_at >= NOW() - INTERVAL '10 days'
      GROUP BY DATE(invitee_created_at)
      ORDER BY date DESC
    `);
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('📅 Bookings Created (Last 10 Days):');
    console.log('═══════════════════════════════════════════════════════\n');
    
    let previousCount = null;
    dailyResult.rows.forEach((row, index) => {
      const dateStr = row.date ? new Date(row.date).toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }) : 'Unknown';
      
      let indicator = '';
      if (previousCount !== null) {
        const diff = row.bookings_created - previousCount;
        if (diff < 0) {
          indicator = ` ⚠️  (${diff} from previous day - POSSIBLE DELETION)`;
        }
      }
      
      console.log(`   ${dateStr.padEnd(15)} ${row.bookings_created.toString().padStart(3)} bookings${indicator}`);
      previousCount = row.bookings_created;
    });
    
    // Check for bookings with unusual timestamps
    console.log('\n───────────────────────────────────────────────────────');
    console.log('🕐 Recent Bookings (Last 20):');
    console.log('───────────────────────────────────────────────────────\n');
    
    const recentResult = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        invitee_email,
        booking_host_name,
        booking_status,
        invitee_created_at,
        booking_start_at
      FROM bookings
      ORDER BY invitee_created_at DESC NULLS LAST
      LIMIT 20
    `);
    
    recentResult.rows.forEach((row, i) => {
      const createdDate = row.invitee_created_at ? 
        new Date(row.invitee_created_at).toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : 'N/A';
      
      console.log(`${(i + 1).toString().padStart(2)}. ${(row.invitee_name || 'N/A').padEnd(20)} | ${(row.booking_host_name || 'N/A').padEnd(15)}`);
      console.log(`    Status: ${row.booking_status || 'N/A'} | Created: ${createdDate}`);
      console.log(`    ID: ${row.booking_id || 'NULL'}\n`);
    });
    
    // Check for cancelled/deleted bookings
    console.log('───────────────────────────────────────────────────────');
    console.log('🗑️  Cancelled/No-Show Bookings:');
    console.log('───────────────────────────────────────────────────────\n');
    
    const cancelledResult = await pool.query(`
      SELECT 
        booking_status,
        COUNT(*) as count,
        MAX(invitee_created_at) as last_created
      FROM bookings
      WHERE booking_status IN ('cancelled', 'canceled', 'no_show', 'no show')
      GROUP BY booking_status
      ORDER BY count DESC
    `);
    
    if (cancelledResult.rows.length > 0) {
      cancelledResult.rows.forEach(row => {
        const lastDate = row.last_created ? 
          new Date(row.last_created).toLocaleDateString('en-US') : 'N/A';
        console.log(`   ${row.booking_status.padEnd(15)} ${row.count.toString().padStart(3)} booking(s) | Last: ${lastDate}`);
      });
    } else {
      console.log('   No cancelled/no-show bookings found');
    }
    
    // Summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📋 SUMMARY:');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(`   Current Total: ${totalResult.rows[0].total} bookings`);
    console.log(`   Expected (2 days ago): 144 bookings`);
    console.log(`   Missing: ${144 - parseInt(totalResult.rows[0].total)} bookings\n`);
    
    if (144 - parseInt(totalResult.rows[0].total) > 0) {
      console.log('⚠️  DATA LOSS CONFIRMED!');
      console.log('   Recommendation: Implement soft deletes immediately\n');
    }
    
    console.log('═══════════════════════════════════════════════════════\n');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
})();
