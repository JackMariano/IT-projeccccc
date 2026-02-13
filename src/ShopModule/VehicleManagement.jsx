import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../security/AuthContext";

export default function VehicleManagement() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter, sort, search, and pagination states
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Status options, expanded to include potential "Maintenance" status
  const STATUS_OPTIONS = ['Available', 'Reserved', 'In Use', 'Maintenance', 'Out of Service'];
  
  // Custom Styles
  const containerStyle = {
    background: "#fff",
    borderRadius: "1.5rem",
    boxShadow: "0 0 20px rgba(0,0,0,0.2)",
    padding: "24px",
    maxWidth: "100%",
    boxSizing: "border-box",
    margin: "0",
  };

  const headerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "24px",
    fontFamily: "Montserrat, sans-serif",
  };

  const headerTopStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  };

  const titleStyle = {
    fontSize: "1.5rem",
    fontWeight: 600,
    color: "#0e2a47",
  };

  const headerRightStyle = {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  };

  const countStyle = {
    fontSize: "0.9rem",
    color: "#666",
  };

  const refreshButtonStyle = {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #0e2a47",
    background: "#0e2a47",
    color: "white",
    cursor: "pointer",
    fontSize: "0.9rem",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    whiteSpace: "nowrap",
  };

  const filterContainerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    marginBottom: "24px",
    padding: "16px",
    backgroundColor: "#f8f9fa",
    borderRadius: "12px",
    border: "1px solid #e9ecef",
  };

  const filterRowStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    alignItems: "center",
  };

  const filterGroupStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: "160px",
  };

  const filterLabelStyle = {
    fontSize: "0.85rem",
    fontWeight: "500",
    color: "#495057",
  };

  const selectStyle = {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #ced4da",
    fontSize: "0.9rem",
    background: "#fff",
    cursor: "pointer",
    width: "100%",
    minWidth: "160px",
  };

  const searchContainerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    flex: 1,
    minWidth: "200px",
  };

  const searchInputStyle = {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #ced4da",
    fontSize: "0.9rem",
    background: "#fff",
    width: "100%",
  };

  const thStyle = {
    background: "#0e2a47",
    color: "#e6e6e6",
    fontWeight: 500,
    padding: "14px 16px",
    textAlign: "left",
    fontSize: "0.95rem",
    whiteSpace: "nowrap",
  };

  const tdStyle = {
    padding: "16px",
    textAlign: "left",
    whiteSpace: "normal",
    wordWrap: "break-word",
    borderBottom: "1px solid #e9ecef",
    fontSize: "0.9rem",
    verticalAlign: "top",
  };

  const statusBadgeStyle = (status) => {
    let color = '#95a5a6'; // Default
    switch (status) {
      case 'Available':
        color = '#2ecc71';
        break;
      case 'Reserved':
        color = '#f39c12';
        break;
      case 'In Use':
        color = '#e74c3c';
        break;
      case 'Maintenance':
        color = '#3498db';
        break;
      case 'Out of Service':
        color = '#c0392b';
        break;
      default:
        break;
    }
    
    return {
      padding: "6px 12px",
      borderRadius: "20px",
      color: "#fff",
      fontWeight: 600,
      fontSize: "0.8rem",
      display: "inline-block",
      background: color,
      minWidth: "90px",
      textAlign: "center",
      textTransform: 'capitalize',
    };
  };

  const actionButtonStyle = {
    padding: "8px 14px",
    borderRadius: "6px",
    border: "1px solid #ced4da",
    background: "#f8f9fa",
    color: "#212529",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "500",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  };
  
  const editButtonStyle = {
    ...actionButtonStyle,
    borderColor: "#007bff",
    background: "#e9f5ff",
    color: "#007bff",
    marginRight: "8px",
  };

  const tableContainerStyle = {
    overflowX: "auto",
    marginBottom: "24px",
    border: "1px solid #e9ecef",
    borderRadius: "12px",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    fontFamily: "Arial, sans-serif",
    minWidth: "900px",
  };

  const paginationContainerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    paddingTop: "20px",
    borderTop: "1px solid #e9ecef",
  };

  const paginationInfoStyle = {
    fontSize: "0.9rem",
    color: "#6c757d",
    textAlign: "center",
  };

  const paginationControlsStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  };

  const pageButtonStyle = {
    padding: "8px 14px",
    borderRadius: "6px",
    border: "1px solid #dee2e6",
    background: "#fff",
    color: "#0e2a47",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "500",
    minWidth: "40px",
    textAlign: "center",
    transition: "all 0.2s",
  };

  const activePageButtonStyle = {
    ...pageButtonStyle,
    background: "#0e2a47",
    color: "white",
    borderColor: "#0e2a47",
  };

  const disabledButtonStyle = {
    ...pageButtonStyle,
    opacity: 0.5,
    cursor: "not-allowed",
    background: "#e9ecef",
  };

  const ellipsisStyle = {
    padding: "8px 4px",
    color: "#6c757d",
    fontSize: "0.85rem",
  };


  useEffect(() => {
    if (!authLoading && (!user || user.role !== "Shop")) {
      navigate("/login", { replace: true });
      return;
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && user) {
      loadVehicles();
    }
  }, [authLoading, user]);

  const loadVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = `/.netlify/functions/getVehicles`;
      const res = await fetch(endpoint);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to load vehicles: HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.vehicles) {
        setVehicles(data.vehicles);
      } else {
        setVehicles([]);
        throw new Error(data.error || 'Failed to load vehicles');
      }
      
    } catch (err) {
      console.error("Error loading vehicles:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (vehicleId, newStatus) => {
    if (!window.confirm(`Are you sure you want to change the status of vehicle ${vehicleId} to "${newStatus}"?`)) {
      return;
    }
    
    try {
      const endpoint = `/.netlify/functions/updateVehicle`;
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicle_id: vehicleId,
          status: newStatus,
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update vehicle status: HTTP ${res.status}`);
      }

      const updatedVehicle = await res.json();
      
      // Update the local state with the new vehicle status
      setVehicles(prevVehicles =>
        prevVehicles.map(v => (v.vehicle_id === updatedVehicle.vehicle_id ? updatedVehicle : v))
      );
      alert(`Vehicle ${updatedVehicle.plate_number || updatedVehicle.vehicle_id} status updated to "${updatedVehicle.status}"`);

    } catch (err) {
      console.error("Error updating vehicle status:", err);
      alert(`Failed to update vehicle status: ${err.message}`);
    }
  };

  // Filter and search vehicles
  const filteredVehicles = useMemo(() => {
    let filtered = [...vehicles];
    
    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(vehicle => 
        vehicle.brand.toLowerCase().includes(query) ||
        vehicle.model.toLowerCase().includes(query) ||
        vehicle.plate_number.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter(vehicle => vehicle.status === statusFilter);
    }
    
    return filtered;
  }, [vehicles, statusFilter, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredVehicles.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

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
            Loading vehicles...
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
            Error Loading Vehicles
          </div>
          <div style={{ fontSize: "0.9rem", marginBottom: "20px" }}>
            {error}
          </div>
          <button
            onClick={loadVehicles}
            style={{
              padding: "10px 24px",
              borderRadius: "8px",
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
          <div style={headerTopStyle}>
            <h1 style={titleStyle}>Vehicle Management</h1>
            <div style={headerRightStyle}>
              <span style={countStyle}>
                Showing: {filteredVehicles.length} of {vehicles.length} vehicles
              </span>
              <button
                onClick={loadVehicles}
                style={refreshButtonStyle}
              >
                ↻ Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div style={filterContainerStyle}>
          <div style={filterRowStyle}>
            <div style={filterGroupStyle}>
              <label style={filterLabelStyle}>Status:</label>
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
            
            {/* Search Bar */}
            <div style={searchContainerStyle}>
              <label style={filterLabelStyle}>Search Vehicles:</label>
              <input
                type="text"
                placeholder="Search by brand, model, or plate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={searchInputStyle}
              />
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: "15%" }}>Plate Number</th>
                <th style={{ ...thStyle, width: "15%" }}>Brand</th>
                <th style={{ ...thStyle, width: "15%" }}>Model</th>
                <th style={{ ...thStyle, width: "10%" }}>Year</th>
                <th style={{ ...thStyle, width: "15%" }}>Status</th>
                <th style={{ ...thStyle, width: "30%" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ 
                    ...tdStyle, 
                    textAlign: "center", 
                    padding: "60px 20px",
                    color: "#6c757d",
                    fontSize: "1rem"
                  }}>
                    {vehicles.length === 0 
                      ? "No vehicles found." 
                      : searchQuery.trim() !== ""
                      ? `No vehicles found matching "${searchQuery}"`
                      : "No vehicles match the selected filters"}
                  </td>
                </tr>
              ) : (
                currentItems.map((vehicle) => (
                  <tr key={vehicle.vehicle_id}>
                    <td style={tdStyle}>
                      <div style={{ 
                        fontWeight: 600, 
                        fontSize: "1rem",
                        color: "#0e2a47",
                      }}>
                        {vehicle.plate_number}
                      </div>
                    </td>
                    <td style={tdStyle}>{vehicle.brand}</td>
                    <td style={tdStyle}>{vehicle.model}</td>
                    <td style={tdStyle}>{vehicle.year}</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", justifyContent: "flex-start" }}>
                        <span style={statusBadgeStyle(vehicle.status)}>
                          {vehicle.status}
                        </span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        {STATUS_OPTIONS.filter(s => s !== vehicle.status).map(statusOption => (
                          <button
                            key={statusOption}
                            onClick={() => handleUpdateStatus(vehicle.vehicle_id, statusOption)}
                            style={{
                              ...actionButtonStyle,
                              ...editButtonStyle, // Reuse some edit styles
                              borderColor: '#28a745', // Green for status updates
                              background: '#d4edda',
                              color: '#155724',
                            }}
                          >
                            Set {statusOption}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredVehicles.length > 0 && (
          <div style={paginationContainerStyle}>
            <div style={paginationInfoStyle}>
              Showing {Math.min(startIndex + 1, filteredVehicles.length)} to {Math.min(endIndex, filteredVehicles.length)} of {filteredVehicles.length} vehicles
            </div>
            
            {totalPages > 1 && (
              <div style={paginationControlsStyle}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={currentPage === 1 ? disabledButtonStyle : pageButtonStyle}
                  title="Previous page"
                >
                  ←
                </button>
                
                {(() => {
                  const startPage = Math.max(1, currentPage - 1);
                  const endPage = Math.min(totalPages, currentPage + 1);
                  const pagesToShow = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
                  
                  return (
                    <>
                      {startPage > 1 && (
                        <>
                          <button
                            onClick={() => handlePageChange(1)}
                            style={pageButtonStyle}
                          >
                            1
                          </button>
                          {startPage > 2 && (
                            <span style={ellipsisStyle}>...</span>
                          )}
                        </>
                      )}
                      
                      {pagesToShow.map(pageNum => (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          style={currentPage === pageNum ? activePageButtonStyle : pageButtonStyle}
                        >
                          {pageNum}
                        </button>
                      ))}
                      
                      {endPage < totalPages && (
                        <>
                          {endPage < totalPages - 1 && (
                            <span style={ellipsisStyle}>...</span>
                          )}
                          <button
                            onClick={() => handlePageChange(totalPages)}
                            style={pageButtonStyle}
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </>
                  );
                })()}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={currentPage === totalPages ? disabledButtonStyle : pageButtonStyle}
                  title="Next page"
                >
                  →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}