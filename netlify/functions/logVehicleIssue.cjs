// /.netlify/functions/logVehicleIssue
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

/**
 * Helper function to handle CORS headers
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  'Content-Type': 'application/json'
};

/**
 * Helper function to verify JWT token
 */
const verifyToken = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  // Verify user exists and is active
  const sql = neon(process.env.DATABASE_URL);
  const userResult = await sql(
    'SELECT state FROM "user" WHERE "user_ID" = $1',
    [decoded.user_ID]
  );

  if (userResult.length === 0) {
    throw new Error('User not found');
  }

  if (userResult[0].state !== 1) {
    throw new Error('User is not logged in');
  }

  return decoded;
};

export const handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'CORS preflight' })
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Verify authentication
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const decodedToken = await verifyToken(authHeader);
    const authenticatedUserId = decodedToken.user_ID;

    // Parse request body
    const {
      vehicle_id,
      plate,
      issue_categories,
      custom_issue,
      issue_description,
      severity = 'medium' // Default severity if not provided
    } = JSON.parse(event.body);

    // Validation checks
    if (!vehicle_id) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Vehicle ID is required' })
      };
    }

    // Check if at least one issue category or custom issue is provided
    if ((!issue_categories || issue_categories.length === 0) && !custom_issue) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'At least one issue category or custom issue is required' })
      };
    }

    // Validate severity if provided
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (severity && !validSeverities.includes(severity)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid severity value. Must be: low, medium, high, or critical' })
      };
    }

    // Prepare issue_categories as JSONB array
    let issueCategoriesJsonb = null;
    if (issue_categories && issue_categories.length > 0) {
      issueCategoriesJsonb = JSON.stringify(issue_categories);
    }

    // Initialize Neon SQL client
    const sql = neon(process.env.DATABASE_URL);

    // Optional: Verify vehicle exists and user has permission
    try {
      const vehicleCheck = await sql(
        'SELECT vehicle_id FROM vehicle WHERE vehicle_id = $1',
        [vehicle_id]
      );
      
      if (vehicleCheck.length === 0) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Vehicle not found' })
        };
      }
    } catch (checkError) {
      // If vehicle check fails, proceed anyway - the foreign key constraint will catch invalid IDs
      console.warn('Vehicle check failed, proceeding with insert:', checkError.message);
    }

    // Insert into database
    const query = `
      INSERT INTO vehicle_issues (
        vehicle_id, 
        reported_by, 
        issue_categories,
        custom_issue,
        issue_description,
        severity,
        reported_date,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
      RETURNING issue_id
    `;

    const values = [
      vehicle_id,
      authenticatedUserId,
      issueCategoriesJsonb,
      custom_issue || null,
      issue_description || null,
      severity,
      'pending' // Default status
    ];

    console.log("Executing query with values:", {
      vehicle_id,
      user_id: authenticatedUserId,
      issue_categories_count: issue_categories ? issue_categories.length : 0,
      has_custom_issue: !!custom_issue,
      severity
    });

    const result = await sql(query, values);

    // Log the issue for audit trail
    console.log("Vehicle issue reported successfully:", {
      issue_id: result[0].issue_id,
      vehicle_id,
      user_id: authenticatedUserId,
      timestamp: new Date().toISOString()
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        success: true, 
        issue_id: result[0].issue_id,
        message: 'Vehicle issue reported successfully',
        data: {
          issue_id: result[0].issue_id,
          vehicle_id,
          reported_by: authenticatedUserId,
          categories: issue_categories,
          custom_issue: custom_issue || null,
          severity,
          status: 'pending',
          reported_date: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('Error in logVehicleIssue:', error);
    
    // Handle specific error types
    let statusCode = 500;
    let errorMessage = 'Failed to submit vehicle issue report';
    
    if (error.message.includes('jwt') || error.message.includes('token') || error.message.includes('Authorization')) {
      statusCode = 401;
      errorMessage = 'Authentication failed: ' + error.message;
    } else if (error.message.includes('User not found') || error.message.includes('not logged in')) {
      statusCode = 401;
      errorMessage = error.message;
    } else if (error.message.includes('Vehicle not found')) {
      statusCode = 404;
      errorMessage = error.message;
    } else if (error.message.includes('required') || error.message.includes('Invalid')) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message.includes('foreign key') || error.message.includes('violates foreign key constraint')) {
      statusCode = 400;
      errorMessage = 'Invalid vehicle or user ID';
    }
    
    return {
      statusCode,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};