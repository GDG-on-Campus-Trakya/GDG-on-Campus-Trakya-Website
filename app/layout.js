// app/layout.js
import Footer from "@/components/Footer"
import Navbar from "@/components/Navbar"
import "./globals.css"
import AuthProvider from './AuthProvider'


export default async function RootLayout({ children }) {
  
  return (
    <html className="h-full">
      <body className="flex flex-col min-h-screen">
          <AuthProvider>
          <Navbar />
          <main className="flex flex-1 flex-col">
            {children}
          </main>
          <Footer />
          </AuthProvider>
      </body>
    </html>
  )
}