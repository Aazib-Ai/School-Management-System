import { NextRequest, NextResponse } from "next/server";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 }
      );
    }

    // --- Check for Built-in Admin ---
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      // Hardcoded admin login (FOR TESTING ONLY)
      revalidatePath("/dashboard/admin/users")
      const response = NextResponse.json(
        {
          message: "Login successful",
          user: {
            uid: "admin_uid", // A placeholder UID for the admin
            email: process.env.ADMIN_EMAIL,
            role: "admin", // Set the role to admin
          },
        },
        { status: 200 }
      );
      
      // Set session cookie for admin
      response.cookies.set('session', 'admin_uid', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 // 7 days
      });
      
      return response;
    }
    // --- End of Built-in Admin Check ---

    // 1. Sign in with Firebase Authentication (for regular users)
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // 2. Fetch user data from Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return NextResponse.json(
        { error: "User data not found" },
        { status: 404 }
      ); // Should not happen normally
    }

    const userData = userDocSnap.data();

    // 3. (Optional) Check user status, role, etc.
    if (userData.status !== "active") {
      return NextResponse.json(
        { error: "Account inactive" },
        { status: 403 }
      ); // Or other appropriate status
    }
    revalidatePath("/dashboard/admin/users");
    
    // 4. Create response with user data
    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          uid: user.uid,
          email: user.email,
          role: userData.role,
          name: userData.name
        },
      },
      { status: 200 }
    );

    // 5. Set session cookie
    response.cookies.set('session', user.uid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
  } catch (error) {
    console.error("Signin error:", error);
    // Handle Firebase Authentication errors
    let errorMessage = "Login failed";
    if ((error as any).code === "auth/wrong-password") {
      errorMessage = "Invalid credentials";
    } else if ((error as any).code === "auth/user-not-found") {
      errorMessage = "User not found";
    }
    return NextResponse.json({ error: errorMessage }, { status: 401 }); // 401 Unauthorized
  }
} 