
import React, { useState, useMemo, useEffect } from 'react';
import { translations } from '../i18n';
import { 
    Users, Search, Sparkles, Loader2, Save, BarChart3, MapPin, Tag, TrendingUp, UserCheck, 
    Activity, Plus, Edit2, X, AlertCircle, Calendar, User, FileText, Trash2, PieChart,
    ChevronDown, ArrowLeft, Clock, CreditCard, ShoppingBag, Lightbulb, Gift, ArrowRight,
    Filter, MoreHorizontal, Zap, Crown
} from 'lucide-react';
import { analyzeAudienceGoal } from '../services/geminiService';
import { AudienceAnalysisResult, MockAudience, ProfileItem, MarketingRight } from '../types';
import { SYSTEM_AUDIENCE_TAGS } from '../constants';

interface RightRecommendationCardProps {
  right: MarketingRight;
  score?: number;
  reason?: string;
}

const RightRecommendationCard: React.FC<RightRecommendationCardProps> = ({ right, score, reason }) => (
    <div className="bg-white border border-purple-100 rounded-lg p-3 hover:shadow-md transition-all flex items-start gap-3 group relative overflow-hidden">
        {/* Score Background Indicator */}
        {score && (
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-purple-200 to-transparent opacity-30"></div>
        )}
        
        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 text-purple-600 group-hover:bg-purple-100 group-hover:scale-110 transition-all">
            {right.type === 'coupon' ? <CreditCard size={18} /> : 
             right.type === 'gift' ? <Gift size={18} /> : 
             right.type === 'point' ? <Sparkles size={18} /> : <ShoppingBag size={18} />}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
                <h4 className="font-bold text-gray-800 text-sm truncate" title={right.name}>{right.name}</h4>
                {score && (
                    <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        score >= 90 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                        {score}分
                    </div>
                )}
            </div>
            {reason && (
                <div className="text-[10px] text-purple-600 mt-0.5 mb-1.5 flex items-center gap-1">
                    <Sparkles size={8} /> {reason}
                </div>
            )}
            <div className="text-xs text-gray-400 truncate mb-1">{right.description}</div>
            <div className="flex items-center gap-1">
                 {right.tags?.slice(0, 2).map(tag => (
                     <span key={tag} className="text-[10px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded border border-gray-100">{tag}</span>
                 ))}
            </div>
        </div>
    </div>
);

interface ProfileBarProps {
  label: string;
  value: number;
  tgi: number;
  color?: string;
}

const ProfileBar: React.FC<ProfileBarProps> = ({ label, value, tgi, color = 'bg-blue-500' }) => (
    <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-600">{label}</span>
            <div className="flex gap-2">
                <span className="font-bold">{value}%</span>
                <span className={`font-mono text-[10px] px-1 rounded ${tgi > 100 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>TGI {tgi}</span>
            </div>
        </div>
        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div className={`h-full ${color}`} style={{ width: `${value}%` }}></div>
        </div>
    </div>
);

interface AudienceCreationAgentProps {
    audiences: MockAudience[];
    rights: MarketingRight[];
    onSave: (audience: MockAudience) => void;
    onDelete: (id: string) => void;
    onCreateCampaign?: (audience: MockAudience) => void;
}

export const AudienceCreationAgent: React.FC<AudienceCreationAgentProps> = ({ audiences, rights, onSave, onDelete, onCreateCampaign }) => {
    const t = translations;
    const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
    
    // Create/Edit State
    const [input, setInput] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AudienceAnalysisResult | null>(null);
    const [selectedAudience, setSelectedAudience] = useState<MockAudience | null>(null);
    const [editingAudienceId, setEditingAudienceId] = useState<string | null>(null);

    // List View State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTag, setFilterTag] = useState<string>('all');

    // Filter Logic
    const filteredAudiences = useMemo(() => {
        return audiences.filter(aud => {
            const matchesSearch = aud.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTag = filterTag === 'all' || (aud.tags && aud.tags.includes(filterTag));
            return matchesSearch && matchesTag;
        });
    }, [audiences, searchTerm, filterTag]);

    // Available Tags for Filter
    const availableTags = useMemo(() => {
        const tags = new Set<string>();
        audiences.forEach(a => a.tags?.forEach(t => tags.add(t)));
        return Array.from(tags);
    }, [audiences]);

    // --- Recommendation Logic ---
    const getRecommendedRights = (tags: string[] = []) => {
        if (!rights || rights.length === 0) return [];
        const tagStr = tags.join(' ');
        
        return rights.map(r => {
            let score = 60; // Base score
            let reasons: string[] = [];

            // 1. Category Matching (Strongest signal)
            if (r.category && tagStr.includes(r.category)) {
                score += 25;
                reasons.push(`品类偏好: ${r.category}`);
            }
            
            // 2. Tag Matching (Overlap)
            r.tags?.forEach(rt => {
                if (tags.some(at => at.includes(rt) || rt.includes(at))) {
                    score += 10;
                    if (reasons.length === 0) reasons.push(`标签匹配: ${rt}`);
                }
            });

            // 3. Heuristic Rules
            if (tags.some(t => t.includes('高') || t.includes('净值') || t.includes('精致')) && r.costPerUnit > 10) {
                score += 5;
                if (reasons.length === 0) reasons.push("符合高消费力特征");
            }
            if (tags.some(t => t.includes('敏感') || t.includes('特惠') || t.includes('低价')) && (r.type === 'discount' || r.type === 'coupon')) {
                score += 10;
                if (reasons.length === 0) reasons.push("价格敏感度匹配");
            }
            if (tags.some(t => t.includes('车')) && (r.name.includes('停') || r.name.includes('车'))) {
                score += 30;
                reasons[0] = "有车一族精准权益";
            }
            
            // Cap at 99
            score = Math.min(99, score);

            return { right: r, score, reason: reasons[0] || "通用高转化权益" };
        })
        .filter(x => x.score > 65)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3); // Top 3
    };

    // --- Actions ---

    const handleStartCreate = () => {
        setInput('');
        setAnalysisResult(null);
        setEditingAudienceId(null);
        setView('create');
    };

    const handleEdit = (aud: MockAudience) => {
        setInput(aud.description); // Pre-fill
        setEditingAudienceId(aud.id);
        // Simulate "Analysis" result based on existing data to show the form
        setAnalysisResult({
            name: aud.name,
            description: aud.description,
            tags: aud.tags || [],
            estimatedSize: aud.size,
            lookalikeSize: Math.floor(aud.size * 2.5),
            predictedRoi: 0.25, // Mock
            matchScore: 90,
            reasoning: '基于历史数据编辑',
            profile: {
                 // Mock Profile data for edit mode
                 age: [{label: '18-24', value: 15, tgi: 100}, {label: '25-34', value: 50, tgi: 120}, {label: '35+', value: 35, tgi: 90}],
                 gender: [{label: '女性', value: 60, tgi: 110}, {label: '男性', value: 40, tgi: 90}],
                 city: [{label: '一线', value: 40, tgi: 130}, {label: '二线', value: 30, tgi: 100}, {label: '其他', value: 30, tgi: 80}],
                 interest: ['购物', '美食']
            }
        });
        setView('create');
    };

    const handleAnalyze = async () => {
        if (!input.trim()) return;
        setIsAnalyzing(true);
        try {
            const result = await analyzeAudienceGoal(input);
            setAnalysisResult(result);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSave = () => {
        if (!analysisResult) return;
        const newAudience: MockAudience = {
            id: editingAudienceId || `aud_new_${Date.now()}`,
            name: analysisResult.name,
            size: analysisResult.estimatedSize,
            description: analysisResult.description,
            tags: analysisResult.tags,
            creator: 'Admin User',
            createdTime: editingAudienceId ? (audiences.find(a => a.id === editingAudienceId)?.createdTime || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
            lastModified: new Date().toISOString().split('T')[0]
        };
        onSave(newAudience);
        setView('list');
        setInput('');
        setAnalysisResult(null);
        setEditingAudienceId(null);
    };

    const handleViewDetail = (aud: MockAudience) => {
        setSelectedAudience(aud);
        setView('detail');
    };

    const handleDelete = (id: string) => {
        if (confirm(t["common.delete"] + '?')) {
            onDelete(id);
            if (selectedAudience?.id === id) setView('list');
        }
    };

    const handleCreateCampaignAction = (e: React.MouseEvent, aud: MockAudience) => {
        e.stopPropagation();
        if (onCreateCampaign) onCreateCampaign(aud);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center gap-3">
                    {view !== 'list' && (
                        <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            {t["audience.title"]}
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">{t["audience.subtitle"]}</p>
                    </div>
                </div>
                {view === 'list' && (
                    <button 
                        onClick={handleStartCreate}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2 group"
                    >
                        <Sparkles size={18} className="group-hover:animate-spin-slow" /> {t["audience.create"]}
                    </button>
                )}
            </div>

            {/* View: List */}
            {view === 'list' && (
                <div className="flex flex-col gap-6">
                    {/* Toolbar */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 md:max-w-md w-full">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                placeholder={t["audience.search_placeholder"]}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 outline-none text-sm transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <Filter size={16} className="text-gray-400" />
                            <select 
                                className="bg-gray-50 border-none text-sm font-medium text-gray-700 focus:ring-0 rounded-lg cursor-pointer hover:bg-gray-100 p-2 min-w-[120px]"
                                value={filterTag}
                                onChange={(e) => setFilterTag(e.target.value)}
                            >
                                <option value="all">{t["common.all"]}</option>
                                {availableTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAudiences.map(aud => (
                            <div 
                                key={aud.id} 
                                onClick={() => handleViewDetail(aud)}
                                className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group flex flex-col"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-2 bg-blue-50 text-brand-blue rounded-lg group-hover:bg-brand-blue group-hover:text-white transition-colors">
                                        <Users size={20} />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-gray-800">{aud.size.toLocaleString()}</div>
                                        <div className="text-xs text-gray-400">覆盖人数</div>
                                    </div>
                                </div>
                                <h3 className="font-bold text-gray-800 mb-2">{aud.name}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{aud.description}</p>
                                
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {aud.tags?.slice(0, 3).map(tag => (
                                        <span key={tag} className="text-xs px-2 py-0.5 bg-gray-50 text-gray-600 rounded border border-gray-100">{tag}</span>
                                    ))}
                                    {(aud.tags?.length || 0) > 3 && <span className="text-xs text-gray-400 py-0.5">+{ (aud.tags?.length || 0) - 3}</span>}
                                </div>
                                
                                <div className="pt-4 border-t border-gray-50 flex justify-between items-center text-xs text-gray-400">
                                    <span>{aud.createdTime}</span>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={(e) => handleCreateCampaignAction(e, aud)}
                                            className="flex items-center gap-1 px-2 py-1 bg-brand-blue text-white rounded shadow-sm hover:bg-blue-600 transition-colors font-medium"
                                            title={t["audience.action.campaign"]}
                                        >
                                            <Zap size={12} fill="currentColor" /> <span className="text-[10px]">一键营销</span>
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleEdit(aud); }}
                                            className="p-1.5 hover:bg-gray-100 hover:text-gray-700 rounded transition-colors"
                                            title={t["common.edit"]}
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDelete(aud.id); }}
                                            className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded transition-colors"
                                            title={t["common.delete"]}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredAudiences.length === 0 && (
                            <div className="col-span-full py-20 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <Users size={48} className="mx-auto mb-4 opacity-20" />
                                <p>暂未找到匹配的人群包</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* View: Create / Detail */}
            {view !== 'list' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">
                    
                    {/* Main Content Area (Input or Insight) */}
                    <div className="lg:col-span-8 overflow-y-auto space-y-6 pb-20">
                        
                        {/* Create Mode: Input Section */}
                        {view === 'create' && (
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-fade-in">
                                <label className="block text-sm font-bold text-gray-700 mb-2">{t["audience.input_label"]}</label>
                                <div className="relative">
                                    <textarea 
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder={t["audience.placeholder"]}
                                        className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 outline-none text-sm h-32 resize-none"
                                    />
                                    <button 
                                        onClick={handleAnalyze}
                                        disabled={isAnalyzing || !input}
                                        className="absolute right-3 bottom-3 bg-brand-blue text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-opacity-90 disabled:opacity-50 transition-all"
                                    >
                                        {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                        {t["audience.analyze_btn"]}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Analysis / Detail Display */}
                        {(analysisResult || view === 'detail') && (
                            <div className="animate-fade-in space-y-6">
                                {/* Basic Info Card */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">
                                                {view === 'detail' ? selectedAudience?.name : analysisResult?.name}
                                            </h3>
                                            <p className="text-gray-500 text-sm mt-1 max-w-2xl">
                                                {view === 'detail' ? selectedAudience?.description : analysisResult?.description}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-brand-blue">
                                                {(view === 'detail' ? selectedAudience?.size : analysisResult?.estimatedSize)?.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-gray-400">预估规模</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(view === 'detail' ? selectedAudience?.tags : analysisResult?.tags)?.map(tag => (
                                            <span key={tag} className="bg-blue-50 text-brand-blue px-3 py-1 rounded-full text-xs font-bold border border-blue-100 flex items-center gap-1">
                                                <Tag size={10} /> {tag}
                                            </span>
                                        ))}
                                        {view === 'create' && (
                                            <button className="text-xs text-gray-400 flex items-center gap-1 px-2 py-1 hover:text-brand-blue border border-dashed border-gray-300 rounded-full">
                                                <Plus size={12} /> 添加标签
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Deep Insight Charts Grid */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h4 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                                        <BarChart3 size={18} className="text-gray-500" /> {t["audience.detail.insight"]}
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Age Distribution */}
                                        <div>
                                            <h5 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1"><User size={12}/> 年龄分布</h5>
                                            {(analysisResult?.profile?.age || [
                                                {label: '18-24', value: 15, tgi: 90}, {label: '25-34', value: 45, tgi: 120}, {label: '35-44', value: 30, tgi: 105}, {label: '45+', value: 10, tgi: 80}
                                            ]).map((item: any) => (
                                                <ProfileBar key={item.label} label={item.label} value={item.value} tgi={item.tgi} color="bg-blue-500" />
                                            ))}
                                        </div>

                                        {/* City Distribution */}
                                        <div>
                                            <h5 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1"><MapPin size={12}/> 城市分布</h5>
                                            {(analysisResult?.profile?.city || [
                                                {label: '一线城市', value: 40, tgi: 130}, {label: '新一线', value: 30, tgi: 110}, {label: '二线', value: 20, tgi: 90}, {label: '其他', value: 10, tgi: 70}
                                            ]).map((item: any) => (
                                                <ProfileBar key={item.label} label={item.label} value={item.value} tgi={item.tgi} color="bg-purple-500" />
                                            ))}
                                        </div>

                                        {/* Consumption Capability (Moved from right) */}
                                        <div>
                                            <h5 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1"><CreditCard size={12}/> {t["audience.detail.consumption"]}</h5>
                                            <div className="flex gap-2 items-end h-20 mb-2 mt-4">
                                                <div className="flex-1 bg-green-50 rounded-t relative group h-full">
                                                    <div className="absolute bottom-0 w-full bg-green-400 rounded-t transition-all" style={{height: '20%'}}></div>
                                                    <div className="absolute bottom-1 w-full text-center text-[10px] text-green-700 font-bold">低</div>
                                                </div>
                                                <div className="flex-1 bg-green-50 rounded-t relative group h-full">
                                                    <div className="absolute bottom-0 w-full bg-green-500 rounded-t transition-all" style={{height: '50%'}}></div>
                                                    <div className="absolute bottom-1 w-full text-center text-[10px] text-white font-bold">中</div>
                                                </div>
                                                <div className="flex-1 bg-green-50 rounded-t relative group h-full">
                                                    <div className="absolute bottom-0 w-full bg-green-600 rounded-t transition-all" style={{height: '30%'}}></div>
                                                    <div className="absolute bottom-1 w-full text-center text-[10px] text-white font-bold">高</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Active Time (Moved from right) */}
                                        <div>
                                            <h5 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1"><Clock size={12}/> {t["audience.detail.active_time"]}</h5>
                                            <div className="space-y-3 mt-4">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="w-8">早间</span>
                                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-orange-400" style={{width: '20%'}}></div></div>
                                                    <span className="w-8 text-right text-gray-500">20%</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="w-8">午间</span>
                                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-orange-500" style={{width: '35%'}}></div></div>
                                                    <span className="w-8 text-right text-gray-500">35%</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="w-8">晚间</span>
                                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-orange-600" style={{width: '45%'}}></div></div>
                                                    <span className="w-8 text-right text-gray-500">45%</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* New: Gender Distribution (Simplified Bar) */}
                                        <div>
                                            <h5 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1"><Users size={12}/> {t["audience.detail.gender"]}</h5>
                                            <div className="flex h-4 rounded-full overflow-hidden w-full mt-4">
                                                <div className="bg-pink-400 h-full flex items-center justify-center text-[9px] text-white font-bold" style={{width: '60%'}}>60%</div>
                                                <div className="bg-blue-400 h-full flex items-center justify-center text-[9px] text-white font-bold" style={{width: '40%'}}>40%</div>
                                            </div>
                                            <div className="flex justify-between text-xs mt-1 px-1">
                                                <span className="text-pink-500 font-bold">女性</span>
                                                <span className="text-blue-500 font-bold">男性</span>
                                            </div>
                                        </div>

                                        {/* New: Member Level */}
                                        <div>
                                            <h5 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1"><Crown size={12}/> {t["audience.detail.member_level"]}</h5>
                                            <div className="space-y-2 mt-2">
                                                <ProfileBar label="金卡会员" value={20} tgi={150} color="bg-yellow-500" />
                                                <ProfileBar label="银卡会员" value={45} tgi={110} color="bg-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Extended Stats & Actions */}
                    <div className="lg:col-span-4 space-y-6 overflow-y-auto pb-20">
                        {(analysisResult || view === 'detail') ? (
                            <div className="space-y-6 animate-fade-in-up">
                                
                                {/* 1. Action Card */}
                                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-6 rounded-xl shadow-lg text-white">
                                    <h4 className="font-bold text-lg mb-2">一键营销</h4>
                                    <p className="text-indigo-100 text-sm mb-4">立即针对该人群创建精准营销活动，AI 将自动匹配策略。</p>
                                    <button 
                                        onClick={() => {
                                            const aud = view === 'detail' ? selectedAudience! : {
                                                id: 'temp', name: analysisResult!.name, description: analysisResult!.description, size: analysisResult!.estimatedSize, tags: analysisResult!.tags
                                            } as MockAudience;
                                            if (onCreateCampaign) onCreateCampaign(aud);
                                        }}
                                        className="w-full py-2.5 bg-white text-indigo-600 rounded-lg font-bold shadow hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Zap size={18} /> {t["activity.create_btn"]}
                                    </button>
                                </div>

                                {/* 4. Rights Recommendations */}
                                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-5 rounded-xl border border-purple-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-purple-900 text-sm flex items-center gap-2">
                                            <Lightbulb className="text-yellow-500" size={16} />
                                            {t["audience.recommend.rights_title"]}
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        {getRecommendedRights(view === 'detail' ? selectedAudience?.tags : analysisResult?.tags).map((item, idx) => (
                                            <RightRecommendationCard 
                                                key={idx} 
                                                right={item.right} 
                                                score={item.score} 
                                                reason={item.reason}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Save Button (Create Mode Only) */}
                                {view === 'create' && (
                                    <button 
                                        onClick={handleSave}
                                        className="w-full py-3 bg-brand-blue text-white rounded-lg font-bold shadow hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Save size={18} /> {editingAudienceId ? '更新人群包' : '保存人群包'}
                                    </button>
                                )}
                            </div>
                        ) : (
                            // Empty state filler for Create View before analysis
                             <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 h-full flex flex-col items-center justify-center">
                                <Sparkles size={48} className="mb-4 opacity-20" />
                                <p>在左侧输入描述并解析后，<br/>此处将显示深度洞察与建议。</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
