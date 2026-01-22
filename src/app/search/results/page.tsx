"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Building2, Stethoscope, User, Plane, Hotel, MapPin, Star, Clock, ArrowLeft, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/locales";

export default function SearchResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const t = translations[language];

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<"medical" | "flights" | "hotels">("medical");

  useEffect(() => {
    const searchType = searchParams.get("type") as any || "medical";
    setType(searchType);
    fetchResults(searchType);
  }, [searchParams]);

  const fetchResults = async (searchType: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      searchParams.forEach((value, key) => {
        if (key !== "type") params.append(key, value);
      });

      let endpoint: string;
      if (searchType === "medical") {
        endpoint = "/api/search/medical";
        // Add type=all if not specified
        if (!params.has("type")) {
          params.append("type", "all");
        }
      } else if (searchType === "flights") {
        endpoint = "/api/search/flights";
      } else {
        endpoint = "/api/search/hotels";
      }

      const response = await fetch(`${endpoint}?${params.toString()}`);
      if (!response.ok) {
        setResults({});
        return;
      }
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Search error:", error);
      setResults({});
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

  const getTypeLabel = () => {
    switch (type) {
      case "medical":
        return t.nav.doctors || "Doctors";
      case "flights":
        return "Flights";
      case "hotels":
        return "Hotels";
      default:
        return "Search Results";
    }
  };

  const renderHospitalCard = (hospital: any) => (
    <div
      key={hospital.id}
      className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => router.push(`/hospitals/${hospital.id}`)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {hospital.nameEn || hospital.nameZh}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            {hospital.location}
          </div>
        </div>
        {hospital.level && (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
            {hospital.level}
          </span>
        )}
      </div>
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
        {hospital.descriptionEn || hospital.descriptionZh}
      </p>
      {hospital.specialtiesEn && (
        <div className="flex flex-wrap gap-2 mb-4">
          {JSON.parse(JSON.stringify(hospital.specialtiesEn || hospital.specialties || [])).slice(0, 3).map((spec: string, idx: number) => (
            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
              {spec}
            </span>
          ))}
        </div>
      )}
      <div className="flex justify-between items-center">
        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/hospitals/${hospital.id}`); }}>
          View Details
        </Button>
        <Button size="sm">Book Now</Button>
      </div>
    </div>
  );

  const renderDoctorCard = (doctor: any) => (
    <div
      key={doctor.id}
      className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => router.push(`/doctors/${doctor.id}`)}
    >
      <div className="flex items-start gap-4 mb-3">
        {doctor.imageUrl ? (
          <img src={doctor.imageUrl} alt={doctor.nameEn} className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="h-8 w-8 text-gray-400" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {doctor.nameEn || doctor.nameZh}
          </h3>
          <p className="text-sm text-gray-600">{doctor.title}</p>
          {doctor.experienceYears && (
            <p className="text-sm text-gray-500">{doctor.experienceYears} years experience</p>
          )}
        </div>
      </div>
      {doctor.specialtiesEn && (
        <div className="flex flex-wrap gap-2 mb-3">
          {JSON.parse(JSON.stringify(doctor.specialtiesEn || doctor.specialties || [])).slice(0, 3).map((spec: string, idx: number) => (
            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
              {spec}
            </span>
          ))}
        </div>
      )}
      {doctor.consultationFee && (
        <p className="text-sm text-gray-600 mb-3">
          Consultation Fee: ${doctor.consultationFee}
        </p>
      )}
      <div className="flex justify-between items-center">
        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/doctors/${doctor.id}`); }}>
          View Details
        </Button>
        <Button size="sm">Book Now</Button>
      </div>
    </div>
  );

  const renderFlightCard = (flight: any) => (
    <div key={flight.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-sm font-medium text-gray-900">{flight.airline}</p>
          <p className="text-xs text-gray-600">{flight.flightNumber}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">${flight.price}</p>
          <p className="text-xs text-gray-600 capitalize">{flight.classType}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{flight.origin}</p>
          <p className="text-xs text-gray-600">
            {new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex-1 px-4">
          <div className="border-t-2 border-dashed border-gray-300 relative">
            <Plane className="absolute -top-3 left-1/2 transform -translate-x-1/2 h-6 w-6 text-blue-600 rotate-90" />
          </div>
          <p className="text-xs text-center text-gray-500 mt-1">{flight.durationMinutes} min</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{flight.destination}</p>
          <p className="text-xs text-gray-600">
            {new Date(flight.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <p className="text-sm text-gray-600">
          <Clock className="inline h-4 w-4 mr-1" />
          {flight.availableSeats} seats available
        </p>
        <Button size="sm">Book Flight</Button>
      </div>
    </div>
  );

  const renderHotelCard = (hotel: any) => (
    <div key={hotel.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      {hotel.imageUrl && (
        <img src={hotel.imageUrl} alt={hotel.nameEn} className="w-full h-48 object-cover rounded-lg mb-4" />
      )}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {hotel.nameEn || hotel.nameZh}
          </h3>
          <div className="flex items-center gap-1 mt-1">
            {[...Array(hotel.starRating || 0)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">${hotel.basePricePerNight}</p>
          <p className="text-xs text-gray-600">per night</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
        <MapPin className="h-4 w-4" />
        {hotel.location}
      </div>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {hotel.descriptionEn || hotel.descriptionZh}
      </p>
      {hotel.distanceToHospital && (
        <p className="text-sm text-gray-600 mb-4">
          <MapPin className="inline h-4 w-4 mr-1" />
          {hotel.distanceToHospital} km to hospital
        </p>
      )}
      <Button className="w-full">Book Hotel</Button>
    </div>
  );

  const renderResults = () => {
    if (!results) return null;

    if (type === "medical") {
      const hospitals = results.hospitals?.hospitals || results.hospitals || [];
      const doctors = results.doctors?.doctors || results.doctors || [];
      const diseases = results.diseases?.diseases || results.diseases || [];

      return (
        <div className="space-y-6">
          {hospitals.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Hospitals ({results.hospitals?.total || hospitals.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hospitals.map(renderHospitalCard)}
              </div>
            </div>
          )}
          {doctors.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Doctors ({results.doctors?.total || doctors.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctors.map(renderDoctorCard)}
              </div>
            </div>
          )}
          {diseases.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Diseases ({results.diseases?.total || diseases.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {diseases.map((disease: any) => (
                  <div key={disease.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">{disease.nameEn}</h3>
                    {disease.descriptionEn && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{disease.descriptionEn}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {hospitals.length === 0 && doctors.length === 0 && diseases.length === 0 && (
            <div className="text-center py-12 text-gray-600">
              No results found. Try different search criteria.
            </div>
          )}
        </div>
      );
    } else if (type === "flights") {
      const flights = results.flights || [];
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flights.length > 0 ? (
            flights.map(renderFlightCard)
          ) : (
            <div className="col-span-2 text-center py-8 text-gray-600">
              No flights found. Try different search criteria.
            </div>
          )}
        </div>
      );
    } else if (type === "hotels") {
      const hotels = results.hotels || [];
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hotels.length > 0 ? (
            hotels.map(renderHotelCard)
          ) : (
            <div className="col-span-2 text-center py-8 text-gray-600">
              No hotels found. Try different search criteria.
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.common.back || "Back to Home"}
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">{getTypeLabel()}</h1>
          <Button variant="ghost">
            <Filter className="h-4 w-4 mr-2" />
            {t.common.filter || "Filters"}
          </Button>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {renderResults()}
      </div>
    </div>
  );
}
