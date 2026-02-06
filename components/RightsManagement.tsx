
import React, { useState } from 'react';
import { MarketingRight, RightType } from '../types';
import { translations } from '../i18n';
import { 
    Gift, Tag, Search, Plus, Filter, AlertCircle, Edit2, Trash2, 
    Ticket, ShoppingBag, Coins, CreditCard, Percent, Battery, BatteryWarning
} from 'lucide-react';

interface RightsManagementProps {
    rights: MarketingRight[];
    onSave: (right: MarketingRight) => void;
    onDelete: (id: string) => void;
}

export const RightsManagement: React.FC<RightsManagementProps> = ({ rights, onSave, onDelete }) => {
    const t = translations;
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    
    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingRightId, setEditingRightId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<MarketingRight>>({});

    // Filter Logic
    const filteredRights = rights.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || r.type === filterType;
        return matchesSearch && matchesType;
    });

    // KPI Calculations
    const totalRights = rights.length;
    const totalStock = rights.reduce((sum, r) => sum + r.totalStock, 0);
    const totalUsed = rights.reduce((sum, r) => sum + r.usedStock, 0);
    const utilizationRate = totalStock > 0 ? (totalUsed / totalStock) * 100 : 0;
    const lowStockCount = rights.filter(r => (r.totalStock - r.usedStock) / r.totalStock < 0.2).length;

    // Helper: Icon per Type
    const getRightIcon = (type: RightType) => {
        switch(type) {
            case 'coupon': return <Ticket size={18} className="text-blue-500" />;
            case 'discount': return <Percent size={18} className="text-orange-500" />;
            case 'gift': return <ShoppingBag size={18} className="text-pink-500" />;
            case 'point': return <Coins size={18} className="text-yellow-500" />;
            case 'virtual': return <CreditCard size={18} className="text-purple-500" />;
            default: return <Gift size={18} />;
        }
    };

    const getTypeName = (type: RightType) => {
        switch(type) {
            case 'coupon': return '优惠券';
            case 'discount': return '折扣券';
            case 'gift': return '实物礼品';
            case 'point': return '会员积分';
            case 'virtual': return '虚拟权益';
            default: return type;
        }
    };

    // Actions
    const handleOpenModal = (right?: MarketingRight) => {
        if (right) {
            setEditingRightId(right.id);
            setFormData(right);
        } else {
            setEditingRightId(null);
            setFormData({
                type: 'coupon',
                totalStock: 1000,
                usedStock: 0,
                costPerUnit: 0,
                status: 'active',
                tags: []
            });
        }
        setShowModal(true);
    };

    const handleSubmit = () => {
        if (!formData.name || !formData.type) return;
        
        const newRight: MarketingRight = {
            id: editingRightId || `r_new_${Date.now()}`,
            name: formData.name,
            type: formData.type as RightType,
            value: formData.value || '',
            totalStock: Number(formData.totalStock) || 0,
            usedStock: Number(formData.usedStock) || 0,
            costPerUnit: Number(formData.costPerUnit) || 0,
            category: formData.category || '通用',
            description: formData.description || '',
            tags: formData.tags || [],
            status: 'active'
        };
        
        onSave(newRight);
        setShowModal(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('确定要删除该权益吗？')) {
            onDelete(id);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        {t["rights.title"]}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">{t["rights.subtitle"]}</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-brand-blue text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2"
                >
                    <Plus size={18} /> {t["rights.create"]}
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">权益总数</div>
                    <div className="text-2xl font-bold text-gray-800">{totalRights}</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">库存总数</div>
                    <div className="text-2xl font-bold text-gray-800">{totalStock.toLocaleString()}</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">{t["rights.utilization"]}</div>
                    <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold text-gray-800">{utilizationRate.toFixed(1)}%</div>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{width: `${utilizationRate}%`}}></div>
                        </div>
                    </div>
                </div>
                <div className="bg-red-50 p-4 rounded-xl shadow-sm border border-red-100">
                    <div className="text-xs text-red-600 mb-1 flex items-center gap-1">
                        <AlertCircle size={12} /> 库存预警
                    </div>
                    <div className="text-2xl font-bold text-red-700">{lowStockCount} 个</div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4 flex items-center justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="搜索权益名称..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 outline-none text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-400" />
                    <select 
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="bg-gray-50 border-none text-sm font-medium text-gray-700 focus:ring-0 rounded-lg cursor-pointer hover:bg-gray-100 p-2"
                    >
                        <option value="all">全部分类</option>
                        <option value="coupon">优惠券</option>
                        <option value="discount">折扣券</option>
                        <option value="gift">实物礼品</option>
                        <option value="point">积分</option>
                    </select>
                </div>
            </div>

            {/* Rights List */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 font-medium">权益名称</th>
                                <th className="px-6 py-4 font-medium">{t["rights.type"]}</th>
                                <th className="px-6 py-4 font-medium">{t["rights.stock"]}</th>
                                <th className="px-6 py-4 font-medium">{t["rights.cost"]}</th>
                                <th className="px-6 py-4 font-medium">{t["rights.tags"]}</th>
                                <th className="px-6 py-4 font-medium text-right">{t["common.operation"]}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredRights.map(right => {
                                const stockPercent = (right.totalStock - right.usedStock) / right.totalStock;
                                const isLowStock = stockPercent < 0.2;
                                
                                return (
                                    <tr key={right.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-800">{right.name}</div>
                                            <div className="text-xs text-gray-400">{right.description}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">
                                                {getRightIcon(right.type)}
                                                {getTypeName(right.type)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                {isLowStock ? <BatteryWarning size={16} className="text-red-500" /> : <Battery size={16} className="text-green-500" />}
                                                <span className={`text-sm ${isLowStock ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                                                    {(right.totalStock - right.usedStock).toLocaleString()} / {right.totalStock.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className={`h-full ${isLowStock ? 'bg-red-500' : 'bg-green-500'}`} style={{width: `${stockPercent * 100}%`}}></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            ¥{right.costPerUnit}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {right.tags?.map(tag => (
                                                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-brand-blue rounded border border-blue-100">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleOpenModal(right)}
                                                    className="p-1.5 text-gray-400 hover:text-brand-blue hover:bg-blue-50 rounded transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(right.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                <Gift className="text-brand-blue" /> {t["rights.modal.title"]}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <Trash2 size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-bold text-gray-700 block mb-1">权益名称</label>
                                <input 
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-blue/20 outline-none"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="例如：满199减50大促券"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-bold text-gray-700 block mb-1">权益类型</label>
                                    <select 
                                        className="w-full p-2 border rounded-lg bg-white"
                                        value={formData.type || 'coupon'}
                                        onChange={e => setFormData({...formData, type: e.target.value as RightType})}
                                    >
                                        <option value="coupon">优惠券</option>
                                        <option value="discount">折扣券</option>
                                        <option value="gift">实物礼品</option>
                                        <option value="point">积分</option>
                                        <option value="virtual">虚拟权益</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-700 block mb-1">面额/价值</label>
                                    <input 
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.value || ''}
                                        onChange={e => setFormData({...formData, value: e.target.value})}
                                        placeholder="例如: 50, 8.5折"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-bold text-gray-700 block mb-1">总库存</label>
                                    <input 
                                        type="number"
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.totalStock}
                                        onChange={e => setFormData({...formData, totalStock: Number(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-700 block mb-1">单位成本 (元)</label>
                                    <input 
                                        type="number"
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.costPerUnit}
                                        onChange={e => setFormData({...formData, costPerUnit: Number(e.target.value)})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-700 block mb-1">适用分类</label>
                                <input 
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.category || ''}
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                    placeholder="例如：美妆, 洗护, 通用"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-700 block mb-1">描述</label>
                                <textarea 
                                    className="w-full p-2 border rounded-lg h-20 resize-none"
                                    value={formData.description || ''}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                            <button 
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors"
                            >
                                {t["common.cancel"]}
                            </button>
                            <button 
                                onClick={handleSubmit}
                                className="bg-brand-blue text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-opacity-90 transition-all"
                            >
                                {t["common.save"]}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
