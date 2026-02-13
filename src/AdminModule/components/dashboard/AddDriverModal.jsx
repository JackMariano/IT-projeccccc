import React, { useState } from "react";

export default function AddDriverModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
    firstName: "",
    middleName: "",
    lastName: "",
    contactNumber: "",
    email: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!form.username || !form.password || !form.firstName || !form.lastName) {
      setError("Username, password, first name, and last name are required");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/.netlify/functions/createDriver", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          firstName: form.firstName,
          middleName: form.middleName,
          lastName: form.lastName,
          contactNumber: form.contactNumber,
          email: form.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create driver");
      }

      onAdd(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center backdrop-blur-sm z-50">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-80 relative">
        {/* Close button */}
        <button
          className="absolute top-3 right-3 text-2xl font-light"
          onClick={onClose}
        >
          ✖
        </button>

        <h3 className="text-xl font-bold mb-6 text-center">Driver Details</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-sm">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full px-3 py-2 border rounded-md bg-gray-200"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-sm">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 border rounded-md bg-gray-200"
              placeholder="Enter password (min 6 chars)"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-sm">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="w-full px-3 py-2 border rounded-md bg-gray-200"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-sm">
              Middle Name
            </label>
            <input
              type="text"
              value={form.middleName}
              onChange={(e) => setForm({ ...form, middleName: e.target.value })}
              className="w-full px-3 py-2 border rounded-md bg-gray-200"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-sm">Last Name</label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="w-full px-3 py-2 border rounded-md bg-gray-200"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-sm">
              Contact Number
            </label>
            <input
              type="text"
              value={form.contactNumber}
              onChange={(e) =>
                setForm({ ...form, contactNumber: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md bg-gray-200"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-sm">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-md bg-gray-200"
              placeholder="Optional"
            />
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-yellow-600 text-white rounded-full font-medium hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
