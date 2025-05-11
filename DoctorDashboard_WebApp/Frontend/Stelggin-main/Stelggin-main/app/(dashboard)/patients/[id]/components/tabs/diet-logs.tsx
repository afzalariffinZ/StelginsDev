"use client";

import { FoodLog } from "@/lib/types";
import { FoodLogCard } from "@/components/food-log-card";
import { DateRangePicker } from "@/components/date-range-picker";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface DietLogsProps {
  logs: FoodLog[];
}

export function DietLogs({ logs }: DietLogsProps) {
  const [mealTypeFilter, setMealTypeFilter] = useState<string>("all");
  console.log(logs);
  const filteredLogs = logs.filter((log) => {
    return mealTypeFilter === "all" || log.mealType === mealTypeFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <DateRangePicker />
        
        <div>
          <RadioGroup 
            defaultValue="all" 
            className="flex gap-4"
            onValueChange={setMealTypeFilter}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all">All</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="breakfast" id="breakfast" />
              <Label htmlFor="breakfast">Breakfast</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="lunch" id="lunch" />
              <Label htmlFor="lunch">Lunch</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dinner" id="dinner" />
              <Label htmlFor="dinner">Dinner</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="snack" id="snack" />
              <Label htmlFor="snack">Snack</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredLogs.map((log) => (
          <FoodLogCard key={log.id} log={log} />
        ))}
        {filteredLogs.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground">
            No food logs found for the selected filters.
          </div>
        )}
      </div>
    </div>
  );
}