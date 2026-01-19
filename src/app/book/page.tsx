"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Check, Plane, Building2, Stethoscope, DollarSign, Calendar, MapPin } from "lucide-react";

// 城市列表 - 涵盖美洲、欧洲、中国的主要城市
const cities = [
  // 美洲
  { id: 'newyork', nameEn: 'New York', nameZh: '纽约', airport: 'JFK', region: 'americas' },
  { id: 'losangeles', nameEn: 'Los Angeles', nameZh: '洛杉矶', airport: 'LAX', region: 'americas' },
  { id: 'sanfrancisco', nameEn: 'San Francisco', nameZh: '旧金山', airport: 'SFO', region: 'americas' },
  { id: 'chicago', nameEn: 'Chicago', nameZh: '芝加哥', airport: 'ORD', region: 'americas' },
  { id: 'miami', nameEn: 'Miami', nameZh: '迈阿密', airport: 'MIA', region: 'americas' },
  { id: 'toronto', nameEn: 'Toronto', nameZh: '多伦多', airport: 'YYZ', region: 'americas' },
  { id: 'vancouver', nameEn: 'Vancouver', nameZh: '温哥华', airport: 'YVR', region: 'americas' },
  { id: 'saopaulo', nameEn: 'São Paulo', nameZh: '圣保罗', airport: 'GRU', region: 'americas' },

  // 欧洲
  { id: 'london', nameEn: 'London', nameZh: '伦敦', airport: 'LHR', region: 'europe' },
  { id: 'paris', nameEn: 'Paris', nameZh: '巴黎', airport: 'CDG', region: 'europe' },
  { id: 'berlin', nameEn: 'Berlin', nameZh: '柏林', airport: 'BER', region: 'europe' },
  { id: 'munich', nameEn: 'Munich', nameZh: '慕尼黑', airport: 'MUC', region: 'europe' },
  { id: 'frankfurt', nameEn: 'Frankfurt', nameZh: '法兰克福', airport: 'FRA', region: 'europe' },
  { id: 'rome', nameEn: 'Rome', nameZh: '罗马', airport: 'FCO', region: 'europe' },
  { id: 'madrid', nameEn: 'Madrid', nameZh: '马德里', airport: 'MAD', region: 'europe' },
  { id: 'amsterdam', nameEn: 'Amsterdam', nameZh: '阿姆斯特丹', airport: 'AMS', region: 'europe' },
  { id: 'vienna', nameEn: 'Vienna', nameZh: '维也纳', airport: 'VIE', region: 'europe' },
  { id: 'zurich', nameEn: 'Zurich', nameZh: '苏黎世', airport: 'ZRH', region: 'europe' },

  // 中国
  { id: 'beijing', nameEn: 'Beijing', nameZh: '北京', airport: 'PEK', region: 'china' },
  { id: 'shanghai', nameEn: 'Shanghai', nameZh: '上海', airport: 'PVG', region: 'china' },
  { id: 'guangzhou', nameEn: 'Guangzhou', nameZh: '广州', airport: 'CAN', region: 'china' },
  { id: 'shenzhen', nameEn: 'Shenzhen', nameZh: '深圳', airport: 'SZX', region: 'china' },
  { id: 'hangzhou', nameEn: 'Hangzhou', nameZh: '杭州', airport: 'HGH', region: 'china' },
  { id: 'chengdu', nameEn: 'Chengdu', nameZh: '成都', airport: 'CTU', region: 'china' },
  { id: 'wuhan', nameEn: 'Wuhan', nameZh: '武汉', airport: 'WUH', region: 'china' },
  { id: 'nanjing', nameEn: 'Nanjing', nameZh: '南京', airport: 'NKG', region: 'china' },
  { id: 'xian', nameEn: 'Xi\'an', nameZh: '西安', airport: 'XIY', region: 'china' },
  { id: 'tianjin', nameEn: 'Tianjin', nameZh: '天津', airport: 'TSN', region: 'china' },
  { id: 'qingdao', nameEn: 'Qingdao', nameZh: '青岛', airport: 'TAO', region: 'china' },
  { id: 'dalian', nameEn: 'Dalian', nameZh: '大连', airport: 'DLC', region: 'china' },
  { id: 'xiamen', nameEn: 'Xiamen', nameZh: '厦门', airport: 'XMN', region: 'china' },
  { id: 'suzhou', nameEn: 'Suzhou', nameZh: '苏州', airport: 'SZV', region: 'china' },
  { id: 'chongqing', nameEn: 'Chongqing', nameZh: '重庆', airport: 'CKG', region: 'china' },
];

interface Hospital {
  id: string;
  nameEn: string;
  nameZh: string | null;
  level: string | null;
  location: string;
}

interface Doctor {
  id: string;
  nameEn: string;
  nameZh: string | null;
  title: string | null;
  specialtiesEn: string;
  consultationFee: string | null;
  hospitalName?: string;
}

export default function BookPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // 表单数据
  const [formData, setFormData] = useState({
    originCity: user?.originCity || "",
    destinationCity: user?.destinationCity || "",
    travelDate: "",
    selectedHospital: "",
    selectedDoctor: "",
    treatmentType: "",
    budget: user?.budget?.toString() || "",
  });

  // 数据
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // 步骤标题
  const steps = [
    { id: 1, title: language === 'zh' ? '选择行程' : 'Travel', icon: Plane },
    { id: 2, title: language === 'zh' ? '选择医院' : 'Hospital', icon: Building2 },
    { id: 3, title: language === 'zh' ? '选择医生' : 'Doctor', icon: Stethoscope },
    { id: 4, title: language === 'zh' ? '医疗选项' : 'Treatment', icon: Calendar },
    { id: 5, title: language === 'zh' ? '费用预算' : 'Budget', icon: DollarSign },
  ];

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (user.id) {
      // 刷新用户信息以获取最新的城市和预算偏好
      fetch('/api/auth/me')
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setFormData(prev => ({
              ...prev,
              originCity: data.user.originCity || prev.originCity,
              destinationCity: data.user.destinationCity || prev.destinationCity,
              budget: data.user.budget?.toString() || prev.budget,
            }));
          }
        })
        .catch(error => console.error('Error fetching user info:', error));
    }
  }, [user, router]);

  useEffect(() => {
    if (formData.destinationCity) {
      fetchHospitals();
    }
  }, [formData.destinationCity]);

  useEffect(() => {
    if (formData.selectedHospital) {
      fetchDoctors();
    }
  }, [formData.selectedHospital]);

  const fetchHospitals = async () => {
    try {
      const response = await fetch(`/api/search/medical?type=hospital&location=${formData.destinationCity}&limit=20`);
      const data = await response.json();
      setHospitals(data.hospitals?.hospitals || data.hospitals || []);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`/api/doctors/by-hospital/${formData.selectedHospital}`);
      const data = await response.json();
      setDoctors(data.doctors || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 保存预订信息并获取可选方案
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: user?.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // 保存方案数据到sessionStorage
        sessionStorage.setItem('bookingPlans', JSON.stringify(data));
        // 跳转到方案选择页面
        router.push('/book/plans');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to generate plans');
      }
    } catch (error) {
      console.error('Error generating plans:', error);
      alert(language === 'zh' ? '生成方案失败，请重试' : 'Failed to generate plans, please try again');
    } finally {
      setLoading(false);
    }
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
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'zh' ? '返回' : 'Back'}
          </Button>
          <h1 className="text-3xl font-bold">
            {language === 'zh' ? '我要预订、预约' : 'Book Appointment'}
          </h1>
          <p className="text-gray-600 mt-2">
            {language === 'zh' ? '按照以下步骤完成您的医疗旅游预订，选择最适合您的方案' : 'Complete your medical tourism booking and choose the best plan'}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 步骤指示器 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              return (
                <div key={step.id} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-green-600 text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 ${
                        isCurrent ? 'text-blue-600 font-medium' : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {step.id < 5 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 表单内容 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {language === 'zh' ? `步骤 ${currentStep} / 5` : `Step ${currentStep} / 5`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 步骤1: 选择行程 */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'zh' ? '出发城市' : 'Departure City'}
                  </label>
                  <Select
                    value={formData.originCity}
                    onValueChange={(value) => setFormData({ ...formData, originCity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'zh' ? '选择出发城市' : 'Select departure city'} />
                    </SelectTrigger>
                    <SelectContent>
                      {['americas', 'europe', 'china'].map((region) => (
                        <div key={region}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                            {language === 'zh' ?
                              (region === 'americas' ? '美洲' : region === 'europe' ? '欧洲' : '中国') :
                              (region === 'americas' ? 'Americas' : region === 'europe' ? 'Europe' : 'China')
                            }
                          </div>
                          {cities
                            .filter(city => city.region === region)
                            .map((city) => (
                              <SelectItem key={city.id} value={city.nameEn}>
                                {language === 'zh' ? city.nameZh : city.nameEn} ({city.airport})
                              </SelectItem>
                            ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'zh' ? '目的城市' : 'Destination City'}
                  </label>
                  <Select
                    value={formData.destinationCity}
                    onValueChange={(value) => setFormData({ ...formData, destinationCity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'zh' ? '选择目的城市' : 'Select destination city'} />
                    </SelectTrigger>
                    <SelectContent>
                      {['americas', 'europe', 'china'].map((region) => (
                        <div key={region}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                            {language === 'zh' ?
                              (region === 'americas' ? '美洲' : region === 'europe' ? '欧洲' : '中国') :
                              (region === 'americas' ? 'Americas' : region === 'europe' ? 'Europe' : 'China')
                            }
                          </div>
                          {cities
                            .filter(city => city.region === region)
                            .map((city) => (
                              <SelectItem key={city.id} value={city.nameEn}>
                                {language === 'zh' ? city.nameZh : city.nameEn} ({city.airport})
                              </SelectItem>
                            ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'zh' ? '出行日期' : 'Travel Date'}
                  </label>
                  <Input
                    type="date"
                    value={formData.travelDate}
                    onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* 步骤2: 选择医院 */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'zh' ? '选择医院' : 'Select Hospital'}
                  </label>
                  <Select
                    value={formData.selectedHospital}
                    onValueChange={(value) => setFormData({ ...formData, selectedHospital: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'zh' ? '选择医院' : 'Select hospital'} />
                    </SelectTrigger>
                    <SelectContent>
                      {hospitals.map((hospital) => (
                        <SelectItem key={hospital.id} value={hospital.id}>
                          {language === 'zh' && hospital.nameZh ? hospital.nameZh : hospital.nameEn}
                          {hospital.level && (
                            <Badge variant="secondary" className="ml-2">
                              {hospital.level}
                            </Badge>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.selectedHospital && (
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-gray-600">
                        {language === 'zh' ? '位置' : 'Location'}: {hospitals.find(h => h.id === formData.selectedHospital)?.location}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* 步骤3: 选择医生 */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'zh' ? '选择医生' : 'Select Doctor'}
                  </label>
                  <Select
                    value={formData.selectedDoctor}
                    onValueChange={(value) => setFormData({ ...formData, selectedDoctor: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'zh' ? '选择医生' : 'Select doctor'} />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.nameEn} {doctor.nameZh && `(${doctor.nameZh})`}
                          {doctor.title && <span className="text-gray-500 ml-2">- {doctor.title}</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.selectedDoctor && (
                  <Card>
                    <CardContent className="pt-4 space-y-2">
                      <p className="text-sm text-gray-600">
                        <strong>{language === 'zh' ? '擅长' : 'Specialties'}:</strong>{' '}
                        {JSON.parse(doctors.find(d => d.id === formData.selectedDoctor)?.specialtiesEn || '[]').join(', ')}
                      </p>
                      {doctors.find(d => d.id === formData.selectedDoctor)?.consultationFee && (
                        <p className="text-sm text-gray-600">
                          <strong>{language === 'zh' ? '咨询费' : 'Consultation Fee'}:</strong> $
                          {doctors.find(d => d.id === formData.selectedDoctor)?.consultationFee}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* 步骤4: 医疗选项 */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'zh' ? '治疗类型' : 'Treatment Type'}
                  </label>
                  <Select
                    value={formData.treatmentType}
                    onValueChange={(value) => setFormData({ ...formData, treatmentType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'zh' ? '选择治疗类型' : 'Select treatment type'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultation">{language === 'zh' ? '咨询' : 'Consultation'}</SelectItem>
                      <SelectItem value="examination">{language === 'zh' ? '检查' : 'Examination'}</SelectItem>
                      <SelectItem value="surgery">{language === 'zh' ? '手术' : 'Surgery'}</SelectItem>
                      <SelectItem value="therapy">{language === 'zh' ? '治疗' : 'Therapy'}</SelectItem>
                      <SelectItem value="rehabilitation">{language === 'zh' ? '康复' : 'Rehabilitation'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* 步骤5: 费用预算 */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'zh' ? '预算 (USD)' : 'Budget (USD)'}
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {language === 'zh' ? '输入您的预算，我们将为您推荐最优方案' : 'Enter your budget for optimal recommendations'}
                  </p>
                </div>

                {/* 预估费用 */}
                <Card className="bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {language === 'zh' ? '预估费用' : 'Estimated Cost'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>{language === 'zh' ? '医疗费用' : 'Medical Fee'}:</span>
                      <span className="font-medium">$500 - $2,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{language === 'zh' ? '酒店费用' : 'Hotel Fee'}:</span>
                      <span className="font-medium">$100 - $300/night</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{language === 'zh' ? '机票费用' : 'Flight Fee'}:</span>
                      <span className="font-medium">$800 - $1,500</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 导航按钮 */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {language === 'zh' ? '上一步' : 'Back'}
              </Button>
              <Button
                onClick={handleNext}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    {language === 'zh' ? '处理中...' : 'Processing...'}
                  </>
                ) : currentStep === 5 ? (
                  <>
                    {language === 'zh' ? '提交' : 'Submit'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    {language === 'zh' ? '下一步' : 'Next'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
