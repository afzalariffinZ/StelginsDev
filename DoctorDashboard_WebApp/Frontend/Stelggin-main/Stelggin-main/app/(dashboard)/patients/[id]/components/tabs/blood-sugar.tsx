"use client";

import { BloodSugarReading } from "@/lib/types";
import { GlucoseChart } from "@/components/glucose-chart";
import { DateRangePicker } from "@/components/date-range-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";

interface BloodSugarProps {
  readings: BloodSugarReading[];
}

export function BloodSugar({ readings }: BloodSugarProps) {
  // Sort readings by timestamp in descending order (newest first)
  const sortedReadings = [...readings].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const contextLabels = {
    fasting: "Fasting",
    "pre-meal": "Before Meal",
    "post-meal": "After Meal",
    bedtime: "Bedtime",
  };

  return (
    <div className="space-y-6">
      <DateRangePicker className="w-full sm:w-80" />

      <Card>
        <CardHeader>
          <CardTitle>Blood Sugar Readings</CardTitle>
        </CardHeader>
        <CardContent>
          <GlucoseChart data={readings} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reading History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Reading (mg/dL)</TableHead>
                <TableHead>Context</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedReadings.map((reading) => (
                <TableRow key={reading.id}>
                  <TableCell>
                    {format(parseISO(reading.timestamp), "MMM d, yyyy h:mm a")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {reading.value}
                    {reading.value > 180 && (
                      <span className="ml-2 inline-block rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                        High
                      </span>
                    )}
                    {reading.value < 70 && (
                      <span className="ml-2 inline-block rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                        Low
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {contextLabels[reading.context as keyof typeof contextLabels]}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}