
import React, { useState, useMemo } from 'react';
import { CATEGORY_OPTIONS } from '../constants';
import { Activity, ApprovalStatus } from '../types';
import { 
  Sparkles, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Edit, 
  Trash2, 
  PlayCircle, 
  PauseCircle,
  XCircle,
  BarChart2,
  PieChart,
  FlaskConical,
  FileBarChart
} from 'lucide-react';
import { translations } from '../i18n';

interface ActivityListProps {
  activities: Activity[];
  onCreateNew: () => void;
  onUpdateStatus: (id: string, newStatus: string) => void;
  onDelete: (id: string) => void;
  onMonitor?: (activity: Activity) => void;
  onReport?: (activity: Activity) => void; // New prop
  lang: 'zh' | 'en';
}

type SortKey = 'budget' | 'startDate' | 'createdTime';
type SortDirection = 'asc' | 'desc';

export const ActivityList: React.FC<ActivityListProps> = ({ activities, onCreateNew, onUpdateStatus, onDelete, onMonitor, onReport, lang }) => {
  const t = translations;

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'createdTime',
    direction: 'desc'
  });

  // Actions
  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleDelete = (id: string) => {
    if (confirm(t["common.delete"] + '?')) {
      onDelete(id);
    }
  };

  // Filtering & Sorting Logic
  const processedActivities = useMemo(() => {
    let result = [...activities];

    // 1. Filter
    if (searchTerm) {
      result = result.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (filterStatus !== 'all') {
      result = result.filter(a => a.status === filterStatus);
    }
    if (filterCategory !== 'all') {
      result = result.filter(a => a.category === filterCategory);
    }

    // 2. Sort
    result.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [activities, searchTerm, filterStatus, filterCategory, sortConfig]);

  // Helpers
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium border border-green-200 whitespace-nowrap"><CheckCircle size={12} /> {t["status.active"]}</span>;
      case 'draft':
        return <span className="flex items-center gap-1 bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200 whitespace-nowrap"><Clock size={12} /> {t["status.draft"]}</span>;
      case 'ended':
        return <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium border border-blue-200 whitespace-nowrap"><AlertCircle size={12} /> {t["status.ended"]}</span>;
      case 'paused':
        return <span className="flex items-center gap-1 bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-300 whitespace-nowrap"><PauseCircle size={12} /> {t["status.paused"]}</span>;
      default:
        return null;
    }
  };

  const getApprovalBadge = (status: ApprovalStatus, reason?: string) => {
     switch (status) {
         case ApprovalStatus.APPROVED:
             return <span className="flex items-center gap-1 text-green-600 text-xs font-medium whitespace-nowrap"><CheckCircle size={12} /> {t["status.approved"]}</span>;
         case ApprovalStatus.REJECTED:
             return (
                 <div className="flex items-center gap-1 text-red-600 text-xs font-medium group relative cursor-help whitespace-nowrap">
                     <XCircle size={12} /> {t["status.rejected"]}
                     {reason && (
                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-800 text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-normal">
                             {reason}
                             <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                         </div>
                     )}
                 </div>
             );
         case ApprovalStatus.PENDING:
             return <span className="flex items-center gap-1 text-orange-500 text-xs font-medium whitespace-nowrap"><Clock size={12} className="animate-spin-slow" /> {t["status.pending"]}</span>;
         default:
             return null;
     }
  };

  const SortIcon = ({ active }: { active: boolean }) => (
    <ArrowUpDown size={14} className={`inline ml-1 transition-opacity ${active ? 'opacity-100 text-brand-blue' : 'opacity-30 group-hover:opacity-60'}`} />
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t["activity.list.title"]}</h2>
          <p className="text-gray-500 text-sm mt-1">{t["activity.list.subtitle"]}</p>
        </div>
        <button 
          onClick={onCreateNew}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 group"
        >
          <Sparkles size={18} className="group-hover:animate-spin-slow" /> 
          {t["activity.create_btn"]}
        </button>
      </div>

      {/* Toolbar Section */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder={t["activity.search_placeholder"]}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 outline-none text-sm transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
            {/* Filters */}
            <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
                <Filter size={16} className="text-gray-400" />
                <select 
                    className="bg-gray-50 border-none text-sm font-medium text-gray-700 focus:ring-0 rounded-lg cursor-pointer hover:bg-gray-100 p-2"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="all">{t["common.all"]}</option>
                    <option value="active">{t["status.active"]}</option>
                    <option value="draft">{t["status.draft"]}</option>
                    <option value="ended">{t["status.ended"]}</option>
                    <option value="paused">{t["status.paused"]}</option>
                </select>
            </div>
            
            <select 
                className="bg-gray-50 border-none text-sm font-medium text-gray-700 focus:ring-0 rounded-lg cursor-pointer hover:bg-gray-100 p-2"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
            >
                <option value="all">{t["common.all"]}</option>
                {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {/* Sticky Columns */}
                        <th className="px-6 py-4 w-28 sticky left-0 z-20 bg-gray-50/80 backdrop-blur-sm">{t["activity.col.id"]}</th>
                        <th className="px-6 py-4 min-w-[200px] sticky left-28 z-20 bg-gray-50/80 backdrop-blur-sm shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">{t["activity.col.name"]}</th>
                        
                        <th className="px-6 py-4 whitespace-nowrap">{t["activity.col.approval"]}</th>
                        <th className="px-6 py-4 whitespace-nowrap">{t["activity.col.status"]}</th>
                        <th className="px-6 py-4 whitespace-nowrap">{t["activity.col.category"]}</th>
                        <th 
                            className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group whitespace-nowrap"
                            onClick={() => handleSort('startDate')}
                        >
                            {t["activity.col.date"]} <SortIcon active={sortConfig.key === 'startDate'} />
                        </th>
                        <th 
                            className="px-6 py-4 text-right cursor-pointer hover:bg-gray-100 transition-colors group"
                            onClick={() => handleSort('budget')}
                        >
                            {t["activity.col.budget"]} <SortIcon active={sortConfig.key === 'budget'} />
                        </th>
                        <th className="px-6 py-4 text-center sticky right-0 z-20 bg-gray-50/80 backdrop-blur-sm shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)] w-32">{t["common.operation"]}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {processedActivities.length > 0 ? (
                        processedActivities.map((activity) => (
                        <tr key={activity.id} className="hover:bg-blue-50/30 transition-colors group">
                            {/* Sticky Cells */}
                            <td className="px-6 py-4 text-xs text-gray-400 font-mono sticky left-0 z-10 bg-white group-hover:bg-blue-50/30">
                                #{activity.id.split('_')[1] || activity.id}
                            </td>
                            <td className="px-6 py-4 sticky left-28 z-10 bg-white group-hover:bg-blue-50/30 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                                <div>
                                    <div className="font-bold text-gray-800 text-sm truncate max-w-[180px]" title={activity.name}>{activity.name}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        {/* A/B Test Badge */}
                                        {activity.schemeDetail?.abTest?.enabled && (
                                            <span className="flex items-center gap-1 bg-purple-50 text-purple-700 text-[10px] px-1.5 py-0.5 rounded border border-purple-100 font-bold" title="包含 A/B 测试">
                                                <FlaskConical size={10} /> A/B
                                            </span>
                                        )}
                                        {/* Report Ready Badge */}
                                        {activity.reportData && (
                                            <span className="flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 rounded border border-blue-100 font-bold" title="复盘报告已生成">
                                                <FileBarChart size={10} /> 报告就绪
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                                {getApprovalBadge(activity.approvalStatus, activity.rejectionReason)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(activity.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200 font-medium">
                                    {activity.category}
                                </span>
                            </td>
                             <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-600 flex items-center gap-1.5">
                                    <Calendar size={14} className="text-gray-400" />
                                    <span>{activity.startDate}</span>
                                    <span className="text-gray-400">→</span>
                                    <span>{activity.endDate}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                                ¥{activity.budget.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 sticky right-0 z-10 bg-white group-hover:bg-blue-50/30 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                                <div className="flex items-center justify-start gap-2">
                                    {/* Report Button for Ended Campaigns */}
                                    {activity.status === 'ended' && onReport && (
                                        <button 
                                            onClick={() => onReport(activity)}
                                            className={`p-1.5 rounded transition-colors ${activity.reportData ? 'text-purple-600 hover:bg-purple-50' : 'text-gray-400 hover:text-purple-500 hover:bg-gray-100'}`}
                                            title={activity.reportData ? "查看报告" : "生成报告"}
                                        >
                                            <PieChart size={16} />
                                        </button>
                                    )}

                                    {/* Monitor Button for Active OR Ended Campaigns */}
                                    {(activity.status === 'active' || activity.status === 'paused' || activity.status === 'ended') && onMonitor && (
                                        <button 
                                            onClick={() => onMonitor(activity)}
                                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-brand-blue transition-colors"
                                            title={t["activity.action.monitor"]}
                                        >
                                            <BarChart2 size={16} />
                                        </button>
                                    )}

                                    <button 
                                        onClick={() => onCreateNew()} 
                                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-brand-blue transition-colors"
                                        title={t["common.edit"]}
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(activity.id)}
                                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                        title={t["common.delete"]}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                                <div className="flex flex-col items-center gap-2">
                                    <Search size={32} className="opacity-20" />
                                    <p>未找到匹配的活动</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
        
        {/* Footer / Pagination (Mock) */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-between items-center text-xs text-gray-500">
            <div>共 {processedActivities.length} 个活动</div>
            <div className="flex gap-2">
                <button className="px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50" disabled>上一页</button>
                <button className="px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50" disabled>下一页</button>
            </div>
        </div>
      </div>
    </div>
  );
};
