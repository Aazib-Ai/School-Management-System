"use client"

import { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  CreditCard,
  Search,
  Plus,
  Edit,
  Trash,
  Download,
  Upload,
  MoreHorizontal,
  FileText,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  DollarSign,
  Loader2 as Spinner,
  LogOut,
  Check,
  X,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"

export default function FeeManagementPage() {
  // Add session state for NextAuth
  const { data: session, status } = useSession();
  const router = useRouter();

  // State for active tab
  const [activeTab, setActiveTab] = useState("fee-structure")
  
  // State for fee structure tab
  const [gradeFilter, setGradeFilter] = useState("all")
  const [feeSearchQuery, setFeeSearchQuery] = useState("")
  const [showFeeDialog, setShowFeeDialog] = useState(false)
  const [feeStructures, setFeeStructures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingFee, setEditingFee] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<string>("")
  
  // State for fee collection tab
  const [statusFilter, setStatusFilter] = useState("all")
  const [collectionSearchQuery, setCollectionSearchQuery] = useState("")
  
  // State for defaulters tab
  const [defaulterSearchQuery, setDefaulterSearchQuery] = useState("")
  const [defaulters, setDefaulters] = useState<any[]>([])
  const [defaultersLoading, setDefaultersLoading] = useState(false)

  // State for vouchers tab
  const [voucherFilter, setVoucherFilter] = useState("all")
  const [voucherSearchQuery, setVoucherSearchQuery] = useState("")
  const [showSendVoucherDialog, setShowSendVoucherDialog] = useState(false)
  const [classes, setClasses] = useState<any[]>([])
  const [vouchers, setVouchers] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("")
  const [voucherLoading, setVoucherLoading] = useState(false)
  const [voucherMessage, setVoucherMessage] = useState("")
  const [vouchersLoaded, setVouchersLoaded] = useState(false)
  
  // State for voucher deletion confirmation
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
  const [voucherToDelete, setVoucherToDelete] = useState<string | null>(null)

  // State for submissions tab
  const [submissionFilter, setSubmissionFilter] = useState("all")
  const [submissionSearchQuery, setSubmissionSearchQuery] = useState("")
  const [showSubmissionDetailsDialog, setShowSubmissionDetailsDialog] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  
  // State for voucher details dialog
  const [showVoucherDialog, setShowVoucherDialog] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  // Generate upcoming months for the fee vouchers
  const getUpcomingMonths = () => {
    const months = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Generate next 3 months starting from current month
    for (let i = 0; i < 3; i++) {
      const monthIndex = (currentMonth + i) % 12;
      const year = currentYear + Math.floor((currentMonth + i) / 12);
      const monthName = new Date(year, monthIndex, 1).toLocaleString('default', { month: 'long' });
      months.push({
        value: `${monthName.toLowerCase()}-${year}`,
        label: `${monthName} ${year}`
      });
    }
    
    return months;
  };

  // Function to log auth state
  const logAuthState = async () => {
    console.log("------------ Auth State Debug ------------");
    console.log("NextAuth session status:", status);
    console.log("NextAuth session data:", session);
    
    // Try to find any auth cookies
    const cookieString = document.cookie;
    console.log("All cookies:", cookieString);
    
    // Look for specific cookies
    const hasSessionCookie = cookieString.includes('session=');
    const hasNextAuthCookie = cookieString.includes('next-auth.session-token=');
    console.log("Has session cookie:", hasSessionCookie);
    console.log("Has NextAuth cookie:", hasNextAuthCookie);
    
    // Check if we can get the current user from the API
    try {
      console.log("Checking current user via API...");
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      console.log("Auth check response status:", response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log("Current user data from API:", userData);
      } else {
        console.log("Failed to get current user from API");
      }
    } catch (error) {
      console.error("Error checking current user:", error);
    }
    
    console.log("----------------------------------------");
  };
  
  // Fetch fee structures on component mount
  useEffect(() => {
    // Initialize component
    console.log("Initializing component - fetching data directly");
    
    // Log the authentication state for debugging
    const checkAuth = async () => {
      await logAuthState();
    };
    checkAuth();
    
    // Try to fetch data directly, error handling is built into these functions
    fetchFeeStructures();
    fetchClasses();
    fetchDefaulters();
  }, []);

  // Fetch fee structures from API
  const fetchFeeStructures = async () => {
    try {
      setLoading(true);
      console.log("Fetching fee structures from API...");
      
      const response = await fetch('/api/fees/structure', {
        credentials: 'include', // Important for sending cookies/session data
      });
      console.log("API Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Error fetching fee structures: ${response.status}`;
        console.error(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
        });
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      console.log("Fetched fee structures data:", data);
      
      setFeeStructures(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching fee structures:', error);
      toast({
        title: "Error",
        description: "Failed to fetch fee structures",
      });
      setLoading(false);
    }
  };

  // Fetch classes from API
  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes', {
        credentials: 'include', // Important for sending cookies/session data
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Error fetching classes: ${response.status}`;
        console.error(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
        });
        return;
      }
      
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch classes",
      });
    }
  };

  // Fetch vouchers for a specific class and month
  const fetchVouchersForClass = async (classId: string, month: string) => {
    if (!classId || !month) return;

    try {
      setVoucherLoading(true);
      console.log(`Attempting to fetch vouchers for class ${classId} and month ${month}`);
      
      // Try direct fetch to vouchers endpoint
      console.log("Attempting direct fetch to vouchers endpoint");
      const response = await fetch(`/api/fees/vouchers?classId=${classId}&month=${month}`, {
        credentials: 'include', 
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      console.log("Vouchers response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Retrieved ${data.length} vouchers successfully`);
        setVouchers(data);
        setVouchersLoaded(true);
        setVoucherLoading(false);
        return;
      }
      
      // If that didn't work, log the auth state for debugging
      console.log("Direct fetch failed, logging auth state...");
      await logAuthState();
      
      // Try alternative way by forcing credentials
      console.log("Trying alternate fetch approach with additional headers");
      const alternateResponse = await fetch(`/api/fees/vouchers?classId=${classId}&month=${month}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Requested-With': 'XMLHttpRequest'
        },
      });
      
      console.log("Alternate fetch response status:", alternateResponse.status);
      
      if (alternateResponse.ok) {
        const data = await alternateResponse.json();
        console.log(`Retrieved ${data.length} vouchers via alternate method`);
        setVouchers(data);
      } else {
        // Handle error response
        const errorText = await alternateResponse.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }
        
        console.error("Vouchers fetch error:", errorData.error || alternateResponse.statusText, errorData);
        
        // Show error message to user
        toast({
          title: "Error Fetching Vouchers",
          description: "Failed to fetch vouchers. You may need to log in again.",
        });
      }
      
      setVoucherLoading(false);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch vouchers. Please check your connection and try again.",
      });
      setVoucherLoading(false);
    }
  };

  // Effect to fetch vouchers when selected class or month changes
  useEffect(() => {
    if (selectedClass && selectedMonth) {
      fetchVouchersForClass(selectedClass, selectedMonth);
    }
  }, [selectedClass, selectedMonth]);

  // Effect to fetch all vouchers when vouchers tab is selected
  useEffect(() => {
    if (activeTab === "vouchers") {
      // Set loading state but don't fetch immediately
      setVoucherLoading(true);
      
      // Use a small timeout to prevent immediate loading
      // This gives the user time to select filters before any data is loaded
      const timer = setTimeout(() => {
        // Only fetch if no specific filters have been applied yet
        // and we haven't loaded vouchers before
        if ((!selectedClass || !selectedMonth) && !vouchersLoaded) {
          fetchAllVouchers();
        } else {
          // If we've already loaded vouchers before, just remove the loading state
          setVoucherLoading(false);
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [activeTab, vouchersLoaded]);

  // Fetch all vouchers
  const fetchAllVouchers = async () => {
    // If we already have vouchers, don't fetch again
    if (vouchers.length > 0 && !selectedClass && !selectedMonth) {
      setVoucherLoading(false);
      return;
    }
    
    try {
      setVoucherLoading(true);
      console.log("Attempting to fetch all vouchers");
      
      const response = await fetch(`/api/fees/vouchers`, {
        credentials: 'include', 
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      console.log("All vouchers response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Retrieved ${data.length} vouchers successfully`);
        setVouchers(data);
        setVouchersLoaded(true);
        setVoucherLoading(false);
        return;
      }
      
      // If that didn't work, log the auth state for debugging
      console.log("Fetch failed, logging auth state...");
      await logAuthState();
      
      setVoucherLoading(false);
    } catch (error) {
      console.error("Error fetching all vouchers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch vouchers. Please check your connection and try again.",
      });
      setVoucherLoading(false);
    }
  };

  // Handle sending vouchers
  const handleSendVouchers = async () => {
    if (!selectedClass || !selectedMonth) {
      toast({
        title: "Error",
        description: "Please select a class and month",
      });
      return;
    }

    try {
      setVoucherLoading(true);
      
      console.log("Sending request to create vouchers:", {
        classId: selectedClass,
        month: selectedMonth,
        message: voucherMessage
      });
      
      const response = await fetch("/api/fees/vouchers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "X-Requested-With": "XMLHttpRequest"
        },
        credentials: 'include', // Important for sending cookies/session data
        body: JSON.stringify({ 
          classId: selectedClass, 
          month: selectedMonth,
          message: voucherMessage 
        }),
      });
      
      console.log("Voucher creation response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Success response:", data);
        toast({
          title: "Success",
          description: data.message || "Vouchers sent successfully",
        });
        // Refresh vouchers list and reset cache state
        setVouchersLoaded(false);
        fetchVouchersForClass(selectedClass, selectedMonth);
      } else {
        // Log auth state for debugging
        await logAuthState();
        
        // Try to interpret error response
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }
        
        console.error("Error response:", errorData.error || response.statusText, errorData);
        
        // Show error to user
        toast({
          title: "Error",
          description: errorData.error || `Failed to send vouchers: ${response.status} ${response.statusText}`,
        });
      }
      setVoucherLoading(false);
      setShowSendVoucherDialog(false);
    } catch (error) {
      console.error("Error sending vouchers:", error);
      toast({
        title: "Error",
        description: "Failed to send vouchers. Please check your connection and try again.",
      });
      setVoucherLoading(false);
      setShowSendVoucherDialog(false);
    }
  };

  // Handle adding a new fee structure
  const handleAddFeeStructure = async () => {
    try {
      console.log("Selected grade from state:", selectedGrade);
      
      // Get form elements
      const tuitionInput = document.getElementById('fee-tuition') as HTMLInputElement;
      const otherInput = document.getElementById('fee-other') as HTMLInputElement;
      const dueDateInput = document.getElementById('fee-due-date') as HTMLInputElement;
      
      // Get values
      const grade = selectedGrade;
      const tuitionFeeStr = tuitionInput?.value || '';
      const otherFeeStr = otherInput?.value || '0';
      const dueDate = dueDateInput?.value || '5th of every month';
      
      console.log("Form values:", { grade, tuitionFeeStr, otherFeeStr, dueDate });
      
      // Validate required fields
      if (!grade || !tuitionFeeStr) {
        const errorMsg = "Please fill all required fields";
        console.error(errorMsg, { grade, tuitionFeeStr });
        toast({
          title: "Error",
          description: errorMsg,
        });
        return;
      }
      
      // Parse numeric values
      const tuitionFee = parseFloat(tuitionFeeStr);
      const otherFee = parseFloat(otherFeeStr);
      
      // Validate numeric values
      if (isNaN(tuitionFee) || tuitionFee <= 0) {
        const errorMsg = "Tuition Fee must be a positive number";
        console.error(errorMsg, { tuitionFee });
        toast({
          title: "Error",
          description: errorMsg,
        });
        return;
      }
      
      if (isNaN(otherFee) || otherFee < 0) {
        const errorMsg = "Other Fee must be a valid number";
        console.error(errorMsg, { otherFee });
        toast({
          title: "Error",
          description: errorMsg,
        });
        return;
      }
      
      // Create form data
      const formData = {
        grade,
        tuitionFee,
        otherFee,
        dueDate
      };
      
      console.log("Sending form data to API:", formData);
      
      // Call API
      const response = await fetch('/api/fees/structure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      console.log("API response status:", response.status);
      const data = await response.json();
      console.log("API response data:", data);
      
      if (!response.ok) {
        const errorMsg = data.error || 'Failed to add fee structure';
        console.error(errorMsg, data);
        throw new Error(errorMsg);
      }
      
      console.log("Fee structure added successfully:", data);
      toast({
        title: "Fee Structure Added",
        description: `Fee structure for ${grade} has been added successfully.`,
      });
      
      // Reset state
      setSelectedGrade("");
      setShowFeeDialog(false);
      fetchFeeStructures();
    } catch (error) {
      console.error('Error adding fee structure:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add fee structure",
      });
    }
  };

  // Handle updating a fee structure
  const handleUpdateFeeStructure = async () => {
    try {
      if (!editingFee?.id) {
        console.error("No editing fee ID found");
        return;
      }
      
      console.log("Selected grade from state:", selectedGrade);
      
      // Get form elements
      const tuitionInput = document.getElementById('fee-tuition') as HTMLInputElement;
      const otherInput = document.getElementById('fee-other') as HTMLInputElement;
      const dueDateInput = document.getElementById('fee-due-date') as HTMLInputElement;
      
      // Get values
      const grade = selectedGrade || editingFee.grade;
      const tuitionFeeStr = tuitionInput?.value || editingFee.tuitionFee.toString();
      const otherFeeStr = otherInput?.value || editingFee.otherFee.toString();
      const dueDate = dueDateInput?.value || editingFee.dueDate;
      
      console.log("Form values for update:", { 
        id: editingFee.id,
        grade, 
        tuitionFeeStr, 
        otherFeeStr, 
        dueDate 
      });
      
      // Validate required fields
      if (!grade || !tuitionFeeStr) {
        toast({
          title: "Error",
          description: "Please fill all required fields",
        });
        return;
      }
      
      // Parse numeric values
      const tuitionFee = parseFloat(tuitionFeeStr);
      const otherFee = parseFloat(otherFeeStr);
      
      // Validate numeric values
      if (isNaN(tuitionFee) || tuitionFee <= 0) {
        toast({
          title: "Error",
          description: "Tuition Fee must be a positive number",
        });
        return;
      }
      
      if (isNaN(otherFee) || otherFee < 0) {
        toast({
          title: "Error",
          description: "Other Fee must be a valid number",
        });
        return;
      }
      
      // Create form data
      const formData = {
        grade,
        tuitionFee,
        otherFee,
        dueDate
      };
      
      console.log("Sending form data to API:", formData);
      
      // Call API
      const response = await fetch(`/api/fees/structure?id=${editingFee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      console.log("API response status:", response.status);
      const data = await response.json();
      console.log("API response data:", data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update fee structure');
      }
      
      toast({
        title: "Fee Structure Updated",
        description: `Fee structure for ${grade} has been updated successfully.`,
      });
      
      // Reset state
      setSelectedGrade("");
      setShowFeeDialog(false);
      setIsEditMode(false);
      setEditingFee(null);
      fetchFeeStructures();
    } catch (error) {
      console.error('Error updating fee structure:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update fee structure",
      });
    }
  };

  // Handle deleting a fee structure
  const handleDeleteFeeStructure = async (id: string) => {
    try {
      // Confirm before deleting
      if (!window.confirm("Are you sure you want to delete this fee structure? This action cannot be undone.")) {
        return;
      }
      
      console.log("Deleting fee structure with ID:", id);
      
      // Call the API to delete fee structure
      const response = await fetch(`/api/fees/structure?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete fee structure');
      }

      toast({
        title: "Fee Structure Deleted",
        description: "The fee structure has been deleted successfully.",
      });
      
      // Refresh the fee structure list
      fetchFeeStructures();
    } catch (error) {
      console.error('Error deleting fee structure:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete fee structure",
      });
    }
  };

  // Handle opening edit dialog
  const handleEditFeeStructure = (fee: any) => {
    openEditDialog(fee);
  };

  // Function to open dialog in edit mode
  const openEditDialog = (fee: any) => {
    console.log("Opening edit dialog with fee:", fee);
    
    // Set state for editing
    setEditingFee(fee);
    setIsEditMode(true);
    setSelectedGrade(fee.grade);
    
    // Open the dialog
    setShowFeeDialog(true);
    
    // Allow time for the dialog to open and render
    setTimeout(() => {
      // Set values in the form for the inputs
      const tuitionInput = document.getElementById('fee-tuition') as HTMLInputElement;
      const otherInput = document.getElementById('fee-other') as HTMLInputElement;
      const dueDateInput = document.getElementById('fee-due-date') as HTMLInputElement;
      
      if (tuitionInput) tuitionInput.value = fee.tuitionFee.toString();
      if (otherInput) otherInput.value = fee.otherFee.toString();
      if (dueDateInput) dueDateInput.value = fee.dueDate;
      
      console.log("Form values set for editing:", {
        grade: selectedGrade,
        tuition: tuitionInput?.value,
        other: otherInput?.value,
        dueDate: dueDateInput?.value
      });
    }, 200);
  };

  // Filter the fee structures based on grade filter and search query
  const filteredFeeStructures = useMemo(() => {
    return feeStructures.filter((fee: any) => {
      const matchesGrade = gradeFilter === "all" || fee.grade === gradeFilter;
      const matchesSearch = 
        fee.grade.toLowerCase().includes(feeSearchQuery.toLowerCase()) ||
        fee.dueDate.toLowerCase().includes(feeSearchQuery.toLowerCase());
      return matchesGrade && matchesSearch;
    });
  }, [feeStructures, gradeFilter, feeSearchQuery]);

  // Fetch defaulters (vouchers with "Default" status)
  const fetchDefaulters = async () => {
    try {
      setDefaultersLoading(true);
      const response = await fetch('/api/fees/submissions?status=Default', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Error fetching defaulters: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Defaulters API response:", data);
      
      if (data && data.submissions && Array.isArray(data.submissions)) {
        setDefaulters(data.submissions);
      } else {
        setDefaulters([]);
      }
    } catch (error) {
      console.error('Error fetching defaulters:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch defaulters",
      });
      setDefaulters([]);
    } finally {
      setDefaultersLoading(false);
    }
  };

  // Mock data for fee collection
  const feeCollection = [
    {
      id: "c1",
      studentName: "Alex Johnson",
      rollNumber: "S2023-001",
      grade: "Grade 9",
      class: "Grade 9A",
      month: "September 2023",
      amount: 1650,
      status: "paid",
      paymentDate: "2023-09-03",
      paymentMethod: "Bank Transfer",
      receiptNumber: "REC-2023-001",
    },
    {
      id: "c2",
      studentName: "Emma Davis",
      rollNumber: "S2023-002",
      grade: "Grade 9",
      class: "Grade 9A",
      month: "September 2023",
      amount: 1650,
      status: "paid",
      paymentDate: "2023-09-04",
      paymentMethod: "Credit Card",
      receiptNumber: "REC-2023-002",
    },
    {
      id: "c3",
      studentName: "Michael Brown",
      rollNumber: "S2023-003",
      grade: "Grade 9",
      class: "Grade 9A",
      month: "September 2023",
      amount: 1650,
      status: "pending",
      dueDate: "2023-09-05",
    },
    {
      id: "c4",
      studentName: "Sophia Wilson",
      rollNumber: "S2023-004",
      grade: "Grade 10",
      class: "Grade 10A",
      month: "September 2023",
      amount: 1830,
      status: "paid",
      paymentDate: "2023-09-02",
      paymentMethod: "Bank Transfer",
      receiptNumber: "REC-2023-003",
    },
    {
      id: "c5",
      studentName: "James Taylor",
      rollNumber: "S2023-005",
      grade: "Grade 10",
      class: "Grade 10A",
      month: "September 2023",
      amount: 1830,
      status: "overdue",
      dueDate: "2023-09-05",
    },
  ]

  // Filter fee collection based on status filter and search query
  const filteredFeeCollection = feeCollection.filter(
    (fee) =>
      (statusFilter === "all" || fee.status === statusFilter) &&
      (collectionSearchQuery === "" ||
        fee.studentName.toLowerCase().includes(collectionSearchQuery.toLowerCase()) ||
        fee.rollNumber.toLowerCase().includes(collectionSearchQuery.toLowerCase())),
  )

  // Filter defaulters based on search query
  const filteredDefaulters = defaulters.filter(
    (defaulter) =>
      defaulterSearchQuery === "" ||
      defaulter.studentName?.toLowerCase().includes(defaulterSearchQuery.toLowerCase()) ||
      defaulter.rollNumber?.toLowerCase().includes(defaulterSearchQuery.toLowerCase()),
  )

  // Filter vouchers based on class filter and search query
  const filteredVouchers = useMemo(() => {
    return (vouchers || []).filter(
      (voucher) =>
        (voucherFilter === "all" || voucher.className === voucherFilter) &&
        (voucherSearchQuery === "" ||
          voucher.studentName?.toLowerCase().includes(voucherSearchQuery.toLowerCase()) ||
          voucher.rollNumber?.toLowerCase().includes(voucherSearchQuery.toLowerCase()) ||
          voucher.voucherNumber?.toLowerCase().includes(voucherSearchQuery.toLowerCase())),
    );
  }, [vouchers, voucherFilter, voucherSearchQuery]);

  // Filter submissions based on status filter and search query
  const filteredSubmissions = submissions.filter(
    (submission) =>
      (submissionFilter === "all" || 
       (submissionFilter === "pending" && submission.status === "Pending") || 
       (submissionFilter === "verified" && (submission.status === "Verified" || submission.status === "Paid")) || 
       (submissionFilter === "paid" && submission.status === "Paid") ||
       (submissionFilter === "default" && submission.status === "Default")) &&
      (submissionSearchQuery === "" ||
        submission.studentName?.toLowerCase().includes(submissionSearchQuery.toLowerCase()) ||
        submission.rollNumber?.toLowerCase().includes(submissionSearchQuery.toLowerCase()) ||
        (submission.voucherNumber && submission.voucherNumber.toLowerCase().includes(submissionSearchQuery.toLowerCase()))),
  )

  // Handle logging out
  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Logged out successfully",
        });
        router.push("/");
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to log out",
        });
      }
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Error",
        description: "An error occurred while logging out",
      });
    }
  };

  // Add fetchSubmissions function
  const fetchSubmissions = async () => {
    try {
      setSubmissionsLoading(true);
      console.log("Fetching submissions from API...");
      
      const response = await fetch('/api/fees/submissions', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Error fetching submissions: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Submissions API response:", data);
      
      // Check if data.submissions exists and is an array
      if (data && data.submissions && Array.isArray(data.submissions)) {
        console.log("Setting submissions array:", data.submissions.length, "items");
        // Map over submissions to ensure consistent property access
        const formattedSubmissions = data.submissions.map((submission: any) => {
          console.log("Processing submission:", submission);
          return {
            id: submission.id,
            studentId: submission.studentId || "",
            studentName: submission.studentName || "Unknown Student",
            rollNumber: submission.rollNumber || "",
            class: submission.class || "",
            month: submission.month || "",
            amount: submission.amount || 0,
            status: submission.status || "Pending",
            submissionDate: submission.submissionDate || "",
            voucherNumber: submission.voucherNumber || "",
            paymentMethod: submission.paymentMethod || "",
            paymentProof: submission.paymentProof || "/placeholder.svg",
            verificationDate: submission.verificationDate || "",
            receiptNumber: submission.receiptNumber || ""
          };
        });
        setSubmissions(formattedSubmissions);
      } else {
        console.log("No submissions found in response, data structure:", data);
        // If no submissions array, initialize with the mock data
        setSubmissions([
          {
            id: "s1",
            studentName: "Alex Johnson",
            rollNumber: "S2023-001",
            class: "Grade 9A",
            month: "September 2023",
            amount: 1650,
            status: "Pending",
            submissionDate: "2023-09-03",
            verificationDate: "2023-09-04",
            paymentMethod: "Bank Transfer",
            voucherNumber: "V-2023-001",
            receiptNumber: "REC-2023-001",
            paymentProof: "/placeholder.svg?height=300&width=200",
          },
          {
            id: "s2",
            studentName: "Emma Davis",
            rollNumber: "S2023-002",
            class: "Grade 10A",
            month: "September 2023",
            amount: 1820,
            status: "Pending",
            submissionDate: "2023-09-04",
            paymentMethod: "Cash",
            voucherNumber: "V-2023-002",
            paymentProof: "/placeholder.svg?height=300&width=200",
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch submissions",
      });
      // Set to mock data on error for development
      setSubmissions([
        {
          id: "s1",
          studentName: "Alex Johnson",
          rollNumber: "S2023-001",
          class: "Grade 9A",
          month: "September 2023",
          amount: 1650,
          status: "Pending",
          submissionDate: "2023-09-03",
          verificationDate: "2023-09-04",
          paymentMethod: "Bank Transfer",
          voucherNumber: "V-2023-001",
          receiptNumber: "REC-2023-001",
          paymentProof: "/placeholder.svg?height=300&width=200",
        }
      ]);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  // Add useEffect hook to fetch submissions when tab changes
  useEffect(() => {
    if (activeTab === "submissions") {
      fetchSubmissions();
    }
  }, [activeTab]);

  // Handle verifying a submission
  const handleVerifySubmission = async (submissionId: string, isVerified: boolean) => {
    try {
      // When isVerified is true, status changes to "Paid"
      // When isVerified is false, status changes to "Default"
      const response = await fetch('/api/fees/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          isVerified,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Error updating submission: ${response.status}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      toast({
        title: isVerified ? 'Payment Marked as Paid' : 'Payment Marked as Default',
        description: result.message || `Payment has been marked as ${isVerified ? 'paid' : 'default'}.`,
      });

      fetchSubmissions(); // Refresh the list
      fetchAllVouchers(); // Refresh vouchers as status may have changed
    } catch (error) {
      console.error('Error updating submission:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to mark payment as ${isVerified ? 'paid' : 'default'}`,
      });
    }
  };

  // Render fee structure cards for each fee
  const renderFeeStructureCard = (fee: any, index: number) => {
    return (
      <div 
        key={fee.id || index} 
        className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Grade {fee.grade}</h3>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditFeeStructure(fee)}
              className="h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteFeeStructure(fee.id)}
              className="h-8 w-8 text-red-500"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex flex-col">
            <span className="text-gray-500">Tuition Fee</span>
            <span>${fee.tuitionFee}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500">Other Fee</span>
            <span>${fee.otherFee}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500">Total Fee</span>
            <span>${fee.totalFee ?? (parseInt(fee.tuitionFee) + parseInt(fee.otherFee))}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500">Due Date</span>
            <span>{fee.dueDate}</span>
          </div>
        </div>
      </div>
    );
  };

  // Render fee collection card for mobile view
  const renderFeeCollectionCard = (fee: any) => (
    <Card key={fee.id} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{fee.studentName}</CardTitle>
            <CardDescription>{fee.rollNumber}</CardDescription>
          </div>
          <Badge
            variant={fee.status === "paid" ? "default" : fee.status === "pending" ? "outline" : "destructive"}
            className={fee.status === "paid" ? "bg-green-500 hover:bg-green-600" : ""}
          >
            {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Grade/Class:</p>
            <p className="font-medium">{fee.class}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Month:</p>
            <p className="font-medium">{fee.month}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Amount:</p>
            <p className="font-medium">${fee.amount}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{fee.status === "paid" ? "Payment Date:" : "Due Date:"}</p>
            <p className="font-medium">{fee.status === "paid" ? fee.paymentDate : fee.dueDate}</p>
          </div>
          {fee.status === "paid" && (
            <>
              <div>
                <p className="text-muted-foreground">Payment Method:</p>
                <p className="font-medium">{fee.paymentMethod}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Receipt #:</p>
                <p className="font-medium">{fee.receiptNumber}</p>
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-end">
        {fee.status === "paid" ? (
          <Button variant="outline" size="sm" className="text-xs">
            <Download className="h-3.5 w-3.5 mr-1" />
            Receipt
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="text-xs">
            <Send className="h-3.5 w-3.5 mr-1" />
            Reminder
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  // Render defaulter card for mobile view
  const renderDefaulterCard = (defaulter: any) => (
    <Card key={defaulter.id} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{defaulter.studentName}</CardTitle>
            <CardDescription>{defaulter.rollNumber}</CardDescription>
          </div>
          <Badge variant="destructive">Default</Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Grade/Class:</p>
            <p className="font-medium">{defaulter.class}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Month:</p>
            <p className="font-medium">{defaulter.month}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Amount:</p>
            <p className="font-medium">${defaulter.amount}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Submission Date:</p>
            <p className="font-medium">{defaulter.submissionDate}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Voucher #:</p>
            <p className="font-medium">{defaulter.voucherNumber}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-end">
        <Button variant="outline" size="sm" className="text-xs">
          <Send className="h-3.5 w-3.5 mr-1" />
          Send Reminder
        </Button>
      </CardFooter>
    </Card>
  );
  
  // Render voucher card for mobile view
  const renderVoucherCard = (voucher: any) => (
    <Card key={voucher.id} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{voucher.studentName}</CardTitle>
            <CardDescription>{voucher.rollNumber}</CardDescription>
          </div>
          <Badge variant="outline">{voucher.voucherNumber}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Student Name:</p>
            <p className="font-medium">{voucher.studentName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Roll Number:</p>
            <p className="font-medium">{voucher.rollNumber}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Class:</p>
            <p className="font-medium">{voucher.className}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Month:</p>
            <p className="font-medium">{voucher.month}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Amount:</p>
            <p className="font-medium">${voucher.amount}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Sent Date:</p>
            <p className="font-medium">{voucher.issueDate}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Due Date:</p>
            <p className="font-medium">{voucher.dueDate}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-end gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs"
          onClick={() => {
            setSelectedVoucher(voucher);
            setShowVoucherDialog(true);
          }}
        >
          <Download className="h-3.5 w-3.5 mr-1" />
          Download
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs text-red-500 border-red-500 hover:bg-red-50"
          onClick={() => handleDeleteVoucher(voucher.id)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );

  // Render submission card for mobile view  
  const renderSubmissionCard = (submission: any) => (
    <Card key={submission.id} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{submission.studentName || "Unknown Student"}</CardTitle>
            <CardDescription>{submission.rollNumber || "No Roll Number"}</CardDescription>
          </div>
          <Badge
            variant={submission.status === "Verified" || submission.status === "Paid" ? "default" : "outline"}
            className={
              submission.status === "Verified" || submission.status === "Paid" 
                ? "bg-green-500 hover:bg-green-600" 
                : submission.status === "Pending"
                  ? "bg-yellow-500 hover:bg-yellow-600"
                  : submission.status === "Verifying"
                    ? "bg-orange-500 hover:bg-orange-600"
                  : "bg-red-500 hover:bg-red-600"
            }
          >
            {typeof submission.status === 'string' 
              ? submission.status.charAt(0).toUpperCase() + submission.status.slice(1) 
              : submission.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Grade/Class:</p>
            <p className="font-medium">{submission.class || "N/A"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Month:</p>
            <p className="font-medium">{submission.month || "N/A"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Amount:</p>
            <p className="font-medium">${submission.amount || 0}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Submission Date:</p>
            <p className="font-medium">{submission.submissionDate || "N/A"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Voucher #:</p>
            <p className="font-medium">{submission.voucherNumber || "N/A"}</p>
          </div>
          {submission.paymentMethod && (
            <div>
              <p className="text-muted-foreground">Payment Method:</p>
              <p className="font-medium">{submission.paymentMethod}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between">
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => {
            setSelectedSubmission(submission)
            setShowSubmissionDetailsDialog(true)
          }}
        >
          <Eye className="h-3.5 w-3.5 mr-1" />
          View Details
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-green-500 border-green-500 hover:bg-green-50 text-xs"
          onClick={() => handleVerifySubmission(submission.id, true)}
        >
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
          Verify
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-red-500 border-red-500 hover:bg-red-50 text-xs"
          onClick={() => handleVerifySubmission(submission.id, false)}
        >
          <XCircle className="h-3.5 w-3.5 mr-1" />
          Reject
        </Button>
      </CardFooter>
    </Card>
  );

  // Handle deleting a voucher
  const handleDeleteVoucher = async (voucherId: string) => {
    if (!voucherId) return;
    
    // Set the voucher to delete and show the confirmation dialog
    setVoucherToDelete(voucherId);
    setShowDeleteConfirmDialog(true);
  };

  // Handle confirmed deletion of a voucher
  const handleConfirmDelete = async () => {
    const voucherId = voucherToDelete;
    if (!voucherId) return;
    
    try {
      setVoucherLoading(true);
      console.log("Attempting to delete voucher with ID:", voucherId);
      
      const response = await fetch(`/api/fees/vouchers?id=${voucherId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "X-Requested-With": "XMLHttpRequest"
        },
        credentials: 'include',
      });
      
      console.log("Delete voucher response status:", response.status);
      
      // Close the confirmation dialog regardless of success or failure
      setShowDeleteConfirmDialog(false);
      setVoucherToDelete(null);
      
      if (response.ok) {
        console.log("Voucher deleted successfully, updating UI");
        
        toast({
          title: "Success",
          description: "Voucher deleted successfully"
        });
        
        // Remove the deleted voucher from the current state to update UI immediately
        setVouchers((currentVouchers) => 
          currentVouchers.filter(voucher => voucher.id !== voucherId)
        );
        
        // Reset cache state to ensure data freshness on next tab selection
        setVouchersLoaded(false);
        
        // Also refresh the full list if filters are applied
        if (selectedClass && selectedMonth) {
          console.log("Refreshing filtered vouchers list");
          fetchVouchersForClass(selectedClass, selectedMonth);
        } else {
          console.log("Refreshing all vouchers list");
          fetchAllVouchers();
        }
      } else {
        // Try to parse error response
        let errorMessage = "Failed to delete voucher";
        
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const text = await response.text();
            if (text && text.trim()) {
              const errorData = JSON.parse(text);
              errorMessage = errorData.error || errorMessage;
              console.error("Error response data:", errorData);
            }
          } else {
            const text = await response.text();
            console.error("Non-JSON error response:", text);
          }
        } catch (e) {
          console.error("Error parsing error response:", e);
        }
        
        toast({
          title: "Error",
          description: errorMessage
        });
      }
    } catch (error) {
      console.error("Client-side error deleting voucher:", error);
      
      toast({
        title: "Error",
        description: "An error occurred while deleting the voucher"
      });
      
      // Close the confirmation dialog
      setShowDeleteConfirmDialog(false);
      setVoucherToDelete(null);
    } finally {
      setVoucherLoading(false);
    }
  };

  // Fetch upcoming months function
  const fetchUpcomingMonths = async () => {
    try {
      const response = await fetch("/api/fees/upcoming-months")
      if (!response.ok) {
        throw new Error("Failed to fetch upcoming months")
      }
      const data = await response.json()
      // Use the getUpcomingMonths function instead of setting state directly
      const months = getUpcomingMonths()
    } catch (error) {
      console.error("Error fetching upcoming months:", error)
      toast({
        title: "Error",
        description: "Failed to fetch upcoming months"
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Fee Management</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Log out
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 overflow-auto">
          <TabsTrigger value="fee-structure" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Structure</span>
          </TabsTrigger>
          <TabsTrigger value="fee-collection" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Collection</span>
          </TabsTrigger>
          <TabsTrigger value="defaulters" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Defaulters</span>
          </TabsTrigger>
          <TabsTrigger value="vouchers" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Vouchers</span>
          </TabsTrigger>
          <TabsTrigger value="submissions" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Submissions</span>
          </TabsTrigger>
        </TabsList>

        {/* Fee Structure Tab */}
        <TabsContent value="fee-structure" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Fee Structure</CardTitle>
              <CardDescription>Manage fee structures for different grades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search fee structures..."
                    className="pl-8"
                    value={feeSearchQuery}
                    onChange={(e) => setFeeSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <Select value={gradeFilter} onValueChange={setGradeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Grades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      <SelectItem value="Grade 1">Grade 1</SelectItem>
                      <SelectItem value="Grade 2">Grade 2</SelectItem>
                      <SelectItem value="Grade 3">Grade 3</SelectItem>
                      <SelectItem value="Grade 4">Grade 4</SelectItem>
                      <SelectItem value="Grade 5">Grade 5</SelectItem>
                      <SelectItem value="Grade 6">Grade 6</SelectItem>
                      <SelectItem value="Grade 7">Grade 7</SelectItem>
                      <SelectItem value="Grade 8">Grade 8</SelectItem>
                      <SelectItem value="Grade 9">Grade 9</SelectItem>
                      <SelectItem value="Grade 10">Grade 10</SelectItem>
                    </SelectContent>
                  </Select>
                  <Dialog open={showFeeDialog} onOpenChange={(open) => {
                    setShowFeeDialog(open);
                    if (!open) {
                      setSelectedGrade("");
                      setIsEditMode(false);
                      setEditingFee(null);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2 sm:mr-0" />
                        <span className="hidden sm:inline ml-2">Add Fee</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>{isEditMode ? "Edit Fee Structure" : "Add Fee Structure"}</DialogTitle>
                        <DialogDescription>
                          {isEditMode 
                            ? "Update the fee structure details below." 
                            : "Enter the details for the new fee structure."}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label htmlFor="fee-grade">Grade</Label>
                          <Select 
                            value={isEditMode ? (selectedGrade || editingFee?.grade) : selectedGrade} 
                            onValueChange={setSelectedGrade}
                          >
                            <SelectTrigger id="fee-grade">
                              <SelectValue placeholder="Select grade" />
                            </SelectTrigger>
                            <SelectContent>
                              {["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10"].map((grade) => (
                                <SelectItem key={grade} value={grade}>
                                  {grade}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="fee-tuition">Tuition Fee ($)</Label>
                          <Input
                            id="fee-tuition"
                            type="number"
                            placeholder="Enter tuition fee"
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="fee-other">Other Fee ($)</Label>
                          <Input
                            id="fee-other"
                            type="number"
                            placeholder="Enter other fee"
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="fee-due-date">Due Date</Label>
                          <Input
                            id="fee-due-date"
                            type="text"
                            placeholder="e.g., 5th of every month"
                            defaultValue="5th of every month"
                            className="w-full"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowFeeDialog(false);
                            setIsEditMode(false);
                            setEditingFee(null);
                            setSelectedGrade("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={isEditMode ? handleUpdateFeeStructure : handleAddFeeStructure}
                        >
                          {isEditMode ? "Update" : "Save"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Mobile view - Card layout */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <Spinner className="mr-2" />
                    <span>Loading fee structures...</span>
                  </div>
                ) : feeStructures.length === 0 ? (
                  <div className="text-center p-8">
                    <p>No fee structures found.</p>
                  </div>
                ) : (
                  filteredFeeStructures.map((fee: any, index: number) => renderFeeStructureCard(fee, index))
                )}
              </div>

              {/* Desktop view - Table layout */}
              <div className="hidden md:block">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grade</TableHead>
                        <TableHead>Tuition Fee</TableHead>
                        <TableHead>Other Fee</TableHead>
                        <TableHead>Total Fee</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <div className="flex items-center justify-center">
                              <Spinner className="mr-2" />
                              <span>Loading fee structures...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : feeStructures.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            No fee structures found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredFeeStructures.map((fee: any, index: number) => (
                          <TableRow key={fee.id || index}>
                            <TableCell>{fee.grade}</TableCell>
                            <TableCell>${fee.tuitionFee}</TableCell>
                            <TableCell>${fee.otherFee}</TableCell>
                            <TableCell>${fee.totalFee ?? (parseInt(fee.tuitionFee) + parseInt(fee.otherFee))}</TableCell>
                            <TableCell>{fee.dueDate}</TableCell>
                            <TableCell className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditFeeStructure(fee)}
                                className="h-8 w-8"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteFeeStructure(fee.id)}
                                className="h-8 w-8 text-red-500"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fee Collection Tab */}
        <TabsContent value="fee-collection" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Fee Collection</CardTitle>
              <CardDescription>Track fee payments and collections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search students..."
                    className="pl-8"
                    value={collectionSearchQuery}
                    onChange={(e) => setCollectionSearchQuery(e.target.value)}
                  />
                </div>
                <div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Mobile view - Card layout */}
              <div className="md:hidden">
                {filteredFeeCollection.length > 0 ? (
                  filteredFeeCollection.map(renderFeeCollectionCard)
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No fee collections found.</div>
                )}
              </div>

              {/* Desktop view - Table layout */}
              <div className="hidden md:block rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Roll Number</TableHead>
                        <TableHead>Grade/Class</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>{statusFilter === "paid" ? "Payment Date" : "Due Date"}</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFeeCollection.map((fee) => (
                        <TableRow key={fee.id}>
                          <TableCell className="font-medium">{fee.studentName}</TableCell>
                          <TableCell>{fee.rollNumber}</TableCell>
                          <TableCell>{fee.class}</TableCell>
                          <TableCell>{fee.month}</TableCell>
                          <TableCell>${fee.amount}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                fee.status === "paid" ? "default" : fee.status === "pending" ? "outline" : "destructive"
                              }
                              className={fee.status === "paid" ? "bg-green-500 hover:bg-green-600" : ""}
                            >
                              {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{fee.status === "paid" ? fee.paymentDate : fee.dueDate}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {fee.status === "paid" ? (
                                <Button variant="outline" size="sm">
                                  <Download className="h-4 w-4 mr-2" />
                                  Receipt
                                </Button>
                              ) : (
                                <Button variant="outline" size="sm">
                                  <Send className="h-4 w-4 mr-2" />
                                  Reminder
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredFeeCollection.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center">
                            No fee collections found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Defaulters Tab */}
        <TabsContent value="defaulters" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Fee Defaulters</CardTitle>
              <CardDescription>Students with default fee payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search defaulters..."
                    className="pl-8"
                    value={defaulterSearchQuery}
                    onChange={(e) => setDefaulterSearchQuery(e.target.value)}
                  />
                </div>
                <Button className="w-full sm:w-auto">
                  <Send className="h-4 w-4 mr-2" />
                  Send Reminders to All
                </Button>
              </div>

              {defaultersLoading ? (
                <div className="flex justify-center items-center h-32">
                  <Spinner className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Mobile view - Card layout */}
                  <div className="md:hidden">
                    {filteredDefaulters.length > 0 ? (
                      filteredDefaulters.map(renderDefaulterCard)
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">No defaulters found.</div>
                    )}
                  </div>

                  {/* Desktop view - Table layout */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Roll Number</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Month</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Submission Date</TableHead>
                          <TableHead>Voucher #</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDefaulters.map((defaulter) => (
                          <TableRow key={defaulter.id}>
                            <TableCell className="font-medium">{defaulter.studentName}</TableCell>
                            <TableCell>{defaulter.rollNumber}</TableCell>
                            <TableCell>{defaulter.class}</TableCell>
                            <TableCell>{defaulter.month}</TableCell>
                            <TableCell>${defaulter.amount}</TableCell>
                            <TableCell>{defaulter.submissionDate}</TableCell>
                            <TableCell>{defaulter.voucherNumber}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm">
                                  <Send className="h-4 w-4 mr-2" />
                                  Send Reminder
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredDefaulters.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">
                              No defaulters found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vouchers Tab */}
        <TabsContent value="vouchers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Fee Vouchers</CardTitle>
              <CardDescription>Manage and send fee vouchers to students and parents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search vouchers..."
                    className="pl-8"
                    value={voucherSearchQuery}
                    onChange={(e) => setVoucherSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <Select value={voucherFilter} onValueChange={setVoucherFilter}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Filter by class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classes.map((classItem) => (
                        <SelectItem key={classItem.id} value={classItem.className}>
                          {classItem.className}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={showSendVoucherDialog} onOpenChange={setShowSendVoucherDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full sm:w-auto">
                        <Send className="h-4 w-4 mr-2" />
                        Send Vouchers
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Send Fee Vouchers</DialogTitle>
                        <DialogDescription>
                          Select a class and month to send fee vouchers to students.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="voucher-class">Class</Label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                              <SelectTrigger id="voucher-class">
                                <SelectValue placeholder="Select class" />
                              </SelectTrigger>
                              <SelectContent>
                                {classes.map((classItem) => (
                                  <SelectItem key={classItem.id} value={classItem.id}>
                                    {classItem.className}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="voucher-month">Month</Label>
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                              <SelectTrigger id="voucher-month">
                                <SelectValue placeholder="Select month" />
                              </SelectTrigger>
                              <SelectContent>
                                {getUpcomingMonths().map((month) => (
                                  <SelectItem key={month.value} value={month.value}>
                                    {month.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Message (Optional)</Label>
                          <Input 
                            placeholder="Add a message to include with the vouchers" 
                            value={voucherMessage}
                            onChange={(e) => setVoucherMessage(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowSendVoucherDialog(false)}
                          className="sm:w-auto w-full"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSendVouchers}
                          disabled={voucherLoading || !selectedClass || !selectedMonth}
                          className="sm:w-auto w-full"
                        >
                          {voucherLoading ? (
                            <>
                              <Spinner className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Send Vouchers
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Mobile view - Card layout */}
              <div className="md:hidden">
                {voucherLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Spinner className="mr-2" />
                    <span>Loading vouchers...</span>
                  </div>
                ) : filteredVouchers.length > 0 ? (
                  filteredVouchers.map(renderVoucherCard)
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No vouchers found.</div>
                )}
              </div>

              {/* Desktop view - Table layout */}
              <div className="hidden md:block rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Roll Number</TableHead>
                        <TableHead>Grade/Class</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Voucher Number</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {voucherLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center">
                            <div className="flex items-center justify-center">
                              <Spinner className="mr-2" />
                              <span>Loading vouchers...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredVouchers.length > 0 ? (
                        filteredVouchers.map((voucher) => (
                          <TableRow key={voucher.id}>
                            <TableCell className="font-medium">{voucher.studentName}</TableCell>
                            <TableCell>{voucher.rollNumber}</TableCell>
                            <TableCell>{voucher.className}</TableCell>
                            <TableCell>{voucher.month}</TableCell>
                            <TableCell>${voucher.amount}</TableCell>
                            <TableCell>{voucher.dueDate}</TableCell>
                            <TableCell>{voucher.voucherNumber}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedVoucher(voucher);
                                    setShowVoucherDialog(true);
                                  }}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-red-500 border-red-500 hover:bg-red-50"
                                  onClick={() => handleDeleteVoucher(voucher.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center">
                            No vouchers found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Submissions</CardTitle>
              <CardDescription>View and manage fee payment submissions.</CardDescription>
            </CardHeader>
            <CardContent>
              {submissionsLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner className="h-8 w-8 animate-spin text-muted-foreground mr-2" />
                  <span>Loading submissions...</span>
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No submissions found.</p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Roll Number</TableHead>
                          <TableHead>Month</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Submission Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Voucher</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissions.map((submission) => (
                          <TableRow key={submission.id}>
                            <TableCell className="font-medium">{submission.studentName}</TableCell>
                            <TableCell>{submission.rollNumber}</TableCell>
                            <TableCell>{submission.month}</TableCell>
                            <TableCell>${submission.amount}</TableCell>
                            <TableCell>{submission.submissionDate}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  submission.status === "Verified" || submission.status === "Paid"
                                    ? "bg-green-500 hover:bg-green-600"
                                    : submission.status === "Pending"
                                      ? "bg-yellow-500 hover:bg-yellow-600"
                                      : submission.status === "Verifying"
                                        ? "bg-orange-500 hover:bg-orange-600"
                                      : "bg-red-500 hover:bg-red-600"
                                }
                              >
                                {submission.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{submission.voucherNumber}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSubmission(submission);
                                    setShowSubmissionDetailsDialog(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-500 border-green-500 hover:bg-green-50"
                                  onClick={() => handleVerifySubmission(submission.id, true)}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Verify
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-500 border-red-500 hover:bg-red-50"
                                  onClick={() => handleVerifySubmission(submission.id, false)}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
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

          {/* Mobile view for submissions */}
          <div className="md:hidden space-y-4 mt-4">
            {submissions.map((submission) => renderSubmissionCard(submission))}
            {submissions.length === 0 && !submissionsLoading && (
              <div className="text-center py-8 text-muted-foreground">No submissions found.</div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Submission Details Dialog */}
      <Dialog open={showSubmissionDetailsDialog} onOpenChange={setShowSubmissionDetailsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedSubmission && (
            <>
              <DialogHeader>
                <DialogTitle>Fee Submission Details</DialogTitle>
                <DialogDescription>
                  Submission from {selectedSubmission.studentName || "Unknown Student"} ({selectedSubmission.rollNumber || "No Roll Number"})
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Student Information</h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Name:</span> {selectedSubmission.studentName || "Unknown Student"}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Roll Number:</span> {selectedSubmission.rollNumber || "No Roll Number"}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Class:</span> {selectedSubmission.class || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Payment Information</h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Month:</span> {selectedSubmission.month || "N/A"}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Amount:</span> ${selectedSubmission.amount || 0}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Voucher #:</span> {selectedSubmission.voucherNumber || "N/A"}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Payment Method:</span> {selectedSubmission.paymentMethod || "N/A"}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Submission Date:</span>{" "}
                        {selectedSubmission.submissionDate || "N/A"}
                      </p>
                      {(selectedSubmission.status === "Verified" || selectedSubmission.status === "Paid") && (
                        <>
                          <p>
                            <span className="text-muted-foreground">Verification Date:</span>{" "}
                            {selectedSubmission.verificationDate || "N/A"}
                          </p>
                          <p>
                            <span className="text-muted-foreground">Receipt #:</span> {selectedSubmission.receiptNumber || "Not assigned"}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Submitted Voucher Image</h3>
                  <div className="border rounded-md overflow-hidden">
                    <img
                      src={selectedSubmission.paymentProof || "/placeholder.svg?height=300&width=200"}
                      alt="Voucher"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setShowSubmissionDetailsDialog(false)} className="sm:w-auto w-full">
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="text-red-500 border-red-500 hover:bg-red-50 sm:w-auto w-full"
                  onClick={() => handleVerifySubmission(selectedSubmission.id, false)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  variant="outline"
                  className="text-green-500 border-green-500 hover:bg-green-50 sm:w-auto w-full" 
                  onClick={() => handleVerifySubmission(selectedSubmission.id, true)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Verify
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

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
                    <p className="font-medium">{selectedVoucher.studentName}</p>
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
                    <p className="text-muted-foreground">Amount:</p>
                    <p className="font-medium">${selectedVoucher.amount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sent Date:</p>
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
                      <span>${Math.round(selectedVoucher.amount * 0.8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Other Fees</span>
                      <span>${Math.round(selectedVoucher.amount * 0.2)}</span>
                    </div>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this voucher? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteConfirmDialog(false);
                setVoucherToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={voucherLoading}
            >
              {voucherLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

