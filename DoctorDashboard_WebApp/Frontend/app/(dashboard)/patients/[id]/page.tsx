import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PatientHeader } from "./components/patient-header";
import { PatientTabs } from "./components/patient-tabs";
import { Skeleton } from "@/components/ui/skeleton";

// ✅ Remove this line to disable static export behavior
// export const dynamic = 'force-static'; // removed this

// ✅ Optional: force this page to always render fresh data
export const dynamic = 'force-dynamic';

async function getPatientById(id: string) {
  try {
    const res = await fetch(`http://127.0.0.1:8000/get_patient_by_id?id=${id}`, {
      cache: "no-store", // ensures fresh fetch every time
    });

    if (!res.ok) return null;

    const patient = await res.json();
    return {
      id: String(patient.PatientID),
      name: patient.PatientName,
      dateOfBirth: patient.DateOfBirth ?? new Date().toISOString(),
      status: patient.patient_status,
      lastActivity: new Date().toISOString(),
      primaryCondition: patient.HealthCondition,
      keyMetric: '',
      trend: 'up' as const,
    };
  } catch (err) {
    return null;
  }
}

interface PatientDetailPageProps {
  params: {
    id: string;
  };
}

export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
  const patientId = params.id;
  const patient = await getPatientById(patientId);

  if (!patient) {
    notFound();
  }

  return (
    <div className="space-y-6 m-6">
      <Suspense fallback={<PatientHeaderSkeleton />}>
        <PatientHeader patient={patient} />
      </Suspense>

      <Suspense fallback={<PatientTabsSkeleton />}>
        <PatientTabs patient={patient} />
      </Suspense>
    </div>
  );
}

function PatientHeaderSkeleton() {
  return (
    <div className="space-y-2 m-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-10 w-56" />
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-36" />
      </div>
    </div>
  );
}

function PatientTabsSkeleton() {
  return (
    <div className="space-y-4 m-6">
      <div className="flex gap-2 overflow-auto">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-10 w-32 flex-shrink-0" />
          ))}
      </div>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
        </div>
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
