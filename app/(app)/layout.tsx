import { Navbar } from '@/app/components/Navbar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
