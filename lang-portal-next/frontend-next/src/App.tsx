import * as React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import MainLayout from "@/layouts/MainLayout"
import Dashboard from "@/pages/Dashboard"
import StudyActivities from "@/pages/StudyActivities"
import Words from "@/pages/Words"
import WordGroups from "@/pages/WordGroups"
import Sessions from "@/pages/Sessions"
import Settings from "@/pages/Settings"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="study-activities" element={<StudyActivities />} />
          <Route path="words" element={<Words />} />
          <Route path="groups" element={<WordGroups />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  )
}
