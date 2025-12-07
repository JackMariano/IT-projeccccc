// netlify/functions/checkSession.cjs
import { checkSession } from './sessionCheck.js';

export const handler = async (event) => {
  console.log("=== CHECK SESSION FUNCTION START ===");
  
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
    console.log("Processing session check...");
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    console.log("Auth header:", authHeader ? "Present" : "Missing");
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("Invalid or missing authorization header");
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          valid: false,
          message: "Invalid authorization" 
        }),
      };
    }

    const token = authHeader.split(' ')[1];
    console.log("Token extracted, length:", token.length);
    console.log("Calling checkSession function...");
    
    const sessionResult = await checkSession(token);
    
    console.log("Session check result:", {
      valid: sessionResult.valid,
      message: sessionResult.message,
      user_ID: sessionResult.user_ID
    });

    if (!sessionResult.valid) {
      console.log("Session invalid:", sessionResult.message);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify(sessionResult),
      };
    }

    console.log("✅ Session check successful");
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(sessionResult),
    };

  } catch (error) {
    console.error("Session check error:", error);
    console.error("Error stack:", error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        valid: false,
        message: "Session check failed",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
    };
  } finally {
    console.log("=== CHECK SESSION FUNCTION END ===");
  }
};