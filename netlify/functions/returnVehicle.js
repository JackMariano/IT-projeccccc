import { neon } from '@neondatabase/serverless';

export const handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { reservation_id, vehicle_id } = JSON.parse(event.body);

    if (!reservation_id || !vehicle_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "reservation_id and vehicle_id are required" }),
      };
    }

    const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    const sql = neon(connectionString);

    // Mark reservation as Completed
    await sql`
      UPDATE reservation
      SET reserv_status = 'Completed'
      WHERE reservation_id = ${reservation_id}
    `;

    // Set vehicle back to available
    await sql`
      UPDATE vehicle
      SET status = 'available'
      WHERE vehicle_id = ${vehicle_id}
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: "Vehicle returned successfully" }),
    };
  } catch (error) {
    console.error("Error returning vehicle:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to return vehicle", details: error.message }),
    };
  }
};
