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
    
    // Step 1: Fetch Student Data & Validate
    const studentClassId = userData.grade || userData.class; // Assuming 'grade' field stores the class ID
    const studentEnrolledSubjects = userData.enrolledSubjects;

    console.log(`Student Data: ID=${studentId}, Name=${userData.name}, ClassID=${studentClassId}, EnrolledSubjects=${JSON.stringify(studentEnrolledSubjects)}`);

    if (!studentClassId) {
      console.log(`Student ${userData.name} (${studentId}) does not have class information (grade/classId).`);
      return NextResponse.json({ teachers: [] }); // Return empty list as per requirement
    }

    if (!studentEnrolledSubjects || studentEnrolledSubjects.length === 0) {
      console.log(`Student ${userData.name} (${studentId}) has no enrolled subjects.`);
      return NextResponse.json({ teachers: [] }); // Return empty list
    }
    // Limit studentEnrolledSubjects to 30 for "in" query, though typically a student has fewer.
    if (studentEnrolledSubjects.length > 30) {
        console.warn(`Student ${studentId} has ${studentEnrolledSubjects.length} enrolled subjects. Truncating to 30 for query performance.`);
        studentEnrolledSubjects.splice(30);
    }

    console.log(`Processing request for student ${studentId} in class ${studentClassId} for subjects: ${studentEnrolledSubjects.join(", ")}`);

    // Step 2: Query 'subjects' Collection
    const subjectsRef = collection(db, "subjects");
    const subjectsQuery = query(
      subjectsRef,
      where("classId", "==", studentClassId),
      where("subjectName", "in", studentEnrolledSubjects)
    );

    const subjectsSnapshot = await getDocs(subjectsQuery);
    console.log(`Found ${subjectsSnapshot.size} entries in 'subjects' collection matching student's class and enrolled subjects.`);

    if (subjectsSnapshot.empty) {
      console.log("No relevant subject entries found linking teachers to this student's class/subjects.");
      return NextResponse.json({ teachers: [] });
    }

    // Step 3: Collect Teacher Information (teacherId -> Set<subjectName>)
    const teacherIdToSubjectsMap = new Map<string, Set<string>>();
    subjectsSnapshot.forEach(doc => {
      const subjectData = doc.data();
      const { teacherId, subjectName, classId } = subjectData;
      console.log(`  Matching subject entry: teacherId=${teacherId}, subjectName=${subjectName}, classId=${classId}`);
      if (teacherId && subjectName) {
        if (!teacherIdToSubjectsMap.has(teacherId)) {
          teacherIdToSubjectsMap.set(teacherId, new Set<string>());
        }
        teacherIdToSubjectsMap.get(teacherId)!.add(subjectName);
      }
    });

    const uniqueTeacherIds = Array.from(teacherIdToSubjectsMap.keys());
    if (uniqueTeacherIds.length === 0) {
      console.log("No valid teacherIds extracted from subject entries.");
      return NextResponse.json({ teachers: [] });
    }
    console.log(`Found ${uniqueTeacherIds.length} unique teacher ID(s): ${uniqueTeacherIds.join(", ")}`);
    console.log("Teacher ID to relevant subjects map:", Object.fromEntries(Array.from(teacherIdToSubjectsMap.entries()).map(([k, v]) => [k, Array.from(v)])));


    // Step 4: Fetch Teacher User Details
    const teachers: any[] = [];
    const MAX_IN_QUERY_ITEMS = 30; // Firestore 'in' query limit

    for (let i = 0; i < uniqueTeacherIds.length; i += MAX_IN_QUERY_ITEMS) {
        const chunkTeacherIds = uniqueTeacherIds.slice(i, i + MAX_IN_QUERY_ITEMS);
        if (chunkTeacherIds.length === 0) continue;

        console.log(`Fetching user details for teacher ID chunk: ${chunkTeacherIds.join(", ")}`);
        const usersQuery = query(
            collection(db, "users"),
            where("__name__", "in", chunkTeacherIds), // Query by document ID
            where("role", "==", "teacher")
        );
        const usersSnapshot = await getDocs(usersQuery);

        usersSnapshot.forEach(userDoc => {
            const teacherData = userDoc.data();
            const teacherId = userDoc.id;
            console.log(`  Fetched teacher user: ID=${teacherId}, Name=${teacherData.name}, Role=${teacherData.role}`);

            const relevantSubjectsSet = teacherIdToSubjectsMap.get(teacherId);
            const relevantSubjectsArray = relevantSubjectsSet ? Array.from(relevantSubjectsSet) : [];
            // Step 5: Format Response
            teachers.push({
                id: teacherId,
                name: teacherData.name,
                // Use specific subjects from the map, not teacherData.subjects
                subject: relevantSubjectsArray.join(", ") || "N/A",
                email: teacherData.email || "",
                avatar: teacherData.profilePicture || null,
                // For debugging, include the list of relevant subjects explicitly if needed
                // relevantStudentSubjects: relevantSubjectsArray
            });
        });
    }

    console.log(`Returning ${teachers.length} formatted teacher object(s) for student ${studentId}.`);
    return NextResponse.json({ teachers });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json(
      { error: "Failed to fetch teachers" },
      { status: 500 }
    );
  }
} 