import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function backfill() {
  const { rows } = await pool.query(`
    SELECT booking_id FROM bookings
    WHERE booking_id IS NOT NULL
      AND (public_booking_checkin_url IS NULL OR public_booking_checkin_url = '')
  `);

  console.log(`Found ${rows.length} bookings missing public_booking_checkin_url`);

  let updated = 0;
  for (const row of rows) {
    const url = `https://dashboard.safestories.in/booking-confirmation/${row.booking_id}`;
    await pool.query(
      'UPDATE bookings SET public_booking_checkin_url = $1 WHERE booking_id = $2',
      [url, row.booking_id]
    );
    updated++;
  }

  console.log(`Done. Updated ${updated} bookings.`);
  await pool.end();
}

backfill().catch(err => {
  console.error(err);
  process.exit(1);
});
