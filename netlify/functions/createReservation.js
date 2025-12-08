import { neon } from '@neondatabase/serverless';

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const {
      vehicle_id,
      customer_id,
      startdate,
      enddate,
      handled_by,
      driver_id,
    } = JSON.parse(event.body);

    const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    const sql = neon(connectionString);

    const result = await sql`
      INSERT INTO reservation (vehicle_id, customer_id, startdate, enddate, handled_by, driver_id, reserv_status)
      VALUES (${vehicle_id}, ${customer_id}, ${startdate}, ${enddate}, ${handled_by}, ${driver_id}, 'Upcoming')
      RETURNING *
    `;

    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result[0]),
    };
  } catch (error) {
    console.error("Error creating reservation:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to create reservation" }),
    };
  }
};