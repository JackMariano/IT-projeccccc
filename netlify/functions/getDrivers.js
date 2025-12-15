import { neon } from '@neondatabase/serverless';

export const handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Database connection string not configured" }),
    };
  }

  try {
    const sql = neon(connectionString);

    // Get all users with role 'Driver'
    const driverUsers = await sql`
      SELECT user_id, username, role
      FROM "user" 
      WHERE role = 'Driver'
      ORDER BY user_id ASC
    `;

    // Get all employees
    const allEmployees = await sql`
      SELECT emp_id, user_id, firstname, lastname, middlename, contactnumber, email
      FROM employee
      ORDER BY lastname ASC, firstname ASC
    `;

    // Match drivers with their employee records
    const drivers = [];
    
    if (driverUsers.length > 0) {
      for (const user of driverUsers) {
        const employee = allEmployees.find(emp => emp.user_id === user.user_id);
        if (employee) {
          drivers.push({
            user_id: user.user_id,
            role: user.role,
            username: user.username,
            emp_id: employee.emp_id,
            firstname: employee.firstname,
            lastname: employee.lastname,
            middlename: employee.middlename,
            contactnumber: employee.contactnumber,
            email: employee.email
          });
        }
      }
    } else {
      // Fallback to all employees if no specific drivers found
      drivers.push(...allEmployees.map(emp => ({
        user_id: emp.user_id,
        role: 'Driver',
        emp_id: emp.emp_id,
        firstname: emp.firstname,
        lastname: emp.lastname,
        middlename: emp.middlename,
        contactnumber: emp.contactnumber,
        email: emp.email
      })));
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drivers }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Failed to fetch drivers",
        details: error.message
      }),
    };
  }
};