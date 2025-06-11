"use client";

import { useState, useEffect } from "react";

// Define the fee structure interface
interface FeeStructure {
  id?: string;
  grade: string;
  tuitionFee: number;
  otherFee: number;
  totalFee?: number;
  dueDate: string;
  createdAt?: any;
  updatedAt?: any;
}

export default function TestPage() {
  const [grade, setGrade] = useState("1");
  const [tuitionFee, setTuitionFee] = useState("1000");
  const [otherFee, setOtherFee] = useState("200");
  const [dueDate, setDueDate] = useState("5th of every month");
  const [result, setResult] = useState("");
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);

  useEffect(() => {
    fetchFeeStructures();
  }, []);

  const fetchFeeStructures = async () => {
    try {
      console.log("Fetching fee structures...");
      const response = await fetch('/api/fees/structure');
      const data = await response.json();
      console.log("Fetched fee structures:", data);
      setFeeStructures(data);
    } catch (error) {
      console.error('Error fetching fee structures:', error);
      setResult(JSON.stringify(error));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      console.log("Submitting form with data:", { grade, tuitionFee, otherFee, dueDate });
      
      // Parse numeric values
      const parsedTuitionFee = parseFloat(tuitionFee);
      const parsedOtherFee = parseFloat(otherFee);
      
      // Create form data
      const formData = {
        grade,
        tuitionFee: parsedTuitionFee,
        otherFee: parsedOtherFee,
        dueDate
      };
      
      console.log("Sending API request with data:", formData);
      
      const response = await fetch('/api/fees/structure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      console.log("API response:", data);
      
      setResult(JSON.stringify(data, null, 2));
      
      if (response.ok) {
        // Clear form and refresh list
        setGrade("1");
        setTuitionFee("1000");
        setOtherFee("200");
        setDueDate("5th of every month");
        fetchFeeStructures();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setResult(JSON.stringify(error, null, 2));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Add Fee Structure</h2>
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md">
            <div>
              <label className="block mb-1">Grade:</label>
              <select 
                value={grade} 
                onChange={(e) => setGrade(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => (
                  <option key={g} value={g.toString()}>{g}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block mb-1">Tuition Fee:</label>
              <input 
                type="number" 
                value={tuitionFee} 
                onChange={(e) => setTuitionFee(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block mb-1">Other Fee:</label>
              <input 
                type="number" 
                value={otherFee} 
                onChange={(e) => setOtherFee(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block mb-1">Due Date:</label>
              <input 
                type="text" 
                value={dueDate} 
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <button 
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Fee Structure
            </button>
          </form>
          
          {result && (
            <div className="mt-4 p-4 border rounded-md bg-gray-50">
              <h3 className="font-semibold mb-2">API Response:</h3>
              <pre className="whitespace-pre-wrap overflow-auto">{result}</pre>
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-2">Existing Fee Structures</h2>
          <div className="space-y-4">
            {feeStructures.length === 0 ? (
              <p>No fee structures found.</p>
            ) : (
              feeStructures.map((fee, index) => (
                <div key={fee.id || index} className="p-4 border rounded-md">
                  <h3 className="font-semibold">Grade {fee.grade}</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <span className="text-gray-500">Tuition Fee:</span> ${fee.tuitionFee}
                    </div>
                    <div>
                      <span className="text-gray-500">Other Fee:</span> ${fee.otherFee}
                    </div>
                    <div>
                      <span className="text-gray-500">Total Fee:</span> ${fee.totalFee ?? (fee.tuitionFee + fee.otherFee)}
                    </div>
                    <div>
                      <span className="text-gray-500">Due Date:</span> {fee.dueDate}
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end space-x-2">
                    <button 
                      onClick={() => {
                        // Delete fee structure
                        if (window.confirm('Are you sure you want to delete this fee structure?')) {
                          fetch(`/api/fees/structure?id=${fee.id}`, { method: 'DELETE' })
                            .then(res => res.json())
                            .then(() => fetchFeeStructures())
                            .catch(err => console.error(err));
                        }
                      }}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 