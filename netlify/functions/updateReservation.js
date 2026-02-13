import { neon } from '@neondatabase/serverless';

export const handler = async (event) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' }),
    };
  }

  if (event.httpMethod !== "PUT") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    console.log("Update reservation request body:", event.body);
    
    const body = JSON.parse(event.body);
    const { reservation_id, vehicle_id, customer_id, startdate, enddate, driver_id, handled_by, reserv_status } = body;

    if (!reservation_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "reservation_id is required" }),
      };
    }

    const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    
    if (!connectionString) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Database connection string not configured" }),
      };
    }
    
    const sql = neon(connectionString);

    // Recalculate status based on the updated dates
    const now = new Date();
    const startDateTime = new Date(startdate);
    const endDateTime = new Date(enddate);
    
    let calculatedStatus;
    if (now < startDateTime) {
      calculatedStatus = 'Upcoming';
    } else if (now <= endDateTime) {
      calculatedStatus = 'Ongoing';
    } else {
      calculatedStatus = 'Completed';
    }
    
    // Use the calculated status unless a specific status was provided
    const finalStatus = reserv_status || calculatedStatus;
    
    console.log(`Status recalculated: ${finalStatus} (now: ${now.toISOString()}, start: ${startdate}, end: ${enddate})`);

    // Update using tagged template literals (neon library requirement)
    const result = await sql`
      UPDATE reservation 
      SET 
        vehicle_id = ${vehicle_id},
        customer_id = ${customer_id},
        startdate = ${startdate},
        enddate = ${enddate},
        driver_id = ${driver_id || null},
        handled_by = ${handled_by || null},
        reserv_status = ${finalStatus}
      WHERE reservation_id = ${reservation_id}
      RETURNING *
    `;

    console.log("Update successful:", result);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result[0]),
    };
  } catch (error) {
    console.error("Error updating reservation:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "Failed to update reservation",
        details: error.message 
      }),
    };
  }
};
