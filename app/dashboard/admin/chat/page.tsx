"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Search, X, ChevronLeft, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"

export default function AdminChatPage() {
  const [activeContact, setActiveContact] = useState("Mrs. Linda Martinez")
  const [showSidebar, setShowSidebar] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedRole, setSelectedRole] = useState("all")
  const [message, setMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Auto-hide sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setShowSidebar(!activeContact)
    } else {
      setShowSidebar(true)
    }
  }, [isMobile, activeContact])

  // Mock data for contacts
  const contacts = [
    // Teachers
    { id: "t1", name: "Mrs. Linda Martinez", role: "Head of Mathematics", avatar: "LM", unread: 2, type: "teacher" },
    { id: "t2", name: "Dr. Robert Chen", role: "Head of Science", avatar: "RC", unread: 0, type: "teacher" },
    { id: "t3", name: "Prof. Sarah Williams", role: "Mathematics Teacher", avatar: "SW", unread: 1, type: "teacher" },
    { id: "t4", name: "Dr. Emily Parker", role: "English Teacher", avatar: "EP", unread: 0, type: "teacher" },
    { id: "t5", name: "Mr. James Wilson", role: "History Teacher", avatar: "JW", unread: 3, type: "teacher" },

    // Staff
    { id: "s1", name: "Ms. Rebecca Adams", role: "School Counselor", avatar: "RA", unread: 0, type: "staff" },
    { id: "s2", name: "Mr. Daniel Moore", role: "IT Coordinator", avatar: "DM", unread: 4, type: "staff" },
    { id: "s3", name: "Mrs. Karen Jackson", role: "Office Manager", avatar: "KJ", unread: 0, type: "staff" },
    { id: "s4", name: "Mr. David Turner", role: "Facilities Manager", avatar: "DT", unread: 0, type: "staff" },

    // Departments
    { id: "d1", name: "Mathematics Department", role: "Department Group", avatar: "MD", unread: 5, type: "department" },
    { id: "d2", name: "Science Department", role: "Department Group", avatar: "SD", unread: 0, type: "department" },
    { id: "d3", name: "English Department", role: "Department Group", avatar: "ED", unread: 2, type: "department" },

    // School Leadership
    { id: "l1", name: "Mr. George Thompson", role: "Vice Principal", avatar: "GT", unread: 0, type: "leadership" },
    { id: "l2", name: "Dr. Michelle Rogers", role: "Curriculum Director", avatar: "MR", unread: 1, type: "leadership" },
    { id: "l3", name: "Mrs. Sophia Clark", role: "Finance Director", avatar: "SC", unread: 0, type: "leadership" },
  ]

  // Filter contacts based on search query, tab filter, and role filter
  const filteredContacts = contacts.filter((contact) => {
    // Filter by tab
    if (activeTab !== "all" && contact.type !== activeTab) return false

    // Filter by role
    if (selectedRole !== "all" && contact.type !== selectedRole) return false

    // Filter by search query
    if (searchQuery && !contact.name.toLowerCase().includes(searchQuery.toLowerCase())) return false

    return true
  })

  // Mock messages for the selected conversation
  const messages = [
    {
      sender: "Mrs. Patricia Adams",
      content: "Good morning Linda, could you provide an update on the mathematics curriculum revision?",
      time: "9:30 AM",
      isSelf: true,
    },
    {
      sender: "Mrs. Linda Martinez",
      content: "Good morning Mrs. Adams. We've completed the revisions for grades 9 and 10.",
      time: "9:32 AM",
      isSelf: false,
    },
    {
      sender: "Mrs. Patricia Adams",
      content: "That's great progress. When do you expect to complete the other grades?",
      time: "9:33 AM",
      isSelf: true,
    },
    {
      sender: "Mrs. Linda Martinez",
      content: "We should have grades 11 and 12 completed by next Friday. The team is working diligently.",
      time: "9:35 AM",
      isSelf: false,
    },
    {
      sender: "Mrs. Patricia Adams",
      content: "Excellent. Let's schedule a meeting to review the changes once everything is complete.",
      time: "9:38 AM",
      isSelf: true,
    },
    {
      sender: "Mrs. Linda Martinez",
      content: "That sounds good. Would the following Monday at 10 AM work for you?",
      time: "9:40 AM",
      isSelf: false,
    },
    {
      sender: "Mrs. Patricia Adams",
      content: "Yes, that works for my schedule. I'll send a calendar invite to the department heads as well.",
      time: "9:41 AM",
      isSelf: true,
    },
    {
      sender: "Mrs. Linda Martinez",
      content: "Perfect. I'll prepare a presentation summarizing the key changes for the meeting.",
      time: "9:42 AM",
      isSelf: false,
    },
  ]

  // Scroll to bottom of messages when messages change or active contact changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, activeContact])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      // In a real app, you would send the message to the server here
      // For now, just clear the input
      setMessage("")
    }
  }

  const handleContactSelect = (contactName: string) => {
    setActiveContact(contactName)
    if (isMobile) {
      setShowSidebar(false)
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex h-full overflow-hidden rounded-lg border bg-background shadow">
        {/* Sidebar */}
        <div
          className={cn(
            "flex flex-col w-full md:w-80 border-r transition-all duration-300 ease-in-out",
            showSidebar ? "block" : "hidden",
          )}
        >
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-xl font-semibold">Messages</h2>
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setShowSidebar(false)}>
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          <div className="p-3 border-b space-y-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="teacher">Teachers</TabsTrigger>
                <TabsTrigger value="staff">Staff</TabsTrigger>
                <TabsTrigger value="department">Depts</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Role Filter Dropdown */}
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="teacher">Teachers</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="department">Departments</SelectItem>
                <SelectItem value="leadership">Leadership Team</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search contacts..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-1 p-2">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  className={cn(
                    "flex items-center gap-3 w-full rounded-lg p-3 text-left transition-colors",
                    activeContact === contact.name ? "bg-primary/10 text-primary" : "hover:bg-muted",
                  )}
                  onClick={() => handleContactSelect(contact.name)}
                >
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src="" alt={contact.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">{contact.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <p className="truncate font-medium">{contact.name}</p>
                      {contact.unread > 0 && (
                        <Badge variant="default" className="ml-2">
                          {contact.unread}
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{contact.role}</p>
                  </div>
                </button>
              ))}

              {filteredContacts.length === 0 && (
                <div className="py-4 text-center text-muted-foreground">No contacts found</div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className={cn("flex flex-col flex-1", !showSidebar || !isMobile ? "block" : "hidden")}>
          {/* Chat Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isMobile && (
                <Button variant="ghost" size="icon" onClick={() => setShowSidebar(true)}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}
              <Avatar className="h-10 w-10 border">
                <AvatarImage src="" alt={activeContact} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {activeContact
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium leading-none">{activeContact}</h3>
                <p className="text-sm text-muted-foreground">{contacts.find((c) => c.name === activeContact)?.role}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message, i) => (
                <div key={i} className={`flex ${message.isSelf ? "justify-end" : "justify-start"}`}>
                  {!message.isSelf && (
                    <Avatar className="h-8 w-8 mr-2 mt-1 hidden sm:block">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {activeContact
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2",
                      message.isSelf
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted rounded-tl-none",
                    )}
                  >
                    {!message.isSelf && <p className="mb-1 text-xs font-medium">{message.sender}</p>}
                    <p className="text-sm sm:text-base">{message.content}</p>
                    <p
                      className={cn(
                        "mt-1 text-xs",
                        message.isSelf ? "text-primary-foreground/70" : "text-muted-foreground",
                      )}
                    >
                      {message.time}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="border-t p-4">
            <form className="flex gap-2" onSubmit={handleSendMessage}>
              <Input
                className="flex-1"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button type="submit" size="icon" className="rounded-full">
                <Send className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

