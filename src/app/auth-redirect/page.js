'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Read the demo role cookie
    const cookies = document.cookie.split(';');
    const demoCookie = cookies.find(c => c.trim().startsWith('demoRole='));
    
    let role = 'patient';
    if (demoCookie) {
      role = demoCookie.split('=')[1];
    }
    
    // Redirect to the correct dashboard based on their selection
    router.replace(`/${role}-dashboard`);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 font-sans">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-medium animate-pulse">Routing to your workspace...</p>
    </div>
  );
}
