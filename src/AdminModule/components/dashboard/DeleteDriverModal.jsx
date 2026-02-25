import React, { useState, useEffect } from "react";

export default function DeleteDriverModal({ onClose, onDelete }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/.netlify/functions/getDrivers");
      const data = await response.json();
      if (response.ok) {
        setDrivers(data.drivers || []);
      } else {
        throw new Error(data.error || "Failed to fetch drivers");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this driver? All associated records (reservations, logs) will also be deleted.")) {
      return;
    }

    setDeletingId(userId);
    setError("");

    try {
      const response = await fetch("/.netlify/functions/deleteDriver", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || "Failed to delete driver");
        throw new Error(errorMsg);
      }

      onDelete(userId);
      setDrivers(drivers.filter(d => d.user_id !== userId));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center backdrop-blur-sm z-50">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-96 relative max-h-[80vh] flex flex-col">
        {/* Close button */}
        <button
          className="absolute top-3 right-3 text-2xl font-light"
          onClick={onClose}
        >
          ✖
        </button>

        <h3 className="text-xl font-bold mb-6 text-center text-red-600">Delete Driver</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 pr-2">
            {drivers.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No drivers found.</p>
            ) : (
              <ul className="space-y-3">
                {drivers.map((driver) => {
                  const firstName = driver.firstName || driver.firstname || "";
                  const lastName = driver.lastName || driver.lastname || "";
                  const fullName = `${lastName}, ${firstName}`.trim();
                  
                  return (
                    <li 
                      key={driver.user_id} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{fullName}</span>
                        <span className="text-xs text-gray-500">@{driver.username}</span>
                      </div>
                      <button
                        onClick={() => handleDelete(driver.user_id)}
                        disabled={deletingId === driver.user_id}
                        className="px-3 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 disabled:bg-gray-400 transition-colors"
                      >
                        {deletingId === driver.user_id ? "Deleting..." : "Delete"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-full font-medium hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
