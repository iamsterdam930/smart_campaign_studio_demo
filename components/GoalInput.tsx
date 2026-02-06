
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Loader2, Sparkles, AlertCircle, Search, Wand2, Tag, X, Plus, ArrowRight, UserPlus, Users } from 'lucide-react';
import { parseUserGoal, optimizePrompt, analyzeAudienceGoal } from '../services/geminiService';
import { ParsedGoal, MockAudience } from '../types';
import { CATEGORY_OPTIONS, TARGET_TYPE_OPTIONS, TIME_UNIT_OPTIONS, MOCK_CATEGORY_BUDGETS, SYSTEM_AUDIENCE_TAGS } from '../constants';
import { translations } from '../i18n';

interface GoalInputProps {
  onNext: (goal: ParsedGoal) => void;
  lang: 'zh' | 'en';
  audiences?: MockAudience[]; 
  initialAudience?: MockAudience | null; // New prop
}

export const GoalInput: React.FC<GoalInputProps> = ({ onNext, audiences = [], initialAudience }) => {
  const t = translations;
  
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isGeneratingAudience, setIsGeneratingAudience] = useState(false);
  
  // Highlight ref
  const editableRef = useRef<HTMLDivElement>(null);

  // Structured State
  const [category, setCategory] = useState<string>('不限');
  const [targetType, setTargetType] = useState<string>(TARGET_TYPE_OPTIONS[0]);
  
  // Audience State
  const [audienceMode, setAudienceMode] = useState<'existing' | 'create'>('existing');
  const [selectedAudienceId, setSelectedAudienceId] = useState<string>('');
  const [customAudienceName, setCustomAudienceName] = useState('');
  const [customAudienceFeatures, setCustomAudienceFeatures] = useState('');
  const [matchedTags, setMatchedTags] = useState<string[]>([]);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState<number>(0);
  
  // Time State
  const [timeValue, setTimeValue] = useState<number | ''>(14);
  const [timeUnit, setTimeUnit] = useState<'天' | '小时'>('天');
  
  // Budget State
  const [budget, setBudget] = useState<number | ''>('');
  
  const [parsedData, setParsedData] = useState<ParsedGoal | null>(null);

  // Budget Validation
  const currentBudgetInfo = MOCK_CATEGORY_BUDGETS[category] || MOCK_CATEGORY_BUDGETS['不限'];
  const remainingBudget = currentBudgetInfo.total - currentBudgetInfo.used;
  const isBudgetOverrun = typeof budget === 'number' && budget > remainingBudget;

  // Handle Initial Audience Logic
  useEffect(() => {
      if (initialAudience) {
          setAudienceMode('existing');
          setSelectedAudienceId(initialAudience.id);
          // Auto fill dummy parsed data to show the form
          setParsedData({
              category: '不限',
              targetType: '客单提升',
              targetAudienceName: initialAudience.name,
              targetAudienceFeatures: initialAudience.description,
              targetAudienceTags: initialAudience.tags,
              suggestedTags: [],
              timeValue: 14,
              timeUnit: '天',
              budget: 50000,
              originalText: `针对人群“${initialAudience.name}”的营销活动`
          });
          setInput(`针对人群“${initialAudience.name}”创建营销活动，${initialAudience.description}`);
          if (editableRef.current) editableRef.current.innerText = `针对人群“${initialAudience.name}”创建营销活动，${initialAudience.description}`;
      }
  }, [initialAudience]);

  useEffect(() => {
    if (audienceMode === 'create') {
        const baseSize = 5000;
        const tagWeight = 2500;
        // Simple mock estimation if AI hasn't set it
        if (estimatedSize === 0) {
             const calculated = baseSize + (matchedTags.length * tagWeight) + Math.floor(Math.random() * 200);
             setEstimatedSize(calculated);
        }
    } else {
        const aud = audiences.find(a => a.id === selectedAudienceId);
        setEstimatedSize(aud ? aud.size : 0);
    }
  }, [matchedTags, audienceMode, selectedAudienceId]);

  const updateEditableContent = (text: string, highlight: boolean) => {
    if (!editableRef.current) return;
    
    // If highlight needed (from AI), parse brackets and wrap in spans
    if (highlight) {
        // Regex to match content inside 【 】
        const html = text.replace(/【(.*?)】/g, '<span class="bg-yellow-200 text-yellow-800 rounded px-1 font-bold mx-0.5 border border-yellow-300">【$1】</span>');
        editableRef.current.innerHTML = html;
    } else {
        editableRef.current.innerText = text;
    }
  };

  const handleInputChange = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.innerText;
    setInput(text);
  };

  const handleAIOptimize = async () => {
    if (!input.trim()) return;
    setIsOptimizing(true);
    const optimizedText = await optimizePrompt(input);
    setInput(optimizedText);
    updateEditableContent(optimizedText, true);
    setIsOptimizing(false);
  };

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setIsAnalyzing(true);
    const result = await parseUserGoal(input);
    setParsedData(result);
    
    // Auto-fill form
    setCategory(result.category);
    setTargetType(result.targetType);
    setTimeValue(result.timeValue);
    setTimeUnit(result.timeUnit as any);
    setBudget(result.budget);
    
    // Audience logic: try to match or set to custom
    const match = audiences.find(a => a.name === result.targetAudienceName);
    if (match) {
        setAudienceMode('existing');
        setSelectedAudienceId(match.id);
    } else {
        setAudienceMode('create');
        setCustomAudienceName(result.targetAudienceName);
        setCustomAudienceFeatures(result.targetAudienceFeatures);
        setMatchedTags([...(result.targetAudienceTags || []), ...(result.suggestedTags || [])]);
    }
    
    setIsAnalyzing(false);
  };

  const handleSmartAudienceGenerate = async () => {
      if (!customAudienceFeatures) return;
      setIsGeneratingAudience(true);
      
      const analysis = await analyzeAudienceGoal(customAudienceFeatures);
      
      if (analysis) {
          setCustomAudienceName(analysis.name);
          setMatchedTags(analysis.tags);
          setEstimatedSize(analysis.estimatedSize);
          // Optional: You could show the profile reasoning in a tooltip or alert
      }
      setIsGeneratingAudience(false);
  };

  const handleNext = () => {
    if (!parsedData) return;

    // Construct final goal object
    const finalGoal: ParsedGoal = {
        ...parsedData,
        category,
        targetType,
        timeValue: Number(timeValue),
        timeUnit: timeUnit,
        budget: Number(budget),
        targetAudienceName: audienceMode === 'existing' 
            ? audiences.find(a => a.id === selectedAudienceId)?.name || '' 
            : customAudienceName,
        targetAudienceFeatures: audienceMode === 'existing'
            ? audiences.find(a => a.id === selectedAudienceId)?.description || ''
            : customAudienceFeatures,
        targetAudienceTags: matchedTags,
        suggestedTags: []
    };

    onNext(finalGoal);
  };

  const toggleTag = (tag: string) => {
    if (matchedTags.includes(tag)) {
        setMatchedTags(prev => prev.filter(t => t !== tag));
    } else {
        setMatchedTags(prev => [...prev, tag]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{t["goal.title"]}</h1>
        <p className="text-gray-500">{t["goal.subtitle"]}</p>
      </div>

      {/* Input Area */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8 relative group hover:border-blue-200 transition-colors">
        
        <div 
            ref={editableRef}
            contentEditable
            onInput={handleInputChange}
            className="w-full min-h-[120px] text-lg text-gray-700 outline-none p-2 empty:before:content-[attr(placeholder)] empty:before:text-gray-300"
            placeholder={t["goal.placeholder"]}
            suppressContentEditableWarning={true}
        />
        
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50">
            <div className="flex items-center gap-3">
                <div className="text-gray-400 p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer" title="语音输入 (模拟)">
                    <Mic size={20} />
                </div>
                
                <button 
                    onClick={handleAIOptimize}
                    disabled={isOptimizing || !input}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-full text-xs font-bold hover:bg-purple-100 transition-colors disabled:opacity-50"
                >
                    {isOptimizing ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                    {t["goal.ai_optimize"]}
                </button>
            </div>

            <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !input}
                className="bg-brand-blue text-white px-6 py-2.5 rounded-lg font-semibold shadow-md hover:bg-opacity-90 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isAnalyzing ? (
                    <>
                        <Loader2 size={18} className="animate-spin" />
                        {t["goal.analyzing"]}
                    </>
                ) : (
                    <>
                        <Sparkles size={18} />
                        {t["goal.analyze"]}
                    </>
                )}
            </button>
        </div>
      </div>

      {/* Structured Form (Visible after parse) */}
      {parsedData && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 animate-fade-in-up">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 pb-4 border-b border-gray-100">
                <Search size={20} className="text-brand-blue" />
                {t["goal.params_title"]}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Category */}
                <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">{t["goal.category"]}</label>
                    <select 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
                    >
                        {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {/* Target Type */}
                <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">{t["goal.target"]}</label>
                    <select 
                        value={targetType} 
                        onChange={(e) => setTargetType(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
                    >
                        {TARGET_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                {/* Audience Selection */}
                <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">{t["goal.audience"]}</label>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex gap-4 mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="audienceMode" 
                                    checked={audienceMode === 'existing'} 
                                    onChange={() => setAudienceMode('existing')}
                                    className="text-brand-blue focus:ring-brand-blue"
                                />
                                <span className="text-sm font-medium">{t["goal.audience.existing"]}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="audienceMode" 
                                    checked={audienceMode === 'create'} 
                                    onChange={() => setAudienceMode('create')}
                                    className="text-brand-blue focus:ring-brand-blue"
                                />
                                <span className="text-sm font-medium">{t["goal.audience.create"]}</span>
                            </label>
                        </div>

                        {audienceMode === 'existing' ? (
                            <select 
                                value={selectedAudienceId}
                                onChange={(e) => setSelectedAudienceId(e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 outline-none bg-white"
                            >
                                <option value="" disabled>请选择人群包</option>
                                {audiences.map(a => (
                                    <option key={a.id} value={a.id}>{a.name} ({a.size.toLocaleString()}人)</option>
                                ))}
                            </select>
                        ) : (
                            <div className="space-y-3">
                                {/* Agent Input */}
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={customAudienceFeatures}
                                        onChange={(e) => setCustomAudienceFeatures(e.target.value)}
                                        placeholder="描述目标人群特征 (例如: 喜欢买美妆的年轻女性)"
                                        className="w-full p-3 pr-24 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 outline-none bg-white"
                                    />
                                    <button 
                                        onClick={handleSmartAudienceGenerate}
                                        disabled={isGeneratingAudience || !customAudienceFeatures}
                                        className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 rounded-md text-xs font-bold flex items-center gap-1 hover:shadow-md transition-all disabled:opacity-50"
                                    >
                                        {isGeneratingAudience ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                        AI 生成
                                    </button>
                                </div>
                                
                                <input 
                                    type="text" 
                                    value={customAudienceName}
                                    onChange={(e) => setCustomAudienceName(e.target.value)}
                                    placeholder="人群包名称 (自动生成)"
                                    className="w-full p-3 border border-gray-200 rounded-lg outline-none bg-white text-sm"
                                />

                                <div className="relative">
                                    <div className="min-h-[48px] p-3 border border-gray-200 rounded-lg bg-white flex flex-wrap gap-2 items-center cursor-text" onClick={() => setShowTagSelector(!showTagSelector)}>
                                        {matchedTags.map(tag => (
                                            <span key={tag} className="bg-blue-50 text-brand-blue px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                                {tag}
                                                <X size={12} className="cursor-pointer hover:text-red-500" onClick={(e) => { e.stopPropagation(); toggleTag(tag); }} />
                                            </span>
                                        ))}
                                        <span className="text-gray-400 text-sm flex items-center gap-1 hover:text-brand-blue transition-colors">
                                            <Plus size={14} /> 添加标签
                                        </span>
                                    </div>
                                    
                                    {showTagSelector && (
                                        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-20">
                                            <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase">推荐标签</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {SYSTEM_AUDIENCE_TAGS.map(tag => (
                                                    <button 
                                                        key={tag}
                                                        onClick={() => toggleTag(tag)}
                                                        className={`px-2 py-1 rounded text-xs transition-colors ${
                                                            matchedTags.includes(tag) 
                                                            ? 'bg-brand-blue text-white' 
                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {tag}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                             <span className="flex items-center gap-1"><Users size={12} /> 预计覆盖人数: <strong className="text-gray-800 text-sm">{estimatedSize.toLocaleString()}</strong> 人</span>
                             {audienceMode === 'create' && <span className="text-brand-blue cursor-pointer hover:underline flex items-center gap-1"><UserPlus size={12} /> 高级选客中心</span>}
                        </div>
                    </div>
                </div>

                {/* Time */}
                <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">{t["goal.duration"]}</label>
                    <div className="flex gap-2">
                        <input 
                            type="number" 
                            value={timeValue}
                            onChange={(e) => setTimeValue(Number(e.target.value))}
                            className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 outline-none"
                        />
                        <select 
                            value={timeUnit}
                            onChange={(e) => setTimeUnit(e.target.value as any)}
                            className="w-24 p-3 border border-gray-200 rounded-lg bg-gray-50 outline-none"
                        >
                            {TIME_UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                </div>

                {/* Budget */}
                <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 flex justify-between">
                        {t["goal.budget"]}
                        <span className="text-xs font-normal text-gray-400">剩余可用: ¥{remainingBudget.toLocaleString()}</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-400">¥</span>
                        <input 
                            type="number" 
                            value={budget}
                            onChange={(e) => setBudget(Number(e.target.value))}
                            className={`w-full pl-8 p-3 border rounded-lg focus:ring-2 outline-none transition-all ${
                                isBudgetOverrun ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-brand-blue/20'
                            }`}
                        />
                    </div>
                    {isBudgetOverrun && (
                        <div className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> 预算超出限额 (¥{remainingBudget.toLocaleString()})
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button 
                    onClick={handleNext}
                    disabled={isBudgetOverrun || !category}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {t["goal.confirm_btn"]} <ArrowRight size={20} />
                </button>
            </div>
        </div>
      )}
    </div>
  );
};
