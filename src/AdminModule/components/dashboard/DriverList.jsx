import React from "react";

export default function DriverList({ drivers }) {
  if (!drivers || drivers.length === 0) {
    return <div className="text-center text-gray-500">No drivers yet</div>;
  }

  return (
    <>
      {drivers.map((driver, index) => {
        const fullName = `${driver.lastName}, ${driver.firstName} ${driver.middleName}`;

        return (
          <div
            key={index}
            className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0"
          >
            <span className="text-xs font-medium truncate">
              {fullName}
            </span>

            {/* Status dot (still green for now) */}
            <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
          </div>
        );
      })}
    </>
  );
}
