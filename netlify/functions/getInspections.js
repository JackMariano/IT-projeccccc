import { neon } from "@neondatabase/serverless";

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const connectionString =
      process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    const sql = neon(connectionString);

    const inspections = await sql`
      SELECT
        i.inspection_id,
        i.vehicle_id,
        i.inspection_type,
        i.scheduled_date,
        i.status,
        i.odometer,
        v.brand,
        v.model,
        v.year,
        v.plate_number
      FROM inspections AS i
      JOIN vehicle AS v ON i.vehicle_id = v.vehicle_id
      ORDER BY i.scheduled_date DESC;
    `;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inspections }),
    };
  } catch (error) {
    console.error("Error fetching inspections:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Failed to fetch inspections",
        details: error.message,
      }),
    };
  }
};
