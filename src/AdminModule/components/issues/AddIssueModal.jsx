import React, { useState } from "react";

export default function AddIssueModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ issue: "", type: "", date: "", time: "", plateNumber: "" });

  const submit = () => {
    onAdd(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-96 shadow-2xl">
        <h3 className="text-2xl font-bold mb-6 text-center">Issue</h3>
        <div className="space-y-4">
          <div><label className="block mb-2 font-medium">Issue</label><input type="text" placeholder="Tires" value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100" /></div>
          <div><label className="block mb-2 font-medium">Type</label><input type="text" placeholder="Suv" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100" /></div>
          <div><label className="block mb-2 font-medium">Date</label><input type="text" placeholder="08/11/25" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100" /></div>
          <div><label className="block mb-2 font-medium">Time</label><input type="text" placeholder="5:39 Pm" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100" /></div>
          <div><label className="block mb-2 font-medium">Plate Number</label><input type="text" placeholder="1A13333" value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100" /></div>
          <div className="flex justify-center mt-6"><button onClick={submit} className="px-12 py-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 font-medium">Confirm</button></div>
        </div>
      </div>
    </div>
  );
}
