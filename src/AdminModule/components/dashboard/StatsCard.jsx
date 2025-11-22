import React from "react";

export default function StatsCard({ title, leftValue, leftLabel, rightValue, rightLabel }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <h3 className="text-center font-semibold mb-4 text-sm md:text-lg">{title}</h3>
      <div className="flex justify-around mb-6">
        <div className="text-center">
          <div className="text-3xl md:text-5xl font-bold text-green-600">{leftValue}</div>
          <div className="text-xs md:text-sm text-gray-600 mt-1">{leftLabel}</div>
        </div>
        {rightValue !== "" && (
          <div className="text-center">
            <div className="text-3xl md:text-5xl font-bold text-blue-500">{rightValue}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">{rightLabel}</div>
          </div>
        )}
      </div>
    </div>
  );
}
