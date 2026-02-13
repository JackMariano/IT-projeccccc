import { neon } from '@neondatabase/serverless';

export const handler = async (event) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    console.log("Request body:", event.body);
    
    const body = JSON.parse(event.body);
    const {
      vehicle_id,
      customer_id,
      startdate,
      enddate,
      handled_by,
      driver_id,
    } = body;

    console.log("Parsed data:", { vehicle_id, customer_id, startdate, enddate, handled_by, driver_id });

    // Validate required fields
    if (!vehicle_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "vehicle_id is required" }),
      };
    }
    if (!customer_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "customer_id is required" }),
      };
    }
    if (!startdate) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "startdate is required" }),
      };
    }
    if (!enddate) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "enddate is required" }),
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

    // Determine the appropriate status based on start date
    const now = new Date();
    const startDateTime = new Date(startdate);
    const endDateTime = new Date(enddate);
    
    let reserv_status;
    if (now < startDateTime) {
      reserv_status = 'Upcoming';
    } else if (now <= endDateTime) {
      reserv_status = 'Ongoing';
    } else {
      reserv_status = 'Completed';
    }
    
    console.log(`Status determined: ${reserv_status} (now: ${now.toISOString()}, start: ${startdate}, end: ${enddate})`);

    const result = await sql`
      INSERT INTO reservation (vehicle_id, customer_id, startdate, enddate, handled_by, driver_id, reserv_status)
      VALUES (${vehicle_id}, ${customer_id}, ${startdate}, ${enddate}, ${handled_by || null}, ${driver_id || null}, ${reserv_status})
      RETURNING *
    `;

    console.log("Insert successful:", result);

    // Update vehicle status to reflect the new reservation
    const vehicleStatus = reserv_status === 'Ongoing' ? 'In Use' : 'Reserved';
    await sql`
      UPDATE vehicle
      SET status = ${vehicleStatus}
      WHERE vehicle_id = ${vehicle_id}
        AND status IN ('Available', 'Reserved', 'In Use')
    `;

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(result[0]),
    };
  } catch (error) {
    console.error("Error creating reservation:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "Failed to create reservation",
        details: error.message 
      }),
    };
  }
};
