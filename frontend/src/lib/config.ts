/** Server-only. Use in server actions and API routes. Never exposed to the browser. */
export const SERVER_API_URL = process.env.CREWAI_API_URL || "http://localhost:8000";
