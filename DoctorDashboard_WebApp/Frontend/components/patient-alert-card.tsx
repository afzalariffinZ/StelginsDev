import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Patient } from "@/lib/types";
import { StatusIndicator } from "@/components/status-indicator";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PatientAlertCardProps {
  patient: Patient;
  reason: string;
}

export function PatientAlertCard({ patient, reason }: PatientAlertCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIndicator status={patient.patient_status || 'stable'} />
            <CardTitle className="text-base">{patient.PatientName}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground">{reason}</p>
      </CardContent>
      <CardFooter>
        <Button asChild size="sm" className="w-full">
          <Link href={`/patients/${patient.PatientID}`}>
            View Patient
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}