
export enum StrategyType {
  BALANCED = '平衡型',
  PRECISION = '精准型',
  EXPANSION = '扩量型',
  INNOVATION = '创新型'
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  RETURNED = 'returned' // New status for "Return for Revision"
}

export interface Metrics {
  roi: number;
  gmv: number;
  cost: number;
  audienceSize: number;
  conversionRate: number;
}

export interface ABTestConfig {
  enabled: boolean;
  variable: 'benefit' | 'channel' | 'gameplay' | null;
  variants: string[]; 
  controlTrafficPercent?: number; 
  allocationMode?: 'static' | 'dynamic_mab'; 
  confidenceLevel?: number; 
  minSampleSize?: number; 
  estimatedDuration?: number; 
}

export interface ABVariantStats {
  id: string; 
  name: string; 
  traffic: number;
  conversions: number;
  cvr: number; 
  roi: number;
  confidenceInterval: [number, number]; 
  pValue?: number; 
  chanceToBeat: number; 
  isWinner?: boolean;
}

export interface Scheme {
  id: string;
  name: string;
  type: StrategyType;
  description: string;
  tags: string[]; 
  audienceTags?: string[]; 
  metrics: Metrics;
  config: {
    audience: string;
    benefit: string;
    gameplay: string;
    channel: string;
  };
  abTest?: ABTestConfig;
  startDate?: string;
  endDate?: string;
  confidence: 'high' | 'medium' | 'low';
  confidenceReason: string;
}

export interface ParsedGoal {
  category: string;
  targetType: string;
  targetAudienceName: string; 
  targetAudienceFeatures: string; 
  targetAudienceFeaturesTags?: string[]; 
  targetAudienceTags?: string[]; 
  suggestedTags?: string[]; 
  timeValue: number;
  timeUnit: '天' | '小时';
  budget: number;
  originalText: string;
}

export interface AIOption {
  schemes: Scheme[];
}

export interface ProfileItem {
  label: string;
  value: number; 
  tgi: number;   
}

export interface AudienceProfile {
  age: ProfileItem[]; 
  gender: ProfileItem[]; 
  city: ProfileItem[]; 
  interest: string[]; 
}

export interface AudienceAnalysisResult {
  name: string;
  description: string;
  tags: string[];
  estimatedSize: number;
  lookalikeSize: number; 
  predictedRoi: number;
  profile: AudienceProfile;
  matchScore: number; 
  reasoning: string; 
}

export interface MockAudience {
  id: string;
  name: string;
  size: number;
  description: string;
  tags?: string[];
  lastModified?: string;
  creator?: string; 
  createdTime?: string; 
}

export interface MockBudgetInfo {
  total: number;
  used: number;
}

export interface AttributionFactor {
  name: string;
  contribution: number; 
  uplift: number; 
  detail: string; 
}

export interface AttributionInsight {
  id: string;
  type: 'positive' | 'negative';
  title: string;
  description: string;
  zScore: number;
  dataPoint: string; 
}

export interface AttributionSuggestion {
  id: string;
  type: 'new_activity' | 'template' | 'config';
  title: string;
  impact: string; 
  difficulty: 'Low' | 'Medium' | 'High';
  actionLabel: string; 
}

export interface AttributionReport {
  activityId: string;
  generatedTime: string;
  overview: {
    finalRoi: number;
    targetRoi: number;
    finalGmv: number;
    totalCost: number;
    conversionRate: number;
  };
  factors: {
    audience: AttributionFactor;
    benefit: AttributionFactor;
    content: AttributionFactor;
    channel: AttributionFactor;
  };
  abTestConclusion?: {
    winner: string;
    uplift: number;
    confidence: number;
    description: string;
  };
  insights: AttributionInsight[];
  suggestions: AttributionSuggestion[];
}

// --- New Approval Types ---

export interface ApprovalNode {
  id: string;
  role: string; // e.g. "运营主管", "财务经理"
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  approverName?: string;
  actionTime?: string;
  comment?: string;
}

export interface ApprovalProcess {
  nodes: ApprovalNode[];
  currentNodeIndex: number;
}

export interface RiskItem {
  type: 'fatigue' | 'budget' | 'stock' | 'conversion';
  level: 'low' | 'medium' | 'high';
  message: string;
}

export interface Activity {
  id: string;
  name: string;
  status: 'active' | 'draft' | 'ended' | 'paused';
  budget: number;
  roi: number;
  startDate: string;
  endDate: string;
  category: string;
  creator: string;
  createdTime: string;
  approvalStatus: ApprovalStatus;
  rejectionReason?: string;
  schemeDetail?: Scheme; 
  reportData?: AttributionReport; 
  // New Fields
  approvalProcess?: ApprovalProcess;
  riskAssessment?: RiskItem[];
}

// Monitor Types
export interface MonitorRealTimeData {
  reachCount: number;
  clickCount: number;
  claimCount: number;
  redeemCount: number;
  buyCount: number;
  currentROI: number;
  currentCost: number;
  currentGMV: number;
  abStats?: ABVariantStats[]; 
}

export interface MonitorLog {
  id: string;
  time: string;
  user: string;
  action: string;
  detail: string;
}

export interface MonitorAlert {
  id: string;
  type: 'warning' | 'error';
  title: string;
  message: string;
  time: string;
  status: 'active' | 'ignored' | 'resolved';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'success' | 'info';
  linkActivityId?: string;
}

// --- Data Center & MDIP Types ---

export interface DataSource {
  id: string;
  name: string;
  type: 'file' | 'db' | 'api';
  status: 'connected' | 'syncing' | 'error' | 'pending';
  lastSyncTime: string;
  records: number;
  qualityScore: number;
}

export interface DataTable {
  id: string;
  dataSourceId: string;
  name: string;
  description: string;
  rowCount: number;
  updateTime: string;
}

export interface DataColumn {
  tableId: string;
  name: string;
  type: string;
  description: string;
  isPrimaryKey?: boolean;
}

export interface MDIPField {
  key: string;
  label: string;
  required: boolean;
  type: string;
  description: string;
}

export interface DataMapping {
  sourceField: string;
  targetField: string | null;
  confidence?: number; 
}

export interface QualityReport {
  totalRows: number;
  nullRate: { field: string; rate: number; isCritical: boolean }[];
  uniqueCheck: { field: string; passed: boolean; duplicateCount: number };
  anomalies: { field: string; count: number; desc: string }[];
  score: number;
}

export interface GeneratedFeature {
  id: string;
  tableId?: string; 
  name: string;
  code: string;
  categories: string[]; 
  description: string;
  status: 'draft' | 'published' | 'calculating' | 'pending';
  ruleSql?: string; 
  creationType?: 'auto' | 'manual' | 'ai'; 
}

// --- Rights Management Types ---

export type RightType = 'coupon' | 'discount' | 'point' | 'gift' | 'virtual';

export interface MarketingRight {
  id: string;
  name: string;
  type: RightType;
  value: string; 
  totalStock: number;
  usedStock: number;
  costPerUnit: number; 
  category?: string; 
  description?: string;
  tags?: string[]; 
  status: 'active' | 'inactive';
  validityDate?: string; 
}
