import { Client } from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  let client;
  try {
    const { username, password, force } = JSON.parse(event.body);

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

    const res = await client.query('SELECT * FROM "user" WHERE username = $1', [username]);
    if (res.rows.length === 0) {
      return { statusCode: 401, body: JSON.stringify({ message: "Invalid username or password" }) };
    }

    const user = res.rows[0];

    // Validate password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return { statusCode: 401, body: JSON.stringify({ message: "Invalid username or password" }) };
    }

    // Check if user is already logged in
    if (user.state === 1) {
      if (!force) {
        return {
          statusCode: 403,
          body: JSON.stringify({
            message: "User is already logged in elsewhere",
            alreadyLoggedIn: true,
          }),
        };
      } else {
        // Force logout previous session
        await client.query('UPDATE "user" SET state = 0 WHERE "user_ID" = $1', [user.user_ID]);
      }
    }

    // Update state to 1 (logged in)
    await client.query('UPDATE "user" SET state = 1 WHERE "user_ID" = $1', [user.user_ID]);

    // Generate JWT token
    const token = jwt.sign(
      { user_ID: user.user_ID, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        token,
        user_ID: user.user_ID,
        username: user.username,
        role: user.role,
      }),
    };
  } catch (err) {
    console.error("Login error:", err);
    return { statusCode: 500, body: JSON.stringify({ message: "Server error" }) };
  } finally {
    if (client) await client.end();
  }
};
