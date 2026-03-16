import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    console.log('🔍 Analyzing Database for Missing Data Patterns...\n');
    
    // Check for gaps in booking IDs
    const idGapsResult = await pool.query(`
      SELECT 
        id,
        id - LAG(id) OVER (ORDER BY id) as gap
      FROM bookings
      ORDER BY id
    `);
    
    const gaps = idGapsResult.rows.filter(row => row.gap && row.gap > 1);
    
    if (gaps.length > 0) {
      console.log('⚠️  GAPS FOUND IN BOOKING IDs (Possible Deletions):');
      console.log('═══════════════════════════════════════════════════════\n');
      gaps.forEach(gap => {
        console.log(`   Missing IDs between ${gap.id - gap.gap} and ${gap.id}`);
        console.log(`   Gap size: ${gap.gap - 1} booking(s)\n`);
      });
    } else {
      console.log('✅ No gaps found in booking IDs (sequential)\n');
    }
    
    // Check for unusual patterns in created_at timestamps
    const timeGapsResult = await pool.query(`
      SELECT 
        id,
        invitee_name,
        invitee_email,
        booking_start_at,
        invitee_created_at,
        booking_status
      FROM bookings
      ORDER BY invitee_created_at DESC
      LIMIT 20
    `);
    
    console.log('───────────────────────────────────────────────────────');
    console.log('📅 Most Recent 20 Bookings (by creation time):');
    console.log('───────────────────────────────────────────────────────\n');
    timeGapsResult.rows.forEach((row, i) => {
      console.log(`${(i + 1).toString().padStart(2)}. ID: ${row.id.toString().padStart(4)} | ${row.invitee_name?.padEnd(20) || 'N/A'.padEnd(20)} | ${row.booking_status || 'N/A'}`);
      console.log(`    Created: ${row.invitee_created_at}`);
      console.log(`    Session: ${row.booking_start_at}\n`);
    });
    
    // Check for deleted/cancelled bookings
    const deletedResult = await pool.query(`
      SELECT 
        booking_status,
        COUNT(*) as count,
        MAX(invitee_created_at) as last_occurrence
      FROM bookings
      WHERE booking_status IN ('cancelled', 'canceled', 'no_show', 'no show', 'deleted')
      GROUP BY booking_status
    `);
    
    if (deletedResult.rows.length > 0) {
      console.log('───────────────────────────────────────────────────────');
      console.log('🗑️  Cancelled/No-Show Bookings:');
      console.log('───────────────────────────────────────────────────────\n');
      deletedResult.rows.forEach(row => {
        console.log(`   ${row.booking_status}: ${row.count} booking(s)`);
        console.log(`   Last: ${row.last_occurrence}\n`);
      });
    }
    
    // Check min and max IDs
    const rangeResult = await pool.query(`
      SELECT 
        MIN(id) as min_id,
        MAX(id) as max_id,
        MAX(id) - MIN(id) + 1 as expected_count,
        COUNT(*) as actual_count,
        (MAX(id) - MIN(id) + 1) - COUNT(*) as missing_count
      FROM bookings
    `);
    
    console.log('───────────────────────────────────────────────────────');
    console.log('📊 ID Range Analysis:');
    console.log('───────────────────────────────────────────────────────\n');
    const range = rangeResult.rows[0];
    console.log(`   Min ID: ${range.min_id}`);
    console.log(`   Max ID: ${range.max_id}`);
    console.log(`   Expected Count (if sequential): ${range.expected_count}`);
    console.log(`   Actual Count: ${range.actual_count}`);
    console.log(`   Missing/Deleted: ${range.missing_count} booking(s)\n`);
    
    if (range.missing_count > 0) {
      console.log('⚠️  WARNING: There are missing IDs in the sequence!');
      console.log('   This indicates bookings were deleted from the database.\n');
      
      // Find exact missing IDs
      const missingIdsResult = await pool.query(`
        SELECT generate_series AS missing_id
        FROM generate_series(
          (SELECT MIN(id) FROM bookings),
          (SELECT MAX(id) FROM bookings)
        )
        WHERE generate_series NOT IN (SELECT id FROM bookings)
        ORDER BY generate_series
      `);
      
      if (missingIdsResult.rows.length > 0 && missingIdsResult.rows.length <= 20) {
        console.log('   Missing Booking IDs:');
        missingIdsResult.rows.forEach(row => {
          console.log(`   - ID: ${row.missing_id}`);
        });
        console.log();
      } else if (missingIdsResult.rows.length > 20) {
        console.log(`   Too many missing IDs to display (${missingIdsResult.rows.length} total)\n`);
      }
    }
    
    // Check for bookings created yesterday vs today
    const recentResult = await pool.query(`
      SELECT 
        DATE(invitee_created_at) as date,
        COUNT(*) as bookings_created
      FROM bookings
      WHERE invitee_created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(invitee_created_at)
      ORDER BY date DESC
    `);
    
    console.log('───────────────────────────────────────────────────────');
    console.log('📈 Bookings Created (Last 7 Days):');
    console.log('───────────────────────────────────────────────────────\n');
    recentResult.rows.forEach(row => {
      console.log(`   ${row.date}: ${row.bookings_created} booking(s) created`);
    });
    
    console.log('\n═══════════════════════════════════════════════════════\n');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
})();
