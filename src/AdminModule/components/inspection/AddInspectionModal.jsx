import React, { useState } from "react";

export default function AddInspectionModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    vehicleName: "",
    type: "",
    inspectionType: "",
    scheduledDate: "",
    status: "scheduled",
  });

  const submit = () => {
    onAdd(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-96 shadow-2xl">
        <h3 className="text-2xl font-bold mb-6 text-center">Add Inspection</h3>
        <div className="space-y-4">
          <div><label className="block mb-2 font-medium">Vehicle</label><input type="text" value={form.vehicleName} onChange={(e) => setForm({ ...form, vehicleName: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100" /></div>
          <div><label className="block mb-2 font-medium">Type</label><input type="text" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100" /></div>
          <div><label className="block mb-2 font-medium">Inspection Type</label><input type="text" value={form.inspectionType} onChange={(e) => setForm({ ...form, inspectionType: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100" /></div>
          <div><label className="block mb-2 font-medium">Scheduled Date</label><input type="text" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100" /></div>
          <div className="flex justify-center mt-6">
            <button onClick={submit} className="px-12 py-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 font-medium">Confirm</button>
          </div>
        </div>
      </div>
    </div>
  );
}
