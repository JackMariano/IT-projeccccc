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

    const { part_id } = event.queryStringParameters || {};
    
    let logs;

    if (part_id) {
      logs = await sql`
        SELECT 
          il.log_id,
          il.part_id,
          i.part_name,
          i.measurement,
          il.user_id,
          il.action_type,
          il.quantity_change,
          il.previous_quantity,
          il.new_quantity,
          il.vehicle_id,
          il.maintenance_type,
          il.logged_at
        FROM inventory_logs il
        JOIN inventory i ON il.part_id = i.part_id
        WHERE il.part_id = ${part_id}
        ORDER BY il.logged_at DESC
        LIMIT 50
      `;
    } else {
      logs = await sql`
        SELECT 
          il.log_id,
          il.part_id,
          i.part_name,
          i.measurement,
          il.user_id,
          il.action_type,
          il.quantity_change,
          il.previous_quantity,
          il.new_quantity,
          il.vehicle_id,
          il.maintenance_type,
          il.logged_at
        FROM inventory_logs il
        JOIN inventory i ON il.part_id = i.part_id
        ORDER BY il.logged_at DESC
        LIMIT 100
      `;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: logs,
        count: logs.length,
      }),
    };
  } catch (error) {
    console.error('Error fetching inventory logs:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to fetch inventory logs',
      }),
    };
  }
}