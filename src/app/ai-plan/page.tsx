"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [plan]);

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

  const formatPlan = (text: string) => {
    // Convert markdown-style headings to HTML
    let html = text
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-3 text-gray-900">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4 text-gray-900">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4 text-gray-900">$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/\* (.*$)/gim, '<li class="ml-4 mb-2 text-gray-700">$1</li>')
      .replace(/- (.*$)/gim, '<li class="ml-4 mb-2 text-gray-700">$1</li>')
      .replace(/\n\n/gim, '</p><p class="mb-4 text-gray-700">')
      .replace(/\n/gim, '<br />');

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
          <div className="w-20"></div>
        </div>
      </div>

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
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 min-h-[600px]">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {plan ? (
                <div className="prose max-w-none">
                  <div
                    dangerouslySetInnerHTML={{ __html: formatPlan(plan) }}
                  />
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
                  <Sparkles className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-lg">
                    {t.aiPlan?.placeholder || "Fill out the form and click 'Generate Plan' to create your personalized medical travel plan"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
