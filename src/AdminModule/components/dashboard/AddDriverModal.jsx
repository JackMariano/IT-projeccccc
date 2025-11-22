import React, { useState } from "react";

export default function AddDriverModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    contactNumber: "",
  });

  const handleSubmit = () => {
    onAdd(form);
    onClose();
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

        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-sm">First Name</label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) =>
                setForm({ ...form, firstName: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md bg-gray-200"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-sm">Middle Name</label>
            <input
              type="text"
              value={form.middleName}
              onChange={(e) =>
                setForm({ ...form, middleName: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md bg-gray-200"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-sm">Last Name</label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) =>
                setForm({ ...form, lastName: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md bg-gray-200"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-sm">Contact Number</label>
            <input
              type="text"
              value={form.contactNumber}
              onChange={(e) =>
                setForm({ ...form, contactNumber: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md bg-gray-200"
            />
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-yellow-600 text-white rounded-full font-medium hover:bg-yellow-700"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
