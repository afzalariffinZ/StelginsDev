import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatRelative } from "date-fns";
import { FoodLog } from "@/lib/types";
import Image from "next/image";

interface FoodLogCardProps {
  log: FoodLog;
}

export function FoodLogCard({ log }: FoodLogCardProps) {
  const   formattedDate = formatRelative(new Date(log.timestamp), new Date());
  const mealTypeCapitalized = log.mealType.charAt(0).toUpperCase() + log.mealType.slice(1);

  return (
    <Card className="overflow-hidden">
      <div className="relative h-32 w-full">
        <Image
          src={log.imageUrl}
          alt={`${mealTypeCapitalized} meal`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
        />
        <div className="absolute top-2 right-2 rounded-md bg-primary/85 px-2 py-1 text-xs font-medium text-white">
          {mealTypeCapitalized}
        </div>
      </div>
      <CardHeader className="p-3 pb-0">
        <div className="text-sm font-medium">{formattedDate}</div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 p-3 text-sm">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Calories</span>
          <span className="font-medium">{log.calories} kcal</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Sugar</span>
          <span className="font-medium">{log.sugar_intake}g</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Sodium</span>
          <span className="font-medium">{log.sodium_intake}g</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Fat</span>
          <span className="font-medium">{log.fat}g</span>
        </div>
        {log.notes && (
          <div className="col-span-2 mt-2">
            <span className="text-xs text-muted-foreground">Notes</span>
            <p className="text-sm">{log.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}