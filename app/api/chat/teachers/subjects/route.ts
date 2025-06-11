import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get("teacherId");

    if (!teacherId) {
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 });
    }
    
    console.log(`Fetching subjects for teacher: ${teacherId}`);

    // Query subjects where teacherId matches
    const subjectsRef = collection(db, "subjects");
    const q = query(subjectsRef, where("teacherId", "==", teacherId));
    const subjectsSnapshot = await getDocs(q);
    console.log(`Found ${subjectsSnapshot.size} subjects in collection`);

    // Extract subject names
    const subjectNames: string[] = [];
    subjectsSnapshot.docs.forEach((doc) => {
      const subject = doc.data();
      if (subject.subjectName && !subjectNames.includes(subject.subjectName)) {
        subjectNames.push(subject.subjectName);
      }
    });
    
    // If no subjects found in subjects collection, fall back to user data
    if (subjectNames.length === 0) {
      console.log("No subjects found in subjects collection, checking user data");
      const userDoc = await getDoc(doc(db, "users", teacherId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        if (userData.subjects && Array.isArray(userData.subjects)) {
          // Use unique subjects from user data
          userData.subjects.forEach((subject: string) => {
            if (!subjectNames.includes(subject)) {
              subjectNames.push(subject);
            }
          });
        }
      }
      
      // If still no subjects, provide fallback
      if (subjectNames.length === 0) {
        subjectNames.push(...["Mathematics", "Science", "English", "History"]);
        console.log("Using fallback subjects");
      }
    }
    
    console.log(`Returning ${subjectNames.length} subjects:`, subjectNames);
    return NextResponse.json(subjectNames);
  } catch (error) {
    console.error("Error fetching teacher subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects", details: (error as Error).message },
      { status: 500 }
    );
  }
} 