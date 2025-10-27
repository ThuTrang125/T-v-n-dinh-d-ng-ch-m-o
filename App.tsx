import React, { useState, useCallback } from 'react';
import { AdviceCard } from './components/AdviceCard';
import { getPetAdvice } from './services/geminiService';
import { AdviceResponse, PetFormData, UploadedImage } from './types';

// === GOOGLE APPS SCRIPT WEB APP URL (đuôi /exec) ===
const GOOGLE_APPS_SCRIPT_URL: string =
  'https://script.google.com/macros/s/AKfycbyGRBP5dtKVd1HJJUqEO38DQhh9Tr1dFPQIMoFrn9xMWWlxr8CYRSzhe7YqinkF57Tm/exec';

// Kiểm tra đúng định dạng Web App URL
const isValidGASUrl =
  /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(GOOGLE_APPS_SCRIPT_URL);

const initialFormData: PetFormData = {
  userName: '', userPhone: '', userAddress: '', petName: '', species: '',
  breed: '', age: '', gender: '', weight: '', mainIssues: [], symptoms: '',
  symptomDuration: '', symptomFrequency: '', priorTreatment: '', energyLevel: '',
  appetite: '', vomiting: '', stool: '', stoolDetails: '', drinking: '',
  urination: '', breathing: '', coughingSneezing: 'no', currentDiet: '',
  supplements: '', environment: '', waterSource: '', contactWithPets: 'no',
  deworming: '', vaccination: '', allergies: '',
};

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });

function App() {
  const [formData, setFormData] = useState<PetFormData>(initialFormData);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [advice, setAdvice] = useState<AdviceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchaseStatus, setPurchaseStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const saveDataToSheet = useCallback(
    (type: 'Tư vấn' | 'Mua hàng', currentAdvice: AdviceResponse) => {
      if (!isValidGASUrl) {
        console.error('Google Apps Script URL is invalid.');
        setError('Lỗi cấu hình: URL Google Apps Script chưa đúng.');
        if (type === 'Mua hàng') setPurchaseStatus('error');
        return;
      }

      // Tạo form ẩn và submit về GAS (tránh CORS, không reload trang)
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = GOOGLE_APPS_SCRIPT_URL;
      form.target = 'hidden-iframe';

      const petInfoString = `
- Tên thú cưng: ${formData.petName}
- Loài: ${formData.species || 'Không rõ'}, Giống: ${formData.breed || 'Không rõ'}, Tuổi: ${formData.age || 'Không rõ'}, Giới tính: ${formData.gender || 'Không rõ'}, Cân nặng: ${formData.weight ? `${formData.weight} kg` : 'Không rõ'}
- Vấn đề chính: ${formData.mainIssues.join(', ') || 'Không cung cấp'}
- Triệu chứng chi tiết: ${formData.symptoms}
- Chế độ ăn hiện tại: ${formData.currentDiet || 'Không cung cấp'}
`.trim();

      const data: { [key: string]: string } = {
        type: type,
        userName: formData.userName,
        userPhone: formData.userPhone,
        userAddress: formData.userAddress,
        petInfo: petInfoString,
        aiAnalysis: currentAdvice.visualAnalysis,
        aiNutrition: currentAdvice.nutritionAdvice,
        aiBehavior: currentAdvice.habitAdvice,
        aiConnection: currentAdvice.connectionAdvice,
        aiProducts: currentAdvice.productRecommendations
          .map((p) => `${p.name} (SL: ${p.quantity} - ${p.price}đ)`)
          .join('; '),
        totalCost: currentAdvice.productRecommendations
          .reduce((sum, item) => sum + item.price * item.quantity, 0)
          .toString(),
      };

      for (const key in data) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = data[key];
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

      console.log(`Data submission initiated for type: ${type}`);
      if (type === 'Mua hàng') setPurchaseStatus('success');
    },
    [formData]
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      const newIssues = checked
        ? [...prev.mainIssues, value]
        : prev.mainIssues.filter((issue) => issue !== value);
      return { ...prev, mainIssues: newIssues };
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setIsLoading(true);
      try {
        const uploadedImages = await Promise.all(
          files.map(async (file: File) => {
            const base64 = await toBase64(file);
            return { name: file.name, base64 };
          })
        );
        setImages((prev) => [...prev, ...uploadedImages].slice(0, 5)); // tối đa 5 ảnh
      } catch (err) {
        console.error('Error converting images to base64', err);
        setError('Lỗi khi tải ảnh lên. Vui lòng thử lại.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidGASUrl) {
      setError('Lỗi cấu hình: URL Google Apps Script chưa đúng.');
      return;
    }
    if (!formData.petName || !formData.symptoms || !formData.userName || !formData.userPhone) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc (*).');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAdvice(null);
    setPurchaseStatus('idle');

    const userInput = `Dưới đây là thông tin chi tiết về thú cưng cần tư vấn: ${JSON.stringify(
      formData
    )}`;

    try {
      const result = await getPetAdvice(userInput, images);
      setAdvice(result);
      // Tự động lưu "Tư vấn" vào sheet
      saveDataToSheet('Tư vấn', result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setImages([]);
    setAdvice(null);
    setError(null);
    setIsLoading(false);
    setPurchaseStatus('idle');
  };

  const handlePurchase = () => {
    if (advice) saveDataToSheet('Mua hàng', advice);
  };

  return (
    <main className="bg-background min-h-screen p-4 md:p-8 font-sans">
      {/* Iframe ẩn để nhận kết quả submit form */}
      <iframe name="hidden-iframe" style={{ display: 'none' }}></iframe>

      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-primary">Trợ lý Thú y AI Ecopets</h1>
          <p className="text-lg text-text-secondary mt-2">
            Nhận tư vấn sức khỏe & dinh dưỡng chuyên sâu cho thú cưng của bạn.
          </p>
        </header>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6"
            role="alert"
          >
            <strong className="font-bold">Lỗi! </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {purchaseStatus === 'success' && (
          <div
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6"
            role="alert"
          >
            <strong className="font-bold">Thành công! </strong>
            <span className="block sm:inline">
              Yêu cầu đặt hàng của bạn đã được gửi đi. Đội ngũ Ecopets sẽ liên hệ với bạn sớm nhất.
            </span>
          </div>
        )}

        {isLoading && !advice && (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto"></div>
            <p className="mt-4 text-green-700 font-semibold text-lg">
              AI đang phân tích... Quá trình này có thể mất một lát.
            </p>
          </div>
        )}

        {!isLoading && !advice && (
          <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
            {/* 1. Thông tin Chủ nuôi */}
            <div className="bg-surface p-6 md:p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-primary-dark mb-4 border-b pb-2">
                1. Thông tin Chủ nuôi
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                (Viết đúng để được tư vấn cách thức giao tiếp với bé cưng của bạn)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  name="userName"
                  value={formData.userName}
                  onChange={handleInputChange}
                  placeholder="Tên của bạn *"
                  required
                  className="p-3 border rounded-md focus:ring-2 focus:ring-green-600 focus:border-green-600"
                />
                <input
                  name="userPhone"
                  value={formData.userPhone}
                  onChange={handleInputChange}
                  placeholder="Số điện thoại *"
                  required
                  className="p-3 border rounded-md focus:ring-2 focus:ring-green-600 focus:border-green-600"
                />
                <input
                  name="userAddress"
                  value={formData.userAddress}
                  onChange={handleInputChange}
                  placeholder="Địa chỉ"
                  className="p-3 border rounded-md md:col-span-2 focus:ring-2 focus:ring-green-600 focus:border-green-600"
                />
              </div>
            </div>

            {/* 2. Thông tin Thú cưng */}
            <div className="bg-surface p-6 md:p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-primary-dark mb-4 border-b pb-2">
                2. Thông tin Thú cưng
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  name="petName"
                  value={formData.petName}
                  onChange={handleInputChange}
                  placeholder="Tên thường gọi của bé *"
                  required
                  className="p-3 border rounded-md focus:ring-2 focus:ring-green-600 focus:border-green-600"
                />
                <select
                  name="species"
                  value={formData.species}
                  onChange={handleInputChange}
                  className="p-3 border rounded-md bg-white focus:ring-2 focus:ring-green-600 focus:border-green-600"
                  required
                >
                  <option value="">Chọn loài *</option>
                  <option value="dog">Chó</option>
                  <option value="cat">Mèo</option>
                </select>
                <input
                  name="breed"
                  value={formData.breed}
                  onChange={handleInputChange}
                  placeholder="Giống loài (vd: Poodle, Mèo ta)"
                  className="p-3 border rounded-md focus:ring-2 focus:ring-green-600 focus:border-green-600"
                />
                <input
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="Tuổi (vd: 2 tuổi, 5 tháng)"
                  className="p-3 border rounded-md focus:ring-2 focus:ring-green-600 focus:border-green-600"
                />
                <input
                  name="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder="Cân nặng (kg)"
                  className="p-3 border rounded-md focus:ring-2 focus:ring-green-600 focus:border-green-600"
                />
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="p-3 border rounded-md bg-white focus:ring-2 focus:ring-green-600 focus:border-green-600"
                >
                  <option value="">Giới tính & Triệt sản</option>
                  <option value="male_neutered">Đực (Đã triệt sản)</option>
                  <option value="male_intact">Đực (Chưa triệt sản)</option>
                  <option value="female_neutered">Cái (Đã triệt sản)</option>
                  <option value="female_intact">Cái (Chưa triệt sản)</option>
                </select>
              </div>
            </div>

            {/* 3. Tình trạng Sức khỏe — ĐÃ CHỈNH THEO YÊU CẦU */}
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-md border border-emerald-200">
              <h3 className="text-xl font-bold text-emerald-600 mb-4 border-b border-emerald-100 pb-2">
                3. Tình trạng Sức khỏe
              </h3>

              <label className="block text-gray-700 font-medium mb-2">Vấn đề chính:</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 mb-4">
                {[
                  { v: 'da_long', l: 'Da/lông' },
                  { v: 'tieu_hoa', l: 'Tiêu hóa' },
                  { v: 'ho_hap', l: 'Hô hấp' },
                  { v: 'xuong_khop', l: 'Xương khớp' },
                  { v: 'tiet_nieu', l: 'Tiết niệu' },
                  { v: 'rang_mieng', l: 'Răng miệng' },
                  { v: 'mat_tai', l: 'Mắt/tai' },
                  { v: 'khac', l: 'Khác' },
                ].map((item) => (
                  <label key={item.v} className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="mainIssues"
                      value={item.v}
                      checked={formData.mainIssues.includes(item.v)}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{item.l}</span>
                  </label>
                ))}
              </div>

              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={handleInputChange}
                placeholder="Mô tả chi tiết triệu chứng của bé *"
                required
                className="w-full h-28 p-3 border rounded-md shadow-sm border-emerald-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                <select
                  name="energyLevel"
                  value={formData.energyLevel}
                  onChange={handleInputChange}
                  className="p-2 border rounded-md border-emerald-200 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Năng lượng</option>
                  <option value="binh_thuong">Bình thường</option>
                  <option value="giam">Giảm</option>
                  <option value="tang">Tăng</option>
                </select>

                <select
                  name="appetite"
                  value={formData.appetite}
                  onChange={handleInputChange}
                  className="p-2 border rounded-md border-emerald-200 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Ăn uống</option>
                  <option value="binh_thuong">Bình thường</option>
                  <option value="an_it">Ăn ít</option>
                  <option value="bo_an">Bỏ ăn</option>
                  <option value="an_nhieu">Ăn nhiều</option>
                </select>

                <select
                  name="vomiting"
                  value={formData.vomiting}
                  onChange={handleInputChange}
                  className="p-2 border rounded-md border-emerald-200 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Nôn mửa</option>
                  <option value="khong">Không</option>
                  <option value="doi_luc">Đôi lúc</option>
                  <option value="thuong_xuyen">Thường xuyên</option>
                </select>
              </div>
            </div>

            {/* 4. Hình ảnh Thực tế */}
            <div className="bg-surface p-6 md:p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-primary-dark mb-4 border-b pb-2">
                4. Hình ảnh Thực tế
              </h3>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Tải lên hình ảnh tổng thể, cận cảnh vùng bệnh lý (tối đa 5 ảnh).
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-800 hover:file:bg-green-200 transition-colors"
              />
              <div className="mt-4 flex flex-wrap gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={`data:image/jpeg;base64,${image.base64}`}
                      alt={image.name}
                      className="h-28 w-28 object-cover rounded-lg shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-7 w-7 flex items-center justify-center text-sm shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Nút submit màu xanh lá */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 bg-green-600 text-white p-4 rounded-lg font-semibold text-lg shadow hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 transition-transform transform hover:scale-[1.02] duration-300 disabled:bg-green-300 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? 'Đang phân tích...' : 'Gửi thông tin & Nhận tư vấn'}
            </button>
          </form>
        )}

        {advice && (
          <div className="space-y-6">
            <AdviceCard advice={advice} onPurchase={handlePurchase} />
            {/* Nút reset viền xanh lá */}
            <button
              onClick={handleReset}
              className="w-full bg-white text-green-700 p-3 rounded-lg font-semibold border border-green-300 shadow-sm hover:bg-green-50 focus:outline-none focus:ring-4 focus:ring-green-200 transition-colors"
            >
              Bắt đầu một tư vấn mới
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default App;
