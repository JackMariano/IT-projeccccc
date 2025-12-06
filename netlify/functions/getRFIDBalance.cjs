// netlify/functions/getRFIDBalance.js
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

exports.handler = async (event) => {
  const vehicle_ID = event.queryStringParameters?.vehicle_ID;

  if (!vehicle_ID) {
    return {
      statusCode: 400,
      body: "Missing vehicle_ID",
    };
  }

  try {
    const result = await pool.query(
      `SELECT "amount_after"
       FROM "rfid_log"
       WHERE "vehicle_ID" = $1
       ORDER BY "timestamp" DESC
       LIMIT 1`,
      [vehicle_ID]
    );

    if (result.rows.length === 0) {
      return { statusCode: 404, body: "No RFID log found for this vehicle" };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ balance: result.rows[0].amount_after }),
    };
  } catch (err) {
    console.error("Get RFID Balance error:", err);
    return {
      statusCode: 500,
      body: "Server Error",
    };
  }
};
