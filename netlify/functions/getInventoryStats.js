import { neon } from '@neondatabase/serverless';

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

    // Get total inventory count
    const totalCount = await sql`SELECT COUNT(*) as count FROM inventory`;

    // Get category distribution
    const categories = await sql`
      SELECT 
        part_category,
        COUNT(*) as item_count,
        SUM(current_quantity) as total_quantity
      FROM inventory
      GROUP BY part_category
      ORDER BY item_count DESC
    `;

    // Get stock status summary
    const stockStatus = await sql`
      SELECT 
        CASE 
          WHEN current_quantity <= 0 THEN 'Out of Stock'
          WHEN current_quantity <= 10 THEN 'Very Low'
          WHEN current_quantity <= 25 THEN 'Low'
          ELSE 'In Stock'
        END as status,
        COUNT(*) as count
      FROM inventory
      GROUP BY 
        CASE 
          WHEN current_quantity <= 0 THEN 'Out of Stock'
          WHEN current_quantity <= 10 THEN 'Very Low'
          WHEN current_quantity <= 25 THEN 'Low'
          ELSE 'In Stock'
        END
      ORDER BY count DESC
    `;

    // Get recent activity count
    const recentActivity = await sql`
      SELECT COUNT(*) as count 
      FROM inventory_logs 
      WHERE logged_at >= NOW() - INTERVAL '7 days'
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          total_items: parseInt(totalCount[0].count),
          categories,
          stock_status: stockStatus,
          recent_activity: parseInt(recentActivity[0].count),
        },
      }),
    };
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to fetch inventory statistics',
      }),
    };
  }
}