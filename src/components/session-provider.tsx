"use client";

import { createContext, useContext } from "react";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "VISITOR" | "ORGANIZER";
} | null;

const SessionContext = createContext<SessionUser>(null);

/** The session is resolved on the server and handed down — no client-side loading flash. */
export function SessionProvider({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

export const useSessionUser = () => useContext(SessionContext);
