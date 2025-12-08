import { neon } from '@neondatabase/serverless';

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    const sql = neon(connectionString);

    const vehicles = await sql`
      SELECT 
        vehicle_id,
        brand,
        model,
        plate_number,
        status,
        COALESCE((SELECT current_odometer FROM usage_log WHERE vehicle_id = v.vehicle_id ORDER BY timestamp DESC LIMIT 1), 0) as odometer
      FROM vehicle v
      ORDER BY plate_number
    `;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicles }),
    };
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to fetch vehicles" }),
    };
  }
};