// netlify/functions/getVehicleIssues.js
import { neon } from '@neondatabase/serverless';

export const handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    // Get issues with names from employee table
    const issues = await sql`
      SELECT 
        vi.issue_id,
        vi.vehicle_id,
        v.brand,
        v.model,
        v.plate_number,
        v.status as vehicle_status,
        vi.reported_by,
        -- Get reporter name: use employee name if exists, otherwise username
        COALESCE(
          e_reporter.firstname || ' ' || e_reporter.lastname,
          u.username,
          'Unknown'
        ) as reported_by_name,
        vi.issue_categories,
        vi.custom_issue,
        vi.issue_description,
        vi.reported_date,
        vi.status as issue_status,
        vi.severity,
        -- Get latest repair log entry with updater name
        (
          SELECT 
            COALESCE(
              e_updater.firstname || ' ' || e_updater.lastname,
              uc.username,
              'System'
            )
          FROM repair_log rl
          LEFT JOIN "user" uc ON rl.changed_by = uc.user_id
          LEFT JOIN employee e_updater ON uc.user_id = e_updater.user_id
          WHERE rl.issue_id = vi.issue_id
          ORDER BY rl.timestamp DESC
          LIMIT 1
        ) as last_updated_by,
        (
          SELECT rl.timestamp
          FROM repair_log rl
          WHERE rl.issue_id = vi.issue_id
          ORDER BY rl.timestamp DESC
          LIMIT 1
        ) as last_update_time
      FROM vehicle_issues vi
      LEFT JOIN vehicle v ON vi.vehicle_id = v.vehicle_id
      LEFT JOIN "user" u ON vi.reported_by = u.user_id
      LEFT JOIN employee e_reporter ON u.user_id = e_reporter.user_id
      ORDER BY vi.reported_date DESC
    `;

    const formattedIssues = issues.map(issue => ({
      issue_id: issue.issue_id,
      vehicle_id: issue.vehicle_id,
      brand: issue.brand,
      model: issue.model,
      plate_number: issue.plate_number,
      vehicle_status: issue.vehicle_status,
      reported_by: issue.reported_by,
      reported_by_name: issue.reported_by_name,
      issue_categories: issue.issue_categories || [],
      custom_issue: issue.custom_issue,
      issue_description: issue.issue_description,
      reported_date: issue.reported_date ? issue.reported_date.toISOString() : null,
      status: issue.issue_status || 'Reported',
      severity: issue.severity,
      last_updated_by: issue.last_updated_by,
      last_update_time: issue.last_update_time ? issue.last_update_time.toISOString() : null
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: formattedIssues
      })
    };

  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};