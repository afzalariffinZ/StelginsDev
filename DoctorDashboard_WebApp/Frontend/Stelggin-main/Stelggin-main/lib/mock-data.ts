import { Patient, FoodLog, BloodSugarReading, ExerciseLog, AISuggestion, DietPlan } from './types';

export const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'John Doe',
    dateOfBirth: '1975-05-12',
    status: 'urgent',
    lastActivity: '2025-05-01T10:30:00',
    primaryCondition: 'Type 2 Diabetes',
    keyMetric: '195 mg/dL',
    trend: 'up'
  },
  {
    id: '2',
    name: 'Jane Smith',
    dateOfBirth: '1982-08-23',
    status: 'warning',
    lastActivity: '2025-05-02T09:15:00',
    primaryCondition: 'Pre-diabetes',
    keyMetric: '112 mg/dL',
    trend: 'neutral'
  },
  {
    id: '3',
    name: 'Robert Johnson',
    dateOfBirth: '1968-11-04',
    status: 'stable',
    lastActivity: '2025-05-01T14:45:00',
    primaryCondition: 'Hypertension',
    keyMetric: '135/85',
    trend: 'down'
  },
  {
    id: '4',
    name: 'Emily Davis',
    dateOfBirth: '1990-03-17',
    status: 'stable',
    lastActivity: '2025-05-02T12:00:00',
    primaryCondition: 'Weight Management',
    keyMetric: '82.5 kg',
    trend: 'down'
  },
  {
    id: '5',
    name: 'Michael Wilson',
    dateOfBirth: '1958-07-30',
    status: 'warning',
    lastActivity: '2025-05-01T16:30:00',
    primaryCondition: 'Type 2 Diabetes',
    keyMetric: '160 mg/dL',
    trend: 'up'
  }
];

export const mockFoodLogs: FoodLog[] = [
  {
    id: '1',
    patientId: '1',
    timestamp: '2025-05-01T08:00:00',
    mealType: 'breakfast',
    imageUrl: 'https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg',
    calories: 450,
    carbs: 65,
    protein: 15,
    fat: 12,
    notes: 'Whole grain toast with avocado and eggs'
  },
  {
    id: '2',
    patientId: '1',
    timestamp: '2025-05-01T12:30:00',
    mealType: 'lunch',
    imageUrl: 'https://images.pexels.com/photos/1095550/pexels-photo-1095550.jpeg',
    calories: 560,
    carbs: 45,
    protein: 35,
    fat: 22,
    notes: 'Grilled chicken salad with olive oil dressing'
  },
  {
    id: '3',
    patientId: '1',
    timestamp: '2025-05-01T19:00:00',
    mealType: 'dinner',
    imageUrl: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg',
    calories: 620,
    carbs: 70,
    protein: 30,
    fat: 18,
    notes: 'Salmon with quinoa and roasted vegetables'
  },
  {
    id: '4',
    patientId: '1',
    timestamp: '2025-05-02T08:15:00',
    mealType: 'breakfast',
    imageUrl: 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg',
    calories: 380,
    carbs: 55,
    protein: 12,
    fat: 14,
    notes: 'Oatmeal with berries and nuts'
  },
  {
    id: '5',
    patientId: '1',
    timestamp: '2025-05-02T13:00:00',
    mealType: 'lunch',
    imageUrl: 'https://images.pexels.com/photos/1833333/pexels-photo-1833333.jpeg',
    calories: 520,
    carbs: 40,
    protein: 28,
    fat: 25,
    notes: 'Turkey wrap with avocado and mixed greens'
  }
];

export const mockBloodSugarReadings: BloodSugarReading[] = [
  {
    id: '1',
    patientId: '1',
    timestamp: '2025-05-01T07:30:00',
    value: 130,
    context: 'fasting'
  },
  {
    id: '2',
    patientId: '1',
    timestamp: '2025-05-01T12:00:00',
    value: 115,
    context: 'pre-meal'
  },
  {
    id: '3',
    patientId: '1',
    timestamp: '2025-05-01T14:00:00',
    value: 195,
    context: 'post-meal'
  },
  {
    id: '4',
    patientId: '1',
    timestamp: '2025-05-01T22:00:00',
    value: 145,
    context: 'bedtime'
  },
  {
    id: '5',
    patientId: '1',
    timestamp: '2025-05-02T07:15:00',
    value: 135,
    context: 'fasting'
  },
  {
    id: '6',
    patientId: '1',
    timestamp: '2025-05-02T12:30:00',
    value: 120,
    context: 'pre-meal'
  },
  {
    id: '7',
    patientId: '1',
    timestamp: '2025-05-02T14:30:00',
    value: 180,
    context: 'post-meal'
  }
];

export const mockExerciseLogs: ExerciseLog[] = [
  {
    id: '1',
    patientId: '1',
    timestamp: '2025-05-01T16:00:00',
    activityType: 'Walking',
    duration: 30,
    intensity: 'moderate'
  },
  {
    id: '2',
    patientId: '1',
    timestamp: '2025-05-02T07:00:00',
    activityType: 'Cycling',
    duration: 45,
    intensity: 'high'
  },
  {
    id: '3',
    patientId: '1',
    timestamp: '2025-05-03T17:30:00',
    activityType: 'Swimming',
    duration: 60,
    intensity: 'moderate'
  }
];

export const mockAISuggestions: AISuggestion[] = [
  {
    id: '1',
    patientId: '1',
    timestamp: '2025-05-01T08:30:00',
    suggestion: 'Try to include more fiber in your breakfast to help stabilize blood sugar levels throughout the morning.',
    category: 'diet'
  },
  {
    id: '2',
    patientId: '1',
    timestamp: '2025-05-01T12:45:00',
    suggestion: 'Consider a short 10-minute walk after lunch to help with digestion and blood sugar management.',
    category: 'exercise'
  },
  {
    id: '3',
    patientId: '1',
    timestamp: '2025-05-01T19:15:00',
    suggestion: 'Your dinner protein portion was good, but try to reduce the carbohydrate portion slightly next time.',
    category: 'diet'
  },
  {
    id: '4',
    patientId: '1',
    timestamp: '2025-05-02T08:30:00',
    suggestion: 'Great choice on breakfast. The mix of protein and healthy fats will help keep you full longer.',
    category: 'diet'
  }
];

export const mockDietPlan: DietPlan = {
  patientId: '1',
  targetCalories: 1800,
  maxFat: 180,
  maxSodium: 90,
  maxSugar: 2300,
  dietaryNotes: 'Focus on low-GI foods. Avoid processed sugars and refined carbohydrates. Include lean proteins with each meal and snack. Aim for at least 30g of fiber daily.'
};