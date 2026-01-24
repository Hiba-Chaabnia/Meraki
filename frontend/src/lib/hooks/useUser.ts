"use client";

import { useContext } from "react";
import { UserContext } from "@/lib/providers/UserProvider";

export function useUser() {
  return useContext(UserContext);
}
