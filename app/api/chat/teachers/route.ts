import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";

// GET: Fetch teachers for a specific student based on enrollment
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("studentId");
    
    console.log("Teachers API Request - studentId:", studentId);
    
    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    // First, try to get the student from the users collection
    const userDoc = await getDoc(doc(db, "users", studentId));
    
    if (!userDoc.exists()) {
      console.log(`Student with ID ${studentId} not found`);
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }
    
    const userData = userDoc.data();
    console.log(`Found student: ${userData.name}, Role: ${userData.role}, Class: ${userData.grade || userData.class}`);
    
    if (userData.role !== "student") {
      return NextResponse.json(
        { error: "User is not a student" },
        { status: 400 }
      );
    }
    
    const studentClass = userData.grade || userData.class;
    
    if (!studentClass) {
      console.log(`Student ${userData.name} does not have class information`);
      return NextResponse.json(
        { error: "Student class information not found" },
        { status: 404 }
      );
    }

    // Fetch teachers from users collection who have teacher role and teach this class
    const teachersRef = collection(db, "users");
    console.log(`Searching for teachers assigned to class: ${studentClass}`);
    const teachersQuery = query(
      teachersRef,
      where("role", "==", "teacher"),
      where("assignedClasses", "array-contains", studentClass)
    );
    
    let teachersSnapshot = await getDocs(teachersQuery);
    console.log(`Found ${teachersSnapshot.size} teachers assigned to class ${studentClass}`);
    
    // If no teachers found with the above query, try a simpler query for all teachers
    if (teachersSnapshot.empty) {
      console.log("No teachers found for the specific class, fetching all teachers...");
      const allTeachersQuery = query(
        teachersRef,
        where("role", "==", "teacher")
      );
      teachersSnapshot = await getDocs(allTeachersQuery);
      console.log(`Found ${teachersSnapshot.size} teachers in total`);
    }
    
    if (teachersSnapshot.empty) {
      console.log("No teachers found at all");
      return NextResponse.json({ teachers: [] });
    }
    
    const teachers = teachersSnapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`Teacher: ${data.name}, Subjects:`, data.subjects);
      
      return {
        id: doc.id,
        name: data.name,
        subject: data.subjects && data.subjects.length > 0 ? data.subjects[0] : "Teacher",
        email: data.email || "",
        avatar: data.profilePicture || null,
      };
    });

    console.log(`Returning ${teachers.length} teachers`);
    return NextResponse.json({ teachers });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json(
      { error: "Failed to fetch teachers" },
      { status: 500 }
    );
  }
} 