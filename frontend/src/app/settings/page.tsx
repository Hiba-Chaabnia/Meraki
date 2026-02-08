"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks/useUser";
import { SettingsView } from "@/components/dashboard";
import {
  changePassword,
  exportUserData,
  deleteAllUserData,
  deleteAccountPermanently,
} from "@/app/actions/settings";

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useUser();

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const flash = (message: string, ms = 4000) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(null), ms);
  };

  const handleChangePassword = async (newPassword: string) => {
    if (!newPassword || newPassword.length < 6) {
      flash("Password must be at least 6 characters.");
      return;
    }
    const res = await changePassword(newPassword);
    flash(res.error ? `Error: ${res.error}` : "Password updated successfully.");
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
      flash("Data exported!");
    } else {
      flash("Failed to export data.");
    }
  };

  const handleDeleteData = async () => {
    const res = await deleteAllUserData();
    if (res.error) {
      flash(`Error: ${res.error}`);
    } else {
      router.refresh();
      flash("All your data has been deleted. Your account is still active.", 5000);
    }
  };

  const handleDeleteAccount = async () => {
    const res = await deleteAccountPermanently();
    if (res.error) flash(`Error: ${res.error}`);
    else router.push("/auth/login");
  };

  return (
    <SettingsView
      email={user?.email ?? "Loading..."}
      statusMessage={statusMessage}
      dashboardHref="/dashboard"
      onChangePassword={handleChangePassword}
      onExportData={handleExportData}
      onDeleteData={handleDeleteData}
      onDeleteAccount={handleDeleteAccount}
    />
  );
}
