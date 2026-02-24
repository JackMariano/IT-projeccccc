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
      part_id, 
      quantity, 
      user_id, 
      approval_authority_id,
      return_reason,
      due_date,
      job_id,
      reference_document,
      auto_approve = false
    } = JSON.parse(event.body);

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

    if (!return_reason || return_reason.trim().length < 10) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Return reason is required and must be at least 10 characters',
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
    const partInfo = currentData[0];

    if (auto_approve) {
      if (!approval_authority_id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Approval authority is required for auto-approved returns',
          }),
        };
      }

      await sql`
        UPDATE inventory 
        SET current_quantity = ${newQuantity}
        WHERE part_id = ${part_id}
      `;

      const returnRecord = await sql`
        INSERT INTO inventory_returns (
          part_id,
          user_id,
          approval_authority_id,
          quantity,
          return_reason,
          return_status,
          due_date,
          job_id,
          reference_document,
          approved_at,
          completed_at
        ) VALUES (
          ${part_id},
          ${user_id},
          ${approval_authority_id},
          ${quantityNum},
          ${return_reason.trim()},
          'COMPLETED',
          ${due_date || null},
          ${job_id || null},
          ${reference_document || null},
          NOW(),
          NOW()
        )
        RETURNING return_id, created_at
      `;

      const transactionId = `RET-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      try {
        await sql`
          INSERT INTO inventory_logs (
            part_id,
            user_id,
            action_type,
            quantity_change,
            previous_quantity,
            new_quantity,
            approval_authority_id,
            reference_document,
            reason,
            job_id,
            transaction_id,
            is_adjusted,
            adjusted_by,
            adjusted_at,
            logged_at
          ) VALUES (
            ${part_id},
            ${user_id},
            'RETURN',
            ${quantityNum},
            ${previousQuantity},
            ${newQuantity},
            ${approval_authority_id},
            ${referenceDocument || null},
            ${return_reason.trim()},
            ${job_id || null},
            ${transactionId},
            TRUE,
            ${approval_authority_id},
            NOW(),
            NOW()
          )
        `;
      } catch (logError) {
        console.error('Warning: Failed to create audit log entry:', logError.message);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: `Inventory return completed. New quantity: ${newQuantity} ${partInfo.measurement.toLowerCase()}`,
          data: {
            return_id: returnRecord[0].return_id,
            part_name: partInfo.part_name,
            previous_quantity: previousQuantity,
            new_quantity: newQuantity,
            quantity_returned: quantityNum,
            return_status: 'COMPLETED',
            transaction_id: transactionId,
          },
        }),
      };
    } else {
      const returnRecord = await sql`
        INSERT INTO inventory_returns (
          part_id,
          user_id,
          approval_authority_id,
          quantity,
          return_reason,
          return_status,
          due_date,
          job_id,
          reference_document
        ) VALUES (
          ${part_id},
          ${user_id},
          ${approval_authority_id || null},
          ${quantityNum},
          ${return_reason.trim()},
          'PENDING',
          ${due_date || null},
          ${job_id || null},
          ${reference_document || null}
        )
        RETURNING return_id, created_at
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Return request submitted for approval',
          data: {
            return_id: returnRecord[0].return_id,
            created_at: returnRecord[0].created_at,
            part_name: partInfo.part_name,
            quantity: quantityNum,
            previous_quantity: previousQuantity,
            new_quantity: newQuantity,
            return_status: 'PENDING',
          },
        }),
      };
    }
  } catch (error) {
    console.error('Error creating inventory return:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to create inventory return',
      }),
    };
  }
}
