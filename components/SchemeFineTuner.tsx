
import React, { useState, useEffect } from 'react';
import { Scheme, Metrics, MarketingRight } from '../types';
import { recalculateMetrics } from '../services/geminiService';
import { ArrowLeft, ArrowRight, RotateCcw, TrendingUp, AlertTriangle, FlaskConical, Split, Plus, Trash2, Tag, Percent, Calculator, Activity, Clock, Sparkles } from 'lucide-react';
import { AB_TEST_THRESHOLD, MAX_VARIANTS } from '../constants';
import { translations } from '../i18n';

interface SchemeFineTunerProps {
  scheme: Scheme;
  onNext: (finalScheme: Scheme) => void;
  onBack: () => void;
  availableRights?: MarketingRight[]; // New prop for rights integration
}

export const SchemeFineTuner: React.FC<SchemeFineTunerProps> = ({ scheme, onNext, onBack, availableRights = [] }) => {
  const t = translations;
  const [currentScheme, setCurrentScheme] = useState<Scheme>({
    ...scheme,
    abTest: scheme.abTest || { 
        enabled: false, 
        variable: null, 
        variants: [scheme.config.benefit],
        controlTrafficPercent: 50,
        allocationMode: 'static',
        confidenceLevel: 0.95,
        minSampleSize: 2000, // Initial estimate
        estimatedDuration: 3
    }
  });
  const [metrics, setMetrics] = useState<Metrics>(scheme.metrics);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [changes, setChanges] = useState<string[]>([]);

  const isAbTestEligible = metrics.audienceSize >= AB_TEST_THRESHOLD;
  const audienceTags = currentScheme.audienceTags || [];

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (changes.length > 0) {
        setIsRecalculating(true);
        const newMetrics = await recalculateMetrics(currentScheme, changes.join(','));
        setMetrics(newMetrics);
        setIsRecalculating(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [currentScheme.config, changes]);

  // Recalculate Min Sample Size when variants or audience changes
  useEffect(() => {
      if (currentScheme.abTest?.enabled) {
          const variantCount = currentScheme.abTest.variants.length;
          const baseSamplePerVariant = 1500; 
          const totalSampleNeeded = baseSamplePerVariant * variantCount;
          
          const dailyTraffic = Math.floor(metrics.audienceSize / 7); // Assume weekly cycle
          const duration = Math.ceil(totalSampleNeeded / dailyTraffic);

          setCurrentScheme(prev => ({
              ...prev,
              abTest: {
                  ...prev.abTest!,
                  minSampleSize: totalSampleNeeded,
                  estimatedDuration: Math.max(duration, 1)
              }
          }));
      }
  }, [currentScheme.abTest?.variants.length, metrics.audienceSize, currentScheme.abTest?.enabled]);

  const handleUpdateConfig = (key: keyof Scheme['config'], value: string) => {
    const newVariants = [...(currentScheme.abTest?.variants || [])];
    if (newVariants.length > 0 && currentScheme.abTest?.variable === key) {
        newVariants[0] = value;
    }

    setCurrentScheme(prev => ({
      ...prev,
      config: { ...prev.config, [key]: value },
      abTest: prev.abTest ? { ...prev.abTest, variants: newVariants } : prev.abTest
    }));
    setChanges(prev => [...prev, `${key} changed`]);
  };

  const handleABTestToggle = () => {
    const isEnabling = !currentScheme.abTest?.enabled;
    const defaultVar = 'benefit'; 
    
    setCurrentScheme(prev => ({
      ...prev,
      abTest: { 
        ...prev.abTest,
        enabled: isEnabling, 
        variable: isEnabling ? defaultVar : null,
        variants: isEnabling 
            ? [prev.config[defaultVar], ''] 
            : [prev.config[defaultVar]],
        controlTrafficPercent: 50,
        allocationMode: 'static'
      }
    }));
  };

  const handleABVariableChange = (variable: 'benefit' | 'channel' | 'gameplay') => {
    setCurrentScheme(prev => ({
      ...prev,
      abTest: { 
        ...prev.abTest!,
        enabled: true, 
        variable, 
        variants: [prev.config[variable], ''],
        controlTrafficPercent: 50
      }
    }));
  };

  const handleVariantChange = (index: number, value: string) => {
    const newVariants = [...(currentScheme.abTest?.variants || [])];
    newVariants[index] = value;
    setCurrentScheme(prev => ({
      ...prev,
      abTest: { ...prev.abTest!, variants: newVariants }
    }));
  };

  const handleAddVariant = () => {
    if ((currentScheme.abTest?.variants.length || 0) >= MAX_VARIANTS) return;

    setCurrentScheme(prev => ({
        ...prev,
        abTest: { ...prev.abTest!, variants: [...prev.abTest!.variants, ''] }
    }));
  };

  const handleRemoveVariant = (index: number) => {
    if ((currentScheme.abTest?.variants.length || 0) <= 2) return;
    const newVariants = currentScheme.abTest!.variants.filter((_, i) => i !== index);
    setCurrentScheme(prev => ({
        ...prev,
        abTest: { ...prev.abTest!, variants: newVariants }
    }));
  };

  const handleControlTrafficChange = (val: number) => {
    setCurrentScheme(prev => ({
        ...prev,
        abTest: { ...prev.abTest!, controlTrafficPercent: val }
    }));
  };

  const handleAllocationModeChange = (mode: 'static' | 'dynamic_mab') => {
      setCurrentScheme(prev => ({
          ...prev,
          abTest: { ...prev.abTest!, allocationMode: mode }
      }));
  }

  const handleReset = () => {
    setCurrentScheme({
        ...scheme,
        abTest: { enabled: false, variable: null, variants: [scheme.config.benefit] }
    });
    setMetrics(scheme.metrics);
    setChanges([]);
  };

  // Logic to determine Smart Recommendation for Rights
  // Mock logic: If Audience Tags contains "High Value" -> Recommend High Cost rights. 
  // If Audience contains "Price Sensitive" -> Recommend Low Threshold rights.
  // Generally, match Category (e.g. Wash & Care).
  const recommendedRightIds = React.useMemo(() => {
      // Basic heuristic matching
      const targetTags = audienceTags.join(' ');
      const scores = availableRights.map(r => {
          let score = 0;
          if (targetTags.includes(r.category || '')) score += 5; // Match category
          if (r.category === '通用') score += 2; 
          if (targetTags.includes('高净值') && r.tags?.includes('高价值')) score += 3;
          if (targetTags.includes('价格敏感') && r.tags?.includes('低成本')) score += 3;
          if (targetTags.includes('流失') && r.tags?.includes('召回')) score += 4;
          return { id: r.id, score };
      });
      return scores.sort((a,b) => b.score - a.score).slice(0, 3).map(s => s.id);
  }, [audienceTags, availableRights]);

  // Traffic Calculations
  const variants = currentScheme.abTest?.variants || [];
  const variantCount = variants.length;
  const controlPercent = currentScheme.abTest?.controlTrafficPercent ?? Math.floor(100 / variantCount);
  
  const remainingTraffic = 100 - controlPercent;
  const testGroupCount = variantCount - 1;
  const testGroupPercent = testGroupCount > 0 ? (remainingTraffic / testGroupCount).toFixed(1) : 0;

  const MetricCard = ({ label, value, original, prefix = '', suffix = '' }: { label: string, value: number, original: number, prefix?: string, suffix?: string }) => {
    const diff = value - original;
    const percent = original !== 0 ? (diff / original) * 100 : 0;
    const isPositive = diff >= 0;
    const isGood = label === '预估成本' ? !isPositive : isPositive;
    const colorClass = diff === 0 ? 'text-gray-500' : isGood ? 'text-success' : 'text-error';

    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 relative overflow-hidden">
        {isRecalculating && <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center"><div className="animate-pulse bg-gray-200 h-full w-full"></div></div>}
        <div className="text-sm text-gray-500 mb-1">{label}</div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-800">{prefix}{value.toLocaleString()}{suffix}</span>
          {diff !== 0 && (
            <span className={`text-xs font-medium ${colorClass}`}>
              {isPositive ? '↑' : '↓'} {Math.abs(percent).toFixed(1)}%
            </span>
          )}
        </div>
        <div className="text-xs text-gray-400 mt-1">初始: {prefix}{original.toLocaleString()}{suffix}</div>
      </div>
    );
  };

  const renderConfigSection = (
    label: string, 
    variableKey: 'benefit' | 'channel' | 'gameplay', 
    options: string[]
  ) => {
    const isTestingThis = currentScheme.abTest?.enabled && currentScheme.abTest.variable === variableKey;
    const isRightsField = variableKey === 'benefit' && availableRights.length > 0;
    
    const renderInput = (value: string, onChange: (val: string) => void, isControl: boolean) => {
        const showNoAction = isControl && isTestingThis;

        if (isRightsField) {
            return (
                <select 
                    className={`w-full p-2.5 border rounded-lg focus:ring-2 outline-none text-sm transition-colors ${
                        isControl 
                        ? 'border-gray-200 focus:ring-brand-blue/20 bg-white' 
                        : 'border-purple-200 focus:ring-purple-500/20 bg-purple-50/30'
                    }`}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required={!showNoAction}
                >
                    <option value="" disabled>-- 请选择权益 --</option>
                    {showNoAction && <option value="CONTROL_NONE">不采取措施 (无策略)</option>}
                    {/* Recommended Rights first */}
                    {availableRights.length > 0 && <optgroup label="AI 智能推荐">
                        {availableRights.filter(r => recommendedRightIds.includes(r.id)).map(r => (
                            <option key={r.id} value={r.name}>✨ {r.name} (库存: {r.totalStock - r.usedStock})</option>
                        ))}
                    </optgroup>}
                    <optgroup label="全部权益库">
                        {availableRights.filter(r => !recommendedRightIds.includes(r.id)).map(r => (
                            <option key={r.id} value={r.name}>{r.name} (库存: {r.totalStock - r.usedStock})</option>
                        ))}
                    </optgroup>
                </select>
            );
        }

        return (
            <select 
                className={`w-full p-2.5 border rounded-lg focus:ring-2 outline-none text-sm transition-colors ${
                    isControl 
                    ? 'border-gray-200 focus:ring-brand-blue/20 bg-white' 
                    : 'border-purple-200 focus:ring-purple-500/20 bg-purple-50/30'
                }`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={!showNoAction}
            >
                <option value="" disabled>-- 请选择 --</option>
                {showNoAction && <option value="CONTROL_NONE">不采取措施 (无策略)</option>}
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        );
    };

    return (
      <div className={`space-y-3 p-4 rounded-xl transition-all ${isTestingThis ? 'bg-blue-50/30 border border-blue-100' : ''}`}>
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            {label}
            {isRightsField && <span className="text-[10px] text-brand-blue bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded flex items-center gap-1"><Sparkles size={10}/> 智能匹配中</span>}
            {isTestingThis && <span className="text-xs text-brand-blue bg-blue-100 px-2 py-0.5 rounded-full font-bold">A/B 测试中</span>}
            {!isTestingThis && <span className="text-xs text-red-400">*</span>}
          </label>
        </div>

        <div className="relative">
            {isTestingThis && (
                <div className="flex justify-between text-xs text-gray-500 mb-1 px-1">
                    <span className="font-medium">方案 A (对照组)</span>
                    <span className="bg-gray-100 px-1.5 rounded text-gray-600">{controlPercent}% 流量</span>
                </div>
            )}
            {renderInput(
                currentScheme.config[variableKey], 
                (val) => handleUpdateConfig(variableKey, val),
                true
            )}
        </div>

        {isTestingThis && (
            <div className="space-y-3 mt-3 border-t border-dashed border-gray-200 pt-3">
                {variants.slice(1).map((val, idx) => (
                    <div key={idx} className="relative group">
                         <div className="flex justify-between text-xs text-purple-600 mb-1 px-1">
                            <span className="font-medium">方案 {String.fromCharCode(66 + idx)} (测试组 {idx + 1})</span>
                            <span className="bg-purple-100 px-1.5 rounded text-purple-700">{testGroupPercent}% 流量</span>
                        </div>
                        <div className="flex gap-2">
                             {renderInput(val, (v) => handleVariantChange(idx + 1, v), false)}
                             <button 
                                onClick={() => handleRemoveVariant(idx + 1)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="删除此组"
                             >
                                <Trash2 size={16} />
                             </button>
                        </div>
                    </div>
                ))}

                {variants.length < MAX_VARIANTS && (
                    <button 
                        onClick={handleAddVariant}
                        className="flex items-center gap-2 text-xs font-semibold text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-3 py-2 rounded-lg transition-colors border border-dashed border-purple-200 w-full justify-center"
                    >
                        <Plus size={14} /> 添加测试组
                    </button>
                )}
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 flex flex-col lg:flex-row gap-8">
      {/* Left: Configuration Form */}
      <div className="flex-1 bg-white rounded-xl shadow-lg p-6 h-fit">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-brand-blue">方案微调</h2>
          <button onClick={handleReset} className="flex items-center text-sm text-gray-500 hover:text-brand-blue">
            <RotateCcw size={14} className="mr-1" /> 重置
          </button>
        </div>

        {/* Audience Section */}
        <div className="mb-6 space-y-2">
            <label className="text-sm font-semibold text-gray-700">目标人群</label>
            <div className="relative">
                <textarea 
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 outline-none text-sm min-h-[80px]"
                    value={currentScheme.config.audience}
                    onChange={(e) => handleUpdateConfig('audience', e.target.value)}
                />
                
                {audienceTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 px-1">
                        {audienceTags.map(tag => (
                            <div key={tag} className="flex items-center gap-1 bg-blue-50 text-brand-blue border border-blue-100 px-2 py-0.5 rounded text-xs">
                                <Tag size={10} /> {tag}
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="absolute top-3 right-3 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                    当前规模: {metrics.audienceSize.toLocaleString()}人
                </div>
            </div>
        </div>

        <div className="border-t border-gray-100 my-6"></div>

        {/* A/B Test Header / Toggle */}
        <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="bg-purple-100 p-2 rounded-lg text-purple-700">
                        <FlaskConical size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">A/B 测试实验引擎</h3>
                        <p className="text-xs text-gray-500">
                            {isAbTestEligible 
                                ? "人群规模达标，已激活科学实验模式" 
                                : `人群规模需 > ${AB_TEST_THRESHOLD} 才可开启测试`}
                        </p>
                    </div>
                </div>
                {isAbTestEligible && (
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={currentScheme.abTest?.enabled}
                            onChange={handleABTestToggle}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                )}
            </div>

            {/* A/B Variable Selector & Traffic Control */}
            {currentScheme.abTest?.enabled && (
                <div className="bg-purple-50 p-4 rounded-lg mb-6 border border-purple-100 animate-fade-in-up">
                    <div className="mb-4">
                        <label className="text-xs font-bold text-purple-800 uppercase mb-2 block tracking-wide">选择测试变量</label>
                        <div className="flex gap-2">
                            {[
                                { id: 'benefit', label: '权益力度' },
                                { id: 'channel', label: '触达渠道' },
                                { id: 'gameplay', label: '互动玩法' }
                            ].map(v => (
                                <button
                                    key={v.id}
                                    onClick={() => handleABVariableChange(v.id as any)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all ${
                                        currentScheme.abTest?.variable === v.id
                                        ? 'bg-purple-600 text-white shadow-md'
                                        : 'bg-white text-purple-700 hover:bg-purple-100'
                                    }`}
                                >
                                    {v.id === currentScheme.abTest?.variable && <Split size={14} />}
                                    {v.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Scientific Experiment Params - NEW Section */}
                    <div className="bg-white p-4 rounded-lg border border-purple-100 mb-4">
                        <h4 className="font-bold text-purple-800 text-xs uppercase mb-3 flex items-center gap-1">
                            <Activity size={12} /> {t["ab.config.title"]}
                        </h4>
                        
                        <div className="space-y-4">
                            {/* Allocation Mode */}
                            <div>
                                <label className="text-xs font-medium text-gray-600 mb-1 block">{t["ab.config.mode"]}</label>
                                <div className="flex gap-2">
                                    <button 
                                        className={`flex-1 text-xs py-1.5 rounded border ${currentScheme.abTest.allocationMode === 'static' ? 'bg-purple-100 border-purple-300 text-purple-800 font-bold' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                                        onClick={() => handleAllocationModeChange('static')}
                                    >
                                        {t["ab.config.mode_static"]}
                                    </button>
                                    <button 
                                        className={`flex-1 text-xs py-1.5 rounded border ${currentScheme.abTest.allocationMode === 'dynamic_mab' ? 'bg-purple-100 border-purple-300 text-purple-800 font-bold' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                                        onClick={() => handleAllocationModeChange('dynamic_mab')}
                                    >
                                        {t["ab.config.mode_dynamic"]}
                                    </button>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 p-2 rounded border border-gray-100">
                                    <div className="text-[10px] text-gray-500 flex items-center gap-1"><Calculator size={10} /> {t["ab.config.min_sample"]}</div>
                                    <div className="text-sm font-mono font-bold text-gray-700">{currentScheme.abTest.minSampleSize?.toLocaleString()} /组</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded border border-gray-100">
                                    <div className="text-[10px] text-gray-500 flex items-center gap-1"><Clock size={10} /> {t["ab.config.duration"]}</div>
                                    <div className="text-sm font-mono font-bold text-gray-700">{currentScheme.abTest.estimatedDuration} 天</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Traffic Allocation Slider (Only for Static) */}
                    {currentScheme.abTest.allocationMode === 'static' && (
                        <div className="bg-white p-3 rounded-lg border border-purple-100">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                    <Percent size={12} /> 对照组(A) 流量配置
                                </label>
                                <span className="text-sm font-bold text-purple-700">{controlPercent}%</span>
                            </div>
                            <input 
                                type="range" 
                                min="1" 
                                max="90" 
                                step="1"
                                value={controlPercent} 
                                onChange={(e) => handleControlTrafficChange(Number(e.target.value))}
                                className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                            <div className="mt-2 text-xs text-gray-500 flex justify-between">
                                <span>剩余 {100 - controlPercent}% 流量将均分给 {variantCount - 1} 个测试组</span>
                            </div>
                        </div>
                    )}

                    <div className="mt-3 text-xs text-purple-600 flex items-center gap-1">
                        <AlertTriangle size={12} />
                        <span>支持最多 {MAX_VARIANTS} 组变量同时测试</span>
                    </div>
                </div>
            )}
        </div>

        {/* Config Fields */}
        <div className="space-y-4">
            {renderConfigSection('权益配置', 'benefit', [])} {/* Options now dynamically populated if rights available */}
            {renderConfigSection('触达渠道', 'channel', ['企微 1V1', '短信', 'APP Push', '公众号'])}
            {renderConfigSection('玩法模板', 'gameplay', ['满减叠加', '积分加倍', '抽奖', '拼团'])}
        </div>
      </div>

      {/* Right: Real-time Stats */}
      <div className="w-full lg:w-80 space-y-4">
        <div className="bg-brand-blue text-white p-5 rounded-xl shadow-lg">
            <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={20} />
                <span className="font-bold text-lg">实时预测</span>
            </div>
            <p className="text-blue-100 text-sm">参数调整后 1s 内自动刷新</p>
        </div>

        <MetricCard label="预期 ROI" value={metrics.roi} original={scheme.metrics.roi} />
        <MetricCard label="预估 GMV" value={metrics.gmv} original={scheme.metrics.gmv} prefix="¥" />
        <MetricCard label="预估成本" value={metrics.cost} original={scheme.metrics.cost} prefix="¥" />
        <MetricCard label="转化率" value={metrics.conversionRate * 100} original={scheme.metrics.conversionRate * 100} suffix="%" />

        <div className="pt-6 space-y-3">
            <button 
                onClick={() => onNext({...currentScheme, metrics})}
                className="w-full py-3 bg-brand-blue text-white rounded-lg font-bold shadow-md hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
            >
                下一步：提交审批 <ArrowRight size={18} />
            </button>
            <button 
                onClick={onBack}
                className="w-full py-3 bg-white border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
                <ArrowLeft size={18} /> 返回方案选择
            </button>
        </div>
      </div>
    </div>
  );
};
