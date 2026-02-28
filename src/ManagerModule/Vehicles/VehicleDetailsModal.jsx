export default function VehicleDetailsModal({ vehicle, onClose }) {
  if (!vehicle) return null;

  const formatDate = (date) => {
    if (!date) return "N/A";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (date) => {
    if (!date) return "N/A";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusExplanation = () => {
    const status = (vehicle.status || "").toLowerCase();
    switch (status) {
      case "available":
        return "This vehicle is ready for new reservations.";
      case "reserved":
        return "This vehicle has an upcoming reservation.";
      case "in use":
        return "This vehicle is currently being used by a customer.";
      case "under repair":
        return "This vehicle is currently being repaired.";
      case "in_shop":
        return "This vehicle is at the shop for maintenance.";
      case "for inspection":
        return "This vehicle is pending inspection.";
      case "finished repair":
        return "Repairs have been completed; vehicle is awaiting status update.";
      default:
        return "No additional information available.";
    }
  };

  const getSeverityColor = (severity) => {
    switch ((severity || "").toLowerCase()) {
      case "critical":
        return "#dc2626";
      case "high":
        return "#ea580c";
      case "medium":
        return "#ca8a04";
      default:
        return "#65a30d";
    }
  };

  const getReservationStatusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "upcoming":
        return "#3b82f6";
      case "ongoing":
        return "#0891b2";
      case "completed":
        return "#10b981";
      case "cancelled":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

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
  };

  const modalStyle = {
    background: "#fff",
    borderRadius: "8px",
    padding: "24px",
    maxWidth: "600px",
    width: "90%",
    maxHeight: "80vh",
    overflowY: "auto",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
    borderBottom: "1px solid #eee",
    paddingBottom: "12px",
  };

  const titleStyle = {
    fontSize: "1.25rem",
    fontWeight: "bold",
    color: "#0e2a47",
    margin: 0,
  };

  const closeButtonStyle = {
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    color: "#666",
    padding: "0",
    lineHeight: 1,
  };

  const sectionStyle = {
    marginBottom: "20px",
  };

  const sectionTitleStyle = {
    fontSize: "0.9rem",
    fontWeight: "bold",
    color: "#0e2a47",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  const infoGridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  };

  const infoItemStyle = {
    display: "flex",
    flexDirection: "column",
  };

  const labelStyle = {
    fontSize: "0.75rem",
    color: "#666",
    marginBottom: "2px",
  };

  const valueStyle = {
    fontSize: "0.875rem",
    color: "#1f2937",
    fontWeight: 500,
  };

  const badgeStyle = (color) => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "bold",
    color: "#fff",
    background: color,
  });

  const historyItemStyle = {
    padding: "10px",
    background: "#f9fafb",
    borderRadius: "6px",
    marginBottom: "8px",
    borderLeft: "3px solid #0e2a47",
  };

  const { activeReservation, activeIssue, recentReservations = [] } = vehicle;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div>
            <h2 style={titleStyle}>
              {vehicle.brand} {vehicle.model} ({vehicle.plate_number})
            </h2>
            <p style={{ color: "#666", fontSize: "0.875rem", marginTop: "4px" }}>
              Year: {vehicle.year} | Daily Rate: ₱{Number(vehicle.daily_rate || 0).toLocaleString()}
            </p>
          </div>
          <button style={closeButtonStyle} onClick={onClose}>
            &times;
          </button>
        </div>

        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Current Status</div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={badgeStyle(
                vehicle.status === "Available"
                  ? "#10b981"
                  : vehicle.status === "Reserved"
                  ? "#3b82f6"
                  : vehicle.status === "In Use"
                  ? "#0891b2"
                  : vehicle.status === "Under Repair"
                  ? "#ef4444"
                  : vehicle.status === "For Inspection"
                  ? "#8b5cf6"
                  : vehicle.status === "In Shop"
                  ? "#f59e0b"
                  : "#059669"
              )}
            >
              {vehicle.status}
            </span>
            <span style={{ color: "#666", fontSize: "0.875rem" }}>
              {getStatusExplanation()}
            </span>
          </div>
        </div>

        {activeReservation && (
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Current Reservation</div>
            <div style={infoGridStyle}>
              <div style={infoItemStyle}>
                <span style={labelStyle}>Reserved By (Customer)</span>
                <span style={valueStyle}>{activeReservation.customerName || "N/A"}</span>
              </div>
              <div style={infoItemStyle}>
                <span style={labelStyle}>Contact Number</span>
                <span style={valueStyle}>{activeReservation.customerContact || "N/A"}</span>
              </div>
              <div style={infoItemStyle}>
                <span style={labelStyle}>Assigned Driver</span>
                <span style={valueStyle}>{activeReservation.driverName || "Not assigned"}</span>
              </div>
              <div style={infoItemStyle}>
                <span style={labelStyle}>Reservation Status</span>
                <span
                  style={badgeStyle(getReservationStatusColor(activeReservation.status))}
                >
                  {activeReservation.status}
                </span>
              </div>
              <div style={infoItemStyle}>
                <span style={labelStyle}>Start Date</span>
                <span style={valueStyle}>{formatShortDate(activeReservation.startDate)}</span>
              </div>
              <div style={infoItemStyle}>
                <span style={labelStyle}>End Date (Until)</span>
                <span style={valueStyle}>{formatShortDate(activeReservation.endDate)}</span>
              </div>
            </div>
          </div>
        )}

        {activeIssue &&
          (vehicle.status === "Under Repair" ||
            vehicle.status === "In Shop" ||
            vehicle.status === "For Inspection" ||
            vehicle.status === "Finished Repair") && (
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>Issue / Repair Details</div>
              <div style={infoGridStyle}>
                <div style={{ ...infoItemStyle, gridColumn: "1 / -1" }}>
                  <span style={labelStyle}>Description</span>
                  <span style={valueStyle}>{activeIssue.description || "N/A"}</span>
                </div>
                <div style={infoItemStyle}>
                  <span style={labelStyle}>Category</span>
                  <span style={valueStyle}>
                    {Array.isArray(activeIssue.categories)
                      ? activeIssue.categories.join(", ")
                      : activeIssue.categories || "N/A"}
                  </span>
                </div>
                <div style={infoItemStyle}>
                  <span style={labelStyle}>Severity</span>
                  <span
                    style={badgeStyle(getSeverityColor(activeIssue.severity))}
                  >
                    {activeIssue.severity || "N/A"}
                  </span>
                </div>
                <div style={infoItemStyle}>
                  <span style={labelStyle}>Issue Status</span>
                  <span style={valueStyle}>{activeIssue.status || "N/A"}</span>
                </div>
                <div style={infoItemStyle}>
                  <span style={labelStyle}>Reported By</span>
                  <span style={valueStyle}>{activeIssue.reportedBy || "N/A"}</span>
                </div>
                <div style={{ ...infoItemStyle, gridColumn: "1 / -1" }}>
                  <span style={labelStyle}>Reported Date</span>
                  <span style={valueStyle}>{formatDate(activeIssue.reportedDate)}</span>
                </div>
              </div>
            </div>
          )}

        {!activeReservation && recentReservations && recentReservations.length > 0 && (
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Recent Reservations</div>
            {recentReservations.map((res, index) => (
              <div key={res.reservationId || index} style={historyItemStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "4px",
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    {res.customerName || "Unknown Customer"}
                  </span>
                  <span
                    style={badgeStyle(getReservationStatusColor(res.status))}
                  >
                    {res.status}
                  </span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "#666" }}>
                  {formatShortDate(res.startDate)} - {formatShortDate(res.endDate)}
                  {res.driverName && ` | Driver: ${res.driverName}`}
                </div>
              </div>
            ))}
          </div>
        )}

        {(!recentReservations || recentReservations.length === 0) && !activeReservation && (
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Recent Reservations</div>
            <p style={{ color: "#666", fontSize: "0.875rem" }}>
              No recent reservations found for this vehicle.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
