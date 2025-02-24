'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { fetchStudyActivity, type StudyActivity } from '@/services/api'

export default function LaunchActivity() {
  const params = useParams()
  const router = useRouter()
  const [activity, setActivity] = useState<StudyActivity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadActivity = async () => {
      if (!params.id) return

      try {
        const data = await fetchStudyActivity(params.id as string)
        setActivity(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch activity details')
      } finally {
        setLoading(false)
      }
    }

    loadActivity()
  }, [params.id])

  const handleStart = () => {
    // TODO: Implement actual activity launch logic
    router.push(`/study-activities/${params.id}/session`)
  }

  const handleBack = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">Loading activity...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-500">Error: {error}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!activity) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">Activity not found</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{activity.name}</CardTitle>
          <CardDescription>{activity.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Type</h3>
              <p className="text-gray-600">{activity.type}</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Difficulty</h3>
              <p className="text-gray-600">{activity.difficulty}</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Instructions</h3>
              <p className="text-gray-600">{activity.instructions}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          <Button onClick={handleStart}>
            Start Activity
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
