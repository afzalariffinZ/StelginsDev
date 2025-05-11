"use client";

import { useState } from "react";
import { DietPlan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface DietPlanSettingsProps {
  dietPlan: DietPlan;
  patientId: string;
}

export function DietPlanSettings({ dietPlan, patientId }: DietPlanSettingsProps) {
  const [formData, setFormData] = useState({
    targetCalories: dietPlan.targetCalories,
    maxFat: dietPlan.maxFat,
    maxSodium: dietPlan.maxSodium,
    maxSugar: dietPlan.maxSugar,
    dietaryNotes: dietPlan.dietaryNotes,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
  
    // If the input is empty, just set it as an empty string
    if (value === "") {
      setFormData({
        ...formData,
        [name]: "",
      });
    } else {
      // For numeric fields, convert to a number (parseInt is fine for whole numbers)
      setFormData({
        ...formData,
        [name]: name !== "dietaryNotes" ? parseInt(value, 10) : value,
      });
    }
  };
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const dietPlanData = {
      patientid: patientId,  // Replace with actual patient ID
      targetdailycalories: formData.targetCalories,
      max_fat: formData.maxFat,
      max_sodium: formData.maxSodium,
      max_sugar: formData.maxSugar,
      Notes: formData.dietaryNotes,
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/update_diet_plan", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dietPlanData),
      });

      if (response.ok) {
        toast.success("Diet plan updated successfully");
      } else {
        toast.error("Failed to update diet plan");
      }
    } catch (error) {
      toast.error("An error occurred while updating the diet plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Diet Plan Settings</CardTitle>
          <CardDescription>
            Set nutritional targets and dietary guidelines for this patient.
            These settings will influence the AI suggestions provided to the patient.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="targetCalories">Target Daily Calories</Label>
              <Input
                id="targetCalories"
                name="targetCalories"
                type="number"
                value={formData.targetCalories}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxFat">Max Daily Fat (g)</Label>
              <Input
                id="maxFat"
                name="maxFat"
                type="number"
                value={formData.maxFat}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minProtein">Max Daily Sodium (mg)</Label>
              <Input
                id="maxSodium"
                name="maxSodium"
                type="number"
                value={formData.maxSodium}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxSodium">Max Daily Sugar (g)</Label>
              <Input
                id="maxSugar"
                name="maxSugar"
                type="number"
                value={formData.maxSugar}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dietaryNotes">
              General Dietary Notes/Restrictions for AI
            </Label>
            <Textarea
              id="dietaryNotes"
              name="dietaryNotes"
              value={formData.dietaryNotes}
              onChange={handleInputChange}
              rows={5}
              placeholder="Enter any specific dietary guidelines, restrictions, or notes..."
            />
            <p className="text-xs text-muted-foreground">
              These notes will be used to guide the AI when making food and meal suggestions to the patient.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting} className="ml-auto">
            {isSubmitting ? "Saving..." : "Save Diet Plan"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
