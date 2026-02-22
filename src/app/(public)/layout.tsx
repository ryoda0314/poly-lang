import PublicFooter from "@/components/PublicFooter";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {children}
            <PublicFooter />
        </>
    );
}
