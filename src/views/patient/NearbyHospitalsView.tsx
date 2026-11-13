import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Phone,
  Navigation,
  ShieldCheck,
  Building2,
  Stethoscope,
  Compass,
  ArrowRight,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  LocateFixed,
  Car,
  Info,
  X,
  RefreshCw,
  Crosshair,
  Sparkles,
} from 'lucide-react';
import type { NearbyHealthcareFacility } from '../../types/index.js';

interface NearbyHospitalsViewProps {
  onBookAtHospital: (facility: any) => void;
}

export const NearbyHospitalsView: React.FC<NearbyHospitalsViewProps> = ({ onBookAtHospital }) => {
  // User GPS & Location State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Healthcare facilities list
  const [facilities, setFacilities] = useState<NearbyHealthcareFacility[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedFacilityForMap, setSelectedFacilityForMap] = useState<NearbyHealthcareFacility | null>(null);
  const [transitModalFacility, setTransitModalFacility] = useState<NearbyHealthcareFacility | null>(null);

  // Fetch facilities around given coordinates (no manual distance or city input required)
  const searchNearbyFacilities = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      // 50 km default radius covers the entire surrounding zone without restricting to specific city boundaries
      const res = await fetch(`/api/hospitals/nearby?lat=${lat}&lng=${lng}&radius=50&type=all`);
      if (res.ok) {
        const data = await res.json();
        setFacilities(data.facilities || []);
        if (data.userLocation?.areaName) {
          setLocationName(data.userLocation.areaName);
        }
        if (data.facilities?.length > 0) {
          setSelectedFacilityForMap(data.facilities[0]);
        }
        setHasSearched(true);
      }
    } catch (err) {
      console.warn('Failed to fetch nearby facilities:', err);
    } finally {
      setLoading(false);
    }
  };

  // Main Action: Triggered automatically or when clicking the blue "Nearby Hospitals" button
  const handleNearbyHospitalsClick = () => {
    setIsDetecting(true);
    setPermissionError(null);

    if (!navigator.geolocation) {
      setPermissionError('Geolocation is not supported by your browser.');
      setIsDetecting(false);
      // Fallback coordinates
      const fallback = { lat: 12.9716, lng: 77.5946 };
      setUserLocation(fallback);
      searchNearbyFacilities(fallback.lat, fallback.lng);
      return;
    }

    // 1. Request location permission and automatically detect user's current GPS location
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const detectedCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(detectedCoords);
        setIsDetecting(false);

        // 2 & 3. Automatically search for nearby hospitals and clinics around the user's location
        searchNearbyFacilities(detectedCoords.lat, detectedCoords.lng);
      },
      (err) => {
        setIsDetecting(false);
        let msg = 'Could not retrieve your GPS location.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission was not granted. Please enable location access in your browser settings to automatically detect nearby hospitals.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'GPS detection timed out. Using default location to find nearby hospitals.';
        }
        setPermissionError(msg);

        // Fallback search so the user always sees nearby facilities immediately
        const fallback = { lat: 12.9716, lng: 77.5946 };
        setUserLocation(fallback);
        searchNearbyFacilities(fallback.lat, fallback.lng);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Automatically detect location and search when view opens
  useEffect(() => {
    handleNearbyHospitalsClick();
  }, []);

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto selection:bg-[#0284c7] selection:text-white">
      {/* 1. HERO SECTION WITH PROMINENT BLUE "NEARBY HOSPITALS" BUTTON */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-100/50 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-[#0284c7] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Automatic GPS Healthcare Finder</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Find Hospitals & Clinics Near You
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Click the button below to automatically detect your current GPS location and display all available hospitals, clinics, and medical centres near you, sorted nearest first.
            </p>
          </div>

          {/* THE PROMINENT BLUE BUTTON: "Nearby Hospitals" */}
          <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
            <button
              onClick={handleNearbyHospitalsClick}
              disabled={isDetecting || loading}
              className="px-6 sm:px-8 py-4 rounded-2xl bg-[#0284c7] hover:bg-sky-700 active:bg-sky-800 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-sky-600/30 flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 disabled:opacity-80 ring-4 ring-sky-500/20"
              title="Automatically detect your location and find nearby hospitals"
            >
              {isDetecting || loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <LocateFixed className="w-5 h-5" />
              )}
              <span>Nearby Hospitals</span>
            </button>

            {locationName ? (
              <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Detected: {locationName}</span>
              </p>
            ) : isDetecting ? (
              <p className="text-[11px] font-bold text-[#0284c7] animate-pulse">
                Requesting GPS permission & locating...
              </p>
            ) : null}
          </div>
        </div>

        {/* Permission Notice / Status */}
        {permissionError && (
          <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{permissionError}</span>
            </div>
            <button
              onClick={() => setPermissionError(null)}
              className="text-amber-700 hover:text-amber-950 font-bold px-1.5"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* 2. MAIN RESULTS SECTION (Sorted Nearest First) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: List of Nearest Hospitals and Clinics */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">
                Healthcare Facilities Near You:
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-sky-100 text-[#0284c7]">
                {facilities.length} found
              </span>
            </div>
            <span className="text-xs font-extrabold text-emerald-600 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Nearest first</span>
            </span>
          </div>

          {loading || isDetecting ? (
            <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <Compass className="w-12 h-12 text-[#0284c7] animate-spin mx-auto" />
              <p className="text-base font-black text-slate-800">
                Detecting your location & searching nearby healthcare...
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Discovering nearest hospitals, outpatient clinics, and medical centres around you...
              </p>
            </div>
          ) : facilities.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 text-[#0284c7] flex items-center justify-center mx-auto">
                <Building2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-lg text-slate-900">
                  Ready to search nearby facilities
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click the blue &quot;Nearby Hospitals&quot; button above to automatically find hospitals and clinics around your location.
                </p>
              </div>
              <button
                onClick={handleNearbyHospitalsClick}
                className="px-6 py-3 bg-[#0284c7] hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20"
              >
                Nearby Hospitals
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {facilities.map((facility, index) => {
                const isSelected = selectedFacilityForMap?.id === facility.id;

                return (
                  <div
                    key={facility.id}
                    onClick={() => setSelectedFacilityForMap(facility)}
                    className={`bg-white rounded-3xl p-5 sm:p-6 border-2 transition-all cursor-pointer shadow-sm hover:shadow-md relative ${
                      isSelected
                        ? 'border-[#0284c7] ring-4 ring-sky-500/10 bg-sky-50/10'
                        : 'border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    {/* Top Row: Rank Number, Exact Distance Badge, Category, and Emergency Status */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Numerical Rank Badge */}
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>

                        {/* Distance from Current Location (e.g. 500 metres, 2 km, 5 km) */}
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 flex items-center gap-1.5 shadow-2xs">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{facility.distanceFormatted} away</span>
                        </span>

                        {/* Facility Type Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                            facility.type === 'Hospital'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {facility.type}
                        </span>
                      </div>

                      {facility.hasEmergencyUnit && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-700 flex items-center gap-1 uppercase tracking-wide shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                          24/7 Emergency
                        </span>
                      )}
                    </div>

                    {/* Facility Name & Exact Location Address */}
                    <div className="flex items-start gap-4">
                      {facility.logo && (
                        <img
                          src={facility.logo}
                          alt={facility.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-xs"
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        {/* Hospital or Clinic Name */}
                        <h3 className="font-black text-base sm:text-lg text-slate-900 hover:text-[#0284c7] transition-colors truncate">
                          {facility.name}
                        </h3>

                        {/* Exact Location & Address */}
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                          {facility.address}
                        </p>

                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 font-medium">
                          <span className="flex items-center gap-1 text-amber-600 font-bold">
                            ★ {facility.rating}
                          </span>
                          <span>•</span>
                          <span>Location: {facility.latitude.toFixed(4)}, {facility.longitude.toFixed(4)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Departments Tag Cloud */}
                    {facility.availableDepartments && facility.availableDepartments.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {facility.availableDepartments.map((dept) => (
                          <span
                            key={dept}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold"
                          >
                            {dept}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons: Google Maps Directions, Call Contact Details, and OPD Booking */}
                    <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* 5. Directions and navigation using Google Maps */}
                        <a
                          href={facility.googleMapsDirectionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0284c7] border border-sky-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all"
                          title="Open turn-by-turn navigation in Google Maps"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Get Directions</span>
                        </a>

                        {/* Transit Details Info */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTransitModalFacility(facility);
                          }}
                          className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 transition-all"
                        >
                          <Info className="w-3.5 h-3.5 text-slate-500" />
                          <span>Transit Info</span>
                        </button>

                        {/* Contact Details (if available) */}
                        {facility.contactNumber && (
                          <a
                            href={`tel:${facility.contactNumber.replace(/[^\d+]/g, '')}`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-all"
                            title="Direct call contact"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Call: {facility.contactNumber}</span>
                          </a>
                        )}
                      </div>

                      {/* Book OPD Consultation */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onBookAtHospital(facility);
                        }}
                        className="px-4 py-2 rounded-xl bg-[#0284c7] hover:bg-sky-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all ml-auto sm:ml-0"
                      >
                        <span>Book OPD</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Visual Radar Map & Selected Facility Preview */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-[#0284c7] flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Live Distance Radar
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    GPS Centered Healthcare Radar
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {facilities.length} in range
              </span>
            </div>

            {/* Visual Radar Canvas with Distance Rings */}
            <div className="w-full h-88 rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 relative overflow-hidden p-4 flex flex-col justify-between border border-slate-800 shadow-inner">
              {/* Radar Rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-24 h-24 rounded-full border border-sky-400/20" />
                <div className="w-48 h-48 rounded-full border border-sky-400/15" />
                <div className="w-72 h-72 rounded-full border border-sky-400/10" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-sky-400/15" />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-sky-400/15" />
              </div>

              {/* Facility Markers */}
              <div className="relative z-10 w-full h-full">
                {/* Center: User Coordinates */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
                  <div className="w-5 h-5 rounded-full bg-sky-400/40 border-2 border-white animate-ping" />
                  <div className="w-4 h-4 rounded-full bg-[#0284c7] border-2 border-white -mt-4.5 shadow-lg" />
                  <span className="text-[9px] font-black text-white bg-slate-900/95 px-1.5 py-0.5 rounded shadow-md mt-1 border border-slate-700 whitespace-nowrap">
                    📍 You
                  </span>
                </div>

                {/* Plot Dynamic Markers */}
                {facilities.slice(0, 12).map((f, i) => {
                  const maxDist = facilities[facilities.length - 1]?.distanceKm || 20;
                  const ratio = Math.min(1, Math.max(0.12, f.distanceKm / (maxDist || 1)));
                  const visualDist = ratio * 135; // px from center
                  const angle = (i * (360 / Math.max(facilities.length, 6)) + 30) * (Math.PI / 180);
                  const offsetX = Math.cos(angle) * visualDist;
                  const offsetY = Math.sin(angle) * visualDist;
                  const isSelected = selectedFacilityForMap?.id === f.id;

                  return (
                    <div
                      key={f.id}
                      onClick={() => setSelectedFacilityForMap(f)}
                      style={{
                        transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
                        top: '50%',
                        left: '50%',
                      }}
                      className="absolute cursor-pointer group z-10 transition-transform duration-300"
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg border-2 border-white group-hover:scale-125 transition-transform ${
                          isSelected
                            ? 'bg-amber-500 scale-125 ring-2 ring-white'
                            : f.hasEmergencyUnit
                            ? 'bg-red-600'
                            : f.type === 'Hospital'
                            ? 'bg-[#0284c7]'
                            : 'bg-purple-600'
                        }`}
                      >
                        {f.type === 'Hospital' ? 'H' : 'C'}
                      </div>
                      <span className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 -top-6 text-[9px] font-bold text-white bg-slate-950 px-2 py-0.5 rounded whitespace-nowrap z-30 shadow-md border border-slate-700">
                        {f.name.split(',')[0]} ({f.distanceFormatted})
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Selected Facility Card in Radar */}
              {selectedFacilityForMap && (
                <div className="relative z-20 bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700 text-white space-y-2 shadow-xl">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-black text-xs text-sky-300 truncate">
                        {selectedFacilityForMap.name}
                      </p>
                      <p className="text-[10px] text-slate-300 line-clamp-1">
                        {selectedFacilityForMap.address}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                      {selectedFacilityForMap.distanceFormatted}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                    <a
                      href={selectedFacilityForMap.googleMapsDirectionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Google Maps Route ↗</span>
                    </a>

                    <button
                      onClick={() => onBookAtHospital(selectedFacilityForMap)}
                      className="text-white hover:text-sky-200 font-bold flex items-center gap-1"
                    >
                      <span>Book OPD</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Genuine Geolocation Details */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Automatic Location-Based Results</span>
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Facilities are retrieved dynamically around your live device coordinates without requiring manual city or distance entry. Turn-by-turn navigation opens directly in Google Maps.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MODAL: DETAILED TRANSIT & DIRECTIONS SHEET */}
      {transitModalFacility && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-[#0284c7]">
                  Transit & Directions Info
                </span>
                <h3 className="font-black text-lg text-slate-900 mt-1">
                  {transitModalFacility.name}
                </h3>
              </div>
              <button
                onClick={() => setTransitModalFacility(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Distance from You:</span>
                <span className="font-extrabold text-slate-900">
                  {transitModalFacility.distanceFormatted}
                </span>
              </div>
              {transitModalFacility.contactNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Contact Details:</span>
                  <span className="font-extrabold text-emerald-700">{transitModalFacility.contactNumber}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Emergency Helpline:</span>
                <span className="font-extrabold text-red-600">{transitModalFacility.emergencyHelpline}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Facility Coordinates:</span>
                <span className="font-mono text-slate-700 text-[11px]">
                  {transitModalFacility.latitude.toFixed(4)}, {transitModalFacility.longitude.toFixed(4)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Category:</span>
                <span className="font-extrabold text-slate-900">{transitModalFacility.type}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">Exact Location & Address:</p>
              <p className="text-xs text-slate-600 bg-slate-100 p-3 rounded-xl border border-slate-200 leading-relaxed">
                {transitModalFacility.address}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setTransitModalFacility(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Close
              </button>

              <a
                href={transitModalFacility.googleMapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-[#0284c7] hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/30 flex items-center gap-1.5"
              >
                <Navigation className="w-4 h-4" />
                <span>Open in Google Maps Navigation</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
