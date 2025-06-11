import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    // Get the session token from cookies - properly awaited
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the request body
    const data = await request.json();

    // Validate required fields
    if (!data.teacherId || !data.subjectId || !data.marks || data.marks.length === 0) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    try {
      // Add document to results collection with server timestamp
      const resultsRef = collection(db, "results");
      const docRef = await addDoc(resultsRef, {
        ...data,
        submittedAt: serverTimestamp(), // Use Firestore server timestamp
        createdAt: serverTimestamp(),
        status: "active" // Add a status field for potential future use
      });

      return NextResponse.json({
        success: true,
        id: docRef.id,
        message: "Marks saved successfully"
      });
    } catch (firestoreError) {
      console.error("Firestore Error:", firestoreError);
      return new NextResponse("Failed to save to database", { status: 500 });
    }

  } catch (error) {
    console.error("Error processing request:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 