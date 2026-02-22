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
      adjustment_type,
      reason,
      reference_document,
      job_id,
      auto_approve = false
    } = JSON.parse(event.body);

    // Validation
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

    if (!adjustment_type || !['INCREASE', 'DECREASE', 'CORRECTION'].includes(adjustment_type)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Invalid adjustment_type. Must be INCREASE, DECREASE, or CORRECTION',
        }),
      };
    }

    if (!reason || reason.trim().length < 10) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Reason is required and must be at least 10 characters',
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

    // Get current inventory item
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
    const isIncrease = adjustment_type === 'INCREASE';
    const isCorrection = adjustment_type === 'CORRECTION';
    
    // For decrease, check if we have enough stock
    if (!isIncrease && previousQuantity < quantityNum) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Insufficient stock for adjustment. Available: ${previousQuantity}, Requested reduction: ${quantityNum}`,
        }),
      };
    }

    const newQuantity = isIncrease ? previousQuantity + quantityNum : (isCorrection ? quantityNum : previousQuantity - quantityNum);

    // Generate unique transaction ID
    const transactionId = `ADJ-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // If auto_approve is true, immediately apply the adjustment
    if (auto_approve) {
      if (!approval_authority_id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Approval authority is required for auto-approved adjustments',
          }),
        };
      }

      // Update inventory
      const updatedItem = await sql`
        UPDATE inventory 
        SET current_quantity = ${newQuantity}
        WHERE part_id = ${part_id}
        RETURNING part_id, part_name, part_category, measurement, current_quantity
      `;

      // Create adjustment record
      const adjustment = await sql`
        INSERT INTO inventory_adjustments (
          part_id,
          user_id,
          approval_authority_id,
          adjustment_type,
          quantity_change,
          previous_quantity,
          new_quantity,
          reason,
          reference_document,
          job_id,
          status,
          approved_at
        ) VALUES (
          ${part_id},
          ${user_id},
          ${approval_authority_id},
          ${adjustment_type},
          ${isIncrease ? quantityNum : (isCorrection ? newQuantity - previousQuantity : -quantityNum)},
          ${previousQuantity},
          ${newQuantity},
          ${reason},
          ${reference_document || null},
          ${job_id || null},
          'APPROVED',
          NOW()
        )
        RETURNING adjustment_id
      `;

      // Create audit log entry
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
          'ADJUSTMENT',
          ${isIncrease ? quantityNum : (isCorrection ? newQuantity - previousQuantity : -quantityNum)},
          ${previousQuantity},
          ${newQuantity},
          ${approval_authority_id},
          ${reference_document || null},
          ${reason},
          ${job_id || null},
          ${transactionId},
          TRUE,
          ${approval_authority_id},
          NOW(),
          NOW()
        )
      `;

      const partInfo = currentData[0];
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: `Inventory adjusted successfully. New quantity: ${newQuantity} ${partInfo.measurement.toLowerCase()}`,
          data: {
            ...updatedItem[0],
            adjustment_id: adjustment[0].adjustment_id,
            transaction_id: transactionId,
            status: 'APPROVED'
          },
        }),
      };
    } else {
      // Create pending adjustment request
      const adjustment = await sql`
        INSERT INTO inventory_adjustments (
          part_id,
          user_id,
          approval_authority_id,
          adjustment_type,
          quantity_change,
          previous_quantity,
          new_quantity,
          reason,
          reference_document,
          job_id,
          status
        ) VALUES (
          ${part_id},
          ${user_id},
          ${approval_authority_id || null},
          ${adjustment_type},
          ${isIncrease ? quantityNum : (isCorrection ? newQuantity - previousQuantity : -quantityNum)},
          ${previousQuantity},
          ${newQuantity},
          ${reason},
          ${reference_document || null},
          ${job_id || null},
          'PENDING'
        )
        RETURNING adjustment_id, created_at
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Adjustment request submitted for approval',
          data: {
            adjustment_id: adjustment[0].adjustment_id,
            created_at: adjustment[0].created_at,
            previous_quantity: previousQuantity,
            new_quantity: newQuantity,
            status: 'PENDING'
          },
        }),
      };
    }
  } catch (error) {
    console.error('Error adjusting inventory:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to adjust inventory',
      }),
    };
  }
}
