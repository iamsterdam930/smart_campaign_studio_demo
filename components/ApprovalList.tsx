
import React, { useState, useMemo } from 'react';
import { Activity, ApprovalStatus, RiskItem, MarketingRight } from '../types';
import { 
    CheckCircle, XCircle, Clock, ChevronRight, FileText, AlertCircle, X, 
    FileCheck, Search, Filter, SortDesc, Calendar, User, ShieldAlert, 
    TrendingDown, BatteryWarning, ArrowRight, CornerUpLeft, Edit3, Check
} from 'lucide-react';
import { translations } from '../i18n';

interface ApprovalListProps {
  activities: Activity[];
  onApprove: (id: string, comment: string, adjustedBudget?: number) => void;
  onReject: (id: string, reason: string) => void;
  onReturn: (id: string, reason: string) => void; // New prop
  lang: 'zh' | 'en';
  availableRights?: MarketingRight[]; // Inject rights for stock check
}

export const ApprovalList: React.FC<ApprovalListProps> = ({ activities, onApprove, onReject, onReturn, lang, availableRights = [] }) => {
  const t = translations;

  const [viewDetailActivity, setViewDetailActivity] = useState<Activity | null>(null); 
  const [rejectReason, setRejectReason] = useState('');
  const [approveComment, setApproveComment] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isReturnMode, setIsReturnMode] = useState(false); // Toggle between Reject and Return
  
  // Adjustment Mode
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustedBudget, setAdjustedBudget] = useState<number>(0);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterApplicant, setFilterApplicant] = useState('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Extract unique creators for filter dropdown
  const creators = useMemo(() => {
    return Array.from(new Set(activities.map(a => a.creator)));
  }, [activities]);

  // Filter Logic
  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
        const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesApplicant = filterApplicant === 'all' || a.creator === filterApplicant;
        return matchesSearch && matchesApplicant;
    }).sort((a, b) => {
        const dateA = new Date(a.createdTime).getTime();
        const dateB = new Date(b.createdTime).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [activities, searchTerm, filterApplicant, sortOrder]);

  const pendingActivities = filteredActivities.filter(a => a.approvalStatus === ApprovalStatus.PENDING);
  const historyActivities = filteredActivities.filter(a => a.approvalStatus !== ApprovalStatus.PENDING);

  // --- Handlers ---

  const handleOpenReject = (activity: Activity, returnMode: boolean = false) => {
    setIsReturnMode(returnMode);
    setRejectReason('');
    setShowRejectModal(true);
    // If not already in detail view, select it implicitly for the modal (simplified for this demo)
    // Note: In this UI design, actions are inside detail view, so viewDetailActivity is already set
  };

  const submitRejectOrReturn = () => {
    if (viewDetailActivity && rejectReason.trim()) {
      if (isReturnMode) {
          onReturn(viewDetailActivity.id, rejectReason);
      } else {
          onReject(viewDetailActivity.id, rejectReason);
      }
      setShowRejectModal(false);
      setViewDetailActivity(null);
    }
  };

  const handleApprove = () => {
      if (!viewDetailActivity) return;
      onApprove(viewDetailActivity.id, approveComment, isAdjusting ? adjustedBudget : undefined);
      setViewDetailActivity(null);
      setIsAdjusting(false);
      setApproveComment('');
  };

  const toggleAdjustMode = () => {
      if (!viewDetailActivity) return;
      setIsAdjusting(!isAdjusting);
      setAdjustedBudget(viewDetailActivity.budget);
  };

  // --- Components ---

  const RiskBadge: React.FC<{ item: RiskItem }> = ({ item }) => {
      const color = item.level === 'high' ? 'text-red-600 bg-red-50 border-red-100' : item.level === 'medium' ? 'text-orange-600 bg-orange-50 border-orange-100' : 'text-blue-600 bg-blue-50 border-blue-100';
      const icon = item.type === 'budget' ? <TrendingDown size={14} /> : item.type === 'stock' ? <BatteryWarning size={14} /> : item.type === 'fatigue' ? <User size={14} /> : <AlertCircle size={14} />;
      
      return (
          <div className={`flex items-start gap-2 p-3 rounded-lg border text-xs ${color}`}>
              <div className="mt-0.5 shrink-0">{icon}</div>
              <div>
                  <div className="font-bold mb-0.5">{item.level === 'high' ? '高风险' : item.level === 'medium' ? '中风险' : '提示'} - {t[`risk.${item.type}` as keyof typeof t]}</div>
                  <div className="opacity-90">{item.message}</div>
              </div>
          </div>
      );
  };

  const ActivityCard: React.FC<{ activity: Activity, isPending: boolean }> = ({ activity, isPending }) => (
    <div 
        onClick={() => setViewDetailActivity(activity)}
        className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex justify-between items-center group cursor-pointer"
    >
        <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${isPending ? 'bg-orange-50 text-orange-600' : activity.approvalStatus === ApprovalStatus.APPROVED ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {activity.approvalStatus === ApprovalStatus.RETURNED ? <CornerUpLeft size={24} /> : <FileText size={24} />}
            </div>
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-800 group-hover:text-brand-blue transition-colors">{activity.name}</h3>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">#{activity.id.split('_')[1]}</span>
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-4">
                    <span className="flex items-center gap-1"><User size={12}/> {activity.creator}</span>
                    <span>¥{activity.budget.toLocaleString()}</span>
                    <span>{activity.createdTime.split(' ')[0]}</span>
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-4">
            {/* Risk Indicator Summary */}
            {activity.riskAssessment && activity.riskAssessment.length > 0 && (
                <div className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full">
                    <ShieldAlert size={12} />
                    {activity.riskAssessment.length} 项风险
                </div>
            )}

            <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    activity.approvalStatus === ApprovalStatus.APPROVED ? 'bg-green-50 text-green-600 border-green-200' :
                    activity.approvalStatus === ApprovalStatus.REJECTED ? 'bg-red-50 text-red-600 border-red-200' :
                    activity.approvalStatus === ApprovalStatus.RETURNED ? 'bg-gray-100 text-gray-600 border-gray-200' :
                    'bg-orange-50 text-orange-600 border-orange-200'
                }`}>
                    {activity.approvalStatus === ApprovalStatus.APPROVED ? t["status.approved"] : 
                     activity.approvalStatus === ApprovalStatus.REJECTED ? t["status.rejected"] :
                     activity.approvalStatus === ApprovalStatus.RETURNED ? t["status.returned"] :
                     t["status.pending"]}
                </span>
                {activity.approvalProcess && (
                    <div className="text-[10px] text-gray-400 mt-1">
                        当前: {activity.approvalProcess.nodes[activity.approvalProcess.currentNodeIndex]?.role || '结束'}
                    </div>
                )}
            </div>
            <ChevronRight size={18} className="text-gray-300" />
        </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">{t["approval.title"]}</h2>
            <p className="text-gray-500 text-sm mt-1">{t["approval.subtitle"]}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 md:max-w-xs">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input 
                  type="text" 
                  placeholder={t["activity.search_placeholder"]}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 outline-none text-sm transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
          
          <div className="flex gap-3">
              <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
                  <Filter size={16} className="text-gray-400" />
                  <select 
                      className="bg-gray-50 border-none text-sm font-medium text-gray-700 focus:ring-0 rounded-lg cursor-pointer hover:bg-gray-100 p-2"
                      value={filterApplicant}
                      onChange={(e) => setFilterApplicant(e.target.value)}
                  >
                      <option value="all">{t["approval.filter.applicant"]}: {t["common.all"]}</option>
                      {creators.map(creator => (
                          <option key={creator} value={creator}>{creator}</option>
                      ))}
                  </select>
              </div>

              <div className="flex items-center gap-2">
                   <SortDesc size={16} className="text-gray-400" />
                   <select 
                       className="bg-gray-50 border-none text-sm font-medium text-gray-700 focus:ring-0 rounded-lg cursor-pointer hover:bg-gray-100 p-2"
                       value={sortOrder}
                       onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
                   >
                       <option value="desc">{t["approval.filter.time_desc"]}</option>
                       <option value="asc">{t["approval.filter.time_asc"]}</option>
                   </select>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Pending Section */}
        <section>
            <div className="flex items-center gap-2 mb-4">
                <Clock className="text-orange-500" size={20} />
                <h3 className="text-lg font-bold text-gray-800">{t["approval.pending_title"]} ({pendingActivities.length})</h3>
            </div>
            {pendingActivities.length > 0 ? (
                <div className="space-y-4">
                    {pendingActivities.map(activity => (
                        <ActivityCard key={activity.id} activity={activity} isPending={true} />
                    ))}
                </div>
            ) : (
                <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400 border border-dashed border-gray-200">
                    <CheckCircle size={40} className="mx-auto mb-2 text-gray-300" />
                    <p>{t["approval.empty_pending"]}</p>
                </div>
            )}
        </section>

        {/* History Section */}
        <section className="mt-8">
             <div className="flex items-center gap-2 mb-4">
                <FileCheck className="text-gray-500" size={20} />
                <h3 className="text-lg font-bold text-gray-800">{t["approval.history_title"]}</h3>
            </div>
            <div className="space-y-4 opacity-80">
                {historyActivities.map(activity => (
                    <ActivityCard key={activity.id} activity={activity} isPending={false} />
                ))}
                {historyActivities.length === 0 && (
                     <div className="text-sm text-gray-400 text-center py-4">{t["approval.empty_history"]}</div>
                )}
            </div>
        </section>
      </div>

      {/* Detail Modal */}
      {viewDetailActivity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col animate-fade-in-up">
                  {/* Modal Header */}
                  <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
                      <div>
                          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                              {viewDetailActivity.name}
                              <span className={`text-xs px-2 py-0.5 rounded border ${
                                  viewDetailActivity.approvalStatus === ApprovalStatus.APPROVED ? 'bg-green-100 text-green-700 border-green-200' : 
                                  viewDetailActivity.approvalStatus === ApprovalStatus.PENDING ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-red-100 text-red-700 border-red-200'
                              }`}>
                                  {viewDetailActivity.approvalStatus === ApprovalStatus.APPROVED ? t["status.approved"] : 
                                   viewDetailActivity.approvalStatus === ApprovalStatus.PENDING ? t["status.pending"] : t["status.rejected"]}
                              </span>
                          </h3>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                             <span>ID: {viewDetailActivity.id}</span>
                             <span>提交人: {viewDetailActivity.creator}</span>
                             <span>提交时间: {viewDetailActivity.createdTime}</span>
                          </div>
                      </div>
                      <button onClick={() => setViewDetailActivity(null)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded transition-colors">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <div className="flex flex-1 overflow-hidden">
                      {/* Left Column: Activity Details */}
                      <div className="w-2/3 overflow-y-auto p-6 border-r border-gray-100">
                          {/* Metrics Highlight */}
                          <div className="grid grid-cols-4 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-xl text-center">
                                    <div className="text-xs text-blue-600 mb-1">总预算</div>
                                    {isAdjusting ? (
                                        <input 
                                            type="number" 
                                            value={adjustedBudget}
                                            onChange={(e) => setAdjustedBudget(Number(e.target.value))}
                                            className="w-full text-center font-bold text-lg border-b-2 border-brand-blue bg-transparent outline-none text-brand-blue"
                                            autoFocus
                                        />
                                    ) : (
                                        <div className="font-bold text-gray-800 text-lg">¥{viewDetailActivity.budget.toLocaleString()}</div>
                                    )}
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl text-center">
                                    <div className="text-xs text-gray-500 mb-1">预期 ROI</div>
                                    <div className="font-bold text-gray-800 text-lg">{viewDetailActivity.roi}</div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl text-center">
                                    <div className="text-xs text-gray-500 mb-1">预估 GMV</div>
                                    <div className="font-bold text-gray-800 text-lg">¥{(viewDetailActivity.budget * viewDetailActivity.roi / 10000).toFixed(1)}万</div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl text-center">
                                    <div className="text-xs text-gray-500 mb-1">人群规模</div>
                                    <div className="font-bold text-gray-800 text-lg">{viewDetailActivity.schemeDetail?.metrics.audienceSize.toLocaleString()}</div>
                                </div>
                          </div>

                          {/* Scheme Detail */}
                          <div className="space-y-6">
                              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-bold text-sm text-gray-700">配置详情</div>
                                  <div className="p-4 grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                      <div><span className="text-gray-500">目标人群:</span> <div className="font-medium mt-1">{viewDetailActivity.schemeDetail?.config.audience}</div></div>
                                      <div><span className="text-gray-500">权益配置:</span> <div className="font-medium mt-1">{viewDetailActivity.schemeDetail?.config.benefit}</div></div>
                                      <div><span className="text-gray-500">触达渠道:</span> <div className="font-medium mt-1">{viewDetailActivity.schemeDetail?.config.channel}</div></div>
                                      <div><span className="text-gray-500">互动玩法:</span> <div className="font-medium mt-1">{viewDetailActivity.schemeDetail?.config.gameplay}</div></div>
                                  </div>
                              </div>

                              {/* AI Risk Assessment */}
                              <div>
                                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                      <ShieldAlert className="text-brand-blue" size={18} /> {t["approval.risk.title"]}
                                  </h4>
                                  <div className="grid grid-cols-1 gap-3">
                                      {viewDetailActivity.riskAssessment && viewDetailActivity.riskAssessment.length > 0 ? (
                                          viewDetailActivity.riskAssessment.map((risk, idx) => (
                                              <RiskBadge key={idx} item={risk} />
                                          ))
                                      ) : (
                                          <div className="p-4 bg-green-50 border border-green-100 rounded-lg text-green-700 flex items-center gap-2 text-sm">
                                              <CheckCircle size={16} /> AI 智能检测未发现显著风险。
                                          </div>
                                      )}
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Right Column: Approval Process & Actions */}
                      <div className="w-1/3 bg-gray-50 p-6 flex flex-col">
                          <h4 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                              <FileCheck size={16} /> {t["approval.process.title"]}
                          </h4>
                          
                          {/* Timeline */}
                          <div className="flex-1 overflow-y-auto mb-4 relative pl-2">
                              {/* Vertical Line */}
                              <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-200"></div>
                              
                              {viewDetailActivity.approvalProcess?.nodes.map((node, index) => {
                                  const isCurrent = index === viewDetailActivity.approvalProcess?.currentNodeIndex;
                                  const isPast = index < (viewDetailActivity.approvalProcess?.currentNodeIndex || 0);
                                  const isRejected = node.status === 'rejected';
                                  
                                  return (
                                      <div key={node.id} className="relative mb-6 pl-10 last:mb-0">
                                          {/* Icon */}
                                          <div className={`absolute left-0 top-0 w-10 h-10 rounded-full border-4 border-gray-50 flex items-center justify-center z-10 ${
                                              isRejected ? 'bg-red-500 text-white' :
                                              node.status === 'approved' ? 'bg-green-500 text-white' :
                                              isCurrent ? 'bg-blue-500 text-white animate-pulse' : 'bg-gray-200 text-gray-400'
                                          }`}>
                                              {isRejected ? <X size={18} /> : 
                                               node.status === 'approved' ? <Check size={18} /> : 
                                               <User size={18} />}
                                          </div>
                                          
                                          {/* Content */}
                                          <div className={`bg-white p-3 rounded-lg border shadow-sm ${isCurrent ? 'border-brand-blue ring-1 ring-brand-blue/20' : 'border-gray-200'}`}>
                                              <div className="flex justify-between items-start mb-1">
                                                  <span className="font-bold text-sm text-gray-800">{node.role}</span>
                                                  <span className={`text-[10px] px-1.5 rounded font-bold ${
                                                      node.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                      node.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                      node.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
                                                  }`}>
                                                      {node.status === 'pending' ? '待审批' : node.status === 'approved' ? '已通过' : node.status === 'rejected' ? '已驳回' : '未开始'}
                                                  </span>
                                              </div>
                                              {node.approverName && <div className="text-xs text-gray-500 mb-1">{node.approverName}</div>}
                                              {node.actionTime && <div className="text-[10px] text-gray-400 font-mono mb-2">{node.actionTime}</div>}
                                              {node.comment && (
                                                  <div className="text-xs bg-gray-50 p-2 rounded text-gray-600 italic border border-gray-100">
                                                      "{node.comment}"
                                                  </div>
                                              )}
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>

                          {/* Actions Panel (Only if Pending) */}
                          {viewDetailActivity.approvalStatus === ApprovalStatus.PENDING && (
                              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mt-auto">
                                  {isAdjusting ? (
                                      <div className="mb-3 p-2 bg-yellow-50 text-yellow-700 text-xs rounded border border-yellow-200">
                                          正在调整模式：您可以修改左侧预算金额。
                                      </div>
                                  ) : null}
                                  
                                  <textarea 
                                      className="w-full p-2 border border-gray-200 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-brand-blue/20 outline-none resize-none h-20"
                                      placeholder={t["approval.modal.approve_placeholder"]}
                                      value={approveComment}
                                      onChange={(e) => setApproveComment(e.target.value)}
                                  ></textarea>
                                  
                                  <div className="grid grid-cols-2 gap-2 mb-2">
                                      <button 
                                          onClick={() => handleOpenReject(viewDetailActivity, true)}
                                          className="py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                                      >
                                          <CornerUpLeft size={14} /> {t["approval.btn.return"]}
                                      </button>
                                      <button 
                                          onClick={toggleAdjustMode}
                                          className={`py-2 border rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 ${
                                              isAdjusting 
                                              ? 'bg-yellow-50 border-yellow-200 text-yellow-700' 
                                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                          }`}
                                      >
                                          <Edit3 size={14} /> {isAdjusting ? '取消调整' : t["approval.btn.adjust"]}
                                      </button>
                                  </div>
                                  
                                  <div className="flex gap-2">
                                      <button 
                                          onClick={() => handleOpenReject(viewDetailActivity, false)}
                                          className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-bold transition-colors"
                                      >
                                          {t["approval.btn.reject"]}
                                      </button>
                                      <button 
                                          onClick={handleApprove}
                                          className="flex-[2] py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2"
                                      >
                                          <CheckCircle size={16} /> 
                                          {isAdjusting ? '确认调整并通过' : t["approval.btn.approve"]}
                                      </button>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Reject/Return Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className={`px-6 py-4 border-b border-gray-100 flex justify-between items-center ${isReturnMode ? 'bg-orange-50' : 'bg-red-50'}`}>
                    <h3 className={`font-bold flex items-center gap-2 ${isReturnMode ? 'text-orange-700' : 'text-red-700'}`}>
                        {isReturnMode ? <CornerUpLeft size={20} /> : <AlertCircle size={20} />} 
                        {isReturnMode ? '退回修改' : t["approval.modal.reject_title"]}
                    </h3>
                    <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-600 mb-4">
                        {isReturnMode 
                            ? `您正在将活动 "${viewDetailActivity?.name}" 退回给申请人修改。`
                            : t["approval.modal.reject_desc"] + ` "${viewDetailActivity?.name}"。`
                        }
                    </p>
                    <textarea 
                        className={`w-full p-3 border rounded-lg focus:ring-2 outline-none text-sm min-h-[100px] resize-none ${
                            isReturnMode ? 'border-orange-200 focus:ring-orange-100' : 'border-gray-200 focus:ring-red-100'
                        }`}
                        placeholder={t["approval.modal.reject_placeholder"]}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        autoFocus
                    />
                </div>
                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                    <button 
                        onClick={() => setShowRejectModal(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        {t["common.cancel"]}
                    </button>
                    <button 
                        onClick={submitRejectOrReturn}
                        disabled={!rejectReason.trim()}
                        className={`px-4 py-2 text-sm font-bold text-white rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                            isReturnMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-red-600 hover:bg-red-700'
                        }`}
                    >
                        {t["common.confirm"]}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
