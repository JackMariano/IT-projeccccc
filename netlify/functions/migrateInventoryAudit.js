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
      inventory_logs_enhanced: false,
      inventory_adjustments_created: false,
      errors: [],
    };

    // Step 1: Add new columns to inventory_logs table if they don't exist
    try {
      await sql`
        ALTER TABLE inventory_logs 
        ADD COLUMN IF NOT EXISTS approval_authority_id INTEGER,
        ADD COLUMN IF NOT EXISTS reference_document VARCHAR(255),
        ADD COLUMN IF NOT EXISTS reason TEXT,
        ADD COLUMN IF NOT EXISTS job_id INTEGER,
        ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100) UNIQUE,
        ADD COLUMN IF NOT EXISTS is_adjusted BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS adjusted_by INTEGER,
        ADD COLUMN IF NOT EXISTS adjusted_at TIMESTAMP
      `;
      results.inventory_logs_enhanced = true;
      console.log("Successfully enhanced inventory_logs table");
    } catch (err) {
      console.log("inventory_logs enhancement:", err.message);
      if (!err.message.includes("already exists")) {
        results.errors.push(`inventory_logs: ${err.message}`);
      } else {
        results.inventory_logs_enhanced = true;
      }
    }

    // Step 2: Create inventory_adjustments table for manual adjustments
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS inventory_adjustments (
          adjustment_id SERIAL PRIMARY KEY,
          part_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          approval_authority_id INTEGER,
          adjustment_type VARCHAR(50) NOT NULL,
          quantity_change INTEGER NOT NULL,
          previous_quantity INTEGER NOT NULL,
          new_quantity INTEGER NOT NULL,
          reason TEXT NOT NULL,
          reference_document VARCHAR(255),
          job_id INTEGER,
          status VARCHAR(20) DEFAULT 'PENDING',
          approved_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (part_id) REFERENCES inventory(part_id)
        )
      `;
      results.inventory_adjustments_created = true;
      console.log("Successfully created inventory_adjustments table");
    } catch (err) {
      console.log("inventory_adjustments creation:", err.message);
      if (!err.message.includes("already exists")) {
        results.errors.push(`inventory_adjustments: ${err.message}`);
      } else {
        results.inventory_adjustments_created = true;
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
