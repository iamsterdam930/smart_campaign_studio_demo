
import React, { useState, useEffect, useRef } from 'react';
import { Activity, MonitorRealTimeData, MonitorLog, MonitorAlert, ABVariantStats } from '../types';
import { translations } from '../i18n';
import { 
  ArrowLeft, PauseCircle, Activity as ActivityIcon, 
  TrendingUp, AlertTriangle, Zap, PlayCircle, ArrowDown, FlaskConical, Star, CheckCircle, BarChart2
} from 'lucide-react';

interface ActivityMonitorProps {
  activity: Activity;
  onBack: () => void;
  onPause: (id: string) => void;
}

export const ActivityMonitor: React.FC<ActivityMonitorProps> = ({ activity, onBack, onPause }) => {
  const t = translations;
  const [isPaused, setIsPaused] = useState(activity.status === 'paused');
  
  // A/B Test Detection
  const hasAbTest = activity.schemeDetail?.abTest?.enabled;
  const variants = activity.schemeDetail?.abTest?.variants || [];
  
  // Real-time Data Simulation
  const [data, setData] = useState<MonitorRealTimeData>({
    reachCount: 15420,
    clickCount: 2315,
    claimCount: 890,
    redeemCount: 412,
    buyCount: 385,
    currentROI: 2.4,
    currentCost: 12500,
    currentGMV: 30000,
    abStats: [] // To be populated
  });

  const [logs, setLogs] = useState<MonitorLog[]>([
    { id: '1', time: '10:42:05', user: 'U82**19', action: '领取了优惠券', detail: '满99减10' },
    { id: '2', time: '10:42:02', user: 'U11**33', action: '点击了活动链接', detail: '来源: 公众号' },
    { id: '3', time: '10:41:58', user: 'U99**21', action: '完成了支付', detail: '金额: ¥128.00' },
  ]);

  const [alert, setAlert] = useState<MonitorAlert | null>(null);

  // Initialize AB Stats if needed
  useEffect(() => {
      if (hasAbTest && data.abStats && data.abStats.length === 0) {
          const stats: ABVariantStats[] = variants.map((v, idx) => ({
              id: idx === 0 ? 'A' : String.fromCharCode(65 + idx),
              name: v === 'CONTROL_NONE' ? '无策略' : (v || 'Variant ' + (idx + 1)),
              traffic: 0,
              conversions: 0,
              cvr: 0,
              roi: 0,
              confidenceInterval: [0, 0],
              chanceToBeat: 0,
              isWinner: false
          }));
          setData(prev => ({ ...prev, abStats: stats }));
      }
  }, [hasAbTest]);

  // Simulate WebSocket / Real-time updates
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setData(prev => {
        // Core metrics update
        const newReach = prev.reachCount + Math.floor(Math.random() * 10);
        const newClick = prev.clickCount + Math.floor(Math.random() * 5);
        const newBuy = prev.buyCount + Math.floor(Math.random() * 2);
        
        // AB Stats Update Logic (Simulated)
        let newAbStats = prev.abStats ? [...prev.abStats] : [];
        if (newAbStats.length > 0) {
            newAbStats = newAbStats.map((stat, idx) => {
                // Simulate B group performing better
                const performanceMultiplier = idx === 1 ? 1.2 : 1.0; 
                
                const newTraffic = stat.traffic + Math.floor(Math.random() * 5);
                const newConversions = stat.conversions + (Math.random() > 0.8 ? 1 : 0) * performanceMultiplier;
                const cvr = newTraffic > 0 ? (newConversions / newTraffic) : 0;
                
                // Mock Statistical Calculations
                const se = Math.sqrt((cvr * (1 - cvr)) / (newTraffic || 1));
                const ciLow = Math.max(0, cvr - 1.96 * se);
                const ciHigh = cvr + 1.96 * se;
                
                // Mock Win Probability (just simplistic for demo)
                // If B, bump up chance
                const chance = idx === 1 ? Math.min(98, stat.chanceToBeat + 0.5) : (100 / newAbStats.length); 

                return {
                    ...stat,
                    traffic: newTraffic,
                    conversions: Math.floor(newConversions),
                    cvr: Number(cvr.toFixed(4)),
                    roi: Number((stat.roi + (Math.random() * 0.05 - 0.02) * performanceMultiplier).toFixed(2)),
                    confidenceInterval: [Number(ciLow.toFixed(4)), Number(ciHigh.toFixed(4))],
                    chanceToBeat: Number(chance.toFixed(1)),
                    isWinner: chance > 95 && newTraffic > 100 // Threshold for winner
                };
            });
        }

        return {
            reachCount: newReach,
            clickCount: newClick,
            claimCount: prev.claimCount + Math.floor(Math.random() * 3),
            redeemCount: prev.redeemCount + Math.floor(Math.random() * 2),
            buyCount: newBuy,
            currentROI: Number((prev.currentROI + (Math.random() * 0.02 - 0.01)).toFixed(2)),
            currentCost: prev.currentCost + Math.floor(Math.random() * 50),
            currentGMV: prev.currentGMV + Math.floor(Math.random() * 200),
            abStats: newAbStats
        };
      });

      // Update Logs
      const actions = ['点击了活动链接', '领取了优惠券', '浏览了商品详情', '加入了购物车'];
      const newLog: MonitorLog = {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
        user: `U${Math.floor(Math.random() * 9000) + 1000}**${Math.floor(Math.random() * 90) + 10}`,
        action: actions[Math.floor(Math.random() * actions.length)],
        detail: '实时追踪'
      };
      setLogs(prev => [newLog, ...prev.slice(0, 4)]);

    }, 3000); 

    return () => clearInterval(interval);
  }, [isPaused]);

  const handlePauseToggle = () => {
      const newStatus = !isPaused;
      setIsPaused(newStatus);
      if (newStatus) {
          onPause(activity.id);
      }
  };

  const handleApplyWinner = (winnerId: string) => {
      alert(`已将流量 100% 切至胜出组 ${winnerId}，其他组已停止。`);
  };

  // KPI Card Component
  const KPICard = ({ title, value, unit, trend, target, isCost = false }: any) => {
      const isPositive = trend > 0;
      const isGood = isCost ? !isPositive : isPositive;
      const diff = value - target;
      const percent = target ? ((diff / target) * 100).toFixed(1) : '0';
      const isAlert = !isCost && parseFloat(percent) < -20; 

      return (
          <div className={`bg-white p-4 rounded-xl border shadow-sm relative overflow-hidden transition-all ${isAlert ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-100'}`}>
              <div className="flex justify-between items-start mb-2">
                  <span className="text-gray-500 text-sm font-medium">{title}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded flex items-center ${isGood ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {isPositive ? '↑' : '↓'} {Math.abs(trend)}%
                  </span>
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-2xl font-bold text-gray-800">{value.toLocaleString()}</span>
                  <span className="text-xs text-gray-400">{unit}</span>
              </div>
              
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-1000 ${isAlert ? 'bg-red-500' : isGood ? 'bg-brand-blue' : 'bg-yellow-500'}`} 
                    style={{ width: `${Math.min((value / (target * 1.2)) * 100, 100)}%` }}
                  ></div>
              </div>
              <div className="flex justify-between text-xs">
                  <span className="text-gray-400">目标: {target.toLocaleString()}</span>
                  <span className={`${isAlert ? 'text-red-500 font-bold' : isGood ? 'text-green-600' : 'text-yellow-600'}`}>
                      {Number(percent) > 0 ? '+' : ''}{percent}%
                  </span>
              </div>
              {isAlert && <AlertTriangle size={16} className="absolute top-2 right-2 text-red-500 animate-pulse" />}
          </div>
      );
  };

  // Funnel Data
  const funnelData = [
      { label: '触达', count: data.reachCount, rate: 100, color: 'bg-blue-500' },
      { label: '点击', count: data.clickCount, rate: Number((data.clickCount / data.reachCount * 100).toFixed(1)), color: 'bg-indigo-500' },
      { label: '领券', count: data.claimCount, rate: Number((data.claimCount / data.clickCount * 100).toFixed(1)), color: 'bg-purple-500' },
      { label: '核销', count: data.redeemCount, rate: Number((data.redeemCount / data.claimCount * 100).toFixed(1)), color: 'bg-pink-500' },
      { label: '购买', count: data.buyCount, rate: Number((data.buyCount / data.redeemCount * 100).toFixed(1)), color: 'bg-green-500' },
  ];

  const maxCount = data.reachCount;

  return (
    <div className="flex flex-col h-full bg-gray-50">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-20">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-gray-800">{activity.name}</h2>
                        <span className={`px-2 py-0.5 text-xs rounded border ${isPaused ? 'bg-gray-100 text-gray-500 border-gray-300' : 'bg-green-50 text-green-600 border-green-200'} font-medium flex items-center gap-1`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-gray-400' : 'bg-green-500 animate-pulse'}`}></div>
                            {isPaused ? t["status.paused"] : t["status.active"]}
                        </span>
                    </div>
                    <div className="text-xs text-gray-500 flex gap-4 mt-1">
                        <span>ID: {activity.id}</span>
                        <span>执行时长: 3天 5小时</span>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-brand-blue bg-blue-50 px-3 py-1.5 rounded-full mr-2">
                    <ActivityIcon size={14} className="animate-pulse" />
                    {t["monitor.refreshing"]}
                </div>
                <button 
                    onClick={handlePauseToggle}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                        isPaused 
                        ? 'bg-green-600 text-white border-green-600 hover:bg-green-700' 
                        : 'bg-white text-red-600 border-red-200 hover:bg-red-50'
                    }`}
                >
                    {isPaused ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
                    {isPaused ? t["activity.action.start"] : t["activity.action.stop"]}
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title={t["monitor.kpi.reach"]} value={data.reachCount} unit="人" trend={5.2} target={20000} />
                <KPICard title={t["monitor.kpi.click"]} value={(data.clickCount / data.reachCount * 100).toFixed(2)} unit="%" trend={-1.5} target={18} />
                <KPICard title={t["monitor.kpi.roi"]} value={data.currentROI} unit="" trend={12} target={2.5} />
                <KPICard title="消耗预算" value={data.currentCost} unit="元" trend={8.5} target={50000} isCost={true} />
            </div>

            {/* Main Content Area: A/B Test (if enabled) + Funnel + Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    
                    {/* A/B Test Dashboard (Conditional) */}
                    {hasAbTest && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col overflow-hidden min-h-[300px]">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <FlaskConical size={18} className="text-purple-600" />
                                    {t["ab.dashboard.title"]}
                                </h3>
                                {data.abStats?.some(s => s.isWinner) && (
                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold flex items-center gap-1 animate-pulse">
                                        <Star size={12} fill="currentColor" /> {t["ab.status.winning"]}
                                    </span>
                                )}
                            </div>

                            {/* AB Stats Table */}
                            <div className="overflow-auto flex-1">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-500">
                                            <th className="px-4 py-2 text-left rounded-l-lg">分组</th>
                                            <th className="px-4 py-2 text-right">{t["ab.metric.traffic"]}</th>
                                            <th className="px-4 py-2 text-right">{t["ab.metric.cvr"]}</th>
                                            <th className="px-4 py-2 text-right">{t["ab.metric.roi"]}</th>
                                            <th className="px-4 py-2 text-center">95% 置信区间</th>
                                            <th className="px-4 py-2 text-right">{t["ab.metric.chance"]}</th>
                                            <th className="px-4 py-2 text-center rounded-r-lg">{t["common.operation"]}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {data.abStats?.map((stat, idx) => (
                                            <tr key={stat.id} className={stat.isWinner ? 'bg-yellow-50/30' : ''}>
                                                <td className="px-4 py-3 font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${idx === 0 ? 'bg-gray-200 text-gray-600' : 'bg-purple-100 text-purple-600'}`}>
                                                            {stat.id}
                                                        </span>
                                                        <div className="flex flex-col">
                                                            <span className="text-gray-800">{idx === 0 ? t["ab.dashboard.control"] : t["ab.dashboard.variant"]}</span>
                                                            <span className="text-[10px] text-gray-400 truncate max-w-[100px]" title={stat.name}>{stat.name}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono">{stat.traffic.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right font-bold text-gray-700">{(stat.cvr * 100).toFixed(2)}%</td>
                                                <td className="px-4 py-3 text-right font-bold text-brand-blue">{stat.roi}</td>
                                                <td className="px-4 py-3">
                                                    {/* Confidence Interval Viz */}
                                                    <div className="flex items-center justify-center w-full h-4 relative">
                                                        <div className="w-24 h-1 bg-gray-200 rounded-full relative">
                                                            <div 
                                                                className={`absolute h-2 top-1/2 -translate-y-1/2 rounded-full ${stat.isWinner ? 'bg-green-500' : 'bg-gray-400'}`}
                                                                style={{ 
                                                                    left: `${Math.min(stat.confidenceInterval[0] * 500, 90)}%`, // Scale for visualization
                                                                    width: `${Math.max((stat.confidenceInterval[1] - stat.confidenceInterval[0]) * 500, 5)}%` 
                                                                }}
                                                            />
                                                            <div 
                                                                className="absolute h-3 w-0.5 bg-black top-1/2 -translate-y-1/2"
                                                                style={{ left: `${Math.min(stat.cvr * 500, 95)}%` }} // Mean marker
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 text-center mt-1">
                                                        [{(stat.confidenceInterval[0]*100).toFixed(1)}%, {(stat.confidenceInterval[1]*100).toFixed(1)}%]
                                                    </div>
                                                </td>
                                                <td className={`px-4 py-3 text-right font-bold ${stat.chanceToBeat > 90 ? 'text-green-600' : 'text-gray-500'}`}>
                                                    {stat.chanceToBeat}%
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {stat.isWinner && (
                                                        <button 
                                                            onClick={() => handleApplyWinner(stat.id)}
                                                            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-colors shadow-sm whitespace-nowrap"
                                                        >
                                                            {t["ab.action.apply"]}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Standard Funnel Chart */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col min-h-[400px]">
                        <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <TrendingUp size={18} className="text-brand-blue" />
                            {t["monitor.funnel"]}
                        </h3>
                        <div className="flex-1 flex flex-col justify-center py-2 px-4">
                            {funnelData.map((step, index) => (
                                <React.Fragment key={step.label}>
                                    <div className="flex items-center h-10 group relative z-10">
                                        <div className="w-14 text-right pr-3 text-sm text-gray-500 font-medium shrink-0">{step.label}</div>
                                        <div className="flex-1 h-full flex items-center relative">
                                            <div 
                                                className={`h-8 rounded-r-lg transition-all duration-500 ${step.color} shadow-sm`}
                                                style={{ width: `${Math.max((step.count / maxCount) * 100, 1)}%` }} 
                                            ></div>
                                            <span className="ml-3 font-bold text-gray-700 text-sm">{step.count.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    {index < funnelData.length - 1 && (
                                        <div className="flex items-center h-8">
                                            <div className="w-14 shrink-0"></div>
                                            <div className="pl-4 flex items-center">
                                                <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                                    <ArrowDown size={10} />
                                                    <span className="font-mono font-medium">{funnelData[index+1].rate}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Logs & Alerts */}
                <div className="flex flex-col gap-6">
                    {/* Live Logs */}
                    <div className="bg-slate-900 text-white rounded-xl shadow-sm p-4 h-full overflow-hidden flex flex-col min-h-[300px]">
                        <h3 className="font-bold text-slate-300 text-xs uppercase mb-3 flex items-center gap-2">
                            <ActivityIcon size={12} /> {t["monitor.logs"]}
                        </h3>
                        <div className="space-y-3 overflow-hidden flex-1 relative">
                            {logs.map((log) => (
                                <div key={log.id} className="text-xs flex items-center gap-2 animate-fade-in-left">
                                    <span className="text-slate-500 font-mono">{log.time}</span>
                                    <span className="text-blue-400 font-medium">{log.user}</span>
                                    <span className="text-slate-300">{log.action}</span>
                                </div>
                            ))}
                            <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-slate-900 to-transparent"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Alert Modal */}
        {alert && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border-t-4 border-red-500 overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-red-100 p-3 rounded-full text-red-600 shrink-0">
                                <AlertTriangle size={28} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-1">{t["monitor.alert.title"]}</h3>
                                <p className="text-sm text-gray-500 mb-2">{alert.time}</p>
                                <p className="text-gray-700 font-medium">{alert.title}</p>
                                <p className="text-sm text-gray-600 mt-2 leading-relaxed bg-red-50 p-3 rounded border border-red-100">
                                    {alert.message}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                        <button 
                            onClick={() => setAlert(null)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors"
                        >
                            {t["monitor.alert.ignore"]}
                        </button>
                        <button 
                            onClick={() => setAlert(null)}
                            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm shadow-md transition-all flex items-center gap-2"
                        >
                            {t["monitor.alert.handle"]}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
