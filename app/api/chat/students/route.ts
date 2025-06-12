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