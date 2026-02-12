import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { 
      username, 
      password, 
      firstName, 
      middleName, 
      lastName, 
      contactNumber,
      email 
    } = JSON.parse(event.body);

    // Validate required fields
    if (!username || !password || !firstName || !lastName) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Username, password, first name, and last name are required" }),
      };
    }

    const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    
    if (!connectionString) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Database connection not configured" }),
      };
    }

    const sql = neon(connectionString);

    // Check if username already exists
    const existingUser = await sql`
      SELECT user_id 
      FROM "user" 
      WHERE username = ${username}
      LIMIT 1
    `;

    if (existingUser.length > 0) {
      return {
        statusCode: 409,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Username already exists" }),
      };
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user record with role 'Driver'
    const userResult = await sql`
      INSERT INTO "user" (username, password, role, state)
      VALUES (${username}, ${hashedPassword}, 'Driver', 0)
      RETURNING user_id
    `;

    const userId = userResult[0].user_id;

    // Create employee record linked to the user
    const employeeResult = await sql`
      INSERT INTO employee (user_id, firstname, lastname, middlename, contactnumber, email)
      VALUES (${userId}, ${firstName}, ${lastName}, ${middleName || ''}, ${contactNumber || ''}, ${email || null})
      RETURNING emp_id
    `;

    return {
      statusCode: 201,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: JSON.stringify({ 
        user_id: userId,
        emp_id: employeeResult[0].emp_id,
        username: username,
        role: 'Driver',
        message: "Driver created successfully" 
      }),
    };
  } catch (error) {
    console.error("Error creating driver:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        error: "Failed to create driver",
        details: error.message 
      }),
    };
  }
};
