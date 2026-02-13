import { neon } from '@neondatabase/serverless';

export const handler = async (event) => {
  const driver_id = event.queryStringParameters?.driver_id;

  if (!driver_id) {
    return { 
      statusCode: 400, 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: "Missing driver_id" }) 
    };
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    const result = await sql`
      SELECT 
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
      WHERE r.driver_id = ${driver_id}
      ORDER BY r.startdate ASC
    `;

    // Dynamically calculate the correct status based on current time
    const now = new Date();
    const tripsWithDynamicStatus = result.map(trip => {
      const startDate = new Date(trip.startdate);
      const endDate = new Date(trip.enddate);

      const dbStatus = trip.reserv_status;

      // Respect explicit DB completion (e.g., driver manually returned vehicle)
      if (dbStatus === 'Completed' || dbStatus === 'Cancelled') {
        return { ...trip, db_status: dbStatus };
      }

      let calculatedStatus;
      if (now < startDate) {
        calculatedStatus = 'Upcoming';
      } else if (now <= endDate) {
        calculatedStatus = 'Ongoing';
      } else {
        calculatedStatus = 'Completed';
      }

      return {
        ...trip,
        reserv_status: calculatedStatus,
        db_status: dbStatus  // raw DB value for frontend logic
      };
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tripsWithDynamicStatus),
    };
  } catch (err) {
    console.error("Error fetching driver trips:", err);
    return { 
      statusCode: 500, 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: "Server Error" }) 
    };
  }
};