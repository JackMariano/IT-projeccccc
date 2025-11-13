import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// ------------------- Sidebar -------------------
function Sidebar({ active, onNavigate }) {
  const sidebarStyle = {
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    width: "250px",
    background: "#0e2a47",
    color: "#fff",
    fontFamily: "Montserrat, sans-serif",
    zIndex: 200,
    display: "flex",
    flexDirection: "column",
    transition: "all 0.2s ease",
    paddingTop: "20px",
  };

  const headerStyle = {
    fontSize: "2rem",
    padding: "20px 16px",
    fontWeight: "bold",
    letterSpacing: "2px",
  };

  const itemStyle = (isActive) => ({
    padding: "18px 16px",
    fontSize: "1.2rem",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    transition: "background 0.2s",
    background: isActive ? "#e5b038" : "transparent",
    color: "#fff",
  });

  const iconStyle = {
    marginRight: "12px",
    fontSize: "1.3rem",
  };

  return (
    <div style={sidebarStyle}>
      <div style={headerStyle}>JMTC</div>
      <div style={itemStyle(active === "dashboard")} onClick={() => onNavigate("dashboard")}>
        <span style={iconStyle}>🏠</span> Dashboard
      </div>
      <div style={itemStyle(active === "notifications")} onClick={() => onNavigate("notifications")}>
        <span style={iconStyle}>🔔</span> Notifications
      </div>
      <div style={itemStyle(active === "logout")} onClick={() => onNavigate("logout")}>
        <span style={iconStyle}>🔑</span> Logout
      </div>
    </div>
  );
}

// ------------------- Modals -------------------
function UpdateStatusModal({ open, onClose, onSave, vehicle }) {
  const [status, setStatus] = useState(vehicle?.status || "Available");
  if (!open) return null;

  const backdrop = {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(60, 60, 60, 0.25)", zIndex: 1000,
    display: "flex", alignItems: "center", justifyContent: "center",
  };
  const modal = {
    background: "#fff", borderRadius: "18px", padding: "2rem 2.5rem",
    width: "min(520px, 95%)", maxHeight: "90vh", overflow: "auto",
    display: "flex", flexDirection: "column", gap: "1.2rem",
    alignItems: "stretch", boxShadow: "0 4px 32px rgba(0,0,0,0.13)",
  };
  const title = { fontSize: "1.3rem", textAlign: "center", marginBottom: "1rem", color: "#222" };
  const label = { fontWeight: 500, marginBottom: "0.2rem", color: "#333" };
  const radio = { marginRight: "0.5rem" };
  const actions = { display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "0.5rem" };
  const button = { padding: "0.5rem 1.3rem", borderRadius: "20px", border: "none", fontSize: "1rem", background: "#46644a", color: "#fff", cursor: "pointer" };
  const cancelButton = { ...button, background: "#f4f4f4", color: "#333", border: "1px solid #bbb" };

  return (
    <div style={backdrop}>
      <div style={modal}>
        <h2 style={title}>Update Status</h2>
        <div>
          <label style={label}>
            <input type="radio" style={radio} checked={status === "Available"} onChange={() => setStatus("Available")} />
            Available
          </label>
        </div>
        <div>
          <label style={label}>
            <input type="radio" style={radio} checked={status === "Out of Service"} onChange={() => setStatus("Out of Service")} />
            Out of Service
          </label>
        </div>
        <div style={actions}>
          <button style={cancelButton} onClick={onClose}>Cancel</button>
          <button style={button} onClick={() => onSave(status)}>Save</button>
        </div>
      </div>
    </div>
  );
}

function RecordRepairModal({ open, onClose, onConfirm, vehicle }) {
  const [repair, setRepair] = useState("");
  const [type, setType] = useState(vehicle?.type || "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [plate, setPlate] = useState(vehicle?.plate || "");
  if (!open) return null;

  const backdrop = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(60,60,60,0.25)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" };
  const modal = { background: "#fff", borderRadius: "18px", padding: "2rem 2.5rem", width: "min(520px,95%)", maxHeight:"90vh", overflow:"auto", display:"flex", flexDirection:"column", gap:"1.2rem", alignItems:"stretch", boxShadow:"0 4px 32px rgba(0,0,0,0.13)" };
  const title = { fontSize:"1.3rem", textAlign:"center", marginBottom:"1rem", color:"#222" };
  const label = { fontWeight:500, marginBottom:"0.2rem", color:"#333" };
  const input = { width:"100%", padding:"0.5rem 0.7rem", borderRadius:"7px", border:"1px solid #bbb", marginBottom:"0.7rem", fontSize:"1rem" };
  const actions = { display:"flex", justifyContent:"flex-end", gap:"1rem", marginTop:"0.5rem" };
  const button = { padding:"0.5rem 1.3rem", borderRadius:"20px", border:"none", fontSize:"1rem", background:"#46644a", color:"#fff", cursor:"pointer" };
  const cancelButton = { ...button, background:"#f4f4f4", color:"#333", border:"1px solid #bbb" };

  return (
    <div style={backdrop}>
      <div style={modal}>
        <h2 style={title}>Repair</h2>
        <div>
          <label style={label}>Repair</label>
          <input style={input} value={repair} onChange={(e) => setRepair(e.target.value)} />
        </div>
        <div>
          <label style={label}>Type Of Vehicle</label>
          <input style={input} value={type} onChange={(e) => setType(e.target.value)} />
        </div>
        <div>
          <label style={label}>Date</label>
          <input type="date" style={input} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label style={label}>Time</label>
          <input type="time" style={input} value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div>
          <label style={label}>Plate Number</label>
          <input style={input} value={plate} onChange={(e) => setPlate(e.target.value)} />
        </div>
        <div style={actions}>
          <button style={cancelButton} onClick={onClose}>Cancel</button>
          <button style={button} onClick={() => onConfirm({repair,type,date,time,plate})}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ------------------- Vehicle Components -------------------
function NotificationPanel({ notifications }) {
  const panel = { margin:"2rem auto", width:"95%", maxWidth:"1200px", background:"#d3d3d3", borderRadius:"8px", padding:"20px", boxShadow:"0 2px 4px rgba(0,0,0,0.1)" };
  const title = { display:"flex", alignItems:"center", fontSize:"1.1rem", fontWeight:600, color:"#333", marginBottom:"15px" };
  const icon = { marginRight:"10px", fontSize:"1.2rem" };
  const item = { color:"#333", marginBottom:"8px", fontSize:"0.95rem" };
  return (
    <div style={panel}>
      <div style={title}><span style={icon}>🔔</span> Incoming Notifications</div>
      {notifications.map((n, idx) => (<div key={idx} style={item}>{n}</div>))}
    </div>
  );
}

function VehicleSearch({ filter, setFilter }) {
  const container = { margin:"0 auto 2rem auto", width:"95%", maxWidth:"1200px", position:"relative" };
  const input = { width:"100%", padding:"12px 15px 12px 45px", border:"1px solid #ccc", borderRadius:"6px", fontSize:"1rem", background:"white" };
  const icon = { position:"absolute", left:"15px", top:"50%", transform:"translateY(-50%)", color:"#666", fontSize:"1.1rem" };
  return (
    <div style={container}>
      <span style={icon}>🔍</span>
      <input style={input} placeholder="Filter by vehicle name, plate, or status" value={filter} onChange={(e) => setFilter(e.target.value)} />
    </div>
  );
}

function VehicleCard({ vehicle, onRecordRepair, onUpdateStatus }) {
  const card = { background:"#d3d3d3", borderRadius:"8px", padding:"20px", width:"100%", boxShadow:"0 2px 4px rgba(0,0,0,0.1)", marginBottom:"1rem" };
  const header = { display:"flex", alignItems:"center", marginBottom:"15px" };
  const image = { width:"60px", height:"40px", background:"#999", borderRadius:"4px", marginRight:"15px", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:"0.8rem" };
  const vehicleStatus = { display:"flex", alignItems:"center", margin:"15px 0", color:"#d67e00", fontWeight:600 };
  const actions = { display:"flex", gap:"10px", marginTop:"20px" };
  const button = { padding:"8px 16px", border:"2px solid #333", background:"white", color:"#333", borderRadius:"20px", fontSize:"0.9rem", cursor:"pointer" };

  return (
    <div style={card}>
      <div style={header}>
        <div style={image}>{vehicle.type === "Van" ? "🚐" : "🚙"}</div>
        <div>
          <h3 style={{margin:0,fontSize:"1.3rem",fontWeight:"700",color:"#333"}}>{vehicle.name}</h3>
          <div style={{fontSize:"0.9rem", color:"#555"}}>VIN/SN: {vehicle.vin}<br/>License Plate: {vehicle.plate}</div>
        </div>
      </div>
      <div style={vehicleStatus}><span style={{marginRight:"8px"}}>⚠️</span>{vehicle.status}</div>
      <div style={{margin:"15px 0", fontSize:"0.9rem", color:"#333", lineHeight:"1.4"}}>
        <div><strong>Last Repair Description:</strong> {vehicle.lastRepair}</div>
        <div><strong>Next Scheduled Repair:</strong> {vehicle.nextRepair}</div>
      </div>
      <div style={actions}>
        <button style={button} onClick={() => onRecordRepair(vehicle)}>Record Repair</button>
        <button style={button} onClick={() => onUpdateStatus(vehicle)}>Update Status</button>
      </div>
    </div>
  );
}

// ------------------- ShopModule -------------------
export default function ShopModule() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const [vehicles, setVehicles] = useState([
    { id:1, name:"LE-4", vin:"1C6RR7GU7ES176075", plate:"1A13333", status:"Under Repair", lastRepair:"Replaced alternator oil filter", nextRepair:"June 30, 2025", type:"Van" },
    { id:2, name:"LE-4", vin:"1C6RR7GT8ES176075", plate:"1A13212", status:"Under Repair", lastRepair:"Replaced alternator oil filter", nextRepair:"June 3, 2025", type:"SUV" }
  ]);
  const [notifications] = useState(["Vehicle PW-1 is scheduled for repair on 06/23/2025","New repair request submitted for LE-4"]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const filteredVehicles = vehicles.filter(v =>
    v.name.toLowerCase().includes(filter.toLowerCase()) ||
    v.plate.toLowerCase().includes(filter.toLowerCase()) ||
    v.status.toLowerCase().includes(filter.toLowerCase())
  );

  const handleUpdateStatus = (vehicle) => { setSelectedVehicle(vehicle); setShowStatusModal(true); };
  const handleSaveStatus = (status) => { setVehicles(vehicles.map(v=>v.id===selectedVehicle.id?{...v,status}:v)); setShowStatusModal(false); setSelectedVehicle(null); };
  const handleRecordRepair = (vehicle) => { setSelectedVehicle(vehicle); setShowRepairModal(true); };
  const handleConfirmRepair = ({repair,type,date,time,plate}) => { setVehicles(vehicles.map(v=>v.id===selectedVehicle.id?{...v,lastRepair:repair,nextRepair:date,type,plate}:v)); setShowRepairModal(false); setSelectedVehicle(null); };

  const handleSidebarNavigate = (path) => {
    if (path === "logout") {
      const token = localStorage.getItem("token");
      fetch("/.netlify/functions/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      }).finally(() => {
        localStorage.clear();
        navigate("/");
      });
    } else if (path === "dashboard") {
      navigate("/driver"); // adjust route if needed
    } else if (path === "notifications") {
      console.log("Navigate to notifications");
    }
  };

  const root = { display:"flex", minHeight:"100vh", flexDirection:"row", background:"#f5f5f5" };
  const main = { marginLeft:"250px", width:"calc(100vw - 250px)", minHeight:"100vh", display:"flex", flexDirection:"column", transition:"margin-left 0.2s ease,width 0.2s ease" };
  const header = { width:"100%", background:"#2fa6db", color:"#fff", display:"flex", alignItems:"center", justifyContent:"flex-end", padding:"0 2.5rem", height:"70px", fontSize:"1.5rem", fontWeight:700 };
  const title = { color:"black", background:"#d3d3d3", fontSize:"2.5rem", fontWeight:700, textAlign:"center", padding:"30px 0" };
  const avatar = { width:"48px", height:"48px", background:"#e6e6e6", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.5rem", color:"#666" };

  return (
    <div style={root}>
      <Sidebar active="dashboard" onNavigate={handleSidebarNavigate} />
      <div style={main}>
        <header style={header}>
          <div style={avatar}>👤</div>
        </header>
        <div style={title}>Shop Module</div>
        <NotificationPanel notifications={notifications} />
        <VehicleSearch filter={filter} setFilter={setFilter} />
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:"1rem", margin:"0 auto 2rem auto", width:"95%", maxWidth:"1200px"}}>
          {filteredVehicles.map(v => <VehicleCard key={v.id} vehicle={v} onRecordRepair={handleRecordRepair} onUpdateStatus={handleUpdateStatus} />)}
        </div>
      </div>
      <UpdateStatusModal open={showStatusModal} onClose={()=>setShowStatusModal(false)} onSave={handleSaveStatus} vehicle={selectedVehicle} />
      <RecordRepairModal open={showRepairModal} onClose={()=>setShowRepairModal(false)} onConfirm={handleConfirmRepair} vehicle={selectedVehicle} />
    </div>
  );
}
