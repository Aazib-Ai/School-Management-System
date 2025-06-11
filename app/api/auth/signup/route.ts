// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db, auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, getDocs, query, orderBy, limit, where } from "firebase/firestore"; // Import Firestore functions
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role, childName, parentName, grade } = await req.json(); // Add grade

    // --- ADMIN PROTECTION ---
    if (email.toLowerCase() === process.env.ADMIN_EMAIL) {
        return NextResponse.json(
            { error: "This email address is reserved." },
            { status: 403 }
        );
    }

    if (role === "admin") {
        return NextResponse.json(
            { error: "Cannot sign up as admin." },
            { status: 403 }
        );
    }
    // --- END ADMIN PROTECTION ---


    // Basic validation (expand as needed)
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    if (!["student", "teacher", "parent"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    if (role === "student" && (!parentName || !grade)) { // Add grade check
      return NextResponse.json(
        { error: "Parent's name and grade are required for students" },
        { status: 400 }
      );
    }
    if (role === "parent" && !childName) {
      return NextResponse.json(
        { error: "Child's name required for parents" },
        { status: 400 }
      );
    }


    // 1. Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // 2. Create user document in Firestore
    let userData: any = {
      uid: user.uid, // Use Firebase Auth UID as the document ID
      name,
      email,
      role,
      status: "active", // Set initial status to active
    };

    if (role === "student") {
      userData.parentName = parentName;
      userData.grade = grade; // Store the grade

      // --- Roll Number Generation ---
      const enrollmentMonth = new Date().getMonth() + 1; // 1-indexed (Jan = 1, Dec = 12)
      const enrollmentYear = new Date().getFullYear();
      const yearCode = String(enrollmentYear).slice(-2); // Last two digits of the year

      const gradePart = grade.replace(/[^0-9]/g, ""); // Keep ONLY digits.  This is the best option.
      let seasonCode = enrollmentMonth <= 6 ? "S" : "W"; // 'S' for Spring (Jan-Jun), 'W' for Winter (Jul-Dec)

      // Find the last student in the same grade and year to determine the sequence number
      const studentsRef = collection(db, "users");
      const q = query(
        studentsRef,
        where("role", "==", "student"),
        where("grade", "==", grade),
        where("enrollmentYear", "==", enrollmentYear), // Add enrollmentYear to the query
        orderBy("rollNumberSequence", "desc"),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      let sequenceNumber = 1;
      if (!querySnapshot.empty) {
          const lastStudent = querySnapshot.docs[0].data();
          sequenceNumber = (lastStudent.rollNumberSequence || 0) + 1; // Use 0 as default if rollNumberSequence is undefined.
      }

      const formattedSequenceNumber = String(sequenceNumber).padStart(4, "0");
      const rollNumber = `GD${gradePart}${seasonCode}${yearCode}${formattedSequenceNumber}`;

      userData.rollNumber = rollNumber;
        userData.rollNumberSequence = sequenceNumber; // Store the sequence number
        userData.enrollmentYear = enrollmentYear; // Store the enrollment year

      // --- End Roll Number Generation ---
    }

    if (role === "parent") {
      userData.childName = childName;
    }

    await setDoc(doc(db, "users", user.uid), userData);
    revalidatePath("/");

    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}