import { neon } from "@neondatabase/serverless";

export async function handler(event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "CORS preflight successful" }),
    };
  }

  try {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    const sql = neon(databaseUrl);

    const results = {
      constraint_dropped: false,
      constraint_readded: false,
      errors: [],
    };

    try {
      await sql`DROP CONSTRAINT IF EXISTS inventory_logs_action_type_check`;
      results.constraint_dropped = true;
      console.log("Dropped old constraint");
    } catch (err) {
      console.log("Drop constraint error:", err.message);
    }

    try {
      await sql`
        ALTER TABLE inventory_logs 
        ADD CONSTRAINT inventory_logs_action_type_check 
        CHECK (action_type IN ('RESTOCK', 'CONSUMPTION', 'ADJUSTMENT', 'RETURN', 'RETURN_APPROVED'))
      `;
      results.constraint_readded = true;
      console.log("Added new constraint with RETURN and RETURN_APPROVED");
    } catch (err) {
      console.log("Add constraint error:", err.message);
      if (!err.message.includes("already exists")) {
        results.errors.push(`constraint: ${err.message}`);
      } else {
        results.constraint_readded = true;
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Constraint migration completed",
        results,
      }),
    };
  } catch (error) {
    console.error("Migration error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || "Migration failed",
      }),
    };
  }
}
