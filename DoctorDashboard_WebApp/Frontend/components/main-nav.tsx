"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Users, Settings , Sparkles   } from "lucide-react";

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 px-2 py-4">
      <Link
        href="/dashboard"
        className={cn(
          "sidebar-item",
          pathname === "/dashboard" && "active"
        )}
      >
        <Home className="h-5 w-5" />
        <span>Dashboard</span>
      </Link>
      <Link
        href="/patients"
        className={cn(
          "sidebar-item",
          pathname.startsWith("/patients") && "active"
        )}
      >
        <Users className="h-5 w-5" />
        <span>My Patients</span>
      </Link>
      <Link
        href="/chatbot"
        className={cn(
          "sidebar-item",
          pathname === "/chatbot" && "active"
        )}
      >
        <Sparkles className="h-5 w-5" />
        <span>Chatbot</span>
      </Link>
      <Link
        href="/settings"
        className={cn(
          "sidebar-item",
          pathname === "/settings" && "active"
        )}
      >
        <Settings className="h-5 w-5" />
        <span>Settings</span>
      </Link>
    </nav>
  );
}