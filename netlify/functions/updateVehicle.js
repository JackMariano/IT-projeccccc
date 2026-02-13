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

    if (!vehicle_id) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Vehicle ID is required" }),
      };
    }

    // Filter out fields that don't exist in the database
    const validFields = ['brand', 'model', 'year', 'plate_number', 'status', 'daily_rate'];
    const filteredUpdates = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (validFields.includes(key)) {
        filteredUpdates[key] = value;
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "No valid fields to update" }),
      };
    }

    const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    const sql = neon(connectionString);

    // Build the UPDATE query dynamically
    const fields = Object.keys(filteredUpdates);
    const values = Object.values(filteredUpdates);
    
    let query = `UPDATE vehicle SET `;
    const placeholders = fields.map((field, i) => `${field} = $${i + 1}`).join(", ");
    query += placeholders + ` WHERE vehicle_id = $${fields.length + 1} RETURNING *`;

    const result = await sql.query(query, [...values, vehicle_id]);

    if (result.length === 0) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Vehicle not found" }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result[0]),
    };
  } catch (error) {
    console.error("Error updating vehicle:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to update vehicle", details: error.message }),
    };
  }
};
