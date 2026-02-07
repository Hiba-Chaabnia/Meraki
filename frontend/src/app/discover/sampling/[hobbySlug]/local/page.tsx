"use client";

import { use, useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getHobby, getLocalSpots } from "@/lib/hobbyData";
import { useGoogleMaps, reverseGeocode } from "@/lib/useGoogleMaps";
import type { LocalSpot as StaticLocalSpot } from "@/lib/hobbyData";
import {
  triggerLocalExperiences,
  pollLocalExperiencesStatus,
  getLocalExperienceResult,
  saveLocalExperienceResult,
  type LocalSpot as DynamicLocalSpot,
  type LocalExperiencesResult,
} from "@/app/actions/sampling";

/* ─── Icons ─── */
const ArrowLeft = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);
const MapPinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21c-4-4-8-7.33-8-11a8 8 0 1116 0c0 3.67-4 7-8 11z" />
    <circle cx="12" cy="10" r="2" />
  </svg>
);
const StarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);
const CrosshairIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M22 12h-4M6 12H2M12 6V2M12 22v-4" />
  </svg>
);
const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);
const ExternalLinkIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
  </svg>
);
const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5L20 7" />
  </svg>
);

type FilterType = "All" | "Workshop" | "Studio" | "Class" | "Meetup" | "Drop-in Class";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

/* ═══════════════════════════════════════════════════════
   Local spots page — "Find Something Nearby"
   ═══════════════════════════════════════════════════════ */
export default function LocalPage({
  params,
}: {
  params: Promise<{ hobbySlug: string }>;
}) {
  const { hobbySlug } = use(params);
  const hobby = getHobby(hobbySlug);
  const staticSpots = getLocalSpots(hobbySlug);

  const { ready: mapsReady } = useGoogleMaps();

  const [showModal, setShowModal] = useState(true);
  const [location, setLocation] = useState("");
  const [locationSet, setLocationSet] = useState(false);
  const [filter, setFilter] = useState<FilterType>("All");
  const [detecting, setDetecting] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Dynamic spots from API
  const [dynamicSpots, setDynamicSpots] = useState<DynamicLocalSpot[] | null>(null);
  const [generalTips, setGeneralTips] = useState<LocalExperiencesResult["general_tips"] | null>(null);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const [apiError, setApiError] = useState<string | null>(null);

  /* Google Places Autocomplete */
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!mapsReady || !inputRef.current || autocompleteRef.current) return;

    const ac = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["(cities)"],
    });

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (place?.formatted_address) {
        setLocation(place.formatted_address);
      } else if (place?.name) {
        setLocation(place.name);
      }
    });

    autocompleteRef.current = ac;
  }, [mapsReady, showModal]);

  /* Fetch local experiences from API */
  const fetchLocalExperiences = useCallback(async (loc: string) => {
    setLoading(true);
    loadingRef.current = true;
    setApiError(null);

    try {
      // Check DB cache first
      const dbResult = await getLocalExperienceResult(hobbySlug, loc);
      if (dbResult.data) {
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
      const pollInterval = setInterval(async () => {
        const status = await pollLocalExperiencesStatus(job_id);
        if (!("status" in status)) {
          clearInterval(pollInterval);
          setApiError(status.error);
          setLoading(false);
          loadingRef.current = false;
          return;
        }

        if (status.status === "completed" && status.result) {
          clearInterval(pollInterval);
          setDynamicSpots(status.result.local_spots);
          setGeneralTips(status.result.general_tips);
          setLoading(false);
          loadingRef.current = false;
          // Persist to DB
          saveLocalExperienceResult(hobbySlug, loc, status.result).catch(() => {});
        } else if (status.status === "failed") {
          clearInterval(pollInterval);
          setApiError(status.error || "Search failed");
          setLoading(false);
          loadingRef.current = false;
        }
      }, 2000);

      // Timeout after 60 seconds — use ref to avoid stale closure
      setTimeout(() => {
        clearInterval(pollInterval);
        if (loadingRef.current) {
          setApiError("Search timed out. Please try again.");
          setLoading(false);
          loadingRef.current = false;
        }
      }, 60000);
    } catch (e) {
      setApiError(`Failed to search: ${e}`);
      setLoading(false);
      loadingRef.current = false;
    }
  }, [hobbySlug]);

  /* Manual submit */
  const handleSetLocation = useCallback(() => {
    if (location.trim()) {
      setLocationSet(true);
      setShowModal(false);
      fetchLocalExperiences(location.trim());
    }
  }, [location, fetchLocalExperiences]);

  /* Browser geolocation → Google reverse geocode */
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
            locationName = await reverseGeocode(
              pos.coords.latitude,
              pos.coords.longitude
            );
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
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, [mapsReady, fetchLocalExperiences]);

  const filters: FilterType[] = ["All", "Workshop", "Studio", "Class", "Meetup", "Drop-in Class"];

  // Use dynamic spots if available, otherwise fall back to static
  const spotsToShow = dynamicSpots || staticSpots;
  const filteredSpots = filter === "All"
    ? spotsToShow
    : spotsToShow.filter((s) => {
        const spotType = "type" in s ? s.type : "";
        return spotType.toLowerCase().includes(filter.toLowerCase());
      });

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── Location modal ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative bg-white rounded-3xl shadow-2xl p-8 md:p-10 max-w-md w-full z-10"
            >
              {/* Close button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <XIcon className="w-5 h-5" />
              </button>

              <div className="text-center mb-8">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: "#D4EFCF" }}
                >
                  <MapPinIcon className="w-7 h-7 text-[var(--green)]" />
                </div>
                <h2 className="!text-xl md:!text-2xl mb-2">
                  Where are you located?
                </h2>
                <p className="text-gray-500 text-sm">
                  We just need your area &mdash; nothing more specific than your city.
                </p>
              </div>

              {/* City input with Google Places Autocomplete */}
              <div className="space-y-3 mb-6">
                <input
                  ref={inputRef}
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSetLocation();
                    }
                  }}
                  placeholder="Start typing your city\u2026"
                  autoComplete="off"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--green)] focus:border-transparent transition-shadow"
                />
                <button
                  onClick={handleSetLocation}
                  disabled={!location.trim()}
                  className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98]"
                  style={{ backgroundColor: "var(--green)" }}
                >
                  Find Spots Near Me
                </button>
              </div>

              <div className="relative flex items-center justify-center mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
                <span className="relative bg-white px-3 text-xs text-gray-300 uppercase tracking-widest">
                  or
                </span>
              </div>

              <button
                onClick={handleDetect}
                disabled={detecting}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                <CrosshairIcon className={`w-4 h-4 ${detecting ? "animate-spin" : ""}`} />
                {detecting ? "Detecting\u2026" : "Use my current location"}
              </button>

              {/* Error message */}
              {geoError && (
                <p className="text-xs text-red-400 text-center mt-3">
                  {geoError}
                </p>
              )}

              <p className="text-xs text-gray-300 text-center mt-4">
                We won&apos;t store your location data.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top bar ── */}
      <div className="w-full max-w-4xl mx-auto px-4 pt-6 pb-2">
        <Link
          href={`/discover/sampling/${hobbySlug}`}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sampling
        </Link>
      </div>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto px-4 pt-4 pb-6"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-[var(--green)] mb-1">
              {hobby.name} &middot; Local experiences
            </p>
            <h1 className="!text-2xl md:!text-3xl">
              {locationSet ? `Spots Near ${location}` : "Find Something Nearby"}
            </h1>
          </div>
          {locationSet && (
            <button
              onClick={() => setShowModal(true)}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5"
            >
              <MapPinIcon className="w-4 h-4" />
              Change location
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Content ── */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        {!locationSet ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <MapPinIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h2 className="!text-xl text-gray-400 mb-2">
              Add your location to see spots near you
            </h2>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-6 py-3 rounded-xl text-white font-semibold text-sm transition-all hover:shadow-lg active:scale-95"
              style={{ backgroundColor: "var(--green)" }}
            >
              Set Location
            </button>
          </motion.div>
        ) : (
          <>
            {/* Loading state */}
            {loading && (
              <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6 flex items-center gap-4">
                <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-[var(--green)] rounded-full" />
                <p className="text-gray-500">
                  Searching for {hobby.name.toLowerCase()} spots near {location}...
                </p>
              </div>
            )}

            {/* API Error */}
            {apiError && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-amber-800 text-sm">
                {apiError}. Showing example spots instead.
              </div>
            )}

            {/* General tips */}
            {generalTips && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-gray-100 p-6 mb-6"
              >
                <h3 className="text-sm font-bold tracking-widest uppercase text-gray-400 mb-4">
                  Tips for your first visit
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generalTips.what_to_wear && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">What to wear</p>
                      <p className="text-sm text-gray-500">{generalTips.what_to_wear}</p>
                    </div>
                  )}
                  {generalTips.what_to_bring && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">What to bring</p>
                      <p className="text-sm text-gray-500">{generalTips.what_to_bring}</p>
                    </div>
                  )}
                  {generalTips.what_to_expect && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">What to expect</p>
                      <p className="text-sm text-gray-500">{generalTips.what_to_expect}</p>
                    </div>
                  )}
                  {generalTips.how_to_not_feel_awkward && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Don&apos;t feel awkward</p>
                      <p className="text-sm text-gray-500">{generalTips.how_to_not_feel_awkward}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filter === f
                      ? "bg-[var(--green)] text-white"
                      : "bg-white text-gray-500 border border-gray-100 hover:border-gray-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Venue cards */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
              className="space-y-4"
            >
              {filteredSpots.map((spot, index) => (
                <SpotCard
                  key={"name" in spot ? spot.name : index}
                  spot={spot}
                  hobby={hobby}
                  isDynamic={!!dynamicSpots}
                />
              ))}
            </motion.div>

            {filteredSpots.length === 0 && !loading && (
              <p className="text-center text-gray-400 py-12">
                No {filter.toLowerCase()} spots found. Try a different filter!
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Venue card ─── */
function SpotCard({
  spot,
  hobby,
  isDynamic,
}: {
  spot: DynamicLocalSpot | StaticLocalSpot;
  hobby: { color: string; lightColor: string };
  isDynamic: boolean;
}) {
  // Handle both dynamic (API) and static (fallback) spot formats
  const isDynamicSpot = "beginner_friendly" in spot;

  const name = spot.name;
  const type = spot.type;
  const rating = isDynamicSpot ? spot.rating : (spot as StaticLocalSpot).rating;
  const address = isDynamicSpot ? spot.address : undefined;
  const price = isDynamicSpot ? spot.price : (spot as StaticLocalSpot).price;
  const url = isDynamicSpot ? spot.url : undefined;
  const beginnerFriendly = isDynamicSpot ? spot.beginner_friendly : (spot as StaticLocalSpot).beginnerFriendly;
  const beginnerTips = isDynamicSpot ? spot.beginner_tips : undefined;
  const description = !isDynamicSpot ? (spot as StaticLocalSpot).description : undefined;
  const reviewCount = isDynamicSpot ? spot.reviews_count : (spot as StaticLocalSpot).reviewCount;
  const distance = !isDynamicSpot ? (spot as StaticLocalSpot).distance : undefined;
  const nextDate = !isDynamicSpot ? (spot as StaticLocalSpot).nextDate : undefined;

  return (
    <motion.div
      variants={fadeUp}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow p-6"
    >
      <div className="flex flex-col md:flex-row md:items-start gap-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h3 className="!text-base !font-semibold !tracking-normal !text-gray-800">
              {name}
            </h3>
            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
              style={{ backgroundColor: hobby.lightColor, color: hobby.color }}
            >
              {type}
            </span>
            {beginnerFriendly && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-600 flex items-center gap-1">
                <CheckIcon className="w-3 h-3" />
                Beginner-friendly
              </span>
            )}
          </div>

          {description && (
            <p className="text-sm text-gray-500 leading-relaxed mb-3">
              {description}
            </p>
          )}

          {beginnerTips && (
            <p className="text-sm text-gray-500 leading-relaxed mb-3 italic">
              &ldquo;{beginnerTips}&rdquo;
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            {address && (
              <span className="flex items-center gap-1">
                <MapPinIcon className="w-3.5 h-3.5" /> {address}
              </span>
            )}
            {distance && (
              <span className="flex items-center gap-1">
                <MapPinIcon className="w-3.5 h-3.5" /> {distance}
              </span>
            )}
            {rating && (
              <span className="flex items-center gap-1">
                <StarIcon className="w-3.5 h-3.5 text-yellow-400" />
                {rating} {reviewCount ? `(${reviewCount})` : ""}
              </span>
            )}
            {nextDate && (
              <span>{nextDate}</span>
            )}
            {price && (
              <span className="font-medium text-gray-500">{price}</span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0">
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:shadow-lg active:scale-95"
              style={{ backgroundColor: hobby.color }}
            >
              Learn More
              <ExternalLinkIcon className="w-4 h-4" />
            </a>
          ) : (
            <button
              className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:shadow-lg active:scale-95"
              style={{ backgroundColor: hobby.color }}
            >
              Learn More
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
