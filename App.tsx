import React, { useState, useCallback, useMemo, ChangeEvent } from 'react';
import { getPetAdvice } from './services/geminiService';
import type { AdviceResponse, PetFormData, UploadedImage } from './types';
import AdviceCard from './components/AdviceCard';

const PawIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h.5a1.5 1.5 0 010 3H14a1 1 0 00-1 1v.5a1.5 1.5 0 01-3 0V9a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H9a1 1 0 001-1v-.5z" />
        <path d="M10 12a4 4 0 100-8 4 4 0 000 8zM3 10a3 3 0 116 0 3 3 0 01-6 0zM11 3a3 3 0 116 0 3 3 0 01-6 0zM11.5 11.5a3 3 0 106 0 3 3 0 00-6 0zM4 17a3 3 0 106 0 3 3 0 00-6 0z" />
    </svg>
);


const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        <p className="mt-4 text-lg text-text-secondary">Trợ lý AI đang phân tích... Vui lòng chờ trong giây lát.</p>
    </div>
);

const initialFormData: PetFormData = {
    petType: '', breed: '', age: '', gender: '', weight: '',
    mainIssues: [], symptoms: '', onset: '', frequency: '', priorTreatment: '',
    energyLevel: '', appetite: '', vomiting: '', stool: '', stoolDescription: '',
    urination: '', drinking: '', breathing: '', coughing: '',
    diet: '', supplements: '', environment: '', waterSource: '',
    contactWithPets: '', deworming: '', vaccination: '', allergies: '',
};

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); // remove the "data:mime/type;base64," prefix
        };
        reader.onerror = error => reject(error);
    });
};

const formatDataForAI = (data: PetFormData): string => {
    let report = "### Hạng mục 1: Thông tin Cơ bản ###\n";
    if (data.petType) report += `- Đối tượng: ${data.petType}\n`;
    if (data.breed) report += `- Giống loài: ${data.breed}\n`;
    if (data.age) report += `- Tuổi: ${data.age}\n`;
    if (data.gender) report += `- Giới tính & Triệt sản: ${data.gender}\n`;
    if (data.weight) report += `- Cân nặng (kg): ${data.weight}\n\n`;

    report += "### Hạng mục 2: Lý do Chính & Diễn biến ###\n";
    if (data.mainIssues.length) report += `- Vấn đề chính: ${data.mainIssues.join(', ')}\n`;
    if (data.symptoms) report += `- Mô tả chi tiết triệu chứng: ${data.symptoms}\n`;
    if (data.onset) report += `- Thời gian bắt đầu: ${data.onset}\n`;
    if (data.frequency) report += `- Tần suất xảy ra: ${data.frequency}\n`;
    if (data.priorTreatment) report += `- Đã điều trị: ${data.priorTreatment}\n\n`;

    report += "### Hạng mục 4: Đánh giá Hệ thống ###\n";
    if (data.energyLevel) report += `- Mức độ năng lượng: ${data.energyLevel}\n`;
    if (data.appetite) report += `- Ăn uống: ${data.appetite}\n`;
    if (data.vomiting) report += `- Nôn: ${data.vomiting}\n`;
    if (data.stool) report += `- Phân: ${data.stool}${data.stool === 'Tiêu chảy' && data.stoolDescription ? ` (${data.stoolDescription})` : ''}\n`;
    if (data.urination) report += `- Đi tiểu: ${data.urination}\n`;
    if (data.drinking) report += `- Uống nước: ${data.drinking}\n`;
    if (data.breathing) report += `- Hơi thở: ${data.breathing}\n`;
    if (data.coughing) report += `- Ho/Hắt xì: ${data.coughing}\n\n`;

    report += "### Hạng mục 5: Môi trường & Dinh dưỡng ###\n";
    if (data.diet) report += `- Chế độ ăn hiện tại: ${data.diet}\n`;
    if (data.supplements) report += `- Sản phẩm bổ sung đang dùng: ${data.supplements}\n`;
    if (data.environment) report += `- Môi trường sống: ${data.environment}\n`;
    if (data.waterSource) report += `- Nguồn nước uống: ${data.waterSource}\n`;
    if (data.contactWithPets) report += `- Tiếp xúc với thú cưng khác: ${data.contactWithPets}\n`;
    if (data.deworming) report += `- Lịch tẩy giun gần nhất: ${data.deworming}\n`;
    if (data.vaccination) report += `- Lịch tiêm phòng: ${data.vaccination}\n`;
    if (data.allergies) report += `- Tiền sử dị ứng: ${data.allergies}\n`;

    return report;
};


// Form components are defined outside the App component to prevent re-creation on every render.
const Input = (props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; }) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-gray-700">{props.label}</label>
        <input {...props} id={props.name} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
    </div>
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; name: string; children: React.ReactNode; }) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-gray-700">{props.label}</label>
        <select {...props} id={props.name} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
            {props.children}
        </select>
    </div>
);

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; name: string; }) => (
     <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-gray-700">{props.label}</label>
        <textarea {...props} id={props.name} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
    </div>
);

const App: React.FC = () => {
    const [formData, setFormData] = useState<PetFormData>(initialFormData);
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [advice, setAdvice] = useState<AdviceResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleCheckboxChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setFormData(prev => {
            const newIssues = checked ? [...prev.mainIssues, value] : prev.mainIssues.filter(issue => issue !== value);
            return { ...prev, mainIssues: newIssues };
        });
    }, []);

    const handleImageChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setIsLoading(true);
            try {
                const files = Array.from(e.target.files);
                const imagePromises = files.map(async (file: File) => {
                    const base64 = await fileToBase64(file);
                    return { name: file.name, type: file.type, base64 };
                });
                const newImages = await Promise.all(imagePromises);
                setImages(prev => [...prev, ...newImages]);
            } catch (err) {
                setError("Could not process image file.");
            } finally {
                setIsLoading(false);
            }
        }
    }, []);

    const removeImage = useCallback((index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setAdvice(null);
        setError(null);

        try {
            const formattedInput = formatDataForAI(formData);
            const result = await getPetAdvice(formattedInput, images);
            setAdvice(result);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [formData, images]);
    
    const isFormValid = useMemo(() => {
        return formData.petType && formData.mainIssues.length > 0 && formData.symptoms.trim() !== '';
    }, [formData]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6 lg:p-8">
            <main className="w-full max-w-3xl bg-surface rounded-2xl shadow-xl p-6 sm:p-8">
                <header className="text-center mb-6">
                    <div className="flex justify-center items-center gap-4">
                        <PawIcon />
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-primary-dark">Trợ lý Thú y AI Ecopets</h1>
                            <p className="text-text-secondary mt-1">Cung cấp thông tin chi tiết để nhận tư vấn chuyên sâu.</p>
                        </div>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Sections */}
                    <details className="p-4 border rounded-lg bg-gray-50" open>
                        <summary className="font-bold text-lg cursor-pointer text-primary-dark">Hạng mục 1: Thông tin Cơ bản</summary>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <Select label="Đối tượng" name="petType" value={formData.petType} onChange={handleInputChange} required><option value="">Chọn...</option><option>Chó</option><option>Mèo</option></Select>
                            <Input label="Giống loài" name="breed" type="text" placeholder="Poodle, Mèo ta..." value={formData.breed} onChange={handleInputChange} />
                            <Input label="Tuổi" name="age" type="text" placeholder="2 tuổi / 5 tháng" value={formData.age} onChange={handleInputChange} />
                            <Select label="Giới tính & Triệt sản" name="gender" value={formData.gender} onChange={handleInputChange}><option value="">Chọn...</option><option>Đực (Chưa triệt sản)</option><option>Đực (Đã triệt sản)</option><option>Cái (Chưa triệt sản)</option><option>Cái (Đã triệt sản)</option></Select>
                            <Input label="Cân nặng (kg)" name="weight" type="number" placeholder="5.5" value={formData.weight} onChange={handleInputChange} />
                        </div>
                    </details>
                     <details className="p-4 border rounded-lg bg-gray-50" open>
                        <summary className="font-bold text-lg cursor-pointer text-primary-dark">Hạng mục 2: Lý do Chính & Diễn biến</summary>
                         <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Vấn đề chính (chọn 1 hoặc nhiều)</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                                    {['Da & Lông', 'Tiêu hóa', 'Hô hấp', 'Tai / Mắt / Miệng', 'Vận động', 'Hành vi', 'Khác', 'Tư vấn định kỳ'].map(issue => (
                                        <label key={issue} className="flex items-center space-x-2 p-2 bg-white rounded-md border has-[:checked]:bg-primary-light has-[:checked]:border-primary"><input type="checkbox" value={issue} onChange={handleCheckboxChange} checked={formData.mainIssues.includes(issue)} /><span>{issue}</span></label>
                                    ))}
                                </div>
                            </div>
                            <Textarea label="Mô tả chi tiết triệu chứng" name="symptoms" rows={4} placeholder="Ví dụ: 'Bé bị tiêu chảy 2 ngày, phân lỏng màu vàng, không nôn, nhưng mệt mỏi và bỏ ăn sáng nay.'" required value={formData.symptoms} onChange={handleInputChange}/>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Vấn đề bắt đầu từ khi nào?" name="onset" type="text" placeholder="3 ngày trước" value={formData.onset} onChange={handleInputChange}/>
                                <Input label="Tần suất xảy ra?" name="frequency" type="text" placeholder="Liên tục, 1 lần/ngày..." value={formData.frequency} onChange={handleInputChange}/>
                            </div>
                             <Input label="Đã điều trị gì chưa?" name="priorTreatment" type="text" placeholder="Nếu có, là thuốc gì, kết quả ra sao?" value={formData.priorTreatment} onChange={handleInputChange}/>
                         </div>
                    </details>
                    <details className="p-4 border rounded-lg bg-gray-50">
                        <summary className="font-bold text-lg cursor-pointer text-primary-dark">Hạng mục 3: Đánh giá Ngoại quan (Hình ảnh/Video)</summary>
                         <div className="mt-4 space-y-4">
                             <div>
                                 <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700">Tải lên hình ảnh/video tổng thể, cận cảnh khu vực bệnh lý (nếu có)</label>
                                 <input id="image-upload" type="file" multiple accept="image/*,video/*" onChange={handleImageChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-primary-dark hover:file:bg-primary-light/80"/>
                             </div>
                             {images.length > 0 && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                     {images.map((image, index) => (
                                         <div key={index} className="relative group">
                                             <img src={`data:${image.type};base64,${image.base64}`} alt={image.name} className="w-full h-24 object-cover rounded-md" />
                                             <button onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                                         </div>
                                     ))}
                                </div>
                             )}
                         </div>
                    </details>
                    <details className="p-4 border rounded-lg bg-gray-50">
                        <summary className="font-bold text-lg cursor-pointer text-primary-dark">Hạng mục 4: Đánh giá Hệ thống</summary>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <Select label="Mức độ năng lượng" name="energyLevel" value={formData.energyLevel} onChange={handleInputChange}><option value="">Chọn...</option><option>Bình thường</option><option>Tăng động</option><option>Lừ đừ, mệt mỏi</option></Select>
                            <Select label="Ăn uống" name="appetite" value={formData.appetite} onChange={handleInputChange}><option value="">Chọn...</option><option>Bình thường</option><option>Ăn ít, biếng ăn</option><option>Ăn nhiều hơn</option></Select>
                            <Select label="Nôn" name="vomiting" value={formData.vomiting} onChange={handleInputChange}><option value="">Chọn...</option><option>Không</option><option>Có - Thức ăn</option><option>Có - Dịch vàng</option><option>Có - Bọt trắng</option></Select>
                             <Select label="Phân" name="stool" value={formData.stool} onChange={handleInputChange}><option value="">Chọn...</option><option>Bình thường</option><option>Táo bón</option><option>Tiêu chảy</option></Select>
                             {formData.stool === 'Tiêu chảy' && <Input label="Mô tả phân tiêu chảy" name="stoolDescription" type="text" placeholder="Có nhầy, có máu, màu gì?" value={formData.stoolDescription} onChange={handleInputChange}/>}
                             {/* FIX: Removed duplicate name attribute */}
                             <Select label="Đi tiểu" name="urination" value={formData.urination} onChange={handleInputChange}><option value="">Chọn...</option><option>Bình thường</option><option>Tiểu khó, rặn tiểu</option><option>Tiểu nhiều lần</option><option>Nước tiểu có màu lạ</option></Select>
                             <Select label="Uống nước" name="drinking" value={formData.drinking} onChange={handleInputChange}><option value="">Chọn...</option><option>Bình thường</option><option>Uống nhiều hơn</option><option>Uống ít hơn</option></Select>
                             <Select label="Hơi thở" name="breathing" value={formData.breathing} onChange={handleInputChange}><option value="">Chọn...</option><option>Bình thường</option><option>Thở nhanh, gấp</option><option>Khó thở, thở hóp bụng</option></Select>
                             <Select label="Ho/Hắt xì" name="coughing" value={formData.coughing} onChange={handleInputChange}><option value="">Chọn...</option><option>Có</option><option>Không</option></Select>
                         </div>
                    </details>
                    <details className="p-4 border rounded-lg bg-gray-50">
                        <summary className="font-bold text-lg cursor-pointer text-primary-dark">Hạng mục 5: Môi trường & Dinh dưỡng</summary>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <Textarea label="Chế độ ăn hiện tại" name="diet" rows={3} placeholder="Ghi rõ nhãn hiệu hạt/pate, hoặc thành phần tự nấu." value={formData.diet} onChange={handleInputChange}/>
                            <Textarea label="Các sản phẩm bổ sung đang dùng" name="supplements" rows={3} placeholder="Men vi sinh, dầu cá, canxi..." value={formData.supplements} onChange={handleInputChange}/>
                            <Select label="Môi trường sống" name="environment" value={formData.environment} onChange={handleInputChange}><option value="">Chọn...</option><option>Trong nhà</option><option>Ngoài trời</option><option>Cả hai</option></Select>
                            <Select label="Nguồn nước uống" name="waterSource" value={formData.waterSource} onChange={handleInputChange}><option value="">Chọn...</option><option>Nước máy</option><option>Nước đun sôi</option><option>Nước bình</option></Select>
                            <Select label="Tiếp xúc thú cưng khác" name="contactWithPets" value={formData.contactWithPets} onChange={handleInputChange}><option value="">Chọn...</option><option>Có</option><option>Không</option></Select>
                            <Input label="Lịch tẩy giun gần nhất" name="deworming" type="text" placeholder="1 tháng trước, >6 tháng..." value={formData.deworming} onChange={handleInputChange}/>
                            <Select label="Lịch tiêm phòng vaccine" name="vaccination" value={formData.vaccination} onChange={handleInputChange}><option value="">Chọn...</option><option>Đã tiêm đủ</option><option>Chưa tiêm</option><option>Không nhớ</option></Select>
                             <Input label="Tiền sử dị ứng" name="allergies" type="text" placeholder="Thức ăn, thuốc..." value={formData.allergies} onChange={handleInputChange}/>
                         </div>
                    </details>

                    <button
                        type="submit"
                        disabled={isLoading || !isFormValid}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? 'Đang phân tích...' : 'Nhận Tư Vấn'}
                    </button>
                </form>

                <div className="mt-8">
                    {isLoading && <LoadingSpinner />}
                    {error && <div className="text-center p-4 bg-red-100 text-red-700 rounded-md">{error}</div>}
                    {advice && <AdviceCard advice={advice} />}
                </div>
            </main>

            <footer className="text-center mt-8 text-gray-500 text-sm">
                <p>&copy; {new Date().getFullYear()} Ecopets AI Assistant. Powered by Gemini.</p>
            </footer>
        </div>
    );
};

export default App;