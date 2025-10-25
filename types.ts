export interface ProductRecommendation {
  name: string;
  reason: string;
  usp: string;
  usage: string;
}

export interface AdviceResponse {
  isEmergency: boolean;
  emergencyMessage: string | null;
  analysis: string | null;
  professionalAdvice: {
    nutrition: string;
    behavior: string;
  } | null;
  notes: {
    warnings: string;
    donts: string;
    disclaimer: string;
  } | null;
  productRecommendations: ProductRecommendation[] | null;
}

export interface PetFormData {
  // Section 1
  petType: 'Chó' | 'Mèo' | '';
  breed: string;
  age: string;
  gender: 'Đực (Chưa triệt sản)' | 'Đực (Đã triệt sản)' | 'Cái (Chưa triệt sản)' | 'Cái (Đã triệt sản)' | '';
  weight: string;
  // Section 2
  mainIssues: string[];
  symptoms: string;
  onset: string;
  frequency: string;
  priorTreatment: string;
  // Section 4
  energyLevel: 'Bình thường' | 'Tăng động' | 'Lừ đừ, mệt mỏi' | '';
  appetite: 'Bình thường' | 'Ăn ít, biếng ăn' | 'Ăn nhiều hơn' | '';
  vomiting: 'Không' | 'Có - Thức ăn' | 'Có - Dịch vàng' | 'Có - Bọt trắng' | '';
  stool: 'Bình thường' | 'Táo bón' | 'Tiêu chảy' | '';
  stoolDescription: string;
  urination: 'Bình thường' | 'Tiểu khó, rặn tiểu' | 'Tiểu nhiều lần' | 'Nước tiểu có màu lạ' | '';
  drinking: 'Bình thường' | 'Uống nhiều hơn' | 'Uống ít hơn' | '';
  breathing: 'Bình thường' | 'Thở nhanh, gấp' | 'Khó thở, thở hóp bụng' | '';
  coughing: 'Có' | 'Không' | '';
  // Section 5
  diet: string;
  supplements: string;
  environment: 'Trong nhà' | 'Ngoài trời' | 'Cả hai' | '';
  waterSource: 'Nước máy' | 'Nước đun sôi' | 'Nước bình' | '';
  contactWithPets: 'Có' | 'Không' | '';
  deworming: string;
  vaccination: 'Đã tiêm đủ' | 'Chưa tiêm' | 'Không nhớ' | '';
  allergies: string;
}

export interface UploadedImage {
    name: string;
    type: string;
    base64: string;
}
