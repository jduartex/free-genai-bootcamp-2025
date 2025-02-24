import Link from 'next/link'
import { BookOpen, Trophy, Clock, ArrowRight, Activity } from 'lucide-react'
import { getRecentStudySession, getStudyStats } from '@/app/actions'
import { type StudyStats, type RecentSession } from '@/services/api'

interface DashboardCardProps {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  className?: string
}

function DashboardCard({ title, icon: Icon, children, className = '' }: DashboardCardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default async function Dashboard() {
  const [recentSession, stats] = await Promise.all([
    getRecentStudySession('recent'),
    getStudyStats()
  ])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Study Stats */}
        <DashboardCard title="Study Statistics" icon={Trophy}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Sessions</p>
              <p className="text-2xl font-semibold">{stats.totalSessions}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Words</p>
              <p className="text-2xl font-semibold">{stats.totalWords}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Average Accuracy</p>
              <p className="text-2xl font-semibold">{stats.averageAccuracy}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Study Streak</p>
              <p className="text-2xl font-semibold">{stats.studyStreak} days</p>
            </div>
          </div>
        </DashboardCard>

        {/* Recent Activity */}
        <DashboardCard title="Recent Activity" icon={Activity}>
          {recentSession ? (
            <div>
              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Study Session</p>
                <p className="font-semibold">{recentSession.activity_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Words Studied</p>
                  <p className="text-xl font-semibold">{recentSession.wordsStudied}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Accuracy</p>
                  <p className="text-xl font-semibold">{recentSession.accuracy}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                  <p className="text-xl font-semibold">{Math.round(recentSession.duration / 60)} min</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                  <p className="text-xl font-semibold">
                    {new Date(recentSession.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No recent activity</p>
          )}
        </DashboardCard>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/study-activities">
          <DashboardCard title="Start Studying" icon={BookOpen}>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Choose from various study activities to practice your vocabulary
            </p>
            <div className="flex items-center text-blue-500 hover:text-blue-600">
              <span>Begin Study Session</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </DashboardCard>
        </Link>

        <Link href="/groups">
          <DashboardCard title="Word Groups" icon={Clock}>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Manage your word groups and organize your vocabulary
            </p>
            <div className="flex items-center text-blue-500 hover:text-blue-600">
              <span>View Groups</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </DashboardCard>
        </Link>

        <Link href="/history">
          <DashboardCard title="Study History" icon={Clock}>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Review your past study sessions and track your progress
            </p>
            <div className="flex items-center text-blue-500 hover:text-blue-600">
              <span>View History</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </DashboardCard>
        </Link>
      </div>
    </div>
  )
}