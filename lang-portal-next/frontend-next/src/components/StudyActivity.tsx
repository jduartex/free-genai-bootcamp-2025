'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

type ActivityProps = {
  activity: {
    id: number
    preview_url: string
    title: string
    launch_url: string
  }
}

/**
 * Renders a styled card displaying details of a study activity.
 *
 * This component displays the activity's preview image, title, and provides two buttons:
 * one for launching the activity and another for viewing its details.
 *
 * @param activity - The study activity object containing its id, preview URL, title, and launch URL.
 *
 * @returns A JSX element representing the study activity card.
 */
export default function StudyActivity({ activity }: ActivityProps) {
  return (
    <div className="bg-sidebar rounded-lg shadow-md overflow-hidden">
      <img src={activity.preview_url} alt={activity.title} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">{activity.title}</h3>
        <div className="flex justify-between">
          <Button asChild>
            <Link href={`/study-activities/${activity.id}/launch`}>
              Launch
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/study-activities/${activity.id}`}>
              View
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}