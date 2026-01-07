'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
    const router = useRouter();

    useEffect(() => {
        // Redireciona automaticamente para o dashboard
        router.replace('/dashboard');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="spinner"></div>
        </div>
    );
}
