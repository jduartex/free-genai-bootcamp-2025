'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchData } from '@/services/api'
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface StudyActivity {
  id: string
  name: string
  type: string
  difficulty: string
  description: string
  instructions: string
}

export default function StudyActivities() {
  const [activities, setActivities] = useState<StudyActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const data = await fetchData('/study-activities')
        setActivities(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch study activities')
      } finally {
        setLoading(false)
      }
    }

    loadActivities()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Study Activities</h1>
        </div>
        <div className="bg-white shadow rounded-lg p-6 text-center">
          Loading study activities...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Study Activities</h1>
        </div>
        <div className="bg-white shadow rounded-lg p-6 text-center text-red-500">
          Error: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Study Activities</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map((activity) => (
          <Card key={activity.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{activity.name}</CardTitle>
                  <CardDescription>{activity.type} • {activity.difficulty}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{activity.description}</p>
            </CardContent>
            <CardFooter>
              <Link 
                href={`/study-activities/${activity.id}/launch`}
                className="w-full"
              >
                <Button className="w-full">
                  Start Activity
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}