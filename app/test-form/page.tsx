"use client";

import { useState, useEffect, FormEvent } from "react";

export default function TestForm() {
  const [grade, setGrade] = useState("");
  const [tuitionFee, setTuitionFee] = useState("");
  const [otherFee, setOtherFee] = useState("");
  const [dueDate, setDueDate] = useState("5th of every month");
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiResult, setApiResult] = useState<any>(null);

  useEffect(() => {
    fetchFeeStructures();
  }, []);

  const fetchFeeStructures = async () => {
    try {
      setLoading(true);
      console.log("Fetching fee structures...");
      
      const response = await fetch('/api/fees/structure');
      console.log("API Response status:", response.status);
      
      const data = await response.json();
      console.log("API Response data:", data);
      
      if (Array.isArray(data)) {
        setFeeStructures(data);
      } else {
        console.error("Unexpected data format:", data);
        setFeeStructures([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching fee structures:", error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      console.log("Submitting form with values:", { grade, tuitionFee, otherFee, dueDate });
      
      // Validate form data
      if (!grade || !tuitionFee) {
        alert("Please fill in required fields: Grade and Tuition Fee");
        setLoading(false);
        return;
      }
      
      const formData = {
        grade: grade,
        tuitionFee: parseFloat(tuitionFee),
        otherFee: parseFloat(otherFee || "0"),
        dueDate: dueDate
      };
      
      console.log("Sending form data to API:", formData);
      
      const response = await fetch('/api/fees/structure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      console.log("API Response status:", response.status);
      const result = await response.json();
      console.log("API Response data:", result);
      
      setApiResult(result);
      
      if (response.ok) {
        alert("Fee structure added successfully!");
        // Reset form on success
        setGrade("");
        setTuitionFee("");
        setOtherFee("");
        setDueDate("5th of every month");
        // Refresh fee structures
        fetchFeeStructures();
      } else {
        alert(`Error: ${result.error || "Unknown error occurred"}`);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`);
      setApiResult({ error: String(error) });
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      console.log("Deleting fee structure with ID:", id);
      
      const response = await fetch(`/api/fees/structure?id=${id}`, {
        method: 'DELETE'
      });
      
      console.log("API Response status:", response.status);
      const result = await response.json();
      console.log("API Response data:", result);
      
      setApiResult(result);
      
      if (response.ok) {
        // Refresh fee structures
        fetchFeeStructures();
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error deleting fee structure:", error);
      setApiResult({ error: String(error) });
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Fee Structure Test Form</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4 mb-8 p-4 border rounded-lg">
        <div>
          <label className="block mb-1">
            Grade:
            <select 
              value={grade} 
              onChange={(e) => setGrade(e.target.value)}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select Grade</option>
              {["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", 
                "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10"].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </label>
        </div>
        
        <div>
          <label className="block mb-1">
            Tuition Fee:
            <input 
              type="number" 
              value={tuitionFee} 
              onChange={(e) => setTuitionFee(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </label>
        </div>
        
        <div>
          <label className="block mb-1">
            Other Fee:
            <input 
              type="number" 
              value={otherFee} 
              onChange={(e) => setOtherFee(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </label>
        </div>
        
        <div>
          <label className="block mb-1">
            Due Date:
            <input 
              type="text" 
              value={dueDate} 
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </label>
        </div>
        
        <button 
          type="submit" 
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Loading..." : "Submit"}
        </button>
      </form>
      
      {apiResult && (
        <div className="mb-8 p-4 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold mb-2">API Result:</h2>
          <pre className="whitespace-pre-wrap bg-white p-2 rounded border">
            {JSON.stringify(apiResult, null, 2)}
          </pre>
        </div>
      )}
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Existing Fee Structures</h2>
        {loading ? (
          <p>Loading...</p>
        ) : feeStructures.length > 0 ? (
          <div className="grid gap-4">
            {feeStructures.map((fee) => (
              <div key={fee.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">{fee.grade}</h3>
                  <button
                    onClick={() => handleDelete(fee.id)}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded"
                  >
                    Delete
                  </button>
                </div>
                <p>Tuition Fee: ${fee.tuitionFee}</p>
                <p>Other Fee: ${fee.otherFee}</p>
                <p>Total Fee: ${fee.totalFee}</p>
                <p>Due Date: {fee.dueDate}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No fee structures found</p>
        )}
      </div>
    </div>
  );
} 