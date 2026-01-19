"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Stethoscope, Building2, Plane, Hotel, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/locales";

export default function SearchPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = translations[language];

  const [searchType, setSearchType] = useState<"medical" | "flights" | "hotels">("medical");
  const [searchData, setSearchData] = useState({
    keyword: "",
    location: "",
    specialty: "",
    hospitalLevel: "",
    origin: "",
    destination: "",
    departureDate: "",
    returnDate: "",
    classType: "",
    city: "",
    starRating: "",
    minPrice: "",
    maxPrice: "",
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    Object.entries(searchData).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    router.push(`/search/results?${params.toString()}&type=${searchType}`);
  };

  const handleGeneratePlan = () => {
    router.push("/ai-plan");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">
            {t.search?.title || "Find Your Medical Journey"}
          </h1>
          <p className="text-lg opacity-90 mb-8">
            {t.search?.subtitle || "Search hospitals, doctors, flights, and hotels for your medical tourism in China"}
          </p>
        </div>
      </div>

      {/* Search Form */}
      <div className="max-w-4xl mx-auto px-4 -mt-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <Tabs value={searchType} onValueChange={(v) => setSearchType(v as any)}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="medical" className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Medical
              </TabsTrigger>
              <TabsTrigger value="flights" className="flex items-center gap-2">
                <Plane className="h-4 w-4" />
                Flights
              </TabsTrigger>
              <TabsTrigger value="hotels" className="flex items-center gap-2">
                <Hotel className="h-4 w-4" />
                Hotels
              </TabsTrigger>
            </TabsList>

            {/* Medical Search */}
            <TabsContent value="medical">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.search?.keyword || "Keyword"}
                    </label>
                    <Input
                      placeholder={t.search?.keywordPlaceholder || "Disease, symptom, or condition"}
                      value={searchData.keyword}
                      onChange={(e) => setSearchData({ ...searchData, keyword: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.search?.location || "Location"}
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder={t.search?.locationPlaceholder || "Beijing, Shanghai..."}
                        className="pl-10"
                        value={searchData.location}
                        onChange={(e) => setSearchData({ ...searchData, location: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.search?.specialty || "Specialty"}
                    </label>
                    <Select value={searchData.specialty} onValueChange={(v) => setSearchData({ ...searchData, specialty: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder={t.search?.selectSpecialty || "Select specialty"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cardiology">Cardiology</SelectItem>
                        <SelectItem value="oncology">Oncology</SelectItem>
                        <SelectItem value="neurology">Neurology</SelectItem>
                        <SelectItem value="orthopedics">Orthopedics</SelectItem>
                        <SelectItem value="dentistry">Dentistry</SelectItem>
                        <SelectItem value="dermatology">Dermatology</SelectItem>
                        <SelectItem value="gynecology">Gynecology</SelectItem>
                        <SelectItem value="pediatrics">Pediatrics</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.search?.hospitalLevel || "Hospital Level"}
                    </label>
                    <Select value={searchData.hospitalLevel} onValueChange={(v) => setSearchData({ ...searchData, hospitalLevel: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder={t.search?.selectLevel || "Select level"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Grade 3A">Grade 3A (Top)</SelectItem>
                        <SelectItem value="Grade 3B">Grade 3B</SelectItem>
                        <SelectItem value="Grade 2">Grade 2</SelectItem>
                        <SelectItem value="Grade 1">Grade 1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleSearch} className="w-full" size="lg">
                  <Search className="h-4 w-4 mr-2" />
                  {t.search?.search || "Search"}
                </Button>
              </div>
            </TabsContent>

            {/* Flights Search */}
            <TabsContent value="flights">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.search?.origin || "Origin"}
                    </label>
                    <Input
                      placeholder="Airport code (e.g., JFK)"
                      value={searchData.origin}
                      onChange={(e) => setSearchData({ ...searchData, origin: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.search?.destination || "Destination"}
                    </label>
                    <Input
                      placeholder="Airport code (e.g., PEK)"
                      value={searchData.destination}
                      onChange={(e) => setSearchData({ ...searchData, destination: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.search?.departureDate || "Departure Date"}
                    </label>
                    <Input
                      type="date"
                      value={searchData.departureDate}
                      onChange={(e) => setSearchData({ ...searchData, departureDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.search?.classType || "Class Type"}
                    </label>
                    <Select value={searchData.classType} onValueChange={(v) => setSearchData({ ...searchData, classType: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder={t.search?.selectClass || "Select class"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="economy">Economy</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="first">First Class</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleSearch} className="w-full" size="lg">
                  <Search className="h-4 w-4 mr-2" />
                  {t.search?.search || "Search Flights"}
                </Button>
              </div>
            </TabsContent>

            {/* Hotels Search */}
            <TabsContent value="hotels">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.search?.city || "City"}
                    </label>
                    <Input
                      placeholder={t.search?.cityPlaceholder || "Beijing, Shanghai..."}
                      value={searchData.city}
                      onChange={(e) => setSearchData({ ...searchData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.search?.starRating || "Star Rating"}
                    </label>
                    <Select value={searchData.starRating} onValueChange={(v) => setSearchData({ ...searchData, starRating: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder={t.search?.selectRating || "Select rating"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 Stars</SelectItem>
                        <SelectItem value="4">4 Stars</SelectItem>
                        <SelectItem value="3">3 Stars</SelectItem>
                        <SelectItem value="2">2 Stars</SelectItem>
                        <SelectItem value="1">1 Star</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.search?.minPrice || "Min Price ($)"}
                    </label>
                    <Input
                      type="number"
                      placeholder="50"
                      value={searchData.minPrice}
                      onChange={(e) => setSearchData({ ...searchData, minPrice: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.search?.maxPrice || "Max Price ($)"}
                    </label>
                    <Input
                      type="number"
                      placeholder="500"
                      value={searchData.maxPrice}
                      onChange={(e) => setSearchData({ ...searchData, maxPrice: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleSearch} className="w-full" size="lg">
                  <Search className="h-4 w-4 mr-2" />
                  {t.search?.search || "Search Hotels"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* AI Plan Generation */}
        <div className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8" />
              <div>
                <h3 className="text-xl font-bold">
                  {t.search?.aiPlan || "AI-Powered Medical Plan"}
                </h3>
                <p className="text-sm opacity-90">
                  {t.search?.aiPlanDesc || "Let AI create a personalized medical travel plan for you"}
                </p>
              </div>
            </div>
            <Button onClick={handleGeneratePlan} variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
              <Sparkles className="h-4 w-4 mr-2" />
              {t.search?.generatePlan || "Generate Plan"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
