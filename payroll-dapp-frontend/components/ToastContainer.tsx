// src/components/ToastContainer.tsx
'use client';
import { Toaster } from 'react-hot-toast';

export default function ToastContainer() {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                duration: 4000,
                style: {
                    background: '#363636',
                    color: '#fff',
                    fontSize: '14px',
                },
                success: {
                    style: { background: '#10b981' },
                    iconTheme: { primary: 'white', secondary: '#10b981' },
                },
                error: {
                    style: { background: '#ef4444' },
                },
                loading: {
                    style: { background: '#3b82f6' },
                },
            }}
        />
    );
}