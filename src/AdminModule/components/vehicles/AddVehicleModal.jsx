import React, { useState } from "react";

export default function AddVehicleModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    brand: "",
    model: "",
    plateNumber: "",
    year: "",
    dailyRate: "",
    status: "Available",
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!form.brand.trim()) newErrors.brand = "Brand is required";
    if (!form.model.trim()) newErrors.model = "Model is required";
    if (!form.plateNumber.trim()) newErrors.plateNumber = "License plate is required";
    return newErrors;
  };

  const handleSubmit = () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onAdd({
      brand: form.brand.trim(),
      model: form.model.trim(),
      plate_number: form.plateNumber.trim(),
      year: form.year ? Number(form.year) : new Date().getFullYear(),
      daily_rate: form.dailyRate ? Number(form.dailyRate) : 0,
      status: form.status,
    });
  };

  const field = (label, key, placeholder, type = "text") => (
    <div>
      <label className="block mb-1 font-medium">
        {label} {["brand", "model", "plateNumber"].includes(key) && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => {
          setForm({ ...form, [key]: e.target.value });
          if (errors[key]) setErrors({ ...errors, [key]: undefined });
        }}
        className={`w-full px-4 py-2 border rounded-md bg-gray-100 ${errors[key] ? "border-red-500" : "border-gray-300"}`}
      />
      {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-96 shadow-2xl max-h-screen overflow-y-auto">
        <h3 className="text-2xl font-bold mb-6 text-center">Add Vehicle</h3>

        <div className="space-y-4">
          {field("Brand / Make", "brand", "e.g. Toyota")}
          {field("Model", "model", "e.g. Fortuner")}
          {field("License Plate", "plateNumber", "e.g. ABC 1234")}
          {field("Year", "year", "e.g. 2022", "number")}
          {field("Daily Rate (PHP)", "dailyRate", "e.g. 1500", "number")}

          <div>
            <label className="block mb-1 font-medium">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
            >
              <option value="Available">Available</option>
              <option value="In Use">In Use</option>
              <option value="Reserved">Reserved</option>
              <option value="For Inspection">For Inspection</option>
              <option value="Under Repair">Under Repair</option>
              <option value="Finished Repair">Finished Repair</option>
            </select>
          </div>

          <p className="text-xs text-gray-500"><span className="text-red-500">*</span> Required fields</p>

          <div className="flex justify-center gap-4 mt-6">
            <button onClick={onClose} className="px-8 py-2 border-2 border-black rounded-full hover:bg-gray-100 font-medium">Cancel</button>
            <button onClick={handleSubmit} className="px-8 py-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 font-medium">Confirm</button>
          </div>
        </div>
      </div>
    </div>
  );
}
