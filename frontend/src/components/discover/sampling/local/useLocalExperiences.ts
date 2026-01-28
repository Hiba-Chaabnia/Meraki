"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useGoogleMaps, reverseGeocode } from "@/lib/useGoogleMaps";
import {
  triggerLocalExperiences,
  pollLocalExperiencesStatus,
  getLocalExperienceResult,
  saveLocalExperienceResult,
  type LocalSpot,
  type LocalExperiencesResult,
} from "@/app/actions/sampling";

// Module-level cache — survives unmount/remount during client-side navigation
const localCache = new Map<
  string,
  { spots: LocalSpot[]; tips: LocalExperiencesResult["general_tips"] | null }
>();

export function useLocalExperiences(hobbySlug: string) {
  const { ready: mapsReady } = useGoogleMaps();

  // Location state
  const [showModal, setShowModal] = useState(true);
  const [location, setLocation] = useState("");
  const [locationSet, setLocationSet] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Data state
  const [dynamicSpots, setDynamicSpots] = useState<LocalSpot[] | null>(null);
  const [generalTips, setGeneralTips] = useState<LocalExperiencesResult["general_tips"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Refs for cleanup
  const loadingRef = useRef(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Google Places Autocomplete
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!mapsReady || !inputRef.current || autocompleteRef.current) return;
    if (!window.google?.maps?.places) return;

    const ac = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["(cities)"],
    });

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (place?.formatted_address) setLocation(place.formatted_address);
      else if (place?.name) setLocation(place.name);
    });

    autocompleteRef.current = ac;
  }, [mapsReady, showModal]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  const fetchLocalExperiences = useCallback(
    async (loc: string) => {
      // Clear any previous poll
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);

      const cacheKey = `${hobbySlug}:${loc}`;
      const cached = localCache.get(cacheKey);
      if (cached) {
        setDynamicSpots(cached.spots);
        setGeneralTips(cached.tips);
        setLoading(false);
        loadingRef.current = false;
        return;
      }

      setLoading(true);
      loadingRef.current = true;
      setApiError(null);

      try {
        // Check DB cache
        const dbResult = await getLocalExperienceResult(hobbySlug, loc);
        if (dbResult.data) {
          localCache.set(cacheKey, { spots: dbResult.data.local_spots, tips: dbResult.data.general_tips });
          setDynamicSpots(dbResult.data.local_spots);
          setGeneralTips(dbResult.data.general_tips);
          setLoading(false);
          loadingRef.current = false;
          return;
        }

        const { job_id, error } = await triggerLocalExperiences(hobbySlug, loc);
        if (error || !job_id) {
          setApiError(error || "Failed to start search");
          setLoading(false);
          loadingRef.current = false;
          return;
        }

        // Poll for results
        pollIntervalRef.current = setInterval(async () => {
          const status = await pollLocalExperiencesStatus(job_id);
          if (!("status" in status)) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setApiError(status.error);
            setLoading(false);
            loadingRef.current = false;
            return;
          }

          if (status.status === "completed" && status.result) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            localCache.set(cacheKey, { spots: status.result.local_spots, tips: status.result.general_tips });
            setDynamicSpots(status.result.local_spots);
            setGeneralTips(status.result.general_tips);
            setLoading(false);
            loadingRef.current = false;
            saveLocalExperienceResult(hobbySlug, loc, status.result).catch(() => {});
          } else if (status.status === "failed") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setApiError(status.error || "Search failed");
            setLoading(false);
            loadingRef.current = false;
          }
        }, 2000);

        // Timeout after 120s
        pollTimeoutRef.current = setTimeout(() => {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          if (loadingRef.current) {
            setApiError("Search timed out. Please try again.");
            setLoading(false);
            loadingRef.current = false;
          }
        }, 120000);
      } catch (e) {
        setApiError(`Failed to search: ${e}`);
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [hobbySlug],
  );

  const handleSetLocation = useCallback(() => {
    if (location.trim()) {
      setLocationSet(true);
      setShowModal(false);
      fetchLocalExperiences(location.trim());
    }
  }, [location, fetchLocalExperiences]);

  const handleDetect = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }

    setDetecting(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          let locationName: string;
          if (mapsReady) {
            locationName = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          } else {
            locationName = `${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`;
          }
          setLocation(locationName);
          setLocationSet(true);
          setShowModal(false);
          fetchLocalExperiences(locationName);
        } catch {
          setGeoError("Couldn't determine your city. Please type it instead.");
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        setDetecting(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGeoError("Location access denied. Please type your city instead.");
            break;
          case err.POSITION_UNAVAILABLE:
            setGeoError("Location unavailable. Please type your city instead.");
            break;
          case err.TIMEOUT:
            setGeoError("Location request timed out. Please type your city instead.");
            break;
          default:
            setGeoError("Couldn't get your location. Please type your city instead.");
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }, [mapsReady, fetchLocalExperiences]);

  return {
    // Location
    location,
    setLocation,
    locationSet,
    showModal,
    setShowModal,
    detecting,
    geoError,
    inputRef,
    // Data
    dynamicSpots,
    generalTips,
    loading,
    apiError,
    // Actions
    handleSetLocation,
    handleDetect,
    fetchLocalExperiences,
  };
}
