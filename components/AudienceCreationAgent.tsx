
import React, { useState, useEffect } from 'react';
import { translations } from '../i18n';
import { 
    Users, Search, Sparkles, Loader2, Save, BarChart3, MapPin, Tag, TrendingUp, UserCheck, 
    Activity, Plus, Edit2, X, AlertCircle, Calendar, User, FileText, Trash2, PieChart,
    ChevronDown, ArrowLeft, Clock, CreditCard, ShoppingBag, Lightbulb
} from 'lucide-react';
import { analyzeAudienceGoal } from '../services/geminiService';
import { AudienceAnalysisResult, MockAudience, ProfileItem } from '../types';
import { SYSTEM_AUDIENCE_TAGS } from '../constants';

interface AudienceCreationAgentProps {
  onSave: (audience: MockAudience) => void;
  onDelete?: (id: string) => void;
  audiences: MockAudience[];
  initialQuery?: string;
}

export const AudienceCreationAgent: React.FC<AudienceCreationAgentProps> = ({ onSave, onDelete, audiences, initialQuery = '' }) => {
  const t = translations;
  
  // State
  const [query, setQuery] = useState(initialQuery);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AudienceAnalysisResult | null>(null);
  
  // Selection State: Initialize with the first audience if available
  const [selectedAudienceId, setSelectedAudienceId] = useState<string | null>(
      audiences.length > 0 ? audiences[0].id : null
  );
  
  // View State
  const [showInsightReport, setShowInsightReport] = useState(false);

  // Editable State for creation
  const [editedName, setEditedName] = useState('');
  const [editedDesc, setEditedDesc] = useState('');
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [showTagSelector, setShowTagSelector] = useState(false);
  
  const [isLookalikeEnabled, setIsLookalikeEnabled] = useState(false);
  const [lookalikeFactor, setLookalikeFactor] = useState(1.5);
  
  const selectedAudience = audiences.find(a => a.id === selectedAudienceId);
  
  // Determine if we are in Creation Mode (no selected ID)
  const isCreating = selectedAudienceId === null;

  // Calculate final size based on slider
  const finalSize = result 
    ? (isLookalikeEnabled ? Math.round(result.estimatedSize * lookalikeFactor) : result.estimatedSize) 
    : 0;

  const handleAnalyze = async () => {
    if (!query.trim()) return;
    setIsAnalyzing(true);
    setResult(null);
    try {
        const analysis = await analyzeAudienceGoal(query);
        setResult(analysis);
        // Initialize editable fields
        setEditedName(analysis.name);
        setEditedDesc(analysis.description);
        setEditedTags(analysis.tags);
        // Reset lookalike defaults
        setIsLookalikeEnabled(false);
        setLookalikeFactor(1.5);
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
      if (!result) return;
      const newAudience: MockAudience = {
          id: `aud_ai_${Date.now()}`,
          name: editedName + (isLookalikeEnabled ? ' (含扩量)' : ''),
          size: finalSize,
          description: editedDesc,
          tags: editedTags,
          lastModified: new Date().toISOString().split('T')[0],
          creator: 'Admin User',
          createdTime: new Date().toISOString().split('T')[0]
      };
      onSave(newAudience);
      // Automatically select the newly created audience to show detail view
      setTimeout(() => setSelectedAudienceId(newAudience.id), 100);
      setResult(null);
      setQuery('');
  };

  const handleCreateNew = () => {
      setResult(null);
      setQuery('');
      setSelectedAudienceId(null); // Triggers creation mode (hides sidebar)
      setShowInsightReport(false);
  };

  const handleCancelCreate = () => {
      // Return to the first audience or remain empty if none exist
      if (audiences.length > 0) {
          setSelectedAudienceId(audiences[0].id);
      } else {
          // If no audiences, we stay in create mode but maybe reset form
          setResult(null);
          setQuery('');
      }
  };

  const handleSelectAudience = (id: string) => {
      setSelectedAudienceId(id);
      setResult(null);
      setShowInsightReport(false);
  };

  const handleDeleteAudience = () => {
      if(selectedAudienceId && onDelete) {
          if(confirm(t["audience.detail.delete_confirm"])) {
              onDelete(selectedAudienceId);
              // Select the previous one or first one, or go to create
              if (audiences.length > 1) {
                  const idx = audiences.findIndex(a => a.id === selectedAudienceId);
                  const newIdx = idx === 0 ? 1 : 0; // fallback logic
                  setSelectedAudienceId(audiences[newIdx]?.id || null);
              } else {
                  setSelectedAudienceId(null);
              }
          }
      }
  };

  const handleAddTag = (tag: string) => {
      if (!editedTags.includes(tag)) {
          setEditedTags([...editedTags, tag]);
      }
      setShowTagSelector(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
      setEditedTags(editedTags.filter(tag => tag !== tagToRemove));
  };

  const handleEditExisting = () => {
      if(!selectedAudience) return;
      setQuery(selectedAudience.description); // Pre-fill query
      setSelectedAudienceId(null); // Switch to create/edit view
  };

  const handleViewInsight = () => {
      setShowInsightReport(true);
  };

  const handleUseExample = (example: string) => {
      setQuery(example);
  };

  // Filter available tags
  const availableTags = SYSTEM_AUDIENCE_TAGS.filter(tag => !editedTags.includes(tag));

  // --- Chart Components ---
  const TgiBadge = ({ value }: { value: number }) => {
      let colorClass = 'bg-gray-100 text-gray-500';
      if (value > 120) colorClass = 'bg-green-100 text-green-700 font-bold';
      else if (value > 100) colorClass = 'bg-blue-50 text-brand-blue';
      else if (value < 80) colorClass = 'bg-red-50 text-red-600';

      return (
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${colorClass} ml-1`} title="TGI (Target Group Index)">
              TGI {value}
          </span>
      );
  };

  const AgeChart = ({ data }: { data: ProfileItem[] }) => {
      const max = Math.max(...data.map(d => d.value));
      return (
          <div className="flex items-end gap-2 h-32 mt-4">
              {data.map(d => (
                  <div key={d.label} className="flex-1 flex flex-col items-center group relative">
                      <div className="text-xs text-gray-500 mb-1 opacity-0 group-hover:opacity-100 absolute -top-6">{d.value}%</div>
                      <div className="flex flex-col items-center w-full">
                          <div 
                            className="w-full bg-blue-200 rounded-t hover:bg-blue-300 transition-all relative" 
                            style={{ height: `${Math.max((d.value / max) * 100, 5)}px` }} 
                          >
                              <div 
                                className={`absolute left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${d.tgi > 100 ? 'bg-green-500' : 'bg-red-400'}`}
                                style={{ bottom: '4px' }}
                                title={`TGI: ${d.tgi}`}
                              ></div>
                          </div>
                      </div>
                      <div className="text-xs text-gray-600 mt-2 font-medium scale-90 whitespace-nowrap">{d.label}</div>
                      <div className={`text-[10px] scale-75 mt-0.5 font-mono ${d.tgi > 100 ? 'text-green-600 font-bold' : 'text-gray-400'}`}>TGI {d.tgi}</div>
                  </div>
              ))}
          </div>
      );
  };

  const GenderChart = ({ data }: { data: ProfileItem[] }) => {
      return (
          <div className="w-full mt-4 space-y-2">
              <div className="flex h-6 rounded-full overflow-hidden">
                {data.map((d, i) => (
                    <div 
                        key={d.label} 
                        className={`${d.label === '女性' ? 'bg-pink-300' : 'bg-blue-300'} h-full flex items-center justify-center text-xs text-white font-medium`} 
                        style={{ width: `${d.value}%` }}
                    >
                        {d.value > 10 && `${d.value}%`}
                    </div>
                ))}
              </div>
              <div className="flex justify-between text-xs px-1">
                  {data.map(d => (
                      <div key={d.label} className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${d.label === '女性' ? 'bg-pink-300' : 'bg-blue-300'}`}></div>
                          <span className="text-gray-600">{d.label}</span>
                          <TgiBadge value={d.tgi} />
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  const CityChart = ({ data }: { data: ProfileItem[] }) => {
      return (
          <div className="space-y-3 mt-4">
              {data.map((c, i) => (
                  <div key={c.label} className="flex items-center text-xs">
                      <span className="w-4 text-gray-300 font-mono">{i+1}</span>
                      <span className="flex-1 text-gray-600 font-medium">{c.label}</span>
                      
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full mr-2 overflow-hidden">
                          <div className="h-full bg-brand-blue rounded-full" style={{ width: `${c.value * 2}%` }}></div> 
                      </div>
                      
                      <span className="w-8 text-right text-gray-800 font-bold mr-2">{c.value}%</span>
                      <span className={`w-12 text-right font-mono ${c.tgi > 100 ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                          {c.tgi}
                      </span>
                  </div>
              ))}
          </div>
      );
  };
  
  const PricePrefChart = ({ data }: { data: {label: string, value: number}[] }) => {
      const max = Math.max(...data.map(d => d.value));
      return (
          <div className="space-y-3 mt-4">
              {data.map((d) => (
                  <div key={d.label} className="flex items-center gap-2">
                      <div className="text-xs text-gray-600 w-16 text-right">{d.label}</div>
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-orange-400 rounded-full"
                            style={{ width: `${(d.value / max) * 100}%` }}
                          ></div>
                      </div>
                      <div className="text-xs font-bold text-gray-700 w-8">{d.value}%</div>
                  </div>
              ))}
          </div>
      );
  };

  const ActiveTimeChart = ({ data }: { data: {label: string, value: number}[] }) => {
      const max = Math.max(...data.map(d => d.value));
      return (
        <div className="flex items-end gap-1 h-32 mt-4 px-2">
            {data.map((d) => (
                <div key={d.label} className="flex-1 h-full flex flex-col justify-end items-center group">
                    <div 
                        className="w-full bg-indigo-200 rounded-t hover:bg-indigo-300 transition-colors relative"
                        style={{ height: `${(d.value / max) * 80}%` }} 
                    >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white px-1.5 py-0.5 rounded shadow-sm z-10 whitespace-nowrap">
                            {d.value}%
                        </div>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-2 whitespace-nowrap scale-90">{d.label}</div>
                </div>
            ))}
        </div>
      );
  };

  const CategoryAffinityChart = ({ data }: { data: {label: string, value: number, tgi: number}[] }) => {
      return (
          <div className="space-y-3 mt-4">
              {data.map((d) => (
                  <div key={d.label} className="flex items-center justify-between text-xs border-b border-gray-50 pb-2">
                      <span className="font-medium text-gray-700">{d.label}</span>
                      <div className="flex items-center gap-4">
                          <span className="text-gray-500">关联度 {d.value}%</span>
                          <span className={`px-1.5 py-0.5 rounded font-mono ${d.tgi >= 100 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              TGI {d.tgi}
                          </span>
                      </div>
                  </div>
              ))}
          </div>
      );
  };

  // Mock Insight Data generator
  const getInsightData = () => {
      return {
          conversionRate: 8.5,
          avgGmv: 245,
          activeRate: 62,
          profile: {
              age: [{label: '18-25', value: 15, tgi: 90}, {label: '26-35', value: 45, tgi: 125}, {label: '36-45', value: 30, tgi: 110}, {label: '45+', value: 10, tgi: 80}],
              gender: [{label: '女性', value: 70, tgi: 130}, {label: '男性', value: 30, tgi: 60}],
              city: [{label: '上海', value: 35, tgi: 180}, {label: '北京', value: 20, tgi: 140}, {label: '杭州', value: 15, tgi: 130}, {label: '深圳', value: 10, tgi: 110}, {label: '成都', value: 10, tgi: 105}],
          },
          // New dimensions
          pricePreference: [
            { label: '低价敏感', value: 15 },
            { label: '中端性价比', value: 45 },
            { label: '高端品质', value: 30 },
            { label: '奢华', value: 10 },
          ],
          activeTime: [
            { label: '0-6点', value: 5 },
            { label: '6-10点', value: 10 },
            { label: '10-14点', value: 25 },
            { label: '14-19点', value: 20 },
            { label: '19-24点', value: 40 },
          ],
          categoryAffinity: [
            { label: '美妆护肤', value: 85, tgi: 150 },
            { label: '时尚女装', value: 60, tgi: 120 },
            { label: '健康保健', value: 40, tgi: 110 },
            { label: '家居日用', value: 35, tgi: 95 },
          ]
      };
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      {/* Global Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                {t["audience.title"]}
            </h2>
            <p className="text-gray-500 text-sm mt-1">{t["audience.subtitle"]}</p>
        </div>
        {!isCreating && (
            <button 
                onClick={handleCreateNew}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 group"
            >
                <Sparkles size={18} className="group-hover:animate-spin-slow" /> {t["audience.list.create_new"]}
            </button>
        )}
      </div>

      <div className="flex-1 flex bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"> 
      
      {/* Sidebar: List (Hidden when creating) */}
      {!isCreating && (
          <div className="w-80 border-r border-gray-200 flex flex-col h-full bg-gray-50">
              <div className="p-4 border-b border-gray-200">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t["audience.list.title"]}</div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
                  {audiences.length === 0 && (
                      <div className="text-center text-gray-400 text-xs py-8">暂无人群包</div>
                  )}
                  {audiences.map(aud => (
                      <div 
                        key={aud.id}
                        onClick={() => handleSelectAudience(aud.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg flex flex-col gap-1 transition-colors cursor-pointer group ${
                            selectedAudienceId === aud.id 
                            ? 'bg-white shadow-sm border border-gray-100' 
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
                        }`}
                      >
                          <div className="flex items-center justify-between">
                              <h4 className={`font-bold text-sm truncate ${selectedAudienceId === aud.id ? 'text-brand-blue' : 'text-gray-800'}`}>{aud.name}</h4>
                              {selectedAudienceId === aud.id && <div className="w-1.5 h-1.5 rounded-full bg-brand-blue"></div>}
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{aud.size.toLocaleString()} 人</span>
                              {aud.tags && aud.tags.length > 0 && <span className="bg-gray-100 px-1.5 rounded truncate max-w-[80px]">{aud.tags[0]}</span>}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto relative bg-white">
          
          {/* Creating View */}
          {isCreating ? (
              <div className="p-8 h-full overflow-y-auto">
                  <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <button 
                                onClick={handleCancelCreate}
                                className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <ArrowLeft size={20} />
                                <span>{t["common.cancel"]}</span>
                            </button>
                            <div className="text-center flex-1 pr-20"> 
                                {/* Center Title if needed, currently empty to align with back button */}
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-1 mb-6">
                            <textarea 
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={t["audience.input_placeholder"]}
                                className="w-full p-4 border-none outline-none resize-none h-32 text-gray-700 bg-transparent text-lg placeholder:text-gray-300"
                            />
                            <div className="bg-gray-50 rounded-b-xl border-t border-gray-100 px-4 py-3 flex justify-between items-center">
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                    {t["audience.input_hint"]}
                                </span>
                                <button 
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing || !query.trim()}
                                    className="bg-brand-blue text-white px-6 py-2 rounded-lg font-bold hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-70 text-sm"
                                >
                                    {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                                    <span>
                                        {isAnalyzing ? "Analyzing..." : (result ? t["audience.btn.reanalyze"] : t["audience.btn.analyze"])}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Guide & Examples - ONLY visible when NO result yet */}
                        {!result && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
                                {/* Left: Paradigm Guide */}
                                <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                                    <h4 className="flex items-center gap-2 font-bold text-gray-700 mb-3 text-sm">
                                        <Lightbulb size={16} className="text-yellow-500" /> 
                                        {t["audience.create.guide_title"]}
                                    </h4>
                                    <div className="bg-white rounded-lg p-3 border border-blue-100 mb-3 shadow-sm">
                                        <div className="flex items-center gap-1 text-sm font-mono text-brand-blue font-bold justify-center bg-blue-50 py-2 rounded">
                                            {t["audience.create.guide_formula"]}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        {t["audience.create.guide_desc"]}
                                    </p>
                                </div>

                                {/* Right: Examples */}
                                <div className="space-y-3">
                                    <h4 className="font-bold text-gray-700 text-sm pl-1">{t["audience.create.examples"]}</h4>
                                    {[
                                        t["audience.create.example1"], 
                                        t["audience.create.example2"], 
                                        t["audience.create.example3"]
                                    ].map((example, i) => (
                                        <button 
                                            key={i}
                                            onClick={() => handleUseExample(example)}
                                            className="w-full text-left p-3 bg-white hover:bg-gray-50 border border-gray-200 hover:border-brand-blue/30 rounded-lg text-xs text-gray-600 transition-all hover:shadow-sm"
                                        >
                                            {example}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Analysis Result */}
                        {result && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in-up mt-8">
                                {/* Header with Save */}
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center sticky top-0 z-10 backdrop-blur-sm">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="bg-green-100 text-green-700 p-2 rounded-full">
                                            <Sparkles size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <input 
                                                value={editedName}
                                                onChange={(e) => setEditedName(e.target.value)}
                                                className="font-bold text-lg text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-brand-blue outline-none transition-colors w-full"
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleSave}
                                        className="bg-brand-blue text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-opacity-90 transition-all flex items-center gap-2 text-sm"
                                    >
                                        <Save size={16} /> {t["common.save"]}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2">
                                    {/* Left: Configuration */}
                                    <div className="p-6 border-r border-gray-100 space-y-6">
                                        
                                        {/* Description */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">人群描述</label>
                                            <textarea 
                                                value={editedDesc}
                                                onChange={(e) => setEditedDesc(e.target.value)}
                                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-1 focus:ring-brand-blue outline-none resize-none h-24"
                                            />
                                        </div>

                                        {/* Tags */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block flex justify-between">
                                                <span>特征标签</span>
                                                <button 
                                                    className="text-brand-blue cursor-pointer flex items-center gap-1 hover:underline text-xs" 
                                                    onClick={() => setShowTagSelector(!showTagSelector)}
                                                >
                                                    <Plus size={12} /> 添加
                                                </button>
                                            </label>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {editedTags.map(tag => (
                                                    <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-medium group">
                                                        <Tag size={10} /> {tag}
                                                        <X 
                                                            size={12} 
                                                            className="cursor-pointer hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" 
                                                            onClick={() => handleRemoveTag(tag)}
                                                        />
                                                    </span>
                                                ))}
                                            </div>
                                            
                                            {/* Tag Selector */}
                                            {showTagSelector && (
                                                <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-lg z-10 animate-fade-in-up">
                                                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                                                        {availableTags.length > 0 ? availableTags.map(tag => (
                                                            <button 
                                                                key={tag}
                                                                onClick={() => handleAddTag(tag)}
                                                                className="px-2 py-1 bg-gray-50 hover:bg-brand-blue hover:text-white rounded border border-gray-100 text-xs transition-colors"
                                                            >
                                                                {tag}
                                                            </button>
                                                        )) : (
                                                            <span className="text-xs text-gray-400">已选择所有标签</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Lookalike */}
                                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2 text-purple-800 font-bold text-sm">
                                                    <UserCheck size={16} /> {t["audience.lookalike"]}
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={isLookalikeEnabled}
                                                        onChange={() => setIsLookalikeEnabled(!isLookalikeEnabled)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                                                </label>
                                            </div>
                                            <p className="text-xs text-gray-500 mb-3">{t["audience.lookalike.desc"]}</p>
                                            
                                            {isLookalikeEnabled && (
                                                <div className="pt-2 border-t border-purple-100">
                                                    <div className="flex justify-between items-center text-xs text-purple-700 mb-2">
                                                        <span className="font-bold">{t["audience.lookalike.factor"]}: {lookalikeFactor}x</span>
                                                        <span>预估规模: <strong>{Math.round(result.estimatedSize * lookalikeFactor).toLocaleString()}</strong></span>
                                                    </div>
                                                    <input 
                                                        type="range" 
                                                        min="1.1" 
                                                        max="3.0" 
                                                        step="0.1"
                                                        value={lookalikeFactor}
                                                        onChange={(e) => setLookalikeFactor(parseFloat(e.target.value))}
                                                        className="w-full h-1.5 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                                    />
                                                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                                        <span>1.1x (精准)</span>
                                                        <span>3.0x (广覆盖)</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Key Metrics */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gray-50 p-3 rounded-lg text-center">
                                                <div className="text-xs text-gray-500 mb-1">{t["audience.result.size"]}</div>
                                                <div className="text-xl font-bold text-gray-800">
                                                    {finalSize.toLocaleString()}
                                                </div>
                                                {isLookalikeEnabled && <div className="text-[10px] text-purple-500 mt-0.5 font-medium">含扩量</div>}
                                            </div>
                                            <div className="bg-green-50 p-3 rounded-lg text-center border border-green-100">
                                                <div className="text-xs text-green-700 mb-1 flex items-center justify-center gap-1">
                                                    <TrendingUp size={12} /> {t["audience.result.roi"]}
                                                </div>
                                                <div className="text-xl font-bold text-green-600">
                                                    +{(result.predictedRoi * 100).toFixed(0)}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Charts */}
                                    <div className="p-6 bg-gray-50/30">
                                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm">
                                            <BarChart3 size={16} /> {t["audience.result.title"]}
                                        </h3>

                                        <div className="space-y-8">
                                            {/* Age */}
                                            <div>
                                                <div className="flex justify-between text-xs text-gray-500 font-medium">
                                                    <span>{t["audience.chart.age"]}</span>
                                                </div>
                                                <AgeChart data={result.profile.age} />
                                            </div>

                                            {/* Gender */}
                                            <div>
                                                <div className="flex justify-between text-xs text-gray-500 font-medium">
                                                    <span>{t["audience.chart.gender"]}</span>
                                                </div>
                                                <GenderChart data={result.profile.gender} />
                                            </div>

                                            {/* City */}
                                            <div>
                                                <div className="flex justify-between text-xs text-gray-500 font-medium border-b border-gray-200 pb-1 mb-2">
                                                    <span>{t["audience.chart.city"]}</span>
                                                    <span className="flex gap-4">
                                                        <span>占比</span>
                                                        <span className="w-12 text-right">{t["audience.chart.tgi"]}</span>
                                                    </span>
                                                </div>
                                                <CityChart data={result.profile.city} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                  </div>
              </div>
          ) : (
              // Viewing existing audience details or report
              <div className="h-full overflow-y-auto w-full">
                  {selectedAudience && (
                    <>
                      {/* Detailed Insight Report View */}
                      {showInsightReport ? (
                        <div className="h-full flex flex-col bg-white animate-fade-in-up">
                            {/* Report Header */}
                            <div className="px-8 py-6 bg-white border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => setShowInsightReport(false)}
                                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">{t["audience.report.title"]}</h2>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span className="bg-blue-50 text-brand-blue px-2 py-0.5 rounded font-medium">{selectedAudience.name}</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="bg-brand-blue text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-opacity-90 transition-all">
                                    导出 PDF
                                </button>
                            </div>
                            
                            {/* Report Content */}
                            <div className="p-8 space-y-8 overflow-y-auto flex-1">
                                {/* Section 1: History Performance */}
                                <section>
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <TrendingUp size={18} className="text-brand-blue" />
                                        {t["audience.report.conversion"]}
                                    </h3>
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                                            <div className="text-sm text-gray-500 mb-1">历史转化率</div>
                                            <div className="text-2xl font-bold text-gray-800">{getInsightData().conversionRate}%</div>
                                            <div className="text-xs text-green-600 mt-1 font-medium">高于大盘 +2.1%</div>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                                            <div className="text-sm text-gray-500 mb-1">平均客单价</div>
                                            <div className="text-2xl font-bold text-gray-800">¥{getInsightData().avgGmv}</div>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                                            <div className="text-sm text-gray-500 mb-1">活跃度评分</div>
                                            <div className="text-2xl font-bold text-gray-800">{getInsightData().activeRate}</div>
                                            <div className="text-xs text-gray-400 mt-1">满分 100</div>
                                        </div>
                                    </div>
                                </section>

                                {/* Section 2: Demographics */}
                                <section>
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Users size={18} className="text-purple-600" />
                                        {t["audience.report.demographics"]}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                                            <h4 className="text-sm font-bold text-gray-600 mb-4">年龄分布 TGI</h4>
                                            <AgeChart data={getInsightData().profile.age} />
                                        </div>
                                        <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                                            <h4 className="text-sm font-bold text-gray-600 mb-4">城市分布 TGI</h4>
                                            <CityChart data={getInsightData().profile.city} />
                                        </div>
                                    </div>
                                </section>
                                
                                {/* Section 3: Business Insights (New) */}
                                <section>
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <ShoppingBag size={18} className="text-orange-500" />
                                        {t["audience.report.behavior"]}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Price Preference */}
                                        <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                                            <div className="flex items-center gap-2 mb-4">
                                                <CreditCard size={14} className="text-gray-400" />
                                                <h4 className="text-sm font-bold text-gray-600">{t["audience.report.price_pref"]}</h4>
                                            </div>
                                            <PricePrefChart data={getInsightData().pricePreference} />
                                        </div>
                                        
                                        {/* Active Time */}
                                        <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Clock size={14} className="text-gray-400" />
                                                <h4 className="text-sm font-bold text-gray-600">{t["audience.report.active_time"]}</h4>
                                            </div>
                                            <ActiveTimeChart data={getInsightData().activeTime} />
                                        </div>

                                        {/* Category Affinity */}
                                        <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Tag size={14} className="text-gray-400" />
                                                <h4 className="text-sm font-bold text-gray-600">{t["audience.report.category_pref"]}</h4>
                                            </div>
                                            <CategoryAffinityChart data={getInsightData().categoryAffinity} />
                                        </div>
                                    </div>
                                </section>

                                {/* Section 4: AI Conclusion */}
                                <section className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                                    <div className="flex gap-3">
                                        <Sparkles className="text-brand-blue shrink-0 mt-1" size={20} />
                                        <div>
                                            <h4 className="font-bold text-brand-blue mb-2">AI 洞察总结</h4>
                                            <p className="text-sm text-gray-700 leading-relaxed">
                                                该人群表现出极高的品牌忠诚度，且是典型的高消费潜力群体。
                                                数据显示其对<span className="font-bold">中高端价格带</span>接受度高，活跃时间集中在<span className="font-bold">晚间 19-24 点</span>，
                                                且与<span className="font-bold">美妆护肤</span>品类有极强的关联性（TGI 150）。
                                                建议后续活动在晚间黄金时段，推送高客单价的美妆组合套装。
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                      ) : (
                        // Normal Detail View
                        <div className="h-full flex flex-col bg-white">
                            {/* Detail Header */}
                            <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-2xl font-bold text-gray-800">{selectedAudience.name}</h2>
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded border border-green-200 font-medium">
                                            {t["status.active"]}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500 font-mono">ID: {selectedAudience.id}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={handleEditExisting}
                                        className="p-2 text-gray-500 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors flex flex-col items-center gap-1"
                                        title={t["common.edit"]}
                                    >
                                        <Edit2 size={20} />
                                        <span className="text-[10px]">{t["common.edit"]}</span>
                                    </button>
                                    <button 
                                        onClick={handleDeleteAudience}
                                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex flex-col items-center gap-1"
                                        title={t["common.delete"]}
                                    >
                                        <Trash2 size={20} />
                                        <span className="text-[10px]">{t["common.delete"]}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Detail Content */}
                            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 overflow-y-auto">
                                {/* Left Info Column */}
                                <div className="md:col-span-2 space-y-8">
                                    {/* Metrics Row */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <div className="text-sm text-gray-500 mb-1">{t["audience.detail.size"]}</div>
                                            <div className="text-2xl font-bold text-gray-800">{selectedAudience.size.toLocaleString()}</div>
                                        </div>
                                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                            <div className="text-sm text-blue-600 mb-1">{t["audience.detail.update_time"]}</div>
                                            <div className="text-lg font-bold text-blue-900">{selectedAudience.lastModified}</div>
                                        </div>
                                    </div>

                                    {/* Description & Conditions */}
                                    <div>
                                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <FileText size={18} className="text-gray-400" />
                                            {t["audience.detail.conditions"]}
                                        </h3>
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 leading-relaxed">
                                            {selectedAudience.description}
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    <div>
                                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <Tag size={18} className="text-gray-400" />
                                            {t["audience.result.tags"]}
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedAudience.tags?.map(tag => (
                                                <span key={tag} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-600 shadow-sm">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Meta Column */}
                                <div className="space-y-6">
                                    <div className="p-5 border border-gray-100 rounded-xl shadow-sm">
                                        <h4 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">基本信息</h4>
                                        <div className="space-y-4 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 flex items-center gap-2"><User size={14}/> {t["audience.detail.creator"]}</span>
                                                <span className="font-medium text-gray-800">{selectedAudience.creator || 'Admin User'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 flex items-center gap-2"><Calendar size={14}/> {t["audience.detail.create_time"]}</span>
                                                <span className="font-medium text-gray-800">{selectedAudience.createdTime || '2023-10-01'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Report Action */}
                                    <div className="bg-gradient-to-br from-brand-blue to-blue-700 rounded-xl p-5 text-white shadow-lg relative overflow-hidden group cursor-pointer" onClick={handleViewInsight}>
                                        <div className="relative z-10">
                                            <h4 className="font-bold text-lg mb-1">{t["audience.detail.insight"]}</h4>
                                            <p className="text-blue-100 text-xs mb-3">查看该人群的历史转化表现与画像分布</p>
                                            <div className="inline-flex items-center gap-1 text-sm font-bold bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors">
                                                <PieChart size={16} /> 点击查看
                                            </div>
                                        </div>
                                        <PieChart size={80} className="absolute -bottom-4 -right-4 text-white/10 group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                      )}
                    </>
                  )}
              </div>
          )}
      </div>
      </div>
    </div>
  );
};
