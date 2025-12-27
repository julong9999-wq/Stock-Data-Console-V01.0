import React from 'react';
import { X, CheckCircle, AlertTriangle, Cloud, Clock, Lock, FileJson, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const FeasibilityModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-slate-800">軟體可行性評估報告 v3.0</h2>
            <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="space-y-6 text-slate-700">
            
            {/* Answer to User's Specific Question */}
            <div className="bg-green-50 p-5 rounded-xl border border-green-200 shadow-sm">
              <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2 text-lg">
                <ShieldCheck className="w-6 h-6" /> 
                Q: 表單設回「唯讀」，還能寫入嗎？
              </h3>
              <div className="space-y-3">
                <p className="font-bold text-slate-800 text-lg">
                  答案：可以！這正是最安全的標準做法。
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  這其中的技術關鍵在於 <strong>Google Apps Script (GAS)</strong> 的代理機制。
                  只要將試算表權限設為「僅檢視」，一般人就無法隨意修改您的資料。但是：
                </p>
                
                <div className="bg-white p-4 rounded-lg border border-green-100 space-y-2 text-sm">
                  <h4 className="font-bold text-slate-800">運作原理 (銀行櫃檯模式)：</h4>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>
                      <strong>試算表 (金庫)：</strong> 設定為「唯讀」。外人無法直接進入修改。
                    </li>
                    <li>
                      <strong>Apps Script (銀行行員)：</strong> 您在部署 Web App 時，設定 <code>Execute as: Me (以擁有者身分執行)</code>。
                    </li>
                    <li>
                      <strong>結果：</strong> 當網頁發送資料給 Script 時，Script 會拿出<strong>您的識別證</strong>去開啟試算表並寫入資料。因為您是擁有者，所以權限通過！
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Feasibility Point 1 */}
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2 text-indigo-600">
                  <Clock className="w-5 h-5" />
                  <h4 className="font-bold">自動排程 (Auto-Pilot)</h4>
                </div>
                <p className="text-sm text-slate-600 mb-2">
                  目前網頁端已具備「自動託管」功能。
                </p>
                <p className="text-xs bg-slate-100 p-2 rounded">
                  只要將此網頁掛在電腦瀏覽器分頁中，它就會像一個定時器，時間一到自動觸發同步指令。
                </p>
              </div>

              {/* Feasibility Point 2 */}
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2 text-slate-600">
                  <FileJson className="w-5 h-5" />
                  <h4 className="font-bold">下一步實作建議</h4>
                </div>
                <p className="text-sm text-slate-600 mb-2">
                  現在您可以放心地將 Google Sheet 設為私有或唯讀。
                </p>
                <p className="text-xs bg-slate-100 p-2 rounded">
                  請建立 Apps Script 並貼上簡單的 <code>doPost</code> 程式碼，發布為 Web App，並將產生的 URL 填入本系統即可完成串接。
                </p>
              </div>
            </div>
            
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600">
                <strong>技術總結：</strong> 
                前端網頁負責「監控」與「發號施令」，後端 Apps Script 負責「執行權限」與「寫入資料」。兩者分工，既安全又自動化。
             </div>

          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
            >
              了解，進入系統
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeasibilityModal;