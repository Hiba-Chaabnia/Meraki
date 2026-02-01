/** Server-only. Use in server actions and API routes. Never exposed to the browser. */
export const SERVER_API_URL = process.env.CREWAI_API_URL || "http://localhost:8000";

/** Client-safe. Use in client components that call the CrewAI backend directly. */
export const CLIENT_API_URL = process.env.NEXT_PUBLIC_CREWAI_API_URL || "http://localhost:8000";
