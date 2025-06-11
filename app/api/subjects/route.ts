import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    if (!classId) {
      return NextResponse.json(
        { error: "Class ID is required" },
        { status: 400 }
      );
    }

    // Create a query to get all subjects for the specified class
    const subjectsRef = collection(db, "subjects");
    const q = query(
      subjectsRef, 
      where("classId", "==", classId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    
    // Map the documents to our Subject type
    const subjects = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        subjectName: data.subjectName || "",
        subjectCode: data.subjectCode || "",
        teacherId: data.teacherId || "",
        classId: data.classId || "",
        teacher: data.teacher || "",
        schedule: data.schedule || "",
        room: data.room || "",
        isAvailableForEnrollment: data.isAvailableForEnrollment || false,
        isVisibleToStudents: data.isVisibleToStudents || false,
        status: data.status || "active",
        students: data.students || 0,
        createdAt: data.createdAt || null
      };
    });

    return NextResponse.json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects", details: (error as Error).message },
      { status: 500 }
    );
  }
} 