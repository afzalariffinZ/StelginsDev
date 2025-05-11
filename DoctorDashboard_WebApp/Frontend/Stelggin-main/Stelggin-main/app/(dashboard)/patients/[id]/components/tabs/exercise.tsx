"use client";

// 1. SIMPLIFIED ExerciseLog interface
export interface ExerciseLog {
  id?: string;
  timestamp: string; // ISO string e.g., "2023-10-26T10:00:00.000Z"
  steps?: number;
  distance?: number; // in km
  caloriesBurned?: number;
}

import { Patient } from "@/lib/types";

interface PatientHeaderProps {
  patient: Patient;
}


// --- IMPORT NECESSARY COMPONENTS AND UTILITIES ---
import { DateRangePicker } from "@/components/date-range-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  format,
  parseISO,
  subDays,
  isWithinInterval,
  eachDayOfInterval,
  startOfDay,
  endOfDay,
  isSameDay, // Added for better date range display
} from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { Footprints, Route, Flame } from "lucide-react";

// 2. UPDATED HARDCODED MOCK DATA (no type, no duration)
const MOCK_EXERCISE_LOGS: ExerciseLog[] = [
  // Today
  { id: "mock-today-1", timestamp: new Date(new Date().setHours(8,0,0,0)).toISOString(), steps: 2500, distance: 1.8, caloriesBurned: 110 },
  { id: "mock-today-2", timestamp: new Date(new Date().setHours(13,0,0,0)).toISOString(), steps: 3000, distance: 2.2, caloriesBurned: 130 },
  // Yesterday
  { id: "1", timestamp: subDays(new Date().setHours(9,0,0,0), 1).toISOString(), steps: 7500, distance: 5.5, caloriesBurned: 300 },
  // 2 days ago
  { id: "2", timestamp: subDays(new Date().setHours(10,0,0,0), 2).toISOString(), steps: 6000, distance: 4.5, caloriesBurned: 250 },
  { id: "mock-2daysago-2", timestamp: subDays(new Date().setHours(15,0,0,0), 2).toISOString(), steps: 1500, distance: 1.1, caloriesBurned: 65 },
  // 3 days ago
  { id: "3", timestamp: subDays(new Date().setHours(11,0,0,0), 3).toISOString(), distance: 15, caloriesBurned: 400, steps: 8000 }, // Note: cycling typically has distance/calories, not steps
  // 4 days ago
  { id: "4", timestamp: subDays(new Date().setHours(12,0,0,0), 4).toISOString(), steps: 3000, distance: 3.1, caloriesBurned: 280 },
  // 5 days ago
  { id: "5", timestamp: subDays(new Date().setHours(14,0,0,0), 5).toISOString(), steps: 7200, distance: 5.1, caloriesBurned: 300 },
  // 6 days ago
  { id: "6", timestamp: subDays(new Date().setHours(16,0,0,0), 6).toISOString(), steps: 3100, distance: 2.2, caloriesBurned: 150 },
  // 7 days ago
  { id: "7", timestamp: subDays(new Date().setHours(10,0,0,0), 7).toISOString(), steps: 6500, distance: 6.0, caloriesBurned: 550 },
  // Previous weeks for month view
  { id: "8", timestamp: subDays(new Date().setHours(11,0,0,0), 8).toISOString(), distance: 20, caloriesBurned: 500, steps: 9000 },
  { id: "9", timestamp: subDays(new Date().setHours(13,0,0,0), 9).toISOString(), steps: 4500, distance: 3.2, caloriesBurned: 200 },
  { id: "10", timestamp: subDays(new Date().setHours(15,0,0,0), 14).toISOString(), steps: 4200, distance: 4.0, caloriesBurned: 380 },
  { id: "11", timestamp: subDays(new Date().setHours(17,0,0,0), 15).toISOString(), steps: 9500, distance: 6.8, caloriesBurned: 450 },
  { id: "12", timestamp: subDays(new Date().setHours(8,0,0,0), 20).toISOString(), distance: 25, caloriesBurned: 600, steps: 10000 },
  { id: "13", timestamp: subDays(new Date().setHours(9,0,0,0), 21).toISOString(), steps: 5000, distance: 4.8, caloriesBurned: 420 },
  { id: "14", timestamp: subDays(new Date().setHours(10,0,0,0), 28).toISOString(), steps: 6200, distance: 4.6, caloriesBurned: 280 },
  { id: "15", timestamp: subDays(new Date().setHours(12,0,0,0), 29).toISOString(), steps: 3300, distance: 3.2, caloriesBurned: 290 },
];
// --- END OF HARDCODED MOCK DATA ---


interface ExerciseProps {
  logs?: ExerciseLog[];
  patient?: Patient;
}

type Timeframe = "week" | "month";
type MetricKey = "steps" | "distance" | "caloriesBurned";

interface ProcessedDataForChart { // Renamed for clarity from original 'ProcessedData'
  chartData: { name: string; value: number; fullDate: string }[];
  averageValue: number;
  totalValue: number;
}

// This function processes data for the STAT CARDS (Line Charts)
function processLogDataForCharts(
  logs: ExerciseLog[],
  metric: MetricKey,
  timeframe: Timeframe,
  selectedRange?: DateRange
): ProcessedDataForChart {
  const now = new Date();
  let periodEndDate: Date;
  let periodStartDate: Date;

  const defaultEndDate = endOfDay(now);
  const defaultWeekStart = startOfDay(subDays(now, 6));
  const defaultMonthStart = startOfDay(subDays(now, 29));

  if (selectedRange?.from) {
      const from = startOfDay(selectedRange.from);
      const to = selectedRange.to ? endOfDay(selectedRange.to) : from;

      if (timeframe === "month") {
          // For 'month' toggle with a date picker range, use the picker's range for the chart
          periodStartDate = from;
          periodEndDate = to;
      } else { // timeframe is "week"
          // For 'week' toggle, show 7 days ending on the picker's 'to' date (or 'from' if 'to' is not set)
          periodStartDate = startOfDay(subDays(to, 6));
          periodEndDate = to;
      }
  } else { // No DateRangePicker selection, use toggle relative to today
      periodEndDate = defaultEndDate;
      periodStartDate = timeframe === "week" ? defaultWeekStart : defaultMonthStart;
  }

  const relevantLogs = logs.filter((log) => {
    const logDate = parseISO(log.timestamp);
    const hasMetric = typeof log[metric] === 'number';
    return hasMetric && isWithinInterval(logDate, { start: periodStartDate, end: periodEndDate });
  });

  const daysInPeriod = eachDayOfInterval({
    start: periodStartDate,
    end: periodEndDate,
  });

  if (daysInPeriod.length === 0) {
    return { chartData: [], averageValue: 0, totalValue: 0 };
  }

  const dataByDay: { [key: string]: number } = {};
  daysInPeriod.forEach(day => {
    const dayKey = format(day, "yyyy-MM-dd");
    dataByDay[dayKey] = 0;
  });

  relevantLogs.forEach((log) => {
    const dayKey = format(parseISO(log.timestamp), "yyyy-MM-dd");
    const value = (log[metric] as number) || 0;
    if (dataByDay[dayKey] !== undefined) {
      dataByDay[dayKey] += Number(value);
    }
  });

  const chartData = daysInPeriod.map((day) => {
    const dayKey = format(day, "yyyy-MM-dd");
    return {
      name: format(day, daysInPeriod.length > 10 ? "d" : "EEE"),
      value: dataByDay[dayKey] || 0,
      fullDate: format(day, "MMM d, yyyy"),
    };
  });

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
  const averageValue = daysInPeriod.length > 0 ? totalValue / daysInPeriod.length : 0;

  return { chartData, averageValue, totalValue };
}


interface StatDisplayCardProps {
  title: string;
  logs: ExerciseLog[];
  metric: MetricKey;
  unit: string;
  color: string;
  icon: React.ElementType;
  selectedRange?: DateRange;
}

function StatDisplayCard({ title, logs, metric, unit, color, icon: Icon, selectedRange }: StatDisplayCardProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("week");

  const { chartData, averageValue, totalValue } = useMemo(() => {
    return processLogDataForCharts(logs, metric, timeframe, selectedRange);
  }, [logs, metric, timeframe, selectedRange]);

  const gradientId = `color${metric.replace(/\s+/g, '')}`;
  const strokeColorClass = color.startsWith('text-') ? color.replace('text-', 'stroke-') : `stroke-${color}-500`;
  const actualStrokeColorValue = 
    strokeColorClass.includes('sky') ? '#0ea5e9' : 
    strokeColorClass.includes('green') ? '#22c55e' : 
    strokeColorClass.includes('orange') ? '#f97316' : 
    '#ef4444';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-base font-medium ${color}`}>
            {title}
          </CardTitle>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div className="mt-1">
          <ToggleGroup
            type="single"
            size="sm"
            value={timeframe}
            onValueChange={(value: Timeframe) => value && setTimeframe(value)}
            className="justify-start"
          >
            <ToggleGroupItem value="week" aria-label="Last 7 days">Week</ToggleGroupItem>
            <ToggleGroupItem value="month" aria-label="Selected Range / Last 30 days">Month</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {metric === 'distance' ? averageValue.toFixed(1) : Math.round(averageValue).toLocaleString()} {unit}
          <span className="text-xs text-muted-foreground"> / day (avg)</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Total: {metric === 'distance' ? totalValue.toFixed(1) : Math.round(totalValue).toLocaleString()} {unit}
        </p>
        <div className="h-[100px] mt-4">
          {chartData.length > 0 && chartData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={actualStrokeColorValue} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={actualStrokeColorValue} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  fontSize={10}
                  interval={chartData.length > 15 ? Math.floor(chartData.length / (chartData.length > 35 ? 10:7)) : 0}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  fontSize={10}
                  tickFormatter={(value) => 
                    value >= 1000 ? `${(value/1000).toFixed(0)}k` : value.toString()
                  }
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    fontSize: "12px",
                    padding: "6px 10px",
                  }}
                  labelStyle={{ fontWeight: "bold", marginBottom: "4px", display: "block" }}
                  formatter={(value: number, name: string, props: any) => [
                      `${metric === 'distance' ? Number(value).toFixed(1) : Math.round(Number(value)).toLocaleString()} ${unit}`, 
                      title
                  ]}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={actualStrokeColorValue}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 1, stroke: actualStrokeColorValue, fill: actualStrokeColorValue }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No {metric} data for this period.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// 3. NEW DailyLogSummary interface and aggregateLogsByDay function
interface DailyLogSummary {
  date: string; // Formatted for display e.g. "Oct 26, 2023"
  isoDate: string; // For sorting e.g. "2023-10-26"
  totalSteps: number;
  totalDistance: number;
  totalCalories: number;
}

function aggregateLogsByDay(
  logs: ExerciseLog[],
  selectedRange?: DateRange
): DailyLogSummary[] {
  if (!logs || logs.length === 0) return [];

  const now = new Date();
  // Determine the overall range for which to show daily summaries in the table
  // This range is strictly from the DateRangePicker
  const rangeStart = selectedRange?.from ? startOfDay(selectedRange.from) : startOfDay(subDays(now, 6)); // Default: last 7 days if no picker start
  const rangeEnd = selectedRange?.to ? endOfDay(selectedRange.to) : endOfDay(now); // Default: today if no picker end, or end of selected range

  const dailySummaries: { [key: string]: DailyLogSummary } = {};

  // Initialize summaries for all days in the determined display range for the table
  const daysToDisplayInTable = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

  daysToDisplayInTable.forEach(day => {
      const isoDateStr = format(day, "yyyy-MM-dd");
      dailySummaries[isoDateStr] = { // Initialize even if no data, to potentially show zero rows if needed (though we filter later)
          date: format(day, "MMM d, yyyy"),
          isoDate: isoDateStr,
          totalSteps: 0,
          totalDistance: 0,
          totalCalories: 0,
      };
  });

  // Filter logs to only those within the determined display range for the table
  const logsInTableDateRange = logs.filter(log => {
    const logDate = parseISO(log.timestamp);
    return isWithinInterval(logDate, { start: rangeStart, end: rangeEnd });
  });

  logsInTableDateRange.forEach(log => {
    const dayKey = format(parseISO(log.timestamp), "yyyy-MM-dd");
    // Ensure the dayKey exists (it should due to pre-initialization)
    if (dailySummaries[dayKey]) {
      dailySummaries[dayKey].totalSteps += log.steps || 0;
      dailySummaries[dayKey].totalDistance += log.distance || 0;
      dailySummaries[dayKey].totalCalories += log.caloriesBurned || 0;
    }
  });

  // Convert to array, filter out days with no activity at all, and sort
  return Object.values(dailySummaries)
    .filter(summary => summary.totalSteps > 0 || summary.totalDistance > 0 || summary.totalCalories > 0)
    .sort((a, b) => parseISO(b.isoDate).getTime() - parseISO(a.isoDate).getTime());
}


// --- MAIN EXERCISE COMPONENT ---
export function Exercise({ logs: initialLogsFromProps, patient }: ExerciseProps) {
  
  const logsToUse = [...(initialLogsFromProps ?? [])];

  const patientId = patient?.id
 
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 6),
    to: new Date(),
  });

  const sortedRawLogsForCharts = useMemo(() => {
    // Stat cards will do their own daily aggregation based on this raw sorted data
    return [...logsToUse].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [logsToUse]);

  // 4. Use aggregateLogsByDay for the table data
  const dailyLogTableData = useMemo(() => {
    return aggregateLogsByDay(logsToUse, dateRange);
  }, [logsToUse, dateRange]);




  return (
    <div className="space-y-6 p-4 md:p-6">
      <DateRangePicker
        className="w-full sm:w-auto"
        onChange={(values) => setDateRange(values)}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatDisplayCard
          title="Steps"
          logs={sortedRawLogsForCharts}
          metric="steps"
          unit="steps"
          color="text-sky-500"
          icon={Footprints}
          selectedRange={dateRange}
        />
        <StatDisplayCard
          title="Distance"
          logs={sortedRawLogsForCharts}
          metric="distance"
          unit="km"
          color="text-green-500"
          icon={Route}
          selectedRange={dateRange}
        />
        <StatDisplayCard
          title="Calories Burned"
          logs={sortedRawLogsForCharts}
          metric="caloriesBurned"
          unit="kcal"
          color="text-orange-500"
          icon={Flame}
          selectedRange={dateRange}
        />
      </div>

      {/* 4. UPDATED TABLE SECTION */}
      <Card>
        <CardHeader>
          <CardTitle>
            Daily Steps Log {/* Or "Daily Summary" */}
            {dateRange?.from && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({format(dateRange.from, "MMM d, yyyy")}
                    {dateRange.to && !isSameDay(dateRange.from, dateRange.to) ? ` - ${format(dateRange.to, "MMM d, yyyy")}` : ''})
                </span>
            )}
            </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Date</TableHead>
                <TableHead className="text-right">Total Steps</TableHead>
                <TableHead className="text-right">Distance (km)</TableHead>
                <TableHead className="text-right">Calories (kcal)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyLogTableData.length > 0 ? (
                dailyLogTableData.map((daySummary) => (
                  <TableRow key={daySummary.isoDate}>
                    <TableCell className="font-medium">{daySummary.date}</TableCell>
                    <TableCell className="text-right">{daySummary.totalSteps.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{daySummary.totalDistance.toFixed(1)}</TableCell>
                    <TableCell className="text-right">{daySummary.totalCalories.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center"> {/* Updated colSpan */}
                    No activity logged for the selected period.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

