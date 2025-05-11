export type Language = 'en' | 'ms' | 'zh' | 'ta';

export type PluralForm = {
  one?: string;
  other: string;
};

type TranslationKey = string | PluralForm;

export type Translations = {
  [key: string]: TranslationKey;
};

type PluralKey = 'one' | 'other';

// Add pluralization rules
export const pluralRules = {
  en: {
    one: 'one',
    other: 'other'
  },
  ms: {
    other: 'other' // Malay doesn't distinguish between singular and plural
  },
  zh: {
    other: 'other' // Chinese doesn't distinguish between singular and plural
  },
  ta: {
    other: 'other' // Tamil doesn't distinguish between singular and plural
  }
} as const;

export const translations: Record<Language, Translations> = {
  en: {
    // Common
    back: 'Back',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',

    // Navigation
    home: 'Home',
    progress: 'Progress',
    settings: 'Settings',
    ai: 'Talk to Stelggin',

    // Home Screen
    goodMorning: 'Good Morning',
    haveANiceDay: 'Have a nice day',
    todaySodium: 'Today\'s Sodium',
    todayFat: 'Today\'s Fat',
    todayCalories: 'Today\'s Calories',
    todaySugar: 'Today\'s Sugar',
    sodium: 'Sodium',
    fat: 'Fat',
    calories: 'Calories',
    sugar: 'Sugar',
    latestAISuggestion: 'Latest Doctor Suggestion',
    points: 'Points',
    level: 'Level',
    cameraPermission: 'Sorry, we need camera permissions to make this work!',
    galleryPermission: 'Sorry, we need gallery permissions to make this work!',
    aiSuggestionText: 'Based on your blood sugar pattern, try eating a protein-rich snack before exercising to avoid hypoglycemia.',
    logData: 'Log Data',
    logFood: 'Log Food',
    logExercise: 'Log Exercise',
    takePicture: 'Take Picture',
    uploadImage: 'Upload Image',
    detectedNutrients: 'Detected Nutrients',
    savingData: 'Saving data...',
    success: 'Success!',
    foodDataSaved: 'Food data has been saved',
    ok: 'OK',
    errorTitle: 'Error',
    cameraErrorMessage: 'Failed to open camera',
    imagePickerErrorMessage: 'Failed to open image picker',
    addFoodLog: 'Add Food Log',
    viewExerciseLog: 'View Exercise Log',
    foodLog: 'Food Log',
    viewFoodLog: 'View Food Log',
    today: 'Today',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    all: 'All',
    invalidLoginCred: 'Invalid email or password',
    loadingDietData: 'Loading diet data...',
    processingImage: 'Processing Image...',
    loading: 'Loading',
    activity: 'activity',
    diet: 'diet',
    trend: 'trends...',
    Diet: 'Diet',
    Activity: 'Activity',

    // Fitness Summary Screen
    exerciseSummary: 'Exercise Summary',
    distance: 'Distance',
    time: 'Time',
    todayActivities: 'Today\'s Activities',
    walking: 'Walking',
    from: 'from',

    // Settings Screen
    language: 'Language',
    notification: 'Notification',
    theme: 'Theme',
    about: 'About',
    profile: 'Profile',
    help: 'Help',

    // Profile Screen
    personalInfo: 'Personal Information',
    age: 'Age',
    gender: 'Gender',
    weight: 'Weight',
    height: 'Height',
    health: 'Health',
    healthCondition: 'Health Condition',
    targetDailyCalories: 'Target Daily Calories',
    maxDailySugar: 'Max Daily Sugar',
    minDailyProtein: 'Min Daily Protein',
    maxDailySodium: 'Max Daily Sodium',
    bloodSugar: 'Blood Sugar',
    bloodPressure: 'Blood Pressure',
    male: 'Male',
    female: 'Female',
    maxDailyFat: 'Max Daily Fat',

    // Progress Screen
    week: 'Week',
    month: 'Month',
    avgSugarIntake: 'Average Sugar Intake',
    avgSodiumIntake: 'Average Sodium Intake',
    avgCalorieIntake: 'Average Calorie Intake',
    avgFatIntake: 'Average Fat Intake',
    avgSteps: 'Average Steps',
    avgDistance: 'Average Distance',
    avgCaloriesBurned: 'Average Calories Burned',
    avgActiveMinutes: 'Average Active Minutes',

    stelgginAI: 'StelgginAI',
    chatHistory: 'Chat History',
    uploadFromPhone: 'Upload from Phone',
    typeMessage: 'Type a message...',
    remove: 'Remove',

    login: 'Log In',
    email: 'Email',
    emailPlaceholder: 'user@email.com',
    password: 'Password',
    forgotPassword: 'Forgot Password?',
    signUp: 'Sign Up',
    emailPasswordRequired: 'Email and password are required.',
    invalidEmail: 'Please enter a valid email address.',
    name: 'Name',
    confirmPassword: 'Confirm Password',
    allFieldsRequired: 'All fields are required.',
    passwordsDoNotMatch: 'Passwords do not match.',
    alreadyHaveAccount: 'Already have an account? Log In',

    dataUsageConsent: 'Data Usage Consent',
    dataConsentDescription: 'We collect your data to provide personalized features, including tracking and AI suggestions. By clicking \'Agree & Continue\', you confirm that you have read and agree to our Privacy Policy and Terms of Service.',
    privacyAgreement: 'I have read and agree to the Privacy Policy and Terms of Service',
    agreeAndContinue: 'Agree & Continue',

    appPermissions: 'App Permissions',
    camera: 'Camera',
    cameraPermissionDescription: 'Camera access is needed to log your food and track your meals.',
    notifications: 'Notifications',
    notificationsPermissionDescription: 'Notifications allow us to send you reminders and personalized suggestions.',
    continue: 'Continue',
    loadingProfile: 'Loading profile...',
    lastActivity: 'Last Activity',

    // Weekday abbreviations
    mon: 'M',
    tue: 'T',
    wed: 'W',
    thu: 'T',
    fri: 'F',
    sat: 'S',
    sun: 'S',

    timeFormat: '{{time}} AM - {{time2}} AM',

    aiGreeting: 'Hi! How can I help you today?',
    newChat: 'New Chat',
    aiResponse: 'Here is the AI response for: {{input}}',

    // Pluralization keys
    items: {
      one: '{{count}} item',
      other: '{{count}} items'
    },
    minutes: {
      one: '{{count}} minute',
      other: '{{count}} minutes'
    },
    steps: {
      one: 'step',
      other: 'steps'
    },
    calories: {
      one: 'Calorie',
      other: 'Calories'
    },
    kilometers: {
      one: '{{count}} kilometer',
      other: '{{count}} kilometers'
    },
    logout: 'Log Out',
  },
  ms: {
    // Common
    back: 'Kembali',
    save: 'Simpan',
    cancel: 'Batal',
    edit: 'Edit',
    delete: 'Padam',

    // Navigation
    home: 'Utama',
    progress: 'Kemajuan',
    settings: 'Tetapan',
    ai: 'Bercakap dengan Stelggin',

    // Home Screen
    goodMorning: 'Selamat Pagi',
    haveANiceDay: 'Semoga hari anda menyenangkan',
    todaySodium: 'Natrium Hari Ini',
    todayFat: 'Lemak Hari Ini',
    todayCalories: 'Kalori Hari Ini',
    todaySugar: 'Gula Hari Ini',
    sodium: 'Natrium',
    fat: 'Lemak',
    calories: 'Kalori',
    sugar: 'Gula',
    latestAISuggestion: 'Cadangan Doktor Terbaru',
    points: 'Mata',
    level: 'Tahap',
    cameraPermission: 'Maaf, kami memerlukan kebenaran kamera untuk menjalankan fungsi ini!',
    galleryPermission: 'Maaf, kami memerlukan kebenaran galeri untuk menjalankan fungsi ini!',
    aiSuggestionText: 'Berdasarkan pola gula darah anda, cuba makan makanan ringan yang kaya protein sebelum bersenam untuk mengelakkan hipoglisemia.',
    logData: 'Log Data',
    logFood: 'Log Makanan',
    logExercise: 'Log Senaman',
    takePicture: 'Ambil Gambar',
    uploadImage: 'Muat Naik Imej',
    detectedNutrients: 'Nutrien Dikesan',
    savingData: 'Menyimpan data...',
    success: 'Berjaya!',
    foodDataSaved: 'Data makanan telah disimpan',
    ok: 'OK',
    errorTitle: 'Ralat',
    cameraErrorMessage: 'Gagal membuka kamera',
    imagePickerErrorMessage: 'Gagal membuka pemilih gambar',
    addFoodLog: 'Tambah Log Makanan',
    viewExerciseLog: 'Lihat Log Senaman',
    foodLog: 'Log Makanan',
    viewFoodLog: 'Lihat Log Makanan',
    today: 'Hari Ini',
    thisWeek: 'Minggu Ini',
    thisMonth: 'Bulan Ini',
    all: 'Semua',
    invalidLoginCred: 'Salah emel atau kata laluan',
    loadingDietData: 'Memuatkan data diet...',
    processingImage: 'Memproses imej...',
    loadingProfile: 'Memuatkan profil...',
    loading: 'Memuatkan',
    activity: 'aktiviti',
    diet: 'diet',
    trend: 'trend...',
    Diet: 'Diet',
    Activity: 'Aktiviti',

    // Fitness Summary Screen
    exerciseSummary: 'Ringkasan Senaman',
    distance: 'Jarak',
    time: 'Masa',
    todayActivities: 'Aktiviti Hari Ini',
    walking: 'Berjalan',
    from: 'daripada',

    // Settings Screen
    language: 'Bahasa',
    notification: 'Notifikasi',
    theme: 'Tema',
    about: 'Tentang',
    profile: 'Profil',
    help: 'Bantuan',

    // Profile Screen
    personalInfo: 'Maklumat Peribadi',
    age: 'Umur',
    gender: 'Jantina',
    weight: 'Berat',
    height: 'Tinggi',
    health: 'Kesihatan',
    healthCondition: 'Keadaan Kesihatan',
    targetDailyCalories: 'Kalori Harian Sasaran',
    maxDailySugar: 'Gula Harian Maksimum',
    minDailyProtein: 'Protein Harian Minimum',
    maxDailySodium: 'Natrium Harian Maksimum',
    bloodSugar: 'Gula Darah',
    bloodPressure: 'Tekanan Darah',
    male: 'Lelaki',
    female: 'Perempuan',
    maxDailyFat: 'Lemak Harian Maksimum',

    // Progress Screen
    week: 'Minggu',
    month: 'Bulan',
    avgSugarIntake: 'Pengambilan Gula Purata',
    avgSodiumIntake: 'Pengambilan Natrium Purata',
    avgCalorieIntake: 'Pengambilan Kalori Purata',
    avgFatIntake: 'Pengambilan Lemak Purata',
    avgSteps: 'Purata Langkah',
    avgDistance: 'Jarak Purata',
    avgCaloriesBurned: 'Kalori Dibakar Purata',
    avgActiveMinutes: 'Minit Aktif Purata',

    stelgginAI: 'StelgginAI',
    chatHistory: 'Sejarah Chat',
    uploadFromPhone: 'Muat naik dari Telefon',
    typeMessage: 'Taip mesej...',
    remove: 'Padam',

    login: 'Log Masuk',
    email: 'Emel',
    emailPlaceholder: 'user@email.com',
    password: 'Kata Laluan',
    forgotPassword: 'Lupa Kata Laluan?',
    signUp: 'Daftar',
    emailPasswordRequired: 'Emel dan kata laluan diperlukan.',
    invalidEmail: 'Sila masukkan alamat emel yang sah.',
    name: 'Nama',
    confirmPassword: 'Sahkan Kata Laluan',
    allFieldsRequired: 'Semua ruangan diperlukan.',
    passwordsDoNotMatch: 'Kata laluan tidak sepadan.',
    alreadyHaveAccount: 'Sudah ada akaun? Log Masuk',

    dataUsageConsent: 'Kebenaran Penggunaan Data',
    dataConsentDescription: 'Kami mengumpul data anda untuk menyediakan ciri-ciri yang diperibadikan, termasuk penjejakan dan cadangan AI. Dengan mengklik \'Setuju & Teruskan\', anda mengesahkan bahawa anda telah membaca dan bersetuju dengan Dasar Privasi dan Terma Perkhidmatan kami.',
    privacyAgreement: 'Saya telah membaca dan bersetuju dengan Dasar Privasi dan Terma Perkhidmatan',
    agreeAndContinue: 'Setuju & Teruskan',

    appPermissions: 'Kebenaran Aplikasi',
    camera: 'Kamera',
    cameraPermissionDescription: 'Akses kamera diperlukan untuk log makanan anda dan menjejak hidangan anda.',
    notifications: 'Notifikasi',
    notificationsPermissionDescription: 'Notifikasi membolehkan kami menghantar peringatan dan cadangan yang diperibadikan.',
    continue: 'Teruskan',
    lastActivity: 'Aktiviti Terakhir',

    // Weekday abbreviations
    mon: 'I',
    tue: 'S',
    wed: 'R',
    thu: 'K',
    fri: 'J',
    sat: 'S',
    sun: 'A',

    timeFormat: '{{time}} PG - {{time2}} PG',

    aiGreeting: 'Hai! Ada apa yang boleh saya bantu hari ini?',
    newChat: 'Chat Baru',
    aiResponse: 'Ini balasan AI untuk: {{input}}',

    // Pluralization keys
    items: {
      other: '{{count}} item' // Malay doesn't distinguish between singular and plural
    },
    minutes: {
      other: '{{count}} minit'
    },
    steps: {
      other: 'langkah'
    },
    calories: {
      other: 'Kalori'
    },
    kilometers: {
      other: '{{count}} kilometer'
    },
    logout: 'Log Keluar',
  },
  zh: {
    // Common
    back: '返回',
    save: '保存',
    cancel: '取消',
    edit: '编辑',
    delete: '删除',

    // Navigation
    home: '首页',
    progress: '进度',
    settings: '设置',
    ai: 'AI',

    // Home Screen
    goodMorning: '早上好',
    haveANiceDay: '希望你今天过得愉快',
    todaySodium: '今天的钠',
    todayFat: '今天的脂肪',
    todayCalories: '今天的卡路里',
    todaySugar: '今天的糖',
    latestAISuggestion: '最新的AI建议',
    points: '点数',
    level: '等级',
    logout: '退出',

    // Fitness Summary Screen
    exerciseSummary: 'Exercise Summary',
    distance: 'Distance',
    time: 'Time',
    todayActivities: 'Today\'s Activities',
    walking: 'Walking',
    from: 'from',

    // Settings Screen
    language: 'Language',
    notification: 'Notification',
    theme: 'Theme',
    about: 'About',
    profile: 'Profile',
    help: 'Help',

    // Profile Screen
    personalInfo: 'Personal Information',
    age: 'Age',
    gender: 'Gender',
    weight: 'Weight',
    height: 'Height',
    health: 'Health',
    healthCondition: 'Health Condition',
    targetDailyCalories: 'Target Daily Calories',
    maxDailySugar: 'Max Daily Sugar',
    minDailyProtein: 'Min Daily Protein',
    maxDailySodium: 'Max Daily Sodium',
    bloodSugar: 'Blood Sugar',
    bloodPressure: 'Blood Pressure',
    male: 'Male',
    female: 'Female',
    maxDailyFat: 'Max Daily Fat',

    // Progress Screen
    week: 'Week',
    month: 'Month',
    avgSugarIntake: 'Average Sugar Intake',
    avgSodiumIntake: 'Average Sodium Intake',
    avgCalorieIntake: 'Average Calorie Intake',
    avgFatIntake: 'Average Fat Intake',
    avgSteps: 'Average Steps',
    avgDistance: 'Average Distance',
    avgCaloriesBurned: 'Average Calories Burned',
    avgActiveMinutes: 'Average Active Minutes',

    stelgginAI: 'StelgginAI',
    chatHistory: 'Chat History',
    uploadFromPhone: 'Upload from Phone',
    typeMessage: 'Type a message...',
    remove: 'Remove',

    login: 'Log In',
    email: 'Email',
    emailPlaceholder: 'user@email.com',
    password: 'Password',
    forgotPassword: 'Forgot Password?',
    signUp: 'Sign Up',
    emailPasswordRequired: 'Email and password are required.',
    invalidEmail: 'Please enter a valid email address.',
    name: 'Name',
    confirmPassword: 'Confirm Password',
    allFieldsRequired: 'All fields are required.',
    passwordsDoNotMatch: 'Passwords do not match.',
    alreadyHaveAccount: 'Already have an account? Log In',

    dataUsageConsent: 'Data Usage Consent',
    dataConsentDescription: 'We collect your data to provide personalized features, including tracking and AI suggestions. By clicking \'Agree & Continue\', you confirm that you have read and agree to our Privacy Policy and Terms of Service.',
    privacyAgreement: 'I have read and agree to the Privacy Policy and Terms of Service',
    agreeAndContinue: 'Agree & Continue',

    appPermissions: 'App Permissions',
    camera: 'Camera',
    cameraPermissionDescription: 'Camera access is needed to log your food and track your meals.',
    notifications: 'Notifications',
    notificationsPermissionDescription: 'Notifications allow us to send you reminders and personalized suggestions.',
    continue: 'Continue',

    // Weekday abbreviations
    mon: 'M',
    tue: 'T',
    wed: 'W',
    thu: 'T',
    fri: 'F',
    sat: 'S',
    sun: 'S',

    timeFormat: '{{time}} AM - {{time2}} AM',

    aiGreeting: 'Hi! How can I help you today?',
    newChat: 'New Chat',
    aiResponse: 'Here is the AI response for: {{input}}',

    // Pluralization keys
    items: {
      one: '{{count}} item',
      other: '{{count}} items'
    },
    minutes: {
      one: '{{count}} minute',
      other: '{{count}} minutes'
    },
    steps: {
      one: '{{count}} step',
      other: '{{count}} steps'
    },
    calories: {
      one: '{{count}} calorie',
      other: '{{count}} calories'
    },
    kilometers: {
      one: '{{count}} kilometer',
      other: '{{count}} kilometers'
    },
  },
  ta: {
    // Minimal Tamil translations
    logout: 'வெளியேறு',
  },
}; 