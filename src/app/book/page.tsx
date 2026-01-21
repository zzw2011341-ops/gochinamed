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
import { DEPARTURE_CITIES, DESTINATION_CITIES, City } from "@/data/cities";
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
    consultationDirection: "",
    examinationItems: "",
    surgeryTypes: "",
    treatmentDirection: "",
    rehabilitationDirection: "",
    budget: user?.budget?.toString() || "",
  });

  // 数据
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // 判断是否同城旅行
  const isSameCity = formData.originCity === formData.destinationCity;

  // 获取城市信息并判断是否跨国旅行
  const getCityByRegionName = (cityName: string): City | undefined => {
    return [...DEPARTURE_CITIES, ...DESTINATION_CITIES].find(city =>
      city.nameEn === cityName || city.nameZh === cityName
    );
  };

  const originCityInfo = getCityByRegionName(formData.originCity);
  const destinationCityInfo = getCityByRegionName(formData.destinationCity);
  const isInternationalTravel = originCityInfo?.region !== destinationCityInfo?.region;

  // 根据是否跨国设置日期限制（跨国15天，同国7天）
  const minDaysAdvance = isInternationalTravel ? 15 : 7;

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

  useEffect(() => {
    // 当咨询方向变化时，重新过滤医生列表（如果已选择医院）
    if (formData.selectedHospital && doctors.length > 0) {
      filterDoctorsByConsultation();
    }
  }, [formData.consultationDirection]);

  const fetchHospitals = async () => {
    try {
      // 根据城市名称查找城市ID
      const cityInfo = [...DEPARTURE_CITIES, ...DESTINATION_CITIES].find(
        city => city.nameEn === formData.destinationCity || city.nameZh === formData.destinationCity
      );
      const cityId = cityInfo?.id || formData.destinationCity;

      const response = await fetch(`/api/search/medical?type=hospital&location=${cityId}&limit=20`);
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
      const allDoctors = data.doctors || [];
      // 如果已选择咨询方向，则过滤医生
      if (formData.consultationDirection) {
        const filtered = filterDoctorsByDirection(allDoctors, formData.consultationDirection);
        setDoctors(filtered);
      } else {
        setDoctors(allDoctors);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  // 根据咨询方向过滤医生
  const filterDoctorsByDirection = (doctorList: Doctor[], direction: string): Doctor[] => {
    if (!direction || direction === 'general') {
      return doctorList; // 一般咨询不限制医生
    }

    // 根据咨询方向匹配医生的专长
    return doctorList.filter(doctor => {
      const specialties = JSON.parse(doctor.specialtiesEn || '[]');
      // 转换咨询方向到关键词进行匹配
      const directionKeywords: Record<string, string[]> = {
        'internal': ['internal', 'medicine', 'general', 'internist'],
        'surgery': ['surgery', 'surgeon', 'surgical'],
        'pediatrics': ['pediatric', 'children', 'child'],
        'obstetrics': ['obstetric', 'gynecology', 'women', 'ob-gyn', 'gyn'],
        'orthopedics': ['orthopedic', 'bone', 'joint', 'musculoskeletal'],
        'neurology': ['neurolog', 'brain', 'nervous', 'neural'],
        'cardiology': ['cardiac', 'heart', 'cardiovascular', 'cardiologist'],
        'oncology': ['cancer', 'tumor', 'oncologist', 'malignancy'],
        'dermatology': ['skin', 'dermatologic', 'dermatologist'],
        'ophthalmology': ['eye', 'ophthalmic', 'vision'],
        'ent': ['ear', 'nose', 'throat', 'otolaryngology', 'head', 'neck'],
        'traditional_chinese': ['chinese', 'tcm', 'acupuncture', 'herbal'],
        'rehabilitation': ['rehab', 'recovery', 'physical therapy', 'therapy'],
        'nutrition': ['nutrition', 'diet', 'food', 'dietitian'],
      };

      const keywords = directionKeywords[direction] || [];
      if (keywords.length === 0) return true;

      // 检查 specialtiesEn 字段是否包含相关关键词
      const specialtiesLower = doctor.specialtiesEn.toLowerCase();
      const nameLower = doctor.nameEn.toLowerCase();

      return keywords.some(keyword =>
        specialtiesLower.includes(keyword) || nameLower.includes(keyword)
      );
    });
  };

  // 在咨询方向变化时过滤现有医生列表
  const filterDoctorsByConsultation = () => {
    if (formData.consultationDirection) {
      // 重新获取医生列表（基于医院）
      fetchDoctors();
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
                {/* 跨国旅行提醒 */}
                {isInternationalTravel && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-amber-800">
                          {language === 'zh' ? '跨国旅行提醒' : 'International Travel Notice'}
                        </h4>
                        <p className="text-sm text-amber-700 mt-1">
                          {language === 'zh'
                            ? '您选择了跨国旅行，请务必提前办妥护照、签证等身份手续，确保出行顺利。'
                            : 'You are planning international travel. Please ensure your passport, visa, and other travel documents are valid and ready.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
                    min={new Date(Date.now() + minDaysAdvance * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'zh'
                      ? isInternationalTravel
                        ? '跨国旅行请至少提前15天预订'
                        : '请至少提前7天预订'
                      : isInternationalTravel
                      ? 'Please book at least 15 days in advance for international travel'
                      : 'Please book at least 7 days in advance'}
                  </p>
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

                {/* 咨询方向选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'zh' ? '咨询方向' : 'Consultation Direction'}
                    <span className="text-gray-400 font-normal ml-2">
                      ({language === 'zh' ? '可选' : 'Optional'})
                    </span>
                  </label>
                  <Select
                    value={formData.consultationDirection}
                    onValueChange={(value) => setFormData({ ...formData, consultationDirection: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'zh' ? '选择咨询方向' : 'Select consultation direction'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">{language === 'zh' ? '一般健康咨询' : 'General Health'}</SelectItem>
                      <SelectItem value="internal">{language === 'zh' ? '内科咨询' : 'Internal Medicine'}</SelectItem>
                      <SelectItem value="surgery">{language === 'zh' ? '外科咨询' : 'Surgery'}</SelectItem>
                      <SelectItem value="pediatrics">{language === 'zh' ? '儿科咨询' : 'Pediatrics'}</SelectItem>
                      <SelectItem value="obstetrics">{language === 'zh' ? '妇产科咨询' : 'Obstetrics'}</SelectItem>
                      <SelectItem value="orthopedics">{language === 'zh' ? '骨科咨询' : 'Orthopedics'}</SelectItem>
                      <SelectItem value="neurology">{language === 'zh' ? '神经科咨询' : 'Neurology'}</SelectItem>
                      <SelectItem value="cardiology">{language === 'zh' ? '心血管科咨询' : 'Cardiology'}</SelectItem>
                      <SelectItem value="oncology">{language === 'zh' ? '肿瘤科咨询' : 'Oncology'}</SelectItem>
                      <SelectItem value="dermatology">{language === 'zh' ? '皮肤科咨询' : 'Dermatology'}</SelectItem>
                      <SelectItem value="ophthalmology">{language === 'zh' ? '眼科咨询' : 'Ophthalmology'}</SelectItem>
                      <SelectItem value="ent">{language === 'zh' ? '耳鼻喉科咨询' : 'ENT'}</SelectItem>
                      <SelectItem value="traditional_chinese">{language === 'zh' ? '中医咨询' : 'Traditional Chinese Medicine'}</SelectItem>
                      <SelectItem value="rehabilitation">{language === 'zh' ? '康复咨询' : 'Rehabilitation'}</SelectItem>
                      <SelectItem value="nutrition">{language === 'zh' ? '营养咨询' : 'Nutrition'}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'zh' ? '选择您需要的咨询方向，我们将为您匹配专业的医生' : 'Select the consultation direction you need for specialized doctor matching'}
                  </p>
                </div>
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

                {/* 检查项目选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'zh' ? '检查项目' : 'Examination Items'}
                    <span className="text-gray-400 font-normal ml-2">
                      ({language === 'zh' ? '可选' : 'Optional'})
                    </span>
                  </label>
                  <Select
                    value={formData.examinationItems}
                    onValueChange={(value) => setFormData({ ...formData, examinationItems: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'zh' ? '选择检查项目' : 'Select examination items'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blood_test">{language === 'zh' ? '血液检查' : 'Blood Test'}</SelectItem>
                      <SelectItem value="urine_test">{language === 'zh' ? '尿液检查' : 'Urine Test'}</SelectItem>
                      <SelectItem value="ct_scan">{language === 'zh' ? 'CT扫描' : 'CT Scan'}</SelectItem>
                      <SelectItem value="mri">{language === 'zh' ? '核磁共振' : 'MRI'}</SelectItem>
                      <SelectItem value="ultrasound">{language === 'zh' ? '超声波检查' : 'Ultrasound'}</SelectItem>
                      <SelectItem value="x_ray">{language === 'zh' ? 'X光检查' : 'X-Ray'}</SelectItem>
                      <SelectItem value="ecg">{language === 'zh' ? '心电图' : 'ECG'}</SelectItem>
                      <SelectItem value="endoscopy">{language === 'zh' ? '内窥镜检查' : 'Endoscopy'}</SelectItem>
                      <SelectItem value="biopsy">{language === 'zh' ? '活检' : 'Biopsy'}</SelectItem>
                      <SelectItem value="pet_scan">{language === 'zh' ? 'PET扫描' : 'PET Scan'}</SelectItem>
                      <SelectItem value="bone_density">{language === 'zh' ? '骨密度检查' : 'Bone Density'}</SelectItem>
                      <SelectItem value="colonoscopy">{language === 'zh' ? '结肠镜检查' : 'Colonoscopy'}</SelectItem>
                      <SelectItem value="comprehensive">{language === 'zh' ? '综合体检套餐' : 'Comprehensive Checkup'}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'zh' ? '选择您需要的检查项目，便于医生提前了解您的健康状况' : 'Select the examination items you need for better health assessment'}
                  </p>
                </div>
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

                {/* 手术种类选择 */}
                {formData.treatmentType === 'surgery' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'zh' ? '手术种类' : 'Surgery Types'}
                      <span className="text-gray-400 font-normal ml-2">
                        ({language === 'zh' ? '可选' : 'Optional'})
                      </span>
                    </label>
                    <Select
                      value={formData.surgeryTypes}
                      onValueChange={(value) => setFormData({ ...formData, surgeryTypes: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'zh' ? '选择手术种类' : 'Select surgery type'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cardiac_surgery">{language === 'zh' ? '心脏手术' : 'Cardiac Surgery'}</SelectItem>
                        <SelectItem value="neurosurgery">{language === 'zh' ? '神经外科手术' : 'Neurosurgery'}</SelectItem>
                        <SelectItem value="orthopedic_surgery">{language === 'zh' ? '骨科手术' : 'Orthopedic Surgery'}</SelectItem>
                        <SelectItem value="cosmetic_surgery">{language === 'zh' ? '整形外科手术' : 'Cosmetic Surgery'}</SelectItem>
                        <SelectItem value="ophthalmic_surgery">{language === 'zh' ? '眼科手术' : 'Ophthalmic Surgery'}</SelectItem>
                        <SelectItem value="dental_surgery">{language === 'zh' ? '牙科手术' : 'Dental Surgery'}</SelectItem>
                        <SelectItem value="general_surgery">{language === 'zh' ? '普通外科手术' : 'General Surgery'}</SelectItem>
                        <SelectItem value="gynecologic_surgery">{language === 'zh' ? '妇科手术' : 'Gynecologic Surgery'}</SelectItem>
                        <SelectItem value="urology_surgery">{language === 'zh' ? '泌尿外科手术' : 'Urology Surgery'}</SelectItem>
                        <SelectItem value="oncology_surgery">{language === 'zh' ? '肿瘤手术' : 'Oncology Surgery'}</SelectItem>
                        <SelectItem value="pediatric_surgery">{language === 'zh' ? '儿科手术' : 'Pediatric Surgery'}</SelectItem>
                        <SelectItem value="vascular_surgery">{language === 'zh' ? '血管手术' : 'Vascular Surgery'}</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      {language === 'zh' ? '选择您需要的手术类型，将影响治疗方案和费用' : 'Select the surgery type you need, which will affect treatment plan and cost'}
                    </p>
                  </div>
                )}

                {/* 治疗方向选择 */}
                {formData.treatmentType === 'therapy' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'zh' ? '治疗方向' : 'Treatment Direction'}
                      <span className="text-gray-400 font-normal ml-2">
                        ({language === 'zh' ? '可选' : 'Optional'})
                      </span>
                    </label>
                    <Select
                      value={formData.treatmentDirection}
                      onValueChange={(value) => setFormData({ ...formData, treatmentDirection: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'zh' ? '选择治疗方向' : 'Select treatment direction'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="physical_therapy">{language === 'zh' ? '物理治疗' : 'Physical Therapy'}</SelectItem>
                        <SelectItem value="medication">{language === 'zh' ? '药物治疗' : 'Medication'}</SelectItem>
                        <SelectItem value="radiation">{language === 'zh' ? '放射治疗' : 'Radiation Therapy'}</SelectItem>
                        <SelectItem value="chemotherapy">{language === 'zh' ? '化疗' : 'Chemotherapy'}</SelectItem>
                        <SelectItem value="immunotherapy">{language === 'zh' ? '免疫治疗' : 'Immunotherapy'}</SelectItem>
                        <SelectItem value="targeted_therapy">{language === 'zh' ? '靶向治疗' : 'Targeted Therapy'}</SelectItem>
                        <SelectItem value="hormone_therapy">{language === 'zh' ? '激素治疗' : 'Hormone Therapy'}</SelectItem>
                        <SelectItem value="laser_therapy">{language === 'zh' ? '激光治疗' : 'Laser Therapy'}</SelectItem>
                        <SelectItem value="acupuncture">{language === 'zh' ? '针灸治疗' : 'Acupuncture'}</SelectItem>
                        <SelectItem value="massage">{language === 'zh' ? '按摩治疗' : 'Massage Therapy'}</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      {language === 'zh' ? '选择您需要的治疗方向，确保针对性治疗' : 'Select the treatment direction you need for targeted therapy'}
                    </p>
                  </div>
                )}

                {/* 康复方向选择 */}
                {formData.treatmentType === 'rehabilitation' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'zh' ? '康复方向' : 'Rehabilitation Direction'}
                      <span className="text-gray-400 font-normal ml-2">
                        ({language === 'zh' ? '可选' : 'Optional'})
                      </span>
                    </label>
                    <Select
                      value={formData.rehabilitationDirection}
                      onValueChange={(value) => setFormData({ ...formData, rehabilitationDirection: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'zh' ? '选择康复方向' : 'Select rehabilitation direction'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="post_surgery">{language === 'zh' ? '术后康复' : 'Post-Surgery Rehabilitation'}</SelectItem>
                        <SelectItem value="stroke">{language === 'zh' ? '中风康复' : 'Stroke Rehabilitation'}</SelectItem>
                        <SelectItem value="orthopedic_rehab">{language === 'zh' ? '骨科康复' : 'Orthopedic Rehabilitation'}</SelectItem>
                        <SelectItem value="cardiac_rehab">{language === 'zh' ? '心脏康复' : 'Cardiac Rehabilitation'}</SelectItem>
                        <SelectItem value="neurological_rehab">{language === 'zh' ? '神经康复' : 'Neurological Rehabilitation'}</SelectItem>
                        <SelectItem value="sports_rehab">{language === 'zh' ? '运动康复' : 'Sports Rehabilitation'}</SelectItem>
                        <SelectItem value="pediatric_rehab">{language === 'zh' ? '儿童康复' : 'Pediatric Rehabilitation'}</SelectItem>
                        <SelectItem value="pulmonary_rehab">{language === 'zh' ? '肺康复' : 'Pulmonary Rehabilitation'}</SelectItem>
                        <SelectItem value="pain_management">{language === 'zh' ? '疼痛管理' : 'Pain Management'}</SelectItem>
                        <SelectItem value="cognitive_rehab">{language === 'zh' ? '认知康复' : 'Cognitive Rehabilitation'}</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      {language === 'zh' ? '选择您需要的康复方向，加快恢复进程' : 'Select the rehabilitation direction you need to speed up recovery'}
                    </p>
                  </div>
                )}
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
                    {/* 医疗费用 - 详细分类 */}
                    {formData.selectedHospital || formData.selectedDoctor ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium text-blue-700">
                          <span>{language === 'zh' ? '医疗费用（总计）' : 'Medical Fee (Total)'}</span>
                          <span>$2,350 - $4,500</span>
                        </div>
                        <div className="pl-4 space-y-1 text-xs text-gray-600">
                          <div className="flex justify-between">
                            <span>{language === 'zh' ? '• 手术费' : '• Surgery'}</span>
                            <span>$2,000 - $5,000</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{language === 'zh' ? '• 药费' : '• Medicine'}</span>
                            <span>$100 - $300</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{language === 'zh' ? '• 护理费' : '• Nursing'}</span>
                            <span>$200 - $500</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{language === 'zh' ? '• 营养费' : '• Nutrition'}</span>
                            <span>$50 - $200</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between text-gray-400">
                        <span>{language === 'zh' ? '医疗费用' : 'Medical Fee'}</span>
                        <span className="font-medium">{language === 'zh' ? '未选择医疗服务' : 'Not selected'}</span>
                      </div>
                    )}

                    {/* 基础费用 */}
                    <div className="flex justify-between text-sm">
                      <span>{language === 'zh' ? '酒店费用' : 'Hotel Fee'}</span>
                      <span className="font-medium">$100 - $300/night × {formData.numberOfPeople || 1}</span>
                    </div>

                    {/* 交通费用 */}
                    {isSameCity ? (
                      <div className="flex justify-between text-sm">
                        <span>{language === 'zh' ? '车费' : 'Car Fee'}</span>
                        <span className="font-medium">$50 - $200 × {formData.numberOfPeople || 1}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-sm">
                        <span>{language === 'zh' ? '机票费用' : 'Flight Fee'}</span>
                        <span className="font-medium">$800 - $1,500 × {formData.numberOfPeople || 1}</span>
                      </div>
                    )}

                    {/* 其他费用 */}
                    <div className="flex justify-between text-sm">
                      <span>{language === 'zh' ? '门票' : 'Tickets'}</span>
                      <span className="font-medium">$30 - $100 × {formData.numberOfPeople || 1}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>{language === 'zh' ? '预约费用' : 'Reservation Fee'}</span>
                      <span className="font-medium">$50 - $200</span>
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
