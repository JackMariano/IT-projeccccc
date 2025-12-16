import { neon } from '@neondatabase/serverless';

export const handler = async (event) => {
  if (event.httpMethod !== "PUT") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { vehicle_id, ...updates } = JSON.parse(event.body);

    const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    const sql = neon(connectionString);

    // Build the UPDATE query dynamically
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    
    let query = `UPDATE vehicle SET `;
    const placeholders = fields.map((field, i) => `${field} = $${i + 1}`).join(", ");
    query += placeholders + ` WHERE vehicle_id = $${fields.length + 1} RETURNING *`;

    const result = await sql.query(query, [...values, vehicle_id]);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.rows[0]),
    };
  } catch (error) {
    console.error("Error updating vehicle:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to update vehicle" }),
    };
  }
};