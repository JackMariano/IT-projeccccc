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
    const { brand, model, plate_number, year, daily_rate, status } = JSON.parse(
      event.body,
    );

    // Validate required fields
    if (!brand || !model || !plate_number) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Brand, model, and plate number are required",
        }),
      };
    }

    const connectionString =
      process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    const sql = neon(connectionString);

    // Check if plate number already exists
    const existingVehicle = await sql`
      SELECT vehicle_id FROM vehicle WHERE plate_number = ${plate_number}
    `;

    if (existingVehicle.length > 0) {
      return {
        statusCode: 409,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "A vehicle with this plate number already exists",
        }),
      };
    }

    const result = await sql`
      INSERT INTO vehicle (brand, model, year, plate_number, status, daily_rate)
      VALUES (${brand}, ${model}, ${year || new Date().getFullYear()}, ${plate_number}, ${status || "Available"}, ${daily_rate || 0})
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
      body: JSON.stringify({
        error: "Failed to create vehicle",
        details: error.message,
      }),
    };
  }
};
