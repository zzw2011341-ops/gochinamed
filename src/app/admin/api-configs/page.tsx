'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Trash2, TestTube, Save, CheckCircle, XCircle, Loader2 } from 'lucide-react';

// API提供商配置
const API_PROVIDERS = [
  {
    id: 'openweather',
    name: 'OpenWeatherMap',
    description: '天气和预报数据',
    category: 'weather',
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    freeTier: '1000次/天',
    website: 'https://openweathermap.org/api',
    implemented: true,
  },
  {
    id: 'exchangerate',
    name: 'ExchangeRate-API',
    description: '汇率转换数据',
    category: 'exchange',
    baseUrl: 'https://v6.exchangerate-api.com/v6',
    freeTier: '1500次/月',
    website: 'https://www.exchangerate-api.com',
    implemented: true,
  },
  {
    id: 'aviationstack',
    name: 'Aviation Stack',
    description: '航空和机场数据',
    category: 'aviation',
    baseUrl: 'http://api.aviationstack.com/v1',
    freeTier: '100次/月',
    website: 'https://aviationstack.com',
    implemented: true,
  },
  {
    id: 'amadeus',
    name: 'Amadeus API',
    description: '航班预订（推荐）',
    category: 'flight',
    baseUrl: 'https://test.api.amadeus.com/v1',
    freeTier: '免费测试环境',
    website: 'https://developers.amadeus.com',
    implemented: false,
  },
  {
    id: 'booking',
    name: 'Booking.com API',
    description: '酒店预订',
    category: 'hotel',
    baseUrl: 'https://distribution-xml.booking.com/2.4',
    freeTier: '需申请',
    website: 'https://developers.booking.com',
    implemented: false,
  },
  {
    id: 'ctrip',
    name: '携程API',
    description: '综合旅游服务',
    category: 'general',
    baseUrl: 'https://api.ctrip.com',
    freeTier: '需申请',
    website: 'https://open.ctrip.com',
    implemented: false,
  },
  {
    id: '12306',
    name: '12306/铁路API',
    description: '高铁/火车票预订',
    category: 'train',
    baseUrl: '',
    freeTier: '需对接第三方',
    website: 'https://www.12306.cn',
    implemented: false,
  },
  {
    id: 'hospital_booking',
    name: '医院预约API',
    description: '医院/医生预约',
    category: 'hospital',
    baseUrl: '',
    freeTier: '需对接第三方',
    website: '',
    implemented: false,
  },
];

interface ApiConfig {
  id: string;
  provider: string;
  name: string;
  description?: string;
  baseUrl: string;
  apiKey?: string;
  apiSecret?: string;
  webhookUrl?: string;
  isActive: boolean;
  isDefault: boolean;
  rateLimit?: number;
  timeout: number;
  retryCount: number;
  lastTestStatus?: string;
  lastTestMessage?: string;
  lastTestedAt?: Date;
}

export default function ApiConfigsPage() {
  const [configs, setConfigs] = useState<ApiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<ApiConfig | null>(null);
  const [testingConfig, setTestingConfig] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('implemented');

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/admin/api-configs');
      if (response.ok) {
        const data = await response.json();
        setConfigs(data.configs || []);
      }
    } catch (error) {
      console.error('Failed to fetch API configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (config: ApiConfig) => {
    setSaving(true);
    try {
      const url = config.id
        ? `/api/admin/api-configs/${config.id}`
        : '/api/admin/api-configs';
      const method = config.id ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        await fetchConfigs();
        setEditingConfig(null);
      } else {
        const error = await response.json();
        alert(`保存失败: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (provider: string) => {
    setTestingConfig(provider);
    try {
      const response = await fetch(`/api/admin/api-configs/${provider}/test`, {
        method: 'POST',
      });

      const result = await response.json();
      await fetchConfigs(); // 刷新测试状态
      alert(
        result.success
          ? '连接测试成功！'
          : `连接测试失败: ${result.error?.message || '未知错误'}`
      );
    } catch (error) {
      console.error('Failed to test connection:', error);
      alert('连接测试失败');
    } finally {
      setTestingConfig(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此API配置吗？')) return;

    try {
      const response = await fetch(`/api/admin/api-configs/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchConfigs();
      } else {
        alert('删除失败');
      }
    } catch (error) {
      console.error('Failed to delete config:', error);
      alert('删除失败');
    }
  };

  const getProviderConfig = (providerId: string) => {
    return configs.find((c) => c.provider === providerId);
  };

  const implementedProviders = API_PROVIDERS.filter((p) => p.implemented);
  const reservedProviders = API_PROVIDERS.filter((p) => !p.implemented);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">API配置管理</h1>
        <p className="text-muted-foreground">
          配置和管理第三方API集成服务
        </p>
      </div>

      <Alert>
        <AlertDescription>
          当前系统已集成天气、汇率、机场数据等开源API。酒店、医院、12306、航司等平台API接口已预留，可在配置后启用。
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="implemented">
            已实现API ({implementedProviders.length})
          </TabsTrigger>
          <TabsTrigger value="reserved">
            预留接口 ({reservedProviders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="implemented" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              以下API已实现，可立即配置并使用
            </p>
          </div>

          {implementedProviders.map((provider) => {
            const config = getProviderConfig(provider.id);
            return (
              <ApiConfigCard
                key={provider.id}
                provider={provider}
                config={config}
                onEdit={() => setEditingConfig({ ...provider, ...(config || {}) } as ApiConfig)}
                onDelete={config ? () => handleDelete(config.id) : undefined}
                onTest={config ? () => handleTest(provider.id) : undefined}
                isTesting={testingConfig === provider.id}
              />
            );
          })}
        </TabsContent>

        <TabsContent value="reserved" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              以下API接口已预留，配置后可对接相应平台
            </p>
          </div>

          {reservedProviders.map((provider) => {
            const config = getProviderConfig(provider.id);
            return (
              <ApiConfigCard
                key={provider.id}
                provider={provider}
                config={config}
                onEdit={() => setEditingConfig({ ...provider, ...(config || {}) } as ApiConfig)}
                onDelete={config ? () => handleDelete(config.id) : undefined}
                onTest={config ? () => handleTest(provider.id) : undefined}
                isTesting={testingConfig === provider.id}
              />
            );
          })}
        </TabsContent>
      </Tabs>

      {editingConfig && (
        <ApiConfigEditDialog
          config={editingConfig}
          providers={API_PROVIDERS}
          onSave={handleSave}
          onCancel={() => setEditingConfig(null)}
          saving={saving}
        />
      )}
    </div>
  );
}

function ApiConfigCard({
  provider,
  config,
  onEdit,
  onDelete,
  onTest,
  isTesting,
}: {
  provider: any;
  config?: ApiConfig;
  onEdit: () => void;
  onDelete?: () => void;
  onTest?: () => void;
  isTesting?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle>{provider.name}</CardTitle>
              {config?.isActive && (
                <Badge variant="default">已启用</Badge>
              )}
              {config?.isDefault && (
                <Badge variant="secondary">默认</Badge>
              )}
              {!provider.implemented && (
                <Badge variant="outline">预留接口</Badge>
              )}
            </div>
            <CardDescription className="mt-1">{provider.description}</CardDescription>
          </div>
          <div className="flex gap-2">
            {config && onTest && (
              <Button
                variant="outline"
                size="sm"
                onClick={onTest}
                disabled={isTesting || !config.isActive}
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4" />
                )}
                测试
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
              {config ? '编辑' : '配置'}
            </Button>
            {config && onDelete && (
              <Button variant="outline" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">免费额度:</span>{' '}
            {provider.freeTier}
          </div>
          <div>
            <span className="text-muted-foreground">网站:</span>{' '}
            {provider.website && (
              <a
                href={provider.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {provider.website}
              </a>
            )}
          </div>
          {config && (
            <>
              <div>
                <span className="text-muted-foreground">Base URL:</span>{' '}
                {config.baseUrl}
              </div>
              <div>
                <span className="text-muted-foreground">最后测试:</span>{' '}
                {config.lastTestedAt
                  ? new Date(config.lastTestedAt).toLocaleString('zh-CN')
                  : '未测试'}
              </div>
              {config.lastTestStatus && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">测试状态:</span>{' '}
                  {config.lastTestStatus === 'success' ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      成功
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <XCircle className="h-4 w-4" />
                      {config.lastTestMessage || '失败'}
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ApiConfigEditDialog({
  config,
  providers,
  onSave,
  onCancel,
  saving,
}: {
  config: ApiConfig;
  providers: any[];
  onSave: (config: ApiConfig) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [formData, setFormData] = useState<ApiConfig>(config);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>
            {config.id ? '编辑API配置' : '配置API'}
          </CardTitle>
          <CardDescription>
            {config.id ? '修改API配置信息' : '添加新的API配置'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>API提供商</Label>
            <Select
              value={formData.provider}
              onValueChange={(value) => {
                const provider = providers.find((p) => p.id === value);
                if (provider) {
                  setFormData({
                    ...formData,
                    provider: value,
                    name: provider.name,
                    description: provider.description,
                    baseUrl: provider.baseUrl,
                  });
                }
              }}
              disabled={!!config.id}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {!p.implemented && '(预留)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>API密钥</Label>
            <Input
              type="password"
              value={formData.apiKey || ''}
              onChange={(e) =>
                setFormData({ ...formData, apiKey: e.target.value })
              }
              placeholder="输入API密钥"
            />
          </div>

          <div className="space-y-2">
            <Label>API密钥（Secret，可选）</Label>
            <Input
              type="password"
              value={formData.apiSecret || ''}
              onChange={(e) =>
                setFormData({ ...formData, apiSecret: e.target.value })
              }
              placeholder="输入API密钥（如有）"
            />
          </div>

          <div className="space-y-2">
            <Label>基础URL</Label>
            <Input
              value={formData.baseUrl}
              onChange={(e) =>
                setFormData({ ...formData, baseUrl: e.target.value })
              }
              placeholder="API基础URL"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>速率限制（次/分钟）</Label>
              <Input
                type="number"
                value={formData.rateLimit || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rateLimit: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="如：100"
              />
            </div>

            <div className="space-y-2">
              <Label>超时时间（毫秒）</Label>
              <Input
                type="number"
                value={formData.timeout}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    timeout: parseInt(e.target.value),
                  })
                }
                placeholder="默认：30000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>重试次数</Label>
              <Input
                type="number"
                value={formData.retryCount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    retryCount: parseInt(e.target.value),
                  })
                }
                placeholder="默认：3"
              />
            </div>

            <div className="space-y-2">
              <Label>Webhook URL（可选）</Label>
              <Input
                value={formData.webhookUrl || ''}
                onChange={(e) =>
                  setFormData({ ...formData, webhookUrl: e.target.value })
                }
                placeholder="Webhook回调地址"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
              <Label htmlFor="isActive">启用</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isDefault: checked })
                }
              />
              <Label htmlFor="isDefault">设为默认</Label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onCancel}>
              取消
            </Button>
            <Button onClick={() => onSave(formData)} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
