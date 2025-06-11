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

export default function ParentChatPage() {
  const [activeContact, setActiveContact] = useState("Prof. Sarah Williams")
  const [showSidebar, setShowSidebar] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedChild, setSelectedChild] = useState("all")
  const [message, setMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Auto-hide sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      // Only hide the sidebar when a contact is selected
      if (activeContact) {
        setShowSidebar(false)
      }
    } else {
      // Always show sidebar on desktop
      setShowSidebar(true)
    }
  }, [isMobile, activeContact])

  // Mock data for children
  const children = [
    { id: "c1", name: "Alex Johnson", grade: "Grade 9A" },
    { id: "c2", name: "Emma Johnson", grade: "Grade 7B" },
  ]

  // Mock data for contacts
  const contacts = [
    // Teachers for Alex
    {
      id: "t1",
      name: "Prof. Sarah Williams",
      role: "Mathematics Teacher",
      avatar: "SW",
      unread: 2,
      type: "teacher",
      child: "Alex Johnson",
    },
    // Fix the corrupted contact object
    // { id: "t2", name: 'Dr. Robert Chen", role:  unread: 2, type: "teacher', child: "Alex Johnson" },

    // Replace with correct object
    {
      id: "t2",
      name: "Dr. Robert Chen",
      role: "Physics Teacher",
      avatar: "RC",
      unread: 2,
      type: "teacher",
      child: "Alex Johnson",
    },
    {
      id: "t3",
      name: "Dr. Emily Parker",
      role: "English Teacher",
      avatar: "EP",
      unread: 1,
      type: "teacher",
      child: "Alex Johnson",
    },
    {
      id: "t4",
      name: "Mr. James Wilson",
      role: "History Teacher",
      avatar: "JW",
      unread: 0,
      type: "teacher",
      child: "Alex Johnson",
    },

    // Teachers for Emma
    {
      id: "t5",
      name: "Mrs. Jennifer Adams",
      role: "Mathematics Teacher",
      avatar: "JA",
      unread: 0,
      type: "teacher",
      child: "Emma Johnson",
    },
    {
      id: "t6",
      name: "Mr. Thomas Brown",
      role: "Science Teacher",
      avatar: "TB",
      unread: 3,
      type: "teacher",
      child: "Emma Johnson",
    },
    {
      id: "t7",
      name: "Ms. Laura Garcia",
      role: "English Teacher",
      avatar: "LG",
      unread: 0,
      type: "teacher",
      child: "Emma Johnson",
    },

    // Class Groups
    {
      id: "g1",
      name: "Grade 9A Parents",
      role: "Parent Group",
      avatar: "G9",
      unread: 5,
      type: "group",
      child: "Alex Johnson",
    },
    {
      id: "g2",
      name: "Grade 7B Parents",
      role: "Parent Group",
      avatar: "G7",
      unread: 0,
      type: "group",
      child: "Emma Johnson",
    },

    // School Admin
    {
      id: "a1",
      name: "Mrs. Patricia Adams",
      role: "School Principal",
      avatar: "PA",
      unread: 0,
      type: "admin",
      child: "all",
    },
    {
      id: "a2",
      name: "Mr. George Thompson",
      role: "Vice Principal",
      avatar: "GT",
      unread: 0,
      type: "admin",
      child: "all",
    },
  ]

  // Filter contacts based on search query, type filter, and child filter
  const filteredContacts = contacts.filter((contact) => {
    // Filter by tab
    if (activeTab !== "all" && contact.type !== activeTab) return false

    // Filter by child
    if (selectedChild !== "all" && contact.child !== selectedChild && contact.child !== "all") return false

    // Filter by search query
    if (searchQuery && !contact.name.toLowerCase().includes(searchQuery.toLowerCase())) return false

    return true
  })

  // Mock messages for the selected conversation
  const messages = [
    {
      sender: "Prof. Sarah Williams",
      content: "Hello Mr. Johnson, I wanted to discuss Alex's progress in mathematics.",
      time: "10:30 AM",
      isSelf: false,
    },
    {
      sender: "Mr. Robert Johnson",
      content: "Hello Professor Williams, thank you for reaching out. How is Alex doing?",
      time: "10:32 AM",
      isSelf: true,
    },
    {
      sender: "Prof. Sarah Williams",
      content:
        "Alex has been doing well overall, but I've noticed he's struggling with some of the recent calculus concepts.",
      time: "10:33 AM",
      isSelf: false,
    },
    {
      sender: "Mr. Robert Johnson",
      content:
        "I see. He mentioned he found the integration problems challenging. Is there anything we can do to help?",
      time: "10:35 AM",
      isSelf: true,
    },
    {
      sender: "Prof. Sarah Williams",
      content: "I'd recommend some additional practice problems. I can send over some resources that might help.",
      time: "10:38 AM",
      isSelf: false,
    },
    {
      sender: "Mr. Robert Johnson",
      content: "That would be very helpful. We'll work on them together at home.",
      time: "10:40 AM",
      isSelf: true,
    },
    {
      sender: "Prof. Sarah Williams",
      content:
        "Great! I'll email those to you this afternoon. Also, there's a parent-teacher meeting next week if you'd like to discuss further.",
      time: "10:41 AM",
      isSelf: false,
    },
    {
      sender: "Prof. Sarah Williams",
      content: "The meeting is scheduled for Thursday at 5 PM.",
      time: "10:42 AM",
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
            isMobile && showSidebar ? "absolute inset-0 z-50 bg-background" : "",
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
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="teacher">Teachers</TabsTrigger>
                <TabsTrigger value="group">Groups</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Child Filter Dropdown */}
            <Select value={selectedChild} onValueChange={setSelectedChild}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Child" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Children</SelectItem>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.name}>
                    {child.name} ({child.grade})
                  </SelectItem>
                ))}
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
                    <p className="truncate text-sm text-muted-foreground">
                      {contact.role}
                      {contact.child !== "all" && ` (${contact.child})`}
                    </p>
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
                <p className="text-sm text-muted-foreground">
                  {contacts.find((c) => c.name === activeContact)?.role}
                  {contacts.find((c) => c.name === activeContact)?.child !== "all" &&
                    ` (${contacts.find((c) => c.name === activeContact)?.child})`}
                </p>
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

