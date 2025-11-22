import React, { useState } from "react";

export default function AddVehicleModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: "",
    year: "",
    make: "",
    model: "",
    vin: "",
    plateNumber: "",
    type: "",
    group: "",
    status: "active",
  });

  const handleSubmit = () => {
    onAdd(form);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-96 shadow-2xl max-h-screen overflow-y-auto">
        <h3 className="text-2xl font-bold mb-6 text-center">Add Vehicle</h3>

        <div className="space-y-4">
          <div>
            <label className="block mb-2 font-medium">Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100" />
          </div>

          <div>
            <label className="block mb-2 font-medium">Year</label>
            <input type="text" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100" />
          </div>

          <div>
            <label className="block mb-2 font-medium">Make</label>
            <input type="text" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100" />
          </div>

          <div>
            <label className="block mb-2 font-medium">Model</label>
            <input type="text" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100" />
          </div>

          <div>
            <label className="block mb-2 font-medium">VIN</label>
            <input type="text" value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100" />
          </div>

          <div>
            <label className="block mb-2 font-medium">License Plate</label>
            <input type="text" value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100" />
          </div>

          <div>
            <label className="block mb-2 font-medium">Type</label>
            <input type="text" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100" />
          </div>

          <div>
            <label className="block mb-2 font-medium">Group</label>
            <input type="text" value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100" />
          </div>

          <div>
            <label className="block mb-2 font-medium">Status</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="vehicleStatus" value="active" checked={form.status === "active"} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-5 h-5" />
                <span>Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="vehicleStatus" value="inactive" checked={form.status === "inactive"} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-5 h-5" />
                <span>Inactive</span>
              </label>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-6">
            <button onClick={onClose} className="px-8 py-2 border-2 border-black rounded-full hover:bg-gray-100 font-medium">Cancel</button>
            <button onClick={handleSubmit} className="px-8 py-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 font-medium">Confirm</button>
          </div>
        </div>
      </div>
    </div>
  );
}
