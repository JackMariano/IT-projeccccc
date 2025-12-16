// components/Inventory.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../security/AuthContext";
import InventoryModal from "./InventoryModal";
import UseInventoryModal from "./UseInventoryModal";
import AddInventoryModal from "./AddInventoryModal";
import AddStockModal from "./AddStockModal";

export default function Inventory() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Use modal state
  const [useModalOpen, setUseModalOpen] = useState(false);
  const [selectedItemForUse, setSelectedItemForUse] = useState(null);
  
  // Add modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  
  // Add stock modal state
  const [addStockModalOpen, setAddStockModalOpen] = useState(false);
  const [selectedItemForStock, setSelectedItemForStock] = useState(null);
  
  // Hover state for View Logs button
  const [hoveredItemId, setHoveredItemId] = useState(null);
  
  // Filter, sort, search, and pagination states
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");
  const [sortBy, setSortBy] = useState("quantity");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Category options
  const CATEGORY_OPTIONS = ['Fuel', 'Tires', 'Engine', 'Brakes', 'Electrical', 'Fluids', 'Filters', 'Suspension', 'Other'];

  // Measurement options
  const MEASUREMENT_OPTIONS = ['Pieces', 'Liters', 'Gallons', 'Cans', 'Bottles', 'Boxes', 'Sets', 'Pairs', 'Rolls'];

  // Stock status display mapping
  const STOCK_STATUS_DISPLAY = {
    'ok': { text: 'In Stock', color: '#2ecc71' },
    'low': { text: 'Low Stock', color: '#f39c12' },
    'very_low': { text: 'Very Low', color: '#e74c3c' },
    'out': { text: 'Out of Stock', color: '#95a5a6' }
  };

  // Maintenance type options
  const MAINTENANCE_OPTIONS = ['Oil Change', 'Brake Service', 'Tire Replacement', 'Air Filter Change', 'Spark Plug Replacement', 'Battery Replacement', 'Suspension Repair', 'Other'];

  // Helper function to determine stock status
  const getStockStatus = (quantity) => {
    const qty = Math.round(quantity);
    if (qty <= 0) {
      return 'out';
    } else if (qty <= 10) {
      return 'very_low';
    } else if (qty <= 25) {
      return 'low';
    } else {
      return 'ok';
    }
  };

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "Shop")) {
      navigate("/login", { replace: true });
      return;
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && user) {
      loadInventory();
      loadLogs();
    }
  }, [authLoading, user]);

  const loadInventory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const endpoint = `/.netlify/functions/getInventory`;
      const res = await fetch(endpoint);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to load inventory: HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success && data.data) {
        setInventory(data.data);
      } else {
        setInventory([]);
        throw new Error(data.error || 'Failed to load inventory');
      }
      
    } catch (err) {
      console.error("Error loading inventory:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const endpoint = `/.netlify/functions/getInventoryLogs`;
      const res = await fetch(endpoint);
      
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setLogs(data.data);
        }
      }
    } catch (err) {
      console.error("Error loading logs:", err);
    }
  };

  const handleRestock = async (partId, quantity, measurement) => {
    const qty = parseInt(quantity);
    if (!quantity || isNaN(qty) || qty <= 0) {
      alert(`Please enter a valid whole number quantity in ${measurement.toLowerCase()}`);
      return;
    }

    try {
      const endpoint = `/.netlify/functions/restockInventory`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          part_id: partId,
          quantity: qty,
          user_id: user?.user_id || user?.user_ID || 1
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        await loadInventory();
        await loadLogs();
        alert(`Successfully restocked ${qty} ${measurement.toLowerCase()} of ${data.data.part_name}`);
      } else {
        throw new Error(data.error || 'Failed to restock');
      }
    } catch (err) {
      console.error("Error restocking:", err);
      alert(`Failed to restock: ${err.message}`);
    }
  };

  const handleConsume = async (
    partId, 
    quantity, 
    measurement, 
    vehicleId, 
    maintenanceType, 
    currentOdometer,
    currentFuel,
    fuelAdded
  ) => {
    const qty = parseInt(quantity);
    if (!quantity || isNaN(qty) || qty <= 0) {
      alert(`Please enter a valid whole number quantity in ${measurement.toLowerCase()}`);
      return;
    }

    try {
      const endpoint = `/.netlify/functions/consumeInventory`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          part_id: partId,
          quantity: qty,
          user_id: user?.user_id || user?.user_ID || 1,
          vehicle_id: vehicleId || null,
          maintenance_type: maintenanceType || null,
          current_odometer: currentOdometer,
          current_fuel: currentFuel,
          fuel_added: fuelAdded
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        await loadInventory();
        await loadLogs();
        alert(`Successfully consumed ${qty} ${measurement.toLowerCase()} of ${data.data.part_name}`);
      } else {
        throw new Error(data.error || 'Failed to consume');
      }
    } catch (err) {
      console.error("Error consuming:", err);
      alert(`Failed to consume: ${err.message}`);
    }
  };

  const handleViewDetails = (item) => {
    const itemLogs = logs.filter(log => log.part_id === item.part_id);
    setSelectedItem({ ...item, logs: itemLogs });
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  // Handle opening the use modal
  const handleOpenUseModal = (item) => {
    setSelectedItemForUse(item);
    setUseModalOpen(true);
  };

  // Handle opening the add stock modal
  const handleOpenAddStockModal = (item) => {
    setSelectedItemForStock(item);
    setAddStockModalOpen(true);
  };

  // Handle confirming use from the modal
  const handleConfirmUse = async ({ 
    partId, 
    quantity, 
    measurement, 
    vehicleId, 
    maintenanceType, 
    currentOdometer,
    currentFuel,
    fuelAdded 
  }) => {
    await handleConsume(
      partId, 
      quantity, 
      measurement, 
      vehicleId, 
      maintenanceType, 
      currentOdometer,
      currentFuel,
      fuelAdded
    );
    setUseModalOpen(false);
    setSelectedItemForUse(null);
  };

  // Handle confirming add stock from the modal
  const handleConfirmAddStock = async ({ partId, quantity, measurement }) => {
    await handleRestock(partId, quantity, measurement);
    setAddStockModalOpen(false);
    setSelectedItemForStock(null);
  };

  // Handle successful addition of new inventory item
  const handleAddSuccess = () => {
    loadInventory(); // Refresh the inventory list
    setAddModalOpen(false);
  };

  // Filter, sort, and search inventory
  const filteredAndSortedInventory = useMemo(() => {
    let filtered = [...inventory];
    
    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.part_name.toLowerCase().includes(query) ||
        (item.part_description && item.part_description.toLowerCase().includes(query))
      );
    }
    
    // Apply category filter
    if (categoryFilter !== "All") {
      filtered = filtered.filter(item => item.part_category === categoryFilter);
    }
    
    // Apply stock filter
    if (stockFilter !== "All") {
      filtered = filtered.filter(item => getStockStatus(item.current_quantity) === stockFilter);
    }
    
    // Apply sort
    filtered.sort((a, b) => {
      if (sortBy === "quantity") {
        return a.current_quantity - b.current_quantity;
      } else if (sortBy === "name") {
        return a.part_name.localeCompare(b.part_name);
      } else if (sortBy === "category") {
        return a.part_category.localeCompare(b.part_category);
      }
      return 0;
    });
    
    return filtered;
  }, [inventory, categoryFilter, stockFilter, sortBy, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedInventory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredAndSortedInventory.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, stockFilter, sortBy, searchQuery]);

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

  const addButtonStyle = {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #28a745",
    background: "#28a745",
    color: "white",
    cursor: "pointer",
    fontSize: "0.9rem",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    whiteSpace: "nowrap",
    fontWeight: 500,
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

  const stockBadgeStyle = (quantity) => {
    const status = getStockStatus(quantity);
    const statusInfo = STOCK_STATUS_DISPLAY[status];
    
    return {
      padding: "6px 12px",
      borderRadius: "20px",
      color: "#fff",
      fontWeight: 600,
      fontSize: "0.8rem",
      display: "inline-block",
      background: statusInfo.color,
      minWidth: "90px",
      textAlign: "center",
    };
  };

  const categoryBadgeStyle = (category) => {
    const categoryColors = {
      'Fuel': '#3498db',
      'Tires': '#9b59b6',
      'Engine': '#e74c3c',
      'Brakes': '#c0392b',
      'Electrical': '#f39c12',
      'Fluids': '#2980b9',
      'Filters': '#16a085',
      'Suspension': '#8e44ad',
      'Other': '#95a5a6'
    };
    
    return {
      padding: "6px 12px",
      borderRadius: "20px",
      color: "#fff",
      fontWeight: 600,
      fontSize: "0.8rem",
      display: "inline-block",
      background: categoryColors[category] || '#95a5a6',
      textTransform: 'capitalize',
      minWidth: "80px",
      textAlign: "center",
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
            Loading inventory...
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
            Error Loading Inventory
          </div>
          <div style={{ fontSize: "0.9rem", marginBottom: "20px" }}>
            {error}
          </div>
          <button
            onClick={loadInventory}
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
            <h1 style={titleStyle}>Vehicle Parts Inventory</h1>
            <div style={headerRightStyle}>
              <span style={countStyle}>
                Showing: {filteredAndSortedInventory.length} of {inventory.length} items
              </span>
              <button
                onClick={() => setAddModalOpen(true)}
                style={addButtonStyle}
              >
                + Add New
              </button>
              <button
                onClick={() => {
                  loadInventory();
                  loadLogs();
                }}
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
              <label style={filterLabelStyle}>Category:</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={selectStyle}
              >
                <option value="All">All Categories</option>
                {CATEGORY_OPTIONS.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div style={filterGroupStyle}>
              <label style={filterLabelStyle}>Stock Status:</label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                style={selectStyle}
              >
                <option value="All">All Status</option>
                <option value="ok">In Stock</option>
                <option value="low">Low Stock</option>
                <option value="very_low">Very Low</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
            
            <div style={filterGroupStyle}>
              <label style={filterLabelStyle}>Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={selectStyle}
              >
                <option value="quantity">Quantity (Low to High)</option>
                <option value="name">Name (A-Z)</option>
                <option value="category">Category</option>
              </select>
            </div>

            {/* Search Bar */}
            <div style={searchContainerStyle}>
              <label style={filterLabelStyle}>Search Parts:</label>
              <input
                type="text"
                placeholder="Search by part name or description..."
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
                <th style={{ ...thStyle, width: "25%" }}>Part Name</th>
                <th style={{ ...thStyle, width: "15%" }}>Category</th>
                <th style={{ ...thStyle, width: "15%" }}>Current Stock</th>
                <th style={{ ...thStyle, width: "15%" }}>Stock Status</th>
                <th style={{ ...thStyle, width: "20%" }}>Actions</th>
                <th style={{ ...thStyle, width: "10%" }}>Details</th>
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
                    {inventory.length === 0 
                      ? "No inventory items found. Add some parts to get started." 
                      : searchQuery.trim() !== ""
                      ? `No parts found matching "${searchQuery}"`
                      : "No items match the selected filters"}
                  </td>
                </tr>
              ) : (
                currentItems.map((item) => (
                  <tr key={item.part_id}>
                    <td style={tdStyle}>
                      <div style={{ 
                        fontWeight: 500, 
                        fontSize: "0.95rem",
                        marginBottom: "4px",
                        color: "#212529",
                      }}>
                        {item.part_name}
                      </div>
                      {item.part_description && (
                        <div style={{ 
                          fontSize: "0.8rem",
                          color: "#6c757d",
                          marginTop: "2px",
                          fontStyle: "italic",
                        }}>
                          {item.part_description}
                        </div>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", justifyContent: "flex-start" }}>
                        <span style={categoryBadgeStyle(item.part_category)}>
                          {item.part_category}
                        </span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ 
                        fontWeight: 600, 
                        fontSize: "1.2rem",
                        color: "#0e2a47",
                        fontFamily: "monospace",
                        marginBottom: "4px",
                      }}>
                        {item.current_quantity}
                      </div>
                      <div style={{ 
                        fontSize: "0.8rem",
                        color: "#6c757d",
                        textTransform: "lowercase",
                      }}>
                        {item.measurement}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", justifyContent: "flex-start" }}>
                        <span style={stockBadgeStyle(item.current_quantity)}>
                          {STOCK_STATUS_DISPLAY[getStockStatus(item.current_quantity)].text}
                        </span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        {/* Restock Button - Opens Modal */}
                        <button
                          onClick={() => handleOpenAddStockModal(item)}
                          style={{
                            ...actionButtonStyle,
                            borderColor: "#28a745",
                            background: "#d4edda",
                            color: "#155724",
                          }}
                        >
                          + Restock
                        </button>
                        
                        {/* Use Button - Opens Modal */}
                        <button
                          onClick={() => handleOpenUseModal(item)}
                          style={{
                            ...actionButtonStyle,
                            borderColor: "#dc3545",
                            background: "#f8d7da",
                            color: "#721c24",
                          }}
                        >
                          - Use
                        </button>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <button
                          onClick={() => handleViewDetails(item)}
                          onMouseEnter={() => setHoveredItemId(item.part_id)}
                          onMouseLeave={() => setHoveredItemId(null)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "6px",
                            borderWidth: "1px",
                            borderStyle: "solid",
                            borderColor: "#0e2a47",
                            background: hoveredItemId === item.part_id ? "#0e2a47" : "transparent",
                            color: hoveredItemId === item.part_id ? "white" : "#0e2a47",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            fontWeight: "500",
                            transition: "all 0.2s",
                            whiteSpace: "nowrap",
                          }}
                        >
                          View Logs
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredAndSortedInventory.length > 0 && (
          <div style={paginationContainerStyle}>
            <div style={paginationInfoStyle}>
              Showing {Math.min(startIndex + 1, filteredAndSortedInventory.length)} to {Math.min(endIndex, filteredAndSortedInventory.length)} of {filteredAndSortedInventory.length} items
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
                
                {/* Calculate pages to show */}
                {(() => {
                  const startPage = Math.max(1, currentPage - 1);
                  const endPage = Math.min(totalPages, currentPage + 1);
                  const pagesToShow = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
                  
                  return (
                    <>
                      {/* Show first page */}
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
                      
                      {/* Show pages around current page */}
                      {pagesToShow.map(pageNum => (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          style={currentPage === pageNum ? activePageButtonStyle : pageButtonStyle}
                        >
                          {pageNum}
                        </button>
                      ))}
                      
                      {/* Show last page */}
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

      {modalOpen && selectedItem && (
        <InventoryModal
          item={selectedItem}
          isOpen={modalOpen}
          onClose={handleModalClose}
          maintenanceOptions={MAINTENANCE_OPTIONS}
          measurementOptions={MEASUREMENT_OPTIONS}
        />
      )}

      {useModalOpen && selectedItemForUse && (
        <UseInventoryModal
          item={selectedItemForUse}
          isOpen={useModalOpen}
          onClose={() => {
            setUseModalOpen(false);
            setSelectedItemForUse(null);
          }}
          onConfirm={handleConfirmUse}
          maintenanceOptions={MAINTENANCE_OPTIONS}
        />
      )}

      {addStockModalOpen && selectedItemForStock && (
        <AddStockModal
          item={selectedItemForStock}
          isOpen={addStockModalOpen}
          onClose={() => {
            setAddStockModalOpen(false);
            setSelectedItemForStock(null);
          }}
          onConfirm={handleConfirmAddStock}
        />
      )}

      {addModalOpen && (
        <AddInventoryModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSuccess={handleAddSuccess}
          categoryOptions={CATEGORY_OPTIONS}
          measurementOptions={MEASUREMENT_OPTIONS}
        />
      )}
    </>
  );
}