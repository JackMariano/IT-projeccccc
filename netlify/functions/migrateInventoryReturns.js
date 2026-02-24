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
      inventory_returns_created: false,
      errors: [],
    };

    try {
      await sql`
        CREATE TABLE IF NOT EXISTS inventory_returns (
          return_id SERIAL PRIMARY KEY,
          part_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          approval_authority_id INTEGER,
          quantity INTEGER NOT NULL,
          return_reason TEXT NOT NULL,
          return_status VARCHAR(20) DEFAULT 'PENDING',
          due_date DATE,
          job_id INTEGER,
          reference_document VARCHAR(255),
          approved_at TIMESTAMP,
          completed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (part_id) REFERENCES inventory(part_id)
        )
      `;
      results.inventory_returns_created = true;
      console.log("Successfully created inventory_returns table");
    } catch (err) {
      console.log("inventory_returns creation:", err.message);
      if (!err.message.includes("already exists")) {
        results.errors.push(`inventory_returns: ${err.message}`);
      } else {
        results.inventory_returns_created = true;
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Database schema migration completed",
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
