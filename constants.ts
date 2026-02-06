
import { StrategyType, Scheme, MockAudience, MockBudgetInfo, Activity, ApprovalStatus, AttributionReport, MDIPField, DataSource, DataTable, DataColumn, GeneratedFeature, MarketingRight, ApprovalProcess, RiskItem } from './types';

export const COLORS = {
  brandBlue: '#D0026B', // AEON Magenta/Pink-ish Red brand color
  success: '#28A745',
  warning: '#FFC107',
  error: '#DC3545',
};

export const AB_TEST_THRESHOLD = 5000; 
export const MAX_VARIANTS = 10;

// Dropdown Options - AEON Retail Categories
export const CATEGORY_OPTIONS = ['不限', '生鲜', '食品', '特慧优(TOPVALU)', '美妆个护', '家居家纺', '服饰', '母婴儿童', '宠物用品'];
export const TARGET_TYPE_OPTIONS = ['客单提升', '到店频次', '会员日爆发', '库存出清', '新品推广', '沉睡激活', 'App渗透'];
export const TIME_UNIT_OPTIONS = ['天', '小时'];

// System Tags for AI matching - Retail Specific
export const SYSTEM_AUDIENCE_TAGS = [
  '高净值会员', '价格敏感', '周二特惠党', '会员日铁粉', 
  '有车一族', '精致妈妈', '独居白领', '生鲜偏好', 
  '特慧优忠粉', '周末家庭客', '晚间折价猎手', '母婴高潜',
  '自助收银偏好', '冷冻囤货族', 'AEON Pay用户'
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
  { key: 'member_id', label: '会员卡号', required: true, type: 'String', description: 'AEON会员唯一标识' },
  { key: 'mobile', label: '手机号', required: true, type: 'String', description: '加密后的手机号' },
  { key: 'registration_store', label: '注册门店', required: true, type: 'String', description: '开卡门店' },
  { key: 'last_visit_time', label: '最近到店时间', required: true, type: 'Datetime', description: 'POS/停车场最近记录' },
  { key: 'accumulated_points', label: '当前积分', required: true, type: 'Integer', description: '可用积分余额' },
  { key: 'avg_basket_value', label: '平均客单价', required: true, type: 'Decimal', description: 'ATV' },
  { key: 'visit_freq_30d', label: '近30天到店频次', required: true, type: 'Integer', description: '月活跃度' },
  { key: 'preferred_category', label: '偏好品类', required: false, type: 'String', description: '消费占比最高品类' },
  { key: 'family_structure', label: '家庭结构', required: false, type: 'String', description: '单身/两口/三口之家' },
];

export const MOCK_DATA_SOURCES: DataSource[] = [
  { 
    id: 'ds_1', 
    name: 'AEON_POS_Core_DB', 
    type: 'db', 
    status: 'connected', 
    lastSyncTime: getRecentDateTime(0, -1), 
    records: 12500000, 
    qualityScore: 99 
  },
  { 
    id: 'ds_2', 
    name: 'Member_Center_CRM', 
    type: 'api', 
    status: 'connected', 
    lastSyncTime: getRecentDateTime(0, -2), 
    records: 2100000, 
    qualityScore: 96 
  },
  { 
    id: 'ds_3', 
    name: 'Smart_Parking_Logs', 
    type: 'file', 
    status: 'connected', 
    lastSyncTime: getRecentDateTime(-1, 0), 
    records: 450000, 
    qualityScore: 88 
  },
  {
    id: 'ds_4',
    name: 'AEON_Supply_Chain_ERP',
    type: 'db',
    status: 'connected',
    lastSyncTime: getRecentDateTime(0, -4),
    records: 500000,
    qualityScore: 92
  }
];

export const MOCK_TABLES: DataTable[] = [
    { id: 'tb_1', dataSourceId: 'ds_1', name: 'dwd_pos_trans_detail', description: 'POS交易流水明细表 (含商品、支付、终端信息)', rowCount: 12500000, updateTime: getRecentDateTime(0, -1) },
    { id: 'tb_2', dataSourceId: 'ds_2', name: 'dim_member_info', description: '会员基础信息维表 (含等级、生命周期)', rowCount: 2100000, updateTime: getRecentDateTime(0, -5) },
    { id: 'tb_3', dataSourceId: 'ds_1', name: 'dim_sku_product', description: '商品SKU主数据 (含品类、温层、品牌类型)', rowCount: 150000, updateTime: getRecentDateTime(-2, 0) },
    { id: 'tb_4', dataSourceId: 'ds_3', name: 'ods_parking_entry_exit', description: '停车场进出记录', rowCount: 450000, updateTime: getRecentDateTime(-1, 0) },
    { id: 'tb_5', dataSourceId: 'ds_4', name: 'dwd_inventory_stock', description: '门店每日库存快照', rowCount: 500000, updateTime: getRecentDateTime(0, -8) },
];

export const MOCK_COLUMNS: DataColumn[] = [
    // Member Table
    { tableId: 'tb_2', name: 'member_id', type: 'VARCHAR(32)', description: '会员卡号', isPrimaryKey: true },
    { tableId: 'tb_2', name: 'mobile_hash', type: 'VARCHAR(64)', description: '手机号' },
    { tableId: 'tb_2', name: 'point_balance', type: 'INT', description: '积分余额' },
    { tableId: 'tb_2', name: 'card_level', type: 'VARCHAR(10)', description: '卡等级(金卡/普卡)' },
    { tableId: 'tb_2', name: 'lifecycle_stage', type: 'VARCHAR(20)', description: '生命周期(新客/活跃/沉睡/流失)' },
    { tableId: 'tb_2', name: 'reg_store_id', type: 'VARCHAR(20)', description: '开卡门店' },
    { tableId: 'tb_2', name: 'aeon_app_user', type: 'TINYINT', description: '是否App注册用户' },
    
    // POS Transaction Table - Enhanced
    { tableId: 'tb_1', name: 'trans_id', type: 'VARCHAR(64)', description: '流水号', isPrimaryKey: true },
    { tableId: 'tb_1', name: 'member_id', type: 'VARCHAR(32)', description: '会员ID (非会员为空)' },
    { tableId: 'tb_1', name: 'basket_id', type: 'VARCHAR(64)', description: '购物篮ID (同一次支付)' },
    { tableId: 'tb_1', name: 'sku_code', type: 'VARCHAR(20)', description: '商品编码' },
    { tableId: 'tb_1', name: 'store_id', type: 'VARCHAR(20)', description: '门店ID' },
    { tableId: 'tb_1', name: 'sale_qty', type: 'DECIMAL(10,3)', description: '销售数量/重量' },
    { tableId: 'tb_1', name: 'original_amt', type: 'DECIMAL(10,2)', description: '原价金额' },
    { tableId: 'tb_1', name: 'discount_amt', type: 'DECIMAL(10,2)', description: '折扣金额' },
    { tableId: 'tb_1', name: 'final_amt', type: 'DECIMAL(10,2)', description: '实付金额' },
    { tableId: 'tb_1', name: 'payment_method', type: 'VARCHAR(20)', description: '支付方式 (WeChat/Alipay/Cash/AEON_Pay)' },
    { tableId: 'tb_1', name: 'pos_type', type: 'VARCHAR(10)', description: '终端类型 (Manned/SCO/App)' },
    { tableId: 'tb_1', name: 'trans_time', type: 'DATETIME', description: '交易时间' },

    // SKU Master - Enhanced
    { tableId: 'tb_3', name: 'sku_code', type: 'VARCHAR(20)', description: '商品编码', isPrimaryKey: true },
    { tableId: 'tb_3', name: 'sku_name', type: 'VARCHAR(200)', description: '商品名称' },
    { tableId: 'tb_3', name: 'brand_name', type: 'VARCHAR(100)', description: '品牌名称' },
    { tableId: 'tb_3', name: 'brand_type', type: 'VARCHAR(10)', description: '品牌类型 (PB自有/NB国牌/IB进口)' },
    { tableId: 'tb_3', name: 'category_l1', type: 'VARCHAR(50)', description: '一级类目 (生鲜/食品/住居/服装)' },
    { tableId: 'tb_3', name: 'category_l2', type: 'VARCHAR(50)', description: '二级类目' },
    { tableId: 'tb_3', name: 'temperature_zone', type: 'VARCHAR(20)', description: '温层 (常温/冷藏/冷冻/热食)' },
    { tableId: 'tb_3', name: 'shelf_life_days', type: 'INT', description: '保质期(天)' },
    { tableId: 'tb_3', name: 'supplier_id', type: 'VARCHAR(20)', description: '供应商ID' },
];

export const MOCK_FEATURES: GeneratedFeature[] = [
    { 
        id: 'ft_1', tableId: 'tb_1', name: '特慧优(TOPVALU)偏好指数', code: 'pref_topvalu_idx', categories: ['Preference', 'Brand'], 
        description: '购买永旺自有品牌TOPVALU的频次占比 > 30%', status: 'published', creationType: 'ai',
        ruleSql: `SELECT t.member_id, COUNT(CASE WHEN p.brand_type = 'PB' AND p.brand_name = 'TOPVALU' THEN 1 END) / COUNT(*) as ratio \nFROM dwd_pos_trans_detail t \nJOIN dim_sku_product p ON t.sku_code = p.sku_code \nGROUP BY t.member_id`
    },
    { 
        id: 'ft_2', tableId: 'tb_1', name: '周二特惠敏感人群', code: 'act_tuesday_shopper', categories: ['RFM', 'Activity'], 
        description: '近3个月内，周二到店消费次数占比超过 50% 的用户', status: 'published', creationType: 'manual',
        ruleSql: `SELECT member_id, COUNT(*) as tue_visits \nFROM dwd_pos_trans_detail \nWHERE DAYOFWEEK(trans_time) = 3 \nAND trans_time > DATE_SUB(NOW(), INTERVAL 90 DAY) \nGROUP BY member_id`
    },
    { 
        id: 'ft_3', tableId: 'tb_1', name: '自助收银(SCO)偏好', code: 'pref_sco_user', categories: ['Behavior', 'Digital'], 
        description: '使用自助收银机(SCO)结算次数占比 > 80% 的年轻化客群', status: 'published', creationType: 'ai',
        ruleSql: `SELECT member_id, SUM(CASE WHEN pos_type = 'SCO' THEN 1 ELSE 0 END) / COUNT(*) as sco_ratio \nFROM dwd_pos_trans_detail \nGROUP BY member_id \nHAVING sco_ratio > 0.8`
    },
    { 
        id: 'ft_4', tableId: 'tb_1', name: '冷冻囤货族', code: 'pref_frozen_bulk', categories: ['Lifestyle', 'Category'], 
        description: '单次购买冷冻食品(水饺/面点/肉类)超过 3 件的用户', status: 'published', creationType: 'auto',
        ruleSql: `SELECT t.member_id FROM dwd_pos_trans_detail t \nJOIN dim_sku_product p ON t.sku_code = p.sku_code \nWHERE p.temperature_zone = '冷冻' \nGROUP BY t.member_id, t.basket_id \nHAVING SUM(t.sale_qty) >= 3`
    },
    {
        id: 'ft_5', tableId: 'tb_4', name: '有车一族(周末)', code: 'car_owner_weekend', categories: ['Lifestyle'],
        description: '周末有停车场进出记录且停留时长 > 2小时', status: 'draft', creationType: 'auto',
        ruleSql: 'SELECT car_plate, member_id FROM ods_parking_entry_exit WHERE duration_min > 120 AND is_weekend = 1'
    }
];

export const MOCK_RIGHTS: MarketingRight[] = [
    {
        id: 'r_1', name: '20日/30日会员日95折券', type: 'discount', value: '95%', 
        totalStock: 999999, usedStock: 450000, costPerUnit: 5, category: '全场通用', 
        description: '仅限每月20日、30日使用，部分专柜除外', tags: ['会员日', '全场'], status: 'active'
    },
    {
        id: 'r_2', name: '特慧优(TOPVALU)满50减10', type: 'coupon', value: '10', 
        totalStock: 50000, usedStock: 12000, costPerUnit: 10, category: '特慧优(TOPVALU)', 
        description: '自有品牌专属推广券', tags: ['自有品牌', '高毛利'], status: 'active'
    },
    {
        id: 'r_3', name: '免费停车券(2小时)', type: 'virtual', value: '2h', 
        totalStock: 20000, usedStock: 8500, costPerUnit: 15, category: '服务', 
        description: '购物中心通用停车减免', tags: ['有车一族', '促到店'], status: 'active'
    },
    {
        id: 'r_4', name: '生鲜早市5元代金券', type: 'coupon', value: '5', 
        totalStock: 10000, usedStock: 9800, costPerUnit: 5, category: '生鲜', 
        description: '限每日 08:00-11:00 使用，满38可用', tags: ['晨练老人', '家庭主妇'], status: 'active'
    },
    {
        id: 'r_5', name: 'AEON App 专享免邮券', type: 'virtual', value: 'FreeShip', 
        totalStock: 5000, usedStock: 1200, costPerUnit: 8, category: '线上', 
        description: 'AEON App 下单生鲜极速达免运费', tags: ['App渗透', 'O2O'], status: 'active'
    },
    {
        id: 'r_6', name: '双倍积分卡(周二限定)', type: 'point', value: '2x', 
        totalStock: 100000, usedStock: 32000, costPerUnit: 1, category: '通用', 
        description: '火曜日叠加权益', tags: ['促活', '周二'], status: 'active'
    }
];

// Mock Audiences - AEON Context
export const MOCK_AUDIENCES: MockAudience[] = [
  { 
    id: 'aud_1', 
    name: '周二火曜日-价格敏感客群', 
    size: 45000, 
    description: '历史在周二消费占比高，且偏好购买促销标签商品的用户', 
    tags: ['周二特惠党', '价格敏感', '生鲜偏好'],
    creator: '店长-王强',
    createdTime: getRecentDate(-15),
    lastModified: getRecentDate(-2)
  },
  { 
    id: 'aud_2', 
    name: '特慧优(TOPVALU)忠实粉', 
    size: 18000, 
    description: '过去半年购买TOPVALU商品超过5次，客单价>80元',
    tags: ['特慧优忠粉', '高净值会员', '复购'],
    creator: '商品部-李娜',
    createdTime: getRecentDate(-30),
    lastModified: getRecentDate(-5)
  },
  { 
    id: 'aud_3', 
    name: '数字化尝鲜客群', 
    size: 12500, 
    description: '偏好使用自助收银(SCO)或 AEON App 下单的年轻会员',
    tags: ['自助收银偏好', 'AEON Pay用户', '年轻化'],
    creator: '数科部-陈工',
    createdTime: getRecentDate(-12),
    lastModified: getRecentDate(-3)
  },
  { 
    id: 'aud_4', 
    name: '母婴高净值人群', 
    size: 8500, 
    description: '近半年购买过进口奶粉/纸尿裤，且客单价>300元',
    tags: ['母婴高潜', '精致妈妈', '高净值会员'],
    creator: '营运部-张姐',
    createdTime: getRecentDate(-20),
    lastModified: getRecentDate(-1)
  },
];

// Mock Budget Data (Category -> Budget Info)
export const MOCK_CATEGORY_BUDGETS: Record<string, MockBudgetInfo> = {
  '生鲜': { total: 300000, used: 210000 },
  '食品': { total: 200000, used: 80000 }, 
  '特慧优(TOPVALU)': { total: 100000, used: 30000 },
  '美妆个护': { total: 150000, used: 60000 },
  '家居家纺': { total: 80000, used: 20000 },
  '服饰': { total: 120000, used: 90000 },
  '母婴儿童': { total: 100000, used: 40000 },
  '不限': { total: 1000000, used: 400000 }, 
};

export const MOCK_SCHEMES: Scheme[] = [
  {
    id: '1',
    name: '会员感谢日-全场大促',
    type: StrategyType.BALANCED,
    description: '针对20日/30日会员日，利用全场折扣券提升全店销售额(GMV)。',
    tags: ['⭐ 推荐', '会员日', '全场'],
    audienceTags: ['活跃会员', '全量会员'],
    startDate: getRecentDate(1),
    endDate: getRecentDate(3),
    metrics: {
      roi: 4.5,
      gmv: 850000,
      cost: 180000,
      audienceSize: 150000,
      conversionRate: 0.15,
    },
    config: {
      audience: '全量注册会员 (重点触达近30天活跃用户)',
      benefit: '20日/30日会员日95折券', 
      gameplay: '到店核销',
      channel: '微信公众号 + 企微社群',
    },
    confidence: 'high',
    confidenceReason: '历史会员日活动平均ROI稳定在4.0以上',
  },
  {
    id: '2',
    name: '周二火曜日-生鲜引流',
    type: StrategyType.EXPANSION,
    description: '利用周二特惠心智，通过生鲜爆品券吸引客流到店，带动连带消费。',
    tags: ['引流', '高频', '周二'],
    audienceTags: ['价格敏感', '生鲜偏好'],
    startDate: getRecentDate(2),
    endDate: getRecentDate(3),
    metrics: {
      roi: 2.8,
      gmv: 320000,
      cost: 110000,
      audienceSize: 45000,
      conversionRate: 0.22,
    },
    config: {
      audience: '周二特惠敏感人群 + 附近3km居民',
      benefit: '生鲜早市5元代金券 (满38可用)',
      gameplay: '限时抢购',
      channel: 'APP Push + 小程序弹窗',
    },
    confidence: 'high',
    confidenceReason: '生鲜品类引流效果显著，核销率预计>20%',
  },
  {
    id: '3',
    name: '特慧优(TOPVALU)品牌渗透',
    type: StrategyType.PRECISION,
    description: '针对高价值会员推广自有品牌，提升品牌认知度与利润率。',
    tags: ['高毛利', '自有品牌'],
    audienceTags: ['高净值会员', '品质生活'],
    startDate: getRecentDate(1),
    endDate: getRecentDate(15),
    metrics: {
      roi: 3.2,
      gmv: 150000,
      cost: 45000,
      audienceSize: 18000,
      conversionRate: 0.08,
    },
    config: {
      audience: '特慧优潜在兴趣人群 (购买过同类竞品)',
      benefit: '特慧优(TOPVALU)满50减10',
      gameplay: '试吃/试用 + 领券',
      channel: '短信 + 1V1导购',
    },
    confidence: 'medium',
    confidenceReason: '自有品牌转化难度略高，需精准触达',
  },
];

// Mock Cached Report - Retail Context
const MOCK_REPORT_DATA: AttributionReport = {
    activityId: 'ACT_20230920_AEON',
    generatedTime: getRecentDate(-1, 0),
    overview: {
        finalRoi: 4.8,
        targetRoi: 4.0,
        finalGmv: 1200000,
        totalCost: 250000,
        conversionRate: 0.18
    },
    factors: {
        audience: { name: '人群策略', contribution: 45, uplift: 12, detail: '会员日活跃用户到店率极高' },
        benefit: { name: '权益力度', contribution: 25, uplift: 8, detail: '95折叠加积分抵扣深受欢迎' },
        content: { name: '文案创意', contribution: 15, uplift: 4, detail: '“感谢日”情感营销有效' },
        channel: { name: '触达渠道', contribution: 15, uplift: 3, detail: '企微社群通知响应最快' }
    },
    insights: [
        { id: '1', type: 'positive', title: '食品区连带率提升', description: '使用95折券的用户，平均购买了 5.2 件商品，比平时高出 1.5 件。', zScore: 2.5, dataPoint: '连带率' },
        { id: '2', type: 'negative', title: '晚间时段核销不足', description: '19:00 后到店核销比例仅占 15%，低于预期的 25%。', zScore: -2.1, dataPoint: '分时核销' }
    ],
    suggestions: [
        { id: 's1', type: 'template', title: '固化“会员日”SOP', impact: '效率提升 50%', difficulty: 'Low', actionLabel: '保存模板' },
        { id: 's2', type: 'config', title: '增加晚间限时权益', impact: '客流 +10%', difficulty: 'Medium', actionLabel: '优化方案' }
    ]
};

// Mock Activities - Retail Context
export const MOCK_ACTIVITIES: Activity[] = [
  { 
    id: 'ACT_LIVE_AB_001', 
    name: '周末生鲜早市策略实验(A/B)', 
    status: 'active', 
    budget: 80000, 
    roi: 3.2, 
    startDate: getRecentDate(0), 
    endDate: getRecentDate(3),
    category: '生鲜',
    creator: '生鲜部-刘洋',
    createdTime: getRecentDateTime(-1, 0),
    approvalStatus: ApprovalStatus.APPROVED,
    schemeDetail: {
        ...MOCK_SCHEMES[1],
        name: '周末生鲜早市策略实验',
        abTest: {
            enabled: true,
            variable: 'benefit',
            variants: ['满59减5元 (门槛低)', '满89减10元 (力度大)'], // A vs B
            controlTrafficPercent: 50,
            allocationMode: 'dynamic_mab',
            minSampleSize: 3000,
            estimatedDuration: 3
        },
        config: {
            ...MOCK_SCHEMES[1].config,
            benefit: '满59减5元 (门槛低)', // Control value
            audience: '周边3km社区居民',
            channel: 'APP Push + 企微社群'
        }
    },
    approvalProcess: {
        currentNodeIndex: 2,
        nodes: [
            { id: 'node1', role: '生鲜主管', status: 'approved', approverName: '刘主管', actionTime: getRecentDateTime(-1, -5) },
            { id: 'node2', role: '店长', status: 'approved', approverName: '王强', actionTime: getRecentDateTime(-1, -1) }
        ]
    }
  },
  { 
    id: 'ACT_20231020_AEON', 
    name: '10月20日会员感谢日', 
    status: 'ended', 
    budget: 200000, 
    roi: 5.1, 
    startDate: getRecentDate(-20), 
    endDate: getRecentDate(-19),
    category: '全品类',
    creator: '店长-王强',
    createdTime: getRecentDateTime(-25, 0),
    approvalStatus: ApprovalStatus.APPROVED,
    schemeDetail: MOCK_SCHEMES[0],
    reportData: MOCK_REPORT_DATA,
    approvalProcess: {
        currentNodeIndex: 2,
        nodes: [
            { id: 'node1', role: '营运经理', status: 'approved', approverName: '张经理', actionTime: getRecentDateTime(-24, 0), comment: '同意，备货需充足' },
            { id: 'node2', role: '财务经理', status: 'approved', approverName: '李财务', actionTime: getRecentDateTime(-23, 0) }
        ]
    }
  },
  { 
    id: 'ACT_20231107_TUE', 
    name: '11月首个火曜日(周二)', 
    status: 'paused', // Paused to de-emphasize
    budget: 50000, 
    roi: 3.5, 
    startDate: getRecentDate(0), 
    endDate: getRecentDate(0),
    category: '生鲜',
    creator: '生鲜部-刘洋',
    createdTime: getRecentDateTime(-2, 0),
    approvalStatus: ApprovalStatus.APPROVED,
    schemeDetail: MOCK_SCHEMES[1],
    approvalProcess: {
        currentNodeIndex: 2,
        nodes: [
            { id: 'node1', role: '生鲜主管', status: 'approved', approverName: '刘主管', actionTime: getRecentDateTime(-1, -5) },
            { id: 'node2', role: '店长', status: 'approved', approverName: '王强', actionTime: getRecentDateTime(-1, -1) }
        ]
    }
  },
  { 
    id: 'ACT_TOPVALU_Q4', 
    name: '特慧优冬季保暖系列推广', 
    status: 'draft', 
    budget: 80000, 
    roi: 0, 
    startDate: getRecentDate(5), 
    endDate: getRecentDate(20),
    category: '特慧优(TOPVALU)',
    creator: '商品部-李娜',
    createdTime: getRecentDateTime(0, -3),
    approvalStatus: ApprovalStatus.PENDING,
    schemeDetail: MOCK_SCHEMES[2],
    approvalProcess: {
        currentNodeIndex: 1,
        nodes: [
            { id: 'node1', role: '商品经理', status: 'approved', approverName: '陈总', actionTime: getRecentDateTime(0, -1), comment: '重点推HEATFACT系列' },
            { id: 'node2', role: '财务经理', status: 'pending' },
            { id: 'node3', role: '店长', status: 'pending' }
        ]
    },
    riskAssessment: [
        { type: 'stock', level: 'high', message: 'HEATFACT内衣部分尺码库存紧张 (<100件)' }
    ]
  },
  { 
    id: 'ACT_PARKING_PROMO', 
    name: '周末自驾客到店礼', 
    status: 'draft', 
    budget: 20000, 
    roi: 0, 
    startDate: getRecentDate(3), 
    endDate: getRecentDate(5),
    category: '不限',
    creator: '客服部-小周',
    createdTime: getRecentDateTime(-1, 0),
    approvalStatus: ApprovalStatus.REJECTED,
    rejectionReason: '停车券成本核算有误，请重新评估ROI',
    schemeDetail: {
        ...MOCK_SCHEMES[1],
        name: '周末自驾客到店礼',
        config: { ...MOCK_SCHEMES[1].config, benefit: '免费停车券(4小时)', audience: '有车一族' }
    },
    approvalProcess: {
        currentNodeIndex: 0,
        nodes: [
            { id: 'node1', role: '营运经理', status: 'rejected', approverName: '张经理', actionTime: getRecentDateTime(0, -2), comment: '4小时停车券成本过高，建议改为2小时' }
        ]
    }
  }
];
