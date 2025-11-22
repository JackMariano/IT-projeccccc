// netlify/functions/updateRFID.js
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { vehicle_ID, pricePaid, newBalance } = JSON.parse(event.body);

  if (!vehicle_ID || pricePaid === undefined || newBalance === undefined) {
    return {
      statusCode: 400,
      body: "Missing required fields",
    };
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Fetch current balance
    const beforeRes = await client.query(
      `SELECT "rfid_balance" FROM "vehicle" WHERE "vehicle_ID" = $1`,
      [vehicle_ID]
    );

    if (beforeRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return { statusCode: 404, body: "Vehicle not found" };
    }

    const amount_before = beforeRes.rows[0].rfid_balance;

    // 2️⃣ Insert into rfid_log
    await client.query(
      `INSERT INTO "rfid_log"
      ("vehicle_ID", "amount_before", "amount_after", "deducted_amount")
      VALUES ($1, $2, $3, $4)`,
      [vehicle_ID, amount_before, newBalance, pricePaid]
    );

    // 3️⃣ Update vehicle balance
    await client.query(
      `UPDATE "vehicle" SET "rfid_balance" = $1 WHERE "vehicle_ID" = $2`,
      [newBalance, vehicle_ID]
    );

    await client.query("COMMIT");

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "RFID updated successfully" }),
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
