import { Client } from "pg";
import jwt from "jsonwebtoken";

/**
 * Verifies a user's JWT token and checks if the user is logged in.
 * If the token is invalid or the user is not active, it updates state to 0.
 * @param {string} token - JWT token from the client
 * @returns {object} decoded user info if valid
 * @throws Error if token is missing, invalid, expired, or user not logged in
 */
export const verifyUser = async (token) => {
  if (!token) throw new Error("Missing token");

  let client;
  try {
    // Verify token (throws if invalid or expired)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    client = new Client({
      connectionString: process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();

    // Fetch user state
    const res = await client.query(
      'SELECT state FROM "user" WHERE "user_ID" = $1',
      [decoded.user_ID]
    );

    if (res.rows.length === 0) {
      throw new Error("User not found");
    }

    const userState = res.rows[0].state;

    if (userState !== 1) {
      throw new Error("User is not logged in");
    }

    return decoded; // user is authenticated
  } catch (err) {
    // Optional: Force logout if token invalid or expired
    if (client) {
      try {
        const decoded = jwt.decode(token); // decode without verifying
        if (decoded?.user_ID) {
          await client.query(
            'UPDATE "user" SET state = 0 WHERE "user_ID" = $1',
            [decoded.user_ID]
          );
        }
      } catch (_) {
        // ignore
      }
    }

    // Throw the error for the API function to handle
    throw new Error(err.message || "Authentication failed");
  } finally {
    if (client) await client.end();
  }
};
