'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { fetchWord, type Word } from '@/services/api'

/**
 * Displays the details of a word fetched based on the current URL's "id" parameter.
 *
 * This component retrieves the word's data via an API call and renders its kanji, readings, meanings, study count, and success rate.
 * It shows a loading indicator while the data is being fetched and a "Word not found" message if no word is returned.
 * A "Study Now" link is provided to launch study activities for the word.
 */
export default function WordShow() {
  const params = useParams()
  const id = params.id as string
  const [word, setWord] = useState<Word | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadWord = async () => {
      try {
        const data = await fetchWord(id)
        setWord(data)
      } catch (error) {
        console.error('Failed to load word:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadWord()
  }, [id])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!word) {
    return <div>Word not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{word.kanji}</h1>
        <Link 
          href={`/study-activities/launch?wordId=${word.id}`}
          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Study Now
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Details</h2>
          <dl className="space-y-2">
            <dt className="text-gray-500">Readings</dt>
            <dd>{word.readings.join(', ')}</dd>
            <dt className="text-gray-500 mt-4">Meanings</dt>
            <dd>{word.meanings.join(', ')}</dd>
          </dl>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Study Progress</h2>
          <dl className="space-y-2">
            <dt className="text-gray-500">Times Studied</dt>
            <dd>{word.study_count}</dd>
            <dt className="text-gray-500 mt-4">Success Rate</dt>
            <dd>{Math.round(word.success_rate * 100)}%</dd>
          </dl>
        </div>
      </div>
    </div>
  )
}