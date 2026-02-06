
import React, { useState, useMemo, useEffect } from 'react';
import { GeneratedFeature } from '../types';
import { MOCK_FEATURES, MOCK_TABLES, MOCK_COLUMNS } from '../constants';
import { generateFeatureSql, autoDiscoverFeatures, suggestFeatureCategories } from '../services/geminiService';
import { translations } from '../i18n';
import { 
    Layers, Plus, Sparkles, Loader2, Search, Filter, Edit2, 
    Trash2, UploadCloud, X, Wand2, Terminal, Save, Code, CheckCircle,
    Database, BrainCircuit, Tag, Folder, Settings, Check, Pencil, CheckSquare
} from 'lucide-react';

interface FeatureStoreProps {}

export const FeatureStore: React.FC<FeatureStoreProps> = () => {
  const t = translations;
  const [featuresList, setFeaturesList] = useState<GeneratedFeature[]>(MOCK_FEATURES);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  // Category Management State
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isManageMode, setIsManageMode] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Edit Category State
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [tempCategoryName, setTempCategoryName] = useState('');

  // Feature Creation/Edit Modal
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [featureName, setFeatureName] = useState('');
  const [featureDesc, setFeatureDesc] = useState('');
  const [featureSql, setFeatureSql] = useState('');
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isGeneratingSql, setIsGeneratingSql] = useState(false);
  
  // Auto Tagging State
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  
  // Auto Discover State
  const [isAutoDiscovering, setIsAutoDiscovering] = useState(false);
  const [discoverStep, setDiscoverStep] = useState(0);

  // --- Feature Management Logic ---

  // Derive all unique categories from features + custom added ones
  const allCategories = useMemo(() => {
      const featureCats = new Set<string>();
      featuresList.forEach(f => f.categories?.forEach(c => featureCats.add(c)));
      
      // Combine with custom categories and deduplicate
      const uniqueCats = Array.from(new Set([...Array.from(featureCats), ...customCategories]));
      return ['All', ...uniqueCats.sort()];
  }, [featuresList, customCategories]);

  // Available categories for selection in modal (exclude 'All')
  const selectableCategories = useMemo(() => {
      return allCategories.filter(c => c !== 'All');
  }, [allCategories]);

  const handleAddCategory = () => {
      if (newCategoryName && !allCategories.includes(newCategoryName)) {
          setCustomCategories([...customCategories, newCategoryName]);
          setNewCategoryName('');
      }
  };

  const handleStartEditCategory = (cat: string) => {
      setEditingCategoryName(cat);
      setTempCategoryName(cat);
  };

  const handleSaveEditCategory = () => {
      if (!editingCategoryName || !tempCategoryName.trim()) {
          setEditingCategoryName(null);
          return;
      }
      
      const oldName = editingCategoryName;
      const newName = tempCategoryName.trim();

      if (oldName === newName) {
          setEditingCategoryName(null);
          return;
      }

      if (allCategories.includes(newName) && !customCategories.includes(newName)) {
          alert('分类名称已存在');
          return;
      }

      // 1. Update Custom Categories list (if applicable)
      setCustomCategories(prev => {
          const idx = prev.indexOf(oldName);
          if (idx > -1) {
              const newArr = [...prev];
              newArr[idx] = newName;
              return newArr;
          }
          return [...prev, newName]; // Ensure it exists if it was only implicitly in features
      });

      // 2. Update all features using this category
      setFeaturesList(prev => prev.map(f => ({
          ...f,
          categories: f.categories.map(c => c === oldName ? newName : c)
      })));

      // 3. Update active category if viewing
      if (activeCategory === oldName) {
          setActiveCategory(newName);
      }

      setEditingCategoryName(null);
  };

  const handleDeleteCategory = (catToDelete: string) => {
      if (confirm(`确定要删除分类 "${catToDelete}" 吗？此操作不会删除特征，仅移除标签。`)) {
          setCustomCategories(prev => prev.filter(c => c !== catToDelete));
          // Also remove from features? Optional, but cleaner:
          setFeaturesList(prev => prev.map(f => ({
              ...f,
              categories: f.categories.filter(c => c !== catToDelete)
          })));
          if (activeCategory === catToDelete) setActiveCategory('All');
      }
  };

  const handleOpenFeatureModal = (featureToEdit?: GeneratedFeature) => {
      if (featureToEdit) {
          setEditingFeatureId(featureToEdit.id);
          setFeatureName(featureToEdit.name);
          setFeatureDesc(featureToEdit.description);
          setFeatureSql(featureToEdit.ruleSql || '');
          setSelectedTableId(featureToEdit.tableId || (MOCK_TABLES.length > 0 ? MOCK_TABLES[0].id : ''));
          setSelectedCategories(featureToEdit.categories || []);
      } else {
          setEditingFeatureId(null);
          setFeatureName('');
          setFeatureDesc('');
          setFeatureSql('');
          setSelectedTableId(MOCK_TABLES.length > 0 ? MOCK_TABLES[0].id : '');
          setSelectedCategories([]);
      }
      setShowFeatureModal(true);
  };

  const handleToggleCategorySelection = (cat: string) => {
      if (selectedCategories.includes(cat)) {
          setSelectedCategories(prev => prev.filter(c => c !== cat));
      } else {
          setSelectedCategories(prev => [...prev, cat]);
      }
  };

  const handleAiCategorize = async () => {
      if (!featureName && !featureDesc) {
          alert('请先输入特征名称或描述');
          return;
      }
      setIsSuggestingTags(true);
      try {
          const suggested = await suggestFeatureCategories(
              featureName, 
              featureDesc, 
              featureSql, 
              selectableCategories
          );
          
          // Merge with existing
          const merged = Array.from(new Set([...selectedCategories, ...suggested]));
          setSelectedCategories(merged);
          
          // Ensure new tags are added to custom categories so they appear in list
          const newTags = suggested.filter(t => !allCategories.includes(t));
          if (newTags.length > 0) {
              setCustomCategories(prev => [...prev, ...newTags]);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsSuggestingTags(false);
      }
  };

  const handleGenerateSql = async () => {
      if (!featureDesc || !selectedTableId) return;
      setIsGeneratingSql(true);
      
      const table = MOCK_TABLES.find(t => t.id === selectedTableId);
      const cols = MOCK_COLUMNS.filter(c => c.tableId === selectedTableId);
      
      if (table && cols) {
          const sql = await generateFeatureSql(featureDesc, table, cols);
          setFeatureSql(sql);
      }
      setIsGeneratingSql(false);
  };

  const handleSaveFeature = () => {
      if (!selectedTableId) return;
      
      const finalCategories = selectedCategories.length > 0 ? selectedCategories : ['Custom'];

      if (editingFeatureId) {
          // Update existing
          setFeaturesList(prev => prev.map(f => {
              if (f.id === editingFeatureId) {
                  return {
                      ...f,
                      name: featureName,
                      description: featureDesc,
                      ruleSql: featureSql,
                      tableId: selectedTableId,
                      categories: finalCategories
                  };
              }
              return f;
          }));
      } else {
          // Create new
          const newFeature: GeneratedFeature = {
              id: `ft_new_${Date.now()}`,
              tableId: selectedTableId,
              name: featureName || '未命名特征',
              code: `feat_${Date.now()}`,
              categories: finalCategories,
              description: featureDesc,
              status: 'draft',
              creationType: isGeneratingSql ? 'ai' : 'manual',
              ruleSql: featureSql
          };
          setFeaturesList([newFeature, ...featuresList]);
      }
      setShowFeatureModal(false);
  };

  const handleTogglePublish = (featureId: string) => {
      setFeaturesList(prev => prev.map(f => {
          if (f.id === featureId) {
              const newStatus = f.status === 'published' ? 'draft' : 'published';
              return { ...f, status: newStatus };
          }
          return f;
      }));
  };

  const handleDeleteFeature = (featureId: string) => {
      if (confirm('确定要删除这个特征吗？')) {
          setFeaturesList(prev => prev.filter(f => f.id !== featureId));
      }
  };

  const handleAutoDiscover = async () => {
      // For demo, defaulting to the orders table which has rich data
      const tableId = 'tb_2'; 
      const table = MOCK_TABLES.find(t => t.id === tableId);
      const cols = MOCK_COLUMNS.filter(c => c.tableId === tableId);

      if (!table || !cols) return;

      setIsAutoDiscovering(true);
      setDiscoverStep(0);

      // Simulate steps progression to give visual feedback
      // Step 0 -> 1 -> 2 -> 3 (API Wait) -> 4 (Done)
      const stepInterval = setInterval(() => {
          setDiscoverStep(prev => (prev < 3 ? prev + 1 : prev));
      }, 1200);

      try {
          const discoveredFeatures = await autoDiscoverFeatures(table, cols);
          
          clearInterval(stepInterval);
          setDiscoverStep(4); // Force completion step

          // Small delay to show the final checkmark before closing
          setTimeout(() => {
              if (discoveredFeatures.length > 0) {
                  const featuresAsDraft = discoveredFeatures.map(f => ({ ...f, status: 'draft' as const }));
                  setFeaturesList(prev => [...featuresAsDraft, ...prev]);
              }
              setIsAutoDiscovering(false);
              setDiscoverStep(0);
          }, 800);
      } catch (error) {
          console.error(error);
          clearInterval(stepInterval);
          setIsAutoDiscovering(false);
          alert("特征发现服务暂时不可用，请稍后重试。");
      }
  };

  const filteredFeatures = useMemo(() => {
      return featuresList.filter(f => {
          const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                f.description.toLowerCase().includes(searchTerm.toLowerCase());
          
          // Check if feature belongs to active category
          const matchesCategory = activeCategory === 'All' || (f.categories && f.categories.includes(activeCategory));
          
          return matchesSearch && matchesCategory;
      });
  }, [featuresList, searchTerm, activeCategory]);

  const getTableName = (id?: string) => MOCK_TABLES.find(t => t.id === id)?.name || 'Unknown Table';

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                {t["featurestore.title"]}
            </h2>
            <p className="text-gray-500 text-sm mt-1">{t["featurestore.subtitle"]}</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={handleAutoDiscover}
                disabled={isAutoDiscovering}
                className="bg-purple-50 text-purple-700 border border-purple-200 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-70"
            >
                {isAutoDiscovering ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {t["featurestore.discover"]}
            </button>
            <button 
                onClick={() => handleOpenFeatureModal()}
                className="bg-brand-blue text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2"
            >
                <Plus size={18} /> {t["featurestore.create"]}
            </button>
        </div>
      </div>

      <div className="flex gap-6 h-full min-h-0">
          {/* Category Sidebar */}
          <div className="w-64 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col shrink-0 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">特征分类</h3>
                  <button 
                    onClick={() => setIsManageMode(!isManageMode)} 
                    className={`p-1.5 rounded-md transition-colors ${isManageMode ? 'bg-brand-blue text-white' : 'text-gray-400 hover:bg-gray-200'}`}
                    title="管理分类"
                  >
                      <Settings size={14} />
                  </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {allCategories.map(cat => (
                      <div key={cat} className="group relative">
                          {editingCategoryName === cat ? (
                              <div className="flex items-center gap-1 px-2 py-1.5">
                                  <input 
                                      value={tempCategoryName} 
                                      onChange={(e) => setTempCategoryName(e.target.value)}
                                      className="w-full text-sm border border-brand-blue rounded px-2 py-1 focus:outline-none"
                                      autoFocus
                                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEditCategory()}
                                  />
                                  <button onClick={handleSaveEditCategory} className="text-green-600 p-1"><CheckSquare size={16}/></button>
                              </div>
                          ) : (
                              <button
                                  onClick={() => !isManageMode && setActiveCategory(cat)}
                                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${
                                      !isManageMode && activeCategory === cat 
                                      ? 'bg-blue-50 text-brand-blue' 
                                      : 'text-gray-600 hover:bg-gray-50'
                                  }`}
                              >
                                  {cat === 'All' ? <Layers size={16} /> : <Folder size={16} />}
                                  <span>{cat}</span>
                                  {cat !== 'All' && !isManageMode && (
                                      <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                          {featuresList.filter(f => f.categories?.includes(cat)).length}
                                      </span>
                                  )}
                              </button>
                          )}
                          
                          {/* Manage Actions */}
                          {isManageMode && cat !== 'All' && editingCategoryName !== cat && (
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleStartEditCategory(cat); }}
                                    className="text-gray-400 hover:text-brand-blue p-1.5 bg-white shadow-sm rounded-full"
                                  >
                                      <Pencil size={12} />
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat); }}
                                    className="text-red-400 hover:text-red-600 p-1.5 bg-white shadow-sm rounded-full hover:bg-red-50"
                                  >
                                      <Trash2 size={12} />
                                  </button>
                              </div>
                          )}
                      </div>
                  ))}
              </div>

              {/* Add New Category Input */}
              {isManageMode && (
                  <div className="p-3 border-t border-gray-100 bg-gray-50">
                      <div className="relative">
                          <input 
                              type="text"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              placeholder="输入新分类..."
                              className="w-full pl-3 pr-8 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand-blue outline-none"
                              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                          />
                          <button 
                            onClick={handleAddCategory}
                            disabled={!newCategoryName}
                            className="absolute right-1 top-1.5 p-1 text-gray-400 hover:text-brand-blue disabled:opacity-50"
                          >
                              <Plus size={14} />
                          </button>
                      </div>
                  </div>
              )}
          </div>

          {/* Main List Area */}
          <div className="flex-1 flex flex-col min-h-0">
              {/* Toolbar */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4 flex items-center justify-between">
                  <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                      <input 
                          type="text" 
                          placeholder="搜索特征名称或描述..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 outline-none text-sm"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 gap-4">
                      {filteredFeatures.map(feat => (
                          <div key={feat.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
                              <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-lg ${feat.status === 'published' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                          <Layers size={20} />
                                      </div>
                                      <div>
                                          <h4 className="font-bold text-gray-800 text-lg">{feat.name}</h4>
                                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                              <code className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">{feat.code}</code>
                                              <span>·</span>
                                              <span>{getTableName(feat.tableId)}</span>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      {/* Categories Tags */}
                                      <div className="flex gap-1">
                                          {feat.categories?.map(cat => (
                                              <span key={cat} className="text-xs px-2 py-1 rounded font-bold bg-blue-50 text-blue-600">
                                                  {cat}
                                              </span>
                                          ))}
                                      </div>
                                      <span className={`text-xs px-2 py-1 rounded font-bold border ${
                                          feat.status === 'published' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                                      }`}>
                                          {feat.status === 'published' ? '已发布' : '草稿'}
                                      </span>
                                  </div>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-4 pl-[52px]">{feat.description}</p>
                              
                              <div className="flex justify-between items-center pl-[52px] pt-3 border-t border-gray-50">
                                  <div className="flex gap-3 text-xs text-gray-400">
                                      {feat.creationType === 'ai' && <span className="flex items-center gap-1"><Wand2 size={12} /> AI 生成</span>}
                                      {feat.creationType === 'manual' && <span className="flex items-center gap-1"><Code size={12} /> 手动编写</span>}
                                      {feat.creationType === 'auto' && <span className="flex items-center gap-1"><Sparkles size={12} /> 自动发现</span>}
                                  </div>
                                  
                                  <div className="flex gap-2">
                                      <button 
                                          onClick={() => handleTogglePublish(feat.id)}
                                          className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                              feat.status === 'published' 
                                              ? 'text-red-600 hover:bg-red-50' 
                                              : 'text-green-600 hover:bg-green-50'
                                          }`}
                                      >
                                          {feat.status === 'published' ? <X size={14} /> : <UploadCloud size={14} />}
                                          {feat.status === 'published' ? '下架' : '发布'}
                                      </button>
                                      <button 
                                          onClick={() => handleOpenFeatureModal(feat)}
                                          className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                                      >
                                          <Edit2 size={14} /> 编辑
                                      </button>
                                      <button 
                                          onClick={() => handleDeleteFeature(feat.id)}
                                          className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                      >
                                          <Trash2 size={14} />
                                      </button>
                                  </div>
                              </div>
                          </div>
                      ))}
                      {filteredFeatures.length === 0 && (
                          <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                              <Search size={32} className="mx-auto mb-2 opacity-50" />
                              <p>该分类下暂无特征</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </div>

      {/* Auto Discovery Progress Modal */}
      {isAutoDiscovering && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 text-center relative overflow-hidden">
                  <div className="mb-6 relative z-10">
                      <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                          <Sparkles size={32} className="animate-pulse" />
                          <div className="absolute inset-0 border-4 border-purple-200 rounded-full animate-spin-slow border-t-purple-500"></div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">AI 正在探索特征</h3>
                      <p className="text-sm text-gray-500 mt-2">基于 {getTableName('tb_2')} 表结构深度分析中...</p>
                  </div>

                  <div className="space-y-4 text-left bg-gray-50 p-6 rounded-xl border border-gray-100 relative z-10">
                      {[
                          { icon: Database, label: "分析数据元数据与分布" },
                          { icon: Search, label: "识别关键业务模式" },
                          { icon: BrainCircuit, label: "构建特征工程逻辑" },
                          { icon: Code, label: "生成 SQL 计算规则" }
                      ].map((step, idx) => (
                          <div key={idx} className={`flex items-center gap-3 transition-opacity duration-300 ${idx <= discoverStep ? 'opacity-100' : 'opacity-30'}`}>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                                  idx < discoverStep ? 'bg-green-500 border-green-500 text-white' :
                                  idx === discoverStep ? 'bg-white border-purple-500 text-purple-500 animate-pulse' :
                                  'bg-gray-100 border-gray-300 text-gray-400'
                              }`}>
                                  {idx < discoverStep ? <CheckCircle size={14} /> : <step.icon size={12} />}
                              </div>
                              <span className={`text-sm font-medium ${idx === discoverStep ? 'text-purple-700' : 'text-gray-600'}`}>{step.label}</span>
                          </div>
                      ))}
                  </div>
                  
                  {/* Background Decoration */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 animate-gradient-x"></div>
              </div>
          </div>
      )}

      {/* Feature Creation Modal */}
      {showFeatureModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                          <Layers className="text-brand-blue" /> {editingFeatureId ? '编辑特征' : t["featurestore.modal.title"]}
                      </h3>
                      <button onClick={() => setShowFeatureModal(false)} className="text-gray-400 hover:text-gray-600">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-1 space-y-6">
                      {/* Inputs */}
                      <div>
                          <label className="text-sm font-bold text-gray-700 mb-1 block">来源数据表</label>
                          <select 
                              value={selectedTableId}
                              onChange={(e) => setSelectedTableId(e.target.value)}
                              className="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-brand-blue/20 outline-none text-sm"
                              disabled={!!editingFeatureId}
                          >
                              {MOCK_TABLES.map(t => (
                                  <option key={t.id} value={t.id}>{t.name} - {t.description}</option>
                              ))}
                          </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-sm font-bold text-gray-700 mb-1 block">特征名称</label>
                              <input 
                                  value={featureName}
                                  onChange={(e) => setFeatureName(e.target.value)}
                                  className="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-brand-blue/20 outline-none text-sm"
                                  placeholder="例如：高价值流失预警"
                              />
                          </div>
                          <div>
                              <label className="text-sm font-bold text-gray-700 mb-1 block">特征标识 (Code)</label>
                              <input 
                                  value={editingFeatureId && featuresList.find(f => f.id === editingFeatureId)?.code || `feat_${Date.now().toString().slice(-6)}`}
                                  disabled
                                  className="w-full p-2 border border-gray-200 rounded bg-gray-50 text-gray-500 text-sm font-mono"
                              />
                          </div>
                      </div>

                      {/* Multi-Category Selector with AI Button */}
                      <div>
                          <label className="text-sm font-bold text-gray-700 mb-1 block flex justify-between items-center">
                              <span>特征分类 (支持多选)</span>
                              <button 
                                onClick={handleAiCategorize}
                                disabled={isSuggestingTags || (!featureName && !featureDesc)}
                                className="text-xs flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100 hover:bg-purple-100 disabled:opacity-50 transition-colors"
                              >
                                  {isSuggestingTags ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />}
                                  AI 智能分类
                              </button>
                          </label>
                          <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                              {selectableCategories.map(cat => {
                                  const isSelected = selectedCategories.includes(cat);
                                  return (
                                      <button
                                          key={cat}
                                          onClick={() => handleToggleCategorySelection(cat)}
                                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                              isSelected 
                                              ? 'bg-brand-blue text-white shadow-md' 
                                              : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                                          }`}
                                      >
                                          {isSelected && <Check size={12} />}
                                          {cat}
                                      </button>
                                  );
                              })}
                              {selectableCategories.length === 0 && <span className="text-xs text-gray-400">暂无自定义分类</span>}
                          </div>
                      </div>

                      <div>
                          <label className="text-sm font-bold text-gray-700 mb-1 block">特征描述 (Prompt)</label>
                          <div className="relative">
                              <textarea 
                                  value={featureDesc}
                                  onChange={(e) => setFeatureDesc(e.target.value)}
                                  className="w-full p-3 border border-gray-200 rounded focus:ring-2 focus:ring-brand-blue/20 outline-none text-sm h-24 resize-none pr-24"
                                  placeholder="描述您想要提取的特征逻辑，例如：计算过去30天支付金额大于500元的用户..."
                              />
                              <button 
                                  onClick={handleGenerateSql}
                                  disabled={isGeneratingSql || !featureDesc}
                                  className="absolute right-2 bottom-2 bg-purple-600 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 hover:bg-purple-700 transition-colors disabled:opacity-50"
                              >
                                  {isGeneratingSql ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                                  {t["featurestore.modal.ai"]}
                              </button>
                          </div>
                      </div>

                      <div>
                          <label className="text-sm font-bold text-gray-700 mb-1 block flex justify-between">
                              <span>{t["featurestore.modal.sql"]}</span>
                              <span className="text-xs text-gray-400 font-normal">基于 {getTableName(selectedTableId)}</span>
                          </label>
                          <div className="relative">
                              <textarea 
                                  value={featureSql}
                                  onChange={(e) => setFeatureSql(e.target.value)}
                                  className="w-full p-4 bg-gray-900 text-green-400 font-mono text-xs rounded-lg h-40 resize-none focus:ring-2 focus:ring-brand-blue/20 outline-none"
                                  placeholder="-- 点击上方生成按钮，或手动编写 SQL..."
                              />
                          </div>
                      </div>
                  </div>

                  <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                      <button 
                          onClick={() => setShowFeatureModal(false)}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors"
                      >
                          {t["common.cancel"]}
                      </button>
                      <button 
                          onClick={handleSaveFeature}
                          disabled={!featureName || !featureSql}
                          className="px-6 py-2 bg-brand-blue text-white rounded-lg font-bold text-sm shadow hover:bg-opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                          <Save size={16} /> {t["common.save"]}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
