'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, CreditCard, FileText, Upload, Check, Shield, Lock } from 'lucide-react';
import { COUNTRIES_BY_REGION, REGION_NAMES } from '@/data/countries';

interface PlanOption {
  id: string;
  name: string;
  totalAmount: number;
  medicalFee: number;
  hotelFee: number;
  flightFee: number;
  serviceFeeRate?: number;
  serviceFeeAmount?: number;
  finalTotal?: number;
  bookingData?: {
    originCity: string;
    destinationCity: string;
    travelDate: string;
    appointmentDate?: string;
    returnDate?: string;
    hotelName?: string;
    hospitalName?: string;
    doctorId?: string;
    treatmentType?: string;
    consultationDirection?: string;
    examinationItems?: string;
    surgeryTypes?: string;
    treatmentDirection?: string;
    rehabilitationDirection?: string;
  };
}

interface ServiceFee {
  type: string;
  rate: number;
  minFee: number;
  maxFee: number;
  descriptionEn: string;
  descriptionZh: string;
}

export default function PaymentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();

  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serviceFees, setServiceFees] = useState<ServiceFee[]>([]);
  const [calculatedFees, setCalculatedFees] = useState<{
    medicalFee: number;
    flightFee: number;
    hotelFee: number;
    ticketFee: number;
    totalServiceFee: number;
    subtotal: number;
  } | null>(null);

  // 表单状态
  const [passportNumber, setPassportNumber] = useState(user?.passportNumber || '');
  const [passportCountry, setPassportCountry] = useState(user?.passportCountry || '');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [selectedAttractions, setSelectedAttractions] = useState<any[]>([]); // 选中的景点

  useEffect(() => {
    // 从sessionStorage获取选中的方案和预订数据
    const savedPlan = sessionStorage.getItem('selectedPlan');
    const savedBookingData = sessionStorage.getItem('bookingPlans');
    const savedAttractions = sessionStorage.getItem('selectedAttractions');

    console.log('[Payment Page] savedPlan:', savedPlan ? 'exists' : 'missing');
    console.log('[Payment Page] savedBookingData:', savedBookingData ? 'exists' : 'missing');

    if (savedPlan) {
      const plan = JSON.parse(savedPlan);
      console.log('[Payment Page] Initial plan keys:', Object.keys(plan));
      console.log('[Payment Page] Initial plan.bookingData:', plan.bookingData);

      // 将bookingData附加到plan对象中
      if (savedBookingData) {
        const bookingDataFull = JSON.parse(savedBookingData);
        console.log('[Payment Page] bookingDataFull.requestData:', bookingDataFull.requestData);
        console.log('[Payment Page] bookingDataFull.requestData.travelDate:', bookingDataFull.requestData?.travelDate);

        plan.bookingData = {
          originCity: bookingDataFull.requestData?.originCity || '',
          destinationCity: bookingDataFull.requestData?.destinationCity || '',
          travelDate: bookingDataFull.requestData?.travelDate || '',
          appointmentDate: bookingDataFull.requestData?.appointmentDate || '',
          returnDate: bookingDataFull.requestData?.returnDate || '',
          hotelName: plan.hotelName,
          selectedHospital: bookingDataFull.requestData?.selectedHospital || '',
          doctorId: bookingDataFull.requestData?.selectedDoctor || '',
          treatmentType: bookingDataFull.requestData?.treatmentType || '',
          consultationDirection: bookingDataFull.requestData?.consultationDirection || '',
          examinationItems: bookingDataFull.requestData?.examinationItems || '',
          surgeryTypes: bookingDataFull.requestData?.surgeryTypes || '',
          treatmentDirection: bookingDataFull.requestData?.treatmentDirection || '',
          rehabilitationDirection: bookingDataFull.requestData?.rehabilitationDirection || '',
        };

        console.log('[Payment Page] Final plan.bookingData:', plan.bookingData);
      }
      setSelectedPlan(plan);
      setLoading(false);
    } else {
      // 如果没有选中的方案，返回方案选择页面
      router.push('/book/plans');
    }

    // 获取选中的景点
    if (savedAttractions) {
      setSelectedAttractions(JSON.parse(savedAttractions));
    }
  }, [router]);

  useEffect(() => {
    // 获取中介费率并计算费用
    if (selectedPlan) {
      fetchServiceFees();
    }
  }, [selectedPlan]);

  const fetchServiceFees = async () => {
    try {
      const response = await fetch('/api/service-fees');
      if (response.ok) {
        const data = await response.json();
        setServiceFees(data.fees);
        calculateServiceFees(data.fees);
      }
    } catch (error) {
      console.error('Failed to fetch service fees:', error);
    }
  };

  const calculateServiceFees = (fees: ServiceFee[]) => {
    if (!selectedPlan) return;

    const medicalFeeConfig = fees.find(f => f.type === 'medical') || { rate: 0.05, minFee: 50, maxFee: 500 };
    const flightFeeConfig = fees.find(f => f.type === 'flight') || { rate: 0.03, minFee: 30, maxFee: 300 };
    const hotelFeeConfig = fees.find(f => f.type === 'hotel') || { rate: 0.04, minFee: 40, maxFee: 400 };

    // 计算各项服务费用
    const medicalServiceFee = Math.min(
      Math.max(selectedPlan.medicalFee * medicalFeeConfig.rate, medicalFeeConfig.minFee),
      medicalFeeConfig.maxFee
    );
    const flightServiceFee = Math.min(
      Math.max(selectedPlan.flightFee * flightFeeConfig.rate, flightFeeConfig.minFee),
      flightFeeConfig.maxFee
    );
    const hotelServiceFee = Math.min(
      Math.max(selectedPlan.hotelFee * hotelFeeConfig.rate, hotelFeeConfig.minFee),
      hotelFeeConfig.maxFee
    );

    const totalServiceFee = medicalServiceFee + flightServiceFee + hotelServiceFee;
    const subtotal = selectedPlan.medicalFee + selectedPlan.hotelFee + selectedPlan.flightFee;

    setCalculatedFees({
      medicalFee: medicalServiceFee,
      flightFee: flightServiceFee,
      hotelFee: hotelServiceFee,
      ticketFee: 0,
      totalServiceFee,
      subtotal,
    });
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
    let formattedValue = '';
    for (let i = 0; i < value.length && i < 16; i++) {
      if (i > 0 && i % 4 === 0) {
        formattedValue += ' ';
      }
      formattedValue += value[i];
    }
    setCardNumber(formattedValue);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    if (value.length > 5) {
      value = value.slice(0, 5);
    }
    setExpiryDate(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 调用支付API
      if (!selectedPlan) {
        throw new Error('No plan selected');
      }
      
      const response = await fetch('/api/bookings/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          plan: {
            ...selectedPlan,
            bookingData: {
              ...(selectedPlan.bookingData || {}),
              selectedAttractions: selectedAttractions, // 添加选中的景点
            },
          },
          payment: {
            cardNumber: cardNumber.replace(/\s/g, ''),
            cardName,
            expiryDate,
            cvv,
          },
          documents: {
            passportNumber,
            passportCountry,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // 清除sessionStorage
        sessionStorage.removeItem('bookingPlans');
        sessionStorage.removeItem('selectedPlan');
        // 跳转到详单页面
        router.push(data.redirectUrl || `/book/confirmation/${data.orderId}`);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert(language === 'zh' ? '支付失败，请重试' : 'Payment failed, please try again');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!selectedPlan) {
    return null;
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
            {language === 'zh' ? '完成支付' : 'Complete Payment'}
          </h1>
          <p className="text-gray-600 mt-2">
            {language === 'zh' ? '请填写必要信息并完成支付' : 'Please fill in required information and complete payment'}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：表单 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 证件信息 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <CardTitle>{language === 'zh' ? '证件信息' : 'Document Information'}</CardTitle>
                </div>
                <CardDescription>
                  {language === 'zh' ? '请提供您的护照信息用于国际旅行' : 'Please provide your passport information for international travel'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="passportNumber">
                    {language === 'zh' ? '护照号码' : 'Passport Number'} *
                  </Label>
                  <Input
                    id="passportNumber"
                    value={passportNumber}
                    onChange={(e) => setPassportNumber(e.target.value)}
                    placeholder="A12345678"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="passportCountry">
                    {language === 'zh' ? '护照签发国家' : 'Passport Country'} *
                  </Label>
                  <Select
                    value={passportCountry}
                    onValueChange={setPassportCountry}
                  >
                    <SelectTrigger id="passportCountry">
                      <SelectValue placeholder={language === 'zh' ? '选择国家' : 'Select country'} />
                    </SelectTrigger>
                    <SelectContent>
                      {(['asia', 'europe', 'americas', 'oceania', 'africa'] as const).map((region) => {
                        const regionCountries = COUNTRIES_BY_REGION[region];
                        if (regionCountries.length === 0) return null;

                        return (
                          <div key={region}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                              {language === 'zh' ? REGION_NAMES.zh[region] : REGION_NAMES.en[region]}
                            </div>
                            {regionCountries.map((country) => (
                              <SelectItem key={country.id} value={country.code}>
                                {language === 'zh' ? country.nameZh : country.nameEn} ({country.code})
                              </SelectItem>
                            ))}
                          </div>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* 支付信息 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <CardTitle>{language === 'zh' ? '支付信息' : 'Payment Information'}</CardTitle>
                </div>
                <CardDescription>
                  {language === 'zh' ? '安全支付您的预订' : 'Secure payment for your booking'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="cardNumber">
                      {language === 'zh' ? '卡号' : 'Card Number'} *
                    </Label>
                    <Input
                      id="cardNumber"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardName">
                      {language === 'zh' ? '持卡人姓名' : 'Cardholder Name'} *
                    </Label>
                    <Input
                      id="cardName"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDate">
                        {language === 'zh' ? '有效期' : 'Expiry Date'} *
                      </Label>
                      <Input
                        id="expiryDate"
                        value={expiryDate}
                        onChange={handleExpiryChange}
                        placeholder="MM/YY"
                        maxLength={5}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">
                        {language === 'zh' ? 'CVV' : 'CVV'} *
                      </Label>
                      <Input
                        id="cvv"
                        type="password"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        placeholder="123"
                        maxLength={3}
                        required
                      />
                    </div>
                  </div>

                  {/* 安全提示 */}
                  <div className="bg-blue-50 rounded-lg p-4 flex items-start gap-3">
                    <Lock className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="text-sm text-blue-900">
                      <div className="font-medium mb-1">
                        {language === 'zh' ? '安全支付保障' : 'Secure Payment Guarantee'}
                      </div>
                      <p className="text-blue-700">
                        {language === 'zh'
                          ? '我们使用256位SSL加密保护您的支付信息。您的卡片信息不会存储在我们的服务器上。'
                          : 'We use 256-bit SSL encryption to protect your payment information. Your card details are never stored on our servers.'
                        }
                      </p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={submitting || !calculatedFees}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        {language === 'zh' ? '处理中...' : 'Processing...'}
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        {language === 'zh'
                          ? `支付 $${calculatedFees ? (calculatedFees.subtotal + calculatedFees.totalServiceFee).toLocaleString() : selectedPlan.totalAmount.toLocaleString()}`
                          : `Pay $${calculatedFees ? (calculatedFees.subtotal + calculatedFees.totalServiceFee).toLocaleString() : selectedPlan.totalAmount.toLocaleString()}`
                        }
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：订单摘要 */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>{language === 'zh' ? '订单摘要' : 'Order Summary'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">
                    {language === 'zh' ? '方案' : 'Plan'}
                  </div>
                  <div className="font-medium">{selectedPlan.name}</div>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {language === 'zh' ? '医疗费用' : 'Medical Fee'}
                    </span>
                    <span>${selectedPlan.medicalFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {language === 'zh' ? '酒店费用' : 'Hotel Fee'}
                    </span>
                    <span>${selectedPlan.hotelFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {language === 'zh' ? '机票费用' : 'Flight Fee'}
                    </span>
                    <span>${selectedPlan.flightFee.toLocaleString()}</span>
                  </div>
                </div>

                {calculatedFees && (
                  <>
                    <div className="border-t pt-4 bg-blue-50 -mx-4 px-4 py-3">
                      <div className="text-sm font-medium text-blue-900 mb-2">
                        {language === 'zh' ? '服务费用' : 'Service Fees'}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between text-blue-700">
                          <span>{language === 'zh' ? '医疗服务费' : 'Medical Service Fee'}</span>
                          <span>${calculatedFees.medicalFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-blue-700">
                          <span>{language === 'zh' ? '航班服务费' : 'Flight Service Fee'}</span>
                          <span>${calculatedFees.flightFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-blue-700">
                          <span>{language === 'zh' ? '酒店服务费' : 'Hotel Service Fee'}</span>
                          <span>${calculatedFees.hotelFee.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{language === 'zh' ? '小计' : 'Subtotal'}</span>
                        <span>${calculatedFees.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-blue-600">
                        <span>{language === 'zh' ? '中介服务费' : 'Service Fee'}</span>
                        <span>${calculatedFees.totalServiceFee.toLocaleString()}</span>
                      </div>
                    </div>
                  </>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {language === 'zh' ? '总计' : 'Total'}
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      ${calculatedFees
                        ? (calculatedFees.subtotal + calculatedFees.totalServiceFee).toLocaleString()
                        : selectedPlan.totalAmount.toLocaleString()
                      }
                    </span>
                  </div>
                </div>

                {/* 保障说明 */}
                <div className="bg-green-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-green-800">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">
                      {language === 'zh' ? '支付保障' : 'Payment Protection'}
                    </span>
                  </div>
                  <ul className="space-y-1 text-xs text-green-700">
                    <li className="flex items-start gap-2">
                      <Check className="h-3 w-3 flex-shrink-0 mt-0.5" />
                      <span>{language === 'zh' ? '全额退款保障' : 'Full refund guarantee'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3 w-3 flex-shrink-0 mt-0.5" />
                      <span>{language === 'zh' ? '24/7客户支持' : '24/7 customer support'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3 w-3 flex-shrink-0 mt-0.5" />
                      <span>{language === 'zh' ? '医疗意外保险' : 'Medical accident insurance'}</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
