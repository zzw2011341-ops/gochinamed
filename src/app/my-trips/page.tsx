'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  MapPin,
  DollarSign,
  Stethoscope,
  Plane,
  Clock,
  CheckCircle,
  XCircle,
  Hourglass,
  ArrowRight,
} from 'lucide-react';

interface Order {
  id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  totalAmount: number;
  currency: string;
  doctor: {
    id: string;
    nameEn: string;
    nameZh: string | null;
    title: string | null;
  } | null;
  hospital: {
    id: string;
    nameEn: string;
    nameZh: string | null;
    location: string;
  } | null;
  hasMedicalService: boolean;
  medicalFee: number;
  hotelFee: number;
  flightFee: number;
  treatmentType: string | null;
  itineraryCount: number;
  upcomingDates: Array<{
    type: string;
    date: Date;
    name: string;
  }>;
}

export default function MyTripsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [currentOrders, setCurrentOrders] = useState<Order[]>([]);
  const [historicalOrders, setHistoricalOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState({
    currentCount: 0,
    historicalCount: 0,
    totalCount: 0,
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchOrders();
  }, [user, router]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/bookings/list?userId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentOrders(data.data.current || []);
        setHistoricalOrders(data.data.historical || []);
        setSummary(data.data.summary || summary);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: string; label: { en: string; zh: string } }> = {
      'pending': { variant: 'secondary', label: { en: 'Pending', zh: '待处理' } },
      'confirmed': { variant: 'default', label: { en: 'Confirmed', zh: '已确认' } },
      'processing': { variant: 'default', label: { en: 'Processing', zh: '处理中' } },
      'completed': { variant: 'outline', label: { en: 'Completed', zh: '已完成' } },
      'cancelled': { variant: 'destructive', label: { en: 'Cancelled', zh: '已取消' } },
    };

    const config = statusConfig[status] || statusConfig['pending'];
    return (
      <Badge variant={config.variant as any}>
        {language === 'zh' ? config.label.zh : config.label.en}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      'flight': Plane,
      'hotel': MapPin,
      'ticket': Stethoscope,
      'car_rental': Calendar,
    };
    return icons[type] || Calendar;
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/book/confirmation/${order.id}`)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              {language === 'zh' ? '订单 #' : 'Order #'}{order.id.slice(-6)}
            </CardTitle>
            <CardDescription>
              {new Date(order.createdAt).toLocaleDateString()}
            </CardDescription>
          </div>
          {getStatusBadge(order.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 医疗服务信息 */}
        {order.hasMedicalService && (
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <Stethoscope className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              {order.doctor && (
                <div className="text-sm font-medium text-blue-900">
                  {language === 'zh' ? '医生' : 'Doctor'}: {order.doctor.nameEn} {order.doctor.nameZh && `(${order.doctor.nameZh})`}
                  {order.doctor.title && <span className="text-gray-600"> - {order.doctor.title}</span>}
                </div>
              )}
              {order.hospital && (
                <div className="text-sm text-blue-700">
                  {language === 'zh' ? '医院' : 'Hospital'}: {order.hospital.nameEn} {order.hospital.nameZh && `(${order.hospital.nameZh})`}
                </div>
              )}
              {order.treatmentType && (
                <div className="text-xs text-blue-600 mt-1">
                  {language === 'zh' ? '治疗类型' : 'Treatment Type'}: {order.treatmentType}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 即将到来的行程 */}
        {order.upcomingDates && order.upcomingDates.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 mb-2">
              {language === 'zh' ? '即将到来' : 'Upcoming'}
            </div>
            <div className="space-y-2">
              {order.upcomingDates.slice(0, 2).map((item, index) => {
                const Icon = getTypeIcon(item.type);
                return (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Icon className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{item.name}</span>
                    <span className="text-gray-500 ml-auto">
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 费用信息 */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {order.medicalFee > 0 && (
              <span className="flex items-center gap-1">
                <Stethoscope className="h-4 w-4" />
                ${order.medicalFee}
              </span>
            )}
            {order.flightFee > 0 && (
              <span className="flex items-center gap-1">
                <Plane className="h-4 w-4" />
                ${order.flightFee}
              </span>
            )}
            {order.hotelFee > 0 && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                ${order.hotelFee}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 font-semibold text-blue-600">
            <DollarSign className="h-4 w-4" />
            {order.currency} {order.totalAmount.toLocaleString()}
          </div>
        </div>

        {/* 查看详情按钮 */}
        <Button variant="ghost" size="sm" className="w-full">
          {language === 'zh' ? '查看详情' : 'View Details'} <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">
            {language === 'zh' ? '我的行程' : 'My Trips'}
          </h1>
          <p className="text-gray-600 mt-2">
            {language === 'zh' ? '管理您的医疗旅游行程' : 'Manage your medical tourism trips'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{language === 'zh' ? '当前订单' : 'Current Orders'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{summary.currentCount}</div>
              <div className="text-sm text-gray-500 mt-1">
                {language === 'zh' ? '进行中的行程' : 'Active trips'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{language === 'zh' ? '历史订单' : 'Historical Orders'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600">{summary.historicalCount}</div>
              <div className="text-sm text-gray-500 mt-1">
                {language === 'zh' ? '已完成的行程' : 'Completed trips'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{language === 'zh' ? '总订单数' : 'Total Orders'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.totalCount}</div>
              <div className="text-sm text-gray-500 mt-1">
                {language === 'zh' ? '所有行程' : 'All trips'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 订单列表 */}
        <Tabs defaultValue="current" className="space-y-6">
          <TabsList>
            <TabsTrigger value="current">
              {language === 'zh' ? '当前订单' : 'Current Orders'} ({summary.currentCount})
            </TabsTrigger>
            <TabsTrigger value="historical">
              {language === 'zh' ? '历史订单' : 'Historical Orders'} ({summary.historicalCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {currentOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {language === 'zh' ? '没有当前订单' : 'No current orders'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {language === 'zh' ? '开始规划您的医疗旅游之旅吧' : 'Start planning your medical tourism journey'}
                  </p>
                  <Button onClick={() => router.push('/book')}>
                    {language === 'zh' ? '预订行程' : 'Book a Trip'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="historical" className="space-y-4">
            {historicalOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {language === 'zh' ? '没有历史订单' : 'No historical orders'}
                  </h3>
                  <p className="text-gray-500">
                    {language === 'zh' ? '您的已完成的订单将显示在这里' : 'Your completed orders will appear here'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {historicalOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
