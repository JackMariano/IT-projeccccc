import jwt from "jsonwebtoken";

export const handler = async (event) => {
  const token = event.headers.authorization?.split(" ")[1];
  if (!token) return { statusCode: 401, body: JSON.stringify({ message: "No token" }) };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { statusCode: 200, body: JSON.stringify(decoded) };
  } catch {
    return { statusCode: 401, body: JSON.stringify({ message: "Invalid or expired token" }) };
  }
};
