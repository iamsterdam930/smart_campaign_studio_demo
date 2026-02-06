
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { StepIndicator } from './components/StepIndicator';
import { GoalInput } from './components/GoalInput';
import { SchemeSelection } from './components/SchemeSelection';
import { SchemeFineTuner } from './components/SchemeFineTuner';
import { ApprovalSubmission } from './components/ApprovalSubmission';
import { ActivityList } from './components/ActivityList';
import { ApprovalList } from './components/ApprovalList';
import { ActivityMonitor } from './components/ActivityMonitor'; 
import { AttributionReportComponent } from './components/AttributionReport'; 
import { AudienceCreationAgent } from './components/AudienceCreationAgent'; 
import { DataCenter } from './components/DataCenter'; 
import { FeatureStore } from './components/FeatureStore'; 
import { RightsManagement } from './components/RightsManagement'; 
import { ParsedGoal, Scheme, Activity, ApprovalStatus, AttributionSuggestion, Notification, MockAudience, AttributionReport, MarketingRight, ApprovalProcess, ApprovalNode } from './types';
import { generateSchemes } from './services/geminiService';
import { MOCK_SCHEMES, MOCK_ACTIVITIES, MOCK_AUDIENCES as INITIAL_AUDIENCES, MOCK_RIGHTS as INITIAL_RIGHTS } from './constants';
import { ArrowLeft } from 'lucide-react';
import { translations } from './i18n';

type TabView = 'activities' | 'approvals' | 'create' | 'monitor' | 'report' | 'audience' | 'datacenter' | 'features' | 'rights';

function App() {
  const [activeTab, setActiveTab] = useState<TabView>('activities');
  const [lang, setLang] = useState<'zh'>('zh'); 
  const t = translations;
  
  // Lifted Activity State
  const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES);
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  
  // Lifted Audience State
  const [audiences, setAudiences] = useState<MockAudience[]>(INITIAL_AUDIENCES);

  // Lifted Rights State
  const [rights, setRights] = useState<MarketingRight[]>(INITIAL_RIGHTS);

  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Creation Flow State
  const [currentStep, setCurrentStep] = useState(1);
  const [goal, setGoal] = useState<ParsedGoal | null>(null);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Navigation Handlers
  const handleTabChange = (tab: TabView) => {
    setActiveTab(tab);
    if (tab !== 'create') {
        handleResetCreation();
    }
    setActiveActivityId(null);
  };

  const handleCreateNew = () => {
    setActiveTab('create');
    handleResetCreation();
  };

  const handleMonitorActivity = (activity: Activity) => {
      setActiveActivityId(activity.id);
      setActiveTab('monitor');
  };

  const handleReportActivity = (activity: Activity) => {
      setActiveActivityId(activity.id);
      setActiveTab('report');
  };

  const handleResetCreation = () => {
    setCurrentStep(1);
    setGoal(null);
    setSchemes([]);
    setSelectedScheme(null);
  };

  // --- Logic for Approval Flow Generation ---
  const generateApprovalNodes = (budget: number): ApprovalNode[] => {
      const nodes: ApprovalNode[] = [];
      const createNode = (role: string): ApprovalNode => ({ 
          id: `node_${Date.now()}_${Math.random()}`, 
          role, 
          status: 'pending' 
      });

      // Rules based on PRD
      // < 10k: Operation Supervisor
      nodes.push(createNode('运营主管'));

      // 10k - 50k: + Finance
      if (budget >= 10000) {
          nodes.push(createNode('财务经理'));
      }

      // 50k - 200k: Supervisor -> Director -> Finance
      if (budget >= 50000) {
          // Remove Op Supervisor, add Op Director before Finance? 
          // Re-reading PRD: 5-20w: 运营总监 + 财务. It replaces supervisor or adds? Usually replaces level 1 approval for high stakes or adds on top.
          // Let's assume hierarchy: Supervisor -> Director -> Finance
          const director = createNode('运营总监');
          // Insert Director before Finance (which is last)
          nodes.splice(nodes.length - 1, 0, director);
      }

      // > 200k: + CMO
      if (budget >= 200000) {
          const cmo = createNode('CMO');
          // Insert CMO before Finance
          nodes.splice(nodes.length - 1, 0, cmo);
      }

      return nodes;
  };

  // Activity Logic Handlers
  const handleUpdateStatus = (id: string, currentStatus: string) => {
    setActivities(prev => prev.map(a => {
      if (a.id === id) {
        let newStatus = currentStatus;
        if (currentStatus === 'active') newStatus = 'paused';
        else if (currentStatus === 'paused') newStatus = 'active';
        return { ...a, status: newStatus as any };
      }
      return a;
    }));
  };

  const handleDeleteActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const handleSaveReport = (activityId: string, reportData: AttributionReport) => {
      setActivities(prev => prev.map(a => {
          if (a.id === activityId) {
              return { ...a, reportData };
          }
          return a;
      }));
  };

  // --- Approval Logic Handlers ---

  const handleApprove = (id: string, comment: string, adjustedBudget?: number) => {
    setActivities(prev => prev.map(a => {
        if (a.id === id && a.approvalProcess) {
            const currentIdx = a.approvalProcess.currentNodeIndex;
            const nodes = [...a.approvalProcess.nodes];
            
            // Mark current node as approved
            nodes[currentIdx] = {
                ...nodes[currentIdx],
                status: 'approved',
                approverName: 'Admin User', // Mock current user
                actionTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
                comment: comment
            };

            const nextIdx = currentIdx + 1;
            const isFinalApproval = nextIdx >= nodes.length;

            return { 
                ...a, 
                budget: adjustedBudget || a.budget, // Apply adjustment
                approvalProcess: {
                    nodes: nodes,
                    currentNodeIndex: isFinalApproval ? currentIdx : nextIdx // Stay at last or move next
                },
                // If final approval, change global status
                approvalStatus: isFinalApproval ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING,
                status: isFinalApproval ? 'draft' : 'draft', // Ready to start
                rejectionReason: undefined // Clear previous rejections
            };
        }
        return a;
    }));
  };

  const handleReject = (id: string, reason: string) => {
    setActivities(prev => prev.map(a => {
        if (a.id === id && a.approvalProcess) {
            const currentIdx = a.approvalProcess.currentNodeIndex;
            const nodes = [...a.approvalProcess.nodes];
            
            // Mark current node as rejected
            nodes[currentIdx] = {
                ...nodes[currentIdx],
                status: 'rejected',
                approverName: 'Admin User',
                actionTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
                comment: reason
            };

            return { 
                ...a, 
                approvalStatus: ApprovalStatus.REJECTED,
                rejectionReason: reason,
                status: 'draft',
                approvalProcess: {
                    ...a.approvalProcess,
                    nodes: nodes
                }
            };
        }
        return a;
    }));
  };

  const handleReturn = (id: string, reason: string) => {
      setActivities(prev => prev.map(a => {
          if (a.id === id) {
              return {
                  ...a,
                  approvalStatus: ApprovalStatus.RETURNED, // Special status
                  rejectionReason: reason, // Use rejection field for return reason
                  status: 'draft',
                  // Reset flow? Or keep history? Usually reset flow for re-submission.
                  // For visual history, we might want to keep the old nodes but strictly speaking,
                  // return means going back to the drawing board.
                  // Simplified: Keep logs but set status.
              };
          }
          return a;
      }));
  };

  // Creation Flow Handlers
  const handleGoalSubmit = async (parsedGoal: ParsedGoal) => {
    setGoal(parsedGoal);
    setIsGenerating(true);
    setCurrentStep(2);
    
    let generated = await generateSchemes(parsedGoal);
    if (!generated || generated.length === 0) {
        generated = MOCK_SCHEMES;
    }
    
    setSchemes(generated);
    setIsGenerating(false);
  };

  const handleSchemeSelect = (scheme: Scheme) => {
    setSelectedScheme(scheme);
    setCurrentStep(3);
  };

  const handleFineTuningComplete = (finalScheme: Scheme) => {
    setSelectedScheme(finalScheme);
    setCurrentStep(4);
  };

  const handleSubmitToApproval = (scheme: Scheme) => {
    // Generate nodes based on budget
    const nodes = generateApprovalNodes(scheme.metrics.cost);

    // Create new activity object
    const newActivity: Activity = {
        id: `ACT_${new Date().toISOString().slice(0,10).replace(/-/g,'')}_${Math.floor(Math.random()*100)}`,
        name: scheme.name,
        status: 'draft',
        budget: scheme.metrics.cost,
        roi: scheme.metrics.roi,
        startDate: scheme.startDate || new Date().toISOString().split('T')[0],
        endDate: scheme.endDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        category: '待定', // Simplification
        creator: 'Admin User',
        createdTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
        approvalStatus: ApprovalStatus.PENDING,
        schemeDetail: scheme,
        approvalProcess: {
            nodes: nodes,
            currentNodeIndex: 0
        },
        riskAssessment: [] // Can populate mock risk here
    };

    setActivities(prev => [newActivity, ...prev]);
    setActiveTab('activities');
    handleResetCreation();
  };

  // Attribution Suggestions Logic
  const handleApplySuggestion = (suggestion: AttributionSuggestion) => {
      if (suggestion.type === 'new_activity') {
          setActiveTab('create');
          alert(`已为您预填新建活动信息: "${suggestion.title}"`);
      } else {
          alert(`已应用优化建议: ${suggestion.title}`);
      }
  };

  const handleRunInBackground = (activity: Activity) => {
      setActiveTab('activities');
      setActiveActivityId(null);
      
      // Simulate delay for notification
      setTimeout(() => {
          setNotifications(prev => [{
              id: Date.now().toString(),
              title: '复盘报告已生成',
              message: `活动 "${activity.name}" 的归因报告已准备就绪。`,
              time: '刚刚',
              read: false,
              type: 'success',
              linkActivityId: activity.id
          }, ...prev]);
      }, 5000); 
  };

  const handleReadNotification = (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      const notif = notifications.find(n => n.id === id);
      if (notif && notif.linkActivityId) {
          const activity = activities.find(a => a.id === notif.linkActivityId);
          if (activity) {
              setActiveActivityId(activity.id);
              setActiveTab('report');
          }
      }
  };

  const handleSaveAudience = (newAudience: MockAudience) => {
      setAudiences(prev => [newAudience, ...prev]);
  };

  const handleDeleteAudience = (id: string) => {
      setAudiences(prev => prev.filter(a => a.id !== id));
  };

  // Rights Management Handlers
  const handleSaveRight = (right: MarketingRight) => {
      // Check if updating existing
      const exists = rights.find(r => r.id === right.id);
      if (exists) {
          setRights(prev => prev.map(r => r.id === right.id ? right : r));
      } else {
          setRights(prev => [right, ...prev]);
      }
  };

  const handleDeleteRight = (id: string) => {
      setRights(prev => prev.filter(r => r.id !== id));
  };

  const currentActivityForMonitor = activities.find(a => a.id === activeActivityId);

  return (
    <Layout 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={() => console.log('logout')}
        notifications={notifications}
        onReadNotification={handleReadNotification}
    >
        {activeTab === 'datacenter' && (
            <DataCenter />
        )}

        {activeTab === 'features' && (
            <FeatureStore />
        )}

        {activeTab === 'rights' && (
            <RightsManagement 
                rights={rights}
                onSave={handleSaveRight}
                onDelete={handleDeleteRight}
            />
        )}

        {activeTab === 'activities' && (
            <ActivityList 
                activities={activities}
                onCreateNew={handleCreateNew}
                onUpdateStatus={handleUpdateStatus}
                onDelete={handleDeleteActivity}
                onMonitor={handleMonitorActivity}
                onReport={handleReportActivity}
                lang={lang}
            />
        )}

        {activeTab === 'audience' && (
            <AudienceCreationAgent 
                audiences={audiences}
                onSave={handleSaveAudience}
                onDelete={handleDeleteAudience}
            />
        )}

        {activeTab === 'monitor' && currentActivityForMonitor && (
            <ActivityMonitor 
                activity={currentActivityForMonitor}
                onBack={() => setActiveTab('activities')}
                onPause={(id) => handleUpdateStatus(id, 'active')} // Toggle to pause
            />
        )}

        {activeTab === 'report' && currentActivityForMonitor && (
            <AttributionReportComponent 
                activity={currentActivityForMonitor}
                onBack={() => setActiveTab('activities')}
                onApplySuggestion={handleApplySuggestion}
                onRunInBackground={() => handleRunInBackground(currentActivityForMonitor)}
                onSaveReport={handleSaveReport}
            />
        )}

        {activeTab === 'approvals' && (
            <ApprovalList 
                activities={activities}
                onApprove={handleApprove}
                onReject={handleReject}
                onReturn={handleReturn}
                lang={lang}
                availableRights={rights}
            />
        )}

        {activeTab === 'create' && (
            <div className="flex flex-col h-full">
                {/* Header for Create Flow */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
                     <button onClick={() => setActiveTab('activities')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-500" />
                     </button>
                     <div>
                        <h2 className="text-lg font-bold text-gray-800">{t["common.create"]}</h2>
                        <p className="text-xs text-gray-500">{t["goal.subtitle"]}</p>
                     </div>
                </div>

                <div className="flex-1 overflow-auto pb-10">
                    <StepIndicator currentStep={currentStep} lang={lang} />
                    
                    {currentStep === 1 && <GoalInput onNext={handleGoalSubmit} lang={lang} audiences={audiences} />}
                    
                    {currentStep === 2 && (
                        <SchemeSelection 
                            schemes={schemes} 
                            onSelect={handleSchemeSelect} 
                            isLoading={isGenerating} 
                        />
                    )}

                    {currentStep === 3 && selectedScheme && (
                        <SchemeFineTuner 
                            scheme={selectedScheme} 
                            onNext={handleFineTuningComplete} 
                            onBack={() => setCurrentStep(2)}
                            availableRights={rights} // Pass rights to tuner
                        />
                    )}

                    {currentStep === 4 && selectedScheme && (
                        <ApprovalSubmission 
                            scheme={selectedScheme} 
                            onReset={() => setActiveTab('activities')}
                            onSubmitToApproval={handleSubmitToApproval}
                        />
                    )}
                </div>
            </div>
        )}
    </Layout>
  );
}

export default App;
