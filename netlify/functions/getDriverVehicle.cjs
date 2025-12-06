// /.netlify/functions/getDriverVehicle.js
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Set in Netlify environment
  ssl: {
    rejectUnauthorized: false,
  },
});

exports.handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
      },
      body: JSON.stringify({ message: 'CORS preflight' })
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const driver_id = event.queryStringParameters.driver_id;

    if (!driver_id) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Driver ID is required' })
      };
    }

    // Fetch the ongoing reservation for this driver
    const reservationRes = await pool.query(
      `
      SELECT r.vehicle_id
      FROM reservation r
      WHERE r.driver_id = $1 AND r.reserv_status = 'Ongoing'
      LIMIT 1
      `,
      [driver_id]
    );

    if (reservationRes.rows.length === 0) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vehicle: null, message: 'No ongoing reservation found' }),
      };
    }

    const vehicleId = reservationRes.rows[0].vehicle_id;

    // Fetch vehicle info (brand, model, plate_number) and latest odometer/mileage
    const vehicleRes = await pool.query(
      `
      SELECT 
        v.vehicle_id, 
        v.brand, 
        v.model, 
        v.plate_number,
        COALESCE(ul.current_odometer, 0) as prevOdometer,
        COALESCE(ul.current_fuel, 0) as prevMileage
      FROM vehicle v
      LEFT JOIN usage_log ul ON v.vehicle_id = ul.vehicle_id 
        AND ul.timestamp = (
          SELECT MAX(timestamp) 
          FROM usage_log 
          WHERE vehicle_id = v.vehicle_id
        )
      WHERE v.vehicle_id = $1
      `,
      [vehicleId]
    );

    if (vehicleRes.rows.length === 0) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vehicle: null, message: 'Vehicle not found' }),
      };
    }

    const vehicleData = vehicleRes.rows[0];
    
    const response = {
      vehicle: {
        vehicle_id: vehicleData.vehicle_id,
        brand: vehicleData.brand,
        model: vehicleData.model,
        plate_number: vehicleData.plate_number
      },
      prevOdometer: vehicleData.prevodometer,
      prevMileage: vehicleData.prevmileage
    };

    console.log("Sending vehicle data:", response); // Debug log

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(response),
    };
  } catch (err) {
    console.error(err);
    return { 
      statusCode: 500, 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: err.message }) 
    };
  }
};