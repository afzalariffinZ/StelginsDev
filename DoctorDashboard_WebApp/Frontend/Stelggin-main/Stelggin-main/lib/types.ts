export type PatientStatus = 'stable' | 'warning' | 'urgent';

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  status: PatientStatus;
  lastActivity: string;
  primaryCondition: string;
  keyMetric?: string;
  trend?: 'up' | 'down' | 'neutral';
  PatientName?: string;
  patient_status?: PatientStatus;
  PatientID?: string;
}

export interface FoodLog {
  id: string;
  patientId: string;
  timestamp: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  imageUrl: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  notes?: string;
  sodium_intake?: string;
  sugar_intake?: string;
}

export interface BloodSugarReading {
  id: string;
  patientId: string;
  timestamp: string;
  value: number;
  context: 'fasting' | 'pre-meal' | 'post-meal' | 'bedtime';
}

export interface ExerciseLog {
  id: string;
  patientId: string;
  timestamp: string;
  activityType: string;
  duration: number; // in minutes
  intensity: 'low' | 'moderate' | 'high';
}

export interface AISuggestion {
  id: string;
  patientId: string;
  timestamp: string;
  suggestion: string;
  category: 'diet' | 'exercise' | 'general';
}

export interface DietPlan {
  patientId: string;
  targetCalories: number;
  maxFat: number;
  maxSodium: number;
  maxSugar: number;
  dietaryNotes: string;
}