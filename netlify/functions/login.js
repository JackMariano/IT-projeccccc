// netlify/functions/login.cjs
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const handler = async (event) => {
  console.log("=== LOGIN FUNCTION START ===");
  
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    console.log("OPTIONS preflight request");
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    console.log(`Method not allowed: ${event.httpMethod}`);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    const { username, password } = JSON.parse(event.body);
    console.log("Login attempt for username:", username);

    if (!username || !password) {
      console.log("Missing username or password");
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Missing username or password" }),
      };
    }

    if (!process.env.DATABASE_URL && !process.env.NETLIFY_DATABASE_URL) {
      console.error("Database URL not configured");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          message: "Server configuration error",
          error: "Database URL not configured" 
        }),
      };
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT secret not configured");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          message: "Server configuration error",
          error: "JWT secret not configured" 
        }),
      };
    }

    const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    const sql = neon(connectionString);
    
    console.log("Querying database for user:", username);
    const users = await sql`
      SELECT * FROM "user" 
      WHERE username = ${username}
    `;
    
    if (!users || users.length === 0) {
      console.log("User not found in database");
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: "Invalid username or password" }),
      };
    }

    const user = users[0];
    console.log("User found:", { 
      user_id: user.user_id, 
      username: user.username, 
      role: user.role 
    });

    console.log("Verifying password...");
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log("Invalid password");
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: "Invalid username or password" }),
      };
    }

    // CRITICAL: Update user state AND last_login timestamp
    // This will invalidate any older tokens/sessions
    console.log("Updating user state and last_login...");
    await sql`
      UPDATE "user" 
      SET state = 1, last_login = NOW()
      WHERE user_id = ${user.user_id}
    `;
    
    console.log("User state updated to 1, last_login set to current time");

    // Create token with iat (issued at) timestamp
    const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds
    const tokenPayload = {
      user_ID: user.user_id,
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      iat: currentTimestamp, // Include issued at timestamp
    };
    
    console.log("Creating JWT token with payload:", {
      ...tokenPayload,
      iat_human: new Date(currentTimestamp * 1000).toISOString()
    });
    
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // Extended to 24h for better user experience
    );
    
    console.log("✅ Login successful for user:", user.username);
    console.log("Token generated, length:", token.length);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        token,
        user_ID: user.user_id,
        username: user.username,
        role: user.role,
        message: "Login successful",
        // Include timestamp for debugging
        timestamp: new Date().toISOString(),
      }),
    };

  } catch (error) {
    console.error("Login error:", error);
    console.error("Error stack:", error.stack);
    
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Internal server error",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
    };
  } finally {
    console.log("=== LOGIN FUNCTION END ===");
  }
};