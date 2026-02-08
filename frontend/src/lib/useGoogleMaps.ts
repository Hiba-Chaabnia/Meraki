"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Loads the Google Maps JavaScript API and returns its readiness state.
 *
 * Requires `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in your .env.local.
 * The script is loaded once and cached globally across renders.
 */

let loadPromise: Promise<void> | null = null;

function loadGoogleMapsScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();
  if (loadPromise) return loadPromise;

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    console.warn("[Google Maps] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set");
    return Promise.reject(new Error("Missing Google Maps API key"));
  }

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function useGoogleMaps() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => setReady(true))
      .catch((err) => setError(err.message));
  }, []);

  return { ready, error };
}

/**
 * Reverse-geocodes lat/lng into a human-readable city name
 * using the Google Maps Geocoding service.
 */
export function reverseGeocode(
  lat: number,
  lng: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.google?.maps) {
      reject(new Error("Google Maps not loaded"));
      return;
    }

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status !== "OK" || !results || results.length === 0) {
        reject(new Error("Geocoding failed"));
        return;
      }

      // Walk through results looking for locality (city) or
      // administrative_area_level_1 (state/region) — works globally.
      let city = "";
      let region = "";
      let country = "";

      for (const result of results) {
        for (const component of result.address_components) {
          if (component.types.includes("locality")) {
            city = component.long_name;
          }
          if (component.types.includes("administrative_area_level_1")) {
            region = component.short_name;
          }
          if (component.types.includes("country")) {
            country = component.short_name;
          }
        }
        if (city) break;
      }

      // Fallback: if no locality found, try sublocality or the first result
      if (!city) {
        for (const result of results) {
          for (const component of result.address_components) {
            if (
              component.types.includes("sublocality") ||
              component.types.includes("administrative_area_level_2")
            ) {
              city = component.long_name;
              break;
            }
          }
          if (city) break;
        }
      }

      if (city && region) {
        resolve(`${city}, ${region}`);
      } else if (city && country) {
        resolve(`${city}, ${country}`);
      } else if (city) {
        resolve(city);
      } else {
        // Last resort — use the formatted address of the first result
        resolve(results[0].formatted_address);
      }
    });
  });
}
