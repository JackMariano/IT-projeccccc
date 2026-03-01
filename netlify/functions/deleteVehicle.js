import { neon } from '@neondatabase/serverless';

export const handler = async (event) => {
  if (event.httpMethod !== "DELETE") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    let vehicle_id;
    try {
      const body = JSON.parse(event.body);
      vehicle_id = body.vehicle_id;
    } catch (e) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Invalid JSON body" }),
      };
    }

    if (!vehicle_id) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Vehicle ID is required" }),
      };
    }

    const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    const sql = neon(connectionString);

    try {
      // 1. Delete repair_log entries for all issues of this vehicle
      await sql`DELETE FROM repair_log WHERE issue_id IN (SELECT issue_id FROM vehicle_issues WHERE vehicle_id = ${vehicle_id})`;
    } catch (e) {
      console.log("repair_log delete error:", e.message);
    }

    try {
      // 2. Delete inventory_returns that might be linked to this vehicle's issues
      await sql`DELETE FROM inventory_returns WHERE job_id IN (SELECT issue_id FROM vehicle_issues WHERE vehicle_id = ${vehicle_id})`;
    } catch (e) {
      console.log("inventory_returns delete error:", e.message);
    }

    try {
      // 3. Delete inventory_adjustments that might be linked to this vehicle's issues
      await sql`DELETE FROM inventory_adjustments WHERE job_id IN (SELECT issue_id FROM vehicle_issues WHERE vehicle_id = ${vehicle_id})`;
    } catch (e) {
      console.log("inventory_adjustments delete error:", e.message);
    }

    try {
      // 4. Delete inventory_logs. Must happen before usage_log and vehicle_issues deletion
      // It can be linked via vehicle_id or job_id (issue_id)
      await sql`DELETE FROM inventory_logs 
                WHERE vehicle_id = ${vehicle_id} 
                OR job_id IN (SELECT issue_id FROM vehicle_issues WHERE vehicle_id = ${vehicle_id})`;
    } catch (e) {
      console.log("inventory_logs delete error:", e.message);
    }

    try {
      // 5. Delete vehicle_issues
      await sql`DELETE FROM vehicle_issues WHERE vehicle_id = ${vehicle_id}`;
    } catch (e) {
      console.log("vehicle_issues delete error:", e.message);
    }

    try {
      // 6. Delete usage_log
      await sql`DELETE FROM usage_log WHERE vehicle_id = ${vehicle_id}`;
    } catch (e) {
      console.log("usage_log delete error:", e.message);
    }

    try {
      // 7. Delete inspections
      await sql`DELETE FROM inspections WHERE vehicle_id = ${vehicle_id}`;
    } catch (e) {
      console.log("inspections delete error:", e.message);
    }

    try {
      // 8. Delete from route table (as it might have a foreign key to vehicle_id)
      await sql`DELETE FROM route WHERE vehicle_id = ${vehicle_id}`;
    } catch (e) {
      console.log("route delete error:", e.message);
    }

    try {
      // 9. Delete reservation_archive entries associated with this vehicle
      await sql`DELETE FROM reservation_archive WHERE vehicle_id = ${vehicle_id}`;
    } catch (e) {
      console.log("reservation_archive delete by vehicle_id error:", e.message);
    }

    try {
      // 10. Also delete from reservation_archive based on reservation_id link
      await sql`DELETE FROM reservation_archive WHERE reservation_id IN (SELECT reservation_id FROM reservation WHERE vehicle_id = ${vehicle_id})`;
    } catch (e) {
      console.log("reservation_archive delete by reservation_id error:", e.message);
    }

    try {
      // 11. Delete reservations
      await sql`DELETE FROM reservation WHERE vehicle_id = ${vehicle_id}`;
    } catch (e) {
      console.log("reservation delete error:", e.message);
    }
    
    // Finally delete the vehicle
    const result = await sql`DELETE FROM vehicle WHERE vehicle_id = ${vehicle_id} RETURNING vehicle_id`;

    if (result.length === 0) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Vehicle not found" }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Vehicle deleted successfully" }),
    };
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to delete vehicle", details: error.message }),
    };
  }
};
