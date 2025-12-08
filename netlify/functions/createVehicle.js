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
    const { brand, model, plate_number, vehicle_type, status } = JSON.parse(
      event.body
    );

    const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    const sql = neon(connectionString);

    const result = await sql`
      INSERT INTO vehicle (brand, model, plate_number, vehicle_type, status, archived)
      VALUES (${brand}, ${model}, ${plate_number}, ${vehicle_type}, ${status}, false)
      RETURNING *
    `;

    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result[0]),
    };
  } catch (error) {
    console.error("Error creating vehicle:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to create vehicle" }),
    };
  }
};