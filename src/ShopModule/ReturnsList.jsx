import React, { useState, useEffect } from "react";
import { useAuth } from "../security/AuthContext";

export default function ReturnsList({ isOpen, onClose }) {
  const { user } = useAuth();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("PENDING");

  useEffect(() => {
    if (isOpen) {
      loadReturns();
    }
  }, [isOpen, filter]);

  const loadReturns = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const statusParam = filter === "ALL" ? "" : `status=${filter}`;
      const endpoint = `/.netlify/functions/getInventoryReturns${statusParam ? '?' + statusParam : ''}`;
      const res = await fetch(endpoint);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to load returns: HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success && data.data) {
        setReturns(data.data);
      } else {
        setReturns([]);
      }
      
    } catch (err) {
      console.error("Error loading returns:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (returnId) => {
    if (!confirm("Are you sure you want to approve this return? This will add the items to inventory.")) {
      return;
    }

    try {
      const endpoint = `/.netlify/functions/updateInventoryReturnStatus`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          return_id: returnId,
          status: 'APPROVED',
          approval_authority_id: user?.user_id || user?.user_ID || 1
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert(data.message);
        loadReturns();
      } else {
        throw new Error(data.error || 'Failed to approve return');
      }
    } catch (err) {
      console.error("Error approving return:", err);
      alert(`Failed to approve return: ${err.message}`);
    }
  };

  const handleReject = async (returnId) => {
    const reason = prompt("Please enter a reason for rejecting this return:");
    if (!reason) return;

    try {
      const endpoint = `/.netlify/functions/updateInventoryReturnStatus`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          return_id: returnId,
          status: 'REJECTED',
          approval_authority_id: user?.user_id || user?.user_ID || 1,
          rejection_reason: reason
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert(data.message);
        loadReturns();
      } else {
        throw new Error(data.error || 'Failed to reject return');
      }
    } catch (err) {
      console.error("Error rejecting return:", err);
      alert(`Failed to reject return: ${err.message}`);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'PENDING': { bg: '#fff3cd', color: '#856404', border: '#ffc107' },
      'APPROVED': { bg: '#d4edda', color: '#155724', border: '#28a745' },
      'COMPLETED': { bg: '#cce5ff', color: '#004085', border: '#007bff' },
      'REJECTED': { bg: '#f8d7da', color: '#721c24', border: '#dc3545' },
      'CANCELLED': { bg: '#e2e3e5', color: '#383d41', border: '#6c757d' }
    };
    
    const style = statusColors[status] || statusColors['PENDING'];
    
    return {
      padding: "4px 10px",
      borderRadius: "12px",
      fontSize: "0.75rem",
      fontWeight: 600,
      background: style.bg,
      color: style.color,
      border: `1px solid ${style.border}`,
      display: "inline-block"
    };
  };

  if (!isOpen) return null;

  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  };

  const modalStyle = {
    background: "#fff",
    borderRadius: "12px",
    padding: "24px",
    width: "100%",
    maxWidth: "900px",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    paddingBottom: "16px",
    borderBottom: "1px solid #e9ecef",
  };

  const titleStyle = {
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#0e2a47",
    margin: 0,
  };

  const closeButtonStyle = {
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    color: "#6c757d",
    cursor: "pointer",
    padding: "0",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
  };

  const filterContainerStyle = {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    flexWrap: "wrap",
  };

  const filterButtonStyle = (isActive) => ({
    padding: "8px 16px",
    borderRadius: "6px",
    border: isActive ? "1px solid #0e2a47" : "1px solid #ced4da",
    background: isActive ? "#0e2a47" : "#fff",
    color: isActive ? "#fff" : "#495057",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 500,
  });

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.9rem",
  };

  const thStyle = {
    background: "#f8f9fa",
    color: "#495057",
    fontWeight: 600,
    padding: "12px",
    textAlign: "left",
    borderBottom: "2px solid #dee2e6",
  };

  const tdStyle = {
    padding: "12px",
    borderBottom: "1px solid #dee2e6",
    verticalAlign: "top",
  };

  const actionButtonStyle = {
    padding: "6px 12px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: 500,
    marginRight: "8px",
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Inventory Returns</h2>
          <button onClick={onClose} style={closeButtonStyle} aria-label="Close">
            ×
          </button>
        </div>

        <div style={filterContainerStyle}>
          <button
            onClick={() => setFilter("PENDING")}
            style={filterButtonStyle(filter === "PENDING")}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("APPROVED")}
            style={filterButtonStyle(filter === "APPROVED")}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter("COMPLETED")}
            style={filterButtonStyle(filter === "COMPLETED")}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter("REJECTED")}
            style={filterButtonStyle(filter === "REJECTED")}
          >
            Rejected
          </button>
          <button
            onClick={() => setFilter("ALL")}
            style={filterButtonStyle(filter === "ALL")}
          >
            All
          </button>
          <button
            onClick={loadReturns}
            style={{
              ...filterButtonStyle(false),
              marginLeft: "auto"
            }}
          >
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#6c757d" }}>
            Loading returns...
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#dc3545" }}>
            Error: {error}
          </div>
        ) : returns.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#6c757d" }}>
            No returns found with status "{filter === 'ALL' ? 'any' : filter}"
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Part Name</th>
                  <th style={thStyle}>Quantity</th>
                  <th style={thStyle}>Reason</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Due Date</th>
                  <th style={thStyle}>Created</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((ret) => (
                  <tr key={ret.return_id}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500 }}>{ret.part_name}</div>
                      <div style={{ fontSize: "0.8rem", color: "#6c757d" }}>
                        {ret.part_category}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{ret.quantity}</div>
                      <div style={{ fontSize: "0.8rem", color: "#6c757d" }}>
                        {ret.measurement}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ maxWidth: "200px", wordWrap: "break-word" }}>
                        {ret.return_reason}
                      </div>
                      {ret.reference_document && (
                        <div style={{ fontSize: "0.75rem", color: "#6c757d", marginTop: "4px" }}>
                          Ref: {ret.reference_document}
                        </div>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span style={getStatusBadge(ret.return_status)}>
                        {ret.return_status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {ret.due_date 
                        ? new Date(ret.due_date).toLocaleDateString()
                        : <span style={{ color: "#6c757d" }}>—</span>
                      }
                    </td>
                    <td style={tdStyle}>
                      {new Date(ret.created_at).toLocaleDateString()}
                    </td>
                    <td style={tdStyle}>
                      {ret.return_status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(ret.return_id)}
                            style={{
                              ...actionButtonStyle,
                              background: "#28a745",
                              color: "#fff",
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(ret.return_id)}
                            style={{
                              ...actionButtonStyle,
                              background: "#dc3545",
                              color: "#fff",
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {ret.return_status === 'APPROVED' && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch('/.netlify/functions/updateInventoryReturnStatus', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  return_id: ret.return_id,
                                  status: 'COMPLETED'
                                })
                              });
                              const data = await res.json();
                              if (data.success) {
                                alert(data.message);
                                loadReturns();
                              }
                            } catch (err) {
                              alert(err.message);
                            }
                          }}
                          style={{
                            ...actionButtonStyle,
                            background: "#007bff",
                            color: "#fff",
                          }}
                        >
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
