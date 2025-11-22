import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { fuel, mileage, plate, issue, handledby_ID } = JSON.parse(event.body);

    // 1. Get vehicle_ID from plate number
    const vehicleQuery = `
      SELECT "vehicle_ID" 
      FROM "vehicle" 
      WHERE "plate_number" = $1
    `;
    const vehicleResult = await pool.query(vehicleQuery, [plate]);

    if (vehicleResult.rowCount === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Vehicle not found" }),
      };
    }

    const vehicle_ID = vehicleResult.rows[0].vehicle_ID;

    // 2. Insert into notification table
    const insertQuery = `
      INSERT INTO "notification" ("vehicle_ID", "handledby_ID", "fuel", "mileage", "issue", "timestamp")
      VALUES ($1, $2, $3, $4, $5, NOW())
    `;

    await pool.query(insertQuery, [
      vehicle_ID,
      handledby_ID || null,
      fuel,
      mileage,
      issue || null,
    ]);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Notification sent successfully" }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Internal Server Error" };
  }
}
