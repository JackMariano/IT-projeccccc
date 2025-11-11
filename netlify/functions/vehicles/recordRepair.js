import { Client } from "pg";

export const handler = async (event) => {
  if (event.httpMethod !== "POST")
    return { statusCode: 405, body: JSON.stringify({ message: "Method not allowed" }) };

  const { vehicle_id, vehicle_issue, date_reported } = JSON.parse(event.body);
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query(
      "INSERT INTO repair (vehicle_id, vehicle_issue, date_reported, repair_status) VALUES ($1, $2, $3, 'Pending')",
      [vehicle_id, vehicle_issue, date_reported]
    );
    return { statusCode: 200, body: JSON.stringify({ message: "Repair recorded" }) };
  } catch (err) {
    console.error("Repair record error:", err);
    return { statusCode: 500, body: JSON.stringify({ message: "Database error" }) };
  } finally {
    await client.end();
  }
};
