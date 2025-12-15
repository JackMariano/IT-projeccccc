import { neon } from '@neondatabase/serverless';

export const handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Database connection string not configured" }),
    };
  }

  try {
    const sql = neon(connectionString);

    const customers = await sql`
      SELECT 
        customer_id as id,
        fullname as name,
        email,
        contactnumber as phone
      FROM customer 
      ORDER BY fullname ASC
    `;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customers }),
    };
  } catch (error) {
    console.error("Database error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Failed to fetch customers",
        details: error.message
      }),
    };
  }
};