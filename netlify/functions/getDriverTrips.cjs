const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

exports.handler = async (event) => {
  const driver_id = event.queryStringParameters?.driver_id;

  if (!driver_id) {
    return { statusCode: 400, body: "Missing driver_id" };
  }

  try {
    const result = await pool.query(
      `SELECT 
         r.reservation_id,
         r.startdate,
         r.enddate,
         r.reserv_status,
         r.vehicle_id,
         r.customer_id,
         v.brand,
         v.model,
         v.plate_number,
         c.fullname AS customer_name,
         c.contactnumber AS customer_contact
       FROM reservation r
       LEFT JOIN vehicle v ON r.vehicle_id = v.vehicle_id
       LEFT JOIN customer c ON r.customer_id = c.customer_id
       WHERE r.driver_id = $1
       ORDER BY r.startdate ASC`,
      [driver_id]
    );

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows),
    };
  } catch (err) {
    console.error("Error fetching driver trips:", err);
    return { statusCode: 500, body: "Server Error" };
  }
};
