import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header'; // Adjust path as needed
import { verifySession } from '@/lib/authN';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await verifySession();

  return (
    <div className="bg-muted/40 flex min-h-screen w-full flex-col">
      <AppSidebar />
      {/* Main Content Area */}
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        {/* Header sits here now */}
        <AppHeader />

        {/* Page content injected here */}
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0">
          {children}
        </main>
      </div>
    </div>
  );
}
