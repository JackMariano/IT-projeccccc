import { neon } from '@neondatabase/serverless';

export const handler = async (event, context) => {
  // Enable CORS
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  };

  // Handle OPTIONS preflight
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
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid JSON format" }),
      };
    }

    const {
      user_id,
      vehicle_id,
      prevOdometer,
      currentOdometer,
      currentMileage, // Changed from prevMileage + currentMileage to just currentMileage
      currentFuel,
      addedFuel
    } = body;

    console.log("Received mileage report:", {
      user_id,
      vehicle_id,
      prevOdometer,
      currentOdometer,
      currentMileage,
      currentFuel,
      addedFuel
    });

    // Validation checks
    if (!user_id || !vehicle_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "User ID and Vehicle ID are required" }),
      };
    }

    // Validate currentFuel
    if (isNaN(parseFloat(currentFuel)) || parseFloat(currentFuel) < 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: "Current fuel (before refill) must be a valid positive number" 
        }),
      };
    }

    // Validate addedFuel
    if (isNaN(parseFloat(addedFuel)) || parseFloat(addedFuel) < 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: "Fuel amount must be a valid positive number" 
        }),
      };
    }

    // Validate odometer values
    const currentOdoNum = parseFloat(currentOdometer);
    const prevOdoNum = parseFloat(prevOdometer);
    
    if (isNaN(currentOdoNum) || currentOdoNum < 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: "Current odometer must be a valid positive number" 
        }),
      };
    }
    
    if (isNaN(prevOdoNum) || prevOdoNum < 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: "Previous odometer must be a valid positive number" 
        }),
      };
    }
    
    if (currentOdoNum < prevOdoNum) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: "Current odometer cannot be less than previous odometer" 
        }),
      };
    }

    // Validate odometer decimal places (max 1 decimal)
    if (currentOdometer.toString().includes('.')) {
      const decimalPlaces = currentOdometer.toString().split('.')[1].length;
      if (decimalPlaces > 1) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: "Odometer should have at most 1 decimal place" 
          }),
        };
      }
    }

    // Validate mileage (calculated from frontend, but we'll recalculate and compare)
    const receivedMileage = parseFloat(currentMileage);
    
    // Calculate mileage from odometer difference (for verification)
    const calculatedMileage = Math.round((currentOdoNum - prevOdoNum) * 10) / 10;
    
    if (isNaN(receivedMileage) || receivedMileage < 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: "Mileage must be a valid positive number" 
        }),
      };
    }

    // Optional: Verify that received mileage matches calculated mileage (within tolerance)
    // This helps catch potential frontend calculation errors
    const tolerance = 0.1; // 0.1 km tolerance
    if (Math.abs(receivedMileage - calculatedMileage) > tolerance) {
      console.warn(`Mileage mismatch: received ${receivedMileage}, calculated ${calculatedMileage}`);
      // You can decide whether to use received or calculated mileage
      // For consistency, use the calculated value
    }

    // Check for database connection string
    if (!process.env.DATABASE_URL && !process.env.NETLIFY_DATABASE_URL) {
      console.error("No database URL configured");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: "Server configuration error - Database URL not configured" 
        }),
      };
    }

    const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    const sql = neon(connectionString);

    // Get the latest record to calculate previous_fuel
    console.log("Getting previous fuel calculation...");
    const previousFuelResult = await sql`
      SELECT current_fuel, fuel_added 
      FROM usage_log 
      WHERE vehicle_id = ${vehicle_id} 
      ORDER BY timestamp DESC 
      LIMIT 1
    `;
    
    let previousFuel;
    if (previousFuelResult.length > 0) {
      const lastRecord = previousFuelResult[0];
      
      // Convert to numbers explicitly
      const lastCurrentFuel = parseFloat(lastRecord.current_fuel);
      const lastFuelAdded = parseFloat(lastRecord.fuel_added);
      
      // previous_fuel = last current_fuel + last fuel_added
      previousFuel = lastCurrentFuel + lastFuelAdded;
      
      console.log("Previous fuel calculation:", {
        lastCurrentFuel,
        lastFuelAdded,
        previousFuel
      });
    } else {
      // First record for this vehicle
      previousFuel = 0;
      console.log("First record for this vehicle, previous_fuel set to 0");
    }

    // Calculate fuel after refill
    const currentFuelNum = parseFloat(currentFuel);
    const addedFuelNum = parseFloat(addedFuel);
    const fuelAfterRefill = currentFuelNum + addedFuelNum;

    console.log("Fuel calculations:", { 
      previousFuel,
      currentFuel: currentFuelNum,
      addedFuel: addedFuelNum,
      fuelAfterRefill
    });

    // Get the next usage_id
    console.log("Getting next usage_id...");
    const maxIdResult = await sql`
      SELECT COALESCE(MAX(usage_id), 0) as max_id FROM usage_log
    `;
    
    const nextUsageId = maxIdResult[0].max_id + 1;
    console.log("Next usage_id will be:", nextUsageId);

    // Round values for database storage
    const roundedPreviousFuel = Math.round(previousFuel * 100) / 100; // 2 decimal places for fuel
    const roundedFuelAfterRefill = Math.round(fuelAfterRefill * 100) / 100;
    const roundedAddedFuel = Math.round(addedFuelNum * 100) / 100;
    const roundedPrevOdometer = Math.round(prevOdoNum * 10) / 10; // 1 decimal for odometer
    const roundedCurrentOdometer = Math.round(currentOdoNum * 10) / 10;
    const roundedMileage = calculatedMileage; // Already rounded to 1 decimal

    console.log("Rounded values for storage:", {
      roundedPreviousFuel,
      roundedFuelAfterRefill,
      roundedAddedFuel,
      roundedPrevOdometer,
      roundedCurrentOdometer,
      roundedMileage
    });

    // Insert into database
    console.log("Inserting new usage log...");
    const result = await sql`
      INSERT INTO usage_log (
        usage_id,
        vehicle_id, 
        reported_by, 
        previous_fuel,
        current_fuel,
        fuel_added,
        previous_odometer, 
        current_odometer, 
        mileage,
        timestamp
      ) VALUES (
        ${nextUsageId},
        ${vehicle_id},
        ${user_id},
        ${roundedPreviousFuel},
        ${roundedFuelAfterRefill},
        ${roundedAddedFuel},
        ${roundedPrevOdometer},
        ${roundedCurrentOdometer},
        ${roundedMileage},
        NOW()
      )
      RETURNING usage_id
    `;

    const insertedId = result[0].usage_id;
    console.log("Successfully inserted usage log with ID:", insertedId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        usage_id: insertedId,
        message: "Mileage report submitted successfully",
        stored_values: {
          usage_id: insertedId,
          previous_fuel: roundedPreviousFuel,
          current_fuel: roundedFuelAfterRefill,
          fuel_added: roundedAddedFuel,
          previous_odometer: roundedPrevOdometer,
          current_odometer: roundedCurrentOdometer,
          mileage: roundedMileage,
          timestamp: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error("Database error:", error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "Failed to submit mileage report",
        details: error.message,
        code: error.code 
      })
    };
  }
};