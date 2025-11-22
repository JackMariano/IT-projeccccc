import React, { useState } from "react";
import IssuesTable from "./IssuesTable";
import AddIssueModal from "./AddIssueModal";
import FiltersModal from "./IssueFiltersModal";

const initialIssues = [
  {
    id: 1,
    vehicleId: "PW-1",
    vehicleModel: "2014 Ram Ram Pickup 1500",
    plateNumber: "1A13212",
    issue: "Tires changed",
    type: "Suv",
    date: "09/12/25",
    time: "5:39 Pm",
  },
  {
    id: 2,
    vehicleId: "LE-4",
    vehicleModel: "2021 Toyota Hiace",
    plateNumber: "1A13333",
    issue: "Fluid changed",
    type: "Van",
    date: "09/05/25",
    time: "5:31 Pm",
  },
];

export default function IssuesPage() {
  const [showAddIssue, setShowAddIssue] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterData, setFilterData] = useState({ plateNumber: "", issue: "", type: "", date: "", time: "" });
  const [issues, setIssues] = useState(initialIssues);

  const filteredIssues = issues.filter((issue) => {
    return (
      (!filterData.plateNumber || issue.plateNumber.toLowerCase().includes(filterData.plateNumber.toLowerCase())) &&
      (!filterData.issue || issue.issue.toLowerCase().includes(filterData.issue.toLowerCase())) &&
      (!filterData.type || issue.type.toLowerCase().includes(filterData.type.toLowerCase())) &&
      (!filterData.date || issue.date.includes(filterData.date)) &&
      (!filterData.time || issue.time.toLowerCase().includes(filterData.time.toLowerCase()))
    );
  });

  const handleAddIssue = (newIssue) => {
    setIssues((i) => [{ ...newIssue, id: i.length + 1 }, ...i]);
    setShowAddIssue(false);
  };

  return (
    <div className="p-3 md:p-8 overflow-auto flex-1 flex flex-col">
      <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6">Issues</h2>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-6 mb-4 md:mb-6">
        <button onClick={() => setShowAddIssue(true)} className="bg-yellow-500 text-white px-4 md:px-6 py-2 rounded-md hover:bg-yellow-600 flex items-center gap-2 font-medium text-sm md:text-base whitespace-nowrap">
          <span className="text-lg md:text-xl">⊕</span>
          <span>Add</span>
        </button>

        <button onClick={() => setShowFilters(true)} className="bg-white border border-gray-400 px-4 md:px-6 py-2 rounded-md hover:bg-gray-50 flex items-center gap-2 text-sm md:text-base whitespace-nowrap">
          <span>☰</span>
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>

      <IssuesTable issues={filteredIssues} />

      {showAddIssue && <AddIssueModal onClose={() => setShowAddIssue(false)} onAdd={handleAddIssue} />}
      {showFilters && <FiltersModal filterData={filterData} setFilterData={setFilterData} onClose={() => setShowFilters(false)} />}
    </div>
  );
}
