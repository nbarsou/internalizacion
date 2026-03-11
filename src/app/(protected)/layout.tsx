import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { verifySession } from '@/lib/authn';
import { buildPermissions } from '@/lib/permissions';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Grab the user along with the role
  const { role, user } = await verifySession();
  const can = buildPermissions(role);

  return (
    <div className="bg-muted/40 flex min-h-screen w-full flex-col">
      {/* Pass both 'can' and 'user' to the sidebar */}
      <AppSidebar can={can} user={user} />

      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <AppHeader />
        <main className="flex-1 items-start p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}
