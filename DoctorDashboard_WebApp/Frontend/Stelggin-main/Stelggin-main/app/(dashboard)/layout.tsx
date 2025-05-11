import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Sidebar />
      <main className="flex-1 md:ml-64 pt-16">
        <div className="container py-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}