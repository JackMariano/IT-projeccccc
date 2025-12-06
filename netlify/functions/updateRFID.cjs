// netlify/functions/updateRFID.js
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { vehicle_ID, pricePaid } = JSON.parse(event.body);

  if (!vehicle_ID || pricePaid === undefined) {
    return {
      statusCode: 400,
      body: "Missing required fields",
    };
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Get latest amount_after from rfid_log
    const { rows } = await client.query(
      `SELECT "amount_after"
       FROM "rfid_log"
       WHERE "vehicle_ID" = $1
       ORDER BY "log_ID" DESC
       LIMIT 1`,
      [vehicle_ID]
    );

    const amount_before = rows.length ? rows[0].amount_after : 0;

    // 2️⃣ Compute new balance
    const amount_after = amount_before - pricePaid;

    // 3️⃣ Insert new log entry
    await client.query(
      `INSERT INTO "rfid_log"
      ("vehicle_ID", "amount_before", "amount_after", "deducted_amount")
      VALUES ($1, $2, $3, $4)`,
      [vehicle_ID, amount_before, amount_after, pricePaid]
    );

    await client.query("COMMIT");

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "RFID updated successfully",
        amount_before,
        amount_after,
      }),
    };
  } catch (err) {
    console.error("Update RFID Error:", err);
    await client.query("ROLLBACK");
    return {
      statusCode: 500,
      body: "Server Error",
    };
  } finally {
    client.release();
  }
};
