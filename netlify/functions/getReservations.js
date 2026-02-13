import { neon } from '@neondatabase/serverless';

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    const sql = neon(connectionString);

    const reservations = await sql`
      SELECT 
        r.reservation_id as id,
        r.startdate,
        r.enddate,
        r.reserv_status as status,
        r.vehicle_id,
        r.customer_id,
        r.driver_id,
        c.fullname as customer_name,
        c.contactnumber as contact_number,
        v.plate_number,
        v.brand,
        v.model,
        r.handled_by
      FROM reservation r
      LEFT JOIN customer c ON r.customer_id = c.customer_id
      LEFT JOIN vehicle v ON r.vehicle_id = v.vehicle_id
      ORDER BY r.startdate DESC
    `;

    // Dynamically calculate the correct status based on current time,
    // but respect reservations already marked Completed or Cancelled in the DB
    const now = new Date();
    const reservationsWithDynamicStatus = reservations.map(reservation => {
      const dbStatus = reservation.status;

      if (dbStatus === 'Completed' || dbStatus === 'Cancelled') {
        return reservation;
      }

      const startDate = new Date(reservation.startdate);
      const endDate = new Date(reservation.enddate);

      let calculatedStatus;
      if (now < startDate) {
        calculatedStatus = 'Upcoming';
      } else if (now <= endDate) {
        calculatedStatus = 'Ongoing';
      } else {
        calculatedStatus = 'Completed';
      }

      return { ...reservation, status: calculatedStatus };
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservations: reservationsWithDynamicStatus }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to fetch reservations" }),
    };
  }
};