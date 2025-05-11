"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {

  const[drInfo, setDrInfo] = useState<any>();

  useEffect(() => {
    const doctorDataString = localStorage.getItem("doctor"); // Use correct casing "Doctor"
    if (doctorDataString) {
      // 2. Parse the string into an object
      const doctorDataObject = JSON.parse(doctorDataString);
      setDrInfo(doctorDataObject);
    }
  }, []);
  
  const [profileForm, setProfileForm] = useState({
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@meditrack.com",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm({
      ...profileForm,
      [name]: value,
    });
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm({
      ...passwordForm,
      [name]: value,
    });
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsUpdatingProfile(false);
      toast.success("Profile updated successfully");
    }, 1000);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    
    setIsChangingPassword(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsChangingPassword(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password changed successfully");
    }, 1000);
  };

  return (
    <div className="space-y-6 m-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Separator />

      <form onSubmit={handleProfileSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your account profile details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={drInfo?.DrName}
                onChange={handleProfileInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={drInfo?.Email}
                onChange={handleProfileInputChange}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isUpdatingProfile} className="ml-auto">
              {isUpdatingProfile ? "Updating..." : "Update Profile"}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <form onSubmit={handlePasswordSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your account password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={handlePasswordInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordInputChange}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isChangingPassword} className="ml-auto">
              {isChangingPassword ? "Changing..." : "Change Password"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}