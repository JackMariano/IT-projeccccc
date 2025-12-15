// netlify/functions/getInventoryLogDetails.js - FIXED
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
    // Parse the request body for POST or query params for GET
    let log_ids = [];
    
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      log_ids = body.log_ids || [];
    } else if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {};
      if (params.log_ids) {
        log_ids = params.log_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      }
    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ success: false, error: 'Method not allowed' }),
      };
    }

    if (!Array.isArray(log_ids) || log_ids.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing or invalid log_ids',
        }),
      };
    }

    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const sql = neon(databaseUrl);

    console.log('Fetching details for log IDs:', log_ids);

    // First, get the inventory logs themselves
    const inventoryLogs = await sql`
      SELECT 
        log_id,
        part_id,
        user_id,
        vehicle_id,
        maintenance_type,
        logged_at
      FROM inventory_logs 
      WHERE log_id = ANY(${log_ids})
    `;

    if (inventoryLogs.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'No logs found with the provided IDs',
        }),
      };
    }

    // Extract unique IDs
    const userIds = [...new Set(inventoryLogs.map(log => log.user_id).filter(id => id !== null))];
    const vehicleIds = [...new Set(inventoryLogs.map(log => log.vehicle_id).filter(id => id !== null))];

    console.log('Extracted IDs:', { userIds, vehicleIds });

    // Get user details - FIXED: Use quotes around "user" table name
    let userDetails = [];
    if (userIds.length > 0) {
      try {
        // Join "user" table with employee table to get full name
        // Note: "user" is in quotes because it's a reserved keyword
        userDetails = await sql`
          SELECT 
            u.user_id,
            u.username,
            e.firstname,
            e.lastname,
            COALESCE(e.firstname || ' ' || e.lastname, u.username) as full_name
          FROM "user" u
          LEFT JOIN employee e ON u.user_id = e.user_id
          WHERE u.user_id = ANY(${userIds})
        `;
        console.log('User details fetched successfully:', userDetails.length, 'users');
      } catch (userError) {
        console.error('Error fetching user details with employee join:', userError);
        // Fallback: try without employee table join
        try {
          userDetails = await sql`
            SELECT 
              user_id,
              username as full_name,
              username
            FROM "user" 
            WHERE user_id = ANY(${userIds})
          `;
          console.log('User details fetched (fallback):', userDetails.length, 'users');
        } catch (fallbackError) {
          console.error('Fallback error fetching user details:', fallbackError);
          // Final fallback: create placeholder user info
          userDetails = userIds.map(id => ({
            user_id: id,
            full_name: `User ${id}`,
            username: `user${id}`,
            firstname: null,
            lastname: null
          }));
          console.log('Created placeholder user details:', userDetails.length, 'users');
        }
      }
    }

    // Get vehicle details
    let vehicleDetails = [];
    if (vehicleIds.length > 0) {
      try {
        vehicleDetails = await sql`
          SELECT 
            vehicle_id,
            plate_number,
            brand,
            model,
            year
          FROM vehicle
          WHERE vehicle_id = ANY(${vehicleIds})
        `;
        console.log('Vehicle details fetched:', vehicleDetails.length, 'vehicles');
      } catch (vehicleError) {
        console.error('Error fetching vehicle details:', vehicleError);
        // Fallback: create placeholder vehicle info
        vehicleDetails = vehicleIds.map(id => ({
          vehicle_id: id,
          plate_number: `UNKNOWN-${id}`,
          brand: 'Unknown',
          model: 'Unknown',
          year: null
        }));
        console.log('Created placeholder vehicle details:', vehicleDetails.length, 'vehicles');
      }
    }

    // Get usage log details based on vehicle
    let usageLogDetails = [];
    if (vehicleIds.length > 0) {
      try {
        // Get usage logs for these vehicles
        usageLogDetails = await sql`
          SELECT 
            ul.usage_id,
            ul.vehicle_id,
            ul.previous_odometer,
            ul.current_odometer,
            ul.mileage,
            ul.previous_fuel,
            ul.current_fuel,
            ul.fuel_added,
            ul.timestamp,
            v.plate_number,
            v.brand,
            v.model
          FROM usage_log ul
          LEFT JOIN vehicle v ON ul.vehicle_id = v.vehicle_id
          WHERE ul.vehicle_id = ANY(${vehicleIds})
          ORDER BY ul.timestamp DESC
          LIMIT 20
        `;
        console.log('Usage log details fetched:', usageLogDetails.length, 'logs');
      } catch (usageError) {
        console.error('Error fetching usage log details:', usageError);
        // Fallback: try without join
        try {
          usageLogDetails = await sql`
            SELECT 
              usage_id,
              vehicle_id,
              previous_odometer,
              current_odometer,
              mileage,
              previous_fuel,
              current_fuel,
              fuel_added,
              timestamp
            FROM usage_log 
            WHERE vehicle_id = ANY(${vehicleIds})
            ORDER BY timestamp DESC
            LIMIT 20
          `;
        } catch (fallbackError) {
          console.error('Fallback error fetching usage logs:', fallbackError);
        }
      }
    }

    // Create a mapping for easy access
    const userMap = {};
    userDetails.forEach(user => {
      userMap[user.user_id] = {
        full_name: user.full_name,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname
      };
    });

    const vehicleMap = {};
    vehicleDetails.forEach(vehicle => {
      vehicleMap[vehicle.vehicle_id] = vehicle;
    });

    // Group usage logs by vehicle
    const vehicleUsageMap = {};
    usageLogDetails.forEach(usage => {
      if (!vehicleUsageMap[usage.vehicle_id]) {
        vehicleUsageMap[usage.vehicle_id] = [];
      }
      vehicleUsageMap[usage.vehicle_id].push(usage);
    });

    // Enrich inventory logs with details
    const enrichedLogs = inventoryLogs.map(log => ({
      log_id: log.log_id,
      part_id: log.part_id,
      user_id: log.user_id,
      vehicle_id: log.vehicle_id,
      maintenance_type: log.maintenance_type,
      logged_at: log.logged_at,
      user_info: userMap[log.user_id] || {
        full_name: `User ${log.user_id}`,
        username: `user${log.user_id}`,
        firstname: null,
        lastname: null
      },
      vehicle_info: vehicleMap[log.vehicle_id] || null,
      // Get recent usage logs for this vehicle
      vehicle_usage_logs: log.vehicle_id ? (vehicleUsageMap[log.vehicle_id] || []) : []
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          logs: enrichedLogs,
          users: userDetails,
          vehicles: vehicleDetails,
          usage_logs: usageLogDetails
        },
      }),
    };
  } catch (error) {
    console.error('Error fetching log details:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch log details',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
    };
  }
}