import { neon } from "@neondatabase/serverless";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { vehicle_id, inspection_type, scheduled_date, status, odometer } = JSON.parse(
      event.body,
    );

    // Validate required fields
    if (!vehicle_id || !inspection_type || !scheduled_date || !status) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Vehicle ID, inspection type, scheduled date, and status are required",
        }),
      };
    }

    const connectionString =
      process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    const sql = neon(connectionString);

    const result = await sql`
      INSERT INTO inspections (vehicle_id, inspection_type, scheduled_date, status, odometer)
      VALUES (${vehicle_id}, ${inspection_type}, ${scheduled_date}, ${status}, ${odometer || null})
      RETURNING *
    `;

    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result[0]),
    };
  } catch (error) {
    console.error("Error creating inspection:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Failed to create inspection",
        details: error.message,
      }),
    };
  }
};
