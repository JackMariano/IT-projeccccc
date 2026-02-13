import { neon } from '@neondatabase/serverless';

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error("Database connection string not configured");
    }
    
    const sql = neon(connectionString);

    // Query vehicles with dynamically computed status based on active reservations
    const vehicles = await sql`
      SELECT
        v.vehicle_id,
        v.brand,
        v.model,
        v.year,
        v.plate_number,
        v.status,
        v.daily_rate,
        CASE
          WHEN v.status NOT IN ('Available', 'Reserved', 'In Use') THEN v.status
          WHEN EXISTS (
            SELECT 1 FROM reservation r
            WHERE r.vehicle_id = v.vehicle_id
              AND r.reserv_status NOT IN ('Completed', 'Cancelled')
              AND NOW() BETWEEN r.startdate AND r.enddate
          ) THEN 'In Use'
          WHEN EXISTS (
            SELECT 1 FROM reservation r
            WHERE r.vehicle_id = v.vehicle_id
              AND r.reserv_status NOT IN ('Completed', 'Cancelled')
              AND NOW() < r.startdate
          ) THEN 'Reserved'
          ELSE v.status
        END AS computed_status
      FROM vehicle v
      ORDER BY v.plate_number
    `;

    // Return vehicles with defaults for missing fields that the frontend expects
    const processedVehicles = vehicles.map(v => ({
      vehicle_id: v.vehicle_id,
      brand: v.brand,
      model: v.model,
      year: v.year,
      plate_number: v.plate_number,
      status: v.computed_status || v.status || 'Available',
      daily_rate: v.daily_rate,
      // Provide defaults for fields the frontend might expect
      vehicle_type: 'Standard',
      archived: false,
      odometer: 0,
      active_reservations: 0,
      active_issues: 0
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicles: processedVehicles }),
    };
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to fetch vehicles", details: error.message }),
    };
  }
};
