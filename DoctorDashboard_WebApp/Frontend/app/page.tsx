"use client";

import { useState } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
  
    try {
      const response = await fetch("http://localhost:8000/login_doctor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dremail: email, // assuming email input is actually DrID
          password: password,
        }),
      });
  
      const data = await response.json();
  
      if (data.success) {
        const { success, ...doctorDetails } = data;
        localStorage.setItem("doctor", JSON.stringify(doctorDetails));
        router.push("/dashboard");
      } else {
        setLoginError("Invalid login credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoginError("An error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="absolute right-4 top-4">
        <ModeToggle />
      </div>
      
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <Logo size="large" className="mx-auto" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Clinic Portal Login
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to access the doctor portal
          </p>
        </div>

        <div className="grid gap-6">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email / Username</Label>
                <Input
                  id="email"
                  placeholder="doctor@example.com"
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Button variant="link" className="h-auto p-0 text-xs" asChild>
                    <a href="#" className="text-primary">
                      Forgot Password?
                    </a>
                  </Button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(!!checked)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me
                </label>
              </div>
              {loginError && (
                <p className="text-sm text-red-500 text-center">{loginError}</p> // <-- error shown here
              )}
              <Button disabled={isLoading} type="submit" className="w-full">
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}