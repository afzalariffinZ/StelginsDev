"use client";

import { BloodSugarReading, Patient } from "@/lib/types";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SugarChart } from "@/components/sugar-chart";
import { FatChart } from "@/components/fat-chart";
import { CalorieChart } from "@/components/calorie-chart";
import { SodiumChart } from "@/components/sodium-chart";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { subDays } from "date-fns";

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

interface PatientOverviewProps {
  patient: Patient;
  patientReading?: PatientReading | null;
  nutrientTrend?: { trend: any[] } | null;
}

export function PatientOverview({ patient, patientReading, nutrientTrend }: PatientOverviewProps) {
  const trendData = nutrientTrend?.trend || [];

  // Filter trend data from the last 7 days
  const recentTrend = trendData.filter((entry) =>
    new Date(entry.date) > subDays(new Date(), 7)
  );

  // Map data for each nutrient type
  const patientId = 'some-patient-id';
  const sugarReadings: BloodSugarReading[] = recentTrend.map((entry, index) => ({
    id: crypto.randomUUID(), // or use `String(index)` if uniqueness is enough
    patientId,
    timestamp: entry.date,
    value: entry.sugar_intake,
    context: 'post-meal', // Replace or dynamically assign based on your logic
  }));

  const calorieReadings: BloodSugarReading[] = recentTrend.map((entry) => ({
    id: crypto.randomUUID(),
    patientId,
    timestamp: entry.date,
    value: entry.calorie_intake,
    context: 'post-meal', // Adjust as needed
  }));

  const fatReadings: BloodSugarReading[] = recentTrend.map((entry) => ({
    id: crypto.randomUUID(),
    patientId,
    timestamp: entry.date,
    value: entry.fat_intake,
    context: 'post-meal', // Adjust as needed
  }));

  const sodiumReadings: BloodSugarReading[] = recentTrend.map((entry) => ({
    id: crypto.randomUUID(),
    patientId,
    timestamp: entry.date,
    value: entry.sodium_intake,
    context: 'post-meal', // Adjust as needed
  }));


  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Average Sugar Intake (1d)"
          value={`${patientReading?.avg_sugar ? parseFloat(patientReading.avg_sugar) : 0} g`}
          description="Trending upward"
        />
        <MetricCard
          title="Average Calorie (1d)"
          value={`${patientReading?.avg_calorie ? parseFloat(patientReading.avg_calorie) : 0} kcal`}
          description="Within target range (92% of goal)"
        />
        <MetricCard
          title="Average Fat Intake (1d)"
          value={`${patientReading?.avg_fat ? parseFloat(patientReading.avg_fat) : 0} g`}
          description="Based on logging consistency"
        />
        <MetricCard
          title="Average Sodium Intake (1d)"
          value={`${patientReading?.avg_sodium ? parseFloat(patientReading.avg_sodium) : 0} mg`}
          description="Well-controlled"
        />
      </div>

      <Tabs defaultValue="sugar" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sugar">Sugar</TabsTrigger>
          <TabsTrigger value="calorie">Calorie</TabsTrigger>
          <TabsTrigger value="fat">Fat</TabsTrigger>
          <TabsTrigger value="sodium">Sodium</TabsTrigger>
        </TabsList>

        <TabsContent value="sugar">
          <Card>
            <CardHeader>
              <CardTitle>Sugar Intake Trend</CardTitle>
              <CardDescription>Last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <SugarChart data={sugarReadings} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calorie">
          <Card>
            <CardHeader>
              <CardTitle>Calorie Intake Trend</CardTitle>
              <CardDescription>Last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <CalorieChart data={calorieReadings} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fat">
          <Card>
            <CardHeader>
              <CardTitle>Fat Intake Trend</CardTitle>
              <CardDescription>Last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <FatChart data={fatReadings} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sodium">
          <Card>
            <CardHeader>
              <CardTitle>Sodium Intake Trend</CardTitle>
              <CardDescription>Last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <SodiumChart data={sodiumReadings} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
