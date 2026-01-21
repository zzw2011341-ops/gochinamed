"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, MapPin, Plane, Building2, Stethoscope, Clock, DollarSign, Loader2 } from "lucide-react";

interface Itinerary {
  id: string;
  type: string;
  name: string;
  description: string;
  startDate: string | Date;
  endDate: string | Date | null;
  status: string;
  price: string;
}

interface Order {
  id: string;
  status: string;
  totalAmount: string;
  currency: string;
  createdAt: string | Date;
  itineraries: Itinerary[];
}

export default function MyTripsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchOrders();
  }, [user, router]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/orders?userId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'processing':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-gray-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getItineraryIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'flight':
        return <Plane className="h-5 w-5" />;
      case 'hotel':
        return <Building2 className="h-5 w-5" />;
      case 'medical':
        return <Stethoscope className="h-5 w-5" />;
      default:
        return <MapPin className="h-5 w-5" />;
    }
  };

  const formatDate = (date: string | Date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'zh' ? '返回首页' : 'Back to Home'}
          </Button>
          <h1 className="text-3xl font-bold">
            {language === 'zh' ? '我的行程' : 'My Trips'}
          </h1>
          <p className="text-gray-600 mt-2">
            {language === 'zh' ? '查看您的医疗旅行计划和预订详情' : 'View your medical travel plans and booking details'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {language === 'zh' ? '暂无行程' : 'No trips yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {language === 'zh' ? '您还没有创建任何医疗旅行计划' : 'You haven\'t created any medical travel plans yet'}
              </p>
              <Button onClick={() => router.push('/book')}>
                {language === 'zh' ? '立即预订' : 'Book Now'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/book/confirmation/${order.id}`)}
              >
                <CardHeader className="bg-gray-50 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        {language === 'zh' ? '订单 #' : 'Order #'} {order.id.slice(-8)}
                      </CardTitle>
                      <CardDescription>
                        {formatDate(order.createdAt)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.toUpperCase()}
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{language === 'zh' ? '总额' : 'Total'}</p>
                        <p className="text-xl font-bold text-blue-600">
                          ${order.totalAmount} {order.currency}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {order.itineraries && order.itineraries.length > 0 ? (
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {language === 'zh' ? '行程安排' : 'Itinerary'}
                        </h4>
                        <div className="grid gap-4 md:grid-cols-3">
                          {order.itineraries.map((item) => (
                            <Card key={item.id} className="border-l-4 border-l-blue-500">
                              <CardContent className="pt-4">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                                    {getItineraryIcon(item.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-semibold text-gray-900 mb-1">
                                      {item.name}
                                    </h5>
                                    <p className="text-sm text-gray-600 mb-2">
                                      {item.description}
                                    </p>
                                    {item.startDate && (
                                      <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(item.startDate)}
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between mt-2">
                                      <Badge variant="secondary" className="text-xs">
                                        {item.status.toUpperCase()}
                                      </Badge>
                                      <div className="flex items-center gap-1 text-sm font-medium text-blue-600">
                                        <DollarSign className="h-3 w-3" />
                                        ${item.price}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        {language === 'zh' ? '暂无行程详情' : 'No itinerary details'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
