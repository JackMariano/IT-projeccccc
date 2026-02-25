import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

export const handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    const authHeader = event.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");

    console.log("GetProfile: Request received");

    if (!token) {
      console.log("GetProfile: No token provided");
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: "No token provided" }),
      };
    }

    const jwtSecret = process.env.JWT_SECRET || 'development-secret';
    let decoded;

    try {
      decoded = jwt.verify(token, jwtSecret);
      console.log("GetProfile: Token verified for user_id:", decoded.user_id);
    } catch (err) {
      console.error("GetProfile: Token verification failed:", err.message);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: "Invalid token" }),
      };
    }

    const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

    if (!connectionString) {
      console.error("GetProfile: Database URL not configured");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ message: "Database configuration error" }),
      };
    }

    const sql = neon(connectionString);

    console.log("GetProfile: Querying user table for user_id:", decoded.user_id);

    // Get user details (only columns that exist in user table)
    const users = await sql`
      SELECT user_id, username, role
      FROM "user"
      WHERE user_id = ${decoded.user_id}
      LIMIT 1
    `;

    console.log("GetProfile: User query result count:", users.length);

    if (users.length === 0) {
      console.log("GetProfile: User not found");
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: "User not found" }),
      };
    }

    const user = users[0];
    console.log("GetProfile: User found:", user.username);

    // Get employee details (all personal info is stored here)
    const employees = await sql`
      SELECT emp_id, firstname, lastname, middlename, contactnumber, email
      FROM employee
      WHERE user_id = ${user.user_id}
      LIMIT 1
    `;

    console.log("GetProfile: Employee query result count:", employees.length);

    const profileData = {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      // All personal data comes from employee table
      first_name: employees.length > 0 ? employees[0].firstname : '',
      last_name: employees.length > 0 ? employees[0].lastname : '',
      middle_name: employees.length > 0 ? employees[0].middlename : '',
      email: employees.length > 0 ? employees[0].email : '',
      contact_number: employees.length > 0 ? employees[0].contactnumber : '',
      emp_id: employees.length > 0 ? employees[0].emp_id : null
    };

    console.log("GetProfile: Returning profile data for user:", user.username);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(profileData),
    };

  } catch (error) {
    console.error("GetProfile: Unexpected error:", error);
    console.error("GetProfile: Error stack:", error.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Server error",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      }),
    };
  }
};
