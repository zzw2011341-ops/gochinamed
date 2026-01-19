"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Stethoscope, User, Clock, DollarSign, Calendar, Phone, Mail, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/locales";
import { Doctor } from "@/storage/database/shared/schema";

export default function DoctorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const t = translations[language];
  const doctorId = params.id as string;

  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctorDetail();
  }, [doctorId]);

  const fetchDoctorDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/doctors/${doctorId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch doctor details");
      }
      const data = await response.json();
      setDoctor(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || "Doctor not found"}</p>
          <Button onClick={() => router.back()}>Back</Button>
        </div>
      </div>
    );
  }

  const specialties = JSON.parse(doctor.specialtiesEn || "[]") as string[];

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
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                {doctor.nameEn?.charAt(0) || "?"}
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">
                {doctor.nameEn}
                {doctor.nameZh && <span className="ml-2 text-2xl font-normal">({doctor.nameZh})</span>}
              </h1>
              <p className="text-lg opacity-90 mb-3">{doctor.title || "Physician"}</p>
              {doctor.hospital && (
                <div className="flex items-center gap-2 text-sm opacity-80">
                  <MapPin className="h-4 w-4" />
                  {doctor.hospital.nameEn}
                  {doctor.hospital.nameZh && <span>({doctor.hospital.nameZh})</span>}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 justify-center">
              {doctor.consultationFee && (
                <div className="bg-white/20 rounded-lg px-4 py-2 text-center">
                  <p className="text-2xl font-bold">${doctor.consultationFee}</p>
                  <p className="text-sm opacity-90">{t.doctors?.consultationFee || "Consultation Fee"}</p>
                </div>
              )}
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                {t.doctors?.bookAppointment || "Book Appointment"}
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
            <TabsTrigger value="specialties">{t.doctors?.specialties || "Specialties"}</TabsTrigger>
            <TabsTrigger value="contact">{t.common?.contact || "Contact"}</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t.common?.about || "About"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {doctor.descriptionEn && (
                  <p className="text-gray-700 leading-relaxed">{doctor.descriptionEn}</p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctor.experienceYears && (
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                      <Clock className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{doctor.experienceYears}</p>
                        <p className="text-sm text-gray-600">
                          {language === "zh" ? "年经验" : "Years of Experience"}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {doctor.hospital && (
                    <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                      <Stethoscope className="h-6 w-6 text-purple-600" />
                      <div>
                        <p className="font-semibold text-purple-900">{doctor.hospital.nameEn}</p>
                        <p className="text-sm text-gray-600">{doctor.hospital.location}</p>
                      </div>
                    </div>
                  )}
                </div>

                {doctor.isFeatured && (
                  <div className="flex items-center gap-2 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Award className="h-5 w-5 text-yellow-600" />
                    <span className="text-yellow-800 font-medium">
                      {t.doctors?.featuredDoctor || "Featured Doctor"}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Specialties */}
          <TabsContent value="specialties">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  {t.doctors?.specialties || "Medical Specialties"}
                </CardTitle>
                <CardDescription>
                  {t.doctors?.specialtiesDesc || "Areas of medical expertise"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {specialties.length > 0 ? (
                    specialties.map((specialty, index) => (
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
          </TabsContent>

          {/* Contact */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  {t.common?.contact || "Contact Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {doctor.hospital && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">{doctor.hospital.nameEn}</p>
                        <p className="text-gray-600">{doctor.hospital.location}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t">
                  <Button className="w-full" size="lg">
                    <Calendar className="h-4 w-4 mr-2" />
                    {t.doctors?.bookAppointment || "Book Appointment"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
