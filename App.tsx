
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { ActivityList } from './components/ActivityList';
import { ApprovalList } from './components/ApprovalList';
import { GoalInput } from './components/GoalInput';
import { SchemeSelection } from './components/SchemeSelection';
import { SchemeFineTuner } from './components/SchemeFineTuner';
import { ApprovalSubmission } from './components/ApprovalSubmission';
import { ActivityMonitor } from './components/ActivityMonitor';
import { AttributionReportComponent } from './components/AttributionReport';
import { AudienceCreationAgent } from './components/AudienceCreationAgent';
import { DataCenter } from './components/DataCenter';
import { FeatureStore } from './components/FeatureStore';
import { RightsManagement } from './components/RightsManagement';
import { StepIndicator } from './components/StepIndicator';
import { generateSchemes } from './services/geminiService';
import { MOCK_ACTIVITIES, MOCK_AUDIENCES, MOCK_RIGHTS } from './constants';
import { Activity, ApprovalStatus, Scheme, ParsedGoal, MockAudience, MarketingRight, AttributionReport, Notification } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'activities' | 'approvals' | 'create' | 'monitor' | 'report' | 'audience' | 'datacenter' | 'features' | 'rights'>('activities');
  
  // Data State
  const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES);
  const [audiences, setAudiences] = useState<MockAudience[]>(MOCK_AUDIENCES);
  const [rights, setRights] = useState<MarketingRight[]>(MOCK_RIGHTS);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Workflow State
  const [createStep, setCreateStep] = useState(1);
  const [currentGoal, setCurrentGoal] = useState<ParsedGoal | null>(null);
  const [generatedSchemes, setGeneratedSchemes] = useState<Scheme[]>([]);
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [isGeneratingSchemes, setIsGeneratingSchemes] = useState(false);
  const [initialAudienceForCreate, setInitialAudienceForCreate] = useState<MockAudience | null>(null);
  
  // Monitor/Report State
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);

  // Handlers
  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    if (tab === 'create') {
      setCreateStep(1);
      setCurrentGoal(null);
      setGeneratedSchemes([]);
      setSelectedScheme(null);
      setInitialAudienceForCreate(null);
    }
  };

  const handleGoalSubmit = async (goal: ParsedGoal) => {
    setCurrentGoal(goal);
    setCreateStep(2);
    setIsGeneratingSchemes(true);
    const schemes = await generateSchemes(goal);
    setGeneratedSchemes(schemes);
    setIsGeneratingSchemes(false);
  };

  const handleSchemeSelect = (scheme: Scheme) => {
    setSelectedScheme(scheme);
    setCreateStep(3);
  };

  const handleFineTuneSubmit = (finalScheme: Scheme) => {
    setSelectedScheme(finalScheme);
    setCreateStep(4);
  };

  const handleSubmitToApproval = (scheme: Scheme) => {
    const newActivity: Activity = {
      id: `ACT_${Date.now()}`,
      name: scheme.name,
      status: 'draft',
      budget: scheme.metrics.cost,
      roi: scheme.metrics.roi,
      startDate: scheme.startDate || new Date().toISOString().split('T')[0],
      endDate: scheme.endDate || new Date().toISOString().split('T')[0],
      category: '全部', // Simplified
      creator: 'Admin User',
      createdTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
      approvalStatus: ApprovalStatus.PENDING,
      schemeDetail: scheme
    };

    setActivities([newActivity, ...activities]);
    addNotification('新活动已提交审批', `活动 "${newActivity.name}" 等待审核`);
    setActiveTab('activities');
  };

  const handleApprove = (id: string, comment: string, adjustedBudget?: number) => {
    setActivities(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          approvalStatus: ApprovalStatus.APPROVED,
          status: 'active', // Auto start for demo
          budget: adjustedBudget || a.budget
        };
      }
      return a;
    }));
    addNotification('活动已批准', `活动 ID: ${id} 已通过审核`);
  };

  const handleReject = (id: string, reason: string) => {
    setActivities(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          approvalStatus: ApprovalStatus.REJECTED,
          rejectionReason: reason
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
          approvalStatus: ApprovalStatus.RETURNED,
          rejectionReason: reason
        };
      }
      return a;
    }));
  };

  const handleDeleteActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const handleMonitor = (activity: Activity) => {
    setCurrentActivity(activity);
    setActiveTab('monitor');
  };

  const handleReport = (activity: Activity) => {
    setCurrentActivity(activity);
    setActiveTab('report');
  };

  const handleSaveReport = (id: string, report: AttributionReport) => {
      setActivities(prev => prev.map(a => {
          if (a.id === id) {
              return { ...a, reportData: report };
          }
          return a;
      }));
  };

  // Audience Handlers
  const handleSaveAudience = (aud: MockAudience) => {
    // Check if updating existing
    const exists = audiences.find(a => a.id === aud.id);
    if (exists) {
        setAudiences(prev => prev.map(a => a.id === aud.id ? aud : a));
        addNotification('人群包已更新', aud.name);
    } else {
        setAudiences([aud, ...audiences]);
        addNotification('人群包已创建', aud.name);
    }
  };
  
  const handleDeleteAudience = (id: string) => {
    setAudiences(prev => prev.filter(a => a.id !== id));
  };

  const handleCreateCampaignFromAudience = (aud: MockAudience) => {
      setInitialAudienceForCreate(aud);
      setActiveTab('create');
      setCreateStep(1);
  };

  // Rights Handlers
  const handleSaveRight = (right: MarketingRight) => {
      const exists = rights.find(r => r.id === right.id);
      if (exists) {
          setRights(rights.map(r => r.id === right.id ? right : r));
      } else {
          setRights([right, ...rights]);
      }
      addNotification('权益已保存', right.name);
  };

  const handleDeleteRight = (id: string) => {
      setRights(rights.filter(r => r.id !== id));
  };

  const addNotification = (title: string, message: string) => {
    const newNotif: Notification = {
      id: Date.now().toString(),
      title,
      message,
      time: new Date().toLocaleTimeString(),
      read: false,
      type: 'info'
    };
    setNotifications([newNotif, ...notifications]);
  };

  const handleLogout = () => {
    alert("Logged out");
  };

  const renderContent = () => {
    if (activeTab === 'create') {
      return (
        <div className="pb-20">
          <StepIndicator currentStep={createStep} lang="zh" />
          {createStep === 1 && <GoalInput onNext={handleGoalSubmit} lang="zh" audiences={audiences} initialAudience={initialAudienceForCreate} />}
          {createStep === 2 && <SchemeSelection schemes={generatedSchemes} onSelect={handleSchemeSelect} isLoading={isGeneratingSchemes} />}
          {createStep === 3 && selectedScheme && <SchemeFineTuner scheme={selectedScheme} onNext={handleFineTuneSubmit} onBack={() => setCreateStep(2)} availableRights={rights} />}
          {createStep === 4 && selectedScheme && <ApprovalSubmission scheme={selectedScheme} onSubmitToApproval={handleSubmitToApproval} onReset={() => setActiveTab('activities')} />}
        </div>
      );
    }

    if (activeTab === 'monitor' && currentActivity) {
      return <ActivityMonitor activity={currentActivity} onBack={() => setActiveTab('activities')} onPause={(id) => {}} />;
    }

    if (activeTab === 'report' && currentActivity) {
      return (
        <AttributionReportComponent 
            activity={currentActivity} 
            onBack={() => setActiveTab('activities')} 
            onApplySuggestion={() => {}} 
            onSaveReport={handleSaveReport}
        />
      );
    }

    switch (activeTab) {
      case 'activities':
        return (
          <ActivityList 
            activities={activities} 
            onCreateNew={() => handleTabChange('create')} 
            onUpdateStatus={() => {}} 
            onDelete={handleDeleteActivity}
            onMonitor={handleMonitor}
            onReport={handleReport}
            lang="zh"
          />
        );
      case 'approvals':
        return (
          <ApprovalList 
            activities={activities} 
            onApprove={handleApprove} 
            onReject={handleReject} 
            onReturn={handleReturn}
            lang="zh"
            availableRights={rights}
          />
        );
      case 'audience':
        return (
          <AudienceCreationAgent 
            audiences={audiences} 
            rights={rights}
            onSave={handleSaveAudience} 
            onDelete={handleDeleteAudience}
            onCreateCampaign={handleCreateCampaignFromAudience}
          />
        );
      case 'datacenter':
        return <DataCenter />;
      case 'features':
        return <FeatureStore />;
      case 'rights':
        return <RightsManagement rights={rights} onSave={handleSaveRight} onDelete={handleDeleteRight} />;
      default:
        return null;
    }
  };

  return (
    <Layout 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        onLogout={handleLogout}
        notifications={notifications}
    >
      {renderContent()}
    </Layout>
  );
}
