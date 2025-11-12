import { Client } from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const handler = async (event) => {
  let client;

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    const { username, password } = JSON.parse(event.body);

    if (!username || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing username or password" }),
      };
    }

    client = new Client({
      connectionString: process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    // Fetch user by username
    const res = await client.query('SELECT * FROM "user" WHERE username = $1', [username]);

    if (res.rows.length === 0) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Invalid username or password" }),
      };
    }

    const user = res.rows[0];

    // Check if already logged in
    if (user.state === 1) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: "User is already logged in" }),
      };
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Invalid username or password" }),
      };
    }

    // Set state to 1 (logged in)
    await client.query('UPDATE "user" SET state = 1 WHERE user_ID = $1', [user.user_ID]);

    // Generate JWT token
    const token = jwt.sign(
      { userID: user.user_ID, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        token,
        role: user.role,
        userID: user.user_ID,
        username: user.username,
      }),
    };
  } catch (err) {
    console.error("Login error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Server error" }),
    };
  } finally {
    if (client) await client.end();
  }
};
