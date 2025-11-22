import React, { useState } from "react";
import InventoryTable from "./InventoryTable";
import EditInventoryModal from "./EditInventoryModal";

const inventoryItems = [
  { id: 1, name: "Tires", status: "Available", type: "Van", group: "Dunlop", quantity: 12, image: "🛞" },
  { id: 2, name: "Oil", status: "Available", type: "Suv", group: "Shell", quantity: 15231, image: "🛢️" },
  { id: 3, name: "Brakes", status: "Out Of Stocks", type: "Van", group: "Bremboo", quantity: 14231, image: "🔧" },
];

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [items, setItems] = useState(inventoryItems);

  const filteredInventory = items.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleItemUpdate = (updated) => {
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
    setSelectedItem(null);
  };

  return (
    <div className="p-3 md:p-8 overflow-auto flex-1 flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-0 mb-4 md:mb-8">
        <h2 className="text-2xl md:text-4xl font-bold">Parts and Inventory</h2>
        <button className="bg-cyan-500 text-white px-4 md:px-6 py-2 rounded-md hover:bg-cyan-600 flex items-center gap-2 text-sm md:text-base whitespace-nowrap">
          <span>🔍</span>
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>

      <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-end">
        <input type="text" placeholder="Tires" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="px-3 md:px-4 py-2 border border-gray-400 rounded-md w-full sm:w-64 text-sm md:text-base" />
      </div>

      <InventoryTable inventory={filteredInventory} onItemClick={setSelectedItem} />

      {selectedItem && <EditInventoryModal item={selectedItem} onClose={() => setSelectedItem(null)} onSave={handleItemUpdate} />}
    </div>
  );
}
