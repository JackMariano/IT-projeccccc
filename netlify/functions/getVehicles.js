import { neon } from "@neondatabase/serverless";

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const connectionString =
      process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("Database connection string not configured");
    }

    const sql = neon(connectionString);

    // Fetch vehicles with their active reservation joined directly (LATERAL ensures consistency)
    const vehicles = await sql`
      SELECT
        v.vehicle_id,
        v.brand,
        v.model,
        v.year,
        v.plate_number,
        v.status,
        v.daily_rate,
        CASE
          WHEN v.status NOT IN ('Available', 'Reserved', 'In Use') THEN v.status
          WHEN EXISTS (
            SELECT 1 FROM reservation r
            WHERE r.vehicle_id = v.vehicle_id
              AND LOWER(r.reserv_status) NOT IN ('completed', 'cancelled')
              AND NOW() BETWEEN r.startdate AND r.enddate
          ) THEN 'In Use'
          WHEN EXISTS (
            SELECT 1 FROM reservation r
            WHERE r.vehicle_id = v.vehicle_id
              AND LOWER(r.reserv_status) NOT IN ('completed', 'cancelled')
              AND NOW() < r.startdate
          ) THEN 'Reserved'
          WHEN v.status IN ('Reserved', 'In Use') THEN 'Available'
          ELSE v.status
        END AS computed_status,
        ar.reservation_id        AS ar_id,
        ar.startdate             AS ar_startdate,
        ar.enddate               AS ar_enddate,
        ar.reserv_status         AS ar_reserv_status,
        ar.customer_name         AS ar_customer_name,
        ar.customer_contact      AS ar_customer_contact,
        ar.driver_name           AS ar_driver_name
      FROM vehicle v
      LEFT JOIN LATERAL (
        SELECT
          r.reservation_id,
          r.startdate,
          r.enddate,
          r.reserv_status,
          c.fullname           AS customer_name,
          c.contactnumber      AS customer_contact,
          COALESCE(e.firstname || ' ' || e.lastname, 'Not assigned') AS driver_name
        FROM reservation r
        LEFT JOIN customer c ON r.customer_id = c.customer_id
        LEFT JOIN employee e ON r.driver_id = e.user_id
        WHERE r.vehicle_id = v.vehicle_id
          AND LOWER(r.reserv_status) NOT IN ('completed', 'cancelled')
        ORDER BY r.startdate ASC
        LIMIT 1
      ) ar ON TRUE
      ORDER BY v.plate_number
    `;

    // Get all active issues
    const allIssues = await sql`
      SELECT
        vi.vehicle_id,
        vi.issue_id,
        vi.issue_description,
        vi.issue_categories,
        vi.severity,
        vi.status as issue_status,
        vi.reported_date,
        vi.reported_by
      FROM vehicle_issues vi
      WHERE vi.status != 'Resolved'
    `;

    // Get recent completed/cancelled reservations for history (up to 5 per vehicle)
    const recentReservationsData = await sql`
      SELECT
        r.vehicle_id,
        r.reservation_id,
        r.startdate,
        r.enddate,
        r.reserv_status,
        c.fullname           AS customer_name,
        c.contactnumber      AS customer_contact,
        COALESCE(e.firstname || ' ' || e.lastname, 'Not assigned') AS driver_name
      FROM reservation r
      LEFT JOIN customer c ON r.customer_id = c.customer_id
      LEFT JOIN employee e ON r.driver_id = e.user_id
      WHERE LOWER(r.reserv_status) IN ('completed', 'cancelled')
      ORDER BY r.enddate DESC
      LIMIT 100
    `;

    // Map issues by vehicle_id (most critical first)
    const issueSeverity = { Critical: 1, High: 2, Medium: 3, Low: 4 };
    const issueMap = {};
    for (const issue of allIssues) {
      const current = issueMap[issue.vehicle_id];
      const currentSev = current ? issueSeverity[current.severity] || 5 : 6;
      const newSev = issueSeverity[issue.severity] || 5;
      if (!current || newSev < currentSev) {
        issueMap[issue.vehicle_id] = {
          issueId: issue.issue_id,
          description: issue.issue_description,
          categories: issue.issue_categories,
          severity: issue.severity,
          status: issue.issue_status,
          reportedDate: issue.reported_date,
          reportedBy: issue.reported_by,
        };
      }
    }

    // Map recent reservations by vehicle_id (up to 5 per vehicle)
    const recentReservationsMap = {};
    for (const res of recentReservationsData) {
      if (!recentReservationsMap[res.vehicle_id]) {
        recentReservationsMap[res.vehicle_id] = [];
      }
      if (recentReservationsMap[res.vehicle_id].length < 5) {
        recentReservationsMap[res.vehicle_id].push({
          reservationId: res.reservation_id,
          startDate: res.startdate,
          endDate: res.enddate,
          status: res.reserv_status,
          customerName: res.customer_name,
          customerContact: res.customer_contact,
          driverName: res.driver_name,
        });
      }
    }

    // Combine data
    const processedVehicles = vehicles.map((v) => {
      const activeReservation = v.ar_id
        ? {
            reservationId: v.ar_id,
            startDate: v.ar_startdate,
            endDate: v.ar_enddate,
            status: v.ar_reserv_status,
            customerName: v.ar_customer_name,
            customerContact: v.ar_customer_contact,
            driverName: v.ar_driver_name,
          }
        : null;

      return {
        vehicle_id: v.vehicle_id,
        brand: v.brand,
        model: v.model,
        year: v.year,
        plate_number: v.plate_number,
        status: v.computed_status || v.status || "Available",
        daily_rate: v.daily_rate,
        vehicle_type: "Standard",
        archived: false,
        odometer: 0,
        active_reservations: 0,
        active_issues: 0,
        activeReservation,
        activeIssue: issueMap[v.vehicle_id] || null,
        recentReservations: recentReservationsMap[v.vehicle_id] || [],
      };
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicles: processedVehicles }),
    };
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Failed to fetch vehicles",
        details: error.message,
      }),
    };
  }
};
