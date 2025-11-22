import React, { useState, useEffect } from "react";

export default function NotificationForm() {
  const [plates, setPlates] = useState([]);
  const [fuel, setFuel] = useState("");
  const [mileage, setMileage] = useState(["", "", "", "", ""]);
  const [plate, setPlate] = useState("");
  const [issue, setIssue] = useState("");
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  // Load plates from database
  useEffect(() => {
    const loadPlates = async () => {
      try {
        const res = await fetch("/.netlify/functions/getPlates");
        const data = await res.json();
        setPlates(data.map((row) => row.plate_number));
      } catch (err) {
        console.error("Failed to load plates", err);
      }
    };
    loadPlates();
  }, []);

  const validate = () => {
    const errs = {};
    if (!fuel) errs.fuel = "Please select a fuel amount";
    if (mileage.some((m) => !m)) errs.mileage = "Please enter the current mileage";
    if (!plate) errs.plate = "Please select a plate number";
    return errs;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);

    if (Object.keys(errs).length === 0) {
      try {
        const response = await fetch("/.netlify/functions/sendNotification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fuel,
            mileage: mileage.join(""),
            plate,
            issue,
          }),
        });

        if (!response.ok) throw new Error("Failed to send notification");

        setSent(true);
        setTimeout(() => setSent(false), 2000);

        // Reset form
        setFuel("");
        setMileage(["", "", "", "", ""]);
        setPlate("");
        setIssue("");
      } catch (err) {
        console.error(err);
        alert("Failed to send notification. Please try again.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center w-full p-4 font-sans">
      <h1 className="text-2xl font-semibold mb-6">Send Notifications</h1>

      <form
        onSubmit={handleSend}
        className="bg-white rounded-lg shadow-md p-8 flex flex-col gap-4 w-full max-w-md"
      >
        <div>
          <label className="font-medium mb-1 block">Fuel Amount</label>
          <select
            value={fuel}
            onChange={(e) => setFuel(e.target.value)}
            className={`w-full p-2 rounded border ${
              errors.fuel ? "border-red-600" : "border-gray-800"
            } bg-gray-100`}
          >
            <option value="">Select fuel amount</option>
            <option>Full</option>
            <option>Half Empty</option>
            <option>Empty</option>
          </select>
          {errors.fuel && <span className="text-red-600 text-sm">{errors.fuel}</span>}
        </div>

        <div>
          <label className="font-medium mb-1 block">Mileage</label>
          <div className="flex gap-2">
            {mileage.map((m, i) => (
              <input
                key={i}
                type="text"
                maxLength={1}
                value={m}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setMileage(mileage.map((v, idx) => (idx === i ? val : v)));
                }}
                className={`w-10 text-center p-2 border rounded ${
                  errors.mileage ? "border-red-600" : "border-gray-800"
                }`}
              />
            ))}
          </div>
          {errors.mileage && <span className="text-red-600 text-sm">{errors.mileage}</span>}
        </div>

        <div>
          <label className="font-medium mb-1 block">Plate Number</label>
          <select
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            className={`w-full p-2 rounded border ${
              errors.plate ? "border-red-600" : "border-gray-800"
            } bg-gray-100`}
          >
            <option value="">Select plate number</option>

            {plates.length === 0 && <option disabled>Loading...</option>}

            {plates.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          {errors.plate && <span className="text-red-600 text-sm">{errors.plate}</span>}
        </div>

        <div>
          <label className="font-medium mb-1 block">Issue</label>
          <input
            type="text"
            placeholder="Optional issue description"
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            className="w-full p-2 rounded border border-gray-800 bg-gray-100"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-900 text-white p-3 rounded font-semibold hover:bg-blue-800 transition"
        >
          Send
        </button>
      </form>

      {sent && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-yellow-100 border-4 border-green-800 rounded-lg p-10 flex flex-col items-center relative max-w-sm w-full">
            <span
              className="absolute top-2 right-3 text-2xl cursor-pointer"
              onClick={() => setSent(false)}
            >
              &times;
            </span>
            <div className="text-green-800 text-4xl mb-8">&#10004;</div>
            <div className="text-green-800 text-xl font-semibold text-center">
              Sent Successfully
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
