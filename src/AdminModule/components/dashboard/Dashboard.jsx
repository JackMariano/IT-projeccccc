import React, { useState } from "react";
import DriverList from "./DriverList";
import StatsCard from "./StatsCard";
import AddDriverModal from "./AddDriverModal";

export default function Dashboard() {
  // Dashboard-local state (moved from original AdminModule)
  const [drivers, setDrivers] = useState([]);
  const [showAddDriver, setShowAddDriver] = useState(false);
  
  const handleAddDriver = (driverData) => {
  setDrivers((prev) => [...prev, driverData]);
};


  return (
    <div className="p-3 md:p-6 overflow-auto flex-1">
      <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6">My Dashboard</h2>

      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setShowAddDriver(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full text-lg"
        >
          + Add Driver
        </button>
      </div>

      {showAddDriver && (
        <AddDriverModal
          onClose={() => setShowAddDriver(false)}
          onAdd={handleAddDriver}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="text-center font-semibold mb-4 text-sm md:text-lg">Driver list</h3>
          <div className="flex justify-around mb-6">
            <div className="text-center">
              <div className="text-3xl md:text-5xl font-bold text-green-600">{drivers.length}</div>
              <div className="text-xs md:text-sm text-gray-600 mt-1">Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-5xl font-bold text-blue-500">0</div>
              <div className="text-xs md:text-sm text-gray-600 mt-1">Assigned</div>
            </div>
          </div>

          <div className="space-y-2 max-h-48 md:max-h-64 overflow-y-auto">
            <DriverList drivers={drivers} />
          </div>
        </div>

        {/* Reuse StatsCard for the other 3 cards */}
        <StatsCard title="Vehicles" leftValue="10" leftLabel="Active" rightValue="8" rightLabel="Inactive" />
        <StatsCard title="Vehicle Assignments" leftValue="1" leftLabel="Assigned" rightValue="17" rightLabel="Unassigned" />
        <StatsCard title="Inventory Notifications" leftValue="0" leftLabel="Out of Stock" rightValue="" rightLabel="" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="text-center font-semibold mb-4 text-sm md:text-lg">Pending Maintenance</h3>
          <div className="flex justify-around">
            <div className="text-center">
              <div className="text-3xl md:text-5xl font-bold text-red-600">3</div>
              <div className="text-xs md:text-sm text-gray-600 mt-1">Overdue</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-5xl font-bold text-yellow-500">9</div>
              <div className="text-xs md:text-sm text-gray-600 mt-1">Due Soon</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="text-center font-semibold mb-4 text-sm md:text-lg">Issues</h3>
          <div className="flex justify-around">
            <div className="text-center">
              <div className="text-3xl md:text-5xl font-bold text-yellow-500">10</div>
              <div className="text-xs md:text-sm text-gray-600 mt-1">Open</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-5xl font-bold text-blue-500">0</div>
              <div className="text-xs md:text-sm text-gray-600 mt-1">Overdue</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="text-center font-semibold mb-4 text-sm md:text-lg">Vehicle Renewal Reminders</h3>
          <div className="flex justify-around">
            <div className="text-center">
              <div className="text-3xl md:text-5xl font-bold text-red-600">3</div>
              <div className="text-xs md:text-sm text-gray-600 mt-1">Overdue</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-5xl font-bold text-yellow-500">17</div>
              <div className="text-xs md:text-sm text-gray-600 mt-1">Due Soon</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="text-center font-semibold mb-4 text-sm md:text-lg">Vehicle Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="font-medium text-sm md:text-base">Active</span>
              </div>
              <span className="font-bold text-sm md:text-base">10</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-sm md:text-base">Inactive</span>
              </div>
              <span className="font-bold text-sm md:text-base">8</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-yellow-600 rounded-full"></div>
                <span className="font-medium text-sm md:text-base">In Shop</span>
              </div>
              <span className="font-bold text-sm md:text-base">1</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="font-medium text-sm md:text-base">Out of Service</span>
              </div>
              <span className="font-bold text-sm md:text-base">3</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="text-center font-semibold mb-4 text-sm md:text-lg">Tool Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="font-medium text-sm md:text-base">In-Service</span>
              </div>
              <span className="font-bold text-sm md:text-base">1</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="font-medium text-sm md:text-base">Out-of-Service</span>
              </div>
              <span className="font-bold text-sm md:text-base">0</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                <span className="font-medium text-sm md:text-base">Disposed</span>
              </div>
              <span className="font-bold text-sm md:text-base">1</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span className="font-medium text-sm md:text-base">Missing</span>
              </div>
              <span className="font-bold text-sm md:text-base">0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
