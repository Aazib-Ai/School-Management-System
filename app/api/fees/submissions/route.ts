import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, getDoc, DocumentData } from "firebase/firestore";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const status = searchParams.get("status");

    // Query the submissions collection
    const submissionsRef = collection(db, "submissions");
    let submissionQuery = query(submissionsRef);

    // Apply filters
    if (studentId) {
      submissionQuery = query(submissionQuery, where("studentId", "==", studentId));
    }

    if (status) {
      submissionQuery = query(submissionQuery, where("status", "==", status));
    }

    const submissionSnapshot = await getDocs(submissionQuery);

    // Map submissions to include student and voucher details
    const submissions = await Promise.all(submissionSnapshot.docs.map(async (docSnapshot) => {
      const data = docSnapshot.data();
      
      // Get student details
      let studentName = "Unknown Student";
      let studentData: any = {};
      
      if (data.studentId) {
        const studentDocRef = doc(db, "users", data.studentId);
        const studentDocSnap = await getDoc(studentDocRef);
        
        if (studentDocSnap.exists()) {
          studentData = studentDocSnap.data();
          studentName = studentData.name || `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim();
        }
      }
      
      // Get voucher details if available
      let voucherData: any = {};
      if (data.voucherId) {
        const voucherDocRef = doc(db, "vouchers", data.voucherId);
        const voucherDocSnap = await getDoc(voucherDocRef);
        
        if (voucherDocSnap.exists()) {
          voucherData = voucherDocSnap.data();
        }
      }
      
      return {
        id: docSnapshot.id,
        studentId: data.studentId || "",
        voucherNumber: voucherData?.voucherNumber || "",
        studentName: studentName,
        rollNumber: studentData.rollNumber || "",
        class: studentData.grade || "",
        amount: voucherData?.amount || data.amount || 0,
        month: voucherData?.month || "",
        status: data.status || "Pending",
        paymentMethod: data.paymentMethod || "",
        submissionDate: data.submittedAt ? new Date(data.submittedAt.toDate()).toISOString().split('T')[0] : "",
        paymentProof: data.paymentProof || null,
      };
    }));

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
} 