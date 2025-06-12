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
    
    // Step 1 (Preserved): teacherSubjects is populated for the UI dropdown.
    // Renaming teacherSubjects to teacherSubjectNames for clarity as it holds names.
    const teacherSubjectNames = teacherSubjects;
    console.log("Teacher's subject names for UI filter dropdown:", teacherSubjectNames);

    let subjectIdsToQueryEnrollments: string[] = [];

    // Step 2 & 3: Determine relevant subject IDs (doc IDs from 'subjects' collection)
    if (subject && subject !== "all") {
      console.log(`Specific subject filter selected: teacherId=${teacherId}, subjectName=${subject}`);
      // Query 'subjects' collection for specific subjectName taught by this teacher
      // subjectsRef and subjectsSnapshot are already available from Step 1 logic
      const specificSubjectDocs = subjectsSnapshot.docs.filter(
        doc => doc.data().subjectName === subject && doc.data().teacherId === teacherId
      );
      subjectIdsToQueryEnrollments = specificSubjectDocs.map(doc => doc.id);
      console.log(`Found ${subjectIdsToQueryEnrollments.length} subject document(s) for subjectName '${subject}' taught by teacher ${teacherId}: IDs=[${subjectIdsToQueryEnrollments.join(", ")}]`);
    } else {
      console.log(`"All subjects" filter selected for teacherId=${teacherId}`);
      // Use all subject documents already fetched for this teacher (subjectsSnapshot)
      subjectIdsToQueryEnrollments = subjectsSnapshot.docs.map(doc => doc.id);
      console.log(`Found ${subjectIdsToQueryEnrollments.length} total subject document(s) for teacher ${teacherId}: IDs=[${subjectIdsToQueryEnrollments.join(", ")}]`);
    }

    if (subjectIdsToQueryEnrollments.length === 0) {
      console.log("No subject documents found for the teacher based on the filter. Returning empty student list.");
      return NextResponse.json({ students: [], subjects: teacherSubjectNames });
    }

    // Step 2e, 2f, 3e: Query 'enrollments' collection
    const uniqueStudentIds = new Set<string>();
    const enrollmentsRef = collection(db, "enrollments");

    // Using 'in' query for enrollments, chunking if necessary
    const MAX_SUBJECT_IDS_PER_ENROLLMENT_QUERY = 30; // Firestore 'in' query limit
    for (let i = 0; i < subjectIdsToQueryEnrollments.length; i += MAX_SUBJECT_IDS_PER_ENROLLMENT_QUERY) {
        const subjectIdsChunk = subjectIdsToQueryEnrollments.slice(i, i + MAX_SUBJECT_IDS_PER_ENROLLMENT_QUERY);
        if (subjectIdsChunk.length === 0) continue;

        console.log(`Querying enrollments for subjectId(s) chunk: [${subjectIdsChunk.join(", ")}]`);
        const enrollmentQuery = query(enrollmentsRef, where("subjectId", "in", subjectIdsChunk));
        const enrollmentSnap = await getDocs(enrollmentQuery);
        console.log(`  Found ${enrollmentSnap.size} enrollments for this chunk of subjectId(s).`);
        enrollmentSnap.forEach(enrollDoc => {
            const studentId = enrollDoc.data().studentId;
            if (studentId) {
                uniqueStudentIds.add(studentId);
                console.log(`    Added studentId: ${studentId} from enrollment ${enrollDoc.id} (subjectId: ${enrollDoc.data().subjectId})`);
            } else {
                console.warn(`    Enrollment document ${enrollDoc.id} is missing studentId.`);
            }
        });
    }

    // Step 2g, 2h: Check if any students found
    if (uniqueStudentIds.size === 0) {
      console.log("No students found enrolled (via enrollments collection) in the specified subject(s) for this teacher.");
      return NextResponse.json({ students: [], subjects: teacherSubjectNames });
    }

    const studentIdsArray = Array.from(uniqueStudentIds);
    console.log(`Total unique student IDs found from enrollments: ${studentIdsArray.length}, IDs=[${studentIdsArray.join(", ")}]`);

    // Step 2i: Fetch full user details for each studentId
    const studentProfiles: any[] = [];
    const usersRef = collection(db, "users");
    const MAX_STUDENT_IDS_PER_USER_QUERY = 30; // Firestore 'in' query limit

    for (let i = 0; i < studentIdsArray.length; i += MAX_STUDENT_IDS_PER_USER_QUERY) {
        const studentIdsChunk = studentIdsArray.slice(i, i + MAX_STUDENT_IDS_PER_USER_QUERY);
        if (studentIdsChunk.length === 0) continue;

        console.log(`Fetching user details for student ID chunk: [${studentIdsChunk.join(", ")}]`);
        const usersQuery = query(
            usersRef,
            where("__name__", "in", studentIdsChunk),
            where("role", "==", "student") // Ensure they are students
        );
        const usersSnapshot = await getDocs(usersQuery);
        console.log(`  Fetched ${usersSnapshot.size} student profiles for this chunk.`);
        usersSnapshot.forEach(userDoc => {
            const studentData = userDoc.data();
            studentProfiles.push({
                id: userDoc.id,
                name: studentData.name,
                class: studentData.grade || "Unknown Class", // Assuming 'grade' is class display info
                rollNumber: studentData.rollNumber || "N/A",
                avatar: studentData.profilePicture || null,
                // subjects: studentData.enrolledSubjects || [] // This might be subject names or IDs, ensure consistency if used
            });
        });
    }
    console.log(`Successfully fetched ${studentProfiles.length} student profiles.`);

    // Step 2j: Return students and teacher's subject names
    console.log("Returning response with students and teacher's subject names.");
    return NextResponse.json({ 
      students: studentProfiles,
      subjects: teacherSubjectNames // Preserved from Step 1
    });

  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}
// Remnants of old logic removed. File ends after the GET function's closing brace.