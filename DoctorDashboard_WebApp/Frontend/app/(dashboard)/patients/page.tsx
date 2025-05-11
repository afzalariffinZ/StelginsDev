"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PatientListItem } from "@/components/patient-list-item";
import { mockPatients } from "@/lib/mock-data";
import { Patient, PatientStatus } from "@/lib/types";
import { Search, Plus, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PatientStatus | "all">("all");
  const [patientId, setPatientId] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [drId, setDrId] = useState<number | null>(null);

  useEffect(() => {
    // Ensure code runs only on the client side
    if (typeof window !== "undefined") {
      const doctorData = JSON.parse(localStorage.getItem("doctor") || "{}");
      setDrId(doctorData?.DrID || null);
    }
  }, []);

  useEffect(() => {
    if (drId) {
      fetchPatients(drId);
    }
  }, [drId]);

  // Fetch patients based on drId
  const fetchPatients = async (drid: number) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/get_patient_dr?drid=${drid}`);
      if (!response.ok) {
        throw new Error("Failed to fetch patients");
      }
      const data = await response.json();
      const transformedPatients = data.map((patient: any) => ({
        id: String(patient.PatientID), // Convert PatientID to string
        name: patient.PatientName,
        dateOfBirth: '', // If you have date of birth information, map it here
        status: patient.patient_status, // Example status, you may adjust it based on your criteria
        lastActivity: patient.Last_Activity, // Set a default date or fetch from your data if available
        primaryCondition: patient.HealthCondition,
        keyMetric: '', // You may want to map this from other data
        trend: 'up', // Example trend, adjust as necessary
      }));
  
      setPatients([...transformedPatients]);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to load patients");
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch = patient.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || patient.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddPatient = () => {
    // Reset messages
    setErrorMessage("");
    setSuccessMessage("");
    
    // Basic validation
    if (!patientId.trim()) {
      setErrorMessage("Please enter a patient ID");
      return;
    }
    
    // Check if patient ID already exists
    if (patients.some(p => p.id === patientId)) {
      setErrorMessage("Patient with this ID already exists in your list");
      return;
    }
    
    // In a real app, this would make an API call to fetch patient details
    // For this mock implementation, we'll create a placeholder patient
    const newPatient = {
      id: patientId,
      name: `${patientId}`,
      condition: "New Patient",
      lastActivity: new Date().toISOString(),
      keyMetric: "N/A",
      status: "stable" as PatientStatus,
    };
    
    const patientToAdd = {
      ...newPatient,
      dateOfBirth: '', // Required field for Patient type
      primaryCondition: newPatient.condition // Map condition to primaryCondition
    };
    
    setPatients([...patients, patientToAdd]);
    setSuccessMessage(`Patient ${patientId} added successfully`);
    setPatientId("");
  };

  return (
    <div className="space-y-6 m-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Patients</h1>
        <p className="text-muted-foreground">
          View and manage your patient list
        </p>
      </div>

      {/* Add Patient Section */}
      <div className="p-4 rounded-md border bg-background">
        <h2 className="text-xl font-semibold mb-4">Add Patient by ID</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Enter patient ID"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={handleAddPatient}>
            <Plus className="mr-2 h-4 w-4" />
            Add Patient
          </Button>
        </div>
        
        {errorMessage && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        {successMessage && (
          <Alert className="mt-4 bg-green-50 text-green-800 border-green-200">
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient name or ID"
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as PatientStatus | "all")}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Patients</SelectItem>
            <SelectItem value="stable">Stable</SelectItem>
            <SelectItem value="warning">Needs Attention</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50 text-sm">
                <th className="p-4 text-left font-medium">Patient Name</th>
                <th className="p-4 text-left font-medium">Condition</th>
                <th className="p-4 text-left font-medium">Last Activity</th>
                <th className="p-4 text-left font-medium">Key Metric</th>
                <th className="p-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <PatientListItem key={patient.id} patient={patient} />
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground">
                    No patients found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}