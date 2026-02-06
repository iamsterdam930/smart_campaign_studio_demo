import React from 'react';
import { Scheme } from '../types';
import { CheckCircle, FileText, User, Clock, FlaskConical, Split, Calendar } from 'lucide-react';

interface ApprovalSubmissionProps {
  scheme: Scheme;
  onReset: () => void;
  onSubmitToApproval: (scheme: Scheme) => void;
}

export const ApprovalSubmission: React.FC<ApprovalSubmissionProps> = ({ scheme, onReset, onSubmitToApproval }) => {
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const handleSubmit = () => {
    // Simulate submission
    setTimeout(() => {
      setIsSubmitted(true);
      // Notify parent after a short delay so user sees the success message first
      setTimeout(() => {
          onSubmitToApproval(scheme);
      }, 1500);
    }, 1000);
  };

  const getVariableName = (key: string | null | undefined) => {
    switch(key) {
        case 'benefit': return '权益力度';
        case 'channel': return '触达渠道';
        case 'gameplay': return '互动玩法';
        default: return '未知变量';
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg text-center animate-fade-in-up mt-12">
        <div className="flex justify-center mb-6">
          <CheckCircle size={80} className="text-success" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">提交成功！</h2>
        <p className="text-gray-500 mb-8 text-lg">
          您的活动方案 <strong>"{scheme.name}"</strong> 已发送给审批管理。
          <br />正在跳转至活动列表...
        </p>
        <button
          onClick={() => onSubmitToApproval(scheme)}
          className="bg-brand-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all"
        >
          立即跳转
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gray-50 p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="text-brand-blue" />
            审批预览
          </h2>
        </div>
        
        <div className="p-8 space-y-8">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-500 block mb-1">活动名称</label>
              <div className="font-semibold text-lg">{scheme.name}</div>
            </div>
            <div>
              <label className="text-sm text-gray-500 block mb-1">活动类型</label>
              <div className="font-semibold text-lg">{scheme.type}</div>
            </div>
            <div>
              <label className="text-sm text-gray-500 block mb-1">创建人</label>
              <div className="flex items-center gap-2 font-medium">
                <div className="w-6 h-6 rounded-full bg-brand-blue text-white flex items-center justify-center text-xs">U</div>
                Admin User
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500 block mb-1">活动时间</label>
              <div className="flex items-center gap-2 font-medium">
                <Calendar size={16} /> 
                {scheme.startDate || '2023-11-01'} <span className="text-gray-400">→</span> {scheme.endDate || '2023-11-15'}
              </div>
            </div>
          </div>

          {/* A/B Test Summary (If Enabled) */}
          {scheme.abTest?.enabled && (
             <div className="bg-purple-50 border border-purple-100 rounded-lg p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 text-purple-200">
                    <FlaskConical size={64} opacity={0.2} />
                </div>
                <div className="relative z-10">
                    <h3 className="text-purple-800 font-bold flex items-center gap-2 mb-3">
                        <Split size={18} />
                        包含 A/B 测试实验 (共 {scheme.abTest.variants.length} 组)
                    </h3>
                    
                    <div className="mb-3 text-sm text-gray-600">
                        测试变量: <span className="font-bold text-purple-700">{getVariableName(scheme.abTest.variable)}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {scheme.abTest.variants.map((v, idx) => (
                             <div key={idx} className="bg-white p-3 rounded border border-purple-100">
                                <span className="text-xs text-gray-500 block mb-1">
                                    {idx === 0 ? '方案 A (对照)' : `方案 ${String.fromCharCode(65 + idx)}`}
                                </span>
                                <span className={`font-bold text-sm ${idx === 0 ? 'text-gray-800' : 'text-purple-600'}`}>
                                    {v === 'CONTROL_NONE' ? '不采取措施 (无策略)' : (v || '未配置')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
          )}

          <div className="border-t border-gray-100 my-6"></div>

          {/* Config Details */}
          <div className="bg-blue-50/50 rounded-lg p-6 space-y-4">
            <h3 className="font-bold text-gray-800 mb-2">配置详情</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <span className="text-gray-500 text-sm">目标人群:</span>
                    <p className="font-medium">{scheme.config.audience}</p>
                </div>
                <div>
                    <span className="text-gray-500 text-sm">权益:</span>
                    <p className="font-medium">{scheme.config.benefit}</p>
                </div>
                <div>
                    <span className="text-gray-500 text-sm">玩法:</span>
                    <p className="font-medium">{scheme.config.gameplay}</p>
                </div>
                <div>
                    <span className="text-gray-500 text-sm">触达渠道:</span>
                    <p className="font-medium">{scheme.config.channel}</p>
                </div>
            </div>
          </div>

          {/* Metrics */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4">效果预估</h3>
            <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">ROI</div>
                    <div className="text-xl font-bold text-brand-blue">{scheme.metrics.roi}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">GMV</div>
                    <div className="text-xl font-bold text-gray-800">¥{(scheme.metrics.gmv/10000).toFixed(1)}万</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">成本</div>
                    <div className="text-xl font-bold text-gray-800">¥{(scheme.metrics.cost/10000).toFixed(1)}万</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">人群</div>
                    <div className="text-xl font-bold text-gray-800">{scheme.metrics.audienceSize.toLocaleString()}</div>
                </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 border-t border-gray-200 flex justify-end gap-4">
            <button 
                onClick={onReset}
                className="px-6 py-2 text-gray-600 font-medium hover:text-gray-800"
            >
                取消
            </button>
            <button 
                onClick={handleSubmit}
                className="px-8 py-3 bg-brand-blue text-white rounded-lg font-bold shadow-md hover:bg-opacity-90 transition-all"
            >
                确认提交
            </button>
        </div>
      </div>
    </div>
  );
};