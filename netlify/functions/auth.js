import { Client } from "pg";
import jwt from "jsonwebtoken";

export const handler = async (event, context, callback) => {
  const authHeader = event.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "No token provided" }),
    };
  }

  let client;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    client = new Client({
      connectionString: process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();

    const res = await client.query('SELECT state FROM "user" WHERE "user_ID" = $1', [decoded.user_ID]);

    if (res.rows.length === 0) {
      return { statusCode: 401, body: JSON.stringify({ message: "User not found" }) };
    }

    const userState = res.rows[0].state;

    if (userState !== 1) {
      return { statusCode: 403, body: JSON.stringify({ message: "Session expired or logged out" }) };
    }

    // Append user info to context for downstream functions
    context.user = decoded;

    // Pass to next function
    return callback(null, { authorized: true });
  } catch (err) {
    console.error("Auth error:", err);
    return { statusCode: 401, body: JSON.stringify({ message: "Invalid token" }) };
  } finally {
    if (client) await client.end();
  }
};
