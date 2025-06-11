import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp, 
  doc, 
  getDoc, 
  CollectionReference, 
  Query, 
  deleteDoc,
  updateDoc
} from "firebase/firestore";

// Define the fee structure interface
interface FeeStructure {
  id?: string;
  grade: string;
  tuitionFee: number;
  otherFee: number;
  totalFee: number;
  dueDate: string;
  createdAt?: any;
  updatedAt?: any;
}

// GET endpoint to retrieve fee structures
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const grade = searchParams.get("grade");
    
    const feeStructuresRef = collection(db, "feeStructures");
    let q: Query = query(feeStructuresRef);
    
    // If grade is provided, filter by grade
    if (grade) {
      q = query(feeStructuresRef, where("grade", "==", grade));
    }
    
    const snapshot = await getDocs(q);
    
    const feeStructures = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json(feeStructures);
  } catch (error) {
    console.error("Error fetching fee structures:", error);
    return NextResponse.json(
      { error: "Failed to fetch fee structures" },
      { status: 500 }
    );
  }
}

// POST endpoint to add a new fee structure
export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("Received data in API:", data);
    
    // Validate required fields
    if (!data.grade || !data.tuitionFee || data.tuitionFee <= 0) {
      console.log("Validation failed:", { grade: data.grade, tuitionFee: data.tuitionFee });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Create the fee structure object
    const feeStructure: FeeStructure = {
      grade: data.grade,
      tuitionFee: parseFloat(data.tuitionFee),
      otherFee: parseFloat(data.otherFee || 0),
      totalFee: parseFloat(data.tuitionFee) + parseFloat(data.otherFee || 0),
      dueDate: data.dueDate || '5th of every month',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    console.log("Fee structure object to save:", feeStructure);
    
    // Check if a fee structure already exists for this grade
    console.log("Checking for existing fee structure with grade:", data.grade);
    const existingFeeQuery = query(
      collection(db, "feeStructures"),
      where("grade", "==", data.grade)
    );
    
    const existingFeeSnapshot = await getDocs(existingFeeQuery);
    console.log("Existing fee snapshot empty?", existingFeeSnapshot.empty);
    
    if (!existingFeeSnapshot.empty) {
      console.log("Fee structure already exists for grade:", data.grade);
      return NextResponse.json(
        { error: `A fee structure for ${data.grade} already exists` },
        { status: 409 }
      );
    }
    
    // Add the new fee structure to the database
    console.log("Adding new fee structure to Firebase collection 'feeStructures'");
    const docRef = await addDoc(collection(db, "feeStructures"), feeStructure);
    console.log("Added document with ID:", docRef.id);
    
    return NextResponse.json(
      {
        id: docRef.id,
        ...feeStructure,
        message: "Fee structure added successfully"
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding fee structure:", error);
    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    const errorStack = error instanceof Error ? error.stack : "";
    return NextResponse.json(
      { 
        error: "Failed to add fee structure", 
        details: errorMessage,
        stack: errorStack 
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a fee structure
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "Fee structure ID is required" },
        { status: 400 }
      );
    }
    
    // Check if the fee structure exists
    const feeStructureRef = doc(db, "feeStructures", id);
    const feeStructureDoc = await getDoc(feeStructureRef);
    
    if (!feeStructureDoc.exists()) {
      return NextResponse.json(
        { error: "Fee structure not found" },
        { status: 404 }
      );
    }
    
    // Delete the fee structure
    await deleteDoc(feeStructureRef);
    
    return NextResponse.json(
      { message: "Fee structure deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting fee structure:", error);
    return NextResponse.json(
      { error: "Failed to delete fee structure" },
      { status: 500 }
    );
  }
}

// PUT endpoint to update a fee structure
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const data = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: "Fee structure ID is required" },
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!data.grade || !data.tuitionFee || data.tuitionFee <= 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Check if the fee structure exists
    const feeStructureRef = doc(db, "feeStructures", id);
    const feeStructureDoc = await getDoc(feeStructureRef);
    
    if (!feeStructureDoc.exists()) {
      return NextResponse.json(
        { error: "Fee structure not found" },
        { status: 404 }
      );
    }
    
    // Create the updated fee structure object
    const updatedFeeStructure = {
      grade: data.grade,
      tuitionFee: parseFloat(data.tuitionFee),
      otherFee: parseFloat(data.otherFee || 0),
      totalFee: parseFloat(data.tuitionFee) + parseFloat(data.otherFee || 0),
      dueDate: data.dueDate || '5th of every month',
      updatedAt: serverTimestamp()
    };
    
    // If grade is changed, check if a fee structure with the new grade already exists
    if (data.grade !== feeStructureDoc.data().grade) {
      const existingFeeQuery = query(
        collection(db, "feeStructures"),
        where("grade", "==", data.grade)
      );
      
      const existingFeeSnapshot = await getDocs(existingFeeQuery);
      
      if (!existingFeeSnapshot.empty) {
        return NextResponse.json(
          { error: `A fee structure for ${data.grade} already exists` },
          { status: 409 }
        );
      }
    }
    
    // Update the fee structure
    await updateDoc(feeStructureRef, updatedFeeStructure);
    
    return NextResponse.json(
      {
        id,
        ...updatedFeeStructure,
        message: "Fee structure updated successfully"
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating fee structure:", error);
    return NextResponse.json(
      { error: "Failed to update fee structure" },
      { status: 500 }
    );
  }
} 