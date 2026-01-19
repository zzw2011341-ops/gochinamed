"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Star, Clock, DollarSign, Phone, Globe, Info, Accessibility } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/locales";

export default function AttractionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const t = translations[language];
  const attractionId = params.id as string;

  const [attraction, setAttraction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAttractionDetail();
  }, [attractionId]);

  const fetchAttractionDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/attractions/${attractionId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch attraction details");
      }
      const data = await response.json();
      setAttraction(data);
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

  if (error || !attraction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || "Attraction not found"}</p>
          <Button onClick={() => router.back()}>Back</Button>
        </div>
      </div>
    );
  }

  const accessibilityFeatures = attraction.accessibilityFeatures || [];
  const category = attraction.category || "General";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
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
                <MapPin className="h-16 w-16" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-2">
                <h1 className="text-3xl font-bold">
                  {attraction.nameEn}
                </h1>
                {attraction.nameZh && (
                  <span className="text-2xl font-normal opacity-90">
                    ({attraction.nameZh})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-lg opacity-90 mb-3">
                <div className="flex items-center gap-1">
                  <MapPin className="h-5 w-5" />
                  {attraction.city}, {attraction.location}
                </div>
                {attraction.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span>{attraction.rating}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-white/20 text-white border-white/30">
                  {category}
                </Badge>
                {attraction.isRecommendedForPatients && (
                  <Badge className="bg-green-500 text-white">
                    {t.attractions?.recommendedForPatients || "Recommended for Patients"}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 justify-center">
              {attraction.ticketPrice && (
                <div className="bg-white/20 rounded-lg px-4 py-2 text-center">
                  <p className="text-2xl font-bold">${attraction.ticketPrice}</p>
                  <p className="text-sm opacity-90">{t.attractions?.ticketPrice || "Ticket Price"}</p>
                </div>
              )}
              <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
                {t.attractions?.addToItinerary || "Add to Itinerary"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="overview">{t.common?.overview || "Overview"}</TabsTrigger>
            <TabsTrigger value="info">{t.attractions?.visitorInfo || "Visitor Info"}</TabsTrigger>
            <TabsTrigger value="accessibility">{t.attractions?.accessibility || "Accessibility"}</TabsTrigger>
            <TabsTrigger value="tips">{t.attractions?.tips || "Tips"}</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  {t.common?.about || "About"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {attraction.descriptionEn || attraction.descriptionZh}
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">{t.attractions?.duration || "Duration"}</p>
                  <p className="font-semibold text-blue-900">{attraction.averageDuration || "-"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">{t.attractions?.ticketPrice || "Ticket Price"}</p>
                  <p className="font-semibold text-green-900">
                    {attraction.ticketPrice ? `$${attraction.ticketPrice}` : "Free"}
                  </p>
                </div>
              </div>

              {attraction.rating && (
                <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
                  <Star className="h-6 w-6 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-600">{t.attractions?.rating || "Rating"}</p>
                    <p className="font-semibold text-yellow-900">{attraction.rating}/5.0</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Visitor Info */}
          <TabsContent value="info" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.attractions?.visitorInfo || "Visitor Information"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{t.attractions?.location || "Location"}</h3>
                  <p className="text-gray-700">{attraction.location}, {attraction.city}</p>
                </div>

                {attraction.openingHours && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{t.attractions?.openingHours || "Opening Hours"}</h3>
                    <p className="text-gray-700">{attraction.openingHours}</p>
                  </div>
                )}

                {attraction.website && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{t.attractions?.website || "Website"}</h3>
                    <a
                      href={attraction.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-2"
                    >
                      <Globe className="h-4 w-4" />
                      {attraction.website}
                    </a>
                  </div>
                )}

                {attraction.distanceToHospital && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{t.attractions?.distanceToHospital || "Distance to Hospital"}</h3>
                    <p className="text-gray-700">{attraction.distanceToHospital} km</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accessibility */}
          <TabsContent value="accessibility" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Accessibility className="h-5 w-5" />
                  {t.attractions?.accessibility || "Accessibility Features"}
                </CardTitle>
                <CardDescription>
                  {t.attractions?.accessibilityDesc || "Features available for visitors with disabilities"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {accessibilityFeatures.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {accessibilityFeatures.map((feature: string, index: number) => (
                      <Badge key={index} variant="outline" className="px-3 py-2">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">{t.attractions?.noAccessibilityInfo || "No accessibility information available"}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tips */}
          <TabsContent value="tips" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.attractions?.tips || "Tips for Visitors"}</CardTitle>
              </CardHeader>
              <CardContent>
                {attraction.tipsEn ? (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {attraction.tipsEn}
                  </p>
                ) : attraction.tipsZh ? (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {attraction.tipsZh}
                  </p>
                ) : (
                  <p className="text-gray-500">{t.attractions?.noTips || "No tips available"}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
