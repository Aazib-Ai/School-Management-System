import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";

// GET: Fetch students for a specific teacher based on assigned classes and subjects
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const teacherId = searchParams.get("teacherId");
    const subject = searchParams.get("subject");
    
    console.log("API Request - teacherId:", teacherId, "subject:", subject);
    
    if (!teacherId) {
      return NextResponse.json(
        { error: "Teacher ID is required" },
        { status: 400 }
      );
    }

    // First, get the teacher from users collection
    const userDoc = await getDoc(doc(db, "users", teacherId));
    
    if (!userDoc.exists()) {
      console.log("Teacher not found:", teacherId);
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }
    
    const userData = userDoc.data();
    console.log("Teacher data:", JSON.stringify({
      role: userData.role,
      subjects: userData.subjects || [],
      assignedClasses: userData.assignedClasses || []
    }));
    
    if (userData.role !== "teacher") {
      return NextResponse.json(
        { error: "User is not a teacher" },
        { status: 400 }
      );
    }
    
    // Get teacher's subjects from the subjects collection
    const subjectsRef = collection(db, "subjects");
    const subjectsQuery = query(subjectsRef, where("teacherId", "==", teacherId));
    const subjectsSnapshot = await getDocs(subjectsQuery);
    
    let teacherSubjects: string[] = [];
    let assignedClasses: string[] = [];
    
    // Extract subject names and class IDs from the subjects collection
    subjectsSnapshot.docs.forEach(doc => {
      const subjectData = doc.data();
      if (subjectData.subjectName && !teacherSubjects.includes(subjectData.subjectName)) {
        teacherSubjects.push(subjectData.subjectName);
      }
      if (subjectData.classId && !assignedClasses.includes(subjectData.classId)) {
        assignedClasses.push(subjectData.classId);
      }
    });
    
    // If no subjects found in subjects collection, fall back to user data
    if (teacherSubjects.length === 0) {
      console.log("No subjects found in subjects collection, using fallback");
      teacherSubjects = userData.subjects || [];
      
      if (teacherSubjects.length === 0) {
        teacherSubjects = ["Mathematics", "Science", "English", "History"]; // Fallback subjects
        console.log("Using fallback subjects:", teacherSubjects);
      }
    }
    
    // If no classes found in subjects collection, fall back to user data
    if (assignedClasses.length === 0) {
      assignedClasses = userData.assignedClasses || [];
    }
    
    console.log("Teacher subjects from collection:", teacherSubjects);
    console.log("Assigned classes from collection:", assignedClasses);
    
    // Fetch students
    const studentsRef = collection(db, "users");
    let studentsQuery;
    
    // If a specific subject is requested, filter by that subject
    if (subject && subject !== "all") {
      console.log("Filtering students by subject:", subject);
      
      // First, find the class IDs for this subject
      const subjectClassesQuery = query(
        subjectsRef, 
        where("teacherId", "==", teacherId),
        where("subjectName", "==", subject)
      );
      
      const subjectClassesSnapshot = await getDocs(subjectClassesQuery);
      const subjectClassIds = subjectClassesSnapshot.docs.map(doc => doc.data().classId).filter(Boolean);
      
      console.log("Classes for this subject:", subjectClassIds);
      
      if (subjectClassIds.length > 0) {
        // Query students by class IDs
        studentsQuery = query(
          studentsRef,
          where("role", "==", "student"),
          where("grade", "in", subjectClassIds)
        );
      } else {
        // Fallback to enrolled subjects if no classes found
        studentsQuery = query(
          studentsRef,
          where("role", "==", "student"),
          where("enrolledSubjects", "array-contains", subject)
        );
      }
    } else {
      // Otherwise filter by assigned classes
      if (assignedClasses.length > 0) {
        console.log("Filtering students by classes:", assignedClasses);
        studentsQuery = query(
          studentsRef,
          where("role", "==", "student"),
          where("grade", "in", assignedClasses)
        );
      } else {
        // If no classes, get all students
        console.log("No assigned classes, fetching all students");
        studentsQuery = query(
          studentsRef,
          where("role", "==", "student")
        );
      }
    }
    
    const studentsSnapshot = await getDocs(studentsQuery);
    
    if (studentsSnapshot.empty) {
      console.log("No students found after filtering");
      return NextResponse.json({ 
        students: [],
        subjects: teacherSubjects
      });
    }
    
    console.log(`Found ${studentsSnapshot.size} students after filtering`);
    const students = studentsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      class: doc.data().grade || "Unknown Class",
      rollNumber: doc.data().rollNumber || "N/A",
      avatar: doc.data().profilePicture || null,
      subjects: doc.data().enrolledSubjects || []
    }));

    console.log("Returning response with subjects:", teacherSubjects);
    return NextResponse.json({ 
      students,
      subjects: teacherSubjects
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
} 