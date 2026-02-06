
import { GoogleGenAI, Type } from "@google/genai";
import { ParsedGoal, Scheme, StrategyType, Metrics, AttributionReport, Activity, AudienceAnalysisResult, DataColumn, DataTable, GeneratedFeature } from "../types";
import { SYSTEM_AUDIENCE_TAGS, MOCK_SCHEMES } from "../constants";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelId = "gemini-3-flash-preview";

// Helper to handle API errors gracefully
const handleApiError = (context: string, error: any) => {
    const msg = error?.message || '';
    const isQuota = msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429');
    const isNetwork = msg.includes('500') || msg.includes('xhr error') || msg.includes('fetch failed');
    
    if (isQuota) {
        console.warn(`[${context}] API Quota Exceeded (429). Switching to fallback mock data.`);
    } else if (isNetwork) {
        console.warn(`[${context}] Network/RPC Error. Switching to fallback mock data.`);
    } else {
        console.error(`[${context}] Unexpected Error:`, error);
    }
};

export const optimizePrompt = async (input: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `You are a marketing expert. Rewrite the user's rough marketing goal into a professional, clear, and specific prompt string in Chinese. 
      Input: "${input}"
      
      Requirements:
      1. Make it complete.
      2. If specific details (like budget, specific product line, time) are missing, **YOU MUST** insert a placeholder wrapped in thick brackets like this: 【请输入预算】 or 【请补充具体时间】. 
      3. Use professional marketing terminology.
      4. Keep it concise but detailed enough for an AI agent to parse.
      5. Language must be Simplified Chinese.
      6. CRITICAL: Return ONLY the rewritten prompt string. Do not include any introductory text.
      
      Example Input: "想搞个洗护的活动"
      Example Output: "计划针对洗护品类发起一场复购提升活动，目标人群为近期活跃会员，预计投放预算【请输入预算金额】，活动周期14天。"
      `,
    });
    return response.text?.trim() || input;
  } catch (error) {
    handleApiError("Optimize Prompt", error);
    return input;
  }
};

export const parseUserGoal = async (input: string): Promise<ParsedGoal> => {
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Analyze the following marketing goal input and extract structured data.
      Input: "${input}"
      
      Rules:
      1. Category: If strictly not mentioned, return "不限". Valid values generally align with: 洗护, 美妆, 食品, 母婴, 家居, 服饰.
      2. Target Type Mapping (CRITICAL):
         - If input mentions "新客", "首购", "注册", "未下单", "潜客", set targetType to "拉新获客".
         - If input mentions "复购", "老客", "回购", "再次购买", set targetType to "复购提升".
         - If input mentions "流失", "召回", "回来", set targetType to "流失召回".
         - Default to "复购提升" only if unclear.
      3. Time: Extract the duration value and unit (Days or Hours). Default to 14 Days.
      4. Budget: Extract the numeric value only (e.g. 50000 for 5万). Default to 0 if not found.
      5. Audience: 
         - 'targetAudienceName': Short name of the group.
         - 'targetAudienceFeatures': Detailed features for creating this audience.
         - 'targetAudienceTags': Select relevant tags strictly from this list: ${JSON.stringify(SYSTEM_AUDIENCE_TAGS)}.
         - 'suggestedTags': If the user describes specific criteria NOT in the system list (e.g. "Registered in last 30 days" -> "最近30天注册", "High return rate" -> "高退货偏好"), extract them as new short tags here.

      Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: "Product category or '不限'" },
            targetType: { type: Type.STRING, description: "Goal type" },
            targetAudienceName: { type: Type.STRING, description: "Short name of audience" },
            targetAudienceFeatures: { type: Type.STRING, description: "Features for creation" },
            targetAudienceTags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Matched system tags" },
            suggestedTags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "New tags suggested by AI based on context" },
            timeValue: { type: Type.INTEGER, description: "Duration number" },
            timeUnit: { type: Type.STRING, enum: ["天", "小时"] },
            budget: { type: Type.NUMBER, description: "Budget in numeric currency" },
          },
          required: ["category", "targetType", "timeValue", "timeUnit", "budget"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    return { ...data, originalText: input };
  } catch (error) {
    handleApiError("Parse Goal", error);
    // Fallback for demo
    return {
      category: "不限",
      targetType: "拉新获客",
      targetAudienceName: "潜在新客",
      targetAudienceFeatures: "近期注册但未下单的用户",
      targetAudienceTags: [],
      suggestedTags: ["最近30天注册", "未首购"],
      timeValue: 14,
      timeUnit: "天",
      budget: 50000,
      originalText: input,
    };
  }
};

export const analyzeAudienceGoal = async (input: string): Promise<AudienceAnalysisResult> => {
  try {
    const prompt = `Act as an Audience Selection Agent. Analyze the user's audience description.
    Input: "${input}"
    
    System Tags: ${JSON.stringify(SYSTEM_AUDIENCE_TAGS)}
    
    Tasks:
    1. Generate a catchy Audience Name.
    2. Summarize the description.
    3. Match 3-5 tags (System tags or new ones).
    4. Predict the audience size (Random number between 5,000 and 500,000).
    5. Calculate predicted Lookalike expansion size (1.5x - 3x of original).
    6. Predict ROI uplift (e.g., 0.2 means 20%).
    7. Generate profile distribution data (Age groups, Gender split, Top 5 Cities).
       - 'value': Percentage distribution (sum to roughly 100).
       - 'tgi': Target Group Index (average is 100). High TGI (>100) means high affinity.
    8. Provide reasoning for the selection.

    Language: Simplified Chinese.
    Return JSON matching the AudienceAnalysisResult schema.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            estimatedSize: { type: Type.NUMBER },
            lookalikeSize: { type: Type.NUMBER },
            predictedRoi: { type: Type.NUMBER },
            profile: {
                type: Type.OBJECT,
                properties: {
                    age: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: {type: Type.STRING}, value: {type: Type.NUMBER}, tgi: {type: Type.NUMBER} } } },
                    gender: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: {type: Type.STRING}, value: {type: Type.NUMBER}, tgi: {type: Type.NUMBER} } } },
                    city: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: {type: Type.STRING}, value: {type: Type.NUMBER}, tgi: {type: Type.NUMBER} } } },
                    interest: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            },
            matchScore: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}") as AudienceAnalysisResult;
  } catch (error) {
    handleApiError("Audience Analysis", error);
    // Mock Fallback
    return {
        name: "高价值潜力女性",
        description: "基于输入生成的备选人群，侧重于高消费力且近期活跃的女性用户。",
        tags: ["高净值", "活跃会员", "精致妈妈"],
        estimatedSize: 12500,
        lookalikeSize: 35000,
        predictedRoi: 0.15,
        matchScore: 88,
        reasoning: "该人群历史转化率高，且对高客单价产品有明显偏好。",
        profile: {
            age: [{label: '18-25', value: 20, tgi: 105}, {label: '26-35', value: 50, tgi: 130}, {label: '36+', value: 30, tgi: 95}],
            gender: [{label: '女性', value: 85, tgi: 140}, {label: '男性', value: 15, tgi: 40}],
            city: [{label: '上海', value: 30, tgi: 150}, {label: '北京', value: 25, tgi: 140}, {label: '杭州', value: 15, tgi: 120}],
            interest: ['美妆', '奢侈品']
        }
    };
  }
};

export const generateSchemes = async (goal: ParsedGoal): Promise<Scheme[]> => {
  try {
    const prompt = `Based on the marketing goal:
    Category: ${goal.category}
    Type: ${goal.targetType}
    Budget: ${goal.budget}
    Duration: ${goal.timeValue} ${goal.timeUnit}
    Audience: ${goal.targetAudienceName} (${goal.targetAudienceFeatures})

    Generate 3 distinct marketing schemes in Simplified Chinese (简体中文).
    1. Balanced Strategy (Balance ROI and Scale)
    2. Precision Strategy (High ROI, small scale)
    3. Expansion Strategy (Max Scale, lower ROI)

    Ensure the response is valid JSON matching the schema.
    Metrics should be realistic numbers.
    Cost should be within budget ${goal.budget}.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              type: { type: Type.STRING, enum: [StrategyType.BALANCED, StrategyType.PRECISION, StrategyType.EXPANSION, StrategyType.INNOVATION] },
              description: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              metrics: {
                type: Type.OBJECT,
                properties: {
                  roi: { type: Type.NUMBER },
                  gmv: { type: Type.NUMBER },
                  cost: { type: Type.NUMBER },
                  audienceSize: { type: Type.NUMBER },
                  conversionRate: { type: Type.NUMBER },
                }
              },
              config: {
                type: Type.OBJECT,
                properties: {
                  audience: { type: Type.STRING },
                  benefit: { type: Type.STRING },
                  gameplay: { type: Type.STRING },
                  channel: { type: Type.STRING },
                }
              },
              confidence: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
              confidenceReason: { type: Type.STRING },
            }
          }
        }
      }
    });

    const schemes = JSON.parse(response.text || "[]");
    
    // Strict validation to prevent UI crashes due to malformed AI responses
    if (!Array.isArray(schemes) || schemes.length === 0) throw new Error("Empty schemes");

    const validSchemes = schemes.filter((s: any) => 
      s && 
      typeof s === 'object' && 
      s.metrics && 
      s.config &&
      s.name // Ensure essential fields exist
    );

    // Date Calculation Logic
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1); // Start tomorrow
    const endDate = new Date(startDate);
    const durationDays = goal.timeUnit === '天' ? goal.timeValue : Math.ceil(goal.timeValue / 24);
    endDate.setDate(endDate.getDate() + durationDays);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    // Pass the audience tags (combined system + suggested) from the goal to the schemes for display
    const combinedTags = [
        ...(goal.targetAudienceTags || []),
        ...(goal.suggestedTags || [])
    ];
    // De-duplicate
    const uniqueTags = [...new Set(combinedTags)];

    return validSchemes.map((s: Scheme) => ({
        ...s,
        audienceTags: uniqueTags,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate)
    }));
  } catch (error) {
    handleApiError("Generate Schemes", error);
    
    // Fallback to MOCK_SCHEMES but try to adjust to the requested budget/goal if possible
    return MOCK_SCHEMES.map(s => ({
        ...s,
        metrics: {
            ...s.metrics,
            cost: goal.budget > 0 ? Math.min(s.metrics.cost, goal.budget) : s.metrics.cost
        }
    }));
  }
};

export const recalculateMetrics = async (scheme: Scheme, changes: string): Promise<Metrics> => {
    // Simulate API call for recalculation
    await new Promise(r => setTimeout(r, 800)); // Simulate latency
    
    // Simple mock logic for demo purposes based on random fluctuations
    const factor = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
    
    return {
        roi: Number((scheme.metrics.roi * factor).toFixed(2)),
        gmv: Math.floor(scheme.metrics.gmv * factor),
        cost: Math.floor(scheme.metrics.cost * (0.95 + Math.random() * 0.1)), // Cost changes slightly less
        audienceSize: Math.floor(scheme.metrics.audienceSize * factor),
        conversionRate: Number((scheme.metrics.conversionRate * (0.9 + Math.random() * 0.2)).toFixed(3)),
    };
}

export const generateAttributionReport = async (activity: Activity): Promise<AttributionReport> => {
  // Simulate delay
  await new Promise(r => setTimeout(r, 1500));

  const hasAbTest = activity.schemeDetail?.abTest?.enabled;
  const abTestContext = hasAbTest ? `
    This activity included an A/B test on variable: ${activity.schemeDetail?.abTest?.variable}.
    Include an A/B Test Conclusion in the report.
    - Declare one variant as the winner with statistical significance.
    - Uplift should be positive (e.g. 5-15%).
    - Confidence should be > 95%.
  ` : '';

  try {
    const prompt = `Generate a marketing attribution report for a completed activity.
    Activity Name: ${activity.name}
    Category: ${activity.category}
    Budget: ${activity.budget}
    Target ROI: ${activity.roi}
    ${abTestContext}
    
    Generate realistic data for:
    1. Overview (Final ROI, GMV, Cost, Conversion Rate). Make Final ROI slightly higher than Target ROI to show success.
    2. Shapley Value Attribution Factors (Audience, Benefit, Content, Channel). Total contribution sum 100%.
    3. 2 Insights (Z-score > 2 anomalies). One positive (e.g. specific age group), one negative or neutral.
    4. 3 Actionable Suggestions (New Activity, Template, or Config change).

    Return JSON matching the AttributionReport schema. Language: Simplified Chinese.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            activityId: { type: Type.STRING },
            generatedTime: { type: Type.STRING },
            overview: {
              type: Type.OBJECT,
              properties: {
                finalRoi: { type: Type.NUMBER },
                targetRoi: { type: Type.NUMBER },
                finalGmv: { type: Type.NUMBER },
                totalCost: { type: Type.NUMBER },
                conversionRate: { type: Type.NUMBER },
              }
            },
            factors: {
              type: Type.OBJECT,
              properties: {
                audience: { type: Type.OBJECT, properties: { name: {type: Type.STRING}, contribution: {type: Type.NUMBER}, uplift: {type: Type.NUMBER}, detail: {type: Type.STRING} } },
                benefit: { type: Type.OBJECT, properties: { name: {type: Type.STRING}, contribution: {type: Type.NUMBER}, uplift: {type: Type.NUMBER}, detail: {type: Type.STRING} } },
                content: { type: Type.OBJECT, properties: { name: {type: Type.STRING}, contribution: {type: Type.NUMBER}, uplift: {type: Type.NUMBER}, detail: {type: Type.STRING} } },
                channel: { type: Type.OBJECT, properties: { name: {type: Type.STRING}, contribution: {type: Type.NUMBER}, uplift: {type: Type.NUMBER}, detail: {type: Type.STRING} } },
              }
            },
            abTestConclusion: {
                type: Type.OBJECT,
                properties: {
                    winner: { type: Type.STRING },
                    uplift: { type: Type.NUMBER },
                    confidence: { type: Type.NUMBER },
                    description: { type: Type.STRING },
                }
            },
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['positive', 'negative'] },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  zScore: { type: Type.NUMBER },
                  dataPoint: { type: Type.STRING },
                }
              }
            },
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['new_activity', 'template', 'config'] },
                  title: { type: Type.STRING },
                  impact: { type: Type.STRING },
                  difficulty: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
                  actionLabel: { type: Type.STRING },
                }
              }
            }
          }
        }
      }
    });

    const report = JSON.parse(response.text || "{}");
    
    // Ensure vital data exists fallback
    return {
        ...report,
        activityId: activity.id,
        generatedTime: new Date().toISOString(),
        overview: report.overview || {
            finalRoi: activity.roi * 1.1,
            targetRoi: activity.roi,
            finalGmv: activity.budget * activity.roi * 1.1,
            totalCost: activity.budget,
            conversionRate: 0.05
        }
    } as AttributionReport;

  } catch (error) {
      handleApiError("Report Generation", error);
      // Fallback Mock
      const mockData: AttributionReport = {
        activityId: activity.id,
        generatedTime: new Date().toISOString(),
        overview: {
            finalRoi: 3.5,
            targetRoi: 3.0,
            finalGmv: 150000,
            totalCost: 42000,
            conversionRate: 0.08
        },
        factors: {
            audience: { name: '人群策略', contribution: 40, uplift: 15, detail: '高价值人群响应度高' },
            benefit: { name: '权益力度', contribution: 25, uplift: 8, detail: '8折券核销率最佳' },
            content: { name: '文案创意', contribution: 20, uplift: 5, detail: '温情类文案点击率高' },
            channel: { name: '触达渠道', contribution: 15, uplift: 3, detail: '企微渠道ROI最高' }
        },
        insights: [
            { id: '1', type: 'positive', title: '25-35岁男性客群响应超预期', description: '该群体转化率达到 11.2%，显著高于平均水平 (8.5%)。', zScore: 2.25, dataPoint: '转化率' }
        ],
        suggestions: [
            { id: 's1', type: 'new_activity', title: '针对未转化人群二次触达', impact: '挽回 15% 流失', difficulty: 'Low', actionLabel: '一键创建' }
        ]
      };

      if (hasAbTest) {
          mockData.abTestConclusion = {
              winner: '方案 B',
              uplift: 12.5,
              confidence: 98.2,
              description: '实验表明，采用“满减叠加”玩法的转化率比对照组高出 12.5%，置信度达到 98%，具备统计显著性。建议后续活动全量推广此玩法。'
          };
      }

      return mockData;
  }
};

export const generateFeatureSql = async (description: string, tableContext: DataTable, columns: DataColumn[]): Promise<string> => {
    try {
        const columnContext = columns.map(c => `${c.name} (${c.type}): ${c.description}`).join('\n');
        const prompt = `You are a SQL Expert specializing in Feature Engineering.
        Generate a SQL snippet (standard SQL) to extract a feature based on the user's description.
        
        Table: ${tableContext.name} (${tableContext.description})
        Columns:
        ${columnContext}
        
        User Description: "${description}"
        
        Requirements:
        1. Return ONLY the SQL code. No markdown, no explanation.
        2. The SQL should be a SELECT statement returning 'user_id' (or primary key) and the calculated feature.
        3. Use standard SQL aggregation functions if needed.
        `;

        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
        });

        return response.text?.trim() || "-- SQL generation failed";
    } catch (error) {
        handleApiError("SQL Gen", error);
        return `/* AI Generation Failed (Quota Exceeded or Network Error). Fallback SQL: */\nSELECT user_id, COUNT(*) as feature_value \nFROM ${tableContext.name} \nGROUP BY user_id`;
    }
}

export const autoDiscoverFeatures = async (table: DataTable, columns: DataColumn[]): Promise<GeneratedFeature[]> => {
    try {
        const columnContext = columns.map(c => `${c.name} (${c.type}): ${c.description}`).join('\n');
        const prompt = `Act as an expert Data Scientist. Analyze the table schema below and suggest 3-5 useful features for marketing analysis.
        
        Table: ${table.name} (${table.description})
        Columns:
        ${columnContext}
        
        Rules:
        1. If it's a Transaction/Event table (has amount, time, order_id), suggest aggregations like "Last 30 days total amount", "Average Order Value", "Order Count".
        2. If it's a User table (has demographics), suggest basic profile features or derived age groups.
        3. If it contains categorical data, suggest preference features (e.g. "Most frequent product category").
        
        Return JSON array of objects with schema:
        {
            "name": "Feature Name",
            "code": "feature_code_snake_case",
            "description": "Short explanation",
            "category": "RFM" | "Lifecycle" | "Preference" | "Risk" | "Custom",
            "ruleSql": "SQL select statement returning user_id and feature value"
        }
        
        Ensure SQL is valid standard SQL.
        `;

        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            code: { type: Type.STRING },
                            description: { type: Type.STRING },
                            category: { type: Type.STRING, enum: ["RFM", "Lifecycle", "Preference", "Risk", "Custom"] },
                            ruleSql: { type: Type.STRING },
                        }
                    }
                }
            }
        });

        const features = JSON.parse(response.text || "[]");
        
        // Enrich with ID and default props
        return features.map((f: any, index: number) => ({
            id: `auto_feat_${Date.now()}_${index}`,
            tableId: table.id,
            status: 'ready',
            creationType: 'auto',
            categories: [f.category], // AI returns single string, wrap in array
            ...f
        }));

    } catch (error) {
        handleApiError("Auto Discover Features", error);
        
        // Intelligent Fallback based on table name keywords
        const isUserTable = table.name.toLowerCase().includes('user') || table.name.toLowerCase().includes('member');
        const isOrderTable = table.name.toLowerCase().includes('order') || table.name.toLowerCase().includes('trade');
        
        let mockFeatures: any[] = [];

        if (isOrderTable) {
            mockFeatures = [
                {
                    name: "近30天消费总额",
                    code: "last_30d_gmv",
                    description: "最近30天内的累计消费金额 (Fallback)",
                    categories: ["RFM"],
                    ruleSql: "SELECT user_id, SUM(pay_amount) FROM dwd_trade_order_detail WHERE pay_time >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY user_id"
                },
                {
                    name: "平均客单价",
                    code: "avg_order_value",
                    description: "历史订单的平均支付金额 (Fallback)",
                    categories: ["RFM"],
                    ruleSql: "SELECT user_id, AVG(pay_amount) FROM dwd_trade_order_detail GROUP BY user_id"
                },
                {
                    name: "活跃时段偏好",
                    code: "pref_active_hour",
                    description: "用户下单最频繁的小时段 (Fallback)",
                    categories: ["Preference"],
                    ruleSql: "SELECT user_id, HOUR(pay_time) as active_hour FROM dwd_trade_order_detail GROUP BY user_id ORDER BY COUNT(*) DESC LIMIT 1"
                }
            ];
        } else if (isUserTable) {
             mockFeatures = [
                {
                    name: "会员生命周期",
                    code: "lifecycle_stage",
                    description: "基于注册时间判断 (Fallback)",
                    categories: ["Lifecycle"],
                    ruleSql: "SELECT user_id, CASE WHEN DATEDIFF(NOW(), registration_time) < 30 THEN 'New' ELSE 'Mature' END FROM dwd_user_basic_info"
                },
                {
                    name: "年龄段分布",
                    code: "age_group",
                    description: "基于出生日期计算年龄段 (Fallback)",
                    categories: ["Custom"],
                    ruleSql: "SELECT user_id, FLOOR(DATEDIFF(NOW(), birthday)/365/10)*10 as age_group FROM dwd_user_basic_info"
                }
            ];
        } else {
            // Generic Fallback
             mockFeatures = [
                {
                    name: "记录计数",
                    code: "record_count",
                    description: "该维度下的记录总数 (Fallback)",
                    categories: ["Custom"],
                    ruleSql: `SELECT id, COUNT(*) FROM ${table.name} GROUP BY id`
                }
            ];
        }

        return mockFeatures.map((f, index) => ({
            id: `auto_feat_fallback_${Date.now()}_${index}`,
            tableId: table.id,
            status: 'ready',
            creationType: 'auto',
            ...f
        }));
    }
}

export const augmentDataSchema = async (tableName: string, columnNames: string[]): Promise<{ tableDesc: string, columnDescs: Record<string, string> } | null> => {
  try {
    const prompt = `Act as a Data Dictionary Expert. 
    Analyze the table name and column names to provide business-friendly descriptions in Simplified Chinese.
    
    Table: ${tableName}
    Columns: ${columnNames.join(', ')}
    
    Return a JSON object with:
    1. tableDesc: A concise description of what this table likely contains.
    2. columns: An array of objects, each containing 'name' (column name) and 'description' (business definition).
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tableDesc: { type: Type.STRING },
            columns: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    
    // Transform array back to object for the UI component
    const columnDescs: Record<string, string> = {};
    if (Array.isArray(data.columns)) {
        data.columns.forEach((c: any) => {
            if (c.name && c.description) {
                columnDescs[c.name] = c.description;
            }
        });
    }

    return {
        tableDesc: data.tableDesc || "AI 生成描述",
        columnDescs
    };
  } catch (error) {
    handleApiError("Augment Schema", error);
    return {
        tableDesc: "AI 生成描述失败 (网络或配额限制)",
        columnDescs: {}
    };
  }
};

export const suggestFeatureCategories = async (name: string, description: string, sql: string, existingCategories: string[]): Promise<string[]> => {
    try {
        const prompt = `Act as a Feature Engineer. Analyze the feature below and suggest 1-2 most relevant categories.
        
        Feature Name: ${name}
        Description: ${description}
        SQL: ${sql}
        
        Existing Categories: ${existingCategories.join(', ')}
        
        Rules:
        1. Prioritize choosing from 'Existing Categories' if a good match exists.
        2. If no good match, suggest a new standard category (e.g., 'Behavior', 'Monetary', 'Demographic', 'Risk').
        3. Return JSON array of strings.
        `;

        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });

        return JSON.parse(response.text || "[]");
    } catch (error) {
        handleApiError("Suggest Categories", error);
        return ["Custom"];
    }
};
