import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get("teacherId");

    if (!teacherId) {
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 });
    }

    // Query subjects where teacherId matches
    const subjectsRef = collection(db, "subjects");
    const q = query(subjectsRef, where("teacherId", "==", teacherId));
    const subjectsSnapshot = await getDocs(q);

    // Format the results with class information
    const subjects = await Promise.all(
      subjectsSnapshot.docs.map(async (subjectDoc) => {
        const subject = subjectDoc.data();
        let className = "";

        // Get class name if classId exists
        if (subject.classId) {
          try {
            const classDoc = await getDoc(doc(db, "classes", subject.classId));
            if (classDoc.exists()) {
              className = classDoc.data().className || classDoc.data().name || "";
            }
          } catch (error) {
            console.error("Error fetching class:", error);
          }
        }

        return {
          id: subjectDoc.id,
          subjectName: subject.subjectName,
          subjectCode: subject.subjectCode,
          classId: subject.classId,
          className: className,
          schedule: subject.schedule || "",
          room: subject.room || "",
          students: subject.students?.length || 0,
        };
      })
    );
    
    return NextResponse.json(subjects);
  } catch (error) {
    console.error("Error fetching teacher subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects", details: (error as Error).message },
      { status: 500 }
    );
  }
} 