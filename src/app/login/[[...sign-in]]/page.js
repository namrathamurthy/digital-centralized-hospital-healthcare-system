'use client';
import { SignIn } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

export default function Login() {
  const [role, setRole] = useState('patient');

  useEffect(() => {
    // Save to cookie so the backend sync API knows what role to assign
    document.cookie = `demoRole=${role}; path=/; max-age=3600`;
  }, [role]);

  return (
    <div className="flex flex-col flex-1 items-center justify-center py-12 px-6 font-sans min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col items-center justify-center w-full max-w-md">
        
        <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Demo Mode: Choose your role before logging in
          </label>
          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
            <option value="receptionist">Receptionist</option>
            <option value="billing">Billing</option>
            <option value="lab">Lab</option>
            <option value="pharmacy">Pharmacy</option>
          </select>
        </div>

        <SignIn fallbackRedirectUrl={`/${role}-dashboard`} signUpUrl="/register" />
      </div>
    </div>
  );
}
