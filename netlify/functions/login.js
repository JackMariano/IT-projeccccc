// netlify/functions/login.cjs - UPDATED FOR YOUR TABLE STRUCTURE
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

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

    // Generate a secure session ID
    const sessionId = 'sess_' + crypto.randomBytes(32).toString('hex');
    console.log("Generated session ID:", sessionId);
    
    // CRITICAL: Update user state AND last_login timestamp
    console.log("Updating user state and last_login...");
    await sql`
      UPDATE "user" 
      SET state = 1, last_login = NOW()
      WHERE user_id = ${user.user_id}
    `;
    console.log("User state updated to 1, last_login set to current time");

    // Handle user_sessions table - using ONLY existing columns
    try {
      // 1. Delete any existing sessions for this user
      const deletedSessions = await sql`
        DELETE FROM user_sessions 
        WHERE user_id = ${user.user_id}
        RETURNING session_id
      `;
      
      if (deletedSessions.length > 0) {
        console.log(`Cleared ${deletedSessions.length} existing session(s) for user ${user.user_id}`);
      }
      
      // 2. Insert new session - using ONLY columns that exist: session_id, user_id, created_at
      await sql`
        INSERT INTO user_sessions (session_id, user_id, created_at)
        VALUES (${sessionId}, ${user.user_id}, NOW())
      `;
      
      console.log("✅ Session saved to user_sessions table");
      
    } catch (sessionError) {
      console.error("Session handling error:", sessionError.message);
      
      // If table doesn't exist or has wrong structure, create it with minimal columns
      if (sessionError.message.includes('relation "user_sessions" does not exist') || 
          sessionError.message.includes('column') || 
          sessionError.message.includes('does not exist')) {
        
        console.log("Creating/updating user_sessions table with minimal structure...");
        
        try {
          // Drop and recreate with correct structure
          await sql`
            CREATE TABLE IF NOT EXISTS user_sessions (
              session_id VARCHAR(255) PRIMARY KEY,
              user_id INTEGER NOT NULL,
              created_at TIMESTAMP DEFAULT NOW()
            )
          `;
          
          console.log("✅ user_sessions table created/verified");
          
          // Try insert again
          await sql`
            INSERT INTO user_sessions (session_id, user_id)
            VALUES (${sessionId}, ${user.user_id})
          `;
          
          console.log("✅ Session inserted after table creation");
          
        } catch (createError) {
          console.error("Failed to create/update table:", createError.message);
          // Continue without session in database - JWT will still work
        }
      }
    }

    // Create token with session_id included
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const tokenPayload = {
      user_ID: user.user_id,
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      session_id: sessionId, // Include session ID in JWT
      iat: currentTimestamp,
    };
    
    console.log("Creating JWT token with payload:", {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      session_id: sessionId,
      iat_human: new Date(currentTimestamp * 1000).toISOString()
    });
    
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log("✅ Login successful for user:", user.username);
    console.log("Token generated, length:", token.length);
    console.log("Session ID:", sessionId);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        token,
        session_id: sessionId, // Include session ID in response
        user_ID: user.user_id,
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        message: "Login successful",
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