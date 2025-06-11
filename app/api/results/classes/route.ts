import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // Get the session token from cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch all results to determine available classes
    const resultsRef = collection(db, "results");
    const querySnapshot = await getDocs(resultsRef);
    
    const classes = new Map();
    
    // Process results to extract classes and subjects
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      
      if (data.className) {
        // Create a class ID from the class name
        const classId = data.className.toLowerCase().replace(/\s+/g, '-');
        
        if (!classes.has(classId)) {
          classes.set(classId, {
            id: classId,
            name: data.className,
            subjects: new Map()
          });
        }
        
        // Add subject to this class
        const classData = classes.get(classId);
        if (data.subjectName && data.subjectCode) {
          classData.subjects.set(data.subjectCode, {
            id: data.subjectCode,
            name: data.subjectName
          });
        }
      }
    });
    
    // Convert Map to arrays for the response
    const classesArray = Array.from(classes.values()).map(classData => ({
      id: classData.id,
      name: classData.name,
      subjects: Array.from(classData.subjects.values())
    }));

    return NextResponse.json({
      classes: classesArray
    });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 