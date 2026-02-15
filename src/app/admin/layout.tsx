import { redirect } from "next/navigation";
import { checkAdmin } from "./dashboard-data/actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const auth = await checkAdmin();
    if (!auth.success) {
        redirect("/");
    }

    return <>{children}</>;
}
