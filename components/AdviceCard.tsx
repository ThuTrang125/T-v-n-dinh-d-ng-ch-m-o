import React from 'react';
import type { AdviceResponse } from '../types';

interface AdviceCardProps {
  advice: AdviceResponse;
}

const AdviceSection: React.FC<{ title: string; children: React.ReactNode; icon: string }> = ({ title, children, icon }) => (
  <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary">
    <div className="flex items-center mb-3">
      <span className="text-2xl mr-3 text-primary">{icon}</span>
      <h3 className="text-xl font-bold text-gray-800">{title}</h3>
    </div>
    <div className="text-text-secondary space-y-2">{children}</div>
  </div>
);

const AdviceCard: React.FC<AdviceCardProps> = ({ advice }) => {
  if (advice.isEmergency) {
    return (
      <div className="mt-6 p-6 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg shadow-lg animate-fade-in">
        <div className="flex items-center">
          <svg className="w-8 h-8 mr-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          <div>
            <p className="font-bold text-lg">CẢNH BÁO KHẨN CẤP!</p>
            <p>{advice.emergencyMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6 animate-fade-in">
      {advice.analysis && (
        <AdviceSection title="Phân tích Sơ bộ" icon="🧐">
          <p className="whitespace-pre-wrap">{advice.analysis}</p>
        </AdviceSection>
      )}

      {advice.professionalAdvice && (
        <AdviceSection title="Tư vấn Chuyên môn" icon="🩺">
          <div>
            <h4 className="font-semibold text-gray-700 mb-1">Về Dinh dưỡng:</h4>
            <p className="whitespace-pre-wrap">{advice.professionalAdvice.nutrition}</p>
          </div>
          <div className="mt-4">
            <h4 className="font-semibold text-gray-700 mb-1">Về Thói quen & Môi trường:</h4>
            <p className="whitespace-pre-wrap">{advice.professionalAdvice.behavior}</p>
          </div>
        </AdviceSection>
      )}

      {advice.productRecommendations && advice.productRecommendations.length > 0 && (
        <AdviceSection title="Sản phẩm Ecopets Đề xuất" icon="🌿">
          {advice.productRecommendations.map((rec, index) => (
            <div key={index} className="p-4 bg-primary-light/30 rounded-md border border-primary-light mt-2">
              <h4 className="font-bold text-primary-dark">{rec.name}</h4>
              <p className="mt-1 whitespace-pre-wrap"><span className="font-semibold">Lý do:</span> {rec.reason}</p>
              <p className="mt-1 whitespace-pre-wrap"><span className="font-semibold">Điểm nổi bật (USP):</span> {rec.usp}</p>
              <p className="mt-1 whitespace-pre-wrap"><span className="font-semibold">Cách dùng:</span> {rec.usage}</p>
            </div>
          ))}
        </AdviceSection>
      )}

      {advice.notes && (
        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-lg shadow-md">
          <h3 className="font-bold text-lg flex items-center mb-2">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M8.257 3.099c.636-1.21 2.273-1.21 2.91 0l5.396 10.27c.636 1.21-.24 2.631-1.455 2.631H4.316c-1.215 0-2.091-1.421-1.455-2.631L8.257 3.099zM9 13a1 1 0 112 0 1 1 0 01-2 0zm1-5a1 1 0 00-1 1v3a1 1 0 102 0V9a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
            Những điều cần Lưu ý
          </h3>
          <ul className="list-disc list-inside space-y-2 text-sm">
            {advice.notes.warnings && <li className="whitespace-pre-wrap"><span className="font-semibold">Theo dõi thêm:</span> {advice.notes.warnings}</li>}
            {advice.notes.donts && <li className="whitespace-pre-wrap"><span className="font-semibold">Không nên làm:</span> {advice.notes.donts}</li>}
            <li className="font-bold mt-3">{advice.notes.disclaimer}</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default AdviceCard;