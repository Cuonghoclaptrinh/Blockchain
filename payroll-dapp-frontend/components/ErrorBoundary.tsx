// src/components/ErrorBoundary.tsx
'use client';
import { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback || (
                    <div className="min-h-screen flex items-center justify-center bg-gray-50">
                        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
                            <h1 className="text-2xl font-bold text-red-600 mb-4">Ối! Có lỗi xảy ra</h1>
                            <p className="text-gray-600">Vui lòng tải lại trang</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                            >
                                Tải lại
                            </button>
                        </div>
                    </div>
                )
            );
        }

        return this.props.children;
    }
}