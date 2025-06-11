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
    
    const studentClass = userData.grade || userData.class; // Assuming 'grade' field stores the class ID
    const studentEnrolledSubjects = userData.enrolledSubjects;

    if (!studentClass) {
      console.log(`Student ${userData.name} (${studentId}) does not have class information (grade).`);
      return NextResponse.json({ error: "Student class information (grade) not found" }, { status: 400 });
    }

    if (!studentEnrolledSubjects || studentEnrolledSubjects.length === 0) {
      console.log(`Student ${userData.name} (${studentId}) has no enrolled subjects.`);
      // It's valid for a student to have no enrolled subjects yet, so return empty list of teachers.
      return NextResponse.json({ teachers: [] });
    }

    console.log(`Fetching teachers for student ${studentId} in class ${studentClass} and subjects: ${studentEnrolledSubjects.join(", ")}`);

    // Query the 'subjects' collection
    const subjectsRef = collection(db, "subjects");
    const subjectsQuery = query(
      subjectsRef,
      where("classId", "==", studentClass),
      where("subjectName", "in", studentEnrolledSubjects)
    );

    const subjectsSnapshot = await getDocs(subjectsQuery);
    console.log(`Found ${subjectsSnapshot.size} subject documents matching student's class and enrolled subjects.`);

    if (subjectsSnapshot.empty) {
      console.log("No relevant subject documents found for the student's criteria.");
      return NextResponse.json({ teachers: [] });
    }

    const teacherIds = new Set<string>();
    subjectsSnapshot.forEach(doc => {
      const subjectData = doc.data();
      if (subjectData.teacherId) {
        teacherIds.add(subjectData.teacherId);
      }
    });

    if (teacherIds.size === 0) {
      console.log("No teacherIds found in the relevant subject documents.");
      return NextResponse.json({ teachers: [] });
    }
    
    console.log(`Found ${teacherIds.size} unique teacher ID(s): ${Array.from(teacherIds).join(", ")}`);

    // Fetch teacher details from 'users' collection
    const teachers: any[] = [];
    // Firestore 'in' query supports up to 30 elements. If more, chunking is needed.
    // For simplicity, assuming teacherIds.size will be manageable.
    // If teacherIds.size can be very large, this part needs to be updated to handle >30 IDs.
    const teacherIdsArray = Array.from(teacherIds);
    if (teacherIdsArray.length > 0) {
        // Max 30 items for "in" query in Firestore. Chunk if necessary.
        const MAX_IN_QUERY_ITEMS = 30;
        for (let i = 0; i < teacherIdsArray.length; i += MAX_IN_QUERY_ITEMS) {
            const chunk = teacherIdsArray.slice(i, i + MAX_IN_QUERY_ITEMS);
            if (chunk.length === 0) continue;

            const teachersQuery = query(
                collection(db, "users"),
                where("__name__", "in", chunk), // Query by document ID
                where("role", "==", "teacher")
            );
            const teachersSnapshot = await getDocs(teachersQuery);

            teachersSnapshot.forEach(doc => {
                const data = doc.data();
                console.log(`Fetched teacher: ${data.name}, Role: ${data.role}`);
                teachers.push({
                    id: doc.id,
                    name: data.name,
                    // The concept of a single "subject" for a teacher is ambiguous here,
                    // as a teacher can teach multiple subjects.
                    // For now, we can list their primary subject or just identify them as a teacher.
                    // Or, more accurately, the client might use the student's subject context.
                    subject: data.subjects && data.subjects.length > 0 ? data.subjects.join(", ") : "Teacher",
                    email: data.email || "",
                    avatar: data.profilePicture || null,
                });
            });
        }
    }

    console.log(`Returning ${teachers.length} teachers for student ${studentId}.`);
    return NextResponse.json({ teachers });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json(
      { error: "Failed to fetch teachers" },
      { status: 500 }
    );
  }
} 