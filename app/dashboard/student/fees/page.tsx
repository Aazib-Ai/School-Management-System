"use client"

import { SelectItem } from "@/components/ui/select"

import { SelectContent } from "@/components/ui/select"

import { SelectValue } from "@/components/ui/select"

import { SelectTrigger } from "@/components/ui/select"

import { Select } from "@/components/ui/select"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CreditCard, Download, Upload, FileText, Loader2, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

// Define fee structure interface
interface FeeStructure {
  id?: string;
  grade: string;
  tuitionFee: number;
  otherFee: number;
  totalFee: number;
  dueDate: string;
}

// Define voucher interface
interface Voucher {
  id: string;
  studentId: string;
  studentName?: string;
  rollNumber?: string;
  classId?: string;
  className?: string;
  month: string;
  amount: number;
  dueDate: string;
  issueDate: string;
  status: "Pending" | "Paid" | "Overdue" | "Verifying";
  voucherNumber: string;
  paymentDate?: string;
}

// Define submission interface
interface Submission {
  id: string;
  voucherId: string;
  voucherNumber: string;
  studentId: string;
  studentName?: string;
  month: string;
  amount: number;
  paymentDate: string;
  submissionDate: string;
  paymentMethod: string;
  paymentProof: string;
  notes?: string;
  status: "Pending" | "Verified" | "Rejected" | "Verifying";
  receiptNumber?: string;
}

export default function FeesPage() {
  const [activeTab, setActiveTab] = useState("current")
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showVoucherDialog, setShowVoucherDialog] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)
  const [feeStructure, setFeeStructure] = useState<FeeStructure | null>(null)
  const [loading, setLoading] = useState(true)
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [vouchersLoading, setVouchersLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [paymentUploading, setPaymentUploading] = useState(false)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("Cash")
  const [fileError, setFileError] = useState<string | null>(null)
  
  const router = useRouter()
  const { user } = useAuth()

  // Fetch fee structure on component mount
  useEffect(() => {
    fetchFeeStructure();
    fetchSubmissions();
  }, []);
  
  // Fetch vouchers when the tab changes to "vouchers"
  useEffect(() => {
    if (activeTab === "vouchers") {
      fetchVouchers();
    } else if (activeTab === "submissions") {
      fetchSubmissions();
    }
  }, [activeTab]);

  // Set active tab based on vouchers
  useEffect(() => {
    // Check if we have pending vouchers and show the vouchers tab
    if (vouchers.length > 0) {
      const pendingVouchers = vouchers.filter(v => v.status === "Pending");
      const overdueVouchers = vouchers.filter(v => 
        v.status === "Pending" && new Date(v.dueDate) < new Date()
      );
      
      // If there are overdue vouchers, switch to vouchers tab automatically
      if (overdueVouchers.length > 0) {
        setActiveTab("vouchers");
        toast({
          title: "Attention Required",
          description: `You have ${overdueVouchers.length} overdue fee voucher${overdueVouchers.length > 1 ? 's' : ''} that need${overdueVouchers.length === 1 ? 's' : ''} attention.`,
        });
      } 
      // If there are pending but not overdue vouchers, notify but don't switch tabs
      else if (pendingVouchers.length > 0) {
        toast({
          title: "Fee Vouchers Available",
          description: `You have ${pendingVouchers.length} pending fee voucher${pendingVouchers.length > 1 ? 's' : ''}.`,
        });
      }
    }
  }, [vouchers]);

  // Fetch fee structure from API
  const fetchFeeStructure = async () => {
    try {
      setLoading(true);
      console.log("Fetching fee structure from API...");
      
      // In a real app, this would fetch based on student's grade
      // For now, we're just fetching all and using the first one
      const response = await fetch('/api/fees/structure', {
        credentials: 'include', // Important for sending cookies/session data
      });
      console.log("API Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Error fetching fee structure: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log("Fetched fee structures data:", data);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log(`Found ${data.length} fee structures, using first one`);
        setFeeStructure(data[0]);
      } else {
        console.error("No fee structures found or unexpected data format");
        setFeeStructure(null);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching fee structure:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch fee structure",
      });
      setLoading(false);
    }
  };

  // Fetch vouchers from API
  const fetchVouchers = async () => {
    if (!user?.id) return;
    
    try {
      setVouchersLoading(true);
      console.log("Fetching vouchers for student:", user.id);
      
      const response = await fetch(`/api/fees/vouchers?studentId=${user.id}`, {
        credentials: 'include', // Important for sending cookies/session data
        headers: {
          'Cache-Control': 'no-cache', // Prevent caching
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Error fetching vouchers: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log("Fetched vouchers:", data);
      
      // Sort vouchers by date (newest first)
      const sortedVouchers = [...data].sort((a, b) => {
        // First try to sort by month in format "monthName-YYYY"
        const dateA = new Date(a.issueDate);
        const dateB = new Date(b.issueDate);
        return dateB.getTime() - dateA.getTime();
      });
      
      setVouchers(sortedVouchers);
      setVouchersLoading(false);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch vouchers"
      });
      setVouchersLoading(false);
    }
  };

  // Fetch payment submissions
  const fetchSubmissions = async () => {
    if (!user?.id) return;
    
    try {
      setSubmissionsLoading(true);
      const response = await fetch(`/api/fees/payment?studentId=${user.id}`, {
        credentials: 'include', // Important for sending cookies/session data
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Error fetching submissions: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log("Fetched submissions:", data);
      
      // If we need additional voucher details, fetch those vouchers
      const voucherIds = data.map((submission: any) => submission.voucherId).filter(Boolean);
      let voucherDetails: Record<string, any> = {};

      if (voucherIds.length > 0) {
        try {
          // Fetch voucher details for these submissions
          const vouchersResponse = await fetch(`/api/fees/vouchers?studentId=${user.id}`, {
            credentials: 'include',
          });
          
          if (vouchersResponse.ok) {
            const vouchersData = await vouchersResponse.json();
            // Create a map of voucher id to voucher details
            voucherDetails = vouchersData.reduce((acc: Record<string, any>, voucher: any) => {
              acc[voucher.id] = voucher;
              return acc;
            }, {});
          }
        } catch (err) {
          console.error("Error fetching voucher details:", err);
        }
      }
      
      // Map submissions with voucher details
      const enhancedSubmissions = data.map((submission: any) => {
        const voucher = voucherDetails[submission.voucherId] || {};
        return {
          ...submission,
          month: voucher.month || 'Unknown',
          amount: voucher.amount || submission.amount || 0,
          submissionDate: submission.submittedAt 
            ? new Date(submission.submittedAt).toLocaleDateString() 
            : 'Unknown',
          voucherNumber: voucher.voucherNumber || 'N/A'
        };
      });
      
      setSubmissions(enhancedSubmissions);
      setSubmissionsLoading(false);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch payment submissions"
      });
      setSubmissionsLoading(false);
    }
  };

  // Generate fee breakdown from fee structure
  const getFeeBreakdown = () => {
    if (!feeStructure) return [];
    
    const breakdown = [
      { type: "Tuition Fee", amount: feeStructure.tuitionFee, dueDate: feeStructure.dueDate },
    ];
    
    if (feeStructure.otherFee > 0) {
      breakdown.push({ type: "Other Fees", amount: feeStructure.otherFee, dueDate: feeStructure.dueDate });
    }
    
    return breakdown;
  };

  // Calculate total fee amount
  const getTotalFeeAmount = () => {
    if (!feeStructure) return 0;
    return feeStructure.totalFee || (feeStructure.tuitionFee + feeStructure.otherFee);
  };

  // Mock data for payment history
  const paymentHistory = [
    { receipt: "REC-2023-001", date: "January 10, 2023", amount: 50, method: "Credit Card" },
    { receipt: "REC-2022-042", date: "September 5, 2022", amount: 250, method: "Bank Transfer" },
    { receipt: "REC-2022-015", date: "January 15, 2022", amount: 250, method: "Credit Card" },
  ]

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB in bytes
        setFileError("File size exceeds 5MB. Please select a smaller file.");
        return;
      }
      setSelectedFile(file);
      setFileError(null);
    }
  };

  // Handle file upload for payment proof
  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedVoucher) {
      toast({
        title: "Error",
        description: "No voucher selected.",
      });
      return;
    }
    
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please upload a payment proof image.",
      });
      return;
    }
    
    if (!paymentMethod) {
      toast({
        title: "Error",
        description: "Please select a payment method.",
      });
      return;
    }
    
    console.log("Payment method value:", paymentMethod);
    
    try {
      setPaymentUploading(true);
      
      // Create a FormData object to upload the file
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("voucherId", selectedVoucher.id);
      formData.append("paymentMethod", paymentMethod);
      
      // Add payment date and notes if provided
      const paymentDate = (document.getElementById('payment-date') as HTMLInputElement)?.value;
      if (paymentDate) {
        formData.append('paymentDate', paymentDate);
      }
      
      const notes = (document.getElementById('notes') as HTMLInputElement)?.value;
      if (notes) {
        formData.append('notes', notes);
      }
      
      // Log form data for debugging
      console.log('Uploading payment with form data:');
      for (const pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
      }
      
      // Make the API call to submit the payment
      const response = await fetch("/api/fees/payment", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload payment");
      }
      
      const data = await response.json();
      
      toast({
        title: "Payment Submitted",
        description: "Your payment proof has been submitted successfully and is awaiting verification.",
      });
      
      // Close the dialog and refresh vouchers data
      setShowUploadDialog(false);
      setSelectedFile(null);
      setPaymentMethod("Cash");
      
      // Refresh vouchers to show updated status
      fetchVouchers();
    } catch (error) {
      console.error("Error uploading payment:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload payment",
      });
    } finally {
      setPaymentUploading(false);
    }
  };

  // Handle voucher download
  const handleDownloadVoucher = () => {
    if (!selectedVoucher) return;
    
    // Implement the logic to download the voucher
    toast({
      title: "Download Initiated",
      description: "Your voucher download has started.",
    });
    
    // In a real implementation, you would generate a PDF and trigger a download
    console.log("Downloading voucher:", selectedVoucher.voucherNumber);
  };

  // Handle payment submission
  const handleSubmitPayment = async () => {
    if (!selectedVoucher || !selectedFile || !paymentMethod) {
      toast({
        title: "Error",
        description: "Please select a payment method and upload proof of payment.",
      });
      return;
    }
    
    try {
      setPaymentUploading(true);
      
      // Create a FormData object to upload the file
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("voucherId", selectedVoucher.id);
      formData.append("paymentMethod", paymentMethod);
      
      // Log form data for debugging
      console.log('Submitting payment with form data:');
      for (const pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
      }
      
      // Make the API call to submit the payment
      const response = await fetch("/api/fees/payment", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload payment");
      }
      
      const data = await response.json();
      
      toast({
        title: "Payment Submitted",
        description: "Your payment proof has been submitted successfully and is awaiting verification.",
      });
      
      // Close the dialog and refresh vouchers data
      setShowVoucherDialog(false);
      setSelectedFile(null);
      setPaymentMethod("Cash");
      
      // Refresh vouchers to show updated status
      fetchVouchers();
    } catch (error) {
      console.error("Error submitting payment:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit payment",
      });
    } finally {
      setPaymentUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fees</h1>
        <p className="text-muted-foreground">Manage fees and payments</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">
            <CreditCard className="h-4 w-4 mr-2" />
            Current Fee
          </TabsTrigger>
          <TabsTrigger value="vouchers">
            <FileText className="h-4 w-4 mr-2" />
            Fee Vouchers
          </TabsTrigger>
          <TabsTrigger value="submissions">
            <Upload className="h-4 w-4 mr-2" />
            Submissions
          </TabsTrigger>
        </TabsList>

        {/* Current Fee Tab */}
        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Fee Status</CardTitle>
              <CardDescription>Summary of your current fee status</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading fee information...</span>
                </div>
              ) : feeStructure ? (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Total Fee Due</p>
                    <p className="text-3xl font-bold">${getTotalFeeAmount()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Due Date</p>
                    <p className="text-xl font-semibold">{feeStructure.dueDate}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">For Grade</p>
                    <p className="text-xl font-semibold">{feeStructure.grade}</p>
                  </div>
                  <Button>Pay Now</Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p>No fee structure found for your grade.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fee Breakdown</CardTitle>
              <CardDescription>Detailed breakdown of your fees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fee Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8">
                            <div className="flex items-center justify-center">
                              <Loader2 className="h-6 w-6 animate-spin mr-2" />
                              <span>Loading fee breakdown...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : feeStructure ? (
                        getFeeBreakdown().map((fee, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{fee.type}</TableCell>
                            <TableCell>${fee.amount}</TableCell>
                            <TableCell>{fee.dueDate}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8">
                            No fee breakdown available.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Record of your previous payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Receipt No.</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentHistory.map((payment, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{payment.receipt}</TableCell>
                          <TableCell>{payment.date}</TableCell>
                          <TableCell>${payment.amount}</TableCell>
                          <TableCell>{payment.method}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Receipt
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vouchers Tab */}
        <TabsContent value="vouchers" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Fee Vouchers</CardTitle>
                <CardDescription>Download and view your fee vouchers</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchVouchers}
                disabled={vouchersLoading}
              >
                {vouchersLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 mr-2"
                  >
                    <path d="M21 2v6h-6"></path>
                    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                    <path d="M3 22v-6h6"></path>
                    <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                  </svg>
                )}
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {vouchersLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-2" />
                  <span>Loading vouchers...</span>
                </div>
              ) : vouchers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No fee vouchers found. Please contact the administration if you believe this is an error.</p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Issue Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vouchers.map((voucher) => (
                          <TableRow key={voucher.id}>
                            <TableCell className="font-medium">{voucher.month}</TableCell>
                            <TableCell>${voucher.amount}</TableCell>
                            <TableCell>{voucher.dueDate}</TableCell>
                            <TableCell>{voucher.issueDate}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  voucher.status === "Paid"
                                    ? "bg-green-500 hover:bg-green-600"
                                    : voucher.status === "Pending"
                                      ? "bg-yellow-500 hover:bg-yellow-600"
                                      : voucher.status === "Verifying"
                                        ? "bg-orange-500 hover:bg-orange-600"
                                        : "bg-red-500 hover:bg-red-600"
                                }
                              >
                                {voucher.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedVoucher(voucher)
                                    setShowVoucherDialog(true)
                                  }}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                                {voucher.status === "Pending" && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => {
                                      setSelectedVoucher(voucher);
                                      setShowUploadDialog(true);
                                    }}
                                  >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Payment
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mobile view for vouchers */}
          {!vouchersLoading && vouchers.length > 0 && (
            <div className="md:hidden space-y-4 mt-4">
              {vouchers.map((voucher) => (
                <Card key={voucher.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{voucher.month}</CardTitle>
                      <Badge
                        className={
                          voucher.status === "Paid"
                            ? "bg-green-500 hover:bg-green-600"
                            : voucher.status === "Pending"
                              ? "bg-yellow-500 hover:bg-yellow-600"
                              : voucher.status === "Verifying"
                                ? "bg-orange-500 hover:bg-orange-600"
                                : "bg-red-500 hover:bg-red-600"
                        }
                      >
                        {voucher.status}
                      </Badge>
                    </div>
                    <CardDescription>Voucher #{voucher.voucherNumber}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Amount:</p>
                        <p className="font-medium">${voucher.amount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Due Date:</p>
                        <p className="font-medium">{voucher.dueDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Issue Date:</p>
                        <p className="font-medium">{voucher.issueDate}</p>
                      </div>
                      {voucher.status === "Paid" && (
                        <div>
                          <p className="text-muted-foreground">Payment Date:</p>
                          <p className="font-medium">{voucher.paymentDate}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setSelectedVoucher(voucher)
                        setShowVoucherDialog(true)
                      }}
                    >
                      <FileText className="h-3.5 w-3.5 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Download
                    </Button>
                    {voucher.status === "Pending" && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs" 
                        onClick={() => {
                          setSelectedVoucher(voucher);
                          setShowUploadDialog(true);
                        }}
                      >
                        <Upload className="h-3.5 w-3.5 mr-1" />
                        Upload Payment
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <CardTitle>Payment Submissions</CardTitle>
                  <CardDescription>Track your fee payment submissions</CardDescription>
                </div>
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New Payment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {submissionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading submissions...</span>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Submission Date</TableHead>
                          <TableHead>Payment Method</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Voucher/Receipt</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissions.length > 0 ? (
                          submissions.map((submission) => (
                            <TableRow key={submission.id}>
                              <TableCell className="font-medium">{submission.month}</TableCell>
                              <TableCell>${submission.amount}</TableCell>
                              <TableCell>{submission.submissionDate}</TableCell>
                              <TableCell>{submission.paymentMethod}</TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    submission.status === "Verified"
                                      ? "bg-green-500 hover:bg-green-600"
                                      : submission.status === "Verifying"
                                        ? "bg-orange-500 hover:bg-orange-600"
                                        : submission.status === "Rejected"
                                          ? "bg-red-500 hover:bg-red-600"
                                          : "bg-yellow-500 hover:bg-yellow-600"
                                  }
                                >
                                  {submission.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {submission.voucherNumber || "N/A"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => window.open(submission.paymentProof, '_blank')}
                                    disabled={!submission.paymentProof || submission.paymentProof.includes('placeholder')}
                                  >
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Proof
                                  </Button>
                                  {submission.status === "Rejected" && (
                                    <Button 
                                      size="sm"
                                      onClick={() => {
                                        // Find the corresponding voucher
                                        const voucher = vouchers.find(v => v.id === submission.voucherId);
                                        if (voucher) {
                                          setSelectedVoucher(voucher);
                                          setShowUploadDialog(true);
                                        }
                                      }}
                                    >
                                      <Upload className="h-4 w-4 mr-2" />
                                      Resubmit
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                              No submissions found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mobile view for submissions */}
          <div className="md:hidden space-y-4 mt-4">
            {submissions.map((submission) => (
              <Card key={submission.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{submission.month}</CardTitle>
                    <Badge
                      className={
                        submission.status === "Verified"
                          ? "bg-green-500 hover:bg-green-600"
                          : submission.status === "Verifying"
                            ? "bg-orange-500 hover:bg-orange-600"
                            : submission.status === "Rejected"
                              ? "bg-red-500 hover:bg-red-600"
                              : "bg-yellow-500 hover:bg-yellow-600"
                      }
                    >
                      {submission.status}
                    </Badge>
                  </div>
                  <CardDescription>Voucher #{submission.voucherNumber}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Amount:</p>
                      <p className="font-medium">${submission.amount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Submission Date:</p>
                      <p className="font-medium">{submission.submissionDate}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Payment Method:</p>
                      <p className="font-medium">{submission.paymentMethod}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(submission.paymentProof, '_blank')}
                    disabled={!submission.paymentProof || submission.paymentProof.includes('placeholder')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Proof
                  </Button>
                  {submission.status === "Rejected" && (
                    <Button 
                      size="sm"
                      onClick={() => {
                        // Find the corresponding voucher
                        const voucher = vouchers.find(v => v.id === submission.voucherId);
                        if (voucher) {
                          setSelectedVoucher(voucher);
                          setShowUploadDialog(true);
                        }
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Resubmit
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
            {submissions.length === 0 && !submissionsLoading && (
              <div className="text-center py-4">
                <p>No submissions found.</p>
              </div>
            )}
            {submissionsLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading submissions...</span>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Voucher Details Dialog */}
      <Dialog open={showVoucherDialog} onOpenChange={setShowVoucherDialog}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedVoucher && (
            <>
              <DialogHeader>
                <DialogTitle>Fee Voucher Details</DialogTitle>
                <DialogDescription>
                  Voucher #{selectedVoucher.voucherNumber} for {selectedVoucher.month}
                </DialogDescription>
              </DialogHeader>
              <div className="border rounded-md p-6 space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold">School Management System</h3>
                  <p className="text-sm text-muted-foreground">123 Education Street, City, Country</p>
                  <div className="mt-4 inline-block px-4 py-1 border-2 border-black font-bold">FEE VOUCHER</div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Student Name:</p>
                    <p className="font-medium">{selectedVoucher.studentName || user?.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Roll Number:</p>
                    <p className="font-medium">{selectedVoucher.rollNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Class:</p>
                    <p className="font-medium">{selectedVoucher.className}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Month:</p>
                    <p className="font-medium">{selectedVoucher.month}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Issue Date:</p>
                    <p className="font-medium">{selectedVoucher.issueDate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Due Date:</p>
                    <p className="font-medium">{selectedVoucher.dueDate}</p>
                  </div>
                </div>

                <div className="border-t border-b py-4">
                  <div className="flex justify-between font-medium">
                    <span>Fee Description</span>
                    <span>Amount</span>
                  </div>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span>Tuition Fee</span>
                      <span>${feeStructure?.tuitionFee || '0'}</span>
                    </div>
                    {feeStructure?.otherFee && feeStructure.otherFee > 0 && (
                      <div className="flex justify-between">
                        <span>Other Fees</span>
                        <span>${feeStructure.otherFee}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between font-bold">
                  <span>Total Amount</span>
                  <span>${selectedVoucher.amount}</span>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">Payment Instructions:</p>
                  <p>1. Please pay before the due date to avoid late fee charges.</p>
                  <p>2. Keep the payment receipt for future reference.</p>
                  <p>3. For online payment, use this "030X XXXXXXX" Jazz cash number and upload the confirmation screenshot.</p>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setShowVoucherDialog(false)} className="sm:w-auto w-full">
                  Close
                </Button>
                <Button className="sm:w-auto w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                {selectedVoucher.status === "Pending" && (
                  <Button
                    onClick={() => {
                      setShowVoucherDialog(false)
                      setShowUploadDialog(true)
                    }}
                    className="sm:w-auto w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Payment
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Payment Proof</DialogTitle>
            <DialogDescription>
              Upload a photo or scan of your payment receipt or bank transfer confirmation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="voucher-number">Voucher Number</Label>
                <Input 
                  id="voucher-number" 
                  value={selectedVoucher?.voucherNumber || ""} 
                  disabled 
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-date">Payment Date</Label>
                <Input id="payment-date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="upload-payment-method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="upload-payment-method">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Jazz Cash Transfer">Jazz Cash Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-proof">Payment Proof</Label>
                <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {selectedFile ? selectedFile.name : "Drag and drop or click to upload"}
                  </p>
                  <Input id="payment-proof" type="file" className="hidden" required onChange={handleFileChange} />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => document.getElementById("payment-proof")?.click()}
                  >
                    Choose File
                  </Button>
                </div>
                {fileError && <p className="text-sm text-red-500 mt-1">{fileError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Input id="notes" placeholder="Any additional information" />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setShowUploadDialog(false)}
                className="sm:w-auto w-full"
                disabled={paymentUploading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="sm:w-auto w-full" 
                disabled={paymentUploading || !selectedFile}
              >
                {paymentUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

