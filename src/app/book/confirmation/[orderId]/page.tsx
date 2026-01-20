'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Cloud,
  FileText,
  AlertTriangle,
  CheckCircle2,
  User,
  Plane,
  Hotel,
  Ticket,
  Stethoscope,
} from 'lucide-react';

export default function ConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [itineraryData, setItineraryData] = useState<any>(null);

  useEffect(() => {
    if (params.orderId) {
      fetchItineraryDetails();
    }
  }, [params.orderId]);

  const fetchItineraryDetails = async () => {
    try {
      const response = await fetch(`/api/bookings/itinerary?orderId=${params.orderId}`);
      if (response.ok) {
        const data = await response.json();
        setItineraryData(data.data);
        setLoading(false);
      } else {
        alert(language === 'zh' ? '加载失败' : 'Failed to load');
        router.push('/my-trips');
      }
    } catch (error) {
      console.error('Failed to fetch itinerary:', error);
      alert(language === 'zh' ? '加载失败' : 'Failed to load');
      router.push('/my-trips');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!itineraryData) {
    return null;
  }

  const { order, user, doctor, hospital, itinerary, reservations, costs, weatherForecast, travelTips, timeline } = itineraryData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/my-trips')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'zh' ? '返回我的行程' : 'Back to My Trips'}
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold">
              {language === 'zh' ? '预订确认' : 'Booking Confirmation'}
            </h1>
          </div>
          <p className="text-gray-600">
            {language === 'zh' ? '订单号' : 'Order ID'}: {order.id}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">
              {language === 'zh' ? '概览' : 'Overview'}
            </TabsTrigger>
            <TabsTrigger value="itinerary">
              {language === 'zh' ? '行程' : 'Itinerary'}
            </TabsTrigger>
            <TabsTrigger value="medical">
              {language === 'zh' ? '就医' : 'Medical'}
            </TabsTrigger>
            <TabsTrigger value="costs">
              {language === 'zh' ? '费用' : 'Costs'}
            </TabsTrigger>
            <TabsTrigger value="tips">
              {language === 'zh' ? '注意事项' : 'Tips'}
            </TabsTrigger>
          </TabsList>

          {/* 概览 */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 订单状态 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    {language === 'zh' ? '订单状态' : 'Order Status'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === 'zh' ? '状态' : 'Status'}</span>
                    <Badge variant={order.status === 'confirmed' ? 'default' : 'secondary'}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === 'zh' ? '医生预约' : 'Doctor Appointment'}</span>
                    <Badge variant={order.doctorAppointmentStatus === 'confirmed' ? 'default' : 'secondary'}>
                      {order.doctorAppointmentStatus}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === 'zh' ? '服务预订' : 'Service Reservation'}</span>
                    <Badge variant={order.serviceReservationStatus === 'confirmed' ? 'default' : 'secondary'}>
                      {order.serviceReservationStatus}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* 用户信息 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    {language === 'zh' ? '用户信息' : 'User Information'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === 'zh' ? '姓名' : 'Name'}</span>
                    <span>{user?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === 'zh' ? '邮箱' : 'Email'}</span>
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === 'zh' ? '护照号' : 'Passport'}</span>
                    <span>{user?.passportNumber}</span>
                  </div>
                </CardContent>
              </Card>

              {/* 费用摘要 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    {language === 'zh' ? '费用摘要' : 'Cost Summary'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {costs.currency} {costs.totalAmount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {language === 'zh' ? '包含所有服务费用' : 'Including all service fees'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 天气预报 */}
            {weatherForecast && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="h-5 w-5 text-blue-600" />
                    {language === 'zh' ? '天气预报' : 'Weather Forecast'}
                  </CardTitle>
                  <CardDescription>
                    {weatherForecast.city} ({weatherForecast.period.start} - {weatherForecast.period.end})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {weatherForecast.forecast.map((day: any, index: number) => (
                      <div key={index} className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-sm font-medium text-blue-900 mb-2">{day.date}</div>
                        <div className="text-2xl mb-2">{getWeatherIcon(day.condition)}</div>
                        <div className="text-sm text-gray-600">
                          {day.temperature.min}° - {day.temperature.max}°
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{day.condition}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <div className="text-sm font-medium text-green-900 mb-2">
                      {language === 'zh' ? '天气总结' : 'Weather Summary'}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm text-green-700">
                      <div>
                        <div className="font-medium">{language === 'zh' ? '平均温度' : 'Avg Temp'}</div>
                        <div>{weatherForecast.summary.averageTemp.toFixed(1)}°C</div>
                      </div>
                      <div>
                        <div className="font-medium">{language === 'zh' ? '雨天' : 'Rainy Days'}</div>
                        <div>{weatherForecast.summary.rainyDays} {language === 'zh' ? '天' : 'days'}</div>
                      </div>
                      <div>
                        <div className="font-medium">{language === 'zh' ? '晴天' : 'Sunny Days'}</div>
                        <div>{weatherForecast.summary.bestDays} {language === 'zh' ? '天' : 'days'}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 行程 */}
          <TabsContent value="itinerary" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  {language === 'zh' ? '行程时间线' : 'Itinerary Timeline'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeline.map((item: any, index: number) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                          {getIconByType(item.type)}
                        </div>
                        {index < timeline.length - 1 && (
                          <div className="w-0.5 h-16 bg-gray-300 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                              <Clock className="h-4 w-4" />
                              {new Date(item.date).toLocaleString()}
                            </div>
                          </div>
                          <Badge variant={item.status === 'confirmed' ? 'default' : 'secondary'}>
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 就医 */}
          <TabsContent value="medical" className="space-y-6">
            {doctor && hospital && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-blue-600" />
                      {language === 'zh' ? '医生信息' : 'Doctor Information'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">{language === 'zh' ? '姓名' : 'Name'}</div>
                      <div className="font-medium">{doctor.nameEn} / {doctor.nameZh}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">{language === 'zh' ? '职称' : 'Title'}</div>
                      <div>{doctor.title}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">{language === 'zh' ? '专长' : 'Specialties'}</div>
                      <div>{doctor.specialties}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">{language === 'zh' ? '经验' : 'Experience'}</div>
                      <div>{doctor.experienceYears} {language === 'zh' ? '年' : 'years'}</div>
                    </div>
                    {order.doctorAppointmentDate && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">{language === 'zh' ? '预约时间' : 'Appointment Date'}</div>
                        <div className="font-medium text-blue-600">
                          {new Date(order.doctorAppointmentDate).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      {language === 'zh' ? '医院信息' : 'Hospital Information'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">{language === 'zh' ? '名称' : 'Name'}</div>
                      <div className="font-medium">{hospital.nameEn} / {hospital.nameZh}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">{language === 'zh' ? '级别' : 'Level'}</div>
                      <div>{hospital.level}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">{language === 'zh' ? '地址' : 'Location'}</div>
                      <div>{hospital.location}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* 费用 */}
          <TabsContent value="costs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  {language === 'zh' ? '费用明细' : 'Cost Breakdown'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === 'zh' ? '医疗费用' : 'Medical Fee'}</span>
                    <span>{costs.currency} {costs.medicalFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === 'zh' ? '酒店费用' : 'Hotel Fee'}</span>
                    <span>{costs.currency} {costs.hotelFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === 'zh' ? '机票费用' : 'Flight Fee'}</span>
                    <span>{costs.currency} {costs.flightFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === 'zh' ? '门票费用' : 'Ticket Fee'}</span>
                    <span>{costs.currency} {costs.ticketFee.toLocaleString()}</span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>{language === 'zh' ? '小计' : 'Subtotal'}</span>
                    <span>{costs.currency} {costs.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-blue-600">
                    <span>{language === 'zh' ? '中介服务费' : `Service Fee (${(costs.serviceFeeRate * 100).toFixed(2)}%)`}</span>
                    <span>{costs.currency} {costs.serviceFeeAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>{language === 'zh' ? '总计' : 'Total'}</span>
                    <span className="text-blue-600">{costs.currency} {costs.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 服务预订详情 */}
            {reservations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    {language === 'zh' ? '预订详情' : 'Reservation Details'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reservations.map((reservation: any) => (
                      <div key={reservation.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {getIconByType(reservation.type)}
                              {reservation.providerName}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {reservation.providerReference}
                            </div>
                          </div>
                          <Badge variant={reservation.status === 'confirmed' ? 'default' : 'secondary'}>
                            {reservation.status}
                          </Badge>
                        </div>
                        <div className="mt-2 text-sm text-blue-600">
                          {costs.currency} {Number(reservation.price).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 注意事项 */}
          <TabsContent value="tips" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                  {language === 'zh' ? '出行注意事项' : 'Travel Tips'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {travelTips.medical.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-blue-600" />
                      {language === 'zh' ? '医疗注意事项' : 'Medical Tips'}
                    </h4>
                    <div className="space-y-3">
                      {travelTips.medical.map((tip: any, index: number) => (
                        <div key={index}>
                          <div className="font-medium text-sm text-blue-900 mb-2">{tip.category}</div>
                          <ul className="space-y-1 text-sm text-gray-600">
                            {tip.tips.map((item: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {travelTips.travel.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Plane className="h-4 w-4 text-blue-600" />
                      {language === 'zh' ? '旅行注意事项' : 'Travel Tips'}
                    </h4>
                    <div className="space-y-3">
                      {travelTips.travel.map((tip: any, index: number) => (
                        <div key={index}>
                          <div className="font-medium text-sm text-blue-900 mb-2">{tip.category}</div>
                          <ul className="space-y-1 text-sm text-gray-600">
                            {tip.tips.map((item: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {travelTips.documents.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      {language === 'zh' ? '文件清单' : 'Document Checklist'}
                    </h4>
                    <div className="space-y-3">
                      {travelTips.documents.map((tip: any, index: number) => (
                        <div key={index}>
                          <div className="font-medium text-sm text-blue-900 mb-2">{tip.category}</div>
                          <ul className="space-y-1 text-sm text-gray-600">
                            {tip.tips.map((item: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {travelTips.emergency.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      {language === 'zh' ? '紧急联系信息' : 'Emergency Information'}
                    </h4>
                    <div className="space-y-3">
                      {travelTips.emergency.map((tip: any, index: number) => (
                        <div key={index}>
                          <div className="font-medium text-sm text-red-900 mb-2">{tip.category}</div>
                          <ul className="space-y-1 text-sm text-gray-600">
                            {tip.tips.map((item: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-red-600 mt-1">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 打印按钮 */}
            <div className="flex justify-end">
              <Button onClick={() => window.print()}>
                <FileText className="h-4 w-4 mr-2" />
                {language === 'zh' ? '打印详单' : 'Print Itinerary'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function getIconByType(type: string) {
  switch (type) {
    case 'flight':
      return <Plane className="h-4 w-4" />;
    case 'hotel':
      return <Hotel className="h-4 w-4" />;
    case 'ticket':
      return <Ticket className="h-4 w-4" />;
    case 'doctor':
      return <Stethoscope className="h-4 w-4" />;
    default:
      return <Calendar className="h-4 w-4" />;
  }
}

function getWeatherIcon(condition: string) {
  switch (condition) {
    case 'Sunny':
      return '☀️';
    case 'Cloudy':
      return '☁️';
    case 'Partly Cloudy':
      return '⛅';
    case 'Light Rain':
      return '🌧️';
    default:
      return '🌡️';
  }
}
