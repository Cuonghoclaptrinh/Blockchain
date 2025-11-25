// src/components/AppWrapper.tsx
'use client';
import Navbar from './Navbar';
import ToastContainer from './ToastContainer';
import ErrorBoundary from './ErrorBoundary';

export default function AppWrapper({ children }: { children: React.ReactNode }) {
    return (
        <ErrorBoundary>
            <Navbar />
            <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                {children}
            </main>
            <ToastContainer />
        </ErrorBoundary>
    );
}