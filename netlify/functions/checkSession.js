// netlify/functions/checkSession.js - SIMPLIFIED
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

export const handler = async (event) => {
  console.log("=== CHECK SESSION ===");
  
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    // Extract token from Authorization header (like other functions)
    const authHeader = event.headers.authorization || "";
    let token = authHeader.replace("Bearer ", "");
    
    // Fallback: try body if header not present
    if (!token) {
      const body = JSON.parse(event.body || '{}');
      token = body.token;
    }
    
    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          valid: false, 
          message: "No token" 
        }),
      };
    }

    // Verify JWT
    const jwtSecret = process.env.JWT_SECRET || 'development-secret';
    let decoded;
    
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          valid: false, 
          message: "Invalid token" 
        }),
      };
    }

    const sql = neon(process.env.DATABASE_URL);
    
    // Get user
    const users = await sql`
      SELECT user_id, username, role, state 
      FROM "user" 
      WHERE user_id = ${decoded.user_id}
      LIMIT 1
    `;
    
    if (users.length === 0 || users[0].state !== 1) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          valid: false, 
          message: "Invalid session" 
        }),
      };
    }

    const user = users[0];
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        valid: true,
        user: {
          user_ID: user.user_id,
          user_id: user.user_id,
          username: user.username,
          role: user.role
        },
        message: "Session valid"
      }),
    };

  } catch (error) {
    console.error("Session check error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        valid: false,
        message: "Server error"
      }),
    };
  }
};