// app/api/admin/users/add/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache"; // Import revalidatePath

export async function POST(req: NextRequest) {
  try {
    const { name, email, role, status } = await req.json();

    // Basic validation
    if (!name || !email || !role || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }
    if (!["student", "teacher", "parent", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const usersRef = collection(db, "users");
    const docRef = await addDoc(usersRef, {
      name,
      email,
      role,
      status,
    });

    revalidatePath("/dashboard/admin/users"); // Add this line!

    return NextResponse.json({ id: docRef.id, message: 'User successfully added'  }, { status: 201 });//add message
  } catch (error) {
    console.error("Error adding user:", error);
    console.error(error); //log full error
    return NextResponse.json(
      { error: (error as Error).message }, // return specific error message
      { status: 500 },
    );
  }
}