// netlify/functions/getRepairLogs.js
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
    const { issue_id } = event.queryStringParameters || {};
    const sql = neon(process.env.DATABASE_URL);

    let query;
    let params = [];

    if (issue_id) {
      query = sql`
        SELECT 
          rl.repairlog_id,
          rl.issue_id,
          rl.changed_by,
          uc.username as changer_name,
          rl.status,
          rl.timestamp,
          vi.issue_description,
          v.brand,
          v.model,
          v.plate_number
        FROM repair_log rl
        LEFT JOIN "user" uc ON rl.changed_by = uc.user_id
        LEFT JOIN vehicle_issues vi ON rl.issue_id = vi.issue_id
        LEFT JOIN vehicle v ON vi.vehicle_id = v.vehicle_id
        WHERE rl.issue_id = ${parseInt(issue_id)}
        ORDER BY rl.timestamp DESC
      `;
    } else {
      query = sql`
        SELECT 
          rl.repairlog_id,
          rl.issue_id,
          rl.changed_by,
          uc.username as changer_name,
          rl.status,
          rl.timestamp,
          vi.issue_description,
          v.brand,
          v.model,
          v.plate_number
        FROM repair_log rl
        LEFT JOIN "user" uc ON rl.changed_by = uc.user_id
        LEFT JOIN vehicle_issues vi ON rl.issue_id = vi.issue_id
        LEFT JOIN vehicle v ON vi.vehicle_id = v.vehicle_id
        ORDER BY rl.timestamp DESC
        LIMIT 100
      `;
    }

    const logs = await query;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: logs.map(log => ({
          repairlog_id: log.repairlog_id,
          issue_id: log.issue_id,
          changed_by: log.changed_by,
          changer_name: log.changer_name,
          status: log.status,
          timestamp: log.timestamp ? log.timestamp.toISOString() : null,
          vehicle_info: log.brand ? `${log.brand} ${log.model} (${log.plate_number})` : null,
          issue_description: log.issue_description
        }))
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