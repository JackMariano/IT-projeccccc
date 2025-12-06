// /.netlify/functions/logMileage
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
      },
      body: JSON.stringify({ message: 'CORS preflight' })
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const {
      user_id,
      vehicle_id,
      prevOdometer,
      currentOdometer,
      prevMileage,
      currentMileage,  // This is what should be stored in mileage column
      currentFuel,
      addedFuel
    } = JSON.parse(event.body);

    // Validation checks
    if (!user_id || !vehicle_id) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'User ID and Vehicle ID are required' })
      };
    }

    // Validate currentFuel
    if (isNaN(parseFloat(currentFuel)) || parseFloat(currentFuel) < 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Current fuel (before refill) must be a valid positive number' })
      };
    }

    // Validate addedFuel
    if (isNaN(parseFloat(addedFuel)) || parseFloat(addedFuel) < 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Fuel amount must be a valid positive number' })
      };
    }

    // Validate odometer
    if (parseFloat(currentOdometer) < parseFloat(prevOdometer)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Current odometer cannot be less than previous odometer' })
      };
    }

    // Validate mileage (should be stored as user input, not calculated)
    if (isNaN(parseFloat(currentMileage)) || parseFloat(currentMileage) < 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Mileage must be a valid positive number' })
      };
    }

    if (parseFloat(currentMileage) < parseFloat(prevMileage)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Current mileage cannot be less than previous mileage' })
      };
    }

    // Get the latest record to calculate previous_fuel
    const getPreviousFuelQuery = `
      SELECT current_fuel, fuel_added 
      FROM usage_log 
      WHERE vehicle_id = $1 
      ORDER BY timestamp DESC 
      LIMIT 1
    `;
    
    const previousFuelResult = await pool.query(getPreviousFuelQuery, [vehicle_id]);
    
    let previousFuel;
    if (previousFuelResult.rows.length > 0) {
      const lastRecord = previousFuelResult.rows[0];
      
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
    const getMaxIdQuery = `SELECT COALESCE(MAX(usage_id), 0) as max_id FROM usage_log`;
    const maxIdResult = await pool.query(getMaxIdQuery);
    const nextUsageId = maxIdResult.rows[0].max_id + 1;

    console.log("Next usage_id will be:", nextUsageId);

    // Insert into database - store currentMileage directly, not odometer difference
    const query = `
      INSERT INTO usage_log (
        usage_id,
        vehicle_id, 
        reported_by, 
        previous_fuel,
        current_fuel,
        fuel_added,
        previous_odometer, 
        current_odometer, 
        mileage,  -- This should be currentMileage, not odometer difference
        timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING usage_id
    `;

    const values = [
      nextUsageId,
      vehicle_id,
      user_id,
      previousFuel,
      fuelAfterRefill,
      addedFuelNum,
      parseFloat(prevOdometer),
      parseFloat(currentOdometer),
      parseFloat(currentMileage)  // Store the actual mileage value, not difference
    ];

    console.log("Executing query with values:", values);

    const result = await pool.query(query, values);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true, 
        usage_id: result.rows[0].usage_id,
        message: 'Mileage report submitted successfully',
        stored_values: {
          previous_fuel: previousFuel,
          current_fuel: fuelAfterRefill,
          fuel_added: addedFuelNum,
          mileage: parseFloat(currentMileage)
        }
      })
    };

  } catch (error) {
    console.error('Database error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Failed to submit mileage report',
        details: error.message,
        code: error.code 
      })
    };
  }
};