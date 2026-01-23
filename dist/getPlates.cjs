// netlify/functions/getPlates.js
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

exports.handler = async () => {
  try {
    const result = await pool.query(
      `SELECT "vehicle_id", "plate_number" FROM "vehicle"`
    );

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows),
    };
  } catch (err) {
    console.error("Error fetching plates:", err);
    return {
      statusCode: 500,
      body: "Server Error",
    };
  }
};
