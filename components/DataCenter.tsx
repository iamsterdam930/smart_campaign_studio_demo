
import React, { useState } from 'react';
import { DataSource, QualityReport, DataTable, DataColumn } from '../types';
import { MOCK_DATA_SOURCES, MOCK_TABLES, MOCK_COLUMNS } from '../constants';
import { augmentDataSchema } from '../services/geminiService';
import { translations } from '../i18n';
import { 
    Database, Plus, Upload, Link as LinkIcon, ArrowRight, CheckCircle, AlertTriangle, 
    FileSpreadsheet, Server, RefreshCw, Layers,
    Table, ArrowLeft, Key, Save, X, Loader2, Wand2
} from 'lucide-react';

interface DataCenterProps {
}

export const DataCenter: React.FC<DataCenterProps> = () => {
  const t = translations;
  
  // State for data (initially from Mocks but can add more)
  const [sources, setSources] = useState<DataSource[]>(MOCK_DATA_SOURCES);
  const [tables, setTables] = useState<DataTable[]>(MOCK_TABLES);
  const [columns, setColumns] = useState<DataColumn[]>(MOCK_COLUMNS);

  // Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [connectionType, setConnectionType] = useState<'file' | 'db'>('file');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // DB Config State
  const [dbConfig, setDbConfig] = useState({ host: '127.0.0.1', port: '3306', user: 'root', pass: '' });

  // Detail View State
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [isAugmenting, setIsAugmenting] = useState(false);
  
  // --- Actions ---

  const handleSourceClick = (id: string) => {
      setSelectedSourceId(id);
      // Auto select first table if exists
      const firstTable = tables.find(t => t.dataSourceId === id);
      if (firstTable) setSelectedTableId(firstTable.id);
      else setSelectedTableId(null);
  };

  const handleBackToSourceList = () => {
      setSelectedSourceId(null);
      setSelectedTableId(null);
  };

  const handleStartWizard = () => {
      setIsWizardOpen(true);
      setStep(1);
      setConnectionType('file');
      setUploadProgress(0);
      setMapping({});
      setQualityReport(null);
      setDbConfig({ host: '127.0.0.1', port: '3306', user: 'root', pass: '' });
  };

  const handleCloseWizard = () => {
      setIsWizardOpen(false);
  };

  // Wizard Step 2 Logic
  const handleSimulateConnection = () => {
      setIsProcessing(true);
      setTimeout(() => {
          setIsProcessing(false);
          setStep(3); // Skip mapping for DB simplified flow, go to preview/quality
      }, 1500);
  };

  // Wizard Step 1: Upload (Simulated)
  const handleUpload = () => {
      let p = 0;
      const interval = setInterval(() => {
          p += 10;
          setUploadProgress(p);
          if (p >= 100) {
              clearInterval(interval);
              setTimeout(() => setStep(2), 500);
          }
      }, 100);
  };

  // Wizard Step 2: Auto Map (File mode)
  const handleAutoMap = () => {
      const newMap: Record<string, string> = {};
      newMap['user_id'] = 'uid';
      newMap['mobile'] = 'mobile_encrypted';
      newMap['registration_time'] = 'reg_dt';
      setMapping(newMap);
      setTimeout(() => setStep(3), 500);
  };

  // Wizard Step 3: Quality Check
  const runQualityCheck = () => {
      setIsProcessing(true);
      setTimeout(() => {
          setQualityReport({
              totalRows: connectionType === 'db' ? 250000 : 5000,
              nullRate: [
                  { field: 'sex', rate: 0.02, isCritical: false },
                  { field: 'city_name', rate: 0.05, isCritical: false }
              ],
              uniqueCheck: { field: 'uid', passed: true, duplicateCount: 0 },
              anomalies: [
                  { field: 'total_amt', count: 3, desc: '负数值异常' }
              ],
              score: 95
          });
          setIsProcessing(false);
      }, 1500);
  };

  const handleFinishWizard = () => {
      const newSourceId = `ds_new_${Date.now()}`;
      const newSource: DataSource = {
          id: newSourceId,
          name: connectionType === 'file' ? 'Import_Member_Data_202311.csv' : `MySQL_DB_${dbConfig.host}`,
          type: connectionType,
          status: 'connected',
          lastSyncTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
          records: connectionType === 'file' ? 5000 : 250000,
          qualityScore: qualityReport?.score || 90
      };
      
      setSources([newSource, ...sources]);

      // If DB, mock some tables/columns for it so it shows up in UI
      if (connectionType === 'db') {
          const newTables: DataTable[] = [
              { id: `tb_new_1_${Date.now()}`, dataSourceId: newSourceId, name: 'ods_user_actions', description: '用户行为日志', rowCount: 150000, updateTime: new Date().toISOString() },
              { id: `tb_new_2_${Date.now()}`, dataSourceId: newSourceId, name: 'dim_store_info', description: '门店维表', rowCount: 50, updateTime: new Date().toISOString() }
          ];
          const newColumns: DataColumn[] = [
              { tableId: newTables[0].id, name: 'id', type: 'BIGINT', description: '主键ID', isPrimaryKey: true },
              { tableId: newTables[0].id, name: 'user_id', type: 'VARCHAR(64)', description: '用户ID' },
              { tableId: newTables[0].id, name: 'action_type', type: 'VARCHAR(20)', description: '行为类型' },
              { tableId: newTables[0].id, name: 'ts', type: 'DATETIME', description: '时间戳' },
              { tableId: newTables[1].id, name: 'store_id', type: 'INT', description: '门店ID', isPrimaryKey: true },
              { tableId: newTables[1].id, name: 'store_name', type: 'VARCHAR(100)', description: '门店名称' },
              { tableId: newTables[1].id, name: 'region', type: 'VARCHAR(50)', description: '区域' }
          ];
          setTables(prev => [...prev, ...newTables]);
          setColumns(prev => [...prev, ...newColumns]);
      } else {
          // File mode mock
          const newTableId = `tb_file_${Date.now()}`;
          const newTable: DataTable = { id: newTableId, dataSourceId: newSourceId, name: 'csv_import_table', description: '导入数据预览', rowCount: 5000, updateTime: new Date().toISOString() };
          const newCols: DataColumn[] = [
              { tableId: newTableId, name: 'uid', type: 'STRING', description: '用户ID' },
              { tableId: newTableId, name: 'mobile', type: 'STRING', description: '手机号' },
              { tableId: newTableId, name: 'reg_dt', type: 'STRING', description: '注册日期' }
          ];
          setTables(prev => [...prev, newTable]);
          setColumns(prev => [...prev, ...newCols]);
      }

      handleCloseWizard();
  };

  const handleSmartDescription = async () => {
      if (!selectedTableId) return;
      
      const table = tables.find(t => t.id === selectedTableId);
      const cols = columns.filter(c => c.tableId === selectedTableId);
      
      if (!table) return;

      setIsAugmenting(true);
      const result = await augmentDataSchema(table.name, cols.map(c => c.name));
      
      // Update State
      if (result) {
          // Update Table Description
          setTables(prev => prev.map(t => t.id === selectedTableId ? { ...t, description: result.tableDesc } : t));
          // Update Column Descriptions
          setColumns(prev => prev.map(c => {
              if (c.tableId === selectedTableId && result.columnDescs[c.name]) {
                  return { ...c, description: result.columnDescs[c.name] };
              }
              return c;
          }));
      }
      setIsAugmenting(false);
  };

  // --- Render Helpers ---
  const selectedSource = sources.find(s => s.id === selectedSourceId);
  const sourceTables = tables.filter(t => t.dataSourceId === selectedSourceId);
  const selectedTable = tables.find(t => t.id === selectedTableId);
  const tableColumns = columns.filter(c => c.tableId === selectedTableId);

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                {t["datacenter.title"]}
            </h2>
            <p className="text-gray-500 text-sm mt-1">{t["datacenter.subtitle"]}</p>
        </div>
        {!selectedSourceId && (
            <button 
                onClick={handleStartWizard}
                className="bg-brand-blue text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2"
            >
                <Plus size={18} /> {t["datacenter.connect"]}
            </button>
        )}
      </div>

      {/* Main Content Area */}
      {!selectedSourceId ? (
          // Source List View
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 font-bold text-gray-700">
                {t["datacenter.source.list"]}
             </div>
             <table className="w-full text-left text-sm">
                 <thead>
                     <tr className="border-b border-gray-100 text-gray-500">
                         <th className="px-6 py-4 font-medium">数据源名称</th>
                         <th className="px-6 py-4 font-medium">类型</th>
                         <th className="px-6 py-4 font-medium">状态</th>
                         <th className="px-6 py-4 font-medium text-right">记录数</th>
                         <th className="px-6 py-4 font-medium text-right">质量评分</th>
                         <th className="px-6 py-4 font-medium text-right">最近同步</th>
                         <th className="px-6 py-4 font-medium text-right">操作</th>
                     </tr>
                 </thead>
                 <tbody>
                     {sources.map(s => (
                         <tr 
                            key={s.id} 
                            onClick={() => handleSourceClick(s.id)}
                            className="hover:bg-blue-50/50 transition-colors border-b border-gray-50 last:border-0 cursor-pointer group"
                         >
                             <td className="px-6 py-4 font-medium text-gray-800 flex items-center gap-2">
                                 {s.type === 'file' ? <FileSpreadsheet size={16} className="text-green-600"/> : <Server size={16} className="text-blue-600"/>}
                                 {s.name}
                             </td>
                             <td className="px-6 py-4 text-gray-500 uppercase">{s.type}</td>
                             <td className="px-6 py-4">
                                 <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 w-fit ${
                                     s.status === 'connected' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                                 }`}>
                                     {s.status === 'connected' ? <CheckCircle size={12} /> : <RefreshCw size={12} className="animate-spin"/>}
                                     {t[`datacenter.status.${s.status}` as keyof typeof t]}
                                 </span>
                             </td>
                             <td className="px-6 py-4 text-right text-sm text-gray-600">{s.records.toLocaleString()}</td>
                             <td className="px-6 py-4 text-right">
                                 <div className="inline-flex items-center gap-1">
                                     <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                         <div className={`h-full rounded-full ${s.qualityScore >= 90 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{width: `${s.qualityScore}%`}}></div>
                                     </div>
                                     <span className="text-xs font-bold">{s.qualityScore}</span>
                                 </div>
                             </td>
                             <td className="px-6 py-4 text-right text-gray-400 text-xs">{s.lastSyncTime}</td>
                             <td className="px-6 py-4 text-right">
                                 <ArrowRight size={16} className="text-gray-300 group-hover:text-brand-blue ml-auto" />
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
          </div>
      ) : (
          // Source Detail View
          <div className="flex-1 flex bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Left Sidebar: Tables */}
              <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col">
                  <div className="p-4 border-b border-gray-200 flex items-center gap-2">
                      <button onClick={handleBackToSourceList} className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-500">
                          <ArrowLeft size={18} />
                      </button>
                      <h3 className="font-bold text-gray-800 truncate" title={selectedSource?.name}>{selectedSource?.name}</h3>
                  </div>
                  <div className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{t["datacenter.table.list"]}</div>
                  <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4">
                      {sourceTables.map(table => (
                          <button
                              key={table.id}
                              onClick={() => setSelectedTableId(table.id)}
                              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                                  selectedTableId === table.id 
                                  ? 'bg-white shadow-sm text-brand-blue font-bold border border-gray-100' 
                                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                              }`}
                          >
                              <Table size={14} className="shrink-0" />
                              <div className="truncate">
                                  <div>{table.name}</div>
                                  <div className="text-[10px] text-gray-400 font-normal truncate">{table.description}</div>
                              </div>
                          </button>
                      ))}
                      {sourceTables.length === 0 && (
                          <div className="text-center text-gray-400 text-xs py-4">暂无数据表</div>
                      )}
                  </div>
              </div>

              {/* Main Content: Schema only */}
              <div className="flex-1 flex flex-col">
                  {selectedTable ? (
                      <>
                          {/* Table Header */}
                          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
                              <div>
                                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                      <Table className="text-brand-blue" size={20} />
                                      {selectedTable.name}
                                  </h2>
                                  <div className="flex items-center gap-2 mt-1">
                                      <p className="text-gray-500 text-sm">{selectedTable.description}</p>
                                      <button 
                                        onClick={handleSmartDescription}
                                        disabled={isAugmenting}
                                        className="text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                                      >
                                          {isAugmenting ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />}
                                          AI 智能补全描述
                                      </button>
                                  </div>
                              </div>
                              <div className="flex gap-4 text-xs text-gray-500">
                                  <span>行数: <strong>{selectedTable.rowCount.toLocaleString()}</strong></span>
                                  <span>更新于: {selectedTable.updateTime}</span>
                              </div>
                          </div>

                          {/* Tabs */}
                          <div className="px-6 border-b border-gray-200 flex gap-6 bg-white">
                              <button 
                                  className={`py-3 text-sm font-medium border-b-2 transition-colors border-brand-blue text-brand-blue`}
                              >
                                  {t["datacenter.table.columns"]}
                              </button>
                          </div>

                          {/* Tab Content */}
                          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                  <table className="w-full text-sm text-left">
                                      <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                                          <tr>
                                              <th className="px-4 py-3 font-medium">字段名</th>
                                              <th className="px-4 py-3 font-medium">类型</th>
                                              <th className="px-4 py-3 font-medium">描述</th>
                                              <th className="px-4 py-3 font-medium text-center">主键</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                          {tableColumns.map(col => (
                                              <tr key={col.name} className="hover:bg-gray-50">
                                                  <td className="px-4 py-3 font-mono text-gray-800">{col.name}</td>
                                                  <td className="px-4 py-3 text-blue-600 font-mono text-xs">{col.type}</td>
                                                  <td className="px-4 py-3 text-gray-600">{col.description}</td>
                                                  <td className="px-4 py-3 text-center">
                                                      {col.isPrimaryKey && <Key size={14} className="text-yellow-500 inline" />}
                                                  </td>
                                              </tr>
                                          ))}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      </>
                  ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 flex-col gap-2">
                          <Table size={48} className="opacity-20" />
                          <p>请从左侧选择一张数据表查看详情</p>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Connection Wizard Modal */}
      {isWizardOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                          <LinkIcon className="text-brand-blue" /> {t["datacenter.connect"]} - Step {step}/4
                      </h3>
                      <button onClick={handleCloseWizard} className="text-gray-400 hover:text-gray-600">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-8 min-h-[350px] flex flex-col justify-center">
                      {step === 1 && (
                          <div className="space-y-6">
                              <h4 className="font-bold text-gray-700 text-center mb-4">选择接入方式</h4>
                              <div className="grid grid-cols-2 gap-4">
                                  <button 
                                    onClick={() => { setConnectionType('file'); setStep(2); }}
                                    className="border-2 border-gray-200 hover:border-brand-blue rounded-xl p-6 flex flex-col items-center gap-3 transition-colors hover:bg-blue-50"
                                  >
                                      <FileSpreadsheet size={40} className="text-green-600" />
                                      <span className="font-bold text-gray-700">上传文件</span>
                                      <span className="text-xs text-gray-400">CSV, Excel, JSON</span>
                                  </button>
                                  <button 
                                    onClick={() => { setConnectionType('db'); setStep(2); }}
                                    className="border-2 border-gray-200 hover:border-brand-blue rounded-xl p-6 flex flex-col items-center gap-3 transition-colors hover:bg-blue-50"
                                  >
                                      <Database size={40} className="text-blue-600" />
                                      <span className="font-bold text-gray-700">连接数据库</span>
                                      <span className="text-xs text-gray-400">MySQL, PostgreSQL, Oracle</span>
                                  </button>
                              </div>
                          </div>
                      )}

                      {step === 2 && connectionType === 'file' && (
                          <div className="text-center space-y-4">
                              <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 hover:border-brand-blue/50 transition-colors bg-gray-50">
                                  <Upload className="mx-auto text-gray-400 mb-4" size={40} />
                                  <p className="text-gray-600 font-medium">点击上传文件或拖拽至此</p>
                                  <p className="text-xs text-gray-400 mt-2">支持 .csv, .xlsx, .json</p>
                                  {uploadProgress > 0 && (
                                      <div className="w-full max-w-xs mx-auto mt-6 bg-gray-200 rounded-full h-2 overflow-hidden">
                                          <div className="bg-brand-blue h-full transition-all duration-200" style={{width: `${uploadProgress}%`}}></div>
                                      </div>
                                  )}
                              </div>
                              <button onClick={handleUpload} className="bg-brand-blue text-white px-6 py-2 rounded-lg font-bold">模拟上传</button>
                          </div>
                      )}

                      {step === 2 && connectionType === 'db' && (
                          <div className="space-y-4 max-w-md mx-auto w-full">
                              <div>
                                  <label className="text-sm font-bold text-gray-700 block mb-1">Database Type</label>
                                  <select className="w-full p-2 border rounded bg-gray-50"><option>MySQL</option><option>PostgreSQL</option></select>
                              </div>
                              <div className="grid grid-cols-3 gap-4">
                                  <div className="col-span-2">
                                      <label className="text-sm font-bold text-gray-700 block mb-1">Host</label>
                                      <input className="w-full p-2 border rounded" value={dbConfig.host} onChange={e => setDbConfig({...dbConfig, host: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="text-sm font-bold text-gray-700 block mb-1">Port</label>
                                      <input className="w-full p-2 border rounded" value={dbConfig.port} onChange={e => setDbConfig({...dbConfig, port: e.target.value})} />
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="text-sm font-bold text-gray-700 block mb-1">Username</label>
                                      <input className="w-full p-2 border rounded" value={dbConfig.user} onChange={e => setDbConfig({...dbConfig, user: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="text-sm font-bold text-gray-700 block mb-1">Password</label>
                                      <input className="w-full p-2 border rounded" type="password" value={dbConfig.pass} onChange={e => setDbConfig({...dbConfig, pass: e.target.value})} />
                                  </div>
                              </div>
                              <div className="pt-4 flex justify-end">
                                  {isProcessing ? (
                                      <button disabled className="bg-gray-300 text-white px-6 py-2 rounded-lg font-bold flex gap-2"><Loader2 className="animate-spin" size={20} /> 连接中...</button>
                                  ) : (
                                      <button onClick={handleSimulateConnection} className="bg-brand-blue text-white px-6 py-2 rounded-lg font-bold">测试连接并下一步</button>
                                  )}
                              </div>
                          </div>
                      )}

                      {step === 3 && connectionType === 'file' && (
                          <div className="space-y-4">
                              <h4 className="font-bold text-gray-800 flex items-center gap-2"><RefreshCw size={18} /> {t["datacenter.step2"]}</h4>
                              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                                  AI 已自动识别并映射了 8 个关键字段。
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="border p-3 rounded bg-gray-50 text-center text-sm font-mono text-gray-500">Source: mobile_encrypted</div>
                                  <div className="flex items-center justify-center gap-2"><ArrowRight size={14} className="text-gray-400" /> <span className="font-bold text-brand-blue">Target: mobile</span></div>
                                  <div className="border p-3 rounded bg-gray-50 text-center text-sm font-mono text-gray-500">Source: reg_dt</div>
                                  <div className="flex items-center justify-center gap-2"><ArrowRight size={14} className="text-gray-400" /> <span className="font-bold text-brand-blue">Target: registration_time</span></div>
                              </div>
                              <div className="flex justify-end pt-4">
                                  <button onClick={handleAutoMap} className="bg-brand-blue text-white px-6 py-2 rounded-lg font-bold">确认映射</button>
                              </div>
                          </div>
                      )}

                      {step === 3 && connectionType === 'db' && (
                           // DB flow skips manual mapping in this demo or assumes auto-map
                           <div className="space-y-6 text-center">
                               <h4 className="font-bold text-gray-800 flex items-center gap-2 justify-center"><AlertTriangle size={18} /> {t["datacenter.step3"]}</h4>
                               {isProcessing ? (
                                   <div className="py-10"><Loader2 size={40} className="animate-spin text-brand-blue mx-auto" /></div>
                               ) : (
                                   <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                                       <CheckCircle size={40} className="text-green-500 mx-auto mb-4" />
                                       <h3 className="text-xl font-bold text-green-700 mb-2">连接成功 & 质量检测通过</h3>
                                       <p className="text-green-600 mb-6">识别到 25 张表，数据质量评分: 95</p>
                                       <button onClick={handleFinishWizard} className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-green-700 transition-colors">
                                           完成接入
                                       </button>
                                   </div>
                               )}
                               {!isProcessing && !qualityReport && (
                                   <button onClick={runQualityCheck} className="bg-brand-blue text-white px-6 py-2 rounded-lg font-bold">开始检测</button>
                               )}
                           </div>
                      )}

                      {step === 4 && connectionType === 'file' && (
                          <div className="space-y-6 text-center">
                              <h4 className="font-bold text-gray-800 flex items-center gap-2 justify-center"><AlertTriangle size={18} /> {t["datacenter.step3"]}</h4>
                              {isProcessing ? (
                                  <div className="py-10"><Loader2 size={40} className="animate-spin text-brand-blue mx-auto" /></div>
                              ) : (
                                  <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                                      <CheckCircle size={40} className="text-green-500 mx-auto mb-4" />
                                      <h3 className="text-xl font-bold text-green-700 mb-2">检测通过</h3>
                                      <p className="text-green-600 mb-6">数据质量评分: 95</p>
                                      <button onClick={handleFinishWizard} className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-green-700 transition-colors">
                                          完成接入
                                      </button>
                                  </div>
                              )}
                              {!isProcessing && !qualityReport && (
                                  <button onClick={runQualityCheck} className="bg-brand-blue text-white px-6 py-2 rounded-lg font-bold">开始检测</button>
                              )}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
