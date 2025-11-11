import { Client } from "pg";

export const handler = async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const result = await client.query(
      `SELECT vehicle_id, brand, model, year, plate_number, status, vehicle_img, current_branchid
       FROM vehicle ORDER BY vehicle_id`
    );
    return { statusCode: 200, body: JSON.stringify(result.rows) };
  } catch (err) {
    console.error("Error fetching vehicles:", err);
    return { statusCode: 500, body: JSON.stringify({ message: "Database error" }) };
  } finally {
    await client.end();
  }
};
