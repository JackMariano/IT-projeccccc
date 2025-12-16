import { neon } from '@neondatabase/serverless';

const VALID_STATUSES = ['Reported', 'Received', 'Under Repair', 'Resolved'];

export const handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers, 
      body: JSON.stringify({ error: 'Method not allowed' }) 
    };
  }

  try {
    const { issue_id, status, changed_by } = JSON.parse(event.body);

    if (!issue_id || !status) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields: issue_id and status are required'
        })
      };
    }

    if (!VALID_STATUSES.includes(status)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
        })
      };
    }

    const userId = changed_by || 1;
    const sql = neon(process.env.DATABASE_URL);

    const issueResult = await sql`
      SELECT vehicle_id FROM vehicle_issues WHERE issue_id = ${issue_id}
    `;

    if (issueResult.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Issue not found'
        })
      };
    }

    const vehicleId = issueResult[0].vehicle_id;

    await sql`
      UPDATE vehicle_issues 
      SET status = ${status}
      WHERE issue_id = ${issue_id}
    `;

    const vehicleIssues = await sql`
      SELECT status 
      FROM vehicle_issues 
      WHERE vehicle_id = ${vehicleId}
    `;

    let newVehicleStatus = null;
    
    if (vehicleIssues.length > 0) {
      const allStatuses = vehicleIssues.map(issue => issue.status);
      
      // Check if ANY issue is 'Under Repair'
      const hasUnderRepair = allStatuses.some(s => s === 'Under Repair');
      
      // Check if ANY issue is 'Received' (and none are 'Under Repair')
      const hasReceived = allStatuses.some(s => s === 'Received');
      
      // Check if ALL issues are 'Resolved'
      const allResolved = allStatuses.every(s => s === 'Resolved');
      
      // Determine vehicle status based on ALL issues
      if (hasUnderRepair) {
        newVehicleStatus = 'Under Repair';
      } else if (hasReceived) {
        newVehicleStatus = 'For Inspection';
      } else if (allResolved) {
        newVehicleStatus = 'Finished Repair';
      } else {
        newVehicleStatus = null;
      }
    }

    if (newVehicleStatus) {
      await sql`
        UPDATE vehicle 
        SET status = ${newVehicleStatus}
        WHERE vehicle_id = ${vehicleId}
      `;
    }

    await sql`
      INSERT INTO repair_log (issue_id, changed_by, status)
      VALUES (${issue_id}, ${userId}, ${status})
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          issue_id: issue_id,
          vehicle_id: vehicleId,
          vehicle_status: newVehicleStatus,
          change_timestamp: new Date().toISOString()
        },
        message: `Issue status updated to ${status}${
          newVehicleStatus 
            ? ` and vehicle status updated to ${newVehicleStatus} (based on all vehicle issues)`
            : ` (vehicle status unchanged)`
        }`
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