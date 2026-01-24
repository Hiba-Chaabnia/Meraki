"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useUser } from "@/lib/hooks/useUser";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { updateSettings, changePassword, exportUserData, deleteAccount } from "@/app/actions/settings";

/* ─── Icons ─── */
const ArrowLeft = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

function ToggleSwitch({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
        enabled ? "bg-[var(--secondary)]" : "bg-gray-200"
      }`}
      role="switch"
      aria-checked={enabled}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, settings, refreshProfile } = useUser();

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [streakReminders, setStreakReminders] = useState(true);
  const [challengeAlerts, setChallengeAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [publicProfile, setPublicProfile] = useState(false);

  // Dialogs
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [deleteDataDialog, setDeleteDataDialog] = useState(false);
  const [deleteAccountDialog, setDeleteAccountDialog] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Sync from server settings
  useEffect(() => {
    if (settings) {
      setEmailNotifications(settings.email_notifications ?? true);
      setPushNotifications(settings.push_notifications ?? false);
      setStreakReminders(settings.streak_reminders ?? true);
      setChallengeAlerts(settings.challenge_alerts ?? true);
      setWeeklyDigest(settings.weekly_digest ?? true);
      setPublicProfile(settings.public_profile ?? false);
    }
  }, [settings]);

  const handleToggle = async (
    field: string,
    value: boolean,
    setter: (v: boolean) => void,
  ) => {
    setter(value);
    await updateSettings({ [field]: value });
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setStatusMessage("Password must be at least 6 characters.");
      return;
    }
    const res = await changePassword(newPassword);
    if (res.error) {
      setStatusMessage(`Error: ${res.error}`);
    } else {
      setStatusMessage("Password updated successfully.");
      setNewPassword("");
      setPasswordDialog(false);
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleExportData = async () => {
    setStatusMessage("Exporting your data...");
    const res = await exportUserData();
    if (res.data) {
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "meraki-data-export.json";
      a.click();
      URL.revokeObjectURL(url);
      setStatusMessage("Data exported!");
    } else {
      setStatusMessage("Failed to export data.");
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleDeleteData = async () => {
    setDeleteDataDialog(false);
    const res = await deleteAccount();
    if (res.error) {
      setStatusMessage(`Error: ${res.error}`);
    } else {
      router.push("/auth/login");
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteAccountDialog(false);
    const res = await deleteAccount();
    if (res.error) {
      setStatusMessage(`Error: ${res.error}`);
    } else {
      router.push("/auth/login");
    }
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="min-h-screen bg-[var(--background)]"
    >
      {/* Confirm dialogs */}
      <ConfirmDialog
        isOpen={deleteDataDialog}
        title="Delete All Data"
        message="This will permanently delete all your sessions, challenges, milestones, and progress. Your account will remain active but all data will be lost."
        confirmLabel="Delete All Data"
        destructive
        onConfirm={handleDeleteData}
        onCancel={() => setDeleteDataDialog(false)}
      />
      <ConfirmDialog
        isOpen={deleteAccountDialog}
        title="Delete Account"
        message="This will permanently delete your account and all associated data. This action cannot be undone."
        confirmLabel="Delete Account"
        destructive
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteAccountDialog(false)}
      />

      {/* Password dialog */}
      {passwordDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setPasswordDialog(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="!text-lg !font-bold !tracking-normal mb-4">
              Change Password
            </h3>
            <input
              type="password"
              placeholder="New password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[var(--secondary)]"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setPasswordDialog(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--secondary)] hover:brightness-105 transition-all cursor-pointer"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div variants={fadeUp} className="mb-8">
          <h1 className="!text-2xl md:!text-3xl mb-1">Settings</h1>
          <p className="text-gray-500 text-sm">
            Manage your account and preferences
          </p>
        </motion.div>

        {/* Status message */}
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 px-4 py-3 rounded-xl bg-blue-50 text-sm text-blue-600 font-medium"
          >
            {statusMessage}
          </motion.div>
        )}

        {/* Notifications */}
        <motion.div
          variants={fadeUp}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6"
        >
          <h2 className="!text-base !font-semibold !tracking-normal !text-gray-800 mb-5">
            Notifications
          </h2>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Email Notifications
                </p>
                <p className="text-xs text-gray-400">
                  Receive updates via email
                </p>
              </div>
              <ToggleSwitch
                enabled={emailNotifications}
                onToggle={() =>
                  handleToggle(
                    "email_notifications",
                    !emailNotifications,
                    setEmailNotifications,
                  )
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Push Notifications
                </p>
                <p className="text-xs text-gray-400">
                  Browser push notifications
                </p>
              </div>
              <ToggleSwitch
                enabled={pushNotifications}
                onToggle={() =>
                  handleToggle(
                    "push_notifications",
                    !pushNotifications,
                    setPushNotifications,
                  )
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Streak Reminders
                </p>
                <p className="text-xs text-gray-400">
                  Daily reminder to keep your streak alive
                </p>
              </div>
              <ToggleSwitch
                enabled={streakReminders}
                onToggle={() =>
                  handleToggle(
                    "streak_reminders",
                    !streakReminders,
                    setStreakReminders,
                  )
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Challenge Alerts
                </p>
                <p className="text-xs text-gray-400">
                  Notify when new challenges are available
                </p>
              </div>
              <ToggleSwitch
                enabled={challengeAlerts}
                onToggle={() =>
                  handleToggle(
                    "challenge_alerts",
                    !challengeAlerts,
                    setChallengeAlerts,
                  )
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Weekly Digest
                </p>
                <p className="text-xs text-gray-400">
                  Summary of your weekly progress
                </p>
              </div>
              <ToggleSwitch
                enabled={weeklyDigest}
                onToggle={() =>
                  handleToggle(
                    "weekly_digest",
                    !weeklyDigest,
                    setWeeklyDigest,
                  )
                }
              />
            </div>
          </div>
        </motion.div>

        {/* Privacy */}
        <motion.div
          variants={fadeUp}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6"
        >
          <h2 className="!text-base !font-semibold !tracking-normal !text-gray-800 mb-5">
            Privacy
          </h2>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Public Profile
                </p>
                <p className="text-xs text-gray-400">
                  Allow others to see your profile
                </p>
              </div>
              <ToggleSwitch
                enabled={publicProfile}
                onToggle={() =>
                  handleToggle(
                    "public_profile",
                    !publicProfile,
                    setPublicProfile,
                  )
                }
              />
            </div>
          </div>
        </motion.div>

        {/* Account */}
        <motion.div
          variants={fadeUp}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6"
        >
          <h2 className="!text-base !font-semibold !tracking-normal !text-gray-800 mb-5">
            Account
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Email</p>
              <p className="text-sm text-gray-400">
                {user?.email ?? "Loading..."}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setPasswordDialog(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Change Password
              </button>
              <button
                onClick={handleExportData}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Export My Data
              </button>
            </div>
          </div>
        </motion.div>

        {/* Danger zone */}
        <motion.div
          variants={fadeUp}
          className="bg-white rounded-2xl border border-red-100 shadow-sm p-6"
        >
          <h2 className="!text-base !font-semibold !tracking-normal text-red-600 mb-3">
            Danger Zone
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            These actions are irreversible. Please proceed with caution.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setDeleteDataDialog(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
            >
              Delete All Data
            </button>
            <button
              onClick={() => setDeleteAccountDialog(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
            >
              Delete Account
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
