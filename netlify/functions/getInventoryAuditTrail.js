import { neon } from '@neondatabase/serverless';

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' }),
    };
  }

  try {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const sql = neon(databaseUrl);
    
    const params = event.queryStringParameters || {};
    const { 
      part_id, 
      vehicle_id, 
      user_id, 
      action_type,
      start_date, 
      end_date,
      page = 1,
      limit = 50
    } = params;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build dynamic query with filters
    let whereClause = "WHERE 1=1";

    if (part_id) {
      whereClause += ` AND il.part_id = ${parseInt(part_id)}`;
    }

    if (vehicle_id) {
      whereClause += ` AND il.vehicle_id = ${parseInt(vehicle_id)}`;
    }

    if (user_id) {
      whereClause += ` AND il.user_id = ${parseInt(user_id)}`;
    }

    if (action_type) {
      whereClause += ` AND il.action_type = '${action_type.replace(/'/g, "''")}'`;
    }

    if (start_date) {
      whereClause += ` AND il.logged_at >= '${start_date.replace(/'/g, "''")}'`;
    }

    if (end_date) {
      whereClause += ` AND il.logged_at <= '${end_date.replace(/'/g, "''")}'`;
    }

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*) as total 
      FROM inventory_logs il
      ${sql.unsafe(whereClause)}
    `;
    
    const totalCount = parseInt(countResult[0]?.total || 0);

    // Get audit trail with all details
    const auditLogs = await sql`
      SELECT 
        il.log_id,
        il.part_id,
        i.part_name,
        i.part_category,
        i.measurement,
        il.user_id,
        il.action_type,
        il.quantity_change,
        il.previous_quantity,
        il.new_quantity,
        il.vehicle_id,
        v.plate_number as vehicle_plate,
        v.brand as vehicle_brand,
        v.model as vehicle_model,
        il.maintenance_type,
        il.approval_authority_id,
        il.reference_document,
        il.reason,
        il.job_id,
        il.transaction_id,
        il.is_adjusted,
        il.adjusted_by,
        il.adjusted_at,
        il.logged_at
      FROM inventory_logs il
      JOIN inventory i ON il.part_id = i.part_id
      LEFT JOIN vehicle v ON il.vehicle_id = v.vehicle_id
      ${sql.unsafe(whereClause)}
      ORDER BY il.logged_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `;

    // Get unique user IDs for the logs
    const allUserIds = [
      ...new Set([
        ...auditLogs.map(l => l.user_id).filter(id => id !== null),
        ...auditLogs.map(l => l.approval_authority_id).filter(id => id !== null),
        ...auditLogs.map(l => l.adjusted_by).filter(id => id !== null)
      ])
    ];

    // Get user details
    let userMap = {};
    if (allUserIds.length > 0) {
      try {
        const users = await sql`
          SELECT 
            u.user_id,
            u.username,
            e.firstname,
            e.lastname,
            COALESCE(e.firstname || ' ' || e.lastname, u.username) as full_name
          FROM "user" u
          LEFT JOIN employee e ON u.user_id = e.user_id
          WHERE u.user_id = ANY(${allUserIds})
        `;
        
        users.forEach(user => {
          userMap[user.user_id] = {
            full_name: user.full_name,
            username: user.username
          };
        });
      } catch (userError) {
        console.error('Error fetching users:', userError);
      }
    }

    // Enrich logs with user names
    const enrichedLogs = auditLogs.map(log => ({
      ...log,
      user_name: userMap[log.user_id]?.full_name || `User ${log.user_id}`,
      user_username: userMap[log.user_id]?.username || `user${log.user_id}`,
      approval_authority_name: log.approval_authority_id 
        ? (userMap[log.approval_authority_id]?.full_name || `User ${log.approval_authority_id}`)
        : null,
      adjusted_by_name: log.adjusted_by
        ? (userMap[log.adjusted_by]?.full_name || `User ${log.adjusted_by}`)
        : null
    }));

    // Get summary statistics - replace il. prefix for this query
    let statsWhereClause = whereClause ? whereClause.replace(/il\./g, '') : "WHERE 1=1";
    if (!statsWhereClause.includes("action_type IS NOT NULL")) {
      statsWhereClause += " AND action_type IS NOT NULL";
    }
    
    const stats = await sql`
      SELECT 
        action_type,
        COUNT(*) as count,
        SUM(ABS(quantity_change)) as total_quantity,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT vehicle_id) as unique_vehicles
      FROM inventory_logs
      ${sql.unsafe(statsWhereClause)}
      GROUP BY action_type
    `;

    // Get recent activity summary
    const recentActivity = await sql`
      SELECT 
        DATE(logged_at) as activity_date,
        action_type,
        COUNT(*) as count,
        SUM(CASE WHEN action_type IN ('RESTOCK', 'ADJUSTMENT') THEN quantity_change ELSE 0 END) as total_in,
        SUM(CASE WHEN action_type = 'CONSUME' THEN ABS(quantity_change) ELSE 0 END) as total_out
      FROM inventory_logs
      WHERE logged_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(logged_at), action_type
      ORDER BY activity_date DESC
      LIMIT 30
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          logs: enrichedLogs,
          pagination: {
            total: totalCount,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(totalCount / parseInt(limit))
          },
          statistics: stats,
          recent_activity: recentActivity
        },
      }),
    };
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to fetch audit trail',
      }),
    };
  }
}
