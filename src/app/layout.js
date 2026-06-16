import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
import AppWrapper from '../components/AppWrapper';
import Navbar from '../components/Navbar';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SmartCare - AI Hospital Queue Ecosystem",
  description: "Real-time automated queue telemetry, AI triage diagnostic assistance, and hospital administration dashboards.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#07090e] text-zinc-100 selection:bg-teal-500/20 selection:text-teal-300">
        <AuthProvider>
          <SocketProvider>
            <AppWrapper>
              <Navbar />
              <main className="flex flex-col flex-1">
                {children}
              </main>
            </AppWrapper>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
