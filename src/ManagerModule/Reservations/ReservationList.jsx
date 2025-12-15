import { useState, useEffect } from "react";
import ReservationForm from "./ReservationForm";
import ReservationDashboard from "./ReservationDashboard";

export default function ReservationList({ user }) {
  const [reservations, setReservations] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [modalReservation, setModalReservation] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    fetchReservations();
    fetchDrivers();
  }, [refreshTrigger]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("jmtc_token");
      const response = await fetch("/.netlify/functions/getReservations", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error("Failed to fetch reservations");

      const data = await response.json();
      setReservations(data.reservations || []);
    } catch (err) {
      alert("Failed to load reservations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem("jmtc_token");
      const response = await fetch("/.netlify/functions/getDrivers", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setDrivers(data.drivers || []);
      } else {
        // Fallback to just employees if getDrivers fails
        const fallbackResponse = await fetch("/.netlify/functions/getEmployees");
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setDrivers(fallbackData.employees || []);
        }
      }
    } catch (err) {
      // Silently handle error
    }
  };

  // Get driver name from drivers data
  const getDriverName = (driverId) => {
    if (!driverId || driverId === "" || driverId === "0" || driverId === 0) {
      return "-";
    }
    
    // Convert driverId to number for comparison (since IDs are usually numbers)
    const driverIdNum = Number(driverId);
    
    // Try to find driver by user_id (most likely)
    const driver = drivers.find(d => 
      d.user_id === driverIdNum || 
      d.user_id == driverId || // Loose equality for string/number mismatch
      d.emp_id === driverIdNum ||
      d.emp_id == driverId ||
      d.id === driverIdNum ||
      d.id == driverId
    );
    
    if (driver) {
      // Your employee table has firstname and lastname
      const firstName = driver.firstname || "";
      const lastName = driver.lastname || "";
      
      if (firstName && lastName) {
        return `${firstName} ${lastName}`;
      } else if (firstName) {
        return firstName;
      } else if (lastName) {
        return lastName;
      } else if (driver.username) {
        return driver.username;
      }
    }
    
    return `ID: ${driverId}`;
  };

  // Format phone number for display
  const formatPhoneNumber = (phone) => {
    if (!phone || phone === "-" || phone === "") return "-";
    
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
      // Handle Philippine numbers: 09123456789 -> (+63) 912-345-6789
      return `(+63) ${cleaned.slice(1, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('63')) {
      // Handle Philippine numbers: 639123456789 -> (+63) 912-345-6789
      return `(+63) ${cleaned.slice(2, 5)}-${cleaned.slice(5, 8)}-${cleaned.slice(8)}`;
    }
    
    // Return original if not standard format
    return phone;
  };

  const handleDeleteReservation = async (id) => {
    if (!confirm("Are you sure you want to delete this reservation?")) return;

    try {
      const token = localStorage.getItem("jmtc_token");
      const response = await fetch("/.netlify/functions/deleteReservation", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ reservation_id: id }),
      });

      if (!response.ok) throw new Error("Failed to delete reservation");

      setRefreshTrigger((prev) => prev + 1);
      setCurrentPage(1);
      alert("Reservation deleted successfully!");
    } catch (err) {
      alert("Failed to delete reservation. Please try again.");
    }
  };

  const handleFormSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    closeModal();
  };

  const getReservationStatus = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) return "upcoming";
    if (now <= end) return "ongoing";
    return "completed";
  };

  // Open modal for editing a reservation
  const openEditModal = (reservation) => {
    setModalReservation(reservation);
    setShowModal(true);
  };

  // Open modal for creating a new reservation
  const openCreateModal = () => {
    setModalReservation(null);
    setShowModal(true);
  };

  // Close the modal
  const closeModal = () => {
    setShowModal(false);
    setModalReservation(null);
  };

  // Filter reservations based on search and status
  let filteredReservations = reservations.filter((r) => {
    const driverName = getDriverName(r.driver_id);
    const formattedContact = formatPhoneNumber(r.contact_number || "");
    const customerName = r.customer_name || "";
    const plateNumber = r.plate_number || "";
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      customerName.toLowerCase().includes(searchLower) ||
      plateNumber.toLowerCase().includes(searchLower) ||
      driverName.toLowerCase().includes(searchLower) ||
      (r.contact_number || "").toLowerCase().includes(searchLower) ||
      formattedContact.toLowerCase().includes(searchLower);

    if (filterStatus === "all") return matchesSearch;
    
    // Use reservation status from database if available, otherwise calculate
    const status = r.status || getReservationStatus(r.startdate, r.enddate);
    const displayStatus = status === "pending" ? "upcoming" : 
                         status === "active" ? "ongoing" : 
                         status === "completed" ? "completed" : status;
    
    return matchesSearch && displayStatus === filterStatus;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredReservations.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredReservations.slice(indexOfFirstRecord, indexOfLastRecord);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Generate page numbers
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);
      
      if (currentPage <= 3) {
        endPage = maxPagesToShow;
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - maxPagesToShow + 1;
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }
    
    return pageNumbers;
  };

  const containerStyle = {
    background: "#fff",
    borderRadius: "6px",
    padding: "16px",
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    flexWrap: "wrap",
    gap: "12px",
  };

  const titleStyle = {
    fontSize: "1.3rem",
    fontWeight: "bold",
    color: "#0e2a47",
  };

  const buttonStyle = {
    padding: "8px 16px",
    background: "#e5b038",
    color: "#0e2a47",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.85rem",
    transition: "background-color 0.2s",
  };

  const filterStyle = {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "16px",
    alignItems: "center",
  };

  const searchInputStyle = {
    padding: "8px 10px",
    borderRadius: "4px",
    border: "1px solid #ddd",
    fontSize: "0.85rem",
    flex: 1,
    minWidth: "150px",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.85rem",
  };

  const thStyle = {
    textAlign: "left",
    padding: "8px",
    background: "#0e2a47",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "0.8rem",
  };

  const tdStyle = {
    padding: "8px",
    borderBottom: "1px solid #eee",
  };

  const statusBadgeStyle = (status) => ({
    padding: "3px 8px",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "bold",
    background:
      status === "upcoming" || status === "pending"
        ? "#fbbf24"
        : status === "ongoing" || status === "active"
          ? "#3b82f6"
          : "#10b981",
    color: "#fff",
  });

  const actionButtonStyle = (color) => ({
    padding: "4px 8px",
    marginRight: "4px",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "0.75rem",
    fontWeight: "bold",
    background: color,
    color: "#fff",
    transition: "opacity 0.2s",
  });

  // Pagination styles
  const paginationContainerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "20px",
    gap: "4px",
    flexWrap: "wrap",
  };

  const pageButtonStyle = (isActive) => ({
    padding: "6px 12px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: isActive ? "bold" : "normal",
    background: isActive ? "#0e2a47" : "#f1f1f1",
    color: isActive ? "#fff" : "#333",
    transition: "all 0.2s",
  });

  const navButtonStyle = {
    padding: "6px 12px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.8rem",
    background: "#fff",
    color: "#0e2a47",
    transition: "all 0.2s",
  };

  const resultsInfoStyle = {
    fontSize: "0.85rem",
    color: "#666",
    marginTop: "10px",
    textAlign: "center",
  };

  // Modal overlay styles
  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: showModal ? "flex" : "none",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "20px",
  };

  const modalContentStyle = {
    background: "#fff",
    borderRadius: "8px",
    padding: "24px",
    maxWidth: "600px",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
  };

  const modalHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  };

  const closeButtonStyle = {
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    color: "#666",
    padding: "0",
    width: "30px",
    height: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    transition: "background-color 0.2s",
  };

  return (
    <div style={containerStyle}>
      <ReservationDashboard />

      <div style={headerStyle}>
        <h2 style={titleStyle}>Reservations</h2>
        <button 
          style={buttonStyle} 
          onClick={openCreateModal}
          onMouseOver={(e) => e.target.style.backgroundColor = "#d4a435"}
          onMouseOut={(e) => e.target.style.backgroundColor = "#e5b038"}
        >
          + New
        </button>
      </div>

      <div style={filterStyle}>
        <input
          type="text"
          placeholder="Search customer, plate, driver, or phone..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          style={searchInputStyle}
        />
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          style={{ 
            padding: "8px 10px", 
            borderRadius: "4px", 
            border: "1px solid #ddd", 
            fontSize: "0.85rem",
            minWidth: "120px"
          }}
        >
          <option value="all">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "#666" }}>Loading reservations...</p>
      ) : filteredReservations.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>No reservations found.</p>
      ) : (
        <>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Customer</th>
                <th style={thStyle}>Contact Number</th>
                <th style={thStyle}>Vehicle Plate</th>
                <th style={thStyle}>Start Date</th>
                <th style={thStyle}>End Date</th>
                <th style={thStyle}>Driver</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.map((res) => {
                // Use database status if available, otherwise calculate
                const status = res.status || getReservationStatus(res.startdate, res.enddate);
                const displayStatus = status === "pending" ? "upcoming" : 
                                     status === "active" ? "ongoing" : 
                                     status === "completed" ? "completed" : status;
                const driverName = getDriverName(res.driver_id);
                const formattedContact = formatPhoneNumber(res.contact_number || "");
                
                return (
                  <tr key={res.id}>
                    <td style={tdStyle}>{res.customer_name || "-"}</td>
                    <td style={tdStyle}>{formattedContact}</td>
                    <td style={tdStyle}>{res.plate_number || "-"}</td>
                    <td style={tdStyle}>{new Date(res.startdate).toLocaleDateString()}</td>
                    <td style={tdStyle}>{new Date(res.enddate).toLocaleDateString()}</td>
                    <td style={tdStyle}>{driverName}</td>
                    <td style={tdStyle}>
                      <span style={statusBadgeStyle(displayStatus)}>
                        {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <button
                        style={actionButtonStyle("#3b82f6")}
                        onClick={() => openEditModal(res)}
                        onMouseOver={(e) => e.target.style.opacity = "0.8"}
                        onMouseOut={(e) => e.target.style.opacity = "1"}
                      >
                        Edit
                      </button>
                      <button
                        style={actionButtonStyle("#ef4444")}
                        onClick={() => handleDeleteReservation(res.id)}
                        onMouseOver={(e) => e.target.style.opacity = "0.8"}
                        onMouseOut={(e) => e.target.style.opacity = "1"}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination controls */}
          <div style={resultsInfoStyle}>
            Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredReservations.length)} of {filteredReservations.length} reservations
          </div>

          {totalPages > 1 && (
            <div style={paginationContainerStyle}>
              <button
                style={navButtonStyle}
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                onMouseOver={(e) => !e.target.disabled && (e.target.style.backgroundColor = "#f5f5f5")}
                onMouseOut={(e) => !e.target.disabled && (e.target.style.backgroundColor = "#fff")}
              >
                Previous
              </button>
              
              {getPageNumbers().map((number) => (
                <button
                  key={number}
                  style={pageButtonStyle(number === currentPage)}
                  onClick={() => paginate(number)}
                  onMouseOver={(e) => e.target.style.opacity = "0.8"}
                  onMouseOut={(e) => e.target.style.opacity = "1"}
                >
                  {number}
                </button>
              ))}
              
              <button
                style={navButtonStyle}
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                onMouseOver={(e) => !e.target.disabled && (e.target.style.backgroundColor = "#f5f5f5")}
                onMouseOut={(e) => !e.target.disabled && (e.target.style.backgroundColor = "#fff")}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal for ReservationForm */}
      <div style={modalOverlayStyle} onClick={closeModal}>
        <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
          <div style={modalHeaderStyle}>
            <h2 style={titleStyle}>
              {modalReservation ? "Edit Reservation" : "Create New Reservation"}
            </h2>
            <button 
              style={closeButtonStyle} 
              onClick={closeModal}
              onMouseOver={(e) => e.target.style.backgroundColor = "#f5f5f5"}
              onMouseOut={(e) => e.target.style.backgroundColor = "transparent"}
            >
              ×
            </button>
          </div>
          <ReservationForm
            reservation={modalReservation}
            onSuccess={handleFormSuccess}
          />
        </div>
      </div>
    </div>
  );
}