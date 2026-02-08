"use client";

import { use } from "react";
import { formatSlug } from "@/lib/hobbyData";
import { LocalSpotsView } from "@/components/discover/sampling/local/LocalSpotsView";
import { useLocalExperiences } from "@/components/discover/sampling/local/useLocalExperiences";
import { useCommit } from "@/hooks/useCommit";

export default function LocalPage({
  params,
}: {
  params: Promise<{ hobbySlug: string }>;
}) {
  const { hobbySlug } = use(params);
  const hobbyName = formatSlug(hobbySlug);
  const { handleCommit, committing, commitError } = useCommit(hobbySlug);

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

  return (
    <LocalSpotsView
      hobbyName={hobbyName}
      hobbySlug={hobbySlug}
      backHref={`/discover/sampling/${hobbySlug}`}
      location={location}
      onLocationChange={setLocation}
      locationSet={locationSet}
      showModal={showModal}
      onShowModal={setShowModal}
      onSubmitLocation={handleSetLocation}
      onDetect={handleDetect}
      detecting={detecting}
      geoError={geoError}
      inputRef={inputRef}
      spots={dynamicSpots}
      generalTips={generalTips}
      loading={loading}
      apiError={apiError}
      onRetry={() => fetchLocalExperiences(location)}
      onCommit={handleCommit}
      committing={committing}
      commitError={commitError}
    />
  );
}
