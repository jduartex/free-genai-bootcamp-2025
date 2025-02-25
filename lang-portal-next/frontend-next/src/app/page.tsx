import { redirect } from 'next/navigation'

/**
 * Redirects the user to the dashboard.
 *
 * When this page component is rendered, it immediately navigates the user to the `/dashboard` route.
 */
export default function Home() {
  redirect('/dashboard')
}
