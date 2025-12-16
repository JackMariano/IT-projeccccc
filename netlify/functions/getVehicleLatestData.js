// netlify/functions/getVehicleLatestData.js - ENHANCED VERSION
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
    const { vehicle_id } = event.queryStringParameters || {};

    if (!vehicle_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Vehicle ID is required' 
        }),
      };
    }

    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const sql = neon(databaseUrl);

    const latestData = await sql`
    SELECT 
        usage_id,
        current_odometer,
        current_fuel,
        timestamp,
        mileage
    FROM usage_log 
    WHERE vehicle_id = ${vehicle_id}
    ORDER BY timestamp DESC, usage_id DESC 
    LIMIT 1
    `;

    const latestByUsageId = await sql`
      SELECT 
        usage_id,
        current_odometer,
        current_fuel,
        timestamp,
        mileage
      FROM usage_log 
      WHERE vehicle_id = ${vehicle_id}
      ORDER BY usage_id DESC 
      LIMIT 1
    `;

    let consistency_check = {
      is_consistent: true,
      message: "Data is consistent"
    };

    if (latestData.length > 0 && latestByUsageId.length > 0) {
      if (latestData[0].usage_id !== latestByUsageId[0].usage_id) {
        consistency_check = {
          is_consistent: false,
          message: `Warning: timestamp and usage_id ordering disagree. timestamp says: ${latestData[0].usage_id}, usage_id says: ${latestByUsageId[0].usage_id}`,
          timestamp_latest: latestData[0],
          usage_id_latest: latestByUsageId[0]
        };
        console.warn(consistency_check.message);
      }
    }

    const vehicleInfo = await sql`
      SELECT 
        plate_number,
        brand,
        model,
        year
      FROM vehicle 
      WHERE vehicle_id = ${vehicle_id}
    `;

    const primaryData = latestByUsageId.length > 0 ? latestByUsageId[0] : (latestData.length > 0 ? latestData[0] : null);

    const result = {
      usage_id: primaryData?.usage_id || null,
      current_odometer: primaryData?.current_odometer || 0,
      current_fuel: primaryData?.current_fuel || 0,
      last_mileage: primaryData?.mileage || 0,
      last_timestamp: primaryData?.timestamp || null,
      vehicle_info: vehicleInfo[0] || null,
      consistency_check: consistency_check
    };

    console.log(`Latest data for vehicle ${vehicle_id}:`, result);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: result,
      }),
    };
  } catch (error) {
    console.error('Error fetching vehicle data:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to fetch vehicle data',
      }),
    };
  }
}