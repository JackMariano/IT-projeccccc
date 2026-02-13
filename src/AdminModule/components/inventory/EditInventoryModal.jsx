import React, { useState } from "react";

export default function EditInventoryModal({ item, onClose, onSave }) {
  const [form, setForm] = useState({
    id: item.id,
    status: item.quantity === 0 ? "outofstock" : "active",
    type: item.type,
    group: item.group,
    quantity: item.quantity,
    name: item.name,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const save = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Calculate the actual quantity based on status
      // If status is "outofstock", set quantity to 0
      // Otherwise, use the quantity from the form
      const finalQuantity = form.status === "outofstock" ? 0 : parseInt(form.quantity);
      
      // Call the API to update the inventory
      const response = await fetch('/.netlify/functions/updateInventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          part_id: form.id,
          part_name: form.name,
          part_category: form.type,
          measurement: form.group,
          current_quantity: finalQuantity,
          user_id: 1 // You should get this from your auth context
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update inventory');
      }

      // Create the updated item object for the UI
      const updated = {
        id: form.id,
        name: form.name,
        status: finalQuantity === 0 ? "Out Of Stock" : finalQuantity <= 10 ? "Low Stock" : "Available",
        type: form.type,
        group: form.group,
        quantity: finalQuantity,
        image: item.image,
      };
      
      onSave(updated);
    } catch (err) {
      console.error('Error updating inventory:', err);
      setError(err.message || 'Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-96 shadow-2xl">
        <h3 className="text-2xl font-bold mb-6 text-center">{item.name}</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="status" 
                  value="active" 
                  checked={form.status === "active"} 
                  onChange={(e) => setForm({ ...form, status: e.target.value })} 
                  className="w-5 h-5" 
                  disabled={loading}
                />
                <span>Active</span>
              </label>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="status" 
                  value="outofstock" 
                  checked={form.status === "outofstock"} 
                  onChange={(e) => setForm({ ...form, status: e.target.value })} 
                  className="w-5 h-5" 
                  disabled={loading}
                />
                <span>Out of Stock</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block mb-2 font-medium">type</label>
            <input 
              type="text" 
              value={form.type} 
              onChange={(e) => setForm({ ...form, type: e.target.value })} 
              className="w-full px-4 py-2 border border-gray-300 rounded-md" 
              disabled={loading}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Group</label>
            <input 
              type="text" 
              value={form.group} 
              onChange={(e) => setForm({ ...form, group: e.target.value })} 
              className="w-full px-4 py-2 border border-gray-300 rounded-md" 
              disabled={loading}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Quantity</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={form.quantity} 
                onChange={(e) => setForm({ ...form, quantity: e.target.value })} 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md" 
                disabled={loading || form.status === "outofstock"}
                min="0"
              />
              <span className="text-gray-600">units</span>
            </div>
            {form.status === "outofstock" && (
              <p className="text-xs text-gray-500 mt-1">Quantity will be set to 0 when marked as Out of Stock</p>
            )}
          </div>

          <div className="flex justify-center gap-4 mt-8">
            <button 
              onClick={onClose} 
              className="px-8 py-2 border-2 border-black rounded-full hover:bg-gray-100 font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              onClick={save} 
              className="px-8 py-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 font-medium flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
