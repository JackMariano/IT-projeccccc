// src/AdminModule/components/employees/AddEmployeeModal.jsx
import React, { useState } from "react";

export default function AddEmployeeModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    contactNumber: "",
    email: "",
    username: "",
    password: "",
    role: "driver", // default role
  });

  const handleSubmit = () => {
    // Basic validation
    if (!form.firstName || !form.lastName || !form.username || !form.password || !form.email) {
      alert("Please fill all required fields.");
      return;
    }
    onAdd(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-96 relative">
        <button
          className="absolute top-3 right-3 text-2xl font-light text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          &times;
        </button>

        <h3 className="text-2xl font-bold mb-6 text-center text-[#0e2a47]">Add Employee</h3>

        <div className="space-y-4">
          {/* Form fields */}
          <div>
            <label className="block mb-1 font-medium text-sm text-gray-700">First Name</label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="w-full px-4 py-2 border rounded-md bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-sm text-gray-700">Middle Name</label>
            <input
              type="text"
              value={form.middleName}
              onChange={(e) => setForm({ ...form, middleName: e.target.value })}
              className="w-full px-4 py-2 border rounded-md bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-sm text-gray-700">Last Name</label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="w-full px-4 py-2 border rounded-md bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          
          <div>
            <label className="block mb-1 font-medium text-sm text-gray-700">Contact Number</label>
            <input
              type="text"
              value={form.contactNumber}
              onChange={(e) =>
                setForm({ ...form, contactNumber: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-md bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-sm text-gray-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2 border rounded-md bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          
          <div>
            <label className="block mb-1 font-medium text-sm text-gray-700">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full px-4 py-2 border rounded-md bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-sm text-gray-700">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-2 border rounded-md bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-sm text-gray-700">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-4 py-2 border rounded-md bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="driver">Driver</option>
              <option value="manager">Manager</option>
              <option value="shop">Mechanic</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex justify-center pt-4">
            <button
              onClick={handleSubmit}
              className="px-8 py-3 bg-[#0e2a47] text-white rounded-full font-semibold hover:bg-opacity-90 transition-colors"
            >
              Add Employee
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
