// components/Reports.jsx
import React, { useState, useEffect } from "react";
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
        throw new Error(`Failed to load reports: HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success && data.data) {
        const formattedReports = data.data.map(report => ({
          issue_id: report.issue_id,
          vehicle_id: report.vehicle_id,
          vehicle: `${report.brand || ''} ${report.model || ''} ${report.plate_number || ''}`.trim(),
          brand: report.brand,
          model: report.model,
          plate_number: report.plate_number,
          reported_by: report.reported_by,
          reported_by_name: report.reported_by_name || 'Unknown',
          issue_categories: report.issue_categories || [],
          custom_issue: report.custom_issue || '',
          issue_description: report.issue_description || '',
          reported_date: report.reported_date ? new Date(report.reported_date) : new Date(),
          status: report.status || 'pending',
          severity: report.severity || 'low'
        }));
        
        setReports(formattedReports);
      } else {
        setReports([]);
      }
      
    } catch (err) {
      console.error("Error loading reports:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (issueId, newStatus) => {
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
          status: newStatus
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setReports(prevReports => 
          prevReports.map(report => 
            report.issue_id === issueId 
              ? { ...report, status: newStatus }
              : report
          )
        );
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

  const containerStyle = {
    background: "#fff",
    borderRadius: "1.5rem",
    boxShadow: "0 0 20px rgba(0,0,0,0.2)",
    padding: "32px",
    maxWidth: "100%",
    boxSizing: "border-box",
    margin: "0",
    minHeight: "calc(100vh - 110px)", // Adjusted for HeaderBar
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
    
    if (status === 'under repair') {
      backgroundColor = "#ffa726";
    } else if (status === 'resolved') {
      backgroundColor = "#2ecc71";
    } else if (status === 'pending') {
      backgroundColor = "#2ca8ff";
    }
    
    return {
      padding: "6px 12px",
      borderRadius: "16px",
      color: "#fff",
      fontWeight: 600,
      fontSize: "0.85rem",
      display: "inline-block",
      background: backgroundColor,
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
              Total: {reports.length} reports
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

        <table style={{ 
          width: "100%", 
          borderCollapse: "collapse",
          fontFamily: "Arial, sans-serif"
        }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: "18%" }}>Vehicle</th>
              <th style={{ ...thStyle, width: "12%" }}>Date Reported</th>
              <th style={{ ...thStyle, width: "10%" }}>Severity</th>
              <th style={{ ...thStyle, width: "20%" }}>Status</th>
              <th style={{ ...thStyle, width: "10%" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ 
                  ...tdStyle, 
                  textAlign: "center", 
                  padding: "60px",
                  color: "#666",
                  fontSize: "1rem"
                }}>
                  No vehicle issue reports found
                </td>
              </tr>
            ) : (
              reports.map((report) => {
                const reportedDate = formatDateTime(report.reported_date);
                
                return (
                  <tr key={report.issue_id}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500, fontSize: "0.95rem" }}>
                        {report.brand} {report.model}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "#666" }}>
                        Plate: {report.plate_number}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#888", marginTop: "2px" }}>
                        Reported by: {report.reported_by_name}
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
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={statusBadgeStyle(report.status)}>
                          {report.status}
                        </span>
                        {updatingStatus[report.issue_id] ? (
                          <span style={{ fontSize: "0.8rem", color: "#666" }}>
                            Updating...
                          </span>
                        ) : (
                          <select
                            value={report.status}
                            onChange={(e) => handleStatusChange(report.issue_id, e.target.value)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "6px",
                              border: "1px solid #ddd",
                              fontSize: "0.85rem",
                              background: "#f9f9f9",
                              cursor: "pointer",
                              minWidth: "120px"
                            }}
                            disabled={updatingStatus[report.issue_id]}
                          >
                            <option value="pending">Pending</option>
                            <option value="under repair">Under Repair</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        )}
                      </div>
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