import { Patient } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { StatusIndicator } from "@/components/status-indicator";
import { TrendIndicator } from "@/components/trend-indicator";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface PatientListItemProps {
  patient: Patient;
}
export type PatientStatus = "stable" | "warning" | "urgent";

export function PatientListItem({ patient }: PatientListItemProps) {
  console.log(patient);
  const statusColors = {
    stable: "bg-green-100 text-green-800 hover:bg-green-200",
    warning: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    urgent: "bg-red-100 text-red-800 hover:bg-red-200"
  };
  const lastActivityDate = new Date(patient.lastActivity);
  const lastActivityFormatted = formatDistanceToNow(lastActivityDate, { addSuffix: true });

  return (
    <tr className="border-b transition-colors hover:bg-muted/50">
      <td className="p-4">
        <div className="flex items-center">
          <StatusIndicator status={patient.status} />
          <Link href={`/patients/${patient.id}`} className="font-medium hover:underline">
            {patient.name}
          </Link>
        </div>
      </td>
      <td className="p-4">{patient.primaryCondition}</td>
      <td className="p-4">{lastActivityFormatted}</td>
      <td className="p-4">
        <div className="flex items-center">
          <Badge className={statusColors[patient.status]}>
            {patient.status === "stable" ? "Stable" :
              patient.status === "warning" ? "Needs Attention" : "Urgent"}
          </Badge>
        </div>
      </td>
      <td className="p-4 text-right">
        <Button asChild size="sm">
          <Link href={`/patients/${patient.id}`}>
            View Details
          </Link>
        </Button>
      </td>
    </tr>
  );
}