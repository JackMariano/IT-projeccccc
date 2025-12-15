// netlify/functions/addInventory.js
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

    const { 
      part_name, 
      part_description, 
      part_category, 
      measurement, 
      initial_quantity
    } = JSON.parse(event.body);

    // Validate required fields
    if (!part_name || !part_category || !measurement || initial_quantity === undefined) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields: part_name, part_category, measurement, and initial_quantity are required',
        }),
      };
    }

    // Validate initial quantity
    const initialQuantityNum = parseInt(initial_quantity);
    if (isNaN(initialQuantityNum) || initialQuantityNum < 0 || !Number.isInteger(initialQuantityNum)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Initial quantity must be a non-negative whole number',
        }),
      };
    }

    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const sql = neon(databaseUrl);

    // Check if part with same name already exists
    const existingPart = await sql`
      SELECT part_id FROM inventory 
      WHERE LOWER(part_name) = LOWER(${part_name})
    `;
    
    if (existingPart && existingPart.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: `A part with the name "${part_name}" already exists`,
        }),
      };
    }

    // Insert new inventory item
    const newItem = await sql`
      INSERT INTO inventory (
        part_name,
        part_description,
        part_category,
        measurement,
        current_quantity,
        created_at
      ) VALUES (
        ${part_name},
        ${part_description || null},
        ${part_category},
        ${measurement},
        ${initialQuantityNum},
        NOW()
      )
      RETURNING 
        part_id,
        part_name,
        part_description,
        part_category,
        measurement,
        current_quantity,
        created_at
    `;

    // Log the initial addition as a restock
    // Check if inventory_logs table exists before inserting
    try {
      const logsExist = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'inventory_logs'
        ) as table_exists
      `;
      
      if (logsExist[0]?.table_exists) {
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
            ${newItem[0].part_id},
            ${1}, // Default user ID - you might want to pass user_id from frontend
            'RESTOCK',
            ${initialQuantityNum},
            0,
            ${initialQuantityNum},
            NOW()
          )
        `;
      }
    } catch (logError) {
      console.warn('Could not log inventory addition:', logError);
      // Continue without logging - this is not critical
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Successfully added "${part_name}" to inventory`,
        data: newItem[0],
      }),
    };
  } catch (error) {
    console.error('Error adding inventory:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to add inventory item',
      }),
    };
  }
}