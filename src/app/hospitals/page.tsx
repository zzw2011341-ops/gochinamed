"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Building2, Star, Award, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/locales";
import { MEDICAL_CITIES } from "@/data/cities";

interface Hospital {
  id: string;
  nameEn: string;
  nameZh: string | null;
  descriptionEn: string | null;
  descriptionZh: string | null;
  level: string | null;
  location: string;
  specialties: any;
  imageUrl: string | null;
  isFeatured: boolean;
  doctorCount?: number;
}

export default function HospitalsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = translations[language];

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async (keyword?: string, level?: string, location?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("type", "hospital");
      if (keyword) params.append("keyword", keyword);
      if (level && level !== "all") params.append("level", level);
      if (location && location !== "all") params.append("location", location);
      params.append("limit", "50");

      const response = await fetch(`/api/search/medical?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setHospitals(data.hospitals?.hospitals || data.hospitals || []);
      } else {
        setHospitals([]);
      }
    } catch (error) {
      console.error("Error fetching hospitals:", error);
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchHospitals(searchKeyword, selectedLevel, selectedLocation);
  };

  const hospitalLevels = [
    { value: "Grade 3A", label: "Grade 3A (Top Level)" },
    { value: "Grade 3B", label: "Grade 3B" },
    { value: "Grade 2", label: "Grade 2" },
    { value: "Grade 1", label: "Grade 1" },
  ];

  const getLevelColor = (level: string | null) => {
    if (level?.includes("3A")) return "bg-red-100 text-red-800";
    if (level?.includes("3B")) return "bg-orange-100 text-orange-800";
    if (level?.includes("Grade 2")) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  const getLevelIcon = (level: string | null) => {
    if (level?.includes("3A")) return <Award className="h-3 w-3" />;
    if (level?.includes("3B")) return <Star className="h-3 w-3" />;
    return <ShieldCheck className="h-3 w-3" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.common?.back || "Back to Home"}
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t.hospitals?.title || "Hospitals"}
          </h1>
          <p className="text-gray-600">
            {t.hospitals?.subtitle || "Find the best hospitals for your medical needs"}
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
                  {t.hospitals?.searchPlaceholder || "Search hospitals"}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Hospital name..."
                    className="pl-10"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.hospitals?.level || "Hospital Level"}
                </label>
                <Select value={selectedLevel} onValueChange={(value) => {
                  setSelectedLevel(value);
                  fetchHospitals(searchKeyword, value, selectedLocation);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.hospitals?.allLevels || "All Levels"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.hospitals?.allLevels || "All Levels"}</SelectItem>
                    {hospitalLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.search?.location || "Location"}
                </label>
                <Select value={selectedLocation} onValueChange={(value) => {
                  setSelectedLocation(value);
                  fetchHospitals(searchKeyword, selectedLevel, value);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.search?.cityPlaceholder || "Select City"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.search?.all || "All Cities"}</SelectItem>
                    {MEDICAL_CITIES.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {language === 'zh' ? city.nameZh : city.nameEn}
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

      {/* Hospitals List */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t.common?.loading || "Loading..."}</p>
          </div>
        ) : hospitals.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">{t.hospitals?.noHospitalsFound || "No hospitals found"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hospitals.map((hospital) => (
              <Card
                key={hospital.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/hospitals/${hospital.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-1">
                        {hospital.nameEn}
                      </CardTitle>
                      {hospital.nameZh && (
                        <CardDescription className="mt-1 line-clamp-1">
                          {hospital.nameZh}
                        </CardDescription>
                      )}
                    </div>
                    {hospital.level && (
                      <Badge className={`${getLevelColor(hospital.level)} flex items-center gap-1 flex-shrink-0`}>
                        {getLevelIcon(hospital.level)}
                        {hospital.level}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                    <MapPin className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <span className="line-clamp-1">{hospital.location}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {hospital.specialties && Array.isArray(hospital.specialties) && hospital.specialties.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Building2 className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{t.doctors?.specialties || "Specialties"}:</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(hospital.specialties as string[])
                            .slice(0, 4)
                            .map((spec, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )}

                    {hospital.descriptionEn && (
                      <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                        {hospital.descriptionEn}
                      </p>
                    )}

                    {hospital.isFeatured && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Star className="h-4 w-4 fill-current" />
                        <span>Featured Hospital</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  {hospital.doctorCount !== undefined && (
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">{hospital.doctorCount}</span>
                      <span className="ml-1">
                        {language === "zh" ? "位医生" : " doctors"}
                      </span>
                    </div>
                  )}
                  <Button variant="outline" size="sm">
                    {t.hospitals?.viewDetails || "View Details"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
