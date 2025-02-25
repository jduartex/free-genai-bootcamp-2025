import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Last Study Session Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Last Study Session</h2>
          <p className="text-gray-600 mb-4">No session yet</p>
          <Link 
            href="/study"
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            Start your first session →
          </Link>
        </div>

        {/* Study Progress Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Study Progress</h2>
          <p className="text-gray-600 mb-4">Start studying to see your progress</p>
          <Link 
            href="/word-groups"
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            Browse word groups →
          </Link>
        </div>

        {/* Quick Stats Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Quick Stats</h2>
          <p className="text-gray-600 mb-4">Complete sessions to see your stats</p>
          <Link 
            href="/activities"
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            Try an activity →
          </Link>
        </div>
      </div>
    </div>
  )
}
