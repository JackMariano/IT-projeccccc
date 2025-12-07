// netlify/functions/updateRFID.js
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

/**
 * Helper function to verify JWT token and get user info
 */
const verifyToken = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  // Verify user exists and is active
  const sql = neon(process.env.DATABASE_URL);
  const userResult = await sql(
    'SELECT state, role FROM "user" WHERE "user_ID" = $1',
    [decoded.user_ID]
  );

  if (userResult.length === 0) {
    throw new Error('User not found');
  }

  if (userResult[0].state !== 1) {
    throw new Error('User is not logged in');
  }

  return {
    user_ID: decoded.user_ID,
    role: userResult[0].role
  };
};

export const handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'CORS preflight' })
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Verify authentication
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const userInfo = await verifyToken(authHeader);
    
    // Check if user has permission (e.g., only staff/admin can update RFID)
    if (!['staff', 'admin'].includes(userInfo.role)) {
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Insufficient permissions to update RFID' })
      };
    }

    const { vehicle_ID, pricePaid, notes } = JSON.parse(event.body);

    if (!vehicle_ID || pricePaid === undefined || pricePaid === null) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Missing required fields: vehicle_ID and pricePaid are required' })
      };
    }

    if (typeof pricePaid !== 'number' || pricePaid <= 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'pricePaid must be a positive number' })
      };
    }

    // Initialize Neon SQL client
    const sql = neon(process.env.DATABASE_URL);

    // Start transaction
    await sql('BEGIN');

    try {
      // 1️⃣ Get latest amount_after from rfid_log and verify vehicle exists
      const getLatestResult = await sql(
        `SELECT rl."amount_after", v."plate", v."make", v."model"
         FROM "rfid_log" rl
         RIGHT JOIN "vehicle" v ON v."vehicle_ID" = $1
         WHERE rl."vehicle_ID" = $1
         ORDER BY rl."log_ID" DESC
         LIMIT 1`,
        [vehicle_ID]
      );

      if (getLatestResult.length === 0) {
        // Vehicle doesn't exist
        await sql('ROLLBACK');
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Vehicle not found' })
        };
      }

      const amount_before = getLatestResult[0].amount_after || 0;
      const vehicleInfo = {
        plate: getLatestResult[0].plate,
        make: getLatestResult[0].make,
        model: getLatestResult[0].model
      };

      // Check if sufficient balance
      if (amount_before < pricePaid) {
        await sql('ROLLBACK');
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            error: 'Insufficient RFID balance',
            current_balance: amount_before,
            required: pricePaid,
            shortfall: pricePaid - amount_before
          })
        };
      }

      // 2️⃣ Compute new balance
      const amount_after = amount_before - pricePaid;

      // 3️⃣ Insert new log entry
      const insertResult = await sql(
        `INSERT INTO "rfid_log"
        ("vehicle_ID", "amount_before", "amount_after", "deducted_amount", "processed_by", "notes")
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING "log_ID", "transaction_time"`,
        [vehicle_ID, amount_before, amount_after, pricePaid, userInfo.user_ID, notes || null]
      );

      // 4️⃣ Optional: Update vehicle's last RFID update timestamp
      await sql(
        `UPDATE "vehicle" 
         SET "last_rfid_update" = NOW()
         WHERE "vehicle_ID" = $1`,
        [vehicle_ID]
      );

      await sql('COMMIT');

      // Log the transaction for audit
      console.log("RFID transaction completed:", {
        log_ID: insertResult[0].log_ID,
        vehicle_ID,
        processed_by: userInfo.user_ID,
        amount_before,
        amount_after,
        deducted_amount: pricePaid,
        transaction_time: insertResult[0].transaction_time,
        timestamp: new Date().toISOString()
      });

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          message: "RFID updated successfully",
          transaction_id: insertResult[0].log_ID,
          transaction_time: insertResult[0].transaction_time,
          vehicle: {
            id: vehicle_ID,
            ...vehicleInfo
          },
          balance: {
            previous: amount_before,
            deducted: pricePaid,
            new: amount_after
          },
          processed_by: userInfo.user_ID,
          notes: notes || null
        })
      };
    } catch (transactionError) {
      await sql('ROLLBACK');
      throw transactionError;
    }

  } catch (error) {
    console.error("Update RFID Error:", error);
    
    // Handle specific error types
    let statusCode = 500;
    let errorMessage = 'Server Error';
    
    if (error.message.includes('jwt') || error.message.includes('token') || error.message.includes('Authorization')) {
      statusCode = 401;
      errorMessage = 'Authentication failed: ' + error.message;
    } else if (error.message.includes('permissions')) {
      statusCode = 403;
      errorMessage = error.message;
    } else if (error.message.includes('Missing required') || error.message.includes('must be')) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message.includes('Vehicle not found')) {
      statusCode = 404;
      errorMessage = error.message;
    } else if (error.message.includes('Insufficient')) {
      statusCode = 400;
      errorMessage = error.message;
    }
    
    return {
      statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};