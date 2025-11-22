import React from "react";

export default function IssueFiltersModal({ filterData, setFilterData, onClose }) {
  const apply = () => onClose();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-96 shadow-2xl">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><span>☰</span><span>Filters</span></h3>
        <div className="space-y-4">
          <div><label className="block mb-2 font-medium">Plate Number</label><input type="text" placeholder="1A13212" value={filterData.plateNumber} onChange={(e) => setFilterData({ ...filterData, plateNumber: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" /></div>
          <div><label className="block mb-2 font-medium">Issue</label><input type="text" value={filterData.issue} onChange={(e) => setFilterData({ ...filterData, issue: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" /></div>
          <div><label className="block mb-2 font-medium">Type</label><input type="text" value={filterData.type} onChange={(e) => setFilterData({ ...filterData, type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" /></div>
          <div><label className="block mb-2 font-medium">Date</label><input type="text" value={filterData.date} onChange={(e) => setFilterData({ ...filterData, date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" /></div>
          <div><label className="block mb-2 font-medium">Time</label><input type="text" value={filterData.time} onChange={(e) => setFilterData({ ...filterData, time: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" /></div>
          <div className="flex justify-center mt-6"><button onClick={apply} className="px-12 py-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 font-medium">Confirm</button></div>
        </div>
      </div>
    </div>
  );
}
