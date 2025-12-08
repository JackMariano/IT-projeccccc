// netlify/functions/getVehicleIssues.js
import { neon } from '@neondatabase/serverless';

export const handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    const issues = await sql`
      SELECT 
        vi.issue_id,
        vi.vehicle_id,
        v.brand,
        v.model,
        v.plate_number,
        vi.reported_by,
        u.username as reported_by_name,
        vi.issue_categories,
        vi.custom_issue,
        vi.issue_description,
        vi.reported_date,
        vi.status,
        vi.severity
      FROM vehicle_issues vi
      LEFT JOIN vehicle v ON vi.vehicle_id = v.vehicle_id
      LEFT JOIN "user" u ON vi.reported_by = u.user_id
      ORDER BY vi.reported_date DESC
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: issues
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