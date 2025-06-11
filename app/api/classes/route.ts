import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, getDoc, doc, where } from "firebase/firestore";
import { Class } from "@/types";

export async function GET(req: NextRequest) {
  try {
    // Create a query to get all classes ordered by creation date
    const classesRef = collection(db, "classes");
    const q = query(classesRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    // Map the documents to our Class type and fetch teacher info
    const classesPromises = querySnapshot.docs.map(async (classDoc) => {
      const data = classDoc.data();
      let teacherName = "";
      
      // Fetch teacher info if teacherId exists
      if (data.teacherId) {
        const teacherRef = doc(db, "users", data.teacherId);
        const teacherDoc = await getDoc(teacherRef);
        if (teacherDoc.exists()) {
          const teacherData = teacherDoc.data();
          teacherName = teacherData?.name || "";
        }
      }

      // Count students in this class
      const studentsQuery = query(
        collection(db, "users"),
        where("grade", "==", data.grade),
        where("role", "==", "student")
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentCount = studentsSnapshot.size;

      // Get subjects for this class
      const subjectsQuery = query(
        collection(db, "subjects"),
        where("classId", "==", classDoc.id)
      );
      const subjectsSnapshot = await getDocs(subjectsQuery);
      const subjects = subjectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        id: classDoc.id,
        className: data.className || "",
        teacherId: data.teacherId || "",
        grade: data.grade || "",
        room: data.room || "",
        capacity: data.capacity || 0,
        academicYear: data.academicYear || "",
        status: data.status || "active",
        students: studentCount,
        subjects: subjects,
        teacher: teacherName,
        createdAt: data.createdAt || null
      };
    });

    const classes = await Promise.all(classesPromises);
    return NextResponse.json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes", details: (error as Error).message },
      { status: 500 }
    );
  }
} 