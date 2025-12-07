// netlify/functions/updateRFID.js
import { neon } from '@neondatabase/serverless';

export const handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle OPTIONS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { vehicle_ID, amount, transaction_type, user_ID, notes } = body;

    // Validate required fields
    if (!vehicle_ID || amount === undefined || !transaction_type || !user_ID) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: "Missing required fields: vehicle_ID, amount, transaction_type, user_ID are required" 
        }),
      };
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Amount must be a valid number" }),
      };
    }

    console.log(`Processing RFID transaction: ${transaction_type} ${amountNum} for vehicle ${vehicle_ID}`);

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

    // Get current balance - NEW SYNTAX
    const currentBalanceResult = await sql`
      SELECT amount_after
      FROM rfid_log
      WHERE vehicle_ID = ${vehicle_ID}
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    const previous_balance = currentBalanceResult.length > 0 
      ? parseFloat(currentBalanceResult[0].amount_after) 
      : 0;

    // Calculate new balance based on transaction type
    let amount_after;
    if (transaction_type === "reload" || transaction_type === "credit") {
      amount_after = previous_balance + amountNum;
    } else if (transaction_type === "deduct" || transaction_type === "debit") {
      amount_after = previous_balance - amountNum;
      
      // Check for negative balance
      if (amount_after < 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: "Insufficient balance",
            current_balance: previous_balance,
            attempted_deduction: amountNum 
          }),
        };
      }
    } else if (transaction_type === "set") {
      amount_after = amountNum;
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: "Invalid transaction type. Use 'reload', 'deduct', or 'set'",
          received_type: transaction_type 
        }),
      };
    }

    // Insert new RFID log - NEW SYNTAX
    const result = await sql`
      INSERT INTO rfid_log (
        vehicle_ID,
        amount_before,
        amount,
        amount_after,
        transaction_type,
        user_ID,
        notes,
        timestamp
      ) VALUES (
        ${vehicle_ID},
        ${previous_balance},
        ${amountNum},
        ${amount_after},
        ${transaction_type},
        ${user_ID},
        ${notes || ''},
        NOW()
      )
      RETURNING log_id, timestamp
    `;

    const newLog = result[0];
    console.log(`RFID transaction recorded: ID ${newLog.log_id}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "RFID transaction recorded successfully",
        transaction: {
          log_id: newLog.log_id,
          vehicle_ID: vehicle_ID,
          previous_balance: previous_balance,
          amount: amountNum,
          new_balance: amount_after,
          transaction_type: transaction_type,
          timestamp: newLog.timestamp,
          user_ID: user_ID,
          notes: notes || ''
        }
      }),
    };

  } catch (err) {
    console.error("Update RFID error:", err);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "Server Error",
        details: err.message 
      }),
    };
  }
};