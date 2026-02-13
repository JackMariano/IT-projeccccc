import React, { useState, useEffect } from "react";
import InventoryTable from "./InventoryTable";
import EditInventoryModal from "./EditInventoryModal";

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch inventory on component mount
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/.netlify/functions/getInventory');
      const data = await response.json();
      
      if (data.data) {
        // Transform API data to match the expected format
        const formattedItems = data.data.map((item) => ({
          id: item.part_id,
          name: item.part_name,
          status: item.current_quantity === 0 
            ? "Out Of Stock" 
            : item.current_quantity <= 10 
              ? "Low Stock" 
              : "Available",
          type: item.part_category || "General",
          group: item.measurement || "Unit",
          quantity: item.current_quantity,
          description: item.part_description || "",
          image: getItemEmoji(item.part_name, item.part_category)
        }));
        
        setItems(formattedItems);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to assign emoji based on item name/category
  const getItemEmoji = (name, category) => {
    const nameLower = (name || '').toLowerCase();
    const catLower = (category || '').toLowerCase();
    
    if (nameLower.includes('tire') || catLower.includes('tire')) return '🛞';
    if (nameLower.includes('oil') || catLower.includes('oil') || nameLower.includes('fluid')) return '🛢️';
    if (nameLower.includes('brake')) return '🛑';
    if (nameLower.includes('battery')) return '🔋';
    if (nameLower.includes('filter')) return '🔲';
    if (nameLower.includes('light') || nameLower.includes('bulb')) return '💡';
    if (nameLower.includes('tool')) return '🔧';
    if (nameLower.includes('wheel') || nameLower.includes('rim')) return '⚙️';
    if (nameLower.includes('belt')) return '➰';
    if (nameLower.includes('hose')) return '📿';
    return '📦';
  };

  const filteredInventory = items.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleItemUpdate = async (updated) => {
    // Update local state first for immediate feedback
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
    setSelectedItem(null);
    
    // Show success message
    setSuccessMessage(`Successfully updated ${updated.name}`);
    setTimeout(() => setSuccessMessage(null), 3000);
    
    // Then refresh from server to ensure data is persisted
    // This ensures that if you navigate away and come back, the data will be correct
    await fetchInventory();
  };

  if (loading) {
    return (
      <div className="p-3 md:p-8 overflow-auto flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 md:p-8 overflow-auto flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchInventory}
            className="bg-cyan-500 text-white px-4 py-2 rounded-md hover:bg-cyan-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-8 overflow-auto flex-1 flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-0 mb-4 md:mb-8">
        <h2 className="text-2xl md:text-4xl font-bold">Parts and Inventory</h2>
        <button className="bg-cyan-500 text-white px-4 md:px-6 py-2 rounded-md hover:bg-cyan-600 flex items-center gap-2 text-sm md:text-base whitespace-nowrap">
          <span>🔍</span>
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}

      <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-end">
        <input type="text" placeholder="Search parts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="px-3 md:px-4 py-2 border border-gray-400 rounded-md w-full sm:w-64 text-sm md:text-base" />
      </div>

      <InventoryTable inventory={filteredInventory} onItemClick={setSelectedItem} />

      {selectedItem && <EditInventoryModal item={selectedItem} onClose={() => setSelectedItem(null)} onSave={handleItemUpdate} />}
    </div>
  );
}
