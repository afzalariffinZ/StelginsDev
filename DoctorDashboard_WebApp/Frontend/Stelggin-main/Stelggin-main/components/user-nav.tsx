"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function UserNav() {
  const router = useRouter();

  const handleLogout = () => {
    router.push("/");
  };

  const[drInfo, setDrInfo] = useState<any>();

  useEffect(() => {
    const doctorDataString = localStorage.getItem("doctor"); // Use correct casing "Doctor"
    if (doctorDataString) {
      // 2. Parse the string into an object
      const doctorDataObject = JSON.parse(doctorDataString);
      console.log(doctorDataObject)
      setDrInfo(doctorDataObject);
    }
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatar.png" alt="Dr. Sarah Johnson" />
            <AvatarFallback>DR</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{drInfo?.DrName || "Dr. Sarah"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {drInfo?.Email || "sarah@gmail.com"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}