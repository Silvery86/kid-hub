import { AppSidebar } from '@/components/layout/AppSidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-sky-50">
      <AppSidebar />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
