import { neon } from '@neondatabase/serverless';

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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
    if (event.httpMethod !== 'POST' && event.httpMethod !== 'PUT') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ success: false, error: 'Method not allowed' }),
      };
    }

    const { 
      part_id, 
      part_name,
      part_description,
      part_category,
      measurement,
      current_quantity,
      user_id 
    } = JSON.parse(event.body);

    if (!part_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'part_id is required',
        }),
      };
    }

    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const sql = neon(databaseUrl);

    // Get current data for logging
    const currentData = await sql`
      SELECT current_quantity, part_name, part_description, part_category, measurement
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
    const newQuantity = current_quantity !== undefined ? parseInt(current_quantity) : previousQuantity;

    if (isNaN(newQuantity) || newQuantity < 0 || !Number.isInteger(newQuantity)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Quantity must be a non-negative whole number',
        }),
      };
    }

    // Update the inventory item using tagged template literals
    // We'll update all fields that are provided
    const updatedItem = await sql`
      UPDATE inventory 
      SET 
        part_name = COALESCE(${part_name}, part_name),
        part_description = COALESCE(${part_description}, part_description),
        part_category = COALESCE(${part_category}, part_category),
        measurement = COALESCE(${measurement}, measurement),
        current_quantity = ${newQuantity}
      WHERE part_id = ${part_id}
      RETURNING part_id, part_name, part_description, part_category, measurement, current_quantity
    `;

    // Log the change if quantity changed
    if (current_quantity !== undefined && newQuantity !== previousQuantity) {
      try {
        const logsExist = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'inventory_logs'
          ) as table_exists
        `;
        
        if (logsExist[0]?.table_exists) {
          const actionType = newQuantity > previousQuantity ? 'RESTOCK' : 'CONSUME';
          const quantityChange = newQuantity - previousQuantity;

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
              ${user_id || 1},
              ${actionType},
              ${quantityChange},
              ${previousQuantity},
              ${newQuantity},
              NOW()
            )
          `;
        }
      } catch (logError) {
        console.warn('Could not log inventory update:', logError);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Successfully updated "${updatedItem[0].part_name}"`,
        data: updatedItem[0],
      }),
    };
  } catch (error) {
    console.error('Error updating inventory:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to update inventory item',
      }),
    };
  }
}
