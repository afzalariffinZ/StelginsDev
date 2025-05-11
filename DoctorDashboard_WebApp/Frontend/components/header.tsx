import { ModeToggle } from "@/components/mode-toggle";
import { UserNav } from "@/components/user-nav";
import { Logo } from "@/components/logo";

export function Header() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center md:hidden">
        <Logo size="small" />
      </div>
      <div className="ml-auto flex items-center gap-4">
        <ModeToggle />
        <UserNav />
      </div>
    </div>
  );
}