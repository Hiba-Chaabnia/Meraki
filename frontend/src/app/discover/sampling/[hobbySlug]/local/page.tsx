"use client";

import { use, useState } from "react";
import { motion } from "framer-motion";
import { formatSlug } from "@/lib/hobbyData";
import { PageLayout } from "@/components/layouts/PageLayout";
import { THEME_PRIMARY, THEME_SECONDARY } from "@/lib/sectionTheme";
import { useLocalExperiences } from "@/components/discover/sampling/local/useLocalExperiences";
import { LocationModal } from "@/components/discover/sampling/local/LocationModal";
import { SpotCard } from "@/components/discover/sampling/local/SpotCard";
import { SpotFilters } from "@/components/discover/sampling/local/SpotFilters";
import { GeneralTips } from "@/components/discover/sampling/local/GeneralTips";
import { MapPinIcon } from "@/components/ui/Icons";
import type { FilterType } from "@/components/discover/sampling/local/types";

const FILTERS: FilterType[] = ["All", "Workshop", "Studio", "Class", "Meetup", "Drop-in Class"];

type DevState = "auto" | "empty" | "loading" | "results" | "error";
const DEV_STATES: DevState[] = ["auto", "empty", "loading", "results", "error"];

export default function LocalPage({
  params,
}: {
  params: Promise<{ hobbySlug: string }>;
}) {
  const { hobbySlug } = use(params);
  const hobbyName = formatSlug(hobbySlug);
  const [filter, setFilter] = useState<FilterType>("All");
  const [devState, setDevState] = useState<DevState>("auto");

  const {
    location,
    setLocation,
    locationSet,
    showModal,
    setShowModal,
    detecting,
    geoError,
    inputRef,
    dynamicSpots,
    generalTips,
    loading,
    apiError,
    handleSetLocation,
    handleDetect,
    fetchLocalExperiences,
  } = useLocalExperiences(hobbySlug);

  const spots = dynamicSpots ?? [];
  const filteredSpots =
    filter === "All"
      ? spots
      : spots.filter((s) => s.type.toLowerCase().includes(filter.toLowerCase()));

  const showEmpty   = devState === "empty"   || (devState === "auto" && !locationSet);
  const showLoading = devState === "loading" || (devState === "auto" && locationSet && loading);
  const showError   = devState === "error"   || (devState === "auto" && !!apiError && !loading);
  const showResults = devState === "results" || (devState === "auto" && locationSet && !loading);

  return (
    <PageLayout
      title={locationSet ? `Spots Near ${location}` : "Find Something Nearby"}
      subtitle={`${hobbyName} · Local experiences`}
      backHref={`/discover/sampling/${hobbySlug}`}
      backLabel="Back to sampling"
    >
      <div className="w-full flex-1 flex flex-col">
        {/* Dev nav — fixed overlay, outside page layout */}
        <div className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-1.5 py-1.5 bg-black/70 backdrop-blur-sm">
          {DEV_STATES.map((s) => (
            <button
              key={s}
              onClick={() => setDevState(s)}
              className={`px-3 py-0.5 rounded-full text-xs font-medium transition-colors ${
                devState === s
                  ? "bg-white text-black"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <LocationModal
          show={showModal}
          onClose={() => setShowModal(false)}
          location={location}
          onLocationChange={setLocation}
          onSubmit={handleSetLocation}
          onDetect={handleDetect}
          detecting={detecting}
          geoError={geoError}
          inputRef={inputRef}
        />

        {showEmpty ? (
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <MapPinIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="!text-xl text-gray-400 mb-2">
                Add your location to see spots near you
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:shadow-lg active:scale-95 bg-[var(--primary)] text-[var(--background)]"
              >
                Set Location
              </button>
            </motion.div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4">
            {locationSet && (
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowModal(true)}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5"
                >
                  <MapPinIcon className="w-4 h-4" />
                  Change location
                </button>
              </div>
            )}

            {showLoading && (
              <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6 flex items-center gap-4">
                <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-[var(--primary)] rounded-full flex-shrink-0" />
                <p className="text-gray-500">
                  Searching for {hobbyName.toLowerCase()} spots near {location}…
                </p>
              </div>
            )}

            {showError && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
                <p className="text-amber-800 text-sm">
                  {apiError ?? "Something went wrong. Please try again."}
                </p>
                <button
                  onClick={() => fetchLocalExperiences(location)}
                  className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[var(--primary)] transition-all hover:shadow-lg active:scale-95"
                >
                  Retry
                </button>
              </div>
            )}

            {showResults && (
              <>
                {generalTips && <GeneralTips tips={generalTips} />}

                <div className="mb-6">
                  <SpotFilters filters={FILTERS} active={filter} onChange={setFilter} />
                </div>

                <div className="space-y-4">
                  {filteredSpots.map((spot, index) => (
                    <SpotCard
                      key={spot.name || index}
                      spot={spot}
                      theme={index % 2 === 0 ? THEME_PRIMARY : THEME_SECONDARY}
                      index={index}
                    />
                  ))}
                </div>

                {filteredSpots.length === 0 && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-4 py-12">
                      <MapPinIcon className="w-10 h-10 text-gray-200 mx-auto" />
                      <p className="text-gray-400">
                        {filter !== "All"
                          ? `No ${filter.toLowerCase()} spots found. Try a different filter!`
                          : "No spots found for this location."}
                      </p>
                      {filter === "All" && (
                        <button
                          onClick={() => fetchLocalExperiences(location)}
                          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--primary)] transition-all hover:shadow-lg active:scale-95"
                        >
                          Retry Search
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
