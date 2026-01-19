'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Stethoscope, Building2, MapPin, Star, Search, Brain, DollarSign, Plane, Sparkles, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface Doctor {
  id: string;
  nameEn: string;
  nameZh: string;
  title: string;
  specialtiesEn: string;
  imageUrl?: string;
  consultationFee?: string;
}

interface Hospital {
  id: string;
  nameEn: string;
  nameZh: string;
  level: string;
  location: string;
  imageUrl?: string;
}

export default function HomePage() {
  const { t, language } = useLanguage();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [doctorsRes, hospitalsRes] = await Promise.all([
          fetch('/api/doctors/featured'),
          fetch('/api/hospitals/featured'),
        ]);

        const doctorsData = await doctorsRes.json();
        const hospitalsData = await hospitalsRes.json();

        setDoctors(doctorsData.doctors || []);
        setHospitals(hospitalsData.hospitals || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getDoctorName = (doctor: Doctor) => {
    return language === 'zh' && doctor.nameZh ? doctor.nameZh : doctor.nameEn;
  };

  const getHospitalName = (hospital: Hospital) => {
    return language === 'zh' && hospital.nameZh ? hospital.nameZh : hospital.nameEn;
  };

  const parseSpecialties = (specialtiesEn: string) => {
    try {
      return JSON.parse(specialtiesEn);
    } catch {
      return [specialtiesEn];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {t('home.welcome')}
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              {t('home.subtitle')}
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder={language === 'zh' ? '搜索医生、医院或病种...' : 'Search for doctors, hospitals, or diseases...'}
                className="pl-12 py-6 text-lg rounded-full shadow-lg"
              />
              <Button className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6">
                {t('common.search')}
              </Button>
            </div>

            {/* Quick Links */}
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <Link href="/doctors">
                <Button variant="secondary" size="lg" className="gap-2">
                  <Stethoscope className="h-5 w-5" />
                  {t('nav.doctors')}
                </Button>
              </Link>
              <Link href="/hospitals">
                <Button variant="secondary" size="lg" className="gap-2">
                  <Building2 className="h-5 w-5" />
                  {t('nav.hospitals')}
                </Button>
              </Link>
              <Link href="/ai-assistant">
                <Button variant="secondary" size="lg" className="gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {t('nav.aiAssistant')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            {t('home.whyChooseUs')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto bg-blue-100 rounded-full p-4 mb-4">
                  <Stethoscope className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>{t('home.professionalMedical')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t('home.professionalMedicalDesc')}</CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto bg-green-100 rounded-full p-4 mb-4">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>{t('home.affordablePrices')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t('home.affordablePricesDesc')}</CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto bg-purple-100 rounded-full p-4 mb-4">
                  <Plane className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle>{t('home.tourismExperience')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t('home.tourismExperienceDesc')}</CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto bg-orange-100 rounded-full p-4 mb-4">
                  <Sparkles className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle>{t('home.personalizedService')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t('home.personalizedServiceDesc')}</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Doctors */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">
              {t('home.featuredDoctors')}
            </h2>
            <Link href="/doctors">
              <Button variant="outline">
                {t('common.viewMore')}
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p>{t('common.loading')}</p>
            </div>
          ) : doctors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {doctors.map((doctor) => (
                <Card key={doctor.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="mb-2">{getDoctorName(doctor)}</CardTitle>
                        <CardDescription className="mb-2">{doctor.title}</CardDescription>
                      </div>
                      {doctor.imageUrl && (
                        <div className="ml-4 w-16 h-16 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                          <img
                            src={doctor.imageUrl}
                            alt={getDoctorName(doctor)}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">{t('doctors.specialties')}:</p>
                      <div className="flex flex-wrap gap-2">
                        {parseSpecialties(doctor.specialtiesEn).slice(0, 3).map((specialty: string, index: number) => (
                          <Badge key={index} variant="outline">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {doctor.consultationFee && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{t('doctors.consultationFee')}</span>
                        <span className="font-semibold">${doctor.consultationFee}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">{t('doctors.noDoctorsFound')}</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Hospitals */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">
              {t('home.featuredHospitals')}
            </h2>
            <Link href="/hospitals">
              <Button variant="outline">
                {t('common.viewMore')}
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p>{t('common.loading')}</p>
            </div>
          ) : hospitals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hospitals.map((hospital) => (
                <Card key={hospital.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      {hospital.imageUrl && (
                        <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={hospital.imageUrl}
                            alt={getHospitalName(hospital)}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <CardTitle className="mb-2">{getHospitalName(hospital)}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {hospital.location}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{t('hospitals.level')}</p>
                        <p className="font-semibold">{hospital.level}</p>
                      </div>
                      <Badge variant="secondary">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">{t('hospitals.noHospitalsFound')}</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t('common.appName')} - {t('common.slogan')}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start your medical journey to China today
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button size="lg" variant="secondary">
                {t('nav.register')}
              </Button>
            </Link>
            <Link href="/ai-assistant">
              <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 border-white/20">
                <Brain className="h-5 w-5 mr-2" />
                {t('nav.aiAssistant')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Stethoscope className="h-8 w-8 text-blue-400" />
                <span className="text-xl font-bold">GoChinaMed</span>
              </div>
              <p className="text-gray-400">{t('common.slogan')}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/doctors" className="hover:text-white">{t('nav.doctors')}</Link></li>
                <li><Link href="/hospitals" className="hover:text-white">{t('nav.hospitals')}</Link></li>
                <li><Link href="/community" className="hover:text-white">{t('nav.community')}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <p className="text-gray-400">
                Shandong Heshifang Information Technology Co., Ltd.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 GoChinaMed. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
