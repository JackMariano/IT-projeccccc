import { neon } from '@neondatabase/serverless';

export const handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { reservation_id, vehicle_id, driver_id } = JSON.parse(event.body);

    if (!reservation_id || !vehicle_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "reservation_id and vehicle_id are required" }),
      };
    }

    const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    const sql = neon(connectionString);

    // Check if reservation exists and its status
    const existing = await sql`
      SELECT reserv_status FROM reservation WHERE reservation_id = ${reservation_id}
    `;
    
    if (!existing || existing.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Reservation not found" }),
      };
    }
    
    // Check if already archived (to prevent duplicate key error)
    const archived = await sql`
      SELECT 1 FROM reservation_archive WHERE reservation_id = ${reservation_id}
    `;
    
    if (archived && archived.length > 0) {
      // Already archived — still ensure reservation and vehicle are marked correctly
      await sql`
        UPDATE reservation
        SET reserv_status = 'Completed',
            handled_by = ${driver_id || null}
        WHERE reservation_id = ${reservation_id}
          AND reserv_status != 'Completed'
      `;
      await sql`
        UPDATE vehicle
        SET status = 'Available'
        WHERE vehicle_id = ${vehicle_id}
      `;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: "Vehicle already returned" }),
      };
    }
    
    if (existing[0].reserv_status === 'Completed') {
      // Already completed but not archived, just update vehicle status
      await sql`
        UPDATE vehicle
        SET status = 'Available'
        WHERE vehicle_id = ${vehicle_id}
      `;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: "Vehicle already returned" }),
      };
    }

    // Mark reservation as Completed and set handled_by
    await sql`
      UPDATE reservation
      SET reserv_status = 'Completed',
          handled_by = ${driver_id || null}
      WHERE reservation_id = ${reservation_id}
    `;

    // Set vehicle back to available
    await sql`
      UPDATE vehicle
      SET status = 'Available'
      WHERE vehicle_id = ${vehicle_id}
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: "Vehicle returned successfully" }),
    };
  } catch (error) {
    console.error("Error returning vehicle:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to return vehicle", details: error.message }),
    };
  }
};
