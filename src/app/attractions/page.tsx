"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Star, Clock, DollarSign, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/locales";

interface Attraction {
  id: string;
  nameEn: string;
  nameZh: string | null;
  descriptionEn: string | null;
  descriptionZh: string | null;
  category: string | null;
  location: string;
  city: string;
  rating: string | null;
  ticketPrice: string | null;
  averageDuration: string | null;
  isRecommendedForPatients: boolean;
  imageUrl: string | null;
}

export default function AttractionsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = translations[language];

  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetchAttractions();
  }, []);

  const fetchAttractions = async (keyword?: string, city?: string, category?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.append("keyword", keyword);
      if (city && city !== "all") params.append("city", city);
      if (category && category !== "all") params.append("category", category);
      params.append("limit", "50");

      const response = await fetch(`/api/attractions?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setAttractions(data.attractions || []);
      } else {
        setAttractions([]);
      }
    } catch (error) {
      console.error("Error fetching attractions:", error);
      setAttractions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchAttractions(searchKeyword, selectedCity, selectedCategory);
  };

  const cities = [
    "Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu",
    "Xi'an", "Hangzhou", "Nanjing", "Wuhan", "Suzhou"
  ];

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "Cultural", label: "Cultural" },
    { value: "Historical", label: "Historical" },
    { value: "Natural", label: "Natural" },
    { value: "Entertainment", label: "Entertainment" },
    { value: "Religious", label: "Religious" },
    { value: "Modern", label: "Modern" },
  ];

  const getCategoryColor = (category: string | null) => {
    if (!category) return "bg-gray-100 text-gray-800";
    const colors: Record<string, string> = {
      "Cultural": "bg-purple-100 text-purple-800",
      "Historical": "bg-amber-100 text-amber-800",
      "Natural": "bg-green-100 text-green-800",
      "Entertainment": "bg-pink-100 text-pink-800",
      "Religious": "bg-blue-100 text-blue-800",
      "Modern": "bg-indigo-100 text-indigo-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t.attractions?.title || "Tourist Attractions"}
          </h1>
          <p className="text-gray-600">
            {t.attractions?.subtitle || "Discover China's amazing destinations"}
          </p>
        </div>
      </div>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.attractions?.searchPlaceholder || "Search attractions"}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Attraction name..."
                    className="pl-10"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.attractions?.city || "City"}
                </label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.attractions?.allCities || "All Cities"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.attractions?.allCities || "All Cities"}</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.attractions?.category || "Category"}
                </label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.attractions?.allCategories || "All Categories"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} className="w-full" size="default">
                  <Search className="h-4 w-4 mr-2" />
                  {t.search?.search || "Search"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attractions List */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t.common?.loading || "Loading..."}</p>
          </div>
        ) : attractions.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">{t.attractions?.noAttractionsFound || "No attractions found"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {attractions.map((attraction) => (
              <Card
                key={attraction.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/attractions/${attraction.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-1">
                        {attraction.nameEn}
                      </CardTitle>
                      {attraction.nameZh && (
                        <CardDescription className="mt-1 line-clamp-1">
                          {attraction.nameZh}
                        </CardDescription>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                        <MapPin className="h-3 w-3" />
                        {attraction.city}
                      </div>
                    </div>
                    {attraction.rating && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{attraction.rating}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {attraction.descriptionEn || attraction.descriptionZh}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {attraction.category && (
                      <Badge className={getCategoryColor(attraction.category)}>
                        {attraction.category}
                      </Badge>
                    )}
                    {attraction.isRecommendedForPatients && (
                      <Badge className="bg-green-100 text-green-800">
                        {t.attractions?.recommendedForPatients || "Patient Friendly"}
                      </Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {attraction.ticketPrice && (
                      <>
                        <DollarSign className="h-3 w-3" />
                        <span>${attraction.ticketPrice}</span>
                      </>
                    )}
                  </div>
                  {attraction.averageDuration && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>{attraction.averageDuration}</span>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
