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
      return_id, 
      status,
      approval_authority_id,
      rejection_reason
    } = JSON.parse(event.body);

    if (!return_id || !status) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields: return_id and status are required',
        }),
      };
    }

    const validStatuses = ['APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        }),
      };
    }

    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const sql = neon(databaseUrl);

    const existingReturn = await sql`
      SELECT 
        ir.*,
        i.part_name,
        i.measurement,
        i.current_quantity as part_current_quantity
      FROM inventory_returns ir
      LEFT JOIN inventory i ON ir.part_id = i.part_id
      WHERE ir.return_id = ${return_id}
    `;

    if (!existingReturn || existingReturn.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Return request not found',
        }),
      };
    }

    const returnRecord = existingReturn[0];

    if (returnRecord.return_status !== 'PENDING' && status !== 'COMPLETED') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Cannot change status from ${returnRecord.return_status} to ${status}`,
        }),
      };
    }

    if (status === 'APPROVED') {
      if (!approval_authority_id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'approval_authority_id is required to approve a return',
          }),
        };
      }

      const previousQuantity = returnRecord.part_current_quantity;
      const newQuantity = previousQuantity + returnRecord.quantity;

      await sql`
        UPDATE inventory 
        SET current_quantity = ${newQuantity}
        WHERE part_id = ${returnRecord.part_id}
      `;

      await sql`
        UPDATE inventory_returns
        SET return_status = 'APPROVED',
            approval_authority_id = ${approval_authority_id},
            approved_at = NOW()
        WHERE return_id = ${return_id}
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
            ${returnRecord.part_id},
            ${returnRecord.user_id},
            'RETURN_APPROVED',
            ${returnRecord.quantity},
            ${previousQuantity},
            ${newQuantity},
            ${approval_authority_id},
            ${returnRecord.reference_document || null},
            ${returnRecord.return_reason},
            ${returnRecord.job_id || null},
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
          message: `Return approved. Added ${returnRecord.quantity} ${returnRecord.measurement.toLowerCase()} to inventory. New quantity: ${newQuantity}`,
          data: {
            return_id: return_id,
            return_status: 'APPROVED',
            part_name: returnRecord.part_name,
            quantity: returnRecord.quantity,
            previous_quantity: previousQuantity,
            new_quantity: newQuantity,
            transaction_id: transactionId,
          },
        }),
      };
    }

    if (status === 'REJECTED') {
      await sql`
        UPDATE inventory_returns
        SET return_status = 'REJECTED',
            approval_authority_id = ${approval_authority_id || null}
        WHERE return_id = ${return_id}
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Return request rejected',
          data: {
            return_id: return_id,
            return_status: 'REJECTED',
            part_name: returnRecord.part_name,
            quantity: returnRecord.quantity,
          },
        }),
      };
    }

    if (status === 'COMPLETED') {
      if (returnRecord.return_status !== 'APPROVED') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Can only complete an approved return',
          }),
        };
      }

      await sql`
        UPDATE inventory_returns
        SET return_status = 'COMPLETED',
            completed_at = NOW()
        WHERE return_id = ${return_id}
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Return marked as completed',
          data: {
            return_id: return_id,
            return_status: 'COMPLETED',
            part_name: returnRecord.part_name,
            quantity: returnRecord.quantity,
          },
        }),
      };
    }

    if (status === 'CANCELLED') {
      await sql`
        UPDATE inventory_returns
        SET return_status = 'CANCELLED'
        WHERE return_id = ${return_id}
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Return request cancelled',
          data: {
            return_id: return_id,
            return_status: 'CANCELLED',
            part_name: returnRecord.part_name,
            quantity: returnRecord.quantity,
          },
        }),
      };
    }

  } catch (error) {
    console.error('Error updating inventory return status:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to update inventory return status',
      }),
    };
  }
}
