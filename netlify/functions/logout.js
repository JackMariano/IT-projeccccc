// netlify/functions/logout.cjs
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

export const handler = async (event) => {
  console.log("=== LOGOUT FUNCTION START ===");
  
  // Enable CORS
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle OPTIONS preflight
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

  // Extract token from Authorization header
  const authHeader = event.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  console.log("Auth header present:", !!authHeader);
  console.log("Token extracted:", token ? "Yes" : "No");

  if (!token) {
    console.log("No token provided for logout");
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ 
        success: false,
        message: "No token provided" 
      }),
    };
  }

  try {
    // Check for JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not configured");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false,
          message: "Server configuration error" 
        }),
      };
    }

    let decoded;
    try {
      // Try to verify the token
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token verified successfully:", {
        user_id: decoded.user_id || decoded.user_ID,
        username: decoded.username,
        role: decoded.role,
        iat: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : 'No iat'
      });
    } catch (verifyError) {
      // If verification fails (expired, invalid), try to decode without verification
      console.warn("Token verification failed, attempting decode:", verifyError.message);
      decoded = jwt.decode(token);
      
      if (!decoded) {
        console.error("Token cannot be decoded");
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ 
            success: false,
            message: "Invalid token format" 
          }),
        };
      }
      
      console.log("Token decoded (not verified):", {
        user_id: decoded.user_id || decoded.user_ID,
        username: decoded.username,
        role: decoded.role,
        iat: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : 'No iat'
      });
    }

    // Extract user ID (handle both naming conventions)
    const userId = decoded.user_id || decoded.user_ID;
    
    if (!userId) {
      console.error("No user ID in token");
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          success: false,
          message: "Invalid token: No user ID found" 
        }),
      };
    }

    console.log(`Logging out user ID: ${userId}`);

    // Check for database connection
    if (!process.env.DATABASE_URL && !process.env.NETLIFY_DATABASE_URL) {
      console.error("No database URL configured");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false,
          message: "Server configuration error" 
        }),
      };
    }

    const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    const sql = neon(connectionString);

    // Update user state to 0 (logged out) AND update last_login to prevent stale token re-use
    console.log("Updating user state to logged out...");
    const updateResult = await sql`
      UPDATE "user" 
      SET state = 0, last_login = NOW()
      WHERE user_id = ${userId}
      RETURNING user_id, username, state, last_login
    `;

    if (updateResult.length === 0) {
      console.warn(`User ${userId} not found in database`);
      // Still return success since the frontend will clear localStorage anyway
    } else {
      const updatedUser = updateResult[0];
      console.log(`User ${updatedUser.username} logged out successfully`);
      console.log("Updated state:", updatedUser.state);
      console.log("Updated last_login:", updatedUser.last_login ? new Date(updatedUser.last_login).toISOString() : 'null');
    }

    console.log("✅ Logout successful");
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        message: "Successfully logged out",
        user_id: userId,
        timestamp: new Date().toISOString()
      }),
    };

  } catch (err) {
    console.error("Logout error:", err);
    console.error("Error stack:", err.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        message: "Server error during logout",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      }),
    };
  } finally {
    console.log("=== LOGOUT FUNCTION END ===");
  }
};