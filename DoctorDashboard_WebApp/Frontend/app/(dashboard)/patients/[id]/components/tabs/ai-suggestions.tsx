"use client";

import { AISuggestion } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";

interface AISuggestionsProps {
  suggestions: AISuggestion[];
}

export function AISuggestions({ suggestions }: AISuggestionsProps) {
  // Sort suggestions by timestamp in descending order (newest first)
  const sortedSuggestions = [...suggestions].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const categoryIcons = {
    diet: "🍎",
    exercise: "🏃‍♂️",
    general: "💡",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Suggestions Delivered to Patient</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {categoryIcons[suggestion.category as keyof typeof categoryIcons]}
                    </span>
                    <span className="font-medium capitalize">
                      {suggestion.category} Suggestion
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {format(parseISO(suggestion.timestamp), "MMM d, yyyy h:mm a")}
                  </span>
                </div>
                <p className="text-sm">{suggestion.suggestion}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}