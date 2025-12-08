// Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../security/AuthContext"; 

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!username || !password) {
      setError("Please enter username and password");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/.netlify/functions/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's a duplicate login attempt
        if (response.status === 403 && data.alreadyLoggedIn) {
          // Auto-force login by calling login again (backend now auto-logouts)
          const forceResponse = await fetch("/.netlify/functions/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });
          
          const forceData = await forceResponse.json();
          
          if (!forceResponse.ok) {
            throw new Error(forceData.message || "Login failed");
          }
          
          processLoginSuccess(forceData);
        } else {
          throw new Error(data.message || "Login failed");
        }
      } else {
        processLoginSuccess(data);
      }
      
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const processLoginSuccess = (data) => {
    if (!data.success) {
      throw new Error(data.message || "Login failed");
    }

    const userData = {
      user_ID: data.user_ID,
      username: data.username,
      role: data.role,
      token: data.token
    };

    // Save to AuthContext
    login(userData, data.token);

    // Store in localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(userData));

    // Check if this was a forced login (previous session existed)
    const previousToken = localStorage.getItem('previousToken');
    if (previousToken && previousToken !== data.token) {
      // This indicates the user logged in from another device/session
      // You could show a notification here if needed
    }

    // Redirect based on role
    if (data.role === "Driver" || data.role === "driver") {
      navigate("/driver", { replace: true });
    } else if (data.role === "Shop" || data.role === "shop") {
      navigate("/shop", { replace: true });
    } else if (data.role === "Admin" || data.role === "admin") {
      navigate("/admin", { replace: true });
    } else if (data.role === "Manager" || data.role === "manager") {
      navigate("/manager", { replace: true });
    } else {
      setError(`Unknown role: ${data.role}. Contact administrator.`);
    }
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
          <div className="text-center mb-4 p-3 bg-red-900/40 rounded-lg">
            <div className="text-red-300 font-semibold">{error}</div>
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
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white/90"
              disabled={loading}
              autoComplete="username"
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
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white/90"
              disabled={loading}
              autoComplete="current-password"
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