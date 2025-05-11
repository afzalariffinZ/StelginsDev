"use client";

import { Patient } from "@/lib/types";
import { StatusIndicator } from "@/components/status-indicator";
import { format } from "date-fns";

interface PatientHeaderProps {
  patient: Patient;
}

export function PatientHeader({ patient }: PatientHeaderProps) {
  console.log("status", patient);
  const dob = format(new Date(patient.dateOfBirth), "MMM d, yyyy");
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIndicator status={patient.status} />
          <h1 className="text-3xl font-bold tracking-tight">
          {patient.name}
          </h1>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
        <p>DOB: {dob}</p>
        <p>Primary Condition: {patient.primaryCondition}</p>
        <p>Last Activity: {format(new Date(patient.lastActivity), "MMM d, yyyy h:mm a")}</p>
      </div>
    </div>
  );
}