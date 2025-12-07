// netlify/functions/getDriverTrips.js
import { neon } from '@neondatabase/serverless';

export const handler = async (event) => {
  const driver_id = event.queryStringParameters?.driver_id;

  if (!driver_id) {
    return { 
      statusCode: 400, 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: "Missing driver_id" }) 
    };
  }

  try {
    // Initialize Neon client
    const sql = neon(process.env.DATABASE_URL);

    // Execute query with Neon's tagged template syntax
    const result = await sql`
      SELECT 
        r.reservation_id,
        r.startdate,
        r.enddate,
        r.reserv_status,
        r.vehicle_id,
        r.customer_id,
        v.brand,
        v.model,
        v.plate_number,
        c.fullname AS customer_name,
        c.contactnumber AS customer_contact
      FROM reservation r
      LEFT JOIN vehicle v ON r.vehicle_id = v.vehicle_id
      LEFT JOIN customer c ON r.customer_id = c.customer_id
      WHERE r.driver_id = ${driver_id}
      ORDER BY r.startdate ASC
    `;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error("Error fetching driver trips:", err);
    return { 
      statusCode: 500, 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: "Server Error" }) 
    };
  }
};