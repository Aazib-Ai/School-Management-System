"use client"

import { useState } from "react"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const [schoolSettings, setSchoolSettings] = useState({
    name: "Springfield High School",
    address: "123 Education St, Springfield, IL",
    phone: "(555) 123-4567",
    email: "info@springfieldhigh.edu",
    website: "www.springfieldhigh.edu",
    principal: "Dr. Jane Smith",
  })

  const [academicSettings, setAcademicSettings] = useState({
    currentYear: "2023-2024",
    currentTerm: "Fall",
    startDate: "2023-09-01",
    endDate: "2024-06-15",
    gradeScale: "standard",
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    attendanceAlerts: true,
    gradeAlerts: true,
    feeReminders: true,
    systemAnnouncements: true,
  })

  const handleSchoolSettingChange = (key: keyof typeof schoolSettings, value: string) => {
    setSchoolSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleAcademicSettingChange = (key: keyof typeof academicSettings, value: string) => {
    setAcademicSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleNotificationToggle = (key: keyof typeof notificationSettings) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSaveSettings = () => {
    // In a real app, this would send the settings to the server
    toast({
      title: "Settings Saved",
      description: "Your system settings have been updated successfully.",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">Configure system-wide settings and preferences</p>
      </div>

      <Tabs defaultValue="school">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="school">School Information</TabsTrigger>
          <TabsTrigger value="academic">Academic Year</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="school" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>School Information</CardTitle>
              <CardDescription>Update your school's basic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="school-name">School Name</Label>
                  <Input
                    id="school-name"
                    value={schoolSettings.name}
                    onChange={(e) => handleSchoolSettingChange("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="principal">Principal</Label>
                  <Input
                    id="principal"
                    value={schoolSettings.principal}
                    onChange={(e) => handleSchoolSettingChange("principal", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={schoolSettings.address}
                  onChange={(e) => handleSchoolSettingChange("address", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={schoolSettings.phone}
                    onChange={(e) => handleSchoolSettingChange("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={schoolSettings.email}
                    onChange={(e) => handleSchoolSettingChange("email", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={schoolSettings.website}
                  onChange={(e) => handleSchoolSettingChange("website", e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="academic" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Academic Year Settings</CardTitle>
              <CardDescription>Configure the current academic year and term</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="academic-year">Current Academic Year</Label>
                  <Input
                    id="academic-year"
                    value={academicSettings.currentYear}
                    onChange={(e) => handleAcademicSettingChange("currentYear", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="term">Current Term</Label>
                  <Select
                    value={academicSettings.currentTerm}
                    onValueChange={(value) => handleAcademicSettingChange("currentTerm", value)}
                  >
                    <SelectTrigger id="term">
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fall">Fall</SelectItem>
                      <SelectItem value="Spring">Spring</SelectItem>
                      <SelectItem value="Summer">Summer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Academic Year Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={academicSettings.startDate}
                    onChange={(e) => handleAcademicSettingChange("startDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">Academic Year End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={academicSettings.endDate}
                    onChange={(e) => handleAcademicSettingChange("endDate", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade-scale">Grading Scale</Label>
                <Select
                  value={academicSettings.gradeScale}
                  onValueChange={(value) => handleAcademicSettingChange("gradeScale", value)}
                >
                  <SelectTrigger id="grade-scale">
                    <SelectValue placeholder="Select grading scale" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard (A, B, C, D, F)</SelectItem>
                    <SelectItem value="plus-minus">Plus/Minus (A+, A, A-, etc.)</SelectItem>
                    <SelectItem value="percentage">Percentage Only</SelectItem>
                    <SelectItem value="custom">Custom Scale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure system-wide notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send notifications via email</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={() => handleNotificationToggle("emailNotifications")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sms-notifications">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send notifications via SMS</p>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={notificationSettings.smsNotifications}
                  onCheckedChange={() => handleNotificationToggle("smsNotifications")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="attendance-alerts">Attendance Alerts</Label>
                  <p className="text-sm text-muted-foreground">Send alerts for student absences</p>
                </div>
                <Switch
                  id="attendance-alerts"
                  checked={notificationSettings.attendanceAlerts}
                  onCheckedChange={() => handleNotificationToggle("attendanceAlerts")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="grade-alerts">Grade Alerts</Label>
                  <p className="text-sm text-muted-foreground">Send alerts when grades are updated</p>
                </div>
                <Switch
                  id="grade-alerts"
                  checked={notificationSettings.gradeAlerts}
                  onCheckedChange={() => handleNotificationToggle("gradeAlerts")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="fee-reminders">Fee Reminders</Label>
                  <p className="text-sm text-muted-foreground">Send reminders for upcoming fee payments</p>
                </div>
                <Switch
                  id="fee-reminders"
                  checked={notificationSettings.feeReminders}
                  onCheckedChange={() => handleNotificationToggle("feeReminders")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="system-announcements">System Announcements</Label>
                  <p className="text-sm text-muted-foreground">Send system-wide announcements</p>
                </div>
                <Switch
                  id="system-announcements"
                  checked={notificationSettings.systemAnnouncements}
                  onCheckedChange={() => handleNotificationToggle("systemAnnouncements")}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

