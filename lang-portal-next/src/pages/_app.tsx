import { SidebarProvider } from '../components/ui/sidebar'
// ...existing code...

function MyApp({ Component, pageProps }) {
  return (
    <SidebarProvider>
      <Component {...pageProps} />
    </SidebarProvider>
  )
}

// ...existing code...
