import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('sysfarma.user');

  if (!userCookie?.value) {
    redirect('/login');
  }

  const user = JSON.parse(userCookie.value);

  return (
    <DashboardShell user={user}>
      {children}
    </DashboardShell>
  );
}
