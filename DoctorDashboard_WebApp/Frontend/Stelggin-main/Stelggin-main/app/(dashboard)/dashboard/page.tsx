'use client';

import {
  Activity,
  AlertCircle,
  TrendingUp,
  Users,
} from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientAlertCard } from "@/components/patient-alert-card";
import { mockPatients } from "@/lib/mock-data";
import { useEffect, useState } from "react";

export default function DashboardPage() {

  const [numberOfPatients, setNumberOfPatients] = useState(0);
  const [numberOfPatientsNeedingAttention, setNumberOfPatientsNeedingAttention] = useState(0);
  const [patientsData, setPatientsData] = useState<any[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [latestEntries, setLatestEntries] = useState<any[]>([]);
  const [drName, setDrName] = useState();

  useEffect(() => {
    const doctorDataString = localStorage.getItem("doctor"); // Use correct casing "Doctor"
    if (doctorDataString) {
      // 2. Parse the string into an object
      const doctorDataObject = JSON.parse(doctorDataString);
      setDrName(doctorDataObject.DrName);
      // 3. Access the PatientIDs array and get its length
      
      const validPatientIDs = doctorDataObject?.PatientIDs?.filter((id: null) => id !== null);
      setNumberOfPatients(validPatientIDs?.length || 0);// Update the state with number of patients
      const drId = doctorDataObject.DrID;
      
      getPatientById(drId);
      getTotalEntries(drId);
      getLatestEntries(drId);
    }
  }, []);

  async function getPatientById(id: string) {
    try {
      const res = await fetch(`http://127.0.0.1:8000/get_patient_dr?drid=${id}`, {
        cache: "no-store", // ensures fresh fetch every time
      });

      if (!res.ok) return null;

      const patientList = await res.json();
      
      setPatientsData(patientList); // Save the patients data in the state

      // Filter patients who need attention (urgent or warning status)
      const patientsNeedingAttention = patientList.filter(
        (patient: any) => patient.patient_status === "urgent" || patient.patient_status === "warning"
      );
      setNumberOfPatientsNeedingAttention(patientsNeedingAttention.length);
    } catch (err) {
      return null;
    }
  }

  async function getTotalEntries(id: string) {
    try {
      const res = await fetch(`http://127.0.0.1:8000/get_total_log_entries?drid=${id}`, {
        cache: "no-store", // ensures fresh fetch every time
      });

      if (!res.ok) return null;

      const data = await res.json();
      const total = data["Total Log Entries"];
      setTotalEntries(total); // Save the patients data in the state
    } catch (err) {
      return null;
    }
  }

  async function getLatestEntries(id: string) {
    try {
      const res = await fetch(`http://127.0.0.1:8000/get_latest_log_entries?drid=${id}`, {
        cache: "no-store", // ensures fresh fetch every time
      });

      if (!res.ok) return null;

      const data = await res.json();
     
      data.sort((a: any, b: any) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

      const formatted = data.map((entry: any) => ({
        name: entry.PatientName,
        datetime: new Date(entry.datetime),
      }));

      setLatestEntries(formatted);
    } catch (err) {
      return null;
    }
  }

  // Filter patients who need attention (urgent or warning status)
  const patientsNeedingAttention = patientsData.filter(
    (patient) => patient.patient_status === "urgent" || patient.patient_status === "warning"
  );

  const alertReasons = {
    "1": "Blood sugar readings consistently above target range for the past 24 hours",
    "2": "Missed medication check-in for 2 consecutive days",
    "5": "Recent blood sugar readings trending upward",
  };


  return (
    <div className="space-y-6 m-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {drName}. Here's an overview of your patients.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total Patients"
          value={numberOfPatients}
          description="4 new this month"
          icon={<Users className="h-4 w-4" />}
        />
        <MetricCard
          title="Patients Needing Attention"
          value={numberOfPatientsNeedingAttention.toString()}
          description="Since yesterday"
          icon={<AlertCircle className="h-4 w-4" />}
        />

        <MetricCard
          title="Total Log Entries"
          value={totalEntries}
          description="Past 7 days"
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Patients Needing Attention</CardTitle>
            <CardDescription>
              Patients with critical alerts or missing check-ins
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {patientsNeedingAttention.map((patient) => (
                <PatientAlertCard
                  key={patient.PatientID}
                  patient={patient}
                  reason={alertReasons[patient.id as keyof typeof alertReasons] || "Needs review"}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest patient logs and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {latestEntries.map((entry, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="relative mt-0.5 h-2 w-2 rounded-full bg-primary" />
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">
                      {entry.name} logged a meal
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {entry.datetime.toLocaleString("en-US", {
                        weekday: "short",
                        hour: "numeric",
                        minute: "numeric",
                        hour12: true,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>

        </Card>
      </div>
    </div>
  );
}