// components/ReportsModal.jsx
import React from "react";

export default function ReportsModal({ report, isOpen, onClose }) {
  if (!isOpen) return null;

  // Vehicle status display mapping
  const VEHICLE_STATUS_DISPLAY = {
    'available': { text: 'Available', color: '#2ecc71' },
    'in use': { text: 'In Use', color: '#f39c12' },
    'reserved': { text: 'Reserved', color: '#3498db' },
    'for inspection': { text: 'For Inspection', color: '#9b59b6' },
    'under repair': { text: 'Under Repair', color: '#e74c3c' },
    'finished repair': { text: 'Finished Repair', color: '#27ae60' }
  };

  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "20px",
  };

  const modalContentStyle = {
    background: "#fff",
    borderRadius: "1rem",
    padding: "32px",
    maxWidth: "600px",
    width: "100%",
    maxHeight: "80vh",
    overflowY: "auto",
    boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
    position: "relative",
  };

  const closeButtonStyle = {
    position: "absolute",
    top: "16px",
    right: "16px",
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    color: "#666",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  };

  const headerStyle = {
    fontSize: "1.4rem",
    fontWeight: 600,
    marginBottom: "24px",
    color: "#0e2a47",
    paddingRight: "40px",
    fontFamily: "Montserrat, sans-serif",
  };

  const sectionStyle = {
    marginBottom: "20px",
  };

  const labelStyle = {
    fontSize: "0.9rem",
    color: "#666",
    marginBottom: "4px",
    fontWeight: "500",
    display: "block",
  };

  const valueStyle = {
    fontSize: "1rem",
    color: "#333",
    marginBottom: "12px",
    padding: "8px 12px",
    background: "#f9f9f9",
    borderRadius: "6px",
    border: "1px solid #eee",
  };

  const badgeStyle = (type, value) => {
    let backgroundColor = "#95a5a6";
    
    if (type === 'severity') {
      if (value === 'critical') backgroundColor = "#e74c3c";
      else if (value === 'high') backgroundColor = "#f39c12";
      else if (value === 'low') backgroundColor = "#2ecc71";
    } else if (type === 'workflow') {
      // Workflow status colors
      if (value === 'Reported') backgroundColor = "#3498db";
      else if (value === 'Received') backgroundColor = "#f39c12";
      else if (value === 'Under Repair') backgroundColor = "#e74c3c";
      else if (value === 'Resolved') backgroundColor = "#2ecc71";
    } else if (type === 'vehicle') {
      const statusInfo = VEHICLE_STATUS_DISPLAY[value?.toLowerCase()] || { color: '#95a5a6' };
      backgroundColor = statusInfo.color;
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

  const formatDateTime = (date) => {
    try {
      if (!date || isNaN(date.getTime())) {
        return "Invalid Date";
      }
      return date.toLocaleString();
    } catch {
      return "Invalid Date";
    }
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <button
          style={closeButtonStyle}
          onClick={onClose}
          onMouseEnter={(e) => {
            e.target.style.background = "#f0f0f0";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "none";
          }}
        >
          ×
        </button>
        
        <h2 style={headerStyle}>Issue Report Details</h2>
        
        <div style={sectionStyle}>
          <span style={labelStyle}>Vehicle Information</span>
          <div style={valueStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span>Brand: <strong>{report.brand}</strong></span>
              <span>Model: <strong>{report.model}</strong></span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Plate Number: <strong>{report.plate_number}</strong></span>
            </div>
          </div>
        </div>

        <div style={sectionStyle}>
          <span style={labelStyle}>Status Information</span>
          <div style={valueStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span>Vehicle Status: <span style={badgeStyle('vehicle', report.vehicle_status)}>
                {VEHICLE_STATUS_DISPLAY[report.vehicle_status?.toLowerCase()]?.text || report.vehicle_status || 'Unknown'}
              </span></span>
              <span>Workflow Status: <span style={badgeStyle('workflow', report.status)}>{report.status}</span></span>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <span>Severity: <span style={badgeStyle('severity', report.severity)}>{report.severity}</span></span>
            </div>
          </div>
        </div>

        <div style={sectionStyle}>
          <span style={labelStyle}>Report Information</span>
          <div style={valueStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span>Reported by: <strong>{report.reported_by_name}</strong></span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span>Reported Date: <strong>{formatDateTime(report.reported_date)}</strong></span>
            </div>
            {report.last_updated_by && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span>Last Updated by: <strong>{report.last_updated_by}</strong></span>
                {report.last_update_time && (
                  <span>at <strong>{formatDateTime(report.last_update_time)}</strong></span>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={sectionStyle}>
          <span style={labelStyle}>Issue Categories</span>
          <div style={valueStyle}>
            {report.issue_categories && report.issue_categories.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {report.issue_categories.map((category, index) => (
                  <span
                    key={index}
                    style={{
                      padding: "4px 10px",
                      background: "#e3f2fd",
                      color: "#1976d2",
                      borderRadius: "12px",
                      fontSize: "0.85rem",
                      fontWeight: "500",
                    }}
                  >
                    {category}
                  </span>
                ))}
              </div>
            ) : (
              <span style={{ color: "#888", fontStyle: "italic" }}>No categories specified</span>
            )}
          </div>
        </div>

        {report.custom_issue && (
          <div style={sectionStyle}>
            <span style={labelStyle}>Custom Issue</span>
            <div style={valueStyle}>
              {report.custom_issue}
            </div>
          </div>
        )}

        <div style={sectionStyle}>
          <span style={labelStyle}>Issue Description</span>
          <div style={{
            ...valueStyle,
            minHeight: "100px",
            whiteSpace: "pre-wrap",
            lineHeight: "1.5",
          }}>
            {report.issue_description || "No description provided"}
          </div>
        </div>
      </div>
    </div>
  );
}