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
    // Step 2: Get enrolledSubjects (array of subject document IDs)
    const enrolledSubjectIds = userData.enrolledSubjects; // This is now an array of subject document IDs
    console.log(`Student ${studentId} enrolled subject document IDs: ${JSON.stringify(enrolledSubjectIds)}`);

    // Step 3: Validate enrolledSubjects
    if (!Array.isArray(enrolledSubjectIds) || enrolledSubjectIds.length === 0) {
      console.log(`Student ${studentId} has no enrolled subject IDs or 'enrolledSubjects' is not an array.`);
      return NextResponse.json({ teachers: [] });
    }
    
    // Step 4: Fetch subject documents and prepare teacherId-to-subjectName mapping
    const teacherIdToSubjectNamesMap = new Map<string, Set<string>>();
    
    // Create a list of promises to fetch subject documents
    const subjectDocsPromises = enrolledSubjectIds.map(subjectId => {
      if (typeof subjectId !== 'string' || subjectId.trim() === '') {
        console.warn(`Invalid subjectId found: "${subjectId}" in student ${studentId}'s enrolled list. Skipping.`);
        return Promise.resolve(null); // Return a resolved promise with null for invalid IDs
      }
      return getDoc(doc(db, "subjects", subjectId.trim()));
    });

    const subjectDocSnaps = await Promise.all(subjectDocsPromises);
    console.log(`Attempted to fetch ${enrolledSubjectIds.length} subject documents. Received ${subjectDocSnaps.length} results (some might be null or not found).`);

    let validSubjectDocsFound = 0;
    for (const subjectDocSnap of subjectDocSnaps) {
      if (subjectDocSnap && subjectDocSnap.exists()) {
        validSubjectDocsFound++;
        const subjectData = subjectDocSnap.data();
        const fetchedSubjectId = subjectDocSnap.id;
        // 4b. Extract teacherId and subjectName
        const { teacherId, subjectName } = subjectData; // classId is available but not used for filtering teachers per new req.
        console.log(`  Processing Subject Doc ID: ${fetchedSubjectId}, Data: teacherId=${teacherId}, subjectName=${subjectName}`);
        if (teacherId && subjectName) {
          if (!teacherIdToSubjectNamesMap.has(teacherId)) {
            teacherIdToSubjectNamesMap.set(teacherId, new Set<string>());
          }
          teacherIdToSubjectNamesMap.get(teacherId)!.add(subjectName);
        } else {
          console.warn(`  Subject Doc ID: ${fetchedSubjectId} is missing 'teacherId' or 'subjectName'.`);
        }
      } else {
        // Logging for subject IDs that didn't yield a document
        // This is harder to pinpoint which ID failed without mapping back, but Promise.all maintains order
        // For now, a general warning is issued if counts don't match.
      }
    }
    console.log(`Successfully fetched and processed ${validSubjectDocsFound} valid subject documents.`);

    // Step 5: Collect unique teacherIds
    const uniqueTeacherIds = Array.from(teacherIdToSubjectNamesMap.keys());
    console.log(`Unique teacher IDs collected: ${JSON.stringify(uniqueTeacherIds)}`);
    if (uniqueTeacherIds.length > 0) {
        console.log("Teacher ID to their relevant student subjects map:",
            Object.fromEntries(Array.from(teacherIdToSubjectNamesMap.entries()).map(([k, v]) => [k, Array.from(v)]))
        );
    }

    // Step 6: If no unique teacherIds, return empty list
    if (uniqueTeacherIds.length === 0) {
      console.log("No unique teacher IDs found after processing student's enrolled subject documents.");
      return NextResponse.json({ teachers: [] });
    }

    // Step 7: Fetch teacher user documents
    const teachersList: any[] = [];
    const MAX_IN_QUERY_ITEMS = 30;

    for (let i = 0; i < uniqueTeacherIds.length; i += MAX_IN_QUERY_ITEMS) {
        const teacherIdsChunk = uniqueTeacherIds.slice(i, i + MAX_IN_QUERY_ITEMS);
        if (teacherIdsChunk.length === 0) continue;

        console.log(`Fetching user details for teacher ID chunk: ${teacherIdsChunk.join(", ")}`);
        const usersQuery = query(
            collection(db, "users"),
            where("__name__", "in", teacherIdsChunk),
            where("role", "==", "teacher")
        );
        const teachersSnapshot = await getDocs(usersQuery);

        teachersSnapshot.forEach(teacherUserDoc => {
            const teacherUserData = teacherUserDoc.data();
            const teacherId = teacherUserDoc.id;
            console.log(`  Fetched teacher user: ID=${teacherId}, Name=${teacherUserData.name}`);

            // Step 8: Construct final list of teacher objects
            const relevantSubjectNamesSet = teacherIdToSubjectNamesMap.get(teacherId);
            const subjectNamesString = relevantSubjectNamesSet
                ? Array.from(relevantSubjectNamesSet).join(", ")
                : "N/A";

            teachersList.push({
                id: teacherId,
                name: teacherUserData.name,
                subject: subjectNamesString,
                avatar: teacherUserData.profilePicture || null,
                // email: teacherUserData.email || "" // Email can be added if needed by frontend
            });
        });
    }

    console.log(`Returning ${teachersList.length} formatted teacher object(s) for student ${studentId}.`);
    return NextResponse.json({ teachers: teachersList });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json(
      { error: "Failed to fetch teachers" },
      { status: 500 }
    );
  }
}