import React, { useState } from "react";

export default function EditInventoryModal({ item, onClose, onSave }) {
  const [form, setForm] = useState({
    id: item.id,
    status: item.status === "Available" ? "active" : "outofstock",
    type: item.type,
    group: item.group,
    quantity: item.quantity,
    name: item.name,
  });

  const save = () => {
    const updated = {
      id: form.id,
      name: form.name,
      status: form.status === "active" ? "Available" : "Out Of Stocks",
      type: form.type,
      group: form.group,
      quantity: Number(form.quantity),
      image: item.image,
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-96 shadow-2xl">
        <h3 className="text-2xl font-bold mb-6 text-center">{item.name}</h3>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" value="active" checked={form.status === "active"} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-5 h-5" />
                <span>Active</span>
              </label>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" value="outofstock" checked={form.status === "outofstock"} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-5 h-5" />
                <span>Out of Stock</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block mb-2 font-medium">type</label>
            <input type="text" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block mb-2 font-medium">Group</label>
            <input type="text" value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block mb-2 font-medium">Quantity</label>
            <div className="flex items-center gap-2">
              <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="flex-1 px-4 py-2 border border-gray-300 rounded-md" />
              <span className="text-gray-600">units</span>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-8">
            <button onClick={onClose} className="px-8 py-2 border-2 border-black rounded-full hover:bg-gray-100 font-medium">Cancel</button>
            <button onClick={save} className="px-8 py-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 font-medium">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
