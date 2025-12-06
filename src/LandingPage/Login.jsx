import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../security/AuthContext"; 
import axios from "axios";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e, force = false) => {
    e.preventDefault();
    setError("");
    setAlreadyLoggedIn(false);

    if (!username || !password) {
      setError("Please enter username and password");
      return;
    }

    try {
      setLoading(true);

      // Call Netlify login function
      const res = await axios.post("/.netlify/functions/login", {
        username,
        password,
        force: force || false,
      });

      const { token, user_ID, username: resUsername, role } = res.data;

      console.log("Login successful, role:", role); // Debug log

      // Prepare user data object - store role EXACTLY as from backend
      const userData = {
        user_ID,
        username: resUsername,
        role: role, // Keep original case: "Admin", "Driver", "Shop"
      };

      // Save to AuthContext
      login(userData, token);

      // Redirect based on role - use EXACT case matching
      if (role === "Driver") {
        navigate("/driver", { replace: true });
      } else if (role === "Shop") {
        navigate("/shop", { replace: true });
      } else if (role === "Admin") {
        navigate("/admin", { replace: true });
      } else {
        console.warn("Unexpected role:", role);
        setError(`Unknown role: ${role}. Contact administrator.`);
      }

    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      
      // Handle "already logged in" case
      if (err.response?.status === 403 && err.response?.data?.alreadyLoggedIn) {
        setAlreadyLoggedIn(true);
        setError("User is already logged in elsewhere. Logout first or force login?");
      } else {
        setError(err.response?.data?.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForceLogin = (e) => {
    handleLogin(e, true);
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4 relative"
      style={{
        backgroundImage: "url('/images/bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-[#001F4D] opacity-80"></div>
      <div
        className="relative bg-[#5A6D8F]/70 pt-16 pb-20 px-24 rounded-3xl shadow-2xl w-full max-w-xl"
        style={{ boxShadow: "0 0 40px rgba(0, 0, 0, 0.4)" }}
      >
        <div className="text-center mb-1">
          <h1 className="text-5xl font-extrabold text-sky-400">JMTC</h1>
        </div>
        <div className="text-center mb-8">
          <h2 className="text-lg font-semibold text-yellow-500">Transport Services</h2>
        </div>

        {error && (
          <div className="text-center mb-4">
            <div className="text-red-600 font-semibold mb-2">{error}</div>
            {alreadyLoggedIn && (
              <button
                onClick={handleForceLogin}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Force Login (Logout other session)
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col items-center w-full">
          <div className="mb-4 w-full">
            <label htmlFor="username" className="block text-yellow-500 font-semibold mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              disabled={loading}
            />
          </div>

          <div className="mb-8 w-full">
            <label htmlFor="password" className="block text-yellow-500 font-semibold mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-2/3 py-2 font-bold rounded-lg transition-colors ${
              loading
                ? "bg-gray-500 text-white cursor-not-allowed"
                : "bg-yellow-600 text-white hover:bg-yellow-500"
            }`}
          >
            {loading ? "Logging in..." : "LOGIN"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;