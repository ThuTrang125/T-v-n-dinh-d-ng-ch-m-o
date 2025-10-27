export interface PetFormData {
  userName: string;
  userPhone: string;
  userAddress: string;
  petName: string;
  species: 'dog' | 'cat' | '';
  breed: string;
  age: string;
  gender: '' | 'male_neutered' | 'male_intact' | 'female_neutered' | 'female_intact';
  weight: string;
  mainIssues: string[];
  symptoms: string;
  symptomDuration: string;
  symptomFrequency: string;
  priorTreatment: string;
  energyLevel: '' | 'normal' | 'hyperactive' | 'lethargic';
  appetite: '' | 'normal' | 'decreased' | 'increased';
  vomiting: '' | 'no' | 'food' | 'yellow_liquid' | 'white_foam';
  stool: '' | 'normal' | 'constipation' | 'diarrhea';
  stoolDetails: string;
  drinking: '' | 'normal' | 'increased' | 'decreased';
  urination: '' | 'normal' | 'straining' | 'frequent' | 'discolored';
  breathing: '' | 'normal' | 'fast' | 'labored';
  coughingSneezing: 'no' | 'yes';
  currentDiet: string;
  supplements: string;
  environment: '' | 'indoor' | 'outdoor' | 'both';
  waterSource: '' | 'tap' | 'boiled' | 'bottled';
  contactWithPets: 'no' | 'yes';
  deworming: '' | 'monthly' | 'gt_6_months' | 'unknown';
  vaccination: '' | 'full' | 'partial' | 'unknown';
  allergies: string;
}

export interface UploadedImage {
  name: string;
  base64: string;
}

export interface ProductRecommendation {
  name: string;
  reason: string;
  quantity: number;
  price: number;
}

export interface AdviceResponse {
  visualAnalysis: string;
  nutritionHypothesis: string;
  nutritionAdvice: string;
  habitAdvice: string;
  warnings: string;
  connectionAdvice: string;
  productRecommendations: ProductRecommendation[];
}
