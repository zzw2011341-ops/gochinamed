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
import { DEPARTURE_CITIES, DESTINATION_CITIES } from "@/data/cities";
import { COUNTRIES, COUNTRIES_BY_REGION, REGION_NAMES } from "@/data/countries";

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
    numberOfPeople: "1",
    passportNumber: "",
    passportCountry: "",
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
    // 步骤1验证：必填字段（出发城市、到达城市、日期、人数）
    if (currentStep === 1) {
      if (!formData.originCity) {
        alert(language === 'zh' ? '请选择出发城市' : 'Please select departure city');
        return;
      }
      if (!formData.destinationCity) {
        alert(language === 'zh' ? '请选择目的城市' : 'Please select destination city');
        return;
      }
      if (!formData.travelDate) {
        alert(language === 'zh' ? '请选择出行日期' : 'Please select travel date');
        return;
      }
      if (!formData.numberOfPeople) {
        alert(language === 'zh' ? '请选择出行人数' : 'Please select number of travelers');
        return;
      }
    }

    // 步骤4验证：如果选择了医院或医生，则必须选择治疗类型
    if (currentStep === 4) {
      if ((formData.selectedHospital || formData.selectedDoctor) && !formData.treatmentType) {
        alert(language === 'zh' ? '已选择医疗服务，请选择治疗类型' : 'Please select treatment type for medical services');
        return;
      }
    }

    // 医院和医生是可选的，用于纯旅游场景
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
                      {['americas', 'europe', 'asia', 'oceania', 'china'].map((region) => {
                        const regionCities = DEPARTURE_CITIES.filter(city => city.region === region);
                        if (regionCities.length === 0) return null;
                        
                        return (
                          <div key={region}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                              {language === 'zh' ?
                                (region === 'americas' ? '美洲' : region === 'europe' ? '欧洲' : region === 'asia' ? '亚洲' : region === 'oceania' ? '大洋洲' : '中国') :
                                region.charAt(0).toUpperCase() + region.slice(1)
                              }
                            </div>
                            {regionCities.map((city) => (
                              <SelectItem key={city.id} value={city.nameEn}>
                                {language === 'zh' ? city.nameZh : city.nameEn} ({city.airport})
                              </SelectItem>
                            ))}
                          </div>
                        );
                      })}
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
                      {DESTINATION_CITIES.map((city) => (
                        <SelectItem key={city.id} value={city.nameEn}>
                          {language === 'zh' ? city.nameZh : city.nameEn} ({city.airport})
                        </SelectItem>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'zh' ? '出行人数' : 'Number of Travelers'}
                  </label>
                  <Select
                    value={formData.numberOfPeople}
                    onValueChange={(value) => setFormData({ ...formData, numberOfPeople: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'zh' ? '选择人数' : 'Select number of travelers'} />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {language === 'zh' ? '人' : num === 1 ? 'person' : 'people'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      {formData.numberOfPeople && formData.numberOfPeople !== "1" && (
                        <span className="text-sm font-normal text-gray-600 ml-2">
                          ({formData.numberOfPeople} {language === 'zh' ? '人' : 'people'})
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {/* 仅当选择了医生或医院时显示医疗费用 */}
                    {formData.selectedHospital || formData.selectedDoctor ? (
                      <div className="flex justify-between">
                        <span>{language === 'zh' ? '医疗费用' : 'Medical Fee'}:</span>
                        <span className="font-medium">$500 - $2,000</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-gray-400">
                        <span>{language === 'zh' ? '医疗费用' : 'Medical Fee'}:</span>
                        <span className="font-medium">{language === 'zh' ? '未选择医疗服务' : 'Not selected'}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>{language === 'zh' ? '酒店费用' : 'Hotel Fee'}:</span>
                      <span className="font-medium">$100 - $300/night × {formData.numberOfPeople || 1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{language === 'zh' ? '机票费用' : 'Flight Fee'}:</span>
                      <span className="font-medium">$800 - $1,500 × {formData.numberOfPeople || 1}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 步骤6: 护照信息 */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'zh' ? '护照签发国家' : 'Passport Country'}
                  </label>
                  <Select
                    value={formData.passportCountry}
                    onValueChange={(value) => setFormData({ ...formData, passportCountry: value })}
                  >
                    <SelectTrigger>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'zh' ? '护照号码' : 'Passport Number'}
                  </label>
                  <Input
                    placeholder={language === 'zh' ? '输入护照号码' : 'Enter passport number'}
                    value={formData.passportNumber}
                    onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
                    className="uppercase"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'zh' ? '请输入您的护照号码，用于预订和入境' : 'Please enter your passport number for booking and immigration'}
                  </p>
                </div>
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
