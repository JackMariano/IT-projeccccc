import React from "react";

export default function DriverList({ drivers }) {
  if (!drivers || drivers.length === 0) {
    return <div className="text-center text-gray-500">No drivers yet</div>;
  }

  return (
    <>
      {drivers.map((driver, index) => {
        // Handle both camelCase and lowercase field names
        const firstName = driver.firstName || driver.firstname || "";
        const lastName = driver.lastName || driver.lastname || "";
        const middleName = driver.middleName || driver.middlename || "";
        const fullName = `${lastName}, ${firstName} ${middleName}`.trim();

        return (
          <div
            key={index}
            className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0"
          >
            <span className="text-xs font-medium truncate">
              {fullName}
            </span>

            {driver.status === "Upcoming" && (
              <span className="text-xs font-semibold text-blue-500">
                Assigned
              </span>
            )}
            {driver.status === "Available" && (
              <span className="text-xs font-semibold text-green-500">
                Available
              </span>
            )}
            {driver.status === "Ongoing" && (
              <span className="text-xs font-semibold text-red-500">
                Ongoing
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}
