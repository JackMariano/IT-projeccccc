// /.netlify/functions/logVehicleIssue
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
      },
      body: JSON.stringify({ message: 'CORS preflight' })
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const {
      user_id,
      vehicle_id,
      plate,
      issue_categories,
      custom_issue,
      issue_description,
      severity = 'medium' // Default severity if not provided
    } = JSON.parse(event.body);

    // Validation checks
    if (!user_id || !vehicle_id) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'User ID and Vehicle ID are required' })
      };
    }

    // Check if at least one issue category or custom issue is provided
    if ((!issue_categories || issue_categories.length === 0) && !custom_issue) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'At least one issue category or custom issue is required' })
      };
    }

    // Validate severity if provided
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (severity && !validSeverities.includes(severity)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid severity value. Must be: low, medium, high, or critical' })
      };
    }

    // Prepare issue_categories as JSONB array
    let issueCategoriesJsonb = null;
    if (issue_categories && issue_categories.length > 0) {
      issueCategoriesJsonb = JSON.stringify(issue_categories);
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
      user_id,
      issueCategoriesJsonb,
      custom_issue || null,
      issue_description || null,
      severity,
      'pending' // Default status
    ];

    console.log("Executing query with values:", {
      vehicle_id,
      user_id,
      issue_categories_count: issue_categories ? issue_categories.length : 0,
      has_custom_issue: !!custom_issue,
      severity
    });

    const result = await pool.query(query, values);

    // Optional: Log the issue for audit trail
    console.log("Vehicle issue reported successfully:", {
      issue_id: result.rows[0].issue_id,
      vehicle_id,
      user_id,
      timestamp: new Date().toISOString()
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true, 
        issue_id: result.rows[0].issue_id,
        message: 'Vehicle issue reported successfully',
        data: {
          issue_id: result.rows[0].issue_id,
          vehicle_id,
          reported_by: user_id,
          categories: issue_categories,
          custom_issue: custom_issue || null,
          severity,
          status: 'pending'
        }
      })
    };

  } catch (error) {
    console.error('Database error:', error);
    
    // Check for specific database errors
    let errorMessage = 'Failed to submit vehicle issue report';
    if (error.code === '23503') { // Foreign key violation
      errorMessage = 'Invalid vehicle or user ID';
    } else if (error.code === '23502') { // Not null violation
      errorMessage = 'Missing required fields';
    }
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: errorMessage,
        details: error.message,
        code: error.code 
      })
    };
  }
};