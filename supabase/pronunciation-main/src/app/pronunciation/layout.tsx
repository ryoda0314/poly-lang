import { AppShell } from '@/components/layout/app-shell';
import { Toaster } from 'sonner';

export default function PronunciationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AppShell>
            {children}
            <Toaster
                position="bottom-right"
                theme="dark"
                richColors
                closeButton
                toastOptions={{
                    style: {
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        color: 'var(--foreground)',
                    },
                }}
            />
        </AppShell>
    );
}
