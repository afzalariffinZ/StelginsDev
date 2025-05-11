import { MainNav } from "@/components/main-nav";
import { Logo } from "@/components/logo";

export function Sidebar() {
  return (
    <div className="fixed bottom-0 left-0 top-0 z-30 hidden w-64 border-r bg-background pt-16 md:block">
      <div className="flex h-16 items-center border-b px-6">
        <Logo />
      </div>
      <div className="py-4">
        <MainNav />
      </div>
    </div>
  );
}