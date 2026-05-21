"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Loader2, Download, FileText, History, Copy, Check, MapPin, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/locales";

export default function AIPlanPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = translations[language];

  const [formData, setFormData] = useState({
    disease: "",
    symptoms: "",
    preferredLocation: "",
    budget: "",
    travelDates: "",
    specialRequirements: "",
  });

  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("medical");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<Array<{ timestamp: number; plan: string; criteria: any }>>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [plan]);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('gochinamed_plan_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history:', e);
      }
    }
  }, []);

  const saveToHistory = (planText: string, criteria: any) => {
    const newHistoryItem = {
      timestamp: Date.now(),
      plan: planText,
      criteria: { ...criteria },
    };
    const updatedHistory = [newHistoryItem, ...history].slice(0, 10); // Keep last 10 plans
    setHistory(updatedHistory);
    localStorage.setItem('gochinamed_plan_history', JSON.stringify(updatedHistory));
  };

  const loadFromHistory = (historyItem: any) => {
    setPlan(historyItem.plan);
    setFormData(historyItem.criteria);
    setShowHistory(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(plan);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([plan], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-travel-plan-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const extractSection = (sectionTitle: string) => {
    const lines = plan.split('\n');
    const section: string[] = [];
    let inSection = false;
    let level = 0;

    for (const line of lines) {
      if (line.match(new RegExp(`^#+\\s*${sectionTitle}`, 'i'))) {
        inSection = true;
        const match = line.match(/^(#+)/);
        level = match ? match[1].length : 2;
        section.push(line);
        continue;
      }

      if (inSection) {
        const match = line.match(/^(#+)/);
        if (match && match[1].length <= level) {
          break;
        }
        section.push(line);
      }
    }

    return section.join('\n');
  };

  const handleGenerate = async () => {
    if (!formData.disease && !formData.symptoms) {
      setError("Please provide at least a disease or symptoms");
      return;
    }

    setLoading(true);
    setError("");
    setPlan("");

    try {
      const response = await fetch("/api/ai/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          language,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate plan");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                setPlan((prev) => prev + data.content);
              } else if (data.error) {
                setError(data.error);
              } else if (data.content === "[DONE]") {
                break;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Plan generation error:", error);
      setError(error instanceof Error ? error.message : "Failed to generate plan");
    } finally {
      setLoading(false);
    }
  };

  // Save plan when generation completes
  useEffect(() => {
    if (plan && !loading && !error) {
      saveToHistory(plan, formData);
    }
  }, [plan, loading]);

  const formatPlan = (text: string) => {
    if (!text) return '';

    // Convert markdown-style headings to HTML
    let html = text
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-3 text-gray-900 border-b border-gray-200 pb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4 text-gray-900 border-b border-gray-200 pb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4 text-gray-900 border-b border-gray-200 pb-2">$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/^- (.*$)/gim, '<li class="ml-6 mb-2 text-gray-700 list-disc">$1</li>')
      .replace(/^\* (.*$)/gim, '<li class="ml-6 mb-2 text-gray-700 list-disc">$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-6 mb-2 text-gray-700 list-decimal">$1</li>')
      .replace(/`([^`]+)`/gim, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/---/gim, '<hr class="my-6 border-gray-300">')
      .replace(/\n\n/gim, '</p><p class="mb-4 text-gray-700">')
      .replace(/\n/gim, '<br />');

    // Wrap in paragraph if not starting with tag
    if (!html.trim().startsWith('<')) {
      html = `<p class="mb-4 text-gray-700">${html}</p>`;
    }

    return html;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Medical Travel Planner
          </h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)}>
              <History className="h-4 w-4 mr-2" />
              {showHistory ? 'Hide' : 'History'}
            </Button>
            <div className="w-4"></div>
          </div>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="max-w-6xl mx-auto px-4 mb-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Previous Plans</h3>
            {history.length === 0 ? (
              <p className="text-gray-500 text-sm">No plan history yet</p>
            ) : (
              <div className="space-y-2">
                {history.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => loadFromHistory(item)}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {item.criteria.disease || 'General Consultation'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t.aiPlan?.formTitle || "Your Requirements"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.aiPlan?.disease || "Disease/Condition"}
                  </label>
                  <Input
                    placeholder="e.g., Cancer treatment, Heart surgery"
                    value={formData.disease}
                    onChange={(e) => setFormData({ ...formData, disease: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.aiPlan?.symptoms || "Symptoms"}
                  </label>
                  <Textarea
                    placeholder="Describe your symptoms..."
                    value={formData.symptoms}
                    onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.aiPlan?.location || "Preferred Location"}
                  </label>
                  <Input
                    placeholder="e.g., Beijing, Shanghai"
                    value={formData.preferredLocation}
                    onChange={(e) => setFormData({ ...formData, preferredLocation: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.aiPlan?.budget || "Budget"}
                  </label>
                  <Input
                    placeholder="e.g., $10,000 - $50,000"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.aiPlan?.travelDates || "Travel Dates"}
                  </label>
                  <Input
                    placeholder="e.g., March 2025"
                    value={formData.travelDates}
                    onChange={(e) => setFormData({ ...formData, travelDates: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.aiPlan?.specialRequirements || "Special Requirements"}
                  </label>
                  <Textarea
                    placeholder="Any special needs or preferences..."
                    value={formData.specialRequirements}
                    onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      {t.aiPlan?.generate || "Generate Plan"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Plan Display Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px]">
              {/* Plan Header with Actions */}
              {plan && (
                <div className="border-b border-gray-200 p-4 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Your Medical Travel Plan</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              )}

              <div className="p-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {error}
                  </div>
                )}

                {plan ? (
                  <>
                    {/* Quick Summary Card */}
                    {!isExpanded && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-blue-900 mb-2">
                              {language === 'zh' ? '方案摘要' : 'Plan Summary'}
                            </h3>
                            <div className="text-sm text-gray-700 space-y-2">
                              <div className="flex items-center gap-2">
                                <Stethoscope className="h-4 w-4 text-blue-600" />
                                <span>{language === 'zh' ? '医疗方案已生成' : 'Medical treatment plan generated'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <span>{language === 'zh' ? `包含 ${formData.disease || '您的病情'} 相关信息` : `Includes info about ${formData.disease || 'your condition'}`}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-blue-600" />
                                <span>{formData.preferredLocation || (language === 'zh' ? '中国主要城市' : 'Major cities in China')}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsExpanded(true)}
                            className="ml-4"
                          >
                            {language === 'zh' ? '查看详情' : 'View Details'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Full Plan */}
                    {isExpanded && (
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-6">
                          <TabsTrigger value="all">Full Plan</TabsTrigger>
                          <TabsTrigger value="medical">Medical</TabsTrigger>
                          <TabsTrigger value="travel">Travel</TabsTrigger>
                          <TabsTrigger value="attraction">Attractions</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all" className="prose max-w-none">
                          <div
                            dangerouslySetInnerHTML={{ __html: formatPlan(plan) }}
                          />
                        </TabsContent>

                        <TabsContent value="medical" className="prose max-w-none">
                          <div
                            dangerouslySetInnerHTML={{ __html: formatPlan(extractSection('MEDICAL') || extractSection('Medical') || extractSection('medical') || extractSection('医疗') || extractSection('🏥') || plan) }}
                          />
                        </TabsContent>

                        <TabsContent value="travel" className="prose max-w-none">
                          <div
                            dangerouslySetInnerHTML={{ __html: formatPlan(extractSection('TRAVEL') || extractSection('Travel') || extractSection('travel') || extractSection('出行') || extractSection('✈️') || plan) }}
                          />
                        </TabsContent>

                        <TabsContent value="attraction" className="prose max-w-none">
                          <div
                            dangerouslySetInnerHTML={{ __html: formatPlan(extractSection('SIGHTSEEING') || extractSection('Attraction') || extractSection('attraction') || extractSection('景点') || extractSection('🏞️') || plan) }}
                          />
                        </TabsContent>

                        <div ref={messagesEndRef} />
                      </Tabs>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
                    <Sparkles className="h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-lg text-center">
                      {t.aiPlan?.placeholder || "Fill out the form and click 'Generate Plan' to create your personalized medical travel plan"}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Your plan will include medical treatment options, travel arrangements, and local attractions
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
