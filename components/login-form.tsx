"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          `Login failed: ${response.status} - ${
            errorData.error || "Unknown error"
          }`
        )
      }

      const data = await response.json()

      // Redirect based on role
      if (data.user.role === "admin") {
        router.push("/dashboard/admin/users")
      } else if (data.user.role === "teacher") {
        router.push("/dashboard/teacher")
      } else if (data.user.role === "student") {
        router.push("/dashboard/student")
      } else if (data.user.role === "parent") {
        router.push("/dashboard/parent")
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      setError((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500">{error}</p>}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Enter your email"
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Enter your password"
        />
      </div>
      <div className="flex items-center justify-between">
        <Link href="/auth/signup" className="text-sm text-muted-foreground hover:underline">
          Sign up
        </Link>
        <Link href="/forgot-password" className="text-sm text-muted-foreground hover:underline">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  )
}

