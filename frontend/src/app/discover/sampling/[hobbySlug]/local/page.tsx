"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { formatSlug } from "@/lib/hobbyData";
import { PageLayout } from "@/components/layouts/PageLayout";
import { THEME_PRIMARY, THEME_SECONDARY } from "@/lib/sectionTheme";
import { useLocalExperiences } from "@/components/discover/sampling/local/useLocalExperiences";
import { LocationModal } from "@/components/discover/sampling/local/LocationModal";
import { SpotCard } from "@/components/discover/sampling/local/SpotCard";
import { SpotFilters } from "@/components/discover/sampling/local/SpotFilters";
import { GeneralTips } from "@/components/discover/sampling/local/GeneralTips";
import { SamplingCTA } from "@/components/discover/sampling/SamplingCTA";
import { SamplingLoadingState } from "@/components/discover/sampling/SamplingLoadingState";
import { SamplingErrorState } from "@/components/discover/sampling/SamplingErrorState";
import { MapPinIcon } from "@/components/ui/Icons";
import { addHobbyDirect } from "@/app/actions/hobbies";
import type { FilterType } from "@/components/discover/sampling/local/types";

const FILTERS: FilterType[] = ["All", "Workshop", "Drop-in Class", "Open Studio", "Community Meetup", "Trial Class", "Pop-up Event"];

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
  const [committing, setCommitting] = useState(false);
  const router = useRouter();

  async function handleCommit() {
    setCommitting(true);
    const { error } = await addHobbyDirect(hobbySlug);
    if (!error) router.push(`/dashboard/hobby/${hobbySlug}`);
    setCommitting(false);
  }

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
          <div className="flex-1 flex flex-col w-full px-4">
            {/* Loading state */}
            {showLoading && (
              <div className="flex-1 flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-center"
                >
                  <SamplingLoadingState
                    message={`Searching for ${hobbyName.toLowerCase()} spots near ${location}…`}
                  />
                </motion.div>
              </div>
            )}

            {/* Error state */}
            {showError && (
              <div className="flex-1 flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-center"
                >
                  <SamplingErrorState message={apiError ?? "Something went wrong. Please try again."}>
                    <button
                      onClick={() => fetchLocalExperiences(location)}
                      className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[var(--background)] bg-[var(--primary)] text-sm font-semibold transition-all hover:shadow-lg active:scale-95"
                    >
                      Try again
                    </button>
                  </SamplingErrorState>
                </motion.div>
              </div>
            )}

            {/* Results state — 2 rows */}
            {showResults && (
              <div className="flex-1 flex flex-col gap-4 min-h-0">
                {/* Row 1: Filters left · Change location right */}
                <div className="flex items-center justify-between gap-4 px-2 py-1 rounded">
                  <SpotFilters filters={FILTERS} active={filter} onChange={setFilter} />
                  <button
                    onClick={() => setShowModal(true)}
                    className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5 flex-shrink-0"
                  >
                    <MapPinIcon className="w-4 h-4" />
                    Change location
                  </button>
                </div>

                {/* Row 2: Spot cards (3×2 grid) · Tips + CTA */}
                <div className="flex-1 grid grid-cols-[3fr_1fr] gap-6 min-h-0">
                  {/* Left column — 6 spots in 3 cols × 2 rows */}
                  <div className="p-2">
                    {filteredSpots.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
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
                    ) : (
                      <div className="grid grid-cols-3 gap-4">
                        {filteredSpots.slice(0, 6).map((spot, index) => (
                          <SpotCard
                            key={spot.name || index}
                            spot={spot}
                            theme={index % 2 === 0 ? THEME_PRIMARY : THEME_SECONDARY}
                            index={index}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right column — GeneralTips (flex-1) + SamplingCTA (bottom) */}
                  <div className="p-2 flex flex-col gap-2 min-h-0">
                    <div>
                      {generalTips && <GeneralTips tips={generalTips} />}
                    </div>
                    <div className="flex-shrink-0">
                      <SamplingCTA
                        hobbySlug={hobbySlug}
                        hobbyName={hobbyName}
                        currentPath="local"
                        onCommit={handleCommit}
                        committing={committing}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
