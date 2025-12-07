// netlify/functions/logoutOtherSessions.cjs
import { logoutOtherSessions } from './sessionCheck.js';

export const handler = async (event) => {
  console.log("=== LOGOUT OTHER SESSIONS FUNCTION START ===");
  
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    console.log("OPTIONS preflight request");
    return { statusCode: 200, headers, body: "" };
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
    console.log("Processing logout other sessions request...");
    
    const authHeader = event.headers.authorization || event.headers.Authorization;
    console.log("Auth header present:", !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("Invalid or missing authorization header");
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          success: false,
          message: "Invalid authorization" 
        }),
      };
    }

    const token = authHeader.split(' ')[1];
    const requestBody = JSON.parse(event.body || '{}');
    const { user_ID } = requestBody;
    
    console.log("Request body:", requestBody);
    console.log("User ID from request:", user_ID);
    
    if (!user_ID) {
      console.log("User ID is required but not provided");
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          message: "User ID is required" 
        }),
      };
    }

    console.log(`Logging out other sessions for user ID: ${user_ID}`);
    console.log("Current token length:", token.length);
    
    const result = await logoutOtherSessions(user_ID, token);

    if (!result.success) {
      console.error("Failed to logout other sessions:", result.error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: "Failed to logout other sessions", 
          error: result.error 
        }),
      };
    }

    console.log("✅ Successfully logged out other sessions");
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: "Other sessions logged out successfully",
        user_ID: user_ID,
        timestamp: new Date().toISOString()
      }),
    };

  } catch (error) {
    console.error("Logout other sessions error:", error);
    console.error("Error stack:", error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        message: "Internal server error",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
    };
  } finally {
    console.log("=== LOGOUT OTHER SESSIONS FUNCTION END ===");
  }
};