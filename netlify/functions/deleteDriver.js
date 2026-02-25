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
    const { user_id } = JSON.parse(event.body);

    if (!user_id) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "User ID is required" }),
      };
    }

    const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    const sql = neon(connectionString);

    // Use a transaction if possible, but neon() might not support it easily in this syntax
    // We'll do it sequentially
    
    // 1. Delete user sessions
    await sql`DELETE FROM user_sessions WHERE user_id = ${user_id}`;

    // 2. Delete inventory related records
    await sql`DELETE FROM inventory_adjustments WHERE user_id = ${user_id} OR approval_authority_id = ${user_id}`;
    await sql`DELETE FROM inventory_logs WHERE user_id = ${user_id} OR approval_authority_id = ${user_id} OR adjusted_by = ${user_id}`;
    await sql`DELETE FROM inventory_returns WHERE user_id = ${user_id}`;
    
    // 3. Delete reservations where this user is the driver or handled by them
    // Before deleting, ensure handled_by is not null on reservations being archived by the trigger.
    // Reservations where driver_id = user_id but handled_by IS NULL will fail the archive constraint.
    await sql`UPDATE reservation SET handled_by = driver_id WHERE driver_id = ${user_id} AND handled_by IS NULL`;
    await sql`DELETE FROM reservation WHERE driver_id = ${user_id} OR handled_by = ${user_id}`;
    
    // 4. Delete usage logs reported by this user
    await sql`DELETE FROM usage_log WHERE reported_by = ${user_id}`;
    
    // 5. Delete vehicle issues and associated repair logs
    // First repair logs where the user was the one who changed the status
    await sql`DELETE FROM repair_log WHERE changed_by = ${user_id}`;
    
    // Then repair logs associated with issues reported by this user
    await sql`DELETE FROM repair_log WHERE issue_id IN (SELECT issue_id FROM vehicle_issues WHERE reported_by = ${user_id})`;
    
    // Finally the issues themselves
    await sql`DELETE FROM vehicle_issues WHERE reported_by = ${user_id}`;
    
    // 6. Delete employee record
    await sql`DELETE FROM employee WHERE user_id = ${user_id}`;
    
    // 7. Finally delete the user record
    await sql`DELETE FROM "user" WHERE user_id = ${user_id}`;

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "DELETE, OPTIONS"
      },
      body: JSON.stringify({ message: "Driver deleted successfully" }),
    };
  } catch (error) {
    console.error("Error deleting driver:", error);
    return {
      statusCode: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: JSON.stringify({ 
        error: "Failed to delete driver", 
        details: error.message,
        hint: "This might be due to existing records linked to this driver in other tables." 
      }),
    };
  }
};
