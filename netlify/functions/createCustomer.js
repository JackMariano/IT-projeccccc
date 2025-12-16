import { neon } from '@neondatabase/serverless';

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { fullname, contactNumber, email } = JSON.parse(event.body);

    if (!fullname || !contactNumber) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Full name and contact number are required" }),
      };
    }

    const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    const sql = neon(connectionString);

    // Check if customer already exists with same contact number
    const existingCustomer = await sql`
      SELECT customer_id 
      FROM customer 
      WHERE contactNumber = ${contactNumber}
      LIMIT 1
    `;

    if (existingCustomer.length > 0) {
      return {
        statusCode: 200, // Return 200 since customer already exists
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          customer_id: existingCustomer[0].customer_id,
          message: "Customer already exists" 
        }),
      };
    }

    // Create new customer
    const result = await sql`
      INSERT INTO customer (fullname, contactNumber, email)
      VALUES (${fullname}, ${contactNumber}, ${email || null})
      RETURNING customer_id
    `;

    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        customer_id: result[0].customer_id,
        message: "Customer created successfully" 
      }),
    };
  } catch (error) {
    console.error("Error creating customer:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to create customer" }),
    };
  }
};