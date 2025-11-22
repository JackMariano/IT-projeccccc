import React from "react";

export default function InventoryTable({ inventory = [], onItemClick }) {
  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-gray-800 overflow-x-auto flex-1">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 p-4 md:p-6 border-b-2 border-gray-300 font-semibold text-sm md:text-lg min-w-full">
        <div>Name</div>
        <div className="hidden md:block">Status</div>
        <div className="hidden md:block">Type</div>
        <div className="hidden md:block">Group</div>
        <div>Quantity</div>
      </div>

      <div className="divide-y-2 divide-gray-300">
        {inventory.map((item) => (
          <div key={item.id} onClick={() => onItemClick(item)} className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 p-3 md:p-6 hover:bg-gray-50 cursor-pointer items-center text-xs md:text-base">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="w-10 h-10 md:w-16 md:h-16 bg-gray-200 rounded-lg flex items-center justify-center text-lg md:text-3xl flex-shrink-0">{item.image}</div>
              <span className="font-semibold truncate">{item.name}</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${item.status === "Available" ? "bg-green-500" : "bg-red-500"}`}></div>
              <span>{item.status}</span>
            </div>
            <div className="hidden md:block">{item.type}</div>
            <div className="hidden md:block">{item.group}</div>
            <div className="text-right md:text-left font-semibold">{item.quantity.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
