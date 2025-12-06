import { Client } from "pg";
import jwt from "jsonwebtoken";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

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
    client = new Client({
      connectionString: process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // Token invalid or expired
      decoded = jwt.decode(token); // decode without verification
      if (!decoded?.user_id) {
        throw new Error("Invalid token");
      }
    }

    // Update state to 0 (logged out)
    await client.query('UPDATE "user" SET state = 0 WHERE "user_id" = $1', [decoded.user_id]);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Successfully logged out" }),
    };
  } catch (err) {
    console.error("Logout error:", err);
    return {
      statusCode: 401,
      body: JSON.stringify({ message: err.message || "Invalid token or server error" }),
    };
  } finally {
    if (client) await client.end();
  }
};
