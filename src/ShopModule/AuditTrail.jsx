// components/AuditTrail.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../security/AuthContext";

export default function AuditTrail({ isOpen, onClose }) {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    action_type: "",
    start_date: "",
    end_date: ""
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const [statistics, setStatistics] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadAuditTrail();
    }
  }, [isOpen, filters, pagination.page]);

  const loadAuditTrail = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append("page", pagination.page);
      params.append("limit", pagination.limit);
      
      if (filters.action_type) params.append("action_type", filters.action_type);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);

      const endpoint = `/.netlify/functions/getInventoryAuditTrail?${params.toString()}`;
      const res = await fetch(endpoint);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to load audit trail: HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        setAuditLogs(data.data.logs);
        setPagination(prev => ({
          ...prev,
          total: data.data.pagination.total,
          pages: data.data.pagination.pages
        }));
        if (data.data.statistics) {
          setStatistics(data.data.statistics);
        }
      } else {
        throw new Error(data.error || 'Failed to load audit trail');
      }
    } catch (err) {
      console.error("Error loading audit trail:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return num.toLocaleString();
  };

  const getActionBadgeStyle = (actionType) => {
    const styles = {
      'RESTOCK': { bg: '#d4edda', color: '#155724' },
      'CONSUME': { bg: '#f8d7da', color: '#721c24' },
      'ADJUSTMENT': { bg: '#fff3cd', color: '#856404' }
    };
    const style = styles[actionType] || { bg: '#e2e3e5', color: '#383d41' };
    return {
      padding: "4px 10px",
      borderRadius: "4px",
      background: style.bg,
      color: style.color,
      fontSize: "0.8rem",
      fontWeight: 600,
      display: "inline-block"
    };
  };

  if (!isOpen) return null;

  const containerStyle = {
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
    padding: "24px",
    width: "95%",
    maxWidth: "1400px",
    maxHeight: "95vh",
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

  const filterContainerStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "20px",
    padding: "16px",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
  };

  const filterGroupStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    minWidth: "150px",
  };

  const filterLabelStyle = {
    fontSize: "0.8rem",
    fontWeight: 500,
    color: "#495057",
  };

  const inputStyle = {
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid #ced4da",
    fontSize: "0.85rem",
    background: "#fff",
    width: "100%",
  };

  const selectStyle = {
    ...inputStyle,
    cursor: "pointer",
  };

  const buttonStyle = {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "1px solid #0e2a47",
    background: "#0e2a47",
    color: "white",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 500,
  };

  const statsContainerStyle = {
    display: "flex",
    gap: "16px",
    marginBottom: "20px",
    flexWrap: "wrap",
  };

  const statCardStyle = {
    flex: "1",
    minWidth: "150px",
    padding: "12px 16px",
    borderRadius: "8px",
    background: "#f8f9fa",
    border: "1px solid #e9ecef",
  };

  const statLabelStyle = {
    fontSize: "0.8rem",
    color: "#6c757d",
    marginBottom: "4px",
  };

  const statValueStyle = {
    fontSize: "1.2rem",
    fontWeight: 600,
    color: "#0e2a47",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.85rem",
  };

  const tableHeaderStyle = {
    background: "#f0f0f0",
    padding: "10px 8px",
    textAlign: "left",
    fontWeight: 600,
    borderBottom: "1px solid #ddd",
    whiteSpace: "nowrap",
  };

  const tableCellStyle = {
    padding: "10px 8px",
    borderBottom: "1px solid #eee",
    verticalAlign: "top",
  };

  const paginationStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "20px",
    paddingTop: "16px",
    borderTop: "1px solid #eee",
  };

  const pageButtonStyle = {
    padding: "6px 12px",
    borderRadius: "4px",
    border: "1px solid #ced4da",
    background: "#fff",
    cursor: "pointer",
    fontSize: "0.85rem",
    margin: "0 2px",
  };

  const activePageButtonStyle = {
    ...pageButtonStyle,
    background: "#0e2a47",
    color: "white",
    borderColor: "#0e2a47",
  };

  const detailPanelStyle = {
    position: "fixed",
    top: 0,
    right: selectedLog ? 0 : "-500px",
    width: "450px",
    height: "100%",
    background: "#fff",
    boxShadow: "-4px 0 20px rgba(0,0,0,0.2)",
    transition: "right 0.3s ease",
    overflowY: "auto",
    zIndex: 1001,
    padding: "24px",
  };

  return (
    <div style={containerStyle} onClick={onClose}>
      <div style={contentStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Inventory Audit Trail</h2>
          <button style={closeButtonStyle} onClick={onClose}>×</button>
        </div>

        {/* Filters */}
        <div style={filterContainerStyle}>
          <div style={filterGroupStyle}>
            <label style={filterLabelStyle}>Action Type</label>
            <select
              value={filters.action_type}
              onChange={(e) => handleFilterChange("action_type", e.target.value)}
              style={selectStyle}
            >
              <option value="">All Actions</option>
              <option value="RESTOCK">Restock</option>
              <option value="CONSUME">Consume</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </select>
          </div>
          <div style={filterGroupStyle}>
            <label style={filterLabelStyle}>Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange("start_date", e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={filterGroupStyle}>
            <label style={filterLabelStyle}>End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange("end_date", e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ ...filterGroupStyle, justifyContent: "flex-end" }}>
            <label style={filterLabelStyle}>&nbsp;</label>
            <button onClick={loadAuditTrail} style={buttonStyle}>
              Apply Filters
            </button>
          </div>
        </div>

        {/* Statistics */}
        {statistics.length > 0 && (
          <div style={statsContainerStyle}>
            {statistics.map((stat, index) => (
              <div key={index} style={statCardStyle}>
                <div style={statLabelStyle}>{stat.action_type}</div>
                <div style={statValueStyle}>
                  {formatNumber(stat.count)} transactions
                  {stat.total_quantity && ` (${formatNumber(stat.total_quantity)} units)`}
                </div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            Loading audit trail...
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#dc3545" }}>
            Error: {error}
            <button onClick={loadAuditTrail} style={{ ...buttonStyle, marginLeft: "10px" }}>
              Retry
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "8px", fontSize: "0.9rem", color: "#666" }}>
              Showing {auditLogs.length} of {pagination.total} records
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Date/Time</th>
                    <th style={tableHeaderStyle}>Transaction ID</th>
                    <th style={tableHeaderStyle}>Part Name</th>
                    <th style={tableHeaderStyle}>Action</th>
                    <th style={tableHeaderStyle}>Quantity</th>
                    <th style={tableHeaderStyle}>Previous → New</th>
                    <th style={tableHeaderStyle}>User</th>
                    <th style={tableHeaderStyle}>Vehicle</th>
                    <th style={tableHeaderStyle}>Reason</th>
                    <th style={tableHeaderStyle}>Reference Doc</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ ...tableCellStyle, textAlign: "center", padding: "40px" }}>
                        No audit trail records found
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr 
                        key={log.log_id} 
                        style={{ cursor: "pointer", background: selectedLog?.log_id === log.log_id ? "#f8f9fa" : "transparent" }}
                        onClick={() => setSelectedLog(log)}
                      >
                        <td style={tableCellStyle}>{formatDate(log.logged_at)}</td>
                        <td style={tableCellStyle}>
                          <span style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                            {log.transaction_id || `LOG-${log.log_id}`}
                          </span>
                        </td>
                        <td style={tableCellStyle}>
                          <div>{log.part_name}</div>
                          <div style={{ fontSize: "0.75rem", color: "#666" }}>{log.part_category}</div>
                        </td>
                        <td style={tableCellStyle}>
                          <span style={getActionBadgeStyle(log.action_type)}>
                            {log.action_type}
                          </span>
                        </td>
                        <td style={tableCellStyle}>
                          <span style={{ 
                            color: log.quantity_change >= 0 ? "#28a745" : "#dc3545",
                            fontWeight: 600 
                          }}>
                            {log.quantity_change >= 0 ? "+" : ""}{log.quantity_change} {log.measurement}
                          </span>
                        </td>
                        <td style={tableCellStyle}>
                          {log.previous_quantity} → {log.new_quantity}
                        </td>
                        <td style={tableCellStyle}>
                          <div>{log.user_name}</div>
                          {log.approval_authority_name && (
                            <div style={{ fontSize: "0.75rem", color: "#666" }}>
                              Approved by: {log.approval_authority_name}
                            </div>
                          )}
                        </td>
                        <td style={tableCellStyle}>
                          {log.vehicle_plate ? (
                            <div>
                              <div>{log.vehicle_plate}</div>
                              <div style={{ fontSize: "0.75rem", color: "#666" }}>
                                {log.vehicle_brand} {log.vehicle_model}
                              </div>
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td style={{ ...tableCellStyle, maxWidth: "150px" }}>
                          {log.reason ? (
                            <span style={{ 
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden"
                            }}>
                              {log.reason}
                            </span>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td style={tableCellStyle}>
                          {log.reference_document || "N/A"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={paginationStyle}>
                <div style={{ fontSize: "0.85rem", color: "#666" }}>
                  Page {pagination.page} of {pagination.pages}
                </div>
                <div>
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1}
                    style={pagination.page === 1 ? { ...pageButtonStyle, opacity: 0.5 } : pageButtonStyle}
                  >
                    First
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    style={pagination.page === 1 ? { ...pageButtonStyle, opacity: 0.5 } : pageButtonStyle}
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    style={pagination.page === pagination.pages ? { ...pageButtonStyle, opacity: 0.5 } : pageButtonStyle}
                  >
                    Next
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.pages)}
                    disabled={pagination.page === pagination.pages}
                    style={pagination.page === pagination.pages ? { ...pageButtonStyle, opacity: 0.5 } : pageButtonStyle}
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Panel */}
      <div style={detailPanelStyle}>
        {selectedLog && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#0e2a47" }}>Transaction Details</h3>
              <button 
                onClick={() => setSelectedLog(null)}
                style={{ ...closeButtonStyle, fontSize: "1.2rem" }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "4px" }}>Transaction ID</div>
              <div style={{ fontFamily: "monospace", fontSize: "0.9rem" }}>
                {selectedLog.transaction_id || `LOG-${selectedLog.log_id}`}
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "4px" }}>Date & Time</div>
              <div>{formatDate(selectedLog.logged_at)}</div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "4px" }}>Action Type</div>
              <span style={getActionBadgeStyle(selectedLog.action_type)}>
                {selectedLog.action_type}
              </span>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "4px" }}>Item</div>
              <div style={{ fontWeight: 500 }}>{selectedLog.part_name}</div>
              <div style={{ fontSize: "0.85rem", color: "#666" }}>{selectedLog.part_category}</div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "4px" }}>Quantity Change</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 600, color: selectedLog.quantity_change >= 0 ? "#28a745" : "#dc3545" }}>
                {selectedLog.quantity_change >= 0 ? "+" : ""}{selectedLog.quantity_change} {selectedLog.measurement}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#666" }}>
                {selectedLog.previous_quantity} → {selectedLog.new_quantity}
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "4px" }}>Performed By</div>
              <div>{selectedLog.user_name}</div>
              {selectedLog.approval_authority_name && (
                <div style={{ fontSize: "0.85rem", color: "#666" }}>
                  Approved by: {selectedLog.approval_authority_name}
                </div>
              )}
            </div>

            {selectedLog.vehicle_id && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "4px" }}>Vehicle</div>
                <div>{selectedLog.vehicle_plate}</div>
                <div style={{ fontSize: "0.85rem", color: "#666" }}>
                  {selectedLog.vehicle_brand} {selectedLog.vehicle_model}
                </div>
              </div>
            )}

            {selectedLog.maintenance_type && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "4px" }}>Maintenance Type</div>
                <div>{selectedLog.maintenance_type}</div>
              </div>
            )}

            {selectedLog.reason && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "4px" }}>Reason</div>
                <div style={{ 
                  padding: "12px", 
                  background: "#f8f9fa", 
                  borderRadius: "6px",
                  fontSize: "0.9rem" 
                }}>
                  {selectedLog.reason}
                </div>
              </div>
            )}

            {selectedLog.reference_document && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "4px" }}>Reference Document</div>
                <div>{selectedLog.reference_document}</div>
              </div>
            )}

            {selectedLog.is_adjusted && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ 
                  padding: "12px", 
                  background: "#fff3cd", 
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  color: "#856404"
                }}>
                  This transaction was adjusted by {selectedLog.adjusted_by_name} on {formatDate(selectedLog.adjusted_at)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
