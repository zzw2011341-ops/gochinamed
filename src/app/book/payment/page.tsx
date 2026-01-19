'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CreditCard, FileText, Upload, Check, Shield, Lock } from 'lucide-react';

interface PlanOption {
  id: string;
  name: string;
  totalAmount: number;
  medicalFee: number;
  hotelFee: number;
  flightFee: number;
}

export default function PaymentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();

  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 表单状态
  const [passportNumber, setPassportNumber] = useState(user?.passportNumber || '');
  const [passportCountry, setPassportCountry] = useState(user?.passportCountry || '');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  useEffect(() => {
    // 从sessionStorage获取选中的方案
    const savedPlan = sessionStorage.getItem('selectedPlan');
    if (savedPlan) {
      setSelectedPlan(JSON.parse(savedPlan));
      setLoading(false);
    } else {
      // 如果没有选中的方案，返回方案选择页面
      router.push('/book/plans');
    }
  }, [router]);

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
      const response = await fetch('/api/bookings/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          plan: selectedPlan,
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
        // 跳转到我的行程页面
        router.push('/my-trips');
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
                  <Input
                    id="passportCountry"
                    value={passportCountry}
                    onChange={(e) => setPassportCountry(e.target.value)}
                    placeholder="United States"
                    required
                  />
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
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        {language === 'zh' ? '处理中...' : 'Processing...'}
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        {language === 'zh' ? `支付 $${selectedPlan.totalAmount.toLocaleString()}` : `Pay $${selectedPlan.totalAmount.toLocaleString()}`}
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

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {language === 'zh' ? '总计' : 'Total'}
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      ${selectedPlan.totalAmount.toLocaleString()}
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
