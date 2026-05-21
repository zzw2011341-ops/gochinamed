"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Building2, Star, Award, ShieldCheck, Users, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/locales";

interface Doctor {
  id: string;
  nameEn: string;
  nameZh: string | null;
  title: string | null;
  specialtiesEn: string;
  specialtiesZh: string | null;
  imageUrl: string | null;
  consultationFee: string | null;
  isFeatured?: boolean;
}

export default function HospitalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const t = translations[language];
  const hospitalId = params.id as string;

  const [hospital, setHospital] = useState<any>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHospitalDetail();
  }, [hospitalId]);

  const fetchHospitalDetail = async () => {
    setLoading(true);
    try {
      // Fetch hospital details
      const hospitalResponse = await fetch(`/api/hospitals/${hospitalId}`);
      if (!hospitalResponse.ok) {
        throw new Error("Failed to fetch hospital details");
      }
      const hospitalData = await hospitalResponse.json();
      setHospital(hospitalData);

      // Fetch doctors at this hospital
      const doctorsResponse = await fetch(`/api/doctors/by-hospital/${hospitalId}`);
      if (doctorsResponse.ok) {
        const doctorsData = await doctorsResponse.json();
        setDoctors(doctorsData.doctors || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    if (level?.includes("3A")) return "bg-yellow-100 text-yellow-800";
    if (level?.includes("3B")) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  const getLevelIcon = (level: string) => {
    if (level?.includes("3A")) return <Award className="h-3 w-3" />;
    if (level?.includes("3B")) return <Star className="h-3 w-3" />;
    return <ShieldCheck className="h-3 w-3" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !hospital) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || "Hospital not found"}</p>
          <Button onClick={() => router.back()}>Back</Button>
        </div>
      </div>
    );
  }

  const specialties = hospital.specialties ? (Array.isArray(hospital.specialties) ? hospital.specialties : JSON.parse(hospital.specialties || "[]")) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-white hover:bg-white/10 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.common?.back || "Back"}
          </Button>
          
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-white/20 rounded-lg flex items-center justify-center">
                <Building2 className="h-16 w-16" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-2">
                <h1 className="text-3xl font-bold">
                  {hospital.nameEn}
                  {hospital.nameZh && <span className="ml-2 text-2xl font-normal">({hospital.nameZh})</span>}
                </h1>
                {hospital.level && (
                  <Badge className={`${getLevelColor(hospital.level)} flex items-center gap-1`}>
                    {getLevelIcon(hospital.level)}
                    {hospital.level}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-lg opacity-90 mb-3">
                <MapPin className="h-5 w-5" />
                {hospital.location}
              </div>
              {hospital.isFeatured && (
                <div className="flex items-center gap-2 text-sm bg-white/10 px-3 py-1 rounded-full w-fit">
                  <Star className="h-4 w-4 fill-current" />
                  <span>{t.hospitals?.featuredHospital || "Featured Hospital"}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                {t.hospitals?.bookAppointment || "Book Appointment"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="overview">{t.common?.overview || "Overview"}</TabsTrigger>
            <TabsTrigger value="specialties">{t.hospitals?.specialties || "Specialties"}</TabsTrigger>
            <TabsTrigger value="doctors">
              <Users className="h-4 w-4 mr-2" />
              Doctors ({doctors.length})
            </TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {t.common?.about || "About Hospital"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hospital.descriptionEn && (
                  <p className="text-gray-700 leading-relaxed">{hospital.descriptionEn}</p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <ShieldCheck className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="font-semibold text-blue-900">{hospital.level || "-"}</p>
                      <p className="text-sm text-gray-600">{t.hospitals?.hospitalLevel || "Hospital Level"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                    <Stethoscope className="h-6 w-6 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{doctors.length}</p>
                      <p className="text-sm text-gray-600">
                        {language === "zh" ? "位医生" : "Doctors"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                    <MapPin className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900 line-clamp-2">{hospital.location}</p>
                      <p className="text-sm text-gray-600">{t.common?.location || "Location"}</p>
                    </div>
                  </div>
                </div>

                {hospital.isFeatured && (
                  <div className="flex items-center gap-2 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Award className="h-5 w-5 text-yellow-600" />
                    <span className="text-yellow-800 font-medium">
                      {t.hospitals?.featuredHospital || "Featured Hospital"}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Specialties */}
          <TabsContent value="specialties">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    {t.hospitals?.specialties || "Medical Specialties"}
                  </CardTitle>
                  <CardDescription>
                    {t.hospitals?.specialtiesDesc || "Medical departments and specialties available"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {specialties.length > 0 ? (
                      specialties.map((specialty: string, index: number) => (
                        <Badge key={index} variant="secondary" className="px-3 py-2 text-sm">
                          {specialty}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-gray-500">No specialties listed</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 医院强项展示 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    {language === 'zh' ? '医院强项' : 'Hospital Strengths'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'zh' ? '该医院在以下领域表现卓越' : 'Areas of excellence for this hospital'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {specialties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {specialties.slice(0, 6).map((specialty: string, index: number) => (
                        <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <Stethoscope className="h-4 w-4 text-blue-600" />
                            </div>
                            <h4 className="font-semibold">{specialty}</h4>
                          </div>
                          <p className="text-sm text-gray-600">
                            {language === 'zh'
                              ? `该科室拥有专业的医疗团队和先进的诊疗设备，提供高质量的医疗服务。`
                              : `This department has professional medical team and advanced diagnostic equipment.`}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">{language === 'zh' ? '暂无强项信息' : 'No strengths information'}</p>
                  )}
                </CardContent>
              </Card>

              {/* 名医拿手项目 */}
              {doctors.filter(d => d.isFeatured).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-600" />
                      {language === 'zh' ? '名医拿手项目' : 'Expert Doctors Specialties'}
                    </CardTitle>
                    <CardDescription>
                      {language === 'zh' ? '该院名医擅长的医疗项目' : 'Specialties of expert doctors at this hospital'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {doctors.filter(d => d.isFeatured).map((doctor, idx) => {
                        const doctorSpecialties = doctor.specialtiesEn
                          ? JSON.parse(doctor.specialtiesEn)
                          : [];
                        return (
                          <div key={doctor.id} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                                {doctor.nameEn.charAt(0)}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">
                                  {doctor.nameEn}
                                  {doctor.nameZh && <span className="ml-1 text-sm text-gray-600">({doctor.nameZh})</span>}
                                </h4>
                                <p className="text-sm text-gray-600 mb-2">{doctor.title}</p>
                                {doctorSpecialties.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {doctorSpecialties.map((spec: string, sidx: number) => (
                                      <Badge key={sidx} variant="outline" className="text-xs">
                                        {spec}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {doctor.consultationFee && (
                                <div className="text-right">
                                  <p className="text-lg font-bold text-blue-600">${doctor.consultationFee}</p>
                                  <p className="text-xs text-gray-600">Consultation</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Doctors */}
          <TabsContent value="doctors">
            <div className="space-y-4">
              {doctors.length > 0 ? (
                doctors.map((doctor) => (
                  <Card
                    key={doctor.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => router.push(`/doctors/${doctor.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                          {doctor.nameEn.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {doctor.nameEn}
                            {doctor.nameZh && <span className="ml-1 text-sm text-gray-600">({doctor.nameZh})</span>}
                          </h3>
                          <p className="text-sm text-gray-600">{doctor.title || "Physician"}</p>
                          
                          {doctor.specialtiesEn && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {JSON.parse(doctor.specialtiesEn || "[]").slice(0, 3).map((spec: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        {doctor.consultationFee && (
                          <div className="text-right">
                            <p className="text-xl font-bold text-blue-600">${doctor.consultationFee}</p>
                            <p className="text-xs text-gray-600">Consultation</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-gray-600">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>{t.hospitals?.noDoctors || "No doctors available at this hospital"}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
