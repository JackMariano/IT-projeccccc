// netlify/functions/consumeInventory.js - FIXED
import { neon } from '@neondatabase/serverless';

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' }),
    };
  }

  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ success: false, error: 'Method not allowed' }),
      };
    }

    const { 
      part_id, 
      quantity, 
      user_id, 
      vehicle_id, 
      maintenance_type, 
      current_odometer,
      current_fuel,
      fuel_added 
    } = JSON.parse(event.body);

    if (!part_id || !quantity || !user_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields: part_id, quantity, and user_id are required',
        }),
      };
    }

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0 || !Number.isInteger(quantityNum)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Quantity must be a positive whole number',
        }),
      };
    }

    // Validate vehicle-related data if vehicle_id is provided
    let odometerNum = null;
    let fuelNum = null;
    let fuelAddedNum = null;
    
    if (vehicle_id) {
      if (current_odometer !== undefined && current_odometer !== null) {
        odometerNum = parseFloat(current_odometer);
        if (isNaN(odometerNum) || odometerNum < 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'Current odometer must be a non-negative number',
            }),
          };
        }
      }
      
      if (current_fuel !== undefined && current_fuel !== null) {
        fuelNum = parseFloat(current_fuel);
        if (isNaN(fuelNum) || fuelNum < 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'Current fuel level must be a non-negative number',
            }),
          };
        }
      }
      
      if (fuel_added !== undefined && fuel_added !== null) {
        fuelAddedNum = parseFloat(fuel_added);
        if (isNaN(fuelAddedNum) || fuelAddedNum < 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'Fuel added must be a non-negative number',
            }),
          };
        }
      }
    }

    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const sql = neon(databaseUrl);

    const currentData = await sql`
      SELECT current_quantity, part_name, measurement 
      FROM inventory 
      WHERE part_id = ${part_id}
    `;
    
    if (!currentData || currentData.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Part not found',
        }),
      };
    }

    const previousQuantity = currentData[0].current_quantity;
    
    if (previousQuantity < quantityNum) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Insufficient stock. Available: ${previousQuantity} ${currentData[0].measurement.toLowerCase()}, Requested: ${quantityNum} ${currentData[0].measurement.toLowerCase()}`,
        }),
      };
    }

    const newQuantity = previousQuantity - quantityNum;

    const updatedItem = await sql`
      UPDATE inventory 
      SET current_quantity = ${newQuantity}
      WHERE part_id = ${part_id}
      RETURNING part_id, part_name, part_category, measurement, current_quantity
    `;

    // Insert inventory log first (we'll update it with usage_id later if needed)
    const inventoryLog = await sql`
      INSERT INTO inventory_logs (
        part_id,
        user_id,
        action_type,
        quantity_change,
        previous_quantity,
        new_quantity,
        vehicle_id,
        maintenance_type,
        logged_at
      ) VALUES (
        ${part_id},
        ${user_id},
        'CONSUME',
        ${-quantityNum},
        ${previousQuantity},
        ${newQuantity},
        ${vehicle_id || null},
        ${maintenance_type || null},
        NOW()
      )
      RETURNING log_id
    `;

    let usageId = null;
    
    // If vehicle_id is provided, create a usage log entry for maintenance tracking
    if (vehicle_id) {
      try {
        // CRITICAL FIX: Get the ABSOLUTE latest usage log 
        // Use BOTH timestamp DESC AND usage_id DESC to handle same timestamps
        const latestVehicleData = await sql`
          SELECT 
            usage_id,
            current_odometer,
            current_fuel,
            timestamp
          FROM usage_log 
          WHERE vehicle_id = ${vehicle_id}
          ORDER BY timestamp DESC, usage_id DESC 
          LIMIT 1
        `;
        
        console.log("Latest vehicle data found:", latestVehicleData);
        
        if (latestVehicleData.length === 0) {
          console.log("No previous usage logs found for this vehicle");
        }
        
        // Use the actual current_odometer from the latest record as previous
        const previousOdometer = latestVehicleData.length > 0 
          ? Number(latestVehicleData[0].current_odometer) 
          : 0;
        
        const previousFuel = latestVehicleData.length > 0 
          ? Number(latestVehicleData[0].current_fuel) 
          : 0;
        
        const lastUsageId = latestVehicleData.length > 0 
          ? latestVehicleData[0].usage_id 
          : null;
        
        console.log(`Previous values - Odometer: ${previousOdometer}, Fuel: ${previousFuel}, Last Usage ID: ${lastUsageId}`);
        
        // Use provided values or keep previous if not provided
        const currentOdometerValue = odometerNum !== null ? odometerNum : previousOdometer;
        const currentFuelValue = fuelNum !== null ? fuelNum : previousFuel;
        const fuelAddedValue = fuelAddedNum !== null ? fuelAddedNum : 0;
        
        // Calculate mileage (difference between current and previous odometer)
        const mileageValue = currentOdometerValue - previousOdometer;
        
        console.log(`Mileage calculation: ${currentOdometerValue} - ${previousOdometer} = ${mileageValue}`);
        
        // Validate mileage makes sense
        if (mileageValue < 0) {
          console.error(`Invalid mileage: ${mileageValue}. Current: ${currentOdometerValue}, Previous: ${previousOdometer}`);
          // This is a critical error - odometer shouldn't go backwards
          throw new Error(`Odometer reading (${currentOdometerValue}) cannot be less than previous reading (${previousOdometer})`);
        }
        
        if (mileageValue === 0 && previousOdometer > 0) {
          console.warn("Zero mileage detected - this might be correct for fuel-only entries");
        }
        
        if (mileageValue > 10000) { // Unusually high mileage (> 10,000 km)
          console.warn(`Unusually high mileage detected: ${mileageValue} km`);
          // This might be valid after a long period without maintenance
        }
        
        // Get the next available ID manually to avoid sequence issues
        const maxIdResult = await sql`
          SELECT COALESCE(MAX(usage_id), 0) as max_id FROM usage_log
        `;
        const nextId = maxIdResult[0].max_id + 1;
        
        console.log(`Inserting new usage log with ID: ${nextId}, Previous usage ID: ${lastUsageId}`);
        
        // Insert with explicit ID to bypass sequence issues
        const usageLog = await sql`
          INSERT INTO usage_log (
            usage_id,
            vehicle_id,
            reported_by,
            previous_odometer,
            current_odometer,
            mileage,
            previous_fuel,
            current_fuel,
            fuel_added,
            timestamp
          ) VALUES (
            ${nextId},
            ${vehicle_id},
            ${user_id},
            ${previousOdometer},
            ${currentOdometerValue},
            ${mileageValue},
            ${previousFuel},
            ${currentFuelValue},
            ${fuelAddedValue},
            NOW()
          )
          RETURNING usage_id, previous_odometer, current_odometer, mileage, timestamp
        `;
        
        usageId = usageLog[0].usage_id;
        
        console.log(`Created usage log ${usageId}: 
          Previous Odometer: ${previousOdometer} 
          Current Odometer: ${currentOdometerValue}
          Mileage: ${mileageValue} km`);
        
        // Also update the sequence to prevent future conflicts
        try {
          await sql`
            SELECT setval('usage_log_usage_id_seq', ${nextId}, true)
          `;
        } catch (seqError) {
          console.warn('Could not update sequence, but insert succeeded:', seqError);
        }
        
        // Update the inventory log with the usage_id
        await sql`
          UPDATE inventory_logs 
          SET usage_id = ${usageId}
          WHERE log_id = ${inventoryLog[0].log_id}
        `;
        
      } catch (usageError) {
        console.error('Could not create usage log entry:', usageError);
        // Continue without usage log - this is not critical for the inventory operation
      }
    }

    const partInfo = currentData[0];
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Successfully consumed ${quantityNum} ${partInfo.measurement.toLowerCase()} of ${partInfo.part_name}`,
        data: {
          ...updatedItem[0],
          usage_id: usageId
        },
        maintenance_logged: !!maintenance_type,
        usage_log_created: !!usageId
      }),
    };
  } catch (error) {
    console.error('Error consuming inventory:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to consume inventory',
      }),
    };
  }
}