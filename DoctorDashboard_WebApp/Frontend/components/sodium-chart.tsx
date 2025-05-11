"use client";

import { BloodSugarReading } from "@/lib/types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format, parseISO } from "date-fns";

interface GlucoseChartProps {
  data: BloodSugarReading[];
}

const formatDate = (timestamp: string): string => {
  try {
    return format(parseISO(timestamp), "MMM d, h:mm a");
  } catch (e) {
    console.error("Error parsing date:", timestamp);
    return "Invalid Date";
  }
};

const formatTimeOnly = (timestamp: string): string => {
  try {
    return format(parseISO(timestamp), "h:mm a");
  } catch (e) {
    console.error("Error parsing date:", timestamp);
    return "Invalid Time";
  }
};

export function SodiumChart({ data }: GlucoseChartProps) {
  const chartData = data
    .map((reading) => {
      try {
        // Validate the date parsing before including in chart data
        parseISO(reading.timestamp);
        return {
          timestamp: reading.timestamp,
          time: formatDate(reading.timestamp),
          value: reading.value,
          context: reading.context,
        };
      } catch (e) {
        console.error("Invalid reading timestamp:", reading);
        return null;
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tick={{ fontSize: 12 }}
            tickFormatter={formatTimeOnly}
          />
          <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value, name) => [`${value} mg`, "Sodium"]}
            labelFormatter={formatDate}
          />
          <ReferenceLine y={180} stroke="#f87171" strokeDasharray="3 3" />
          <ReferenceLine y={70} stroke="#f87171" strokeDasharray="3 3" />
          <defs>
            <linearGradient id="colorGlucose" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--chart-1))"
            fillOpacity={1}
            fill="url(#colorGlucose)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}