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
    
<<<<<<< HEAD
    // The `assignedClasses` variable derived above is a general list of all classes the teacher is associated with.
    // We will re-evaluate which class IDs to use for student filtering based on the specific subject selected, if any.
    console.log("Initial teacher subjects for UI filter:", teacherSubjects);
    // console.log("Initial assigned classes (all subjects) for teacher:", assignedClasses);

    const studentsRef = collection(db, "users");
    let studentList: any[] = [];
    let targetClassIds: string[] = [];

    if (subject && subject !== "all") {
      console.log(`Filtering students for teacher ${teacherId} and subject: ${subject}`);
      
      // 1. Query 'subjects' collection for teacherId AND subjectName
      const specificSubjectClassesQuery = query(
        subjectsRef, 
        where("teacherId", "==", teacherId),
        where("subjectName", "==", subject)
      );
      const specificSubjectClassesSnapshot = await getDocs(specificSubjectClassesQuery);
      
      // 2. Collect unique classIds from these records
      const classIdsForSubject = [...new Set(specificSubjectClassesSnapshot.docs.map(doc => doc.data().classId).filter(Boolean))];
      console.log(`Teacher ${teacherId} teaches subject ${subject} in classIds: ${classIdsForSubject.join(", ") || "None"}`);

      // 3. If no such classIds, return empty list
      if (classIdsForSubject.length === 0) {
        console.log(`No classes found where teacher ${teacherId} teaches subject ${subject}. Returning empty student list.`);
        return NextResponse.json({ students: [], subjects: teacherSubjects });
      }
      targetClassIds = classIdsForSubject;

      // 4. Query 'users' for students
      // Firestore 'in' query limit is 30. Assume targetClassIds won't exceed this for a teacher/subject.
      if (targetClassIds.length > 0) {
        const studentsQuery = query(
          studentsRef,
          where("role", "==", "student"),
          where("grade", "in", targetClassIds),
          // 5. Additionally, ensure student is enrolled in the subject
          where("enrolledSubjects", "array-contains", subject)
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        console.log(`Found ${studentsSnapshot.size} students in classes [${targetClassIds.join(", ")}] and enrolled in subject ${subject}.`);

        // If the above compound query is too restrictive or not supported perfectly across all Firestore versions/setups for 'in' + 'array-contains'
        // an alternative is to query by classIds and then filter by enrolledSubjects in code.
        // For now, we assume the compound query works as intended by Firestore for this specific case.
        // If issues arise, the filtering step would be:
        // studentList = studentsSnapshot.docs
        //   .map(doc => ({ id: doc.id, ...doc.data() }))
        //   .filter(s => s.enrolledSubjects && s.enrolledSubjects.includes(subject));
        // console.log(`Filtered down to ${studentList.length} students after checking enrolledSubjects in code.`);

        studentList = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data()}));

      }

    } else { // subject is "all" or not provided
      console.log(`Fetching all students for teacher ${teacherId}`);

      // 1. Query 'subjects' for all records for the teacherId (already done via subjectsSnapshot earlier)
      // 2. Collect all unique classIds (already done as `assignedClasses` from the initial block, but let's re-derive for clarity or use it)
      // For clarity, re-derive from the initial full subjectsSnapshot for the teacher
      const allClassIdsForTeacher = [...new Set(subjectsSnapshot.docs.map(doc => doc.data().classId).filter(Boolean))];

      console.log(`Teacher ${teacherId} teaches in all of these classIds: ${allClassIdsForTeacher.join(", ") || "None"}`);

      // 3. If no such classIds, return empty list
      if (allClassIdsForTeacher.length === 0) {
        console.log(`Teacher ${teacherId} is not associated with any classes. Returning empty student list.`);
        return NextResponse.json({ students: [], subjects: teacherSubjects });
      }
      targetClassIds = allClassIdsForTeacher;

      // 4. Query 'users' for students
      // Firestore 'in' query limit is 30. Assume targetClassIds won't exceed this for a teacher.
      if (targetClassIds.length > 0) {
        // Chunking targetClassIds if it can exceed 30
        const MAX_IN_QUERY_SIZE = 30;
        for (let i = 0; i < targetClassIds.length; i += MAX_IN_QUERY_SIZE) {
            const chunkClassIds = targetClassIds.slice(i, i + MAX_IN_QUERY_SIZE);
            if (chunkClassIds.length === 0) continue;

            const studentsQuery = query(
                studentsRef,
                where("role", "==", "student"),
                where("grade", "in", chunkClassIds)
            );
            const studentsSnapshot = await getDocs(studentsQuery);
            console.log(`Found ${studentsSnapshot.size} students in classes chunk [${chunkClassIds.join(", ")}].`);
            studentsSnapshot.forEach(doc => studentList.push({ id: doc.id, ...doc.data() }));
        }
      }
    }
    
    if (studentList.length === 0) {
      console.log("No students found matching criteria.");
      return NextResponse.json({ 
        students: [],
        subjects: teacherSubjects
      });
    }
    
    console.log(`Total ${studentList.length} students found after filtering.`);
    const students = studentList.map(s_data => ({ // Renamed 'data' to 's_data' for clarity
      id: s_data.id,
      name: s_data.name,
      class: s_data.grade || "Unknown Class",
      rollNumber: s_data.rollNumber || "N/A",
      avatar: s_data.profilePicture || null,
      subjects: s_data.enrolledSubjects || []
    }));
=======
    // Step 1 (Preserved): teacherSubjects is populated for the UI dropdown.
    // Renaming teacherSubjects to teacherSubjectNames for clarity as it holds names.
    const teacherSubjectNames = teacherSubjects;
    console.log("Teacher's subject names for UI filter dropdown:", teacherSubjectNames);
>>>>>>> fe7c02c8a431c18a6174a4221e68ffcff5f0592d

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