'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Star, Plane, Hotel, Stethoscope, DollarSign, Calendar, MapPin } from 'lucide-react';

interface PlanOption {
  id: string;
  name: string;
  description: string;
  medicalFee: number;
  hotelFee: number;
  flightFee: number;
  totalAmount: number;
  highlights: string[];
  duration: string;
  hotelName: string;
  hotelStars: number;
  flightClass: string;
}

interface BookingData {
  userId: string;
  originCity: string;
  destinationCity: string;
  travelDate: string;
  selectedHospital: string;
  selectedDoctor: string;
  treatmentType: string;
}

export default function PlanSelectionPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从sessionStorage获取方案数据
    const savedData = sessionStorage.getItem('bookingPlans');
    if (savedData) {
      const data = JSON.parse(savedData);
      setPlans(data.plans || []);
      setBookingData(data.requestData || null);
      setLoading(false);
    } else {
      // 如果没有数据，返回预订页面
      router.push('/book');
    }
  }, [router]);

  const handleSelectPlan = (plan: PlanOption) => {
    setSelectedPlan(plan);
  };

  const handleProceedToPayment = () => {
    if (!selectedPlan) return;

    // 保存选中的方案
    sessionStorage.setItem('selectedPlan', JSON.stringify(selectedPlan));
    // 跳转到支付页面
    router.push('/book/payment');
  };

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
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'zh' ? '返回' : 'Back'}
          </Button>
          <h1 className="text-3xl font-bold">
            {language === 'zh' ? '选择您的方案' : 'Choose Your Plan'}
          </h1>
          <p className="text-gray-600 mt-2">
            {language === 'zh'
              ? `从 ${bookingData?.originCity} 到 ${bookingData?.destinationCity}`
              : `From ${bookingData?.originCity} to ${bookingData?.destinationCity}`
            }
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const isSelected = selectedPlan?.id === plan.id;
            const isRecommended = index === 1; // 推荐第二个方案

            return (
              <Card
                key={plan.id}
                className={`relative cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'ring-4 ring-blue-600 shadow-2xl scale-105 border-blue-600 bg-blue-50/30'
                    : 'hover:shadow-lg hover:scale-102 border-gray-200'
                } ${isRecommended && !isSelected ? 'border-blue-300 border-2' : ''}`}
                onClick={() => handleSelectPlan(plan)}
              >
                {isRecommended && !isSelected && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-blue-600 text-white px-4 py-1 shadow-md">
                      {language === 'zh' ? '推荐' : 'Recommended'}
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Price */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">
                      {language === 'zh' ? '总价' : 'Total Price'}
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                      ${plan.totalAmount.toLocaleString()}
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{plan.duration}</span>
                  </div>

                  {/* Fee Breakdown */}
                  <div className="space-y-2 border-t pt-4">
                    {plan.medicalFee === 0 ? (
                      <div className="flex justify-between text-sm text-gray-400">
                        <span className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4" />
                          {language === 'zh' ? '医疗费用' : 'Medical Fee'}
                        </span>
                        <span className="font-medium">
                          {language === 'zh' ? '未选择医疗服务' : 'Not selected'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4" />
                          {language === 'zh' ? '医疗费用' : 'Medical Fee'}
                        </span>
                        <span className="font-medium">${plan.medicalFee}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Hotel className="h-4 w-4" />
                        {language === 'zh' ? '酒店费用' : 'Hotel Fee'}
                      </span>
                      <span className="font-medium">${plan.hotelFee}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Plane className="h-4 w-4" />
                        {language === 'zh' ? '机票费用' : 'Flight Fee'}
                      </span>
                      <span className="font-medium">${plan.flightFee}</span>
                    </div>
                  </div>

                  {/* Hotel & Flight Info */}
                  <div className="space-y-2 border-t pt-4">
                    <div className="text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <Hotel className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{plan.hotelName}</span>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(plan.hotelStars)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Plane className="h-4 w-4 text-gray-500" />
                      <span className="capitalize">{plan.flightClass} Class</span>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="border-t pt-4">
                    <div className="text-sm font-medium mb-2">
                      {language === 'zh' ? '方案亮点' : 'Highlights'}
                    </div>
                    <ul className="space-y-1">
                      {plan.highlights.map((highlight, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-2 shadow-lg ring-4 ring-white">
                      <Check className="h-5 w-5" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Proceed Button */}
        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            onClick={handleProceedToPayment}
            disabled={!selectedPlan}
            className="px-12"
          >
            {language === 'zh' ? '继续支付' : 'Proceed to Payment'}
            <DollarSign className="h-5 w-5 ml-2" />
          </Button>
        </div>

        {/* Warning */}
        {!selectedPlan && (
          <div className="mt-4 text-center text-sm text-gray-500">
            {language === 'zh' ? '请选择一个方案继续' : 'Please select a plan to continue'}
          </div>
        )}
      </div>
    </div>
  );
}
