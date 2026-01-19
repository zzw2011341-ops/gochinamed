'use client';

import { useEffect, useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Stethoscope, Building2, MapPin, Star, Search, Brain, DollarSign, Plane, Sparkles, MessageSquare, Send, User, Bot } from 'lucide-react';
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

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function HomePage() {
  const { t, language } = useLanguage();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Example questions
  const exampleQuestions = language === 'zh' ? [
    '我想了解心脏手术的医生推荐',
    '北京有哪些顶级医院？',
    '癌症治疗需要多少预算？',
    '医疗旅游签证怎么办理？'
  ] : [
    'I need recommendations for heart surgeons',
    'What are the top hospitals in Beijing?',
    'What is the budget for cancer treatment?',
    'How do I apply for medical tourism visa?'
  ];

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput.trim()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          userId: 'guest',
          language
        })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      let assistantMessage: ChatMessage = {
        role: 'assistant',
        content: ''
      };

      setChatMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                setChatMessages(prev =>
                  prev.map((msg, idx) =>
                    idx === prev.length - 1
                      ? { ...msg, content: msg.content + parsed.content }
                      : msg
                  )
                );
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: language === 'zh' ? '抱歉，我遇到了一些问题。请稍后再试。' : 'Sorry, I encountered an issue. Please try again later.'
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleExampleQuestion = (question: string) => {
    setChatInput(question);
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

            {/* AI Chat Assistant */}
            <div className="max-w-4xl mx-auto">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader className="border-b border-white/20 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 rounded-full p-2">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-white text-lg">
                        {language === 'zh' ? 'AI 医疗助手' : 'AI Medical Assistant'}
                      </CardTitle>
                      <CardDescription className="text-blue-100 text-sm">
                        {language === 'zh' ? '随时为您解答医疗和旅行问题' : 'Here to help with medical and travel questions'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  {/* Chat Messages */}
                  {chatMessages.length > 0 && (
                    <div className="space-y-4 mb-4 max-h-80 overflow-y-auto pr-2">
                      {chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`flex items-start gap-2 max-w-[80%] ${
                              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                            }`}
                          >
                            <div className={`flex-shrink-0 rounded-full p-1.5 ${
                              msg.role === 'user'
                                ? 'bg-blue-500'
                                : 'bg-white/20'
                            }`}>
                              {msg.role === 'user' ? (
                                <User className="h-4 w-4 text-white" />
                              ) : (
                                <Bot className="h-4 w-4 text-white" />
                              )}
                            </div>
                            <div
                              className={`rounded-2xl px-4 py-3 ${
                                msg.role === 'user'
                                  ? 'bg-white text-gray-900'
                                  : 'bg-white/10 text-white'
                              }`}
                            >
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {msg.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {isChatLoading && (
                        <div className="flex justify-start">
                          <div className="flex items-start gap-2">
                            <div className="flex-shrink-0 bg-white/20 rounded-full p-1.5">
                              <Bot className="h-4 w-4 text-white" />
                            </div>
                            <div className="bg-white/10 rounded-2xl px-4 py-3">
                              <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100" />
                                <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  )}

                  {/* Example Questions (show only when no messages) */}
                  {chatMessages.length === 0 && (
                    <div className="mb-4">
                      <p className="text-blue-100 text-sm mb-3 text-center">
                        {language === 'zh' ? '试试这些问题：' : 'Try these questions:'}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {exampleQuestions.map((question, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleExampleQuestion(question)}
                            className="text-left text-sm px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chat Input */}
                  <form onSubmit={handleChatSubmit}>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder={language === 'zh' ? '输入您的问题...' : 'Type your question...'}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        disabled={isChatLoading}
                        className="bg-white/10 border-white/20 text-white placeholder:text-blue-100 focus-visible:ring-white"
                      />
                      <Button
                        type="submit"
                        disabled={!chatInput.trim() || isChatLoading}
                        className="bg-white text-blue-600 hover:bg-blue-50 px-6"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
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
