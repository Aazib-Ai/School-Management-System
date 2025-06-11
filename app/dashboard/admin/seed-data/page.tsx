"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"

export default function SeedDataPage() {
  const [loading, setLoading] = useState(false)

  const handleSeedData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/seed')
      
      if (!response.ok) {
        throw new Error('Failed to seed database')
      }
      
      const data = await response.json()
      toast({
        title: "Success",
        description: data.message || "Database seeded successfully"
      })
    } catch (error) {
      console.error("Error seeding database:", error)
      toast({
        title: "Error",
        description: "Failed to seed database. Please try again."
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Seed Database</h1>
        <p className="text-muted-foreground">Populate the database with initial data for testing</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seed Data</CardTitle>
          <CardDescription>
            This will add sample teachers, rooms, and classes to the database if they don't already exist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Use this feature to quickly populate your database with sample data for testing purposes.
            This operation is safe and will not overwrite existing data.
          </p>
          <div className="space-y-2">
            <h3 className="font-medium">This will add:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>5 sample teachers with availability information</li>
              <li>11 classrooms and labs</li>
              <li>4 classes (Grade 9A, 9B, 10A, 10B)</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSeedData} disabled={loading}>
            {loading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Seeding Database...
              </>
            ) : (
              "Seed Database"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 