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
  Printer,
  Download,
  Share2,
  X,
} from 'lucide-react';

export default function ConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [itineraryData, setItineraryData] = useState<any>(null);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

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
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
          .bg-gray-50 {
            background: white !important;
          }
          button, .no-print {
            display: none !important;
          }
          @page {
            margin: 2cm;
            size: A4;
          }
        }
      `}</style>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => router.replace('/my-trips')}
            className="mb-4 no-print"
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
        {isPrintMode ? (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">
                {language === 'zh' ? '预订确认单' : 'Booking Confirmation'}
              </h2>
              <p className="text-gray-600">
                {language === 'zh' ? '订单号' : 'Order ID'}: {order.id}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>

            {/* 概览部分 */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold border-b pb-2">
                {language === 'zh' ? '概览' : 'Overview'}
              </h3>
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
            </div>
          </div>
        ) : (
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
                            {item.subtitle && (
                              <p className="text-sm text-blue-600 mt-1">{item.subtitle}</p>
                            )}
                            <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                              <Clock className="h-4 w-4" />
                              {formatDateTimeRange(item.date, item.endDate)}
                            </div>
                            {item.duration && (
                              <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                <FileText className="h-4 w-4" />
                                {language === 'zh' ? '用时' : 'Duration'}: {item.duration}
                              </div>
                            )}
                            {item.weather && (
                              <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                <Cloud className="h-4 w-4" />
                                {language === 'zh' ? '天气' : 'Weather'}: {item.weather.condition} ({item.weather.tempMin}°C - {item.weather.tempMax}°C)
                              </div>
                            )}
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
            {doctor && hospital ? (
              <div className="space-y-6">
                {/* 医生和医院信息 */}
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

                {/* 医疗方案详细信息 */}
                {(order.consultationDirection || order.examinationItems || order.surgeryTypes || order.treatmentDirection || order.rehabilitationDirection || order.medicalPlan) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        {language === 'zh' ? '医疗方案' : 'Medical Plan'}
                      </CardTitle>
                      <CardDescription>
                        {language === 'zh' ? '为您定制的医疗服务方案' : 'Personalized medical treatment plan'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {order.medicalPlan && (
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">{language === 'zh' ? '方案概述' : 'Plan Overview'}</h4>
                          <p className="text-sm text-gray-700">{order.medicalPlan}</p>
                        </div>
                      )}

                      {order.consultationDirection && (
                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-blue-600" />
                            {language === 'zh' ? '咨询方向' : 'Consultation Direction'}
                          </h4>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-gray-700">{getConsultationDirectionLabel(order.consultationDirection, language)}</p>
                          </div>
                        </div>
                      )}

                      {order.examinationItems && (
                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <Ticket className="h-4 w-4 text-blue-600" />
                            {language === 'zh' ? '检查项目' : 'Examination Items'}
                          </h4>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-gray-700">{getExaminationItemsLabel(order.examinationItems, language)}</p>
                          </div>
                        </div>
                      )}

                      {order.surgeryTypes && (
                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            {language === 'zh' ? '手术类型' : 'Surgery Types'}
                          </h4>
                          <div className="bg-red-50 rounded-lg p-3">
                            <p className="text-sm text-gray-700">{getSurgeryTypesLabel(order.surgeryTypes, language)}</p>
                          </div>
                        </div>
                      )}

                      {order.treatmentDirection && (
                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            {language === 'zh' ? '治疗方向' : 'Treatment Direction'}
                          </h4>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-gray-700">{getTreatmentDirectionLabel(order.treatmentDirection, language)}</p>
                          </div>
                        </div>
                      )}

                      {order.rehabilitationDirection && (
                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-green-600" />
                            {language === 'zh' ? '康复方向' : 'Rehabilitation Direction'}
                          </h4>
                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-sm text-gray-700">{getRehabilitationDirectionLabel(order.rehabilitationDirection, language)}</p>
                          </div>
                        </div>
                      )}

                      {order.planAdjustments && order.planAdjustments.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-blue-600" />
                            {language === 'zh' ? '方案调整记录' : 'Plan Adjustments'}
                          </h4>
                          <div className="space-y-2">
                            {order.planAdjustments.map((adjustment: string, index: number) => (
                              <div key={index} className="bg-blue-50 rounded-lg p-3">
                                <p className="text-sm text-gray-700">{adjustment}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {order.priceAdjustmentAmount && order.priceAdjustmentAmount !== 0 && (
                        <div className={`p-4 rounded-lg ${order.priceAdjustmentAmount > 0 ? 'bg-orange-50' : 'bg-green-50'}`}>
                          <h4 className="font-medium text-sm mb-2">
                            {language === 'zh' ? '价格调整' : 'Price Adjustment'}
                          </h4>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">
                              {order.priceAdjustmentStatus === 'approved'
                                ? (language === 'zh' ? '已批准的调整' : 'Approved Adjustment')
                                : (language === 'zh' ? '待审核的调整' : 'Pending Adjustment')}
                            </span>
                            <span className={`font-medium ${order.priceAdjustmentAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                              {order.priceAdjustmentAmount > 0 ? '+' : ''}{costs.currency} {order.priceAdjustmentAmount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-blue-600" />
                    {language === 'zh' ? '医疗服务' : 'Medical Services'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Stethoscope className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      {language === 'zh' ? '此订单不包含医疗服务' : 'This order does not include medical services'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {language === 'zh' ? '这是一次纯旅行预订' : 'This is a travel-only booking'}
                    </p>
                    {costs.medicalFee > 0 && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <div className="text-sm text-blue-900">
                          {language === 'zh' ? '医疗费用' : 'Medical Fee'}: {costs.currency} {costs.medicalFee.toLocaleString()}
                        </div>
                        <div className="text-xs text-blue-700 mt-1">
                          {language === 'zh' ? '已包含在总费用中，但未绑定特定医生或医院' : 'Included in total cost, but not linked to specific doctor or hospital'}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
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

            {/* 打印和分享按钮 */}
            <div className="flex flex-wrap gap-2 justify-end">
              <Button onClick={() => handlePrint()} variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                {language === 'zh' ? '打印详单' : 'Print'}
              </Button>
              <Button onClick={() => handleDownloadPDF()} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                {language === 'zh' ? '保存PDF' : 'Save as PDF'}
              </Button>
              <Button onClick={() => setShowShareDialog(true)} variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                {language === 'zh' ? '分享' : 'Share'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        )}

        {/* 打印模式下的其他内容 */}
        {isPrintMode && (
          <div className="space-y-8">
            {/* 行程部分 */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold border-b pb-2">
                {language === 'zh' ? '行程' : 'Itinerary'}
              </h3>
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
                              {item.subtitle && (
                                <p className="text-sm text-blue-600 mt-1">{item.subtitle}</p>
                              )}
                              <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                <Clock className="h-4 w-4" />
                                {formatDateTimeRange(item.date, item.endDate)}
                              </div>
                              {item.duration && (
                                <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                  <FileText className="h-4 w-4" />
                                  {language === 'zh' ? '用时' : 'Duration'}: {item.duration}
                                </div>
                              )}
                              {item.weather && (
                                <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                  <Cloud className="h-4 w-4" />
                                  {language === 'zh' ? '天气' : 'Weather'}: {item.weather.condition} ({item.weather.tempMin}°C - {item.weather.tempMax}°C)
                                </div>
                              )}
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
            </div>

            {/* 就医部分 */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold border-b pb-2">
                {language === 'zh' ? '就医' : 'Medical'}
              </h3>
              {doctor && hospital ? (
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
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-blue-600" />
                      {language === 'zh' ? '医疗服务' : 'Medical Services'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-2">
                        {language === 'zh' ? '此订单不包含医疗服务' : 'This order does not include medical services'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {language === 'zh' ? '这是一次纯旅行预订' : 'This is a travel-only booking'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 费用部分 */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold border-b pb-2">
                {language === 'zh' ? '费用' : 'Costs'}
              </h3>
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
            </div>

            {/* 注意事项部分 */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold border-b pb-2">
                {language === 'zh' ? '注意事项' : 'Tips'}
              </h3>
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
            </div>

            {/* 打印页脚 */}
            <div className="text-center text-sm text-gray-500 pt-8 border-t">
              <p>
                {language === 'zh' ? '生成时间' : 'Generated at'}: {new Date().toLocaleString()}
              </p>
              <p className="mt-2">
                {language === 'zh' ? '订单号' : 'Order ID'}: {order.id}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 分享对话框 */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowShareDialog(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {language === 'zh' ? '分享订单' : 'Share Order'}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowShareDialog(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => handleShare('copy')}
                variant="outline"
                className="w-full justify-start"
              >
                <FileText className="h-4 w-4 mr-2" />
                {language === 'zh' ? '复制订单链接' : 'Copy Order Link'}
              </Button>
              <Button
                onClick={() => handleShare('email')}
                variant="outline"
                className="w-full justify-start"
              >
                <FileText className="h-4 w-4 mr-2" />
                {language === 'zh' ? '通过邮件分享' : 'Share via Email'}
              </Button>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">{language === 'zh' ? '订单链接' : 'Order Link'}:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/book/confirmation/${order.id}`}
                    readOnly
                    className="flex-1 text-sm p-2 border rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // 处理打印
  function handlePrint() {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 100);
  }

  // 处理PDF下载
  function handleDownloadPDF() {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 100);
  }

  // 处理分享
  function handleShare(type: string) {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/book/confirmation/${order.id}`;
    const text = language === 'zh' ? `查看我的医疗旅行订单：${url}` : `View my medical travel order: ${url}`;

    if (type === 'copy') {
      navigator.clipboard.writeText(url);
      alert(language === 'zh' ? '链接已复制到剪贴板' : 'Link copied to clipboard');
    } else if (type === 'email') {
      const subject = language === 'zh' ? '医疗旅行订单分享' : 'Medical Travel Order Share';
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    }
    setShowShareDialog(false);
  }
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

function formatDateTimeRange(startDate: Date | string | null, endDate: Date | string | null) {
  if (!startDate) return '';

  const start = new Date(startDate);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  let result = start.toLocaleString('en-US', options);

  if (endDate) {
    const end = new Date(endDate);
    const isSameDay = start.toDateString() === end.toDateString();

    if (isSameDay) {
      const endTime = end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      result += ` - ${endTime}`;
    } else {
      const endOptions: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      };
      result += ` - ${end.toLocaleString('en-US', endOptions)}`;
    }
  }

  return result;
}

// 获取咨询方向标签
function getConsultationDirectionLabel(value: string, language: string): string {
  const labels: Record<string, { zh: string; en: string; de: string; fr: string }> = {
    general: { zh: '一般健康咨询', en: 'General Health', de: 'Allgemeine Gesundheit', fr: 'Santé générale' },
    internal: { zh: '内科咨询', en: 'Internal Medicine', de: 'Innere Medizin', fr: 'Médecine interne' },
    surgery: { zh: '外科咨询', en: 'Surgery', de: 'Chirurgie', fr: 'Chirurgie' },
    pediatrics: { zh: '儿科咨询', en: 'Pediatrics', de: 'Pädiatrie', fr: 'Pédiatrie' },
    obstetrics: { zh: '妇产科咨询', en: 'Obstetrics', de: 'Gynäkologie', fr: 'Gynécologie' },
    orthopedics: { zh: '骨科咨询', en: 'Orthopedics', de: 'Orthopädie', fr: 'Orthopédie' },
    neurology: { zh: '神经科咨询', en: 'Neurology', de: 'Neurologie', fr: 'Neurologie' },
    cardiology: { zh: '心血管科咨询', en: 'Cardiology', de: 'Kardiologie', fr: 'Cardiologie' },
    oncology: { zh: '肿瘤科咨询', en: 'Oncology', de: 'Onkologie', fr: 'Oncologie' },
    dermatology: { zh: '皮肤科咨询', en: 'Dermatology', de: 'Dermatologie', fr: 'Dermatologie' },
    ophthalmology: { zh: '眼科咨询', en: 'Ophthalmology', de: 'Ophthalmologie', fr: 'Ophtalmologie' },
    ent: { zh: '耳鼻喉科咨询', en: 'ENT', de: 'HNO', fr: 'ORL' },
    traditional_chinese: { zh: '中医咨询', en: 'Traditional Chinese Medicine', de: 'TCM', fr: 'Médecine traditionnelle chinoise' },
    rehabilitation: { zh: '康复咨询', en: 'Rehabilitation', de: 'Rehabilitation', fr: 'Réadaptation' },
    nutrition: { zh: '营养咨询', en: 'Nutrition', de: 'Ernährung', fr: 'Nutrition' },
  };
  return (labels[value] as any)?.[language] || value;
}

// 获取检查项目标签
function getExaminationItemsLabel(value: string, language: string): string {
  const labels: Record<string, { zh: string; en: string; de: string; fr: string }> = {
    blood_test: { zh: '血液检查', en: 'Blood Test', de: 'Bluttest', fr: 'Test sanguin' },
    urine_test: { zh: '尿液检查', en: 'Urine Test', de: 'Urintest', fr: 'Analyse d\'urine' },
    ct_scan: { zh: 'CT扫描', en: 'CT Scan', de: 'CT-Scan', fr: 'Scanner CT' },
    mri: { zh: '核磁共振', en: 'MRI', de: 'MRT', fr: 'IRM' },
    ultrasound: { zh: '超声波检查', en: 'Ultrasound', de: 'Ultraschall', fr: 'Échographie' },
    x_ray: { zh: 'X光检查', en: 'X-Ray', de: 'Röntgen', fr: 'Radiographie' },
    ecg: { zh: '心电图', en: 'ECG', de: 'EKG', fr: 'ECG' },
    endoscopy: { zh: '内窥镜检查', en: 'Endoscopy', de: 'Endoskopie', fr: 'Endoscopie' },
    biopsy: { zh: '活检', en: 'Biopsy', de: 'Biopsie', fr: 'Biopsie' },
    pet_scan: { zh: 'PET扫描', en: 'PET Scan', de: 'PET-Scan', fr: 'Scanner PET' },
    bone_density: { zh: '骨密度检查', en: 'Bone Density', de: 'Knochendichte', fr: 'Densité osseuse' },
    colonoscopy: { zh: '结肠镜检查', en: 'Colonoscopy', de: 'Koloskopie', fr: 'Coloscopie' },
    comprehensive: { zh: '综合体检套餐', en: 'Comprehensive Checkup', de: 'Umfassende Untersuchung', fr: 'Bilan complet' },
  };
  return (labels[value] as any)?.[language] || value;
}

// 获取手术类型标签
function getSurgeryTypesLabel(value: string, language: string): string {
  const labels: Record<string, { zh: string; en: string; de: string; fr: string }> = {
    cardiac_surgery: { zh: '心脏手术', en: 'Cardiac Surgery', de: 'Herzchirurgie', fr: 'Chirurgie cardiaque' },
    neurosurgery: { zh: '神经外科手术', en: 'Neurosurgery', de: 'Neurochirurgie', fr: 'Neurochirurgie' },
    orthopedic_surgery: { zh: '骨科手术', en: 'Orthopedic Surgery', de: 'Orthopädie', fr: 'Chirurgie orthopédique' },
    cosmetic_surgery: { zh: '整形外科手术', en: 'Cosmetic Surgery', de: 'Plastische Chirurgie', fr: 'Chirurgie esthétique' },
    ophthalmic_surgery: { zh: '眼科手术', en: 'Ophthalmic Surgery', de: 'Augenchirurgie', fr: 'Chirurgie ophtalmique' },
    dental_surgery: { zh: '牙科手术', en: 'Dental Surgery', de: 'Zahnchirurgie', fr: 'Chirurgie dentaire' },
    general_surgery: { zh: '普通外科手术', en: 'General Surgery', de: 'Allgemeine Chirurgie', fr: 'Chirurgie générale' },
    gynecologic_surgery: { zh: '妇科手术', en: 'Gynecologic Surgery', de: 'Gynäkologische Chirurgie', fr: 'Chirurgie gynécologique' },
    urology_surgery: { zh: '泌尿外科手术', en: 'Urology Surgery', de: 'Urologie', fr: 'Urologie' },
    oncology_surgery: { zh: '肿瘤手术', en: 'Oncology Surgery', de: 'Tumorchirurgie', fr: 'Chirurgie oncologique' },
    pediatric_surgery: { zh: '儿科手术', en: 'Pediatric Surgery', de: 'Kinderchirurgie', fr: 'Chirurgie pédiatrique' },
    vascular_surgery: { zh: '血管手术', en: 'Vascular Surgery', de: 'Gefäßchirurgie', fr: 'Chirurgie vasculaire' },
  };
  return (labels[value] as any)?.[language] || value;
}

// 获取治疗方向标签
function getTreatmentDirectionLabel(value: string, language: string): string {
  const labels: Record<string, { zh: string; en: string; de: string; fr: string }> = {
    physical_therapy: { zh: '物理治疗', en: 'Physical Therapy', de: 'Physiotherapie', fr: 'Physiothérapie' },
    medication: { zh: '药物治疗', en: 'Medication', de: 'Medikation', fr: 'Médication' },
    radiation: { zh: '放射治疗', en: 'Radiation Therapy', de: 'Strahlentherapie', fr: 'Radiothérapie' },
    chemotherapy: { zh: '化疗', en: 'Chemotherapy', de: 'Chemotherapie', fr: 'Chimiothérapie' },
    immunotherapy: { zh: '免疫治疗', en: 'Immunotherapy', de: 'Immuntherapie', fr: 'Immunothérapie' },
    targeted_therapy: { zh: '靶向治疗', en: 'Targeted Therapy', de: 'Gezielte Therapie', fr: 'Thérapie ciblée' },
    hormone_therapy: { zh: '激素治疗', en: 'Hormone Therapy', de: 'Hormontherapie', fr: 'Hormonothérapie' },
    laser_therapy: { zh: '激光治疗', en: 'Laser Therapy', de: 'Lasertherapie', fr: 'Thérapie laser' },
    acupuncture: { zh: '针灸治疗', en: 'Acupuncture', de: 'Akupunktur', fr: 'Acupuncture' },
    massage: { zh: '按摩治疗', en: 'Massage Therapy', de: 'Massagetherapie', fr: 'Massothérapie' },
  };
  return (labels[value] as any)?.[language] || value;
}

// 获取康复方向标签
function getRehabilitationDirectionLabel(value: string, language: string): string {
  const labels: Record<string, { zh: string; en: string; de: string; fr: string }> = {
    post_surgery: { zh: '术后康复', en: 'Post-Surgery Rehabilitation', de: 'Postoperative Rehabilitation', fr: 'Rééducation post-opératoire' },
    stroke: { zh: '中风康复', en: 'Stroke Rehabilitation', de: 'Schlaganfall-Rehabilitation', fr: 'Rééducation post-AVC' },
    orthopedic_rehab: { zh: '骨科康复', en: 'Orthopedic Rehabilitation', de: 'Orthopädische Rehabilitation', fr: 'Rééducation orthopédique' },
    cardiac_rehab: { zh: '心脏康复', en: 'Cardiac Rehabilitation', de: 'Herzrehabilitation', fr: 'Rééducation cardiaque' },
    neurological_rehab: { zh: '神经康复', en: 'Neurological Rehabilitation', de: 'Neurologische Rehabilitation', fr: 'Rééducation neurologique' },
    sports_rehab: { zh: '运动康复', en: 'Sports Rehabilitation', de: 'Sportrehabilitation', fr: 'Rééducation sportive' },
    pediatric_rehab: { zh: '儿童康复', en: 'Pediatric Rehabilitation', de: 'Kinderrehabilitation', fr: 'Rééducation pédiatrique' },
    pulmonary_rehab: { zh: '肺康复', en: 'Pulmonary Rehabilitation', de: 'Lungenrehabilitation', fr: 'Rééducation pulmonaire' },
    pain_management: { zh: '疼痛管理', en: 'Pain Management', de: 'Schmerzmanagement', fr: 'Gestion de la douleur' },
    cognitive_rehab: { zh: '认知康复', en: 'Cognitive Rehabilitation', de: 'Kognitive Rehabilitation', fr: 'Rééducation cognitive' },
  };
  return (labels[value] as any)?.[language] || value;
}
