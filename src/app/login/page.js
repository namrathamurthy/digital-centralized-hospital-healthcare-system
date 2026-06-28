'use client';
import { SignIn } from '@clerk/nextjs';

export default function Login() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center py-12 px-6 font-sans min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col items-center justify-center w-full max-w-md">
        <SignIn fallbackRedirectUrl="/patient-dashboard" signUpUrl="/register" />
      </div>
    </div>
  );
}
