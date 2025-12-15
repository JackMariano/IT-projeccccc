// components/InventoryModal.jsx - FIXED VERSION
import React, { useState, useEffect } from "react";

export default function InventoryModal({ item, isOpen, onClose, maintenanceOptions }) {
  const [enhancedLogs, setEnhancedLogs] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (isOpen && item.logs && item.logs.length > 0) {
      loadEnhancedLogDetails();
    } else {
      setEnhancedLogs([]);
    }
  }, [isOpen, item]);

  const loadEnhancedLogDetails = async () => {
    setLoadingDetails(true);
    try {
      const logIds = item.logs.map(log => log.log_id);
      console.log('Loading details for log IDs:', logIds);
      
      const endpoint = `/.netlify/functions/getInventoryLogDetails`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ log_ids: logIds })
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('Backend response:', data);
        
        if (data.success && data.data) {
          console.log('Users data from backend:', data.data.users);
          console.log('Vehicles data from backend:', data.data.vehicles);
          
          // Enhance the logs with user names, vehicle info, and usage logs
          const enhanced = item.logs.map(log => {
            const user = data.data.users?.find(u => u.user_id === log.user_id);
            const vehicle = data.data.vehicles?.find(v => v.vehicle_id === log.vehicle_id);
            const usageLog = data.data.usage_logs?.find(ul => ul.usage_id === log.usage_id);
            
            console.log(`For log ${log.log_id} (user_id: ${log.user_id}):`, {
              userFound: !!user,
              userData: user,
              userFullName: user?.full_name,
              userFirstname: user?.firstname,
              userLastname: user?.lastname,
              username: user?.username
            });

            // Build user display name with priority:
            // 1. full_name from backend
            // 2. firstname + lastname if available
            // 3. username
            // 4. fallback to User {id}
            let userDisplayName;
            if (user?.full_name) {
              userDisplayName = user.full_name;
            } else if (user?.firstname && user?.lastname) {
              userDisplayName = `${user.firstname} ${user.lastname}`;
            } else if (user?.username) {
              userDisplayName = user.username;
            } else {
              userDisplayName = `User ${log.user_id}`;
            }

            // Build vehicle display info
            let vehicleDisplayInfo = null;
            if (vehicle) {
              const parts = [];
              if (vehicle.plate_number) parts.push(vehicle.plate_number);
              if (vehicle.brand) parts.push(vehicle.brand);
              if (vehicle.model) parts.push(vehicle.model);
              if (vehicle.year) parts.push(`(${vehicle.year})`);
              vehicleDisplayInfo = parts.join(' ');
            }

            return {
              ...log,
              user_name: userDisplayName,
              user_info: user || { user_id: log.user_id },
              vehicle_info: vehicleDisplayInfo,
              vehicle_data: vehicle || null,
              usage_info: usageLog || null
            };
          });
          
          console.log('Enhanced logs:', enhanced);
          setEnhancedLogs(enhanced);
        } else {
          console.error('Backend returned unsuccessful:', data);
          setEnhancedLogs(item.logs.map(log => ({
            ...log,
            user_name: `User ${log.user_id}`,
            vehicle_info: log.vehicle_id ? `Vehicle #${log.vehicle_id}` : null
          })));
        }
      } else {
        console.error('Failed to fetch log details:', res.status, res.statusText);
        setEnhancedLogs(item.logs.map(log => ({
          ...log,
          user_name: `User ${log.user_id}`,
          vehicle_info: log.vehicle_id ? `Vehicle #${log.vehicle_id}` : null
        })));
      }
    } catch (error) {
      console.error("Error loading log details:", error);
      // Fallback to basic logs if enhanced loading fails
      setEnhancedLogs(item.logs.map(log => ({
        ...log,
        user_name: `User ${log.user_id}`,
        vehicle_info: log.vehicle_id ? `Vehicle #${log.vehicle_id}` : null
      })));
    } finally {
      setLoadingDetails(false);
    }
  };

  if (!isOpen) return null;

  const modalStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  };

  const contentStyle = {
    background: "#fff",
    borderRadius: "1rem",
    padding: "32px",
    width: "90%",
    maxWidth: "900px",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 0 30px rgba(0,0,0,0.3)",
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "1px solid #eee",
  };

  const titleStyle = {
    fontSize: "1.5rem",
    fontWeight: 600,
    color: "#0e2a47",
    fontFamily: "Montserrat, sans-serif",
  };

  const closeButtonStyle = {
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    color: "#666",
    padding: "0",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
  };

  const sectionStyle = {
    marginBottom: "24px",
  };

  const labelStyle = {
    display: "block",
    fontSize: "0.9rem",
    fontWeight: 500,
    color: "#666",
    marginBottom: "8px",
  };

  const valueStyle = {
    background: "#f9f9f9",
    padding: "12px",
    borderRadius: "6px",
    fontSize: "1rem",
    marginBottom: "16px",
  };

  const buttonStyle = {
    padding: "10px 24px",
    borderRadius: "6px",
    border: "1px solid #0e2a47",
    background: "#0e2a47",
    color: "white",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: 500,
    transition: "all 0.2s",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "16px",
  };

  const tableHeaderStyle = {
    background: "#f0f0f0",
    padding: "10px",
    textAlign: "left",
    fontWeight: 500,
    borderBottom: "1px solid #ddd",
  };

  const tableCellStyle = {
    padding: "10px",
    borderBottom: "1px solid #eee",
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return num.toLocaleString();
  };

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={contentStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>{item.part_name} - Usage Logs</h2>
          <button style={closeButtonStyle} onClick={onClose}>×</button>
        </div>

        {/* Part Information - Simplified */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Part Information</span>
          <div style={valueStyle}>
            <div style={{ marginBottom: "8px" }}>
              <strong>Category:</strong> {item.part_category}
            </div>
            <div style={{ marginBottom: "8px" }}>
              <strong>Current Stock:</strong> {item.current_quantity} {item.measurement.toLowerCase()}
            </div>
            {item.part_description && (
              <div style={{ marginBottom: "8px" }}>
                <strong>Description:</strong> {item.part_description}
              </div>
            )}
          </div>
        </div>

        {/* Usage Logs */}
        <div style={sectionStyle}>
          <span style={labelStyle}>
            Recent Activity Logs 
            {loadingDetails && <span style={{ marginLeft: "10px", fontSize: "0.8rem", color: "#666" }}>Loading details...</span>}
          </span>
          {enhancedLogs.length > 0 ? (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Date & Time</th>
                  <th style={tableHeaderStyle}>Action</th>
                  <th style={tableHeaderStyle}>Quantity</th>
                  <th style={tableHeaderStyle}>Vehicle</th>
                  <th style={tableHeaderStyle}>Maintenance</th>
                  <th style={tableHeaderStyle}>User</th>
                </tr>
              </thead>
              <tbody>
                {enhancedLogs.slice(0, 10).map((log) => (
                  <tr key={log.log_id}>
                    <td style={tableCellStyle}>{formatDate(log.logged_at)}</td>
                    <td style={tableCellStyle}>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        background: log.action_type === 'RESTOCK' ? '#d4edda' : '#f8d7da',
                        color: log.action_type === 'RESTOCK' ? '#155724' : '#721c24',
                        fontSize: "0.8rem",
                        fontWeight: 500,
                      }}>
                        {log.action_type}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      <span style={{
                        color: log.action_type === 'RESTOCK' ? '#2ecc71' : '#e74c3c',
                        fontWeight: 600,
                      }}>
                        {log.action_type === 'RESTOCK' ? '+' : '-'}{Math.abs(log.quantity_change)} {item.measurement.toLowerCase()}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      {log.vehicle_info || 'N/A'}
                      {log.usage_info && (
                        <div style={{ fontSize: "0.75rem", color: "#666", marginTop: "4px" }}>
                          Odometer: {formatNumber(log.usage_info.current_odometer)} km
                          {log.usage_info.mileage > 0 && ` | Mileage: ${formatNumber(log.usage_info.mileage)} km`}
                        </div>
                      )}
                    </td>
                    <td style={tableCellStyle}>
                      {log.maintenance_type || 'N/A'}
                    </td>
                    <td style={tableCellStyle}>
                      {log.user_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : item.logs && item.logs.length > 0 ? (
            <div style={valueStyle}>
              Loading logs...
            </div>
          ) : (
            <div style={valueStyle}>
              No activity logs found for this item.
            </div>
          )}
          
          {/* Detailed Usage Logs for Maintenance */}
          {enhancedLogs.some(log => log.usage_info) && (
            <div style={{ marginTop: "24px" }}>
              <span style={labelStyle}>Vehicle Maintenance Details</span>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Vehicle</th>
                    <th style={tableHeaderStyle}>Date</th>
                    <th style={tableHeaderStyle}>Odometer</th>
                    <th style={tableHeaderStyle}>Mileage</th>
                    <th style={tableHeaderStyle}>Fuel Level</th>
                    <th style={tableHeaderStyle}>Fuel Added</th>
                  </tr>
                </thead>
                <tbody>
                  {enhancedLogs
                    .filter(log => log.usage_info)
                    .slice(0, 5)
                    .map((log) => (
                      <tr key={log.usage_info.usage_id}>
                        <td style={tableCellStyle}>
                          {log.usage_info.plate_number} - {log.usage_info.brand} {log.usage_info.model}
                        </td>
                        <td style={tableCellStyle}>
                          {formatDate(log.usage_info.timestamp)}
                        </td>
                        <td style={tableCellStyle}>
                          {formatNumber(log.usage_info.previous_odometer)} → {formatNumber(log.usage_info.current_odometer)} km
                        </td>
                        <td style={tableCellStyle}>
                          {formatNumber(log.usage_info.mileage)} km
                        </td>
                        <td style={tableCellStyle}>
                          {formatNumber(log.usage_info.previous_fuel)} → {formatNumber(log.usage_info.current_fuel)} L
                        </td>
                        <td style={tableCellStyle}>
                          {formatNumber(log.usage_info.fuel_added)} L
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ textAlign: "right", marginTop: "24px" }}>
          <button
            onClick={onClose}
            style={{
              ...buttonStyle,
              background: "transparent",
              color: "#0e2a47",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}