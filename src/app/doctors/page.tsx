"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Stethoscope, User, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/locales";

interface Doctor {
  id: string;
  nameEn: string;
  nameZh: string | null;
  title: string | null;
  specialtiesEn: string;
  specialtiesZh: string | null;
  descriptionEn: string | null;
  descriptionZh: string | null;
  experienceYears: number | null;
  imageUrl: string | null;
  consultationFee: string | null;
  hospitalName?: string;
  hospitalLocation?: string;
}

export default function DoctorsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = translations[language];

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("");

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async (keyword?: string, specialty?: string, location?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("type", "doctor");
      if (keyword) params.append("keyword", keyword);
      if (specialty && specialty !== "all") params.append("specialty", specialty);
      if (location) params.append("location", location);
      params.append("limit", "50");

      const response = await fetch(`/api/search/medical?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setDoctors(data.doctors?.doctors || data.doctors || []);
      } else {
        setDoctors([]);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchDoctors(searchKeyword, selectedSpecialty, selectedLocation);
  };

  const specialties = [
    "cardiology", "oncology", "neurology", "orthopedics", "dentistry",
    "dermatology", "gynecology", "pediatrics", "cardiac surgery", "neurology surgery"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t.doctors?.title || "Find a Doctor"}
          </h1>
          <p className="text-gray-600">
            {t.doctors?.subtitle || "Discover top-rated doctors specializing in your condition"}
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
                  {t.doctors?.searchPlaceholder || "Search by name or specialty"}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Doctor name or specialty..."
                    className="pl-10"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.doctors?.specialties || "Specialty"}
                </label>
                <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.doctors?.allSpecialties || "All Specialties"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.doctors?.allSpecialties || "All Specialties"}</SelectItem>
                    {specialties.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.search?.location || "Location"}
                </label>
                <Input
                  placeholder="City or hospital..."
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
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

      {/* Doctors List */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t.common?.loading || "Loading..."}</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-12">
            <Stethoscope className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">{t.doctors?.noDoctorsFound || "No doctors found"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
              <Card
                key={doctor.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/doctors/${doctor.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                      {doctor.nameEn.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-1">
                        {doctor.nameEn} {doctor.nameZh && `(${doctor.nameZh})`}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {doctor.title || "Physician"}
                      </CardDescription>
                      {doctor.hospitalName && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">{doctor.hospitalName}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Stethoscope className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{t.doctors?.specialties || "Specialties"}:</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(JSON.parse(doctor.specialtiesEn || "[]") as string[])
                          .slice(0, 3)
                          .map((spec, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                      </div>
                    </div>

                    {doctor.experienceYears && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Clock className="h-4 w-4 text-green-600" />
                        <span>
                          {doctor.experienceYears} {language === "zh" ? "年经验" : "years experience"}
                        </span>
                      </div>
                    )}

                    {doctor.hospitalLocation && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <MapPin className="h-4 w-4 text-red-600" />
                        <span className="line-clamp-1">{doctor.hospitalLocation}</span>
                      </div>
                    )}

                    {doctor.descriptionEn && (
                      <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                        {doctor.descriptionEn}
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  {doctor.consultationFee && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-gray-900">
                        ${doctor.consultationFee}
                      </span>
                      <span className="text-sm text-gray-600">
                        {t.doctors?.consultationFee || "Consultation Fee"}
                      </span>
                    </div>
                  )}
                  <Button variant="outline" size="sm">
                    {t.doctors?.viewProfile || "View Profile"}
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
