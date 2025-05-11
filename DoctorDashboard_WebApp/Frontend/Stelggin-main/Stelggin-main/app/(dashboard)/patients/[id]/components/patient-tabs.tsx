"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  HeartPulse,
  ScrollText,
  Settings,
  Trophy,
  Utensils,
} from "lucide-react";
import { PatientOverview } from "./tabs/patient-overview";
import { DietLogs } from "./tabs/diet-logs";
import { BloodSugar } from "./tabs/blood-sugar";
import { Exercise } from "./tabs/exercise";
import { AISuggestions } from "./tabs/ai-suggestions";
import { DietPlanSettings } from "./tabs/diet-plan-settings";
import { Patient } from "@/lib/types";
import {
  mockFoodLogs,
  mockBloodSugarReadings,
  mockExerciseLogs,
  mockAISuggestions,
  mockDietPlan
} from "@/lib/mock-data";

interface PatientTabsProps {
  patient: Patient;
}



export interface DietPlan {
  patientId: string;
  targetCalories: number;
  maxFat: number;
  maxSodium: number;
  maxSugar: number;
  dietaryNotes: string;
}

interface PatientReading {
  avg_calorie: string;
  avg_fat: string;
  avg_sodium: string;
  avg_sugar: string;
}

type NutrientTrendEntry = {
  date: string;
  sodium_intake: number;
  sugar_intake: number;
  fat_intake: number;
  calorie_intake: number;
};

export function PatientTabs({ patient }: PatientTabsProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [dietLogs, setDietLogs] = useState<any[]>([]);
  const [bloodSugarReadings, setBloodSugarReadings] = useState<any[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<any[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [dietPlan, setDietPlan] = useState<any>(null);

  const [loadedTabs, setLoadedTabs] = useState<Record<string, boolean>>({});
  const [patientReading, setPatientReading] = useState<PatientReading | null>(null);

  const [nutrientTrend, setNutrientTrend] = useState<any[]>([]);

  // Lazy load handler
  useEffect(() => {
    const loadData = async () => {
      if (activeTab !== "diet-plan" && loadedTabs[activeTab]) return;

      try {
        switch (activeTab) {
          case "overview": {
            const res = await fetch(`http://127.0.0.1:8000/get_average_nutrients?patientid=${patient.id}`);
            const data = await res.json();
            const formatted: PatientReading = {
              avg_calorie: data["avg_calorie(kcal)"].toFixed(2),
              avg_fat: data["avg_fat(g)"].toFixed(2),
              avg_sodium: data["avg_sodium(g)"].toFixed(2),
              avg_sugar: data["avg_sugar(g)"].toFixed(2),
            };
            setPatientReading(formatted);

            // Fetch nutrient trend
            const resTrend = await fetch(`http://127.0.0.1:8000/get_nutrient_trend?patientid=${patient.id}`);
            const dataTrend = await resTrend.json();
            const trend: NutrientTrendEntry[] = dataTrend.trend;
            console.log('trend',trend);
            setNutrientTrend(trend);
            break;
          }
          case "diet-logs": {
            const res = await fetch(`http://127.0.0.1:8000/get_diet_logs?patientid=${patient.id}`);
            const data = await res.json();
          
            // Sort by datetime in descending order
            data.sort((a: any, b: any) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
          
            const formatted = data.map((log: any, index: number) => ({
              id: (index + 1).toString(),
              patientId: log.PatientID.toString(),
              timestamp: new Date(log.datetime).toISOString(),
              mealType: "meal",
              imageUrl: log.imagelink,
              calories: log.calorie_intake,
              carbs: 0,
              protein: 0,
              fat: log.fat_intake,
              notes: log.notes,
              sodium_intake: log.sodium_intake,
              sugar_intake: log.sugar_intake
            }));
          
            setDietLogs(formatted);
            break;
          }          
          case "exercise": {
            const res = await fetch(`http://127.0.0.1:8000/get_steps?patientid=${patient.id}`);
            const data = await res.json();

            const formatted = data.map((entry: any, index: number) => ({
              id: (index + 1).toString(),
              timestamp: new Date(entry.Date).toISOString(),
              steps: entry.NumberOfSteps,
              distance: entry.Total_Distance_km,
              caloriesBurned: entry.Calories_Burned,
            }));

            setExerciseLogs(formatted);
            break;
          }
          case "diet-plan": {
            const res = await fetch(`http://127.0.0.1:8000/get_diet_plan?patientid=${patient.id}`);
            const data = await res.json();
            if (data && data.length > 0) {
              const raw = data[0];
              const formatted: DietPlan = {
                patientId: String(raw.PatientID),
                targetCalories: raw.Target_Daily_Calories,
                maxFat: raw.Max_Fat,
                maxSodium: raw.Max_Sodium,
                maxSugar: raw.Max_Sugar,
                dietaryNotes: raw.Notes,
              };
              setDietPlan(formatted);
            }
            break;
          }
        }

        setLoadedTabs((prev) => ({ ...prev, [activeTab]: true }));
      } catch (err) {
        console.error(`Failed to fetch data for tab: ${activeTab}`, err);
      }
    };

    loadData();
  }, [activeTab, patient.id, loadedTabs]);

  return (
    <Tabs
      defaultValue="overview"
      value={activeTab}
      onValueChange={setActiveTab}
      className="space-y-4"
    >
      <TabsList className="grid grid-cols-3 md:grid-cols-4 gap-1 p-1 rounded-lg bg-muted h-auto w-full">
          <TabsTrigger 
            value="overview" 
            className="flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="diet-logs" 
            className="flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Utensils className="h-4 w-4" />
            <span>Diet Logs</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="exercise" 
            className="flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Trophy className="h-4 w-4" />
            <span>Exercise</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="diet-plan" 
            className="flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Settings className="h-4 w-4" />
            <span>Diet Plan</span>
          </TabsTrigger>
          
          {/* Commented out tabs - kept for future use */}
          {/* 
          <TabsTrigger 
            value="blood-sugar" 
            className="flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <HeartPulse className="h-4 w-4" />
            <span>Blood Sugar</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="ai-suggestions" 
            className="flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <ScrollText className="h-4 w-4" />
            <span>AI Suggestions</span>
          </TabsTrigger>
          */}
        </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <PatientOverview
          patient={patient}
          patientReading={patientReading}
          nutrientTrend={{ trend: nutrientTrend }}
        />
      </TabsContent>

      <TabsContent value="diet-logs" className="space-y-4">
        <DietLogs logs={dietLogs} />
      </TabsContent>

      <TabsContent value="blood-sugar" className="space-y-4">
        <BloodSugar readings={mockBloodSugarReadings} />
      </TabsContent>

      <TabsContent value="exercise" className="space-y-4">
        <Exercise logs={exerciseLogs} patient={patient} />
      </TabsContent>

      <TabsContent value="ai-suggestions" className="space-y-4">
        <AISuggestions suggestions={mockAISuggestions} />
      </TabsContent>

      <TabsContent value="diet-plan" className="space-y-4">
        {/* Ensure dietPlan is not null before passing it */}
        {dietPlan ? (
          <DietPlanSettings dietPlan={dietPlan} patientId={patient.id} />
        ) : (
          <DietPlanSettings dietPlan={mockDietPlan} patientId={patient.id} />// Display loading message while dietPlan is being fetched
        )}
      </TabsContent>
    </Tabs>
  );
}