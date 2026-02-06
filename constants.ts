
import { StrategyType, Scheme, MockAudience, MockBudgetInfo, Activity, ApprovalStatus, AttributionReport, MDIPField, DataSource, DataTable, DataColumn, GeneratedFeature, MarketingRight, ApprovalProcess, RiskItem } from './types';

export const COLORS = {
  brandBlue: '#3587e6',
  success: '#28A745',
  warning: '#FFC107',
  error: '#DC3545',
};

export const AB_TEST_THRESHOLD = 5000; 
export const MAX_VARIANTS = 10;

// Dropdown Options
export const CATEGORY_OPTIONS = ['不限', '洗护', '美妆', '食品', '母婴', '家居', '服饰'];
export const TARGET_TYPE_OPTIONS = ['复购提升', '流失召回', '拉新获客', '新品推广', '库存清理'];
export const TIME_UNIT_OPTIONS = ['天', '小时'];

// System Tags for AI matching
export const SYSTEM_AUDIENCE_TAGS = [
  '高净值', '价格敏感', '沉睡用户', '活跃会员', 'Z世代', 
  '精致妈妈', '新锐白领', '小镇青年', '近30天复购', 
  '高退货率', '促销偏好', '新品尝鲜'
];

// Helper for recent dates
const getRecentDate = (daysOffset: number = 0, hoursOffset: number = 0): string => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    date.setHours(date.getHours() + hoursOffset);
    return date.toISOString().split('T')[0];
};

const getRecentDateTime = (daysOffset: number = 0, hoursOffset: number = 0): string => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    date.setHours(date.getHours() + hoursOffset);
    return date.toISOString().slice(0, 16).replace('T', ' ');
};

// Data Center MDIP Standard Fields (Protocol Definition)
export const MDIP_STANDARD_FIELDS: MDIPField[] = [
  { key: 'user_id', label: '用户ID', required: true, type: 'String', description: '用户唯一标识' },
  { key: 'mobile', label: '手机号', required: true, type: 'String', description: '加密后的手机号' },
  { key: 'registration_time', label: '注册时间', required: true, type: 'Datetime', description: '用户首次注册时间' },
  { key: 'last_order_time', label: '最近下单时间', required: true, type: 'Datetime', description: '用于计算 R 值' },
  { key: 'total_order_amount', label: '历史订单总额', required: true, type: 'Decimal', description: '用于计算 M 值' },
  { key: 'total_order_count', label: '历史订单总数', required: true, type: 'Integer', description: '用于计算 F 值' },
  { key: 'gender', label: '性别', required: false, type: 'Enum', description: 'M/F/U' },
  { key: 'city', label: '常驻城市', required: false, type: 'String', description: '用户所在城市' },
  { key: 'member_level', label: '会员等级', required: false, type: 'Integer', description: '0-5级' },
  { key: 'birthday', label: '出生日期', required: false, type: 'Date', description: '用于年龄段计算' },
];

export const MOCK_DATA_SOURCES: DataSource[] = [
  { 
    id: 'ds_1', 
    name: 'CRM_Core_DB', 
    type: 'db', 
    status: 'connected', 
    lastSyncTime: getRecentDateTime(0, -1), // 1 hour ago
    records: 1250000, 
    qualityScore: 98 
  },
  { 
    id: 'ds_2', 
    name: 'WeChat_Fans_Export', 
    type: 'file', 
    status: 'connected', 
    lastSyncTime: getRecentDateTime(-1, -4), // Yesterday
    records: 58000, 
    qualityScore: 92 
  },
];

export const MOCK_TABLES: DataTable[] = [
    { id: 'tb_1', dataSourceId: 'ds_1', name: 'dwd_user_basic_info', description: '用户基础信息表', rowCount: 1250000, updateTime: getRecentDateTime(0, -2) },
    { id: 'tb_2', dataSourceId: 'ds_1', name: 'dwd_trade_order_detail', description: '交易订单详情表', rowCount: 15600000, updateTime: getRecentDateTime(0, -1) },
    { id: 'tb_3', dataSourceId: 'ds_1', name: 'dim_sku_info', description: '商品SKU维度表', rowCount: 4500, updateTime: getRecentDateTime(-1, 0) },
    { id: 'tb_4', dataSourceId: 'ds_2', name: 'ods_wx_fans_list', description: '微信粉丝原始列表', rowCount: 58000, updateTime: getRecentDateTime(-2, 0) },
];

export const MOCK_COLUMNS: DataColumn[] = [
    // Users Table
    { tableId: 'tb_1', name: 'user_id', type: 'VARCHAR(64)', description: '用户唯一标识', isPrimaryKey: true },
    { tableId: 'tb_1', name: 'mobile_hash', type: 'VARCHAR(128)', description: '加密手机号' },
    { tableId: 'tb_1', name: 'reg_source', type: 'VARCHAR(20)', description: '注册来源' },
    { tableId: 'tb_1', name: 'gender', type: 'CHAR(1)', description: 'M/F' },
    { tableId: 'tb_1', name: 'birthday', type: 'DATE', description: '生日' },
    { tableId: 'tb_1', name: 'vip_level', type: 'INT', description: '会员等级' },
    
    // Orders Table
    { tableId: 'tb_2', name: 'order_id', type: 'VARCHAR(64)', description: '订单号', isPrimaryKey: true },
    { tableId: 'tb_2', name: 'user_id', type: 'VARCHAR(64)', description: '用户ID' },
    { tableId: 'tb_2', name: 'pay_amount', type: 'DECIMAL(10,2)', description: '实付金额' },
    { tableId: 'tb_2', name: 'pay_time', type: 'DATETIME', description: '支付时间' },
    { tableId: 'tb_2', name: 'sku_id', type: 'VARCHAR(32)', description: '商品ID' },
];

export const MOCK_FEATURES: GeneratedFeature[] = [
    { 
        id: 'ft_1', tableId: 'tb_2', name: '近90天消费总额', code: 'r90_pay_amt', categories: ['RFM', 'Lifecycle'], 
        description: '最近3个月内用户的实际支付金额汇总', status: 'published', creationType: 'auto',
        ruleSql: 'SELECT user_id, SUM(pay_amount) as r90_pay_amt \nFROM dwd_trade_order_detail \nWHERE pay_time >= DATE_SUB(NOW(), INTERVAL 90 DAY) \nGROUP BY user_id'
    },
    { 
        id: 'ft_2', tableId: 'tb_2', name: '高价值流失预警', code: 'risk_high_val_churn', categories: ['Risk', 'RFM'], 
        description: '历史消费>1000元且近60天无交易', status: 'draft', creationType: 'ai',
        ruleSql: `SELECT user_id, 1 as risk_flag \nFROM dwd_trade_order_detail \nGROUP BY user_id \nHAVING SUM(pay_amount) > 1000 \nAND MAX(pay_time) < DATE_SUB(NOW(), INTERVAL 60 DAY)`
    },
    {
        id: 'ft_3', tableId: 'tb_1', name: '会员等级', code: 'basic_vip_lvl', categories: ['Custom'],
        description: '直接映射会员等级字段', status: 'published', creationType: 'manual',
        ruleSql: 'SELECT user_id, vip_level FROM dwd_user_basic_info'
    }
];

export const MOCK_RIGHTS: MarketingRight[] = [
    {
        id: 'r_1', name: '8折优惠券(满59可用)', type: 'discount', value: '80%', 
        totalStock: 50000, usedStock: 42000, costPerUnit: 12, category: '洗护', 
        description: '适用于洗护品类，有效期30天', tags: ['高核销', '复购'], status: 'active'
    },
    {
        id: 'r_2', name: '满99减10券', type: 'coupon', value: '10', 
        totalStock: 100000, usedStock: 15000, costPerUnit: 10, category: '通用', 
        description: '全场通用券，低门槛', tags: ['拉新', '低成本'], status: 'active'
    },
    {
        id: 'r_3', name: '满49减5券', type: 'coupon', value: '5', 
        totalStock: 200000, usedStock: 50000, costPerUnit: 5, category: '通用', 
        description: '新人首单福利', tags: ['召回', '价格敏感'], status: 'active'
    },
    {
        id: 'r_4', name: '新品洗护试用装', type: 'gift', value: '1', 
        totalStock: 5000, usedStock: 4800, costPerUnit: 25, category: '洗护', 
        description: '包含洗发水+护发素小样', tags: ['高价值', '库存告急'], status: 'active'
    },
    {
        id: 'r_5', name: '美妆小样礼包', type: 'gift', value: '1', 
        totalStock: 10000, usedStock: 2000, costPerUnit: 40, category: '美妆', 
        description: '粉底液+口红小样', tags: ['高价值', '尝鲜'], status: 'active'
    },
    {
        id: 'r_6', name: '双倍积分卡', type: 'point', value: '2x', 
        totalStock: 999999, usedStock: 12000, costPerUnit: 1, category: '通用', 
        description: '次日生效，有效期24小时', tags: ['促活'], status: 'active'
    },
    {
        id: 'r_7', name: '爱奇艺月卡', type: 'virtual', value: '1', 
        totalStock: 2000, usedStock: 1950, costPerUnit: 15, category: '虚拟', 
        description: '跨界合作权益', tags: ['Z世代', '库存告急'], status: 'active'
    }
];

// Mock Audiences for matching
export const MOCK_AUDIENCES: MockAudience[] = [
  { 
    id: 'aud_1', 
    name: '洗护-高价值活跃会员', 
    size: 15000, 
    description: '近90天购买过洗护，客单价>200', 
    tags: ['高净值', '活跃会员', '洗护偏好'],
    creator: 'Admin User',
    createdTime: getRecentDate(-15),
    lastModified: getRecentDate(-2)
  },
  { 
    id: 'aud_2', 
    name: '全品类-沉睡用户', 
    size: 50000, 
    description: '近180天无购买记录',
    tags: ['沉睡用户', '流失风险'],
    creator: '张三',
    createdTime: getRecentDate(-30),
    lastModified: getRecentDate(-5)
  },
  { 
    id: 'aud_3', 
    name: '美妆-潜力新客', 
    size: 12000, 
    description: '浏览过美妆未转化',
    tags: ['潜客', '美妆', 'Z世代'],
    creator: '李四',
    createdTime: getRecentDate(-10),
    lastModified: getRecentDate(-1)
  },
  { 
    id: 'aud_4', 
    name: '母婴-复购人群', 
    size: 8000, 
    description: '购买过奶粉/尿裤，周期性复购',
    tags: ['母婴', '高频'],
    creator: '王五',
    createdTime: getRecentDate(-5),
    lastModified: getRecentDate(0)
  },
];

// Mock Budget Data (Category -> Budget Info)
export const MOCK_CATEGORY_BUDGETS: Record<string, MockBudgetInfo> = {
  '洗护': { total: 100000, used: 45000 },
  '美妆': { total: 200000, used: 180000 }, 
  '食品': { total: 50000, used: 10000 },
  '母婴': { total: 150000, used: 60000 },
  '家居': { total: 80000, used: 20000 },
  '服饰': { total: 120000, used: 90000 },
  '不限': { total: 500000, used: 200000 }, 
};

export const MOCK_SCHEMES: Scheme[] = [
  {
    id: '1',
    name: '洗护复购平衡方案',
    type: StrategyType.BALANCED,
    description: '平衡覆盖率和ROI，针对中等规模人群投放中等面额券。',
    tags: ['⭐ 推荐', '稳健'],
    audienceTags: ['活跃会员', '近30天复购'],
    startDate: getRecentDate(1),
    endDate: getRecentDate(15),
    metrics: {
      roi: 2.8,
      gmv: 320000,
      cost: 114000,
      audienceSize: 15000,
      conversionRate: 0.085,
    },
    config: {
      audience: '近90天购买过洗护品类，且活跃度中等',
      benefit: '8折优惠券(满59可用)', // Matches mock right name
      gameplay: '满减叠加',
      channel: '企微 1V1 (晚8点)',
    },
    confidence: 'high',
    confidenceReason: '基于15个类似历史活动数据',
  },
  {
    id: '2',
    name: '高价值人群深耕',
    type: StrategyType.PRECISION,
    description: '最大化ROI，针对高意向人群投放低面额高门槛券。',
    tags: ['高ROI', '精准狙击'],
    audienceTags: ['高净值', '促销偏好'],
    startDate: getRecentDate(1),
    endDate: getRecentDate(15),
    metrics: {
      roi: 3.5,
      gmv: 180000,
      cost: 51000,
      audienceSize: 8000,
      conversionRate: 0.12,
    },
    config: {
      audience: '洗护品类 Top 20% 价值用户',
      benefit: '满99减10券', // Matches mock right name
      gameplay: '积分加倍',
      channel: '短信 + APP Push',
    },
    confidence: 'high',
    confidenceReason: '模型预测置信度 > 90%',
  },
  {
    id: '3',
    name: '广泛覆盖扩量',
    type: StrategyType.EXPANSION,
    description: '最大化覆盖人数，使用低门槛券激活沉睡用户。',
    tags: ['广撒网', '召回'],
    audienceTags: ['沉睡用户', '价格敏感'],
    startDate: getRecentDate(1),
    endDate: getRecentDate(15),
    metrics: {
      roi: 2.2,
      gmv: 450000,
      cost: 204500,
      audienceSize: 28000,
      conversionRate: 0.05,
    },
    config: {
      audience: '近180天未购买洗护品类用户',
      benefit: '满49减5券', // Matches mock right name
      gameplay: '直接领券',
      channel: '公众号推送',
    },
    confidence: 'medium',
    confidenceReason: '基于行业基准数据',
  },
];

// Mock Cached Report
const MOCK_REPORT_DATA: AttributionReport = {
    activityId: 'ACT_20230901_05',
    generatedTime: getRecentDate(-1, 0),
    overview: {
        finalRoi: 1.95,
        targetRoi: 1.8,
        finalGmv: 45000,
        totalCost: 23000,
        conversionRate: 0.042
    },
    factors: {
        audience: { name: '人群策略', contribution: 35, uplift: 10, detail: '美妆潜客转化率高' },
        benefit: { name: '权益力度', contribution: 30, uplift: 8, detail: '新品试用装核销率 95%' },
        content: { name: '文案创意', contribution: 20, uplift: 5, detail: '种草类文案点击率高' },
        channel: { name: '触达渠道', contribution: 15, uplift: 2, detail: '短信渠道表现平平' }
    },
    insights: [
        { id: '1', type: 'positive', title: 'Z世代人群响应超预期', description: 'Z世代人群在新品试用装的领取率上比平均高出 40%。', zScore: 2.8, dataPoint: '领取率' },
        { id: '2', type: 'negative', title: '35岁+人群流失较高', description: '该年龄段用户点击后跳出率达 60%。', zScore: -2.1, dataPoint: '跳出率' }
    ],
    suggestions: [
        { id: 's1', type: 'template', title: '固化“新品试用+回购券”模板', impact: '效率提升 50%', difficulty: 'Low', actionLabel: '保存模板' },
        { id: 's2', type: 'config', title: '剔除 35岁+ 低活人群', impact: 'ROI +0.2', difficulty: 'Low', actionLabel: '立即优化' }
    ]
};

// Mock Activities for List View
export const MOCK_ACTIVITIES: Activity[] = [
  { 
    id: 'ACT_20231020_01', 
    name: '双11洗护品类复购大促', 
    status: 'ended', 
    budget: 50000, 
    roi: 3.2, 
    startDate: getRecentDate(-20), 
    endDate: getRecentDate(-5),
    category: '洗护',
    creator: '张三',
    createdTime: getRecentDateTime(-25, 0),
    approvalStatus: ApprovalStatus.APPROVED,
    schemeDetail: MOCK_SCHEMES[0],
    approvalProcess: {
        currentNodeIndex: 2,
        nodes: [
            { id: 'node1', role: '运营主管', status: 'approved', approverName: 'Admin User', actionTime: getRecentDateTime(-24, 0), comment: '方案合理，同意' },
            { id: 'node2', role: '财务经理', status: 'approved', approverName: '李财务', actionTime: getRecentDateTime(-23, 0) }
        ]
    }
  },
  { 
    id: 'ACT_20230901_05', 
    name: '美妆新品尝鲜季', 
    status: 'ended', 
    budget: 20000, 
    roi: 1.8, 
    startDate: getRecentDate(-45), 
    endDate: getRecentDate(-30),
    category: '美妆',
    creator: '李四',
    createdTime: getRecentDateTime(-50, 0),
    approvalStatus: ApprovalStatus.APPROVED,
    schemeDetail: MOCK_SCHEMES[1],
    reportData: MOCK_REPORT_DATA 
  },
  { 
    id: 'ACT_20231115_02', 
    name: '母婴沉睡用户召回', 
    status: 'draft', 
    budget: 10000, 
    roi: 0, 
    startDate: getRecentDate(2), 
    endDate: getRecentDate(10),
    category: '母婴',
    creator: '王五',
    createdTime: getRecentDateTime(-1, 0),
    approvalStatus: ApprovalStatus.REJECTED,
    rejectionReason: '预算过低，无法覆盖目标人群，请重新调整预算或人群范围。',
    schemeDetail: MOCK_SCHEMES[2],
    approvalProcess: {
        currentNodeIndex: 0,
        nodes: [
            { id: 'node1', role: '运营主管', status: 'rejected', approverName: 'Admin User', actionTime: getRecentDateTime(0, -1), comment: '预算过低，无法覆盖目标人群' }
        ]
    }
  },
  { 
    id: 'ACT_20231101_08', 
    name: '冬季服饰清仓', 
    status: 'active', 
    budget: 80000, 
    roi: 4.5, 
    startDate: getRecentDate(-2), 
    endDate: getRecentDate(12),
    category: '服饰',
    creator: '赵六',
    createdTime: getRecentDateTime(-3, 0),
    approvalStatus: ApprovalStatus.APPROVED,
    schemeDetail: { 
        ...MOCK_SCHEMES[0], 
        abTest: { 
            enabled: true, 
            variable: 'benefit', 
            variants: ['8折券', '满减券'],
            controlTrafficPercent: 50,
            allocationMode: 'static',
            confidenceLevel: 0.95,
            minSampleSize: 2000,
            estimatedDuration: 3
        } 
    },
    approvalProcess: {
        currentNodeIndex: 2,
        nodes: [
            { id: 'node1', role: '运营主管', status: 'approved', approverName: '王主管', actionTime: getRecentDateTime(-3, -2) },
            { id: 'node2', role: '财务经理', status: 'approved', approverName: 'Admin User', actionTime: getRecentDateTime(-3, -1) },
            { id: 'node3', role: '运营总监', status: 'approved', approverName: '赵总', actionTime: getRecentDateTime(-3, 0) }
        ]
    }
  },
  { 
    id: 'ACT_20231201_03', 
    name: '家居用品年终大促', 
    status: 'draft', 
    budget: 120000, 
    roi: 0, 
    startDate: getRecentDate(10), 
    endDate: getRecentDate(20),
    category: '家居',
    creator: '张三',
    createdTime: getRecentDateTime(0, -2), // 2 hours ago
    approvalStatus: ApprovalStatus.PENDING,
    schemeDetail: { ...MOCK_SCHEMES[1], name: '家居用品年终大促', metrics: { ...MOCK_SCHEMES[1].metrics, cost: 120000, gmv: 350000, roi: 2.9 } },
    approvalProcess: {
        currentNodeIndex: 1, // Waiting for node 2
        nodes: [
            { id: 'node1', role: '运营主管', status: 'approved', approverName: '张主管', actionTime: getRecentDateTime(0, -1), comment: '同意' },
            { id: 'node2', role: '财务经理', status: 'pending' },
            { id: 'node3', role: '运营总监', status: 'pending' }
        ]
    },
    riskAssessment: [
        { type: 'budget', level: 'medium', message: '预算接近家居品类本月限额 (85%)' },
        { type: 'stock', level: 'high', message: '关联权益 "家居通用券" 库存不足 1000 张' }
    ]
  },
];
