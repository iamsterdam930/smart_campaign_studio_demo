
import React, { useEffect, useState } from 'react';
import { Activity, AttributionReport, AttributionSuggestion } from '../types';
import { generateAttributionReport } from '../services/geminiService';
import { translations } from '../i18n';
import { 
  ArrowLeft, Download, Share2, TrendingUp, AlertTriangle, Lightbulb, 
  BarChart, Target, Zap, ArrowRight, CheckCircle2, Loader2, PieChart,
  Database, Calculator, Sparkles, BrainCircuit, Bell, FlaskConical
} from 'lucide-react';

interface AttributionReportProps {
  activity: Activity;
  onBack: () => void;
  onApplySuggestion: (suggestion: AttributionSuggestion) => void;
  onRunInBackground?: () => void;
  onSaveReport?: (activityId: string, data: AttributionReport) => void; // New prop to save report
}

export const AttributionReportComponent: React.FC<AttributionReportProps> = ({ activity, onBack, onApplySuggestion, onRunInBackground, onSaveReport }) => {
  const t = translations;
  const [report, setReport] = useState<AttributionReport | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Thinking Process State
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    { icon: Database, label: t["report.step.data"] },
    { icon: Calculator, label: t["report.step.calc"] },
    { icon: Sparkles, label: t["report.step.insight"] },
    { icon: BrainCircuit, label: t["report.step.suggestion"] },
  ];

  const hasABTest = activity.schemeDetail?.abTest?.enabled;

  useEffect(() => {
    // If activity already has a cached report, use it immediately
    if (activity.reportData) {
        setReport(activity.reportData);
        setLoading(false);
        return;
    }

    let stepInterval: any;
    
    const fetchReport = async () => {
      setLoading(true);
      setCurrentStep(0);

      // Simulate thinking steps progression
      stepInterval = setInterval(() => {
        setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 1200);

      const data = await generateAttributionReport(activity);
      
      // Inject Mock A/B Conclusion if applicable (Simulating data that might come from backend)
      if (hasABTest) {
          data.abTestConclusion = {
              winner: '方案 B',
              uplift: 12.5,
              confidence: 98.2,
              description: '实验表明，采用“满减叠加”玩法的转化率比对照组高出 12.5%，置信度达到 98%，具备统计显著性。建议后续活动全量推广此玩法。'
          };
      }

      setTimeout(() => {
          setReport(data);
          setLoading(false);
          clearInterval(stepInterval);
          // Save the generated report back to parent
          if (onSaveReport) {
              onSaveReport(activity.id, data);
          }
      }, 500); 
    };

    fetchReport();

    return () => clearInterval(stepInterval);
  }, [activity, hasABTest]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[600px] bg-white rounded-xl shadow-sm p-8 relative overflow-hidden">
        <div className="max-w-md w-full z-10">
            <div className="text-center mb-8">
                <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-brand-blue/20 blur-xl rounded-full animate-pulse"></div>
                    <Loader2 size={64} className="text-brand-blue animate-spin relative z-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">{t["report.generating"]}</h3>
                <p className="text-gray-500 text-sm mt-2">{t["report.generating.wait"]}</p>
            </div>

            <div className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-inner">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    
                    return (
                        <div key={index} className={`flex items-center gap-3 transition-all duration-500 ${isActive || isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                                isActive ? 'bg-white border-brand-blue text-brand-blue animate-pulse' : 
                                'bg-white border-gray-200 text-gray-300'
                            }`}>
                                {isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                            </div>
                            <span className={`text-sm font-medium ${isActive ? 'text-brand-blue' : isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Run in Background Button */}
            <div className="mt-8 text-center">
                <button 
                    onClick={onRunInBackground}
                    className="text-gray-500 hover:text-brand-blue text-sm flex items-center justify-center gap-2 mx-auto px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                    <Bell size={16} />
                    {t["report.generating.bg"]}
                </button>
            </div>
        </div>
        
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x"></div>
      </div>
    );
  }

  if (!report) return null;

  const OverviewCard = ({ label, value, subValue, isGood = true }: any) => (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col items-center text-center">
      <span className="text-sm text-gray-500 mb-1">{label}</span>
      <span className="text-2xl font-bold text-gray-800">{value}</span>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-2 ${isGood ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {subValue}
      </span>
    </div>
  );

  const FactorBar = ({ label, percent, detail, color }: any) => (
    <div className="mb-4 group">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-bold text-gray-700">{label}</span>
        <span className="text-gray-500 font-mono">{percent}% 贡献</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
        <div 
            className={`h-full rounded-full transition-all duration-1000 ${color}`} 
            style={{ width: `${percent}%` }}
        ></div>
      </div>
      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-200 flex items-center gap-2">
        <Zap size={10} className="text-yellow-500" />
        {detail}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto animate-fade-in">
      {/* Header */}
      <div className="bg-brand-blue text-white px-8 py-8 shadow-lg relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <PieChart size={180} />
        </div>
        <div className="relative z-10 flex justify-between items-center">
            <div className="flex items-center gap-5">
                <button 
                    onClick={onBack} 
                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
                    title="返回列表"
                >
                    <ArrowLeft size={22} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold leading-tight">{t["report.title"]}</h1>
                    <div className="flex items-center gap-2 mt-1.5 text-blue-100 text-sm">
                        <span className="font-medium bg-blue-800/30 px-2 py-0.5 rounded">{activity.name}</span>
                        <span className="opacity-80">·</span>
                        <span className="opacity-90">{t["report.subtitle"]}</span>
                    </div>
                </div>
            </div>
            <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium backdrop-blur-sm transition-colors">
                    <Share2 size={18} /> 
                    <span>{t["report.btn.share"]}</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-brand-blue rounded-lg text-sm font-bold shadow-md hover:bg-gray-100 transition-colors">
                    <Download size={18} /> 
                    <span>{t["report.btn.export"]}</span>
                </button>
            </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full p-8 space-y-8 pb-12">
        
        {/* 1. Overview Section */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-800 text-lg mb-6 flex items-center gap-2">
                <Target className="text-brand-blue" /> {t["report.overview"]}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <OverviewCard 
                    label="最终 ROI" 
                    value={report.overview.finalRoi} 
                    subValue={`目标: ${report.overview.targetRoi}`} 
                    isGood={report.overview.finalRoi >= report.overview.targetRoi}
                />
                <OverviewCard 
                    label="总 GMV" 
                    value={`¥${(report.overview.finalGmv / 10000).toFixed(1)}w`} 
                    subValue="超预期 +12%" 
                />
                <OverviewCard 
                    label="总投入成本" 
                    value={`¥${(report.overview.totalCost / 10000).toFixed(1)}w`} 
                    subValue="预算内 ✅" 
                />
                <OverviewCard 
                    label="转化率" 
                    value={`${(report.overview.conversionRate * 100).toFixed(1)}%`} 
                    subValue="环比 +0.8pp" 
                />
            </div>
        </section>

        {/* New: AB Test Conclusion (If available) */}
        {report.abTestConclusion && (
            <section className="bg-purple-50 rounded-xl shadow-sm border border-purple-100 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 text-purple-200">
                    <FlaskConical size={80} />
                </div>
                <h3 className="font-bold text-purple-800 text-lg mb-4 flex items-center gap-2 relative z-10">
                    <FlaskConical className="text-purple-600" /> {t["ab.report.conclusion"]}
                </h3>
                <div className="relative z-10 flex gap-6 items-start">
                    <div className="bg-white p-4 rounded-lg shadow-sm text-center min-w-[120px]">
                        <div className="text-xs text-gray-500 mb-1">胜出组</div>
                        <div className="text-xl font-bold text-purple-700">{report.abTestConclusion.winner}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm text-center min-w-[120px]">
                        <div className="text-xs text-gray-500 mb-1">{t["ab.metric.uplift"]}</div>
                        <div className="text-xl font-bold text-green-600">+{report.abTestConclusion.uplift}%</div>
                    </div>
                    <div className="flex-1 bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
                        <p className="text-sm text-gray-700 leading-relaxed">
                            {report.abTestConclusion.description}
                        </p>
                        <div className="mt-2 text-xs text-gray-400">
                            统计置信度: {report.abTestConclusion.confidence}%
                        </div>
                    </div>
                </div>
            </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 2. Attribution Analysis (Shapley) */}
            <section className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
                <h3 className="font-bold text-gray-800 text-lg mb-6 flex items-center gap-2">
                    <BarChart className="text-purple-600" /> {t["report.attribution"]}
                </h3>
                <div className="flex-1 space-y-2">
                    <FactorBar 
                        label={t["report.factors.audience"]} 
                        percent={report.factors.audience.contribution} 
                        detail={report.factors.audience.detail}
                        color="bg-blue-500" 
                    />
                    <FactorBar 
                        label={t["report.factors.benefit"]} 
                        percent={report.factors.benefit.contribution} 
                        detail={report.factors.benefit.detail}
                        color="bg-purple-500" 
                    />
                    <FactorBar 
                        label={t["report.factors.content"]} 
                        percent={report.factors.content.contribution} 
                        detail={report.factors.content.detail}
                        color="bg-pink-500" 
                    />
                    <FactorBar 
                        label={t["report.factors.channel"]} 
                        percent={report.factors.channel.contribution} 
                        detail={report.factors.channel.detail}
                        color="bg-orange-500" 
                    />
                </div>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-800 border border-blue-100 flex items-start gap-2">
                    <Lightbulb size={16} className="mt-0.5 shrink-0" />
                    <p>
                        <strong>AI 分析结论：</strong> 本次活动成功的首要驱动力是<span className="font-bold underline">人群策略</span>精准，
                        特别是对高价值活跃会员的触达。其次，<span className="font-bold underline">权益力度</span>的设计（8折券）比单纯满减带来了更高的边际贡献。
                    </p>
                </div>
            </section>

            {/* 3. Insights (Anomalies) */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-800 text-lg mb-6 flex items-center gap-2">
                    <AlertTriangle className="text-yellow-500" /> {t["report.insights"]}
                </h3>
                <div className="space-y-4">
                    {report.insights.map(insight => (
                        <div key={insight.id} className={`p-4 rounded-xl border-l-4 shadow-sm ${insight.type === 'positive' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${insight.type === 'positive' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                    {insight.type === 'positive' ? '超预期表现' : '低于预期'}
                                </span>
                                <span className="text-xs text-gray-400 font-mono">Z={insight.zScore}</span>
                            </div>
                            <h4 className="font-bold text-gray-800 text-sm mb-1">{insight.title}</h4>
                            <p className="text-xs text-gray-600 leading-relaxed">{insight.description}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>

        {/* 4. Actionable Suggestions */}
        <section className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl shadow-lg text-white p-8">
            <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                <Lightbulb className="text-yellow-300" /> {t["report.suggestions"]}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {report.suggestions.map(suggestion => (
                    <div key={suggestion.id} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 hover:bg-white/20 transition-all cursor-pointer group">
                        <div className="flex justify-between items-start mb-3">
                            <span className="bg-white/20 px-2 py-1 rounded text-xs font-medium text-white">
                                {suggestion.difficulty === 'Low' ? '易执行' : suggestion.difficulty === 'Medium' ? '中等难度' : '高难度'}
                            </span>
                            <span className="text-green-300 font-bold text-xs">{suggestion.impact}</span>
                        </div>
                        <h4 className="font-bold text-white mb-2">{suggestion.title}</h4>
                        <button 
                            onClick={() => onApplySuggestion(suggestion)}
                            className="w-full mt-4 py-2 bg-white text-brand-blue rounded-lg text-sm font-bold shadow opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all flex items-center justify-center gap-2"
                        >
                            {suggestion.actionLabel} <ArrowRight size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </section>

      </div>
    </div>
  );
};
