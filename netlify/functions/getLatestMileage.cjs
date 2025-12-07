// netlify/functions/getLatestMileage.js
import { neon } from '@neondatabase/serverless';

export const handler = async (event, context) => {
  // Enable CORS
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  };

  // Handle OPTIONS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { vehicle_id } = event.queryStringParameters;

    if (!vehicle_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Vehicle ID is required" }),
      };
    }

    console.log(`Fetching latest mileage for vehicle_id: ${vehicle_id}`);

    // Check for database connection
    if (!process.env.DATABASE_URL && !process.env.NETLIFY_DATABASE_URL) {
      console.error("No database URL configured");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: "Server configuration error - Database not configured" 
        }),
      };
    }

    const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    const sql = neon(connectionString);

    // Get the most recent record for this vehicle - NEW SYNTAX
    console.log("Querying latest mileage record...");
    const result = await sql`
      SELECT 
        current_odometer as prevOdometer,
        mileage as prevMileage,
        current_fuel,
        previous_fuel,
        fuel_added,
        timestamp
      FROM usage_log 
      WHERE vehicle_id = ${vehicle_id} 
      ORDER BY timestamp DESC 
      LIMIT 1
    `;

    // If no previous records found, return default values
    if (result.length === 0) {
      console.log(`No previous records found for vehicle ${vehicle_id}`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          prevOdometer: 0,
          prevMileage: 0,
          current_fuel: 0,
          previous_fuel: 0,
          fuel_added: 0,
          timestamp: null,
          message: "No previous records found"
        })
      };
    }

    const latestRecord = result[0];
    console.log("Latest mileage record found:", latestRecord);

    // Format response with proper number conversion
    const response = {
      prevOdometer: parseFloat(latestRecord.prevodometer) || 0,
      prevMileage: parseFloat(latestRecord.prevmileage) || 0,
      current_fuel: parseFloat(latestRecord.current_fuel) || 0,
      previous_fuel: parseFloat(latestRecord.previous_fuel) || 0,
      fuel_added: parseFloat(latestRecord.fuel_added) || 0,
      timestamp: latestRecord.timestamp
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error("Database error:", error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "Failed to fetch previous mileage data",
        details: error.message 
      })
    };
  }
};