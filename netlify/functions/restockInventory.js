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
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ success: false, error: 'Method not allowed' }),
      };
    }

    const { part_id, quantity, user_id } = JSON.parse(event.body);

    if (!part_id || !quantity || !user_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields: part_id, quantity, and user_id are required',
        }),
      };
    }

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0 || !Number.isInteger(quantityNum)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Quantity must be a positive whole number',
        }),
      };
    }

    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const sql = neon(databaseUrl);

    const currentData = await sql`
      SELECT current_quantity, part_name, measurement 
      FROM inventory 
      WHERE part_id = ${part_id}
    `;
    
    if (!currentData || currentData.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Part not found',
        }),
      };
    }

    const previousQuantity = currentData[0].current_quantity;
    const newQuantity = previousQuantity + quantityNum;

    const updatedItem = await sql`
      UPDATE inventory 
      SET current_quantity = ${newQuantity}
      WHERE part_id = ${part_id}
      RETURNING part_id, part_name, part_category, measurement, current_quantity
    `;

    await sql`
      INSERT INTO inventory_logs (
        part_id,
        user_id,
        action_type,
        quantity_change,
        previous_quantity,
        new_quantity,
        logged_at
      ) VALUES (
        ${part_id},
        ${user_id},
        'RESTOCK',
        ${quantityNum},
        ${previousQuantity},
        ${newQuantity},
        NOW()
      )
    `;

    const partInfo = currentData[0];
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Successfully restocked ${quantityNum} ${partInfo.measurement.toLowerCase()} of ${partInfo.part_name}`,
        data: updatedItem[0],
      }),
    };
  } catch (error) {
    console.error('Error restocking inventory:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to restock inventory',
      }),
    };
  }
}