// netlify/functions/sessionCheck.cjs
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

/**
 * Verifies a user's JWT token and checks if the user is logged in.
 * @param {string} token - JWT token from the client
 * @returns {object} decoded user info if valid
 * @throws Error if token is missing, invalid, expired, or user not logged in
 */
export const verifyUser = async (token) => {
  console.log("=== verifyUser START ===");
  console.log("Token provided:", token ? "Yes" : "No");
  
  if (!token) {
    console.log("No token provided");
    throw new Error("Missing token");
  }

  try {
    // Verify token (throws if invalid or expired)
    console.log("Verifying JWT token...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log("Token decoded successfully:", {
      user_id: decoded.user_id || decoded.user_ID,
      username: decoded.username,
      iat: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : 'No iat'
    });

    // Initialize Neon SQL client
    const sql = neon(process.env.DATABASE_URL || process.env.NEON_DATABASE_URL);

    // Get user ID (handle both naming conventions)
    const userId = decoded.user_id || decoded.user_ID;
    
    if (!userId) {
      throw new Error("No user ID in token");
    }

    // Fetch user state and last_login time
    console.log(`Querying database for user_id: ${userId}`);
    const result = await sql`
      SELECT state, last_login 
      FROM "user" 
      WHERE user_id = ${userId}
    `;

    if (result.length === 0) {
      console.log("User not found in database");
      throw new Error("User not found");
    }

    const userState = result[0].state;
    const lastLogin = result[0].last_login;
    
    console.log("User state from DB:", userState);
    console.log("Last login from DB:", lastLogin ? new Date(lastLogin).toISOString() : 'Never');

    // Check if this token was issued BEFORE the last login (stale session)
    if (decoded.iat && lastLogin) {
      const tokenIssuedAt = decoded.iat * 1000; // Convert to milliseconds
      const lastLoginTime = new Date(lastLogin).getTime();
      
      console.log(`Token issued at (ms): ${tokenIssuedAt}`);
      console.log(`Last login time (ms): ${lastLoginTime}`);
      console.log(`Difference (ms): ${lastLoginTime - tokenIssuedAt}`);
      
      // ADD TOLERANCE: Allow 10-second window for timing differences
      const TOLERANCE_MS = 10000; // 10 seconds
      
      // Only invalidate if token is significantly older than last login
      if (tokenIssuedAt < (lastLoginTime - TOLERANCE_MS)) {
        console.log("Stale session detected (outside tolerance window)");
        throw new Error("Session terminated - Another login detected");
      } else {
        console.log("Token is within tolerance window, session is valid");
      }
    }

    if (userState !== 1) {
      console.log(`User is not logged in (state = ${userState})`);
      throw new Error("User is not logged in");
    }

    console.log("✅ verifyUser successful");
    return decoded; // user is authenticated
    
  } catch (err) {
    console.error("verifyUser error:", err.message);
    
    // Do NOT auto-logout users on token errors
    // Just throw the error for the API function to handle
    throw new Error(err.message || "Authentication failed");
  } finally {
    console.log("=== verifyUser END ===");
  }
};

/**
 * Check if session is still valid without auto-logout
 * Used for session monitoring in AuthContext
 */
export const checkSession = async (token) => {
  console.log("=== checkSession START ===");
  console.log("Token provided:", token ? "Yes" : "No");
  
  if (!token) {
    console.log("No token provided");
    return { valid: false, message: "Missing token" };
  }

  try {
    console.log("Verifying JWT token...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const sql = neon(process.env.DATABASE_URL || process.env.NEON_DATABASE_URL);

    // Get user ID (handle both naming conventions)
    const userId = decoded.user_id || decoded.user_ID;
    
    if (!userId) {
      console.log("No user ID in token");
      return { valid: false, message: "Invalid token format" };
    }

    console.log("Token decoded successfully:", {
      user_id: userId,
      username: decoded.username,
      iat: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : 'No iat'
    });

    // Check user state and last_login
    console.log(`Querying database for user_id: ${userId}`);
    const result = await sql`
      SELECT state, last_login 
      FROM "user" 
      WHERE user_id = ${userId}
    `;

    if (result.length === 0) {
      console.log("User not found in database");
      return { valid: false, message: "User not found" };
    }

    const userState = result[0].state;
    const lastLogin = result[0].last_login;
    
    console.log("User state from DB:", userState);
    console.log("Last login from DB:", lastLogin ? new Date(lastLogin).toISOString() : 'Never');

    // Check for stale session (token issued before last login)
    if (decoded.iat && lastLogin) {
      const tokenIssuedAt = decoded.iat * 1000; // milliseconds
      const lastLoginTime = new Date(lastLogin).getTime();
      
      console.log(`Token issued at (ms): ${tokenIssuedAt}`);
      console.log(`Last login time (ms): ${lastLoginTime}`);
      console.log(`Difference (ms): ${lastLoginTime - tokenIssuedAt}`);
      
      // ADD TOLERANCE: Allow 10-second window for timing differences
      const TOLERANCE_MS = 10000; // 10 seconds
      
      // Only invalidate if token is significantly older than last login
      if (tokenIssuedAt < (lastLoginTime - TOLERANCE_MS)) {
        console.log("Stale session detected (outside tolerance window)");
        return { 
          valid: false, 
          message: "Session terminated - Another login detected" 
        };
      } else {
        console.log("Token is within tolerance window, session is valid");
      }
    }

    if (userState !== 1) {
      console.log(`User is not logged in (state = ${userState})`);
      return { 
        valid: false, 
        message: "Session terminated - User logged out" 
      };
    }

    console.log("✅ checkSession successful");
    return { 
      valid: true, 
      user_id: userId,
      username: decoded.username,
      role: decoded.role,
      message: "Session active" 
    };
    
  } catch (err) {
    console.error("checkSession error:", err.message);
    console.error("Error stack:", err.stack);
    
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      console.log(`JWT error: ${err.name}`);
      return { 
        valid: false, 
        message: "Invalid or expired token" 
      };
    }
    
    return { 
      valid: false, 
      message: err.message || "Session check failed" 
    };
  } finally {
    console.log("=== checkSession END ===");
  }
};

/**
 * Logout user from all sessions (including current)
 */
export const logoutUser = async (user_id) => {
  console.log("=== logoutUser START ===");
  console.log("Logging out user ID:", user_id);
  
  try {
    const sql = neon(process.env.DATABASE_URL || process.env.NEON_DATABASE_URL);
    
    // Update state to 0 AND update last_login to prevent stale token re-use
    console.log("Updating user state to 0 and updating last_login...");
    const result = await sql`
      UPDATE "user" 
      SET state = 0, last_login = NOW()
      WHERE user_id = ${user_id}
      RETURNING user_id, username, state, last_login
    `;
    
    if (result.length === 0) {
      console.log("User not found in database");
      return { 
        success: false, 
        error: "User not found" 
      };
    }
    
    const updatedUser = result[0];
    console.log(`User ${updatedUser.username} logged out successfully`);
    console.log("Updated state:", updatedUser.state);
    console.log("Updated last_login:", updatedUser.last_login ? new Date(updatedUser.last_login).toISOString() : 'null');
    
    console.log("✅ logoutUser successful");
    return { 
      success: true,
      message: "User logged out successfully"
    };
    
  } catch (error) {
    console.error("logoutUser error:", error);
    return { 
      success: false, 
      error: error.message 
    };
  } finally {
    console.log("=== logoutUser END ===");
  }
};

/**
 * Force logout all other sessions (keep current session)
 */
export const logoutOtherSessions = async (user_id, currentToken) => {
  console.log("=== logoutOtherSessions START ===");
  console.log("User ID:", user_id);
  console.log("Current token length:", currentToken ? currentToken.length : 'No token');
  
  try {
    const sql = neon(process.env.DATABASE_URL || process.env.NEON_DATABASE_URL);
    
    // First, verify the current token is valid
    console.log("Verifying current token...");
    let decoded;
    try {
      decoded = jwt.verify(currentToken, process.env.JWT_SECRET);
      console.log("Current token verified, issued at:", 
        decoded.iat ? new Date(decoded.iat * 1000).toISOString() : 'No iat');
    } catch (tokenErr) {
      console.warn("Current token verification failed:", tokenErr.message);
      // Continue anyway - user might want to logout other sessions even with expired token
    }
    
    // Update last_login to current time - this will invalidate all older tokens
    console.log("Updating last_login to invalidate older tokens...");
    const result = await sql`
      UPDATE "user" 
      SET last_login = NOW() 
      WHERE user_id = ${user_id}
      RETURNING user_id, username, last_login
    `;
    
    if (result.length === 0) {
      console.log("User not found in database");
      return { 
        success: false, 
        error: "User not found" 
      };
    }
    
    const updatedUser = result[0];
    console.log(`Updated last_login for user ${updatedUser.username}:`, 
      updatedUser.last_login ? new Date(updatedUser.last_login).toISOString() : 'null');
    
    console.log("✅ logoutOtherSessions successful");
    return { 
      success: true,
      message: "Other sessions logged out successfully",
      new_last_login: updatedUser.last_login
    };
    
  } catch (error) {
    console.error("logoutOtherSessions error:", error);
    return { 
      success: false, 
      error: error.message 
    };
  } finally {
    console.log("=== logoutOtherSessions END ===");
  }
};