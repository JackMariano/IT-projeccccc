import { neon } from '@neondatabase/serverless';

export const handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Check for authentication token
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized" }),
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

    // Fetch employees with their basic information
    const employees = await sql`
      SELECT 
        emp_id,
        user_id,
        firstname,
        lastname,
        middlename,
        contactnumber,
        email
      FROM employee 
      ORDER BY lastname ASC, firstname ASC
    `;

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Authorization, Content-Type"
      },
      body: JSON.stringify({ employees }),
    };
  } catch (error) {
    console.error("Database error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch employees", details: error.message }),
    };
  }
};