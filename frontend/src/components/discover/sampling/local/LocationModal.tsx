import { motion, AnimatePresence } from "framer-motion";
import { MapPinIcon, CrosshairIcon, XIcon } from "@/components/ui/Icons";

interface LocationModalProps {
  show: boolean;
  onClose: () => void;
  location: string;
  onLocationChange: (val: string) => void;
  onSubmit: () => void;
  onDetect: () => void;
  detecting: boolean;
  geoError: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function LocationModal({
  show,
  onClose,
  location,
  onLocationChange,
  onSubmit,
  onDetect,
  detecting,
  geoError,
  inputRef,
}: LocationModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
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
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: "var(--primary)" }}
              >
                <MapPinIcon className="w-7 h-7 text-[var(--background)]" />
              </div>
              <p className="!text-xl md:!text-2xl mb-2">
                Where are you located?
              </p>
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
                onChange={(e) => onLocationChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onSubmit();
                  }
                }}
                placeholder="Type your city"
                autoComplete="on"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary-theme-border)] focus:border-transparent transition-shadow"
              />
              <button
                onClick={onSubmit}
                disabled={!location.trim()}
                className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98]"
                style={{ backgroundColor: "var(--primary)" }}
              >
                Find Spots Near Me
              </button>
            </div>

            <div className="relative flex items-center justify-center mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
              <span className="relative bg-white px-3 text-xs text-gray-300 tracking-widest">
                or
              </span>
            </div>

            <button
              onClick={onDetect}
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
  );
}
