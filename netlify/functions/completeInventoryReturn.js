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

    const { return_id, user_id } = JSON.parse(event.body);

    if (!return_id || !user_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields: return_id and user_id are required',
        }),
      };
    }

    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const sql = neon(databaseUrl);

    // Get the return record
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

    if (returnRecord.return_status !== 'PENDING') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: `This return is already ${returnRecord.return_status}`,
        }),
      };
    }

    // Update inventory
    const previousQuantity = returnRecord.part_current_quantity;
    const newQuantity = previousQuantity + returnRecord.quantity;

    await sql`
      UPDATE inventory
      SET current_quantity = ${newQuantity}
      WHERE part_id = ${returnRecord.part_id}
    `;

    // Update return status
    await sql`
      UPDATE inventory_returns
      SET return_status = 'COMPLETED',
          approval_authority_id = ${user_id},
          approved_at = NOW(),
          completed_at = NOW()
      WHERE return_id = ${return_id}
    `;

    // Create audit log
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
          'RETURN',
          ${returnRecord.quantity},
          ${previousQuantity},
          ${newQuantity},
          ${user_id},
          ${returnRecord.reference_document || null},
          ${returnRecord.return_reason},
          ${returnRecord.job_id || null},
          ${transactionId},
          TRUE,
          ${user_id},
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
        message: `Return completed. Added ${returnRecord.quantity} ${returnRecord.measurement.toLowerCase()} to inventory. New quantity: ${newQuantity}`,
        data: {
          return_id: return_id,
          return_status: 'COMPLETED',
          part_name: returnRecord.part_name,
          quantity: returnRecord.quantity,
          previous_quantity: previousQuantity,
          new_quantity: newQuantity,
          transaction_id: transactionId,
        },
      }),
    };
  } catch (error) {
    console.error('Error completing inventory return:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to complete inventory return',
      }),
    };
  }
}
