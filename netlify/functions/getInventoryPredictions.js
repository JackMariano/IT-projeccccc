import { neon } from '@neondatabase/serverless';

export async function handler(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' }),
    };
  }

  try {
    // Get database connection string from environment variable
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Connect to Neon database
    const sql = neon(databaseUrl);

    // Query for low stock predictions
    const lowStockItems = await sql`
      SELECT 
        part_id,
        part_name,
        part_category,
        current_quantity,
        CASE 
          WHEN current_quantity <= 0 THEN 'OUT OF STOCK'
          WHEN current_quantity <= 10 THEN 'VERY LOW'
          WHEN current_quantity <= 25 THEN 'LOW'
          ELSE 'OK'
        END as stock_status
      FROM inventory
      WHERE current_quantity <= 25
      ORDER BY current_quantity ASC
    `;

    // Query for maintenance patterns (predictive)
    const maintenancePatterns = await sql`
      SELECT 
        i.part_id,
        i.part_name,
        i.part_category,
        il.maintenance_type,
        COUNT(*) as usage_count,
        AVG(il.mileage_at_use) as avg_mileage_used,
        MIN(il.mileage_at_use) as min_mileage_used,
        MAX(il.mileage_at_use) as max_mileage_used
      FROM inventory_logs il
      JOIN inventory i ON il.part_id = i.part_id
      WHERE il.maintenance_type IS NOT NULL
        AND il.mileage_at_use IS NOT NULL
      GROUP BY i.part_id, i.part_name, i.part_category, il.maintenance_type
      ORDER BY usage_count DESC
      LIMIT 20
    `;

    // Query for recent consumption rates
    const consumptionRates = await sql`
      SELECT 
        part_id,
        AVG(ABS(quantity_change)) as avg_daily_consumption,
        COUNT(*) as transactions_last_30_days
      FROM inventory_logs
      WHERE action_type = 'CONSUME'
        AND logged_at >= NOW() - INTERVAL '30 days'
      GROUP BY part_id
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          low_stock_alerts: lowStockItems,
          maintenance_patterns: maintenancePatterns,
          consumption_rates: consumptionRates,
        },
      }),
    };
  } catch (error) {
    console.error('Error fetching inventory predictions:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to fetch inventory predictions',
      }),
    };
  }
}