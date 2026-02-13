import React, { useState, useEffect } from "react";
import IssuesTable from "./IssuesTable";
import AddIssueModal from "./AddIssueModal";
import FiltersModal from "./IssueFiltersModal";

export default function IssuesPage() {
  const [showAddIssue, setShowAddIssue] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterData, setFilterData] = useState({ plateNumber: "", issue: "", type: "", date: "", time: "" });
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch issues on component mount
  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/.netlify/functions/getVehicleIssues');
      const data = await response.json();
      
      if (data.data) {
        // Transform API data to match the expected format
        const formattedIssues = data.data.map((issue, index) => ({
          id: issue.issue_id,
          vehicleId: issue.vehicle_id?.toString() || "Unknown",
          vehicleModel: `${issue.brand || ''} ${issue.model || ''}`.trim() || "Unknown Vehicle",
          plateNumber: issue.plate_number || "Unknown",
          issue: issue.custom_issue || (issue.issue_categories && issue.issue_categories.length > 0 
            ? issue.issue_categories.join(', ') 
            : issue.issue_description || "No description"),
          type: issue.vehicle_status || "Unknown",
          date: issue.reported_date 
            ? new Date(issue.reported_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
            : new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
          time: issue.reported_date
            ? new Date(issue.reported_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            : new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          status: issue.status,
          severity: issue.severity,
          reportedBy: issue.reported_by_name || "Unknown"
        }));
        
        setIssues(formattedIssues);
      }
    } catch (err) {
      console.error('Error fetching issues:', err);
      setError('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="p-3 md:p-8 overflow-auto flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading issues...</p>
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
            onClick={fetchIssues}
            className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
