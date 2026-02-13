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

    // Get driver's active reservations and dynamically calculate status
    const reservationResult = await sql`
      SELECT r.vehicle_id, r.reserv_status, r.startdate, r.enddate
      FROM reservation r
      WHERE r.driver_id = ${driver_id}
        AND r.enddate >= CURRENT_DATE - INTERVAL '1 day'
        AND r.reserv_status != 'Completed'
      ORDER BY r.startdate ASC
      LIMIT 10
    `;
    
    // Filter and calculate dynamic status
    const now = new Date();
    const activeReservations = reservationResult.filter(r => {
      const startDate = new Date(r.startdate);
      const endDate = new Date(r.enddate);
      // Include if: upcoming (future start), ongoing (now between start and end), or recently ended
      return now <= endDate || (now - endDate) < (24 * 60 * 60 * 1000); // Within 1 day of ending
    });
    
    if (activeReservations.length === 0) {
      console.log(`No active reservation found for driver ${driver_id}`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          vehicle: null, 
          message: "No assigned vehicle found. Please check with your manager for upcoming assignments." 
        }),
      };
    }
    
    // Find the most relevant reservation (ongoing first, then upcoming)
    let selectedReservation = null;
    let calculatedStatus = null;
    
    for (const reservation of activeReservations) {
      const startDate = new Date(reservation.startdate);
      const endDate = new Date(reservation.enddate);
      
      if (now >= startDate && now <= endDate) {
        // This is an ongoing reservation - prioritize it
        selectedReservation = reservation;
        calculatedStatus = 'Ongoing';
        break;
      } else if (now < startDate && !selectedReservation) {
        // This is upcoming - only select if we haven't found one yet
        selectedReservation = reservation;
        calculatedStatus = 'Upcoming';
      }
    }
    
    // If no ongoing or upcoming found, use the most recent one
    if (!selectedReservation) {
      selectedReservation = activeReservations[0];
      const startDate = new Date(selectedReservation.startdate);
      const endDate = new Date(selectedReservation.enddate);
      
      if (now < startDate) {
        calculatedStatus = 'Upcoming';
      } else if (now <= endDate) {
        calculatedStatus = 'Ongoing';
      } else {
        calculatedStatus = 'Completed';
      }
    }

    console.log(`Found ${calculatedStatus} reservation for driver ${driver_id}`);

    const vehicleId = selectedReservation.vehicle_id;
    console.log(`Found vehicle_id: ${vehicleId} for driver`);

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
    
    const response = {
      vehicle: {
        vehicle_id: vehicleData.vehicle_id,
        brand: vehicleData.brand,
        model: vehicleData.model,
        plate_number: vehicleData.plate_number
      },
      prevOdometer: parseFloat(vehicleData.prevodometer) || 0,
      prevMileage: parseFloat(vehicleData.prevmileage) || 0,
      reservationStatus: calculatedStatus
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