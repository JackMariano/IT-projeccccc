import { neon } from "@neondatabase/serverless";
import jwt from "jsonwebtoken";

// Verify JWT token and user existence
const verifyToken = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const sql = neon(process.env.DATABASE_URL);
  const userResult = await sql.query(
    'SELECT state, role FROM "user" WHERE "user_id" = $1',
    [decoded.user_ID],
  );

  if (userResult.length === 0) throw new Error("User not found");
  if (userResult[0].state !== 1) throw new Error("User is not logged in");

  return { user_ID: decoded.user_ID, role: userResult[0].role };
};

export const handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "CORS preflight" }),
    };
  }

  if (event.httpMethod === "GET") {
    try {
      const authHeader =
        event.headers.authorization || event.headers.Authorization;
      // It's possible that a GET request for RFID balance might not always have an auth token (e.g., for public display)
      // but for security, we'll keep it for now. If issues arise, this can be made optional.
      const userInfo = await verifyToken(authHeader); // Ensure user is authenticated to view balance

      const { vehicle_ID } = event.queryStringParameters;
      if (!vehicle_ID) {
        return {
          statusCode: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            error: "Missing required parameter: vehicle_ID",
          }),
        };
      }

      const sql = neon(process.env.DATABASE_URL);
      const getLatestResult = await sql.query(
        `SELECT amount_after FROM rfid_log WHERE vehicle_id = $1 ORDER BY log_id DESC LIMIT 1`,
        [vehicle_ID],
      );

      const balance =
        getLatestResult.length > 0 ? getLatestResult[0].amount_after : 0;

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ balance }),
      };
    } catch (error) {
      console.error("Get RFID Balance Error:", error);
      let statusCode = 500;
      let errorMessage = "Server Error";

      if (error.message.includes("jwt") || error.message.includes("token")) {
        statusCode = 401;
        errorMessage = "Authentication failed: " + error.message;
      } else if (error.message.includes("Missing required parameter")) {
        statusCode = 400;
        errorMessage = error.message;
      }

      return {
        statusCode,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: errorMessage }),
      };
    }
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const authHeader =
      event.headers.authorization || event.headers.Authorization;
    const userInfo = await verifyToken(authHeader);

    if (!["staff", "admin", "manager"].includes(userInfo.role.toLowerCase())) {
      return {
        statusCode: 403,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Insufficient permissions to update RFID",
        }),
      };
    }

    const { vehicle_ID, pricePaid, transaction_type } = JSON.parse(event.body);
    const isReload = transaction_type === "reload";

    if (!vehicle_ID || pricePaid === undefined || pricePaid === null) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error:
            "Missing required fields: vehicle_ID and pricePaid are required",
        }),
      };
    }

    if (typeof pricePaid !== "number" || pricePaid <= 0) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: "pricePaid must be a positive number" }),
      };
    }

    const sql = neon(process.env.DATABASE_URL);

    // Start transaction
    await sql.query("BEGIN");

    try {
      // Get latest RFID balance and vehicle info
      const getLatestResult = await sql.query(
        `SELECT rl.amount_after, v.plate_number, v.brand, v.model
         FROM vehicle v
         LEFT JOIN rfid_log rl ON v.vehicle_id = rl.vehicle_id
         WHERE v.vehicle_id = $1
         ORDER BY rl.log_id DESC
         LIMIT 1`,
        [vehicle_ID],
      );

      if (getLatestResult.length === 0 || !getLatestResult[0].plate_number) {
        await sql.query("ROLLBACK");
        return {
          statusCode: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ error: "Vehicle not found" }),
        };
      }

      const amount_before = getLatestResult[0].amount_after || 0;
      const vehicleInfo = {
        plate: getLatestResult[0].plate_number,
        make: getLatestResult[0].brand,
        model: getLatestResult[0].model,
      };

      if (!isReload && amount_before < pricePaid) {
        await sql.query("ROLLBACK");
        return {
          statusCode: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            error: "Insufficient RFID balance",
            current_balance: amount_before,
            required: pricePaid,
            shortfall: pricePaid - amount_before,
          }),
        };
      }

      const amount_after = isReload
        ? amount_before + pricePaid
        : amount_before - pricePaid;

      const insertResult = await sql.query(
        `INSERT INTO rfid_log
         (vehicle_id, amount_before, amount_after, amount_deducted)
         VALUES ($1, $2, $3, $4)
         RETURNING log_id, timestamp`,
        [vehicle_ID, amount_before, amount_after, pricePaid],
      );

      // await sql.query(
      //   `UPDATE vehicle
      //    SET last_rfid_update = NOW()
      //    WHERE vehicle_id = $1`,
      //   [vehicle_ID],
      // );

      await sql.query("COMMIT");

      console.log("RFID transaction completed:", {
        log_id: insertResult[0].log_id,
        vehicle_ID,
        transaction_type: isReload ? "reload" : "deduct",
        amount_before,
        amount_after,
        [isReload ? "amount_added" : "amount_deducted"]: pricePaid,
        transaction_time: insertResult[0].timestamp,
        timestamp: new Date().toISOString(),
      });

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: true,
          message: "RFID updated successfully",
          transaction_id: insertResult[0].log_id,
          transaction_time: insertResult[0].timestamp,
          vehicle: { id: vehicle_ID, ...vehicleInfo },
          balance: {
            previous: amount_before,
            [isReload ? "added" : "deducted"]: pricePaid,
            new: amount_after,
          },
        }),
      };
    } catch (txError) {
      await sql.query("ROLLBACK");
      throw txError;
    }
  } catch (error) {
    console.error("Update RFID Error:", error);

    let statusCode = 500;
    let errorMessage = "Server Error";

    if (
      error.message.includes("jwt") ||
      error.message.includes("token") ||
      error.message.includes("Authorization")
    ) {
      statusCode = 401;
      errorMessage = "Authentication failed: " + error.message;
    } else if (error.message.includes("permissions")) {
      statusCode = 403;
      errorMessage = error.message;
    } else if (
      error.message.includes("Missing required") ||
      error.message.includes("must be")
    ) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message.includes("Vehicle not found")) {
      statusCode = 404;
      errorMessage = error.message;
    } else if (error.message.includes("Insufficient")) {
      statusCode = 400;
      errorMessage = error.message;
    }

    return {
      statusCode,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      }),
    };
  }
};
