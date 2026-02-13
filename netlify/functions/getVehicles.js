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

    // Simple query using only columns that exist in the vehicle table
    const vehicles = await sql`
      SELECT
        vehicle_id,
        brand,
        model,
        year,
        plate_number,
        status,
        daily_rate
      FROM vehicle
      ORDER BY plate_number
    `;

    // Return vehicles with defaults for missing fields that the frontend expects
    const processedVehicles = vehicles.map(v => ({
      vehicle_id: v.vehicle_id,
      brand: v.brand,
      model: v.model,
      year: v.year,
      plate_number: v.plate_number,
      status: v.status || 'available',
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
