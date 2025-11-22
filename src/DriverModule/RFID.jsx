import React, { useState, useEffect } from "react";

export default function RFID() {
  const [vehicle_ID, setVehicleID] = useState(""); // store vehicle_ID (number)
  const [rfidBalance, setRfidBalance] = useState(null);
  const [pricePaid, setPricePaid] = useState("");
  const [entryLocation, setEntryLocation] = useState("");
  const [exitLocation, setExitLocation] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Load vehicles from DB
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const res = await fetch("/.netlify/functions/getPlates");
        const data = await res.json();
        setVehicles(data);
      } catch (err) {
        console.error("Error loading vehicles:", err);
      }
    };
    loadVehicles();
  }, []);

  // Load RFID balance after selecting vehicle
  useEffect(() => {
    const loadBalance = async () => {
      if (!vehicle_ID) return;
      try {
        const res = await fetch(
          `/.netlify/functions/getRFIDBalance?vehicle_ID=${vehicle_ID}`
        );
        const data = await res.json();
        setRfidBalance(data.balance ?? 0);
      } catch (err) {
        console.error("Get RFID Balance error:", err);
        setRfidBalance(0);
      }
    };
    loadBalance();
  }, [vehicle_ID]);

  // Load locations
  useEffect(() => {
    setLocations(["North Gate", "South Gate", "East Gate", "West Gate"]);
  }, []);

  const handleSend = async () => {
    if (!vehicle_ID || !entryLocation || !exitLocation || !pricePaid) {
      alert("Please fill out all fields.");
      return;
    }
    if (rfidBalance === null) {
      alert("RFID balance not loaded yet.");
      return;
    }

    const newBalance = rfidBalance - Number(pricePaid);
    if (newBalance < 0) {
      alert("Insufficient RFID balance!");
      return;
    }

    try {
      const res = await fetch("/.netlify/functions/updateRFID", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_ID: Number(vehicle_ID),
          entryLocation,
          exitLocation,
          pricePaid: Number(pricePaid),
          newBalance,
        }),
      });

      if (!res.ok) throw new Error("Failed");

      setShowModal(true);
      setVehicleID("");
      setPricePaid("");
      setEntryLocation("");
      setExitLocation("");
      setRfidBalance(null);
    } catch (error) {
      console.error("Error sending RFID:", error);
      alert("Error sending data.");
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>RFID</h1>

      <div style={styles.flexWrap}>
        <div style={styles.card}>
          {/* Vehicle Plate Number Selection */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Vehicle Plate Number</label>
            <select
              style={styles.select}
              value={vehicle_ID}
              onChange={(e) => setVehicleID(e.target.value)}
            >
              <option value="">Select plate number</option>
              {vehicles.map((v) => (
                <option key={v.vehicle_ID} value={v.vehicle_ID}>
                  {v.plate_number} {/* only display plate number */}
                </option>
              ))}
            </select>
          </div>

          {/* RFID Balance */}
          {vehicle_ID && (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Current RFID Balance</label>
              <input
                style={{ ...styles.input, background: "#eee" }}
                value={rfidBalance === null ? "Loading..." : `${rfidBalance} PHP`}
                disabled
              />
            </div>
          )}

          {/* Entry / Exit Locations */}
          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Entry Location</label>
              <select
                style={styles.select}
                value={entryLocation}
                onChange={(e) => setEntryLocation(e.target.value)}
              >
                <option value="">Select entry</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={styles.label}>Exit Location</label>
              <select
                style={styles.select}
                value={exitLocation}
                onChange={(e) => setExitLocation(e.target.value)}
              >
                <option value="">Select exit</option>
                {locations.map((loc) => (
                  <option key={loc + "-exit"} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price Paid */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Price Paid (PHP)</label>
            <input
              type="number"
              style={styles.input}
              value={pricePaid}
              onChange={(e) => setPricePaid(e.target.value)}
            />
          </div>
        </div>

        {/* Send Button */}
        <button style={styles.sendBtn} onClick={handleSend}>
          Send
        </button>
      </div>

      {/* Success Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <button style={styles.closeBtn} onClick={() => setShowModal(false)}>✖</button>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Yes_Check_Circle.svg/1200px-Yes_Check_Circle.svg.png"
              alt="check"
              style={styles.modalCheck}
            />
            <h2 style={styles.modalText}>Transaction Saved</h2>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------ STYLES ------------------ */
const styles = {
  container: {
    marginLeft: "250px",
    marginTop: "70px",
    padding: "40px",
    background: "#d3d3d3",
    minHeight: "calc(100vh - 70px)",
    fontFamily: "Montserrat, sans-serif",
  },
  header: {
    fontSize: "28px",
    fontWeight: 600,
    marginBottom: "20px",
  },
  flexWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "30px",
  },
  card: {
    background: "white",
    padding: "32px",
    width: "100%",
    maxWidth: "450px",
    borderRadius: "10px",
    boxShadow: "0px 3px 10px rgba(0,0,0,0.15)",
  },
  fieldGroup: {
    marginBottom: "18px",
  },
  label: {
    display: "block",
    fontWeight: 600,
    marginBottom: "6px",
    fontSize: "0.95rem",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid #ccc",
    borderRadius: "6px",
    fontSize: "0.9rem",
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid #ccc",
    borderRadius: "6px",
    fontSize: "0.9rem",
  },
  row: {
    display: "flex",
    gap: "16px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },
  sendBtn: {
    background: "#e5b038",
    border: "none",
    padding: "12px 30px",
    height: "48px",
    color: "black",
    fontWeight: 600,
    borderRadius: "8px",
    cursor: "pointer",
    marginTop: "20px",
    boxShadow: "0px 3px 8px rgba(0,0,0,0.2)",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBox: {
    background: "#f6eac5",
    padding: "40px",
    width: "500px",
    borderRadius: "8px",
    border: "3px solid #000",
    position: "relative",
    textAlign: "center",
  },
  closeBtn: {
    position: "absolute",
    top: "10px",
    right: "12px",
    border: "none",
    background: "none",
    fontSize: "22px",
    cursor: "pointer",
  },
  modalCheck: {
    width: "100px",
    marginBottom: "20px",
  },
  modalText: {
    fontSize: "1.8rem",
    fontWeight: 700,
    color: "#0e2a47",
  },
};
