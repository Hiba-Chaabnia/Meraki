"use client";

import { useState, type RefObject } from "react";
import { motion } from "framer-motion";
import { PageLayout } from "@/components/layouts/PageLayout";
import { THEME_PRIMARY, THEME_SECONDARY } from "@/lib/sectionTheme";
import { LocationModal } from "./LocationModal";
import { SpotCard } from "./SpotCard";
import { SpotFilters } from "./SpotFilters";
import { GeneralTips } from "./GeneralTips";
import { SamplingCTA } from "@/components/discover/sampling/SamplingCTA";
import { SamplingLoadingState } from "@/components/discover/sampling/SamplingLoadingState";
import { SamplingErrorState } from "@/components/discover/sampling/SamplingErrorState";
import { MapPinIcon } from "@/components/ui/Icons";
import type { FilterType } from "./types";
import type { LocalSpot, LocalExperiencesResult } from "@/app/actions/sampling";

const FILTERS: FilterType[] = ["All", "Workshop", "Drop-in Class", "Open Studio", "Community Meetup", "Trial Class", "Pop-up Event"];

export interface LocalSpotsViewProps {
  hobbyName: string;
  hobbySlug: string;
  backHref: string;

  location: string;
  onLocationChange: (value: string) => void;
  locationSet: boolean;
  showModal: boolean;
  onShowModal: (show: boolean) => void;
  onSubmitLocation: () => void;
  onDetect: () => void;
  detecting: boolean;
  geoError: string | null;
  inputRef: RefObject<HTMLInputElement | null>;

  spots: LocalSpot[] | null;
  generalTips: LocalExperiencesResult["general_tips"] | null;
  loading: boolean;
  apiError: string | null;
  onRetry: () => void;

  onCommit?: () => void;
  committing?: boolean;
  commitError?: string | null;
}

export function LocalSpotsView({
  hobbyName,
  hobbySlug,
  backHref,
  location,
  onLocationChange,
  locationSet,
  showModal,
  onShowModal,
  onSubmitLocation,
  onDetect,
  detecting,
  geoError,
  inputRef,
  spots,
  generalTips,
  loading,
  apiError,
  onRetry,
  onCommit,
  committing,
  commitError,
}: LocalSpotsViewProps) {
  const [filter, setFilter] = useState<FilterType>("All");

  const all = spots ?? [];
  const filteredSpots =
    filter === "All"
      ? all
      : all.filter((s) => s.type.toLowerCase().includes(filter.toLowerCase()));

  const showEmpty = !locationSet;
  const showLoading = locationSet && loading;
  const showError = !!apiError && !loading;
  const showResults = locationSet && !loading;

  return (
    <PageLayout
      title={locationSet ? `Spots Near ${location}` : "Find Something Nearby"}
      subtitle={`${hobbyName} · Local experiences`}
      backHref={backHref}
      backLabel="Back to sampling"
    >
      <div className="w-full flex-1 flex flex-col">
        <LocationModal
          show={showModal}
          onClose={() => onShowModal(false)}
          location={location}
          onLocationChange={onLocationChange}
          onSubmit={onSubmitLocation}
          onDetect={onDetect}
          detecting={detecting}
          geoError={geoError}
          inputRef={inputRef}
        />

        {showEmpty ? (
          <div className="flex-1 flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              <MapPinIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-xl text-gray-400 mb-2">Add your location to see spots near you</p>
              <button
                onClick={() => onShowModal(true)}
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
                      onClick={onRetry}
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
                    onClick={() => onShowModal(true)}
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
                              onClick={onRetry}
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
                    <div>{generalTips && <GeneralTips tips={generalTips} />}</div>
                    <div className="flex-shrink-0">
                      <SamplingCTA
                        hobbySlug={hobbySlug}
                        hobbyName={hobbyName}
                        currentPath="local"
                        onCommit={onCommit}
                        committing={committing}
                        commitError={commitError}
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
