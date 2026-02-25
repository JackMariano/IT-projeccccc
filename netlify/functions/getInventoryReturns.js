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
    if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ success: false, error: 'Method not allowed' }),
      };
    }

    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const sql = neon(databaseUrl);

    let statusFilter = null;
    let partIdFilter = null;

    if (event.queryStringParameters) {
      statusFilter = event.queryStringParameters.status || null;
      partIdFilter = event.queryStringParameters.part_id || null;
    }

    let query = sql`
      SELECT 
        ir.return_id,
        ir.part_id,
        ir.user_id,
        ir.approval_authority_id,
        ir.quantity,
        ir.return_reason,
        ir.return_status,
        ir.due_date,
        ir.job_id,
        ir.reference_document,
        ir.approved_at,
        ir.completed_at,
        ir.created_at,
        i.part_name,
        i.part_category,
        i.measurement,
        i.current_quantity as part_current_quantity
      FROM inventory_returns ir
      LEFT JOIN inventory i ON ir.part_id = i.part_id
    `;

    const conditions = [];
    
    if (statusFilter) {
      conditions.push(sql`ir.return_status = ${statusFilter}`);
    }
    
    if (partIdFilter) {
      conditions.push(sql`ir.part_id = ${parseInt(partIdFilter)}`);
    }

    if (conditions.length > 0) {
      query = sql`
        SELECT 
          ir.return_id,
          ir.part_id,
          ir.user_id,
          ir.approval_authority_id,
          ir.quantity,
          ir.return_reason,
          ir.return_status,
          ir.due_date,
          ir.job_id,
          ir.reference_document,
          ir.approved_at,
          ir.completed_at,
          ir.created_at,
          i.part_name,
          i.part_category,
          i.measurement,
          i.current_quantity as part_current_quantity
        FROM inventory_returns ir
        LEFT JOIN inventory i ON ir.part_id = i.part_id
        WHERE ${conditions[0]}
      `;
      
      for (let i = 1; i < conditions.length; i++) {
        query = sql`${query} AND ${conditions[i]}`;
      }
    }

    query = sql`${query} ORDER BY ir.created_at DESC`;

    const returns = await query;

    const statusCounts = await sql`
      SELECT 
        return_status,
        COUNT(*) as count
      FROM inventory_returns
      GROUP BY return_status
    `;

    const counts = {
      PENDING: 0,
      COMPLETED: 0,
      total: returns.length
    };

    statusCounts.forEach(row => {
      counts[row.return_status] = parseInt(row.count);
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: returns,
        counts: counts
      }),
    };
  } catch (error) {
    console.error('Error fetching inventory returns:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to fetch inventory returns',
      }),
    };
  }
}
