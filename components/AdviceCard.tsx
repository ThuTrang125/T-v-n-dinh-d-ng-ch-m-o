import React from 'react';
import { AdviceResponse } from '../types';

interface AdviceCardProps {
  advice: AdviceResponse;
  onPurchase: () => void;
  onReset: () => void;
  purchaseStatus: 'idle' | 'pending' | 'success' | 'error';
}

export const AdviceCard: React.FC<AdviceCardProps> = ({ advice, onPurchase, onReset, purchaseStatus }) => {
  const totalCost = advice.productRecommendations.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const formatTextForDisplay = (text: string) => {
    if (!text) return null;
    return text.split('[NL]').map((line, index, arr) => (
      <React.Fragment key={index}>
        {line}
        {index < arr.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 md:p-8 my-8 max-w-4xl mx-auto animate-fade-in">
      <h2 className="text-3xl font-bold text-center text-emerald-700 mb-8">Kết Quả Tư Vấn từ Trợ lý AI</h2>

      <div className="space-y-8">
        {advice.visualAnalysis && (
          <div className="p-4 border-t-4 border-emerald-500 rounded-b-lg bg-slate-50 shadow-sm">
            <h3 className="text-xl font-semibold text-emerald-800 mb-2">1. Phân tích Ngoại quan (Từ hình ảnh)</h3>
            <p className="text-slate-700">{formatTextForDisplay(advice.visualAnalysis)}</p>
          </div>
        )}
        
        <div className="p-4 border-t-4 border-emerald-500 rounded-b-lg bg-slate-50 shadow-sm">
            <h3 className="text-xl font-semibold text-emerald-800 mb-3">2. Chẩn đoán sơ bộ & Tư vấn</h3>
            <div className="space-y-4">
                <div>
                    <h4 className="font-semibold text-slate-800">Giả thuyết về Dinh dưỡng:</h4>
                    <p className="text-slate-700">{formatTextForDisplay(advice.nutritionHypothesis)}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-slate-800">Kế hoạch hành động (Dinh dưỡng):</h4>
                    <p className="text-slate-700">{formatTextForDisplay(advice.nutritionAdvice)}</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-slate-800">Tư vấn Thói quen & Môi trường:</h4>
                    <p className="text-slate-700">{formatTextForDisplay(advice.habitAdvice)}</p>
                </div>
            </div>
        </div>

        {advice.connectionAdvice && (
            <div className="p-4 border-t-4 border-indigo-400 rounded-b-lg bg-indigo-50 shadow-sm">
                <h3 className="text-xl font-semibold text-indigo-800 mb-2">3. Góc nhìn Thần số học: Kết nối Chủ & Bé</h3>
                <p className="text-indigo-700">{formatTextForDisplay(advice.connectionAdvice)}</p>
            </div>
        )}
        
        <div className="p-4 border-t-4 border-amber-400 rounded-b-lg bg-amber-50 shadow-sm">
          <h3 className="text-xl font-semibold text-amber-800 mb-2">4. Cảnh Báo Quan Trọng</h3>
          <p className="text-amber-700">{formatTextForDisplay(advice.warnings)}</p>
        </div>

        <div className="p-4 border-t-4 border-emerald-500 rounded-b-lg bg-slate-50 shadow-sm">
          <h3 className="text-xl font-semibold text-emerald-800 mb-3">5. Gói Sản Phẩm Ecopets Đề Xuất</h3>
          {advice.productRecommendations && advice.productRecommendations.length > 0 ? (
             <div className="overflow-x-auto">
                <table className="min-w-full bg-white border rounded-lg">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="py-2 px-4 border-b text-left font-semibold text-slate-600">Sản phẩm</th>
                            <th className="py-2 px-4 border-b text-left font-semibold text-slate-600">Lý do</th>
                            <th className="py-2 px-4 border-b text-center font-semibold text-slate-600">SL</th>
                            <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">Đơn giá</th>
                            <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        {advice.productRecommendations.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50">
                            <td className="py-2 px-4 border-b font-medium text-slate-800">{item.name}</td>
                            <td className="py-2 px-4 border-b text-sm text-slate-600">{item.reason}</td>
                            <td className="py-2 px-4 border-b text-center text-slate-600">{item.quantity}</td>
                            <td className="py-2 px-4 border-b text-right text-slate-600">{item.price.toLocaleString('vi-VN')}đ</td>
                            <td className="py-2 px-4 border-b text-right font-semibold text-slate-800">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</td>
                        </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-100 font-bold">
                            <td colSpan={4} className="py-3 px-4 text-right text-lg text-emerald-800">Tổng cộng</td>
                            <td className="py-3 px-4 text-right text-lg text-emerald-800">{totalCost.toLocaleString('vi-VN')}đ</td>
                        </tr>
                    </tfoot>
                </table>
                <p className="text-center text-sm text-emerald-600 mt-2 font-semibold">Freeship cho đơn hàng từ 100,000đ</p>
            </div>
          ) : <p>Không có sản phẩm nào được đề xuất dựa trên tình trạng hiện tại.</p>}
        </div>
      </div>
      
      <div className="mt-8 text-center space-y-4 md:space-y-0 md:space-x-4">
        {advice.productRecommendations && advice.productRecommendations.length > 0 && (
             <button
                onClick={onPurchase}
                disabled={purchaseStatus === 'pending' || purchaseStatus === 'success'}
                className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                {purchaseStatus === 'pending' ? 'Đang gửi yêu cầu...' : (purchaseStatus === 'success' ? 'Yêu cầu đã được gửi!' : 'Đặt Mua Ngay Gói Sản Phẩm Này')}
            </button>
        )}
        <button
          onClick={onReset}
          disabled={purchaseStatus === 'pending'}
          className="w-full md:w-auto bg-slate-500 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-slate-400"
        >
          Tư vấn cho bé khác
        </button>
      </div>
    </div>
  );
};