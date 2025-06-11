import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  Timestamp,
  DocumentData,
  doc,
  getDoc,
  limit,
  deleteDoc
} from "firebase/firestore";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { cookies } from "next/headers";

// Helper function to get the authenticated user from either NextAuth or custom session
async function getAuthenticatedUser(request: NextRequest) {
  console.log("Checking authentication for request:", request.url);
  
  try {
    // First try to get user from NextAuth session
    const session = await getServerSession(authOptions);
    console.log("NextAuth session check result:", !!session);
    
    if (session?.user) {
      console.log("User authenticated via NextAuth:", session.user.id, session.user.role);
      return {
        id: session.user.id,
        role: session.user.role,
        name: session.user.name
      };
    }
    
    // If NextAuth session doesn't exist, try with custom session cookie
    const sessionCookie = request.cookies.get('session');
    console.log("Session cookie present:", !!sessionCookie);
    
    if (sessionCookie?.value) {
      try {
        // Check if this is the admin_uid session from the login route
        if (sessionCookie.value === 'admin_uid') {
          console.log("Found built-in admin session cookie");
          return {
            id: 'admin_uid',
            role: 'admin',
            name: 'Admin User'
          };
        }
        
        // Otherwise, verify the user from Firestore
        const userId = sessionCookie.value;
        console.log("Attempting to verify user from session cookie:", userId);
        
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          console.log("User authenticated via session cookie:", userId, userData.role);
          return {
            id: userId,
            role: userData.role,
            name: userData.name
          };
        } else {
          console.log("User document not found for ID:", userId);
        }
      } catch (error) {
        console.error("Error getting user from session cookie:", error);
      }
    }
    
    // Try checking NextAuth.js session cookie directly as last resort
    const nextAuthSessionCookie = request.cookies.get('next-auth.session-token') || 
                                request.cookies.get('__Secure-next-auth.session-token');
    
    if (nextAuthSessionCookie?.value) {
      console.log("Found NextAuth session cookie, but unable to decode it directly");
      console.log("Consider using the API route /api/auth/me instead to verify authentication");
    }
    
    // No authenticated user found
    console.error("Authentication failed: No valid user session found");
    
    // Debug: Log all cookies
    console.log("All available cookies:", request.cookies.getAll().map(c => c.name));
    
    return null;
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}

// Helper function to format the voucher number
function generateVoucherNumber(year: number, month: number, rollNumber: string) {
  return `V-${year}-${String(month).padStart(2, '0')}-${rollNumber}`;
}

// Helper function to format voucher data from Firestore
function formatVoucher(doc: DocumentData) {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    issueDate: data.issueDate instanceof Timestamp 
      ? data.issueDate.toDate().toISOString().split('T')[0]
      : data.issueDate,
    dueDate: data.dueDate instanceof Timestamp 
      ? data.dueDate.toDate().toISOString().split('T')[0]
      : data.dueDate,
    createdAt: data.createdAt instanceof Timestamp 
      ? data.createdAt.toDate().toISOString()
      : null
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    let user = await getAuthenticatedUser(request);
    
    // If still no user, try hardcoded admin for development
    if (!user && process.env.NODE_ENV === 'development') {
      console.log("No authenticated user found, but running in development mode");
      console.log("Using development admin account for testing");
      
      // Hardcoded admin for development testing only
      user = {
        id: 'admin_development',
        role: 'admin',
        name: 'Development Admin'
      };
      
      // Try looking for an actual admin in the database
      try {
        const adminQuery = query(
          collection(db, "users"), 
          where("role", "==", "admin"),
          limit(1)
        );
        const adminSnapshot = await getDocs(adminQuery);
        
        if (!adminSnapshot.empty) {
          const adminDoc = adminSnapshot.docs[0];
          user = {
            id: adminDoc.id,
            role: 'admin',
            name: adminDoc.data().name || 'Admin User'
          };
          console.log("Found actual admin user:", user.id, user.name);
        }
      } catch (err) {
        console.error("Error finding admin user:", err);
      }
    }
    
    if (!user) {
      console.error("Authentication failed: No authenticated user found");
      
      // Return a more detailed error message
      return NextResponse.json({ 
        error: "Unauthorized", 
        details: "You must be logged in to access this resource. Please check your session cookies.",
        troubleshooting: "Try logging out and logging back in. Clear your browser cookies if issues persist."
      }, { status: 401 });
    }

    // Verify that the user is an admin
    if (user.role !== "admin") {
      console.error(`Authorization failed: User ${user.id} is not an admin (role: ${user.role})`);
      return NextResponse.json({ error: "Forbidden: Only admins can generate vouchers" }, { status: 403 });
    }

    const data = await request.json();
    const { classId, month, message } = data;
    
    console.log(`Admin ${user.id} requesting to create vouchers for class ${classId} and month ${month}`);

    // Validate required fields
    if (!classId || !month) {
      return NextResponse.json(
        { error: "Class ID and month are required" },
        { status: 400 }
      );
    }

    // Handle month in various formats (e.g., "march-2025" or "2025-03")
    let year, monthNum;
    
    // Try to parse the value as "YYYY-MM" format
    const yearMonthMatch = month.match(/^(\d{4})-(\d{1,2})$/);
    if (yearMonthMatch) {
      year = parseInt(yearMonthMatch[1]);
      monthNum = parseInt(yearMonthMatch[2]);
    } else {
      // Try to parse as "monthName-YYYY" format
      const monthYearMatch = month.match(/^([a-zA-Z]+)-(\d{4})$/);
      if (monthYearMatch) {
        const monthName = monthYearMatch[1].toLowerCase();
        year = parseInt(monthYearMatch[2]);
        
        // Convert month name to number
        const monthNames = ["january", "february", "march", "april", "may", "june", 
                           "july", "august", "september", "october", "november", "december"];
        monthNum = monthNames.indexOf(monthName) + 1;
        
        if (monthNum === 0) {
          return NextResponse.json(
            { error: `Invalid month name: ${monthName}` },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Invalid month format. Should be YYYY-MM or monthName-YYYY" },
          { status: 400 }
        );
      }
    }
    
    if (isNaN(year) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { error: "Invalid month or year values" },
        { status: 400 }
      );
    }

    // Get all students in the specified class
    const studentsRef = collection(db, "users");
    const studentQuery = query(
      studentsRef, 
      where("classId", "==", classId),
      where("role", "==", "student")
    );
    const studentSnapshot = await getDocs(studentQuery);

    if (studentSnapshot.empty) {
      console.log(`No students found in class with ID: ${classId}`);
      
      // Try alternative query based on class grade
      // First get the class details to find the grade
      const classDocRef = doc(db, "classes", classId);
      const classDocSnap = await getDoc(classDocRef);
      
      if (!classDocSnap.exists()) {
        return NextResponse.json(
          { error: "Class not found" },
          { status: 404 }
        );
      }
      
      const classData = classDocSnap.data();
      console.log(`Found class: ${classData.className}, grade: ${classData.grade}`);
      
      // Query students by grade
      const gradeStudentQuery = query(
        studentsRef, 
        where("grade", "==", classData.grade),
        where("role", "==", "student")
      );
      
      const gradeStudentSnapshot = await getDocs(gradeStudentQuery);
      
      if (gradeStudentSnapshot.empty) {
        return NextResponse.json(
          { error: "No students found in this class or grade" },
          { status: 404 }
        );
      }
      
      console.log(`Found ${gradeStudentSnapshot.size} students in grade ${classData.grade}`);
      // Continue with the grade-based student snapshot
      
      // Get the fee structure for the class/grade
      const feeStructureRef = collection(db, "feeStructures");
      const feeQuery = query(feeStructureRef, where("grade", "==", classData.grade));
      const feeSnapshot = await getDocs(feeQuery);

      if (feeSnapshot.empty) {
        console.log(`No fee structure found for grade ${classData.grade}, creating a default one`);
        
        // Create a default fee structure for this grade
        const defaultFeeStructure = {
          grade: classData.grade,
          tuitionFee: 5000, // Default tuition fee amount
          otherFee: 1000,   // Default other fee amount
          totalFee: 6000,   // Default total
          dueDate: '15th of every month',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        try {
          // Add the default fee structure
          const feeStructureDocRef = await addDoc(collection(db, "feeStructures"), defaultFeeStructure);
          console.log(`Created default fee structure for grade ${classData.grade} with ID: ${feeStructureDocRef.id}`);
          
          // Use this structure for generating vouchers
          const feeStructure = defaultFeeStructure;
          const feeAmount = feeStructure.totalFee;
          
          // Calculate due date (15th of the specified month)
          const dueDate = new Date(year, monthNum - 1, 15);
          
          // Create vouchers for each student
          const vouchersRef = collection(db, "vouchers");
          const createdVouchers = [];
          
          for (const studentDoc of gradeStudentSnapshot.docs) {
            const student = studentDoc.data();
            
            // Check if voucher already exists for this student and month
            const existingVoucherQuery = query(
              vouchersRef, 
              where("studentId", "==", studentDoc.id),
              where("month", "==", month)
            );
            const existingVoucherSnapshot = await getDocs(existingVoucherQuery);
            
            if (!existingVoucherSnapshot.empty) {
              // Skip this student, voucher already exists
              continue;
            }
            
            const rollNumber = student.rollNumber || studentDoc.id.substring(0, 6);
            const voucherNumber = generateVoucherNumber(year, monthNum, rollNumber);
            
            const voucher = {
              studentId: studentDoc.id,
              studentName: student.name,
              rollNumber: rollNumber,
              classId,
              className: classData.className,
              month,
              amount: feeAmount,
              issueDate: new Date().toISOString().split('T')[0],
              dueDate: dueDate.toISOString().split('T')[0],
              status: "Pending",
              voucherNumber,
              message: message || "",
              createdAt: serverTimestamp(),
              createdBy: user.id,
            };
            
            const docRef = await addDoc(vouchersRef, voucher);
            createdVouchers.push({ id: docRef.id, ...voucher });
          }
          
          return NextResponse.json({
            success: true,
            message: `Successfully created ${createdVouchers.length} vouchers with default fee structure`,
            vouchers: createdVouchers
          });
          
        } catch (feeError) {
          console.error(`Error creating default fee structure for grade ${classData.grade}:`, feeError);
          return NextResponse.json(
            { error: `No fee structure found for grade ${classData.grade} and failed to create default` },
            { status: 500 }
          );
        }
      }

      // Get the fee structure for the class/grade
      const feeStructure = feeSnapshot.docs[0].data();
      const feeAmount = feeStructure.totalFee || (feeStructure.tuitionFee + feeStructure.otherFee);

      // Calculate due date (15th of the specified month)
      const dueDate = new Date(year, monthNum - 1, 15);

      // Create vouchers for each student
      const vouchersRef = collection(db, "vouchers");
      const createdVouchers = [];

      for (const studentDoc of gradeStudentSnapshot.docs) {
        const student = studentDoc.data();
        
        // Check if voucher already exists for this student and month
        const existingVoucherQuery = query(
          vouchersRef, 
          where("studentId", "==", studentDoc.id),
          where("month", "==", month)
        );
        const existingVoucherSnapshot = await getDocs(existingVoucherQuery);
        
        if (!existingVoucherSnapshot.empty) {
          // Skip this student, voucher already exists
          continue;
        }
        
        const rollNumber = student.rollNumber || studentDoc.id.substring(0, 6);
        const voucherNumber = generateVoucherNumber(year, monthNum, rollNumber);
        
        const voucher = {
          studentId: studentDoc.id,
          studentName: student.name,
          rollNumber: rollNumber,
          classId,
          className: classData.className,
          month,
          amount: feeAmount,
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: dueDate.toISOString().split('T')[0],
          status: "Pending",
          voucherNumber,
          message: message || "",
          createdAt: serverTimestamp(),
          createdBy: user.id,
        };
        
        const docRef = await addDoc(vouchersRef, voucher);
        createdVouchers.push({ id: docRef.id, ...voucher });
      }

      return NextResponse.json({
        success: true,
        message: `Successfully created ${createdVouchers.length} vouchers`,
        vouchers: createdVouchers
      });
    }

    // Get the fee structure for the class/grade
    const classRef = collection(db, "classes");
    const classQuery = query(classRef, where("id", "==", classId));
    const classSnapshot = await getDocs(classQuery);

    if (classSnapshot.empty) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    const classData = classSnapshot.docs[0].data();
    const grade = classData.grade;
    console.log(`Using grade ${grade} from class ${classData.className} for fee structure lookup`);

    // Get fee structure
    const feeStructureRef = collection(db, "feeStructures");
    const feeQuery = query(feeStructureRef, where("grade", "==", grade));
    const feeSnapshot = await getDocs(feeQuery);

    if (feeSnapshot.empty) {
      console.log(`No fee structure found for grade ${grade}, creating a default one`);
      
      // Create a default fee structure for this grade
      const defaultFeeStructure = {
        grade: grade,
        tuitionFee: 5000, // Default tuition fee amount
        otherFee: 1000,   // Default other fee amount
        totalFee: 6000,   // Default total
        dueDate: '15th of every month',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      try {
        // Add the default fee structure
        const feeStructureDocRef = await addDoc(collection(db, "feeStructures"), defaultFeeStructure);
        console.log(`Created default fee structure for grade ${grade} with ID: ${feeStructureDocRef.id}`);
        
        // Use this structure for generating vouchers
        const feeStructure = defaultFeeStructure;
        const feeAmount = feeStructure.totalFee;
        
        // Calculate due date (15th of the specified month)
        const dueDate = new Date(year, monthNum - 1, 15);
        
        // Continue with voucher generation
        // Create vouchers for each student
        const vouchersRef = collection(db, "vouchers");
        const createdVouchers = [];

        for (const studentDoc of studentSnapshot.docs) {
          const student = studentDoc.data();
          
          // Check if voucher already exists for this student and month
          const existingVoucherQuery = query(
            vouchersRef, 
            where("studentId", "==", studentDoc.id),
            where("month", "==", month)
          );
          const existingVoucherSnapshot = await getDocs(existingVoucherQuery);
          
          if (!existingVoucherSnapshot.empty) {
            // Skip this student, voucher already exists
            continue;
          }
          
          const rollNumber = student.rollNumber || studentDoc.id.substring(0, 6);
          const voucherNumber = generateVoucherNumber(year, monthNum, rollNumber);
          
          const voucher = {
            studentId: studentDoc.id,
            studentName: student.name,
            rollNumber: rollNumber,
            classId,
            className: classData.className,
            month,
            amount: feeAmount,
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: dueDate.toISOString().split('T')[0],
            status: "Pending",
            voucherNumber,
            message: message || "",
            createdAt: serverTimestamp(),
            createdBy: user.id,
          };
          
          const docRef = await addDoc(vouchersRef, voucher);
          createdVouchers.push({ id: docRef.id, ...voucher });
        }

        return NextResponse.json({
          success: true,
          message: `Successfully created ${createdVouchers.length} vouchers with default fee structure`,
          vouchers: createdVouchers
        });
        
      } catch (feeError) {
        console.error(`Error creating default fee structure for grade ${grade}:`, feeError);
        return NextResponse.json(
          { error: `No fee structure found for grade ${grade} and failed to create default` },
          { status: 500 }
        );
      }
    }

    // Get the fee structure for the class/grade
    const feeStructure = feeSnapshot.docs[0].data();
    const feeAmount = feeStructure.totalFee || (feeStructure.tuitionFee + feeStructure.otherFee);

    // Calculate due date (15th of the specified month)
    const dueDate = new Date(year, monthNum - 1, 15);

    // Create vouchers for each student
    const vouchersRef = collection(db, "vouchers");
    const createdVouchers = [];

    for (const studentDoc of studentSnapshot.docs) {
      const student = studentDoc.data();
      
      // Check if voucher already exists for this student and month
      const existingVoucherQuery = query(
        vouchersRef, 
        where("studentId", "==", studentDoc.id),
        where("month", "==", month)
      );
      const existingVoucherSnapshot = await getDocs(existingVoucherQuery);
      
      if (!existingVoucherSnapshot.empty) {
        // Skip this student, voucher already exists
        continue;
      }
      
      const rollNumber = student.rollNumber || studentDoc.id.substring(0, 6);
      const voucherNumber = generateVoucherNumber(year, monthNum, rollNumber);
      
      const voucher = {
        studentId: studentDoc.id,
        studentName: student.name,
        rollNumber: rollNumber,
        classId,
        className: classData.className,
        month,
        amount: feeAmount,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        status: "Pending",
        voucherNumber,
        message: message || "",
        createdAt: serverTimestamp(),
        createdBy: user.id,
      };
      
      const docRef = await addDoc(vouchersRef, voucher);
      createdVouchers.push({ id: docRef.id, ...voucher });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdVouchers.length} vouchers`,
      vouchers: createdVouchers
    });
  } catch (error) {
    console.error("Error generating vouchers:", error);
    return NextResponse.json(
      { error: "Failed to generate vouchers" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    let user = await getAuthenticatedUser(request);
    
    // If still no user, try hardcoded admin for development
    if (!user && process.env.NODE_ENV === 'development') {
      console.log("No authenticated user found, but running in development mode");
      console.log("Using development admin account for testing");
      
      // Hardcoded admin for development testing only
      user = {
        id: 'admin_development',
        role: 'admin',
        name: 'Development Admin'
      };
      
      // Try looking for an actual admin in the database
      try {
        const adminQuery = query(
          collection(db, "users"), 
          where("role", "==", "admin"),
          limit(1)
        );
        const adminSnapshot = await getDocs(adminQuery);
        
        if (!adminSnapshot.empty) {
          const adminDoc = adminSnapshot.docs[0];
          user = {
            id: adminDoc.id,
            role: 'admin',
            name: adminDoc.data().name || 'Admin User'
          };
          console.log("Found actual admin user:", user.id, user.name);
        }
      } catch (err) {
        console.error("Error finding admin user:", err);
      }
    }
    
    if (!user) {
      console.error("Authentication failed: No authenticated user found");
      
      // Return a more detailed error message
      return NextResponse.json({ 
        error: "Unauthorized", 
        details: "You must be logged in to access this resource. Please check your session cookies.",
        troubleshooting: "Try logging out and logging back in. Clear your browser cookies if issues persist."
      }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const classId = searchParams.get("classId");
    const month = searchParams.get("month");
    
    console.log(`User ${user.id} (role: ${user.role}) requesting vouchers with params:`, 
                { studentId, classId, month });

    const vouchersRef = collection(db, "vouchers");
    let voucherQuery;

    // Build query based on provided parameters
    if (studentId) {
      // Check if the requesting user is an admin or the student
      if (user.id !== studentId && user.role !== "admin") {
        console.error(`Authorization failed: User ${user.id} (role: ${user.role}) attempted to access vouchers for student ${studentId}`);
        return NextResponse.json(
          { error: "Forbidden: You can only view your own vouchers" },
          { status: 403 }
        );
      }

      voucherQuery = query(vouchersRef, where("studentId", "==", studentId));
    } else if (classId && month) {
      // Only admins can query by class and month
      if (user.role !== "admin") {
        console.error(`Authorization failed: User ${user.id} (role: ${user.role}) attempted to access vouchers by class and month`);
        return NextResponse.json(
          { error: "Forbidden: Only admins can query vouchers by class" },
          { status: 403 }
        );
      }

      voucherQuery = query(
        vouchersRef,
        where("classId", "==", classId),
        where("month", "==", month)
      );
    } else if (classId) {
      // Only admins can query by class
      if (user.role !== "admin") {
        console.error(`Authorization failed: User ${user.id} (role: ${user.role}) attempted to access vouchers by class`);
        return NextResponse.json(
          { error: "Forbidden: Only admins can query vouchers by class" },
          { status: 403 }
        );
      }

      voucherQuery = query(vouchersRef, where("classId", "==", classId));
    } else if (user.role === "admin") {
      // Allow admin users to fetch all vouchers
      console.log(`Admin ${user.id} requesting all vouchers`);
      voucherQuery = query(vouchersRef);
    } else {
      return NextResponse.json(
        { error: "Missing required parameters: studentId or classId" },
        { status: 400 }
      );
    }

    const voucherSnapshot = await getDocs(voucherQuery);
    
    // Format and return vouchers
    const vouchers = voucherSnapshot.docs.map(formatVoucher);
    console.log(`Returning ${vouchers.length} vouchers for the request`);

    return NextResponse.json(vouchers);
  } catch (error) {
    console.error("Error fetching vouchers:", error);
    return NextResponse.json(
      { error: "Failed to fetch vouchers" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    let user = await getAuthenticatedUser(request);
    console.log("Authentication result for DELETE request:", user ? `${user.id} (${user.role})` : "No user found");
    
    // If still no user, try hardcoded admin for development
    if (!user && process.env.NODE_ENV === 'development') {
      console.log("No authenticated user found, but running in development mode");
      console.log("Using development admin account for testing");
      
      // Hardcoded admin for development testing only
      user = {
        id: 'admin_development',
        role: 'admin',
        name: 'Development Admin'
      };
      
      // Try looking for an actual admin in the database
      try {
        const adminQuery = query(
          collection(db, "users"), 
          where("role", "==", "admin"),
          limit(1)
        );
        const adminSnapshot = await getDocs(adminQuery);
        
        if (!adminSnapshot.empty) {
          const adminDoc = adminSnapshot.docs[0];
          user = {
            id: adminDoc.id,
            role: 'admin',
            name: adminDoc.data().name || 'Admin User'
          };
          console.log("Found actual admin user:", user.id, user.name);
        }
      } catch (err) {
        console.error("Error finding admin user:", err);
      }
    }
    
    // Special check for admin_uid session cookie since we know this is the admin from .env.local
    const sessionCookie = request.cookies.get('session');
    if (sessionCookie?.value === 'admin_uid' && !user) {
      console.log("Found admin_uid cookie, setting admin user explicitly");
      user = {
        id: 'admin_uid',
        role: 'admin',
        name: 'Admin User'
      };
    }
    
    if (!user) {
      console.error("Authentication failed: No authenticated user found");
      
      // Log all available cookies for debugging
      console.log("All cookies:", request.cookies.getAll().map(c => `${c.name}=${c.value}`).join('; '));
      
      return NextResponse.json({ 
        error: "Unauthorized", 
        details: "You must be logged in to access this resource."
      }, { status: 401 });
    }

    // Verify the user is an admin
    if (user.role !== "admin") {
      console.error(`Authorization failed: User ${user.id} is not an admin (role: ${user.role})`);
      return NextResponse.json({ 
        error: "Forbidden: Only admins can delete vouchers" 
      }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const voucherId = searchParams.get("id");
    
    if (!voucherId) {
      return NextResponse.json(
        { error: "Voucher ID is required" },
        { status: 400 }
      );
    }

    console.log(`Admin ${user.id} requesting to delete voucher: ${voucherId}`);

    // Check if voucher exists
    const voucherRef = doc(db, "vouchers", voucherId);
    const voucherSnap = await getDoc(voucherRef);
    
    if (!voucherSnap.exists()) {
      return NextResponse.json(
        { error: "Voucher not found" },
        { status: 404 }
      );
    }

    try {
      // Delete the voucher
      await deleteDoc(voucherRef);
      console.log(`Successfully deleted voucher ${voucherId}`);
      
      // Always return a proper JSON response with status 200
      return NextResponse.json({ 
        success: true, 
        message: "Voucher deleted successfully",
        voucherId: voucherId
      }, {
        status: 200, 
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (deleteError) {
      console.error(`Error deleting voucher ${voucherId}:`, deleteError);
      return NextResponse.json({ 
        error: "Failed to delete voucher", 
        details: (deleteError as Error).message 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in DELETE voucher handler:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete voucher",
        details: (error as Error).message || "Unknown error occurred"
      },
      { status: 500 }
    );
  }
} 