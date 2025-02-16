// app/layout.js
import Footer from "@/components/Footer"
import Navbar from "@/components/Navbar"
import "./globals.css"
import AuthProvider from './AuthProvider'


export default async function RootLayout({ children }) {
  
  return (
    <html className="h-full">
      <body className="flex flex-col min-h-screen custom-scrollbar">
          <AuthProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          </AuthProvider>
      </body>
    </html>
  )
}