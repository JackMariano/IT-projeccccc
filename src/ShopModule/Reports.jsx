// components/Reports.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../security/AuthContext";
import ReportsModal from "./ReportsModal";

export default function Reports() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState({});
  
  // Filter and sort states
  const [statusFilter, setStatusFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [dateSort, setDateSort] = useState("newest");

  // Workflow status options (matches backend)
  const STATUS_OPTIONS = ['Reported', 'Received', 'Under Repair', 'Resolved'];

  // Vehicle status display mapping
  const VEHICLE_STATUS_DISPLAY = {
    'available': { text: 'Available', color: '#2ecc71' },
    'in use': { text: 'In Use', color: '#f39c12' },
    'reserved': { text: 'Reserved', color: '#3498db' },
    'for inspection': { text: 'For Inspection', color: '#9b59b6' },
    'under repair': { text: 'Under Repair', color: '#e74c3c' },
    'finished repair': { text: 'Finished Repair', color: '#27ae60' }
  };

  // Severity options
  const SEVERITY_OPTIONS = ['low', 'high', 'critical'];

  // Helper function to determine vehicle status from multiple issues
  const getVehicleStatusFromIssues = (issues) => {
    if (!issues || issues.length === 0) {
      return null;
    }
    
    const allStatuses = issues.map(issue => issue.status);
    
    // Check if ANY issue is 'Under Repair'
    const hasUnderRepair = allStatuses.some(s => s === 'Under Repair');
    
    // Check if ANY issue is 'Received' (and none are 'Under Repair')
    const hasReceived = allStatuses.some(s => s === 'Received');
      
    // Check if ALL issues are 'Resolved'
    const allResolved = allStatuses.every(s => s === 'Resolved');
    
    if (hasUnderRepair) {
      return 'Under Repair';
    } else if (hasReceived) {
      return 'For Inspection';
    } else if (allResolved) {
      return 'Finished Repair';
    }

    // Some issues are Reported (pending received/repair) — vehicle not yet in shop
    return 'available';
  };

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "Shop")) {
      navigate("/login", { replace: true });
      return;
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && user) {
      loadReports();
    }
  }, [authLoading, user]);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const endpoint = `/.netlify/functions/getVehicleIssues`;
      const res = await fetch(endpoint);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to load reports: HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success && data.data) {
        // Group issues by vehicle for proper status calculation
        const issuesByVehicle = {};
        const rawReports = data.data.map(report => ({
          issue_id: report.issue_id,
          vehicle_id: report.vehicle_id,
          brand: report.brand,
          model: report.model,
          plate_number: report.plate_number,
          vehicle_status_from_db: report.vehicle_status,
          reported_by: report.reported_by,
          reported_by_name: report.reported_by_name || 'Unknown',
          issue_categories: report.issue_categories || [],
          custom_issue: report.custom_issue || '',
          issue_description: report.issue_description || '',
          reported_date: report.reported_date ? new Date(report.reported_date) : new Date(),
          status: STATUS_OPTIONS.includes(report.status) ? report.status : 'Reported',
          severity: report.severity || 'low',
          last_updated_by: report.last_updated_by || null,
          last_update_time: report.last_update_time ? new Date(report.last_update_time) : null
        }));
        
        // Group by vehicle
        rawReports.forEach(report => {
          if (!issuesByVehicle[report.vehicle_id]) {
            issuesByVehicle[report.vehicle_id] = [];
          }
          issuesByVehicle[report.vehicle_id].push(report);
        });
        
        // Process each report with proper vehicle status calculation
        const processedReports = rawReports.map(report => {
          const vehicleIssues = issuesByVehicle[report.vehicle_id] || [];
          const calculatedVehicleStatus = getVehicleStatusFromIssues(vehicleIssues);
          
          // Determine status flags for this vehicle
          const allStatuses = vehicleIssues.map(issue => issue.status);
          const hasOpenIssues = allStatuses.some(s => s !== 'Resolved');
          const hasUnderRepair = allStatuses.some(s => s === 'Under Repair');
          const hasReceived = allStatuses.some(s => s === 'Received');
          const allResolved = allStatuses.every(s => s === 'Resolved');
          
          return {
            ...report,
            vehicle: `${report.brand || ''} ${report.model || ''} ${report.plate_number || ''}`.trim(),
            vehicle_has_issues: true,
            vehicle_issues_count: vehicleIssues.length,
            vehicle_status: calculatedVehicleStatus || report.vehicle_status_from_db || 'available',
            vehicle_has_open_issues: hasOpenIssues,
            vehicle_has_under_repair: hasUnderRepair,
            vehicle_has_received: hasReceived,
            all_issues_resolved: allResolved
          };
        });
        
        setReports(processedReports);
      } else {
        setReports([]);
        throw new Error(data.error || 'Failed to load reports');
      }
      
    } catch (err) {
      console.error("Error loading reports:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (issueId, newStatus) => {
    // Validate status locally first
    if (!STATUS_OPTIONS.includes(newStatus)) {
      alert(`Invalid status: ${newStatus}. Must be one of: ${STATUS_OPTIONS.join(', ')}`);
      return;
    }

    setUpdatingStatus(prev => ({ ...prev, [issueId]: true }));
    
    try {
      const endpoint = `/.netlify/functions/updateIssueStatus`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issue_id: issueId,
          status: newStatus,
          changed_by: user?.user_id || user?.user_ID || 1
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Refresh all reports to get updated statuses
        await loadReports();
        
        // Show success message from backend
        alert(data.message || `Issue status updated to ${newStatus}`);
        
      } else {
        throw new Error(data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [issueId]: false }));
    }
  };

  const handleViewDetails = (report) => {
    setSelectedReport(report);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedReport(null);
  };

  // Filter and sort reports
  const filteredAndSortedReports = useMemo(() => {
    let filtered = [...reports];
    
    // Apply status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter(report => report.status === statusFilter);
    }
    
    // Apply severity filter
    if (severityFilter !== "All") {
      filtered = filtered.filter(report => report.severity === severityFilter);
    }
    
    // Apply date sort
    filtered.sort((a, b) => {
      if (dateSort === "newest") {
        return b.reported_date - a.reported_date;
      } else {
        return a.reported_date - b.reported_date;
      }
    });
    
    return filtered;
  }, [reports, statusFilter, severityFilter, dateSort]);

  const containerStyle = {
    background: "#fff",
    borderRadius: "1.5rem",
    boxShadow: "0 0 20px rgba(0,0,0,0.2)",
    padding: "32px",
    maxWidth: "100%",
    boxSizing: "border-box",
    margin: "0",
    minHeight: "calc(100vh - 110px)",
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "1.3rem",
    fontWeight: 600,
    marginBottom: "24px",
    fontFamily: "Montserrat, sans-serif",
  };

  const filterContainerStyle = {
    display: "flex",
    gap: "16px",
    marginBottom: "24px",
    flexWrap: "wrap",
    alignItems: "center",
  };

  const filterLabelStyle = {
    fontSize: "0.9rem",
    fontWeight: "500",
    color: "#666",
    marginRight: "8px",
  };

  const selectStyle = {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "0.9rem",
    background: "#f9f9f9",
    cursor: "pointer",
    minWidth: "140px",
  };

  const thStyle = {
    background: "#0e2a47",
    color: "#e6e6e6",
    fontWeight: 500,
    padding: "14px 16px",
    textAlign: "left",
    fontSize: "1rem",
    whiteSpace: "nowrap",
  };

  const tdStyle = {
    padding: "14px 16px",
    textAlign: "left",
    whiteSpace: "normal",
    wordWrap: "break-word",
    borderBottom: "1px solid #eee",
  };

  const statusBadgeStyle = (status) => {
    let backgroundColor = "#95a5a6";
    
    // Workflow status colors
    if (status === 'Reported') {
      backgroundColor = "#3498db"; // Blue
    } else if (status === 'Received') {
      backgroundColor = "#f39c12"; // Orange
    } else if (status === 'Under Repair') {
      backgroundColor = "#e74c3c"; // Red
    } else if (status === 'Resolved') {
      backgroundColor = "#2ecc71"; // Green
    }
    
    return {
      padding: "6px 12px",
      borderRadius: "16px",
      color: "#fff",
      fontWeight: 600,
      fontSize: "0.85rem",
      display: "inline-block",
      background: backgroundColor,
    };
  };

  const vehicleStatusBadgeStyle = (status) => {
    const statusInfo = VEHICLE_STATUS_DISPLAY[status?.toLowerCase()] || 
                      VEHICLE_STATUS_DISPLAY[status?.replace(' ', '_')?.toLowerCase()] || 
                      { text: status || 'Unknown', color: '#95a5a6' };
    
    return {
      padding: "4px 8px",
      borderRadius: "8px",
      color: "#fff",
      fontWeight: 600,
      fontSize: "0.75rem",
      display: "inline-block",
      background: statusInfo.color,
      textTransform: 'capitalize'
    };
  };

  const severityBadgeStyle = (severity) => {
    let backgroundColor = "#95a5a6";
    
    if (severity === 'critical') {
      backgroundColor = "#e74c3c";
    } else if (severity === 'high') {
      backgroundColor = "#f39c12";
    } else if (severity === 'low') {
      backgroundColor = "#2ecc71";
    }
    
    return {
      padding: "4px 10px",
      borderRadius: "12px",
      color: "#fff",
      fontWeight: 600,
      fontSize: "0.75rem",
      display: "inline-block",
      background: backgroundColor,
      textTransform: 'capitalize'
    };
  };

  const vehicleIssuesBadgeStyle = (count) => {
    let backgroundColor = count > 1 ? "#e74c3c" : "#95a5a6";
    
    return {
      padding: "2px 6px",
      borderRadius: "10px",
      color: "#fff",
      fontWeight: 600,
      fontSize: "0.7rem",
      display: "inline-block",
      background: backgroundColor,
      marginLeft: "4px"
    };
  };

  const formatDateTime = (date) => {
    try {
      if (!date || isNaN(date.getTime())) {
        return { date: "Invalid Date", time: "" };
      }
      return {
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
    } catch {
      return { date: "Invalid Date", time: "" };
    }
  };

  if (authLoading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", padding: "60px", color: "#0e2a47" }}>
          <div style={{ fontSize: "1.2rem", marginBottom: "16px" }}>
            Verifying authentication...
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", padding: "60px", color: "#0e2a47" }}>
          <div style={{ fontSize: "1.2rem", marginBottom: "16px" }}>
            Loading reports...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", padding: "60px", color: "#cc0000" }}>
          <div style={{ fontSize: "1.2rem", marginBottom: "16px" }}>
            Error Loading Reports
          </div>
          <div style={{ fontSize: "0.9rem", marginBottom: "20px" }}>
            {error}
          </div>
          <button
            onClick={loadReports}
            style={{
              padding: "8px 24px",
              borderRadius: "6px",
              border: "1px solid #0e2a47",
              background: "#0e2a47",
              color: "white",
              cursor: "pointer",
              fontSize: "0.9rem"
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <span>Vehicle Issue Reports</span>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <span style={{ fontSize: "0.9rem", color: "#666" }}>
              Showing: {filteredAndSortedReports.length} of {reports.length} reports
            </span>
            <button
              onClick={loadReports}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #0e2a47",
                background: "#0e2a47",
                color: "white",
                cursor: "pointer",
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={filterContainerStyle}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={filterLabelStyle}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="All">All Statuses</option>
              {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={filterLabelStyle}>Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="All">All Severities</option>
              {SEVERITY_OPTIONS.map(severity => (
                <option key={severity} value={severity}>{severity.charAt(0).toUpperCase() + severity.slice(1)}</option>
              ))}
            </select>
          </div>
          
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={filterLabelStyle}>Sort by Date:</span>
            <select
              value={dateSort}
              onChange={(e) => setDateSort(e.target.value)}
              style={selectStyle}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        <table style={{ 
          width: "100%", 
          borderCollapse: "collapse",
          fontFamily: "Arial, sans-serif"
        }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: "20%" }}>Vehicle</th>
              <th style={{ ...thStyle, width: "12%" }}>Date Reported</th>
              <th style={{ ...thStyle, width: "10%" }}>Severity</th>
              <th style={{ ...thStyle, width: "15%" }}>Vehicle Status</th>
              <th style={{ ...thStyle, width: "20%" }}>Workflow Status</th>
              <th style={{ ...thStyle, width: "10%" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedReports.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ 
                  ...tdStyle, 
                  textAlign: "center", 
                  padding: "60px",
                  color: "#666",
                  fontSize: "1rem"
                }}>
                  {reports.length === 0 
                    ? "No vehicle issue reports found" 
                    : "No reports match the selected filters"}
                </td>
              </tr>
            ) : (
              filteredAndSortedReports.map((report) => {
                const reportedDate = formatDateTime(report.reported_date);
                const vehicleStatusInfo = VEHICLE_STATUS_DISPLAY[report.vehicle_status?.toLowerCase()] || 
                                         VEHICLE_STATUS_DISPLAY[report.vehicle_status?.replace(' ', '_')?.toLowerCase()] || 
                                         { text: report.vehicle_status || 'Unknown', color: '#95a5a6' };
                
                // Get the background color for the current status
                const getStatusBackgroundColor = (status) => {
                  if (status === 'Reported') return "#3498db";
                  if (status === 'Received') return "#f39c12";
                  if (status === 'Under Repair') return "#e74c3c";
                  if (status === 'Resolved') return "#2ecc71";
                  return "#95a5a6";
                };
                
                // Style for the colored dropdown
                const coloredSelectStyle = {
                  padding: "6px 30px 6px 12px",
                  borderRadius: "16px",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  background: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23ffffff%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E") right 10px center/12px 12px no-repeat`,
                  backgroundColor: getStatusBackgroundColor(report.status),
                  border: "none",
                  appearance: "none",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  minWidth: "160px",
                  outline: "none",
                  position: "relative",
                  transition: "background-color 0.2s"
                };
                
                return (
                  <tr key={report.issue_id}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500, fontSize: "0.95rem" }}>
                        {report.brand} {report.model}
                        {report.vehicle_issues_count > 1 && (
                          <span style={vehicleIssuesBadgeStyle(report.vehicle_issues_count)}>
                            {report.vehicle_issues_count} issues
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "#666" }}>
                        Plate: {report.plate_number}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500, fontSize: "0.95rem" }}>
                        {reportedDate.date}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "#666" }}>
                        {reportedDate.time}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={severityBadgeStyle(report.severity)}>
                        {report.severity}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={vehicleStatusBadgeStyle(report.vehicle_status)}>
                        {vehicleStatusInfo.text}
                      </span>
                      {report.vehicle_issues_count > 1 && (
                        <div style={{ fontSize: "0.7rem", color: "#666", marginTop: "2px" }}>
                          {report.vehicle_has_under_repair ? (
                            <span style={{ color: "#e74c3c" }}>⚠️ Has issues under repair</span>
                          ) : report.vehicle_has_received ? (
                            <span style={{ color: "#9b59b6" }}>🔍 Has issues for inspection</span>
                          ) : report.vehicle_has_open_issues ? (
                            <span style={{ color: "#f39c12" }}>📋 Has open issues</span>
                          ) : (
                            <span style={{ color: "#2ecc71" }}>✅ All issues resolved</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {updatingStatus[report.issue_id] ? (
                        <div style={{ display: "inline-block" }}>
                          <select
                            value={report.status}
                            style={{
                              ...coloredSelectStyle,
                              opacity: 0.7,
                              cursor: "not-allowed"
                            }}
                            disabled
                          >
                            <option value={report.status} style={{ backgroundColor: "#fff", color: "#333" }}>
                              Updating...
                            </option>
                          </select>
                        </div>
                      ) : (
                        <div style={{ display: "inline-block", position: "relative" }}>
                          <select
                            value={report.status}
                            onChange={(e) => handleStatusChange(report.issue_id, e.target.value)}
                            style={coloredSelectStyle}
                            disabled={updatingStatus[report.issue_id]}
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option 
                                key={option} 
                                value={option}
                                style={{ 
                                  backgroundColor: "#fff", 
                                  color: "#333",
                                  padding: "8px",
                                  fontSize: "0.85rem"
                                }}
                              >
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleViewDetails(report)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "6px",
                          border: "1px solid #0e2a47",
                          background: "transparent",
                          color: "#0e2a47",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                          fontWeight: "500",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = "#0e2a47";
                          e.target.style.color = "white";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = "transparent";
                          e.target.style.color = "#0e2a47";
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && selectedReport && (
        <ReportsModal
          report={selectedReport}
          isOpen={modalOpen}
          onClose={handleModalClose}
        />
      )}
    </>
  );
}