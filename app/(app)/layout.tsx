import { Navbar } from '@/app/components/Navbar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 min-h-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
