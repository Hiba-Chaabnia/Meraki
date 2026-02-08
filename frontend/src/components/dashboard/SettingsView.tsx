"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ArrowLeftIcon } from "@/components/ui/Icons";
import { fadeUp, staggerContainer } from "@/components/ui/animations";

const stagger = staggerContainer(0.08);

export interface SettingsViewProps {
  email: string;
  statusMessage: string | null;
  dashboardHref: string;
  onChangePassword: (newPassword: string) => void | Promise<void>;
  onExportData: () => void;
  onDeleteData: () => void;
  onDeleteAccount: () => void;
}

export function SettingsView({
  email,
  statusMessage,
  dashboardHref,
  onChangePassword,
  onExportData,
  onDeleteData,
  onDeleteAccount,
}: SettingsViewProps) {
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [deleteDataDialog, setDeleteDataDialog] = useState(false);
  const [deleteAccountDialog, setDeleteAccountDialog] = useState(false);

  const submitPassword = async () => {
    await onChangePassword(newPassword);
    setNewPassword("");
    setPasswordDialog(false);
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
        onConfirm={() => { setDeleteDataDialog(false); onDeleteData(); }}
        onCancel={() => setDeleteDataDialog(false)}
      />
      <ConfirmDialog
        isOpen={deleteAccountDialog}
        title="Delete Account"
        message="This will permanently delete your account and all associated data. This action cannot be undone."
        confirmLabel="Delete Account"
        destructive
        onConfirm={() => { setDeleteAccountDialog(false); onDeleteAccount(); }}
        onCancel={() => setDeleteAccountDialog(false)}
      />

      {/* Password dialog */}
      {passwordDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPasswordDialog(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold tracking-normal mb-4">Change Password</h3>
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
                onClick={submitPassword}
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
          href={dashboardHref}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Dashboard
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div variants={fadeUp} className="mb-8">
          <h1 className="page-title mb-1">Settings</h1>
          <p className="text-gray-500 text-sm">Manage your account and preferences</p>
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

        {/* Privacy */}
        <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="card-heading mb-5">Privacy</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Meraki has no public profiles, feeds, or followers — your sessions,
            notes and photos are visible only to you. You can export or delete
            everything below.
          </p>
        </motion.div>

        {/* Account */}
        <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="card-heading mb-5">Account</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Email</p>
              <p className="text-sm text-gray-400">{email}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setPasswordDialog(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Change Password
              </button>
              <button
                onClick={onExportData}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Export My Data
              </button>
            </div>
          </div>
        </motion.div>

        {/* Danger zone */}
        <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
          <h2 className="text-base font-semibold tracking-normal text-red-600 mb-3">Danger Zone</h2>
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
