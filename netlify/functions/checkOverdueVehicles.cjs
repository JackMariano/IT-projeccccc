// netlify/functions/checkOverdueVehicles.cjs
import { neon } from '@neondatabase/serverless';

export const handler = async (event) => {
  console.log("=== CHECK OVERDUE VEHICLES FUNCTION START ===");
  console.log("Event received:", {
    httpMethod: event.httpMethod,
    path: event.path,
    queryStringParameters: event.queryStringParameters,
    headers: event.headers
  });

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    console.log("OPTIONS preflight request");
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    console.log(`Method not allowed: ${event.httpMethod}`);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  const driver_id = event.queryStringParameters?.driver_id;
  console.log("Driver ID from query parameters:", driver_id);

  if (!driver_id) {
    console.log("Missing driver_id parameter");
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: "Missing driver_id",
        message: "Driver ID is required as a query parameter"
      })
    };
  }

  try {
    console.log("Checking environment variables...");
    
    // Check for database URL in all possible environment variables
    const dbUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || process.env.NEON_DATABASE_URL;
    console.log("Database URL available:", !!dbUrl);
    
    if (!dbUrl) {
      console.error("No database URL configured in environment variables");
      console.log("Available env vars:", Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('NEON')));
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: "Server configuration error",
          message: "Database connection not configured",
          debug: process.env.NODE_ENV === 'development' ? {
            available_env_vars: Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('NEON'))
          } : undefined
        })
      };
    }

    console.log("Creating Neon SQL client...");
    console.log("Database URL (first 50 chars):", dbUrl.substring(0, 50) + '...');
    
    const sql = neon(dbUrl);
    
    // Test database connection first
    console.log("Testing database connection...");
    try {
      const connectionTest = await sql`SELECT 1 as connection_test, NOW() as db_time`;
      console.log("Database connection test successful:", connectionTest[0]);
    } catch (connectionError) {
      console.error("Database connection test failed:", connectionError.message);
      console.error("Connection error stack:", connectionError.stack);
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: "Database connection failed",
          message: "Could not connect to database",
          debug: process.env.NODE_ENV === 'development' ? {
            error: connectionError.message,
            error_type: connectionError.name
          } : undefined
        })
      };
    }

    // Get current date and time
    const now = new Date();
    console.log("Current server time:", {
      iso: now.toISOString(),
      local: now.toLocaleString(),
      timestamp: now.getTime()
    });
    
    // Calculate 2 hours ago
    const twoHoursAgo = new Date(now.getTime() - (2 * 60 * 60 * 1000));
    console.log("Two hours ago:", {
      iso: twoHoursAgo.toISOString(),
      local: twoHoursAgo.toLocaleString()
    });

    console.log(`Querying overdue vehicles for driver_id: ${driver_id}`);
    console.log("SQL query will check for reservations that ended before:", twoHoursAgo.toISOString());

    try {
      const result = await sql`
        SELECT 
          r.reservation_id,
          r.enddate,
          r.reserv_status,
          c.fullname AS customer_name,
          v.brand,
          v.model,
          v.plate_number,
          v.vehicle_id,
          -- Calculate how many hours overdue
          EXTRACT(EPOCH FROM (NOW() - r.enddate)) / 3600 as hours_overdue
        FROM reservation r
        LEFT JOIN vehicle v ON r.vehicle_id = v.vehicle_id
        LEFT JOIN customer c ON r.customer_id = c.customer_id
        WHERE r.driver_id = ${driver_id}
          AND r.enddate < ${twoHoursAgo.toISOString()} -- Only trips that ended 2+ hours ago
          AND r.reserv_status IN ('ongoing', 'active', 'OnGoing', 'Active', 'Ongoing')
        ORDER BY r.enddate ASC
      `;

      console.log(`Query successful. Found ${result.length} overdue vehicles.`);
      
      if (result.length > 0) {
        console.log("First overdue vehicle details:", {
          reservation_id: result[0].reservation_id,
          vehicle: `${result[0].brand} ${result[0].model} (${result[0].plate_number})`,
          customer: result[0].customer_name,
          ended: result[0].enddate,
          hours_overdue: result[0].hours_overdue,
          status: result[0].reserv_status
        });
      } else {
        console.log("No overdue vehicles found for this driver.");
      }

      console.log("✅ Successfully checked overdue vehicles");
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          overdue_vehicles: result,
          count: result.length,
          current_date: now.toISOString(),
          check_time: now.toLocaleTimeString(),
          query_details: {
            driver_id: driver_id,
            cutoff_time: twoHoursAgo.toISOString(),
            statuses_checked: ['ongoing', 'active', 'OnGoing', 'Active', 'Ongoing']
          }
        })
      };
      
    } catch (queryError) {
      console.error("SQL query error:", queryError.message);
      console.error("Query error stack:", queryError.stack);
      console.error("Query error code:", queryError.code);
      
      // Check for common SQL errors
      if (queryError.message.includes('relation') && queryError.message.includes('does not exist')) {
        console.error("Table or column doesn't exist. Checking schema...");
      }
      
      if (queryError.message.includes('column') && queryError.message.includes('does not exist')) {
        console.error("Column doesn't exist in table.");
      }
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: "Database query failed",
          message: "Failed to execute query",
          debug: process.env.NODE_ENV === 'development' ? {
            error: queryError.message,
            error_type: queryError.name,
            error_code: queryError.code,
            suggestion: "Check if table/column names are correct"
          } : undefined
        })
      };
    }

  } catch (err) {
    console.error("Unexpected error in checkOverdueVehicles:", err.message);
    console.error("Error stack:", err.stack);
    console.error("Error name:", err.name);
    console.error("Full error object:", err);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "Internal server error",
        message: "An unexpected error occurred",
        debug: process.env.NODE_ENV === 'development' ? {
          error: err.message,
          error_type: err.name,
          stack: err.stack
        } : undefined
      })
    };
  } finally {
    console.log("=== CHECK OVERDUE VEHICLES FUNCTION END ===");
  }
};