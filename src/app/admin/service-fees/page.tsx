'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Percent,
  DollarSign,
  Save,
  RefreshCw,
  Info,
  CheckCircle,
} from 'lucide-react';

interface ServiceFee {
  id: string;
  type: string;
  rate: number;
  minFee: number;
  maxFee: number | null;
  descriptionEn: string;
  descriptionZh: string;
  isActive: boolean;
}

export default function ServiceFeesPage() {
  const { language } = useLanguage();
  const [fees, setFees] = useState<ServiceFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadFees();
  }, []);

  const loadFees = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/service-fees');
      if (response.ok) {
        const data = await response.json();
        setFees(data.fees);
      }
    } catch (error) {
      console.error('Failed to load service fees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeeChange = (index: number, field: keyof ServiceFee, value: any) => {
    const newFees = [...fees];
    newFees[index] = { ...newFees[index], [field]: value };
    setFees(newFees);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = fees.map(fee =>
        fetch('/api/admin/service-fees', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fee),
        })
      );

      await Promise.all(promises);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save service fees:', error);
    } finally {
      setSaving(false);
    }
  };

  const getFeeIcon = (type: string) => {
    switch (type) {
      case 'medical':
        return '🏥';
      case 'flight':
        return '✈️';
      case 'hotel':
        return '🏨';
      case 'ticket':
        return '🎫';
      case 'general':
        return '⚙️';
      default:
        return '💰';
    }
  };

  const getFeeName = (type: string) => {
    switch (type) {
      case 'medical':
        return language === 'zh' ? '医疗服务费' : 'Medical Service Fee';
      case 'flight':
        return language === 'zh' ? '航班预订费' : 'Flight Booking Fee';
      case 'hotel':
        return language === 'zh' ? '酒店预订费' : 'Hotel Booking Fee';
      case 'ticket':
        return language === 'zh' ? '景点门票费' : 'Attraction Ticket Fee';
      case 'general':
        return language === 'zh' ? '综合服务费' : 'General Service Fee';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {language === 'zh' ? '服务费率管理' : 'Service Fee Management'}
          </h1>
          <p className="text-gray-600 mt-1">
            {language === 'zh' ? '调整各项服务的费率设置' : 'Manage service fee rates'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadFees}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {language === 'zh' ? '重置' : 'Reset'}
          </Button>
          <Button onClick={handleSave} disabled={saving || saved}>
            {saved ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {language === 'zh' ? '已保存' : 'Saved'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {language === 'zh' ? '保存更改' : 'Save Changes'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <div className="font-medium mb-1">
                {language === 'zh' ? '费率说明' : 'Fee Rate Explanation'}
              </div>
              <p className="text-blue-700">
                {language === 'zh'
                  ? '服务费率按订单金额的百分比计算。您可以设置最低费用和最高费用限制来控制费用范围。费率值应为 0 到 1 之间的小数（例如 0.05 表示 5%）。'
                  : 'Service fees are calculated as a percentage of the order amount. You can set minimum and maximum fee limits to control the fee range. The rate should be a decimal between 0 and 1 (e.g., 0.05 for 5%).'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fees.map((fee, index) => (
          <Card key={fee.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getFeeIcon(fee.type)}</span>
                  <CardTitle className="text-lg">
                    {getFeeName(fee.type)}
                  </CardTitle>
                </div>
                <Badge variant={fee.isActive ? 'default' : 'secondary'}>
                  {fee.isActive
                    ? (language === 'zh' ? '启用' : 'Active')
                    : (language === 'zh' ? '停用' : 'Inactive')}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                {language === 'zh' ? fee.descriptionZh : fee.descriptionEn}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Fee Rate */}
              <div>
                <Label htmlFor={`rate-${index}`} className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  {language === 'zh' ? '费率 (%)' : 'Fee Rate (%)'}
                </Label>
                <Input
                  id={`rate-${index}`}
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={(fee.rate * 100).toFixed(2)}
                  onChange={(e) =>
                    handleFeeChange(index, 'rate', parseFloat(e.target.value) / 100)
                  }
                  disabled={!fee.isActive}
                  className="mt-1"
                />
              </div>

              {/* Min Fee */}
              <div>
                <Label htmlFor={`minFee-${index}`} className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {language === 'zh' ? '最低费用' : 'Minimum Fee'}
                </Label>
                <Input
                  id={`minFee-${index}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={fee.minFee.toFixed(2)}
                  onChange={(e) =>
                    handleFeeChange(index, 'minFee', parseFloat(e.target.value))
                  }
                  disabled={!fee.isActive}
                  className="mt-1"
                />
              </div>

              {/* Max Fee */}
              <div>
                <Label htmlFor={`maxFee-${index}`} className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {language === 'zh' ? '最高费用' : 'Maximum Fee'}
                </Label>
                <Input
                  id={`maxFee-${index}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={fee.maxFee?.toFixed(2) || ''}
                  onChange={(e) =>
                    handleFeeChange(
                      index,
                      'maxFee',
                      e.target.value ? parseFloat(e.target.value) : null
                    )
                  }
                  disabled={!fee.isActive}
                  className="mt-1"
                  placeholder={language === 'zh' ? '留空表示无限制' : 'Leave empty for no limit'}
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">
                  {language === 'zh' ? '启用此费率' : 'Enable this fee'}
                </span>
                <Switch
                  checked={fee.isActive}
                  onCheckedChange={(checked) => handleFeeChange(index, 'isActive', checked)}
                />
              </div>

              {/* Example Calculation */}
              {fee.isActive && (
                <div className="bg-gray-50 rounded p-3 space-y-1">
                  <div className="text-xs font-medium text-gray-700">
                    {language === 'zh' ? '费用计算示例' : 'Fee Calculation Example'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {language === 'zh' ? '订单金额：' : 'Order Amount:'} $1000
                  </div>
                  <div className="text-xs text-blue-600 font-medium">
                    {language === 'zh' ? '服务费：' : 'Service Fee:'} $
                    {Math.min(
                      Math.max(1000 * fee.rate, fee.minFee),
                      fee.maxFee || Infinity
                    ).toFixed(2)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
