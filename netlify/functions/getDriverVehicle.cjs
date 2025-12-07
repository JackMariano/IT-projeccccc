// netlify/functions/getDriverVehicle.js
import { neon } from '@neondatabase/serverless';

export const handler = async (event) => {
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
    const driver_id = event.queryStringParameters?.driver_id;

    if (!driver_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Driver ID is required" }),
      };
    }

    console.log(`Fetching vehicle for driver_id: ${driver_id}`);

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

    // Fetch the ongoing reservation for this driver - NEW SYNTAX
    const reservationResult = await sql`
      SELECT r.vehicle_id
      FROM reservation r
      WHERE r.driver_id = ${driver_id} AND r.reserv_status = 'Ongoing'
      LIMIT 1
    `;

    if (reservationResult.length === 0) {
      console.log(`No ongoing reservation found for driver ${driver_id}`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          vehicle: null, 
          message: "No ongoing reservation found" 
        }),
      };
    }

    const vehicleId = reservationResult[0].vehicle_id;
    console.log(`Found vehicle_id: ${vehicleId} for driver`);

    // Fetch vehicle info and latest odometer/mileage - NEW SYNTAX
    // Note: Using a subquery in the FROM clause
    const vehicleResult = await sql`
      SELECT 
        v.vehicle_id, 
        v.brand, 
        v.model, 
        v.plate_number,
        COALESCE(ul.current_odometer, 0) as prevOdometer,
        COALESCE(ul.mileage, 0) as prevMileage
      FROM vehicle v
      LEFT JOIN usage_log ul ON v.vehicle_id = ul.vehicle_id 
        AND ul.timestamp = (
          SELECT MAX(timestamp) 
          FROM usage_log 
          WHERE vehicle_id = v.vehicle_id
        )
      WHERE v.vehicle_id = ${vehicleId}
    `;

    if (vehicleResult.length === 0) {
      console.log(`Vehicle ${vehicleId} not found in database`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          vehicle: null, 
          message: "Vehicle not found" 
        }),
      };
    }

    const vehicleData = vehicleResult[0];
    
    // Format the response
    const response = {
      vehicle: {
        vehicle_id: vehicleData.vehicle_id,
        brand: vehicleData.brand,
        model: vehicleData.model,
        plate_number: vehicleData.plate_number
      },
      prevOdometer: parseFloat(vehicleData.prevodometer) || 0,
      prevMileage: parseFloat(vehicleData.prevmileage) || 0
    };

    console.log("Vehicle data retrieved:", {
      vehicle: response.vehicle,
      prevOdometer: response.prevOdometer,
      prevMileage: response.prevMileage
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };

  } catch (err) {
    console.error("Error in getDriverVehicle:", err);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "Internal server error",
        details: err.message 
      }),
    };
  }
};