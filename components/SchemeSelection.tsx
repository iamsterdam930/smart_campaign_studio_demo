import React from 'react';
import { Scheme, StrategyType } from '../types';
import { COLORS } from '../constants';
import { Target, Users, TrendingUp, DollarSign, Award, AlertTriangle, HelpCircle } from 'lucide-react';

interface SchemeSelectionProps {
  schemes: Scheme[];
  onSelect: (scheme: Scheme) => void;
  isLoading: boolean;
}

const StrategyBadge = ({ type }: { type: StrategyType }) => {
  let colorClass = 'bg-blue-100 text-blue-800';
  switch (type) {
    case StrategyType.BALANCED: colorClass = 'bg-blue-100 text-blue-800'; break;
    case StrategyType.PRECISION: colorClass = 'bg-purple-100 text-purple-800'; break;
    case StrategyType.EXPANSION: colorClass = 'bg-green-100 text-green-800'; break;
    case StrategyType.INNOVATION: colorClass = 'bg-orange-100 text-orange-800'; break;
  }
  return <span className={`text-xs px-2 py-1 rounded-full font-bold ${colorClass}`}>{type}</span>;
};

const ConfidenceBadge = ({ confidence, reason }: { confidence: 'high' | 'medium' | 'low', reason: string }) => {
  let icon = <Award size={14} />;
  let color = 'text-success bg-green-50 border-green-200';
  let text = '高置信度';

  if (confidence === 'medium') {
    icon = <AlertTriangle size={14} />;
    color = 'text-warning bg-yellow-50 border-yellow-200';
    text = '中置信度';
  } else if (confidence === 'low') {
    icon = <HelpCircle size={14} />;
    color = 'text-gray-500 bg-gray-100 border-gray-200';
    text = '需测试';
  }

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium ${color}`} title={reason}>
      {icon}
      <span>{text}</span>
    </div>
  );
};

export const SchemeSelection: React.FC<SchemeSelectionProps> = ({ schemes, onSelect, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-blue mb-4"></div>
        <p className="text-gray-500 text-lg font-medium animate-pulse">AI 正在根据您的目标生成最佳方案...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">AI 为您推荐了 {schemes.length} 个方案</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {schemes.map((scheme) => (
          <div key={scheme.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-gray-50 bg-gradient-to-br from-white to-gray-50">
              <div className="flex justify-between items-start mb-3">
                <StrategyBadge type={scheme.type} />
                <ConfidenceBadge confidence={scheme.confidence} reason={scheme.confidenceReason} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{scheme.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 h-10">{scheme.description}</p>
            </div>

            {/* Metrics */}
            <div className="p-5 grid grid-cols-2 gap-4 bg-white flex-1">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">
                  <TrendingUp size={12} /> 预期ROI
                </div>
                <div className="text-2xl font-bold text-brand-blue">{scheme.metrics?.roi || '-'}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">
                  <Users size={12} /> 覆盖人数
                </div>
                <div className="text-xl font-semibold text-gray-700">{scheme.metrics?.audienceSize?.toLocaleString() || '-'}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">
                  <DollarSign size={12} /> 预估成本
                </div>
                <div className="text-lg font-medium text-gray-600">¥{scheme.metrics?.cost ? (Number(scheme.metrics.cost) / 10000).toFixed(1) : '0.0'}万</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">
                  <Target size={12} /> 预估GMV
                </div>
                <div className="text-lg font-medium text-gray-600">¥{scheme.metrics?.gmv ? (Number(scheme.metrics.gmv) / 10000).toFixed(1) : '0.0'}万</div>
              </div>
            </div>

            {/* Config Summary */}
            <div className="px-5 pb-5 text-sm text-gray-600 space-y-2">
              <div className="flex gap-2">
                <span className="font-semibold min-w-[3rem]">权益:</span>
                <span className="truncate">{scheme.config?.benefit || '未配置'}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold min-w-[3rem]">渠道:</span>
                <span className="truncate">{scheme.config?.channel || '未配置'}</span>
              </div>
            </div>

            {/* Action */}
            <div className="p-5 pt-0 mt-auto">
              <button
                onClick={() => onSelect(scheme)}
                className="w-full py-3 bg-white border-2 border-brand-blue text-brand-blue rounded-lg font-semibold hover:bg-brand-blue hover:text-white transition-colors"
              >
                选择并微调
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};