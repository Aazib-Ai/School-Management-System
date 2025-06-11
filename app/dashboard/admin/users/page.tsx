"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Plus,
  Edit,
  Trash,
  ChevronRight,
  User,
  Users,
  GraduationCap,
  MoreHorizontal,
  MapPin,
  Clock,
  UserPlus,
  Ban,
  CheckCircle,
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export default function UserManagementPage() {
  // State for active tab
  const [activeTab, setActiveTab] = useState("users") // Change default to "users"

  // Add mock data for all users
  const allUsers = [
    {
      id: "qwewe123",  // Using more realistic Firebase document IDs
      avatar: "QW",
      name: "qwewe",
      email: "qweqw@gmail.com",
      role: "student",
      status: "active",
    },
    {
      id: "aazib456",
      avatar: "AA",
      name: "Aazib Akram",
      email: "1234@gmail.com",
      role: "student",
      status: "active",
    },
    {
      id: "affan789",
      avatar: "AF",
      name: "Affan",
      email: "0987@gmail.com",
      role: "teacher",
      status: "active",
    },
    {
      id: "qazi101112",
      avatar: "QA",
      name: "qazi",
      email: "qazi@gmail.com",
      role: "teacher",
      status: "active",
    },
    {
      id: "ali131415",
      avatar: "AL",
      name: "ALi",
      email: "345@gmail.com",
      role: "student",
      status: "active",
    },
  ]

  // Add state for users tab
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [userRoleFilter, setUserRoleFilter] = useState("all")
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [showUserUploadDialog, setShowUserUploadDialog] = useState(false)

  // State for students tab
  const [gradeFilter, setGradeFilter] = useState("all")
  const [studentSearchQuery, setStudentSearchQuery] = useState("")
  const [showStudentDialog, setShowStudentDialog] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [showStudentDetails, setShowStudentDetails] = useState(false)
  const [selectedStudentData, setSelectedStudentData] = useState<any>(null)
  const [showStudentUploadDialog, setShowStudentUploadDialog] = useState(false)

  // State for teachers tab
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [teacherSearchQuery, setTeacherSearchQuery] = useState("")
  const [showTeacherDialog, setShowTeacherDialog] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null)
  const [showTeacherDetails, setShowTeacherDetails] = useState(false)
  const [selectedTeacherData, setSelectedTeacherData] = useState<any>(null)
  const [showTeacherUploadDialog, setShowTeacherUploadDialog] = useState(false)

  // State for parents tab
  const [parentSearchQuery, setParentSearchQuery] = useState("")
  const [showParentDialog, setShowParentDialog] = useState(false)
  const [selectedParent, setSelectedParent] = useState<string | null>(null)
  const [showParentDetails, setShowParentDetails] = useState(false)
  const [selectedParentData, setSelectedParentData] = useState<any>(null)
  const [showParentUploadDialog, setShowParentUploadDialog] = useState(false)

  // Add these state variables at the top with other states
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [users, setUsers] = useState(allUsers) // Initialize users state with allUsers
  const [userRole, setUserRole] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Add these state variables after other state declarations
  const [newUserName, setNewUserName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserRole, setNewUserRole] = useState("")
  const [newUserStatus, setNewUserStatus] = useState("active")
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Add a state to track which user is being updated
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const roleFilterOptions = [
    { label: "All Roles", value: "all" },
    { label: "Students", value: "student" },
    { label: "Teachers", value: "teacher" },
    { label: "Parents", value: "parent" },
  ]

  // Fetch users from the database
  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      setLoadError(null);
      
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }
      
      const data = await response.json();
      
      // If we have users from the API, use them
      if (data && Array.isArray(data) && data.length > 0) {
        // Add avatar to each user
        const usersWithAvatars = data.map(user => ({
          ...user,
          avatar: user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
        }));
        
        setUsers(usersWithAvatars);
      } else {
        // Otherwise, use the mock data
        setUsers(allUsers);
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setLoadError(error.message);
      // Fall back to mock data
      setUsers(allUsers);
    } finally {
      setIsLoadingUsers(false);
    }
  };
  
  // Add a function to refresh the users list
  const refreshUsers = () => {
    fetchUsers();
  };
  
  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      setIsLoading(true);
      setUpdatingUserId(userId);
      const user = users.find(u => u.id === userId);
      if (!user) {
        throw new Error('User not found in local state');
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          role: user.role,
          status: newStatus
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        // If the user doesn't exist in the database but exists in our local state
        if (response.status === 404) {
          // Remove the user from local state
          setUsers(users.filter(u => u.id !== userId));
          toast({
            title: "User not found in database",
            description: "This user has been removed from the list"
          });
          return;
        }
        throw new Error(data.error || 'Failed to update user status');
      }

      // Update local state
      const updatedUsers = users.map(u => 
        u.id === userId ? { ...u, status: newStatus } : u
      );
      setUsers(updatedUsers);

      toast({
        title: "Success",
        description: `User status updated to ${newStatus}`
      });
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Error updating user status",
        description: error.message || "Failed to update user status"
      });
    } finally {
      setIsLoading(false);
      setUpdatingUserId(null);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedUser),
      })

      const data = await response.json();

      if (!response.ok) {
        // If the user doesn't exist in the database but exists in our local state
        if (response.status === 404) {
          // Remove the user from local state
          setUsers(users.filter(user => user.id !== selectedUser.id))
          setShowEditDialog(false)
          setSelectedUser(null)
          
          toast({
            title: "User not found in database",
            description: "This user has been removed from the list"
          });
          return;
        }
        throw new Error(data.error || 'Failed to update user')
      }

      // Update local state
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id ? selectedUser : user
      )
      setUsers(updatedUsers)

      setShowEditDialog(false)
      setSelectedUser(null)

      toast({
        title: "Success",
        description: "User updated successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error updating user",
        description: error.message || "Failed to update user"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      const data = await response.json();

      if (!response.ok) {
        // If the user doesn't exist in the database but exists in our local state
        if (response.status === 404) {
          // Remove the user from local state
          setUsers(users.filter(user => user.id !== userId))
          toast({
            title: "User not found in database",
            description: "This user has been removed from the list"
          });
          return;
        }
        throw new Error(data.error || 'Failed to delete user')
      }

      // Update local state
      setUsers(users.filter(user => user.id !== userId))

      toast({
        title: "Success",
        description: "User deleted successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error deleting user",
        description: error.message || "Failed to delete user"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Mock data for students
  const students = [
    {
      id: "s1",
      name: "Alex Johnson",
      rollNumber: "S2023-001",
      grade: "Grade 9",
      class: "Grade 9A",
      gender: "Male",
      dob: "2008-05-15",
      address: "123 Main St, Springfield",
      phone: "(555) 123-4567",
      email: "alex.johnson@example.com",
      parentName: "Robert Johnson",
      parentPhone: "(555) 123-4568",
      parentEmail: "robert.johnson@example.com",
      enrolledSubjects: [
        { name: "Mathematics 101", grade: "A", attendance: "95%" },
        { name: "Science 101", grade: "B+", attendance: "92%" },
        { name: "English 101", grade: "A-", attendance: "98%" },
        { name: "History 101", grade: "B", attendance: "90%" },
      ],
      attendanceHistory: [
        { date: "2023-09-01", status: "Present" },
        { date: "2023-09-02", status: "Present" },
        { date: "2023-09-03", status: "Absent" },
        { date: "2023-09-04", status: "Present" },
        { date: "2023-09-05", status: "Present" },
      ],
      results: [
        { term: "Mid-Term", totalMarks: "450/500", percentage: "90%", grade: "A" },
        { term: "Final-Term", totalMarks: "475/500", percentage: "95%", grade: "A+" },
      ],
    },
    {
      id: "s2",
      name: "Emma Davis",
      rollNumber: "S2023-002",
      grade: "Grade 9",
      class: "Grade 9A",
      gender: "Female",
      dob: "2008-07-22",
      address: "456 Oak Ave, Springfield",
      phone: "(555) 234-5678",
      email: "emma.davis@example.com",
      parentName: "Jennifer Davis",
      parentPhone: "(555) 234-5679",
      parentEmail: "jennifer.davis@example.com",
      enrolledSubjects: [
        { name: "Mathematics 101", grade: "B+", attendance: "92%" },
        { name: "Science 101", grade: "A", attendance: "95%" },
        { name: "English 101", grade: "A", attendance: "97%" },
        { name: "History 101", grade: "B+", attendance: "93%" },
      ],
      attendanceHistory: [
        { date: "2023-09-01", status: "Present" },
        { date: "2023-09-02", status: "Present" },
        { date: "2023-09-03", status: "Present" },
        { date: "2023-09-04", status: "Late" },
        { date: "2023-09-05", status: "Present" },
      ],
      results: [
        { term: "Mid-Term", totalMarks: "440/500", percentage: "88%", grade: "A-" },
        { term: "Final-Term", totalMarks: "460/500", percentage: "92%", grade: "A" },
      ],
    },
    {
      id: "s3",
      name: "Michael Brown",
      rollNumber: "S2023-003",
      grade: "Grade 9",
      class: "Grade 9A",
      gender: "Male",
      dob: "2008-03-10",
      address: "789 Pine St, Springfield",
      phone: "(555) 345-6789",
      email: "michael.brown@example.com",
      parentName: "David Brown",
      parentPhone: "(555) 345-6780",
      parentEmail: "david.brown@example.com",
      enrolledSubjects: [
        { name: "Mathematics 101", grade: "C+", attendance: "85%" },
        { name: "Science 101", grade: "B-", attendance: "88%" },
        { name: "English 101", grade: "B", attendance: "90%" },
        { name: "History 101", grade: "C", attendance: "82%" },
      ],
      attendanceHistory: [
        { date: "2023-09-01", status: "Present" },
        { date: "2023-09-02", status: "Absent" },
        { date: "2023-09-03", status: "Present" },
        { date: "2023-09-04", status: "Present" },
        { date: "2023-09-05", status: "Absent" },
      ],
      results: [
        { term: "Mid-Term", totalMarks: "375/500", percentage: "75%", grade: "C+" },
        { term: "Final-Term", totalMarks: "400/500", percentage: "80%", grade: "B-" },
      ],
    },
    {
      id: "s4",
      name: "Sophia Wilson",
      rollNumber: "S2023-004",
      grade: "Grade 10",
      class: "Grade 10A",
      gender: "Female",
      dob: "2007-11-18",
      address: "321 Elm St, Springfield",
      phone: "(555) 456-7890",
      email: "sophia.wilson@example.com",
      parentName: "Thomas Wilson",
      parentPhone: "(555) 456-7891",
      parentEmail: "thomas.wilson@example.com",
      enrolledSubjects: [
        { name: "Mathematics 201", grade: "A+", attendance: "98%" },
        { name: "Physics 201", grade: "A", attendance: "96%" },
        { name: "English Literature", grade: "A-", attendance: "95%" },
        { name: "World History", grade: "B+", attendance: "92%" },
      ],
      attendanceHistory: [
        { date: "2023-09-01", status: "Present" },
        { date: "2023-09-02", status: "Present" },
        { date: "2023-09-03", status: "Present" },
        { date: "2023-09-04", status: "Present" },
        { date: "2023-09-05", status: "Present" },
      ],
      results: [
        { term: "Mid-Term", totalMarks: "485/500", percentage: "97%", grade: "A+" },
        { term: "Final-Term", totalMarks: "490/500", percentage: "98%", grade: "A+" },
      ],
    },
    {
      id: "s5",
      name: "James Taylor",
      rollNumber: "S2023-005",
      grade: "Grade 10",
      class: "Grade 10A",
      gender: "Male",
      dob: "2007-09-05",
      address: "654 Maple Ave, Springfield",
      phone: "(555) 567-8901",
      email: "james.taylor@example.com",
      parentName: "Richard Taylor",
      parentPhone: "(555) 567-8902",
      parentEmail: "richard.taylor@example.com",
      enrolledSubjects: [
        { name: "Mathematics 201", grade: "B-", attendance: "88%" },
        { name: "Physics 201", grade: "C+", attendance: "85%" },
        { name: "English Literature", grade: "B", attendance: "90%" },
        { name: "World History", grade: "B-", attendance: "87%" },
      ],
      attendanceHistory: [
        { date: "2023-09-01", status: "Present" },
        { date: "2023-09-02", status: "Late" },
        { date: "2023-09-03", status: "Absent" },
        { date: "2023-09-04", status: "Present" },
        { date: "2023-09-05", status: "Present" },
      ],
      results: [
        { term: "Mid-Term", totalMarks: "380/500", percentage: "76%", grade: "C+" },
        { term: "Final-Term", totalMarks: "410/500", percentage: "82%", grade: "B-" },
      ],
    },
  ]

  // Mock data for teachers
  const teachers = [
    {
      id: "t1",
      name: "Prof. Sarah Williams",
      email: "sarah.williams@example.com",
      phone: "(555) 987-6543",
      address: "123 Faculty Ave, Springfield",
      specializedIn: ["Mathematics"],
      qualification: "Ph.D. in Mathematics",
      experience: "10 years",
      joinDate: "2013-08-15",
      assignedClasses: [
        { name: "Grade 9A", subject: "Mathematics 101", schedule: "Mon, Wed 9:00-10:30 AM", room: "Room 101" },
        { name: "Grade 9B", subject: "Mathematics 101", schedule: "Tue, Thu 9:00-10:30 AM", room: "Room 102" },
        { name: "Grade 10A", subject: "Mathematics 201", schedule: "Mon, Wed 11:00-12:30 PM", room: "Room 201" },
      ],
    },
    {
      id: "t2",
      name: "Dr. Robert Chen",
      email: "robert.chen@example.com",
      phone: "(555) 876-5432",
      address: "456 Faculty Ave, Springfield",
      specializedIn: ["Physics", "Science"],
      qualification: "Ph.D. in Physics",
      experience: "8 years",
      joinDate: "2015-08-15",
      assignedClasses: [
        { name: "Grade 9A", subject: "Science 101", schedule: "Tue, Thu 9:00-10:30 AM", room: "Room 103" },
        { name: "Grade 10A", subject: "Physics 201", schedule: "Tue, Thu 11:00-12:30 PM", room: "Room 203" },
      ],
    },
    {
      id: "t3",
      name: "Dr. Emily Parker",
      email: "emily.parker@example.com",
      phone: "(555) 765-4321",
      address: "789 Faculty Ave, Springfield",
      specializedIn: ["English", "Literature"],
      qualification: "Ph.D. in English Literature",
      experience: "12 years",
      joinDate: "2011-08-15",
      assignedClasses: [
        { name: "Grade 9A", subject: "English 101", schedule: "Mon, Wed 11:00-12:30 PM", room: "Room 105" },
        { name: "Grade 10A", subject: "English Literature", schedule: "Mon, Wed 2:00-3:30 PM", room: "Room 205" },
      ],
    },
    {
      id: "t4",
      name: "Prof. James Wilson",
      email: "james.wilson@example.com",
      phone: "(555) 654-3210",
      address: "321 Faculty Ave, Springfield",
      specializedIn: ["Computer Science"],
      qualification: "Ph.D. in Computer Science",
      experience: "7 years",
      joinDate: "2016-08-15",
      assignedClasses: [
        { name: "Grade 9A", subject: "Computer Science 101", schedule: "Fri 9:00-12:00 PM", room: "Lab 101" },
        { name: "Grade 10A", subject: "Computer Science 201", schedule: "Fri 1:00-4:00 PM", room: "Lab 201" },
      ],
    },
    {
      id: "t5",
      name: "Dr. Michael Brown",
      email: "michael.brown@example.com",
      phone: "(555) 543-2109",
      address: "654 Faculty Ave, Springfield",
      specializedIn: ["History"],
      qualification: "Ph.D. in History",
      experience: "9 years",
      joinDate: "2014-08-15",
      assignedClasses: [
        { name: "Grade 9A", subject: "History 101", schedule: "Tue, Thu 11:00-12:30 PM", room: "Room 107" },
        { name: "Grade 10A", subject: "World History", schedule: "Tue, Thu 2:00-3:30 PM", room: "Room 207" },
      ],
    },
  ]

  // Mock data for parents
  const parents = [
    {
      id: "p1",
      name: "Robert Johnson",
      email: "robert.johnson@example.com",
      phone: "(555) 123-4568",
      address: "123 Main St, Springfield",
      occupation: "Engineer",
      children: [{ name: "Alex Johnson", rollNumber: "S2023-001", grade: "Grade 9", class: "Grade 9A" }],
    },
    {
      id: "p2",
      name: "Jennifer Davis",
      email: "jennifer.davis@example.com",
      phone: "(555) 234-5679",
      address: "456 Oak Ave, Springfield",
      occupation: "Doctor",
      children: [{ name: "Emma Davis", rollNumber: "S2023-002", grade: "Grade 9", class: "Grade 9A" }],
    },
    {
      id: "p3",
      name: "David Brown",
      email: "david.brown@example.com",
      phone: "(555) 345-6780",
      address: "789 Pine St, Springfield",
      occupation: "Lawyer",
      children: [{ name: "Michael Brown", rollNumber: "S2023-003", grade: "Grade 9", class: "Grade 9A" }],
    },
    {
      id: "p4",
      name: "Thomas Wilson",
      email: "thomas.wilson@example.com",
      phone: "(555) 456-7891",
      address: "321 Elm St, Springfield",
      occupation: "Accountant",
      children: [{ name: "Sophia Wilson", rollNumber: "S2023-004", grade: "Grade 10", class: "Grade 10A" }],
    },
    {
      id: "p5",
      name: "Richard Taylor",
      email: "richard.taylor@example.com",
      phone: "(555) 567-8902",
      address: "654 Maple Ave, Springfield",
      occupation: "Business Owner",
      children: [
        { name: "James Taylor", rollNumber: "S2023-005", grade: "Grade 10", class: "Grade 10A" },
        { name: "Olivia Taylor", rollNumber: "S2023-015", grade: "Grade 7", class: "Grade 7B" },
      ],
    },
  ]

  // Add filter function for users
  const filteredUsers = users.filter(
    (user) =>
      (userRoleFilter === "all" || user.role === userRoleFilter) &&
      (userSearchQuery === "" ||
        user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchQuery.toLowerCase())),
  )

  // Filter students based on grade filter and search query
  const filteredStudents = students.filter(
    (student) =>
      (gradeFilter === "all" || student.grade === gradeFilter) &&
      (studentSearchQuery === "" ||
        student.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
        student.rollNumber.toLowerCase().includes(studentSearchQuery.toLowerCase())),
  )

  // Filter teachers based on subject filter and search query
  const filteredTeachers = teachers.filter(
    (teacher) =>
      (subjectFilter === "all" || teacher.specializedIn.includes(subjectFilter)) &&
      (teacherSearchQuery === "" ||
        teacher.name.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
        teacher.email.toLowerCase().includes(teacherSearchQuery.toLowerCase())),
  )

  // Filter parents based on search query
  const filteredParents = parents.filter(
    (parent) =>
      parentSearchQuery === "" ||
      parent.name.toLowerCase().includes(parentSearchQuery.toLowerCase()) ||
      parent.email.toLowerCase().includes(parentSearchQuery.toLowerCase()) ||
      parent.children.some(
        (child) =>
          child.name.toLowerCase().includes(parentSearchQuery.toLowerCase()) ||
          child.rollNumber.toLowerCase().includes(parentSearchQuery.toLowerCase()),
      ),
  )

  // Add handler for adding a new user
  const handleAddUser = async () => {
    try {
      setIsLoading(true)
      
      // Validate form fields
      if (!newUserName || !newUserEmail || !newUserRole) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
        })
        return
      }
      
      // Create the new user object
      const newUser = {
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        status: newUserStatus,
      }
      
      // Make API call to save the user
      const response = await fetch('/api/admin/users/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })
      
      // Get the response data
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add user');
      }
      
      // Update local state with the ID from the response
      const savedUser = {
        id: data.id,
        avatar: newUserName.split(" ").map(n => n[0]).join("").toUpperCase(),
        ...newUser
      };
      
      // Update local state
      setUsers([...users, savedUser]);
      
      // Reset form fields
      setNewUserName("")
      setNewUserEmail("")
      setNewUserRole("")
      setNewUserStatus("active")
      
      // Close dialog and show success message
      setShowUserDialog(false)
      toast({
        title: "Success",
        description: "User added successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error adding user",
        description: error.message || "Failed to add user",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle adding a new student
  const handleAddStudent = () => {
    toast({
      title: "Student Added",
      description: "The new student has been added successfully.",
    })
    setShowStudentDialog(false)
  }

  // Handle adding a new teacher
  const handleAddTeacher = () => {
    toast({
      title: "Teacher Added",
      description: "The new teacher has been added successfully.",
    })
    setShowTeacherDialog(false)
  }

  // Handle adding a new parent
  const handleAddParent = () => {
    toast({
      title: "Parent Added",
      description: "The new parent has been added successfully.",
    })
    setShowParentDialog(false)
  }

  // Handle viewing student details
  const handleViewStudentDetails = (student: any) => {
    setSelectedStudentData(student)
    setShowStudentDetails(true)
  }

  // Handle viewing teacher details
  const handleViewTeacherDetails = (teacher: any) => {
    setSelectedTeacherData(teacher)
    setShowTeacherDetails(true)
  }

  // Handle viewing parent details
  const handleViewParentDetails = (parent: any) => {
    setSelectedParentData(parent)
    setShowParentDetails(true)
  }

  // Add function to render user card for mobile view
  const renderUserCard = (user: any) => (
    <Card key={user.id}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{user.name}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                setSelectedUser(user)
                setShowEditDialog(true)
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteUser(user.id)}>
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  if (updatingUserId === null) {
                    const newStatus = user.status === "active" ? "inactive" : "active";
                    handleStatusChange(user.id, newStatus);
                  }
                }}
                disabled={updatingUserId === user.id}
                className={user.status === "active" ? "text-red-500" : "text-green-500"}
              >
                {updatingUserId === user.id ? (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    <span>Updating...</span>
                  </>
                ) : user.status === "active" ? (
                  <>
                    <Ban className="h-4 w-4" />
                    <span>Set Inactive</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Set Active</span>
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Badge 
            variant={user.status === "active" ? "default" : "destructive"}
            className={`cursor-pointer ${updatingUserId === user.id ? 'opacity-50' : ''}`}
            onClick={() => {
              if (updatingUserId === null) {
                const newStatus = user.status === "active" ? "inactive" : "active";
                handleStatusChange(user.id, newStatus);
              }
            }}
          >
            {updatingUserId === user.id ? "Updating..." : user.status}
          </Badge>
          <Badge variant="outline">{user.role}</Badge>
        </div>
      </CardContent>
    </Card>
  )

  // Render student card for mobile view
  const renderStudentCard = (student: any) => (
    <Card key={student.id} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{student.name}</CardTitle>
            <CardDescription>{student.rollNumber}</CardDescription>
          </div>
          <Badge>{student.grade}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Class:</p>
            <p className="font-medium">{student.class}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Parent:</p>
            <p className="font-medium">{student.parentName}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between">
        <Button variant="outline" size="sm" className="text-xs" onClick={() => handleViewStudentDetails(student)}>
          <ChevronRight className="h-3.5 w-3.5 mr-1" />
          View Details
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-500 focus:text-red-500">
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  )

  // Render teacher card for mobile view
  const renderTeacherCard = (teacher: any) => (
    <Card key={teacher.id} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{teacher.name}</CardTitle>
            <CardDescription>{teacher.email}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-1 justify-end">
            {teacher.specializedIn.map((subject: string, index: number) => (
              <Badge key={index} variant="outline">
                {subject}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Phone:</p>
            <p className="font-medium">{teacher.phone}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Experience:</p>
            <p className="font-medium">{teacher.experience}</p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">Classes:</p>
            <p className="font-medium">{teacher.assignedClasses.length} assigned</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between">
        <Button variant="outline" size="sm" className="text-xs" onClick={() => handleViewTeacherDetails(teacher)}>
          <ChevronRight className="h-3.5 w-3.5 mr-1" />
          View Details
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-500 focus:text-red-500">
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  )

  // Render parent card for mobile view
  const renderParentCard = (parent: any) => (
    <Card key={parent.id} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{parent.name}</CardTitle>
            <CardDescription>{parent.email}</CardDescription>
          </div>
          <Badge variant="outline">
            {parent.children.length} {parent.children.length === 1 ? "Child" : "Children"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Phone:</p>
            <p className="font-medium">{parent.phone}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Occupation:</p>
            <p className="font-medium">{parent.occupation}</p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">Children:</p>
            <div className="font-medium">
              {parent.children.map((child: any, index: number) => (
                <div key={index}>
                  {child.name} ({child.grade})
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between">
        <Button variant="outline" size="sm" className="text-xs" onClick={() => handleViewParentDetails(parent)}>
          <ChevronRight className="h-3.5 w-3.5 mr-1" />
          View Details
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-500 focus:text-red-500">
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  )

  // Update the TabsList to include the new "users" tab
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">Manage students, teachers, and parents in the system</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Students</span>
          </TabsTrigger>
          <TabsTrigger value="teachers" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Teachers</span>
          </TabsTrigger>
          <TabsTrigger value="parents" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Parents</span>
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>View and manage all users in the system</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={refreshUsers}
                  disabled={isLoadingUsers}
                >
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
                    className={`h-4 w-4 ${isLoadingUsers ? 'animate-spin' : ''}`}
                  >
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                    <path d="M16 21h5v-5" />
                  </svg>
                  <span className="sr-only">Refresh</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4 mb-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search users..."
                      className="pl-8"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="All Users" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="student">Students</SelectItem>
                        <SelectItem value="teacher">Teachers</SelectItem>
                        <SelectItem value="parent">Parents</SelectItem>
                      </SelectContent>
                    </Select>
                    <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2 sm:mr-0" />
                          <span className="hidden sm:inline ml-2">Add User</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>Add New User</DialogTitle>
                          <DialogDescription>
                            Enter the details for the new user. Click save when you're done.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="user-name">Full Name</Label>
                              <Input 
                                id="user-name" 
                                placeholder="e.g. John Smith" 
                                value={newUserName}
                                onChange={(e) => setNewUserName(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="user-email">Email</Label>
                              <Input 
                                id="user-email" 
                                type="email" 
                                placeholder="e.g. john.smith@example.com" 
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="user-role">Role</Label>
                              <Select value={newUserRole} onValueChange={setNewUserRole}>
                                <SelectTrigger id="user-role">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="student">Student</SelectItem>
                                  <SelectItem value="teacher">Teacher</SelectItem>
                                  <SelectItem value="parent">Parent</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="user-status">Status</Label>
                              <Select value={newUserStatus} onValueChange={setNewUserStatus}>
                                <SelectTrigger id="user-status">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="inactive">Inactive</SelectItem>
                                  <SelectItem value="pending">Pending</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        <DialogFooter className="flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowUserDialog(false)}
                            className="sm:w-auto w-full"
                            disabled={isLoading}
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleAddUser} 
                            className="sm:w-auto w-full"
                            disabled={isLoading}
                          >
                            {isLoading ? "Saving..." : "Save"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>

              {/* Mobile view - Card layout */}
              <div className="md:hidden">
                {isLoadingUsers ? (
                  <div className="text-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted-foreground">Loading users...</p>
                  </div>
                ) : loadError ? (
                  <div className="text-center py-8 text-red-500">
                    <p>Error loading users: {loadError}</p>
                    <p className="mt-2 text-muted-foreground">Showing mock data instead</p>
                  </div>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map(renderUserCard)
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No users found.</div>
                )}
              </div>

              {/* Desktop view - Table layout */}
              <div className="hidden md:block rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Avatar</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingUsers ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
                              </div>
                              <p className="mt-2 text-muted-foreground">Loading users...</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : loadError ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            <p className="text-red-500">Error loading users: {loadError}</p>
                            <p className="mt-2 text-muted-foreground">Showing mock data instead</p>
                          </TableCell>
                        </TableRow>
                      ) : filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{user.avatar}</AvatarFallback>
                              </Avatar>
                            </TableCell>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell className="capitalize">{user.role}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={user.status === "active" ? "default" : "destructive"}
                                className={`cursor-pointer ${updatingUserId === user.id ? 'opacity-50' : ''}`}
                                onClick={() => {
                                  if (updatingUserId === null) {
                                    const newStatus = user.status === "active" ? "inactive" : "active";
                                    handleStatusChange(user.id, newStatus);
                                  }
                                }}
                              >
                                {updatingUserId === user.id ? "Updating..." : user.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setShowEditDialog(true)
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-red-500 hover:text-red-600"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No users found.
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

        {/* Keep the existing Students, Teachers, and Parents tabs */}
        {/* Students Tab */}
        <TabsContent value="students" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
              <CardDescription>View and manage all students in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search students..."
                    className="pl-8"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                  />
    </div>
                <div className="flex gap-2">
                  <Select value={gradeFilter} onValueChange={setGradeFilter}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Filter by grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      <SelectItem value="Grade 9">Grade 9</SelectItem>
                      <SelectItem value="Grade 10">Grade 10</SelectItem>
                      <SelectItem value="Grade 11">Grade 11</SelectItem>
                      <SelectItem value="Grade 12">Grade 12</SelectItem>
                    </SelectContent>
                  </Select>
                  <Dialog open={showStudentDialog} onOpenChange={setShowStudentDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2 sm:mr-0" />
                        <span className="hidden sm:inline ml-2">Add Student</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Add New Student</DialogTitle>
                        <DialogDescription>
                          Enter the details for the new student. Click save when you're done.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="student-name">Full Name</Label>
                            <Input id="student-name" placeholder="e.g. John Smith" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="student-roll">Roll Number</Label>
                            <Input id="student-roll" placeholder="e.g. S2023-025" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="student-grade">Grade</Label>
                            <Select>
                              <SelectTrigger id="student-grade">
                                <SelectValue placeholder="Select grade" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="grade-9">Grade 9</SelectItem>
                                <SelectItem value="grade-10">Grade 10</SelectItem>
                                <SelectItem value="grade-11">Grade 11</SelectItem>
                                <SelectItem value="grade-12">Grade 12</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="student-class">Class</Label>
                            <Select>
                              <SelectTrigger id="student-class">
                                <SelectValue placeholder="Select class" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="grade-9a">Grade 9A</SelectItem>
                                <SelectItem value="grade-9b">Grade 9B</SelectItem>
                                <SelectItem value="grade-10a">Grade 10A</SelectItem>
                                <SelectItem value="grade-10b">Grade 10B</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="student-gender">Gender</Label>
                            <Select>
                              <SelectTrigger id="student-gender">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="student-dob">Date of Birth</Label>
                            <Input id="student-dob" type="date" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="student-email">Email</Label>
                            <Input id="student-email" type="email" placeholder="e.g. john.smith@example.com" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="student-phone">Phone</Label>
                            <Input id="student-phone" placeholder="e.g. (555) 123-4567" />
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="student-address">Address</Label>
                            <Input id="student-address" placeholder="e.g. 123 Main St, Springfield" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="parent-name">Parent Name</Label>
                            <Input id="parent-name" placeholder="e.g. Robert Smith" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="parent-phone">Parent Phone</Label>
                            <Input id="parent-phone" placeholder="e.g. (555) 123-4568" />
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="parent-email">Parent Email</Label>
                            <Input id="parent-email" type="email" placeholder="e.g. robert.smith@example.com" />
                          </div>
                        </div>
                      </div>
                      <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowStudentDialog(false)}
                          className="sm:w-auto w-full"
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddStudent} className="sm:w-auto w-full">
                          Save
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Mobile view - Card layout */}
              <div className="md:hidden">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map(renderStudentCard)
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No students found.</div>
                )}
              </div>

              {/* Desktop view - Table layout */}
              <div className="hidden md:block rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Roll Number</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Parent</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.rollNumber}</TableCell>
                          <TableCell>{student.grade}</TableCell>
                          <TableCell>{student.class}</TableCell>
                          <TableCell>{student.parentName}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleViewStudentDetails(student)}>
                                View Details
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                                <Trash className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredStudents.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No students found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student Details Dialog */}
          <Dialog open={showStudentDetails} onOpenChange={setShowStudentDetails}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-auto">
              {selectedStudentData && (
                <>
                  <DialogHeader>
                    <DialogTitle>Student Details</DialogTitle>
                    <DialogDescription>Detailed information about {selectedStudentData.name}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      <Avatar className="w-20 h-20">
                        <AvatarFallback className="text-xl">
                          {selectedStudentData.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold">{selectedStudentData.name}</h3>
                        <p className="text-muted-foreground">{selectedStudentData.rollNumber}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge>{selectedStudentData.grade}</Badge>
                          <Badge variant="outline">{selectedStudentData.class}</Badge>
                        </div>
                      </div>
                    </div>

                    <Accordion type="single" collapsible defaultValue="personal">
                      <AccordionItem value="personal">
                        <AccordionTrigger>Personal Information</AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Gender:</p>
                              <p className="font-medium">{selectedStudentData.gender}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Date of Birth:</p>
                              <p className="font-medium">{selectedStudentData.dob}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Email:</p>
                              <p className="font-medium">{selectedStudentData.email}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Phone:</p>
                              <p className="font-medium">{selectedStudentData.phone}</p>
                            </div>
                            <div className="sm:col-span-2">
                              <p className="text-muted-foreground">Address:</p>
                              <p className="font-medium">{selectedStudentData.address}</p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="parent">
                        <AccordionTrigger>Parent Information</AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Parent Name:</p>
                              <p className="font-medium">{selectedStudentData.parentName}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Parent Phone:</p>
                              <p className="font-medium">{selectedStudentData.parentPhone}</p>
                            </div>
                            <div className="sm:col-span-2">
                              <p className="text-muted-foreground">Parent Email:</p>
                              <p className="font-medium">{selectedStudentData.parentEmail}</p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="subjects">
                        <AccordionTrigger>Enrolled Subjects</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            {selectedStudentData.enrolledSubjects.map((subject: any, index: number) => (
                              <div key={index} className="flex justify-between items-center p-3 rounded-lg border">
                                <div>
                                  <p className="font-medium">{subject.name}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Grade</p>
                                    <p className="font-medium">{subject.grade}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Attendance</p>
                                    <p className="font-medium">{subject.attendance}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="attendance">
                        <AccordionTrigger>Attendance History</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {selectedStudentData.attendanceHistory.map((record: any, index: number) => (
                              <div key={index} className="flex justify-between items-center p-2 rounded-lg border">
                                <p>{record.date}</p>
                                <Badge
                                  variant={
                                    record.status === "Present"
                                      ? "default"
                                      : record.status === "Late"
                                        ? "outline"
                                        : "destructive"
                                  }
                                >
                                  {record.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="results">
                        <AccordionTrigger>Academic Results</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            {selectedStudentData.results.map((result: any, index: number) => (
                              <div key={index} className="p-3 rounded-lg border">
                                <div className="flex justify-between items-center mb-2">
                                  <p className="font-medium">{result.term}</p>
                                  <Badge>{result.grade}</Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Total Marks:</p>
                                    <p className="font-medium">{result.totalMarks}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Percentage:</p>
                                    <p className="font-medium">{result.percentage}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Teachers Tab */}
        <TabsContent value="teachers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Teachers</CardTitle>
              <CardDescription>View and manage all teachers in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search teachers..."
                    className="pl-8"
                    value={teacherSearchQuery}
                    onChange={(e) => setTeacherSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Filter by subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="Physics">Physics</SelectItem>
                      <SelectItem value="Science">Science</SelectItem>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Literature">Literature</SelectItem>
                      <SelectItem value="Computer Science">Computer Science</SelectItem>
                      <SelectItem value="History">History</SelectItem>
                    </SelectContent>
                  </Select>
                  <Dialog open={showTeacherDialog} onOpenChange={setShowTeacherDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2 sm:mr-0" />
                        <span className="hidden sm:inline ml-2">Add Teacher</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Add New Teacher</DialogTitle>
                        <DialogDescription>
                          Enter the details for the new teacher. Click save when you're done.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="teacher-name">Full Name</Label>
                            <Input id="teacher-name" placeholder="e.g. Dr. John Smith" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="teacher-email">Email</Label>
                            <Input id="teacher-email" type="email" placeholder="e.g. john.smith@example.com" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="teacher-phone">Phone</Label>
                            <Input id="teacher-phone" placeholder="e.g. (555) 123-4567" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="teacher-qualification">Qualification</Label>
                            <Input id="teacher-qualification" placeholder="e.g. Ph.D. in Mathematics" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="teacher-experience">Experience</Label>
                            <Input id="teacher-experience" placeholder="e.g. 8 years" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="teacher-join-date">Join Date</Label>
                            <Input id="teacher-join-date" type="date" />
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="teacher-address">Address</Label>
                            <Input id="teacher-address" placeholder="e.g. 123 Faculty Ave, Springfield" />
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <Label>Specialized In</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox id="math" />
                                <Label htmlFor="math">Mathematics</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="physics" />
                                <Label htmlFor="physics">Physics</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="science" />
                                <Label htmlFor="science">Science</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="english" />
                                <Label htmlFor="english">English</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="cs" />
                                <Label htmlFor="cs">Computer Science</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="history" />
                                <Label htmlFor="history">History</Label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowTeacherDialog(false)}
                          className="sm:w-auto w-full"
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddTeacher} className="sm:w-auto w-full">
                          Save
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Mobile view - Card layout */}
              <div className="md:hidden">
                {filteredTeachers.length > 0 ? (
                  filteredTeachers.map(renderTeacherCard)
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No teachers found.</div>
                )}
              </div>

              {/* Desktop view - Table layout */}
              <div className="hidden md:block rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Specialized In</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTeachers.map((teacher) => (
                        <TableRow key={teacher.id}>
                          <TableCell className="font-medium">{teacher.name}</TableCell>
                          <TableCell>{teacher.email}</TableCell>
                          <TableCell>{teacher.phone}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {teacher.specializedIn.map((subject, index) => (
                                <Badge key={index} variant="outline">
                                  {subject}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>{teacher.experience}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleViewTeacherDetails(teacher)}>
                                View Details
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                                <Trash className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredTeachers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No teachers found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teacher Details Dialog */}
          <Dialog open={showTeacherDetails} onOpenChange={setShowTeacherDetails}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-auto">
              {selectedTeacherData && (
                <>
                  <DialogHeader>
                    <DialogTitle>Teacher Details</DialogTitle>
                    <DialogDescription>Detailed information about {selectedTeacherData.name}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      <Avatar className="w-20 h-20">
                        <AvatarFallback className="text-xl">
                          {selectedTeacherData.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold">{selectedTeacherData.name}</h3>
                        <p className="text-muted-foreground">{selectedTeacherData.email}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedTeacherData.specializedIn.map((subject: string, index: number) => (
                            <Badge key={index} variant="outline">
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Accordion type="single" collapsible defaultValue="personal">
                      <AccordionItem value="personal">
                        <AccordionTrigger>Personal Information</AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Phone:</p>
                              <p className="font-medium">{selectedTeacherData.phone}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Qualification:</p>
                              <p className="font-medium">{selectedTeacherData.qualification}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Experience:</p>
                              <p className="font-medium">{selectedTeacherData.experience}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Join Date:</p>
                              <p className="font-medium">{selectedTeacherData.joinDate}</p>
                            </div>
                            <div className="sm:col-span-2">
                              <p className="text-muted-foreground">Address:</p>
                              <p className="font-medium">{selectedTeacherData.address}</p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="classes">
                        <AccordionTrigger>Assigned Classes</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            {selectedTeacherData.assignedClasses.map((cls: any, index: number) => (
                              <div key={index} className="p-3 rounded-lg border">
                                <div className="flex justify-between items-center mb-2">
                                  <p className="font-medium">{cls.name}</p>
                                  <Badge variant="outline">{cls.subject}</Badge>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <p>{cls.schedule}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <p>{cls.room}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Parents Tab */}
        <TabsContent value="parents" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Parents</CardTitle>
              <CardDescription>View and manage all parents in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search parents or their children..."
                    className="pl-8"
                    value={parentSearchQuery}
                    onChange={(e) => setParentSearchQuery(e.target.value)}
                  />
                </div>
                <Dialog open={showParentDialog} onOpenChange={setShowParentDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Parent
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Add New Parent</DialogTitle>
                      <DialogDescription>
                        Enter the details for the new parent. Click save when you're done.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="parent-name">Full Name</Label>
                          <Input id="parent-name" placeholder="e.g. Robert Smith" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="parent-email">Email</Label>
                          <Input id="parent-email" type="email" placeholder="e.g. robert.smith@example.com" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="parent-phone">Phone</Label>
                          <Input id="parent-phone" placeholder="e.g. (555) 123-4567" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="parent-occupation">Occupation</Label>
                          <Input id="parent-occupation" placeholder="e.g. Engineer" />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="parent-address">Address</Label>
                          <Input id="parent-address" placeholder="e.g. 123 Main St, Springfield" />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label>Children</Label>
                          <div className="border rounded-md p-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <Checkbox id="child1" />
                              <Label htmlFor="child1">Alex Johnson (Grade 9A)</Label>
                            </div>
                            <div className="flex items-center space-x-2 mb-2">
                              <Checkbox id="child2" />
                              <Label htmlFor="child2">Emma Davis (Grade 9A)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="child3" />
                              <Label htmlFor="child3">Michael Brown (Grade 9A)</Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                      <Button variant="outline" onClick={() => setShowParentDialog(false)} className="sm:w-auto w-full">
                        Cancel
                      </Button>
                      <Button onClick={handleAddParent} className="sm:w-auto w-full">
                        Save
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Mobile view - Card layout */}
              <div className="md:hidden">
                {filteredParents.length > 0 ? (
                  filteredParents.map(renderParentCard)
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No parents found.</div>
                )}
              </div>

              {/* Desktop view - Table layout */}
              <div className="hidden md:block rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Occupation</TableHead>
                        <TableHead>Children</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredParents.map((parent) => (
                        <TableRow key={parent.id}>
                          <TableCell className="font-medium">{parent.name}</TableCell>
                          <TableCell>{parent.email}</TableCell>
                          <TableCell>{parent.phone}</TableCell>
                          <TableCell>{parent.occupation}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              {parent.children.map((child, index) => (
                                <span key={index}>
                                  {child.name} ({child.grade})
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleViewParentDetails(parent)}>
                                View Details
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                                <Trash className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredParents.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No parents found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parent Details Dialog */}
          <Dialog open={showParentDetails} onOpenChange={setShowParentDetails}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-auto">
              {selectedParentData && (
                <>
                  <DialogHeader>
                    <DialogTitle>Parent Details</DialogTitle>
                    <DialogDescription>Detailed information about {selectedParentData.name}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      <Avatar className="w-20 h-20">
                        <AvatarFallback className="text-xl">
                          {selectedParentData.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold">{selectedParentData.name}</h3>
                        <p className="text-muted-foreground">{selectedParentData.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">
                            {selectedParentData.children.length}{" "}
                            {selectedParentData.children.length === 1 ? "Child" : "Children"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <Accordion type="single" collapsible defaultValue="personal">
                      <AccordionItem value="personal">
                        <AccordionTrigger>Personal Information</AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Phone:</p>
                              <p className="font-medium">{selectedParentData.phone}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Occupation:</p>
                              <p className="font-medium">{selectedParentData.occupation}</p>
                            </div>
                            <div className="sm:col-span-2">
                              <p className="text-muted-foreground">Address:</p>
                              <p className="font-medium">{selectedParentData.address}</p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="children">
                        <AccordionTrigger>Children Information</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            {selectedParentData.children.map((child: any, index: number) => (
                              <div key={index} className="p-3 rounded-lg border">
                                <div className="flex justify-between items-center mb-2">
                                  <p className="font-medium">{child.name}</p>
                                  <Badge>{child.grade}</Badge>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Roll Number:</p>
                                    <p className="font-medium">{child.rollNumber}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Class:</p>
                                    <p className="font-medium">{child.class}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
      {/* ... rest of the content ... */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Make changes to the user's information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input
                  id="name"
                  value={selectedUser?.name || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={selectedUser?.email || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* ... rest of the content ... */}
    </div>
  )
}

