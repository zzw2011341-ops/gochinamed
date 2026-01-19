"use client";

import { useState, useEffect } from "react";
import { Plane, Calendar, MapPin, DollarSign, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/locales";

interface Trip {
  id: string;
  orderId: string;
  type: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  price: string | null;
  status: string;
}

export default function MyTripsPage() {
  const { language } = useLanguage();
  const t = translations[language];
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await fetch("/api/itineraries");
      if (response.ok) {
        const data = await response.json();
        setTrips(data.trips || []);
      }
    } catch (error) {
      console.error("Error fetching trips:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      flight: <Plane className="h-4 w-4" />,
      hotel: <MapPin className="h-4 w-4" />,
      attraction: <MapPin className="h-4 w-4" />,
    };
    return icons[type] || <Calendar className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t.myTrips?.title || "My Trips"}
              </h1>
              <p className="text-gray-600">
                {t.myTrips?.subtitle || "Manage your medical tourism itineraries"}
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t.myTrips?.newTrip || "Create New Trip"}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t.common?.loading || "Loading..."}</p>
          </div>
        ) : trips.length === 0 ? (
          <Card className="text-center py-16">
            <Plane className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <CardTitle className="text-xl mb-2">
              {t.myTrips?.noTrips || "No trips yet"}
            </CardTitle>
            <CardDescription className="mb-6">
              {t.myTrips?.noTripsDesc || "Start planning your medical tourism journey"}
            </CardDescription>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t.myTrips?.planFirstTrip || "Plan Your First Trip"}
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <Card key={trip.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1">
                        {trip.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {trip.type}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(trip.status)}>
                      {trip.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trip.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {trip.location}
                    </div>
                  )}
                  {trip.startDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      {new Date(trip.startDate).toLocaleDateString()}
                    </div>
                  )}
                  {trip.price && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      ${trip.price}
                    </div>
                  )}
                  {trip.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {trip.description}
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    {t.common?.viewDetails || "View Details"}
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
