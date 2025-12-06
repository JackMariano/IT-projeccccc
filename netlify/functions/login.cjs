import { Client } from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const handler = async (event) => {
  console.log("Login function called with:", event.body);
  
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  let client;
  try {
    const { username, password, force } = JSON.parse(event.body);

    if (!username || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing username or password" }),
      };
    }

    console.log("Attempting database connection...");
    
    // Use connection string directly (test with this first)
    const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.error("No database connection string found");
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Database configuration error" }),
      };
    }

    console.log("Connection string found, connecting...");
    
    client = new Client({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    await client.connect();
    console.log("Database connected successfully");

    // Fetch user by username
    console.log(`Fetching user: ${username}`);
    const res = await client.query('SELECT * FROM "user" WHERE username = $1', [username]);
    
    if (res.rows.length === 0) {
      console.log("User not found");
      return { 
        statusCode: 401, 
        body: JSON.stringify({ message: "Invalid username or password" }) 
      };
    }

    const user = res.rows[0];
    console.log("User found:", user.user_id);

    // Validate password
    console.log("Validating password...");
    const valid = await bcrypt.compare(password, user.password);
    
    if (!valid) {
      console.log("Invalid password");
      return { 
        statusCode: 401, 
        body: JSON.stringify({ message: "Invalid username or password" }) 
      };
    }

    // Check if user is already logged in
    if (user.state === 1) {
      if (!force) {
        console.log("User already logged in elsewhere");
        return {
          statusCode: 403,
          body: JSON.stringify({
            message: "User is already logged in elsewhere",
            alreadyLoggedIn: true,
          }),
        };
      } else {
        // Force logout previous session
        console.log("Force logging out previous session");
        await client.query('UPDATE "user" SET state = 0 WHERE "user_id" = $1', [user.user_id]);
      }
    }

    // Set state to logged in
    console.log("Updating user state to logged in");
    await client.query('UPDATE "user" SET state = 1 WHERE "user_id" = $1', [user.user_id]);

    // Check JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not set");
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Server configuration error" }),
      };
    }

    // Generate JWT token
    console.log("Generating JWT token");
    const token = jwt.sign(
      { 
        user_id: user.user_id, 
        role: user.role, 
        username: user.username 
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    console.log("Login successful for user:", user.username);
    
    // Return user data + token (match frontend keys)
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        token,
        user_ID: user.user_id,
        username: user.username,
        role: user.role,
      }),
    };

  } catch (err) {
    console.error("Login error:", err);
    return { 
      statusCode: 500, 
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ 
        message: "Server error",
        error: err.message 
      }) 
    };
  } finally {
    if (client) {
      try {
        await client.end();
        console.log("Database connection closed");
      } catch (endErr) {
        console.error("Error closing connection:", endErr);
      }
    }
  }
};