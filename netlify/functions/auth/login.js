import { Client } from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ message: "Method not allowed" }) };
  }

  const { username, password } = JSON.parse(event.body);
  if (!username || !password) {
    return { statusCode: 400, body: JSON.stringify({ message: "Missing credentials" }) };
  }

  const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  await client.connect();

  try {
    const res = await client.query("SELECT * FROM user_table WHERE username = $1", [username]);
    if (res.rows.length === 0) {
      return { statusCode: 401, body: JSON.stringify({ message: "Invalid username" }) };
    }

    const user = res.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return { statusCode: 401, body: JSON.stringify({ message: "Invalid password" }) };
    }

    const token = jwt.sign(
      { userID: user.user_id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        token,
        role: user.role,
        userID: user.user_id,
        username: user.username
      })
    };
  } catch (err) {
    console.error("Login Error:", err);
    return { statusCode: 500, body: JSON.stringify({ message: "Server error" }) };
  } finally {
    await client.end();
  }
};
