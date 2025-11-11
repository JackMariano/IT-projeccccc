import { Client } from "pg";

export const handler = async (event) => {
  if (event.httpMethod !== "POST")
    return { statusCode: 405, body: JSON.stringify({ message: "Method not allowed" }) };

  const { vehicle_id, status } = JSON.parse(event.body);
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query("UPDATE vehicle SET status = $1 WHERE vehicle_id = $2", [status, vehicle_id]);
    return { statusCode: 200, body: JSON.stringify({ message: "Status updated" }) };
  } catch (err) {
    console.error("Update error:", err);
    return { statusCode: 500, body: JSON.stringify({ message: "Database error" }) };
  } finally {
    await client.end();
  }
};
