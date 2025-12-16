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
    const { reservation_id, ...updates } = JSON.parse(event.body);

    const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    const sql = neon(connectionString);

    const fields = Object.keys(updates);
    const values = Object.values(updates);
    
    const setClauses = [];
    let paramIndex = 1;
    fields.forEach(field => {
      setClauses.push(`${field} = $${paramIndex}`);
      paramIndex++;
    });
    
    const query = `
      UPDATE reservation 
      SET ${setClauses.join(", ")}
      WHERE reservation_id = $${paramIndex}
      RETURNING *
    `;

    const result = await sql(query, [...values, reservation_id]);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result[0]),
    };
  } catch (error) {
    console.error("Error updating reservation:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to update reservation" }),
    };
  }
};