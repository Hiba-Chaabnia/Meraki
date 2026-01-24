"""
Google Places Tool for finding local hobby classes, studios, and workshops.

Uses Google Places API (Text Search) to find nearby learning opportunities.
"""

import os
import json
from typing import Type

from pydantic import BaseModel, Field
from crewai.tools import BaseTool

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False


class GooglePlacesInput(BaseModel):
    """Input schema for GooglePlacesTool."""

    hobby: str = Field(..., description="The hobby to search for (e.g., 'pottery', 'watercolor painting')")
    location: str = Field(..., description="Location to search near (e.g., 'San Francisco, CA' or 'Paris, France')")
    max_results: int = Field(default=5, description="Maximum number of places to return (1-10)")


class GooglePlacesTool(BaseTool):
    """Find local classes, studios, and workshops for a hobby using Google Places API."""

    name: str = "google_places_search"
    description: str = (
        "Search for local classes, studios, and workshops for a hobby. "
        "Returns place names, addresses, ratings, reviews, and opening hours. "
        "Use this to find beginner-friendly local experiences for hobby exploration."
    )
    args_schema: Type[BaseModel] = GooglePlacesInput

    def _run(self, hobby: str, location: str, max_results: int = 5) -> str:
        """
        Search Google Places for hobby-related venues.

        Args:
            hobby: The hobby to search for
            location: Location to search near
            max_results: Maximum number of results (default 5)

        Returns:
            JSON string with place information
        """
        api_key = os.getenv("GOOGLE_PLACES_API_KEY") or os.getenv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")

        if not api_key:
            return json.dumps({
                "error": "GOOGLE_PLACES_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable not set",
                "places": []
            })

        if not REQUESTS_AVAILABLE:
            return json.dumps({
                "error": "requests library not installed. Run: pip install requests",
                "places": []
            })

        try:
            # Build search queries for different types of venues
            search_queries = [
                f"{hobby} class near {location}",
                f"{hobby} workshop near {location}",
                f"{hobby} studio near {location}",
                f"{hobby} lessons near {location}",
            ]

            all_places = []
            seen_place_ids = set()

            for query in search_queries:
                try:
                    places = self._search_places(api_key, query, max_results)
                except Exception as e:
                    print(f"[GooglePlaces] Query failed (skipping): {query} — {e}")
                    continue
                for place in places:
                    if place["place_id"] not in seen_place_ids:
                        seen_place_ids.add(place["place_id"])
                        all_places.append(place)

                if len(all_places) >= max_results * 2:
                    break

            # Sort by rating (highest first), then by number of reviews
            all_places.sort(key=lambda x: (x.get("rating") or 0, x.get("user_ratings_total") or 0), reverse=True)

            # Take top results
            results = all_places[:max_results]

            return json.dumps({
                "hobby": hobby,
                "location": location,
                "places": results,
                "total_found": len(all_places)
            }, indent=2)

        except Exception as e:
            return json.dumps({
                "error": f"Error searching Google Places: {str(e)}",
                "places": []
            })

    def _search_places(self, api_key: str, query: str, max_results: int) -> list:
        """Perform a text search on Google Places API."""
        url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
        params = {
            "query": query,
            "key": api_key,
            "type": "establishment",
        }

        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()

        if data.get("status") not in ["OK", "ZERO_RESULTS"]:
            error_msg = data.get("error_message", data.get("status", "Unknown error"))
            raise Exception(f"Google Places API error: {error_msg}")

        places = []
        for result in data.get("results", [])[:max_results]:
            place = {
                "place_id": result.get("place_id"),
                "name": result.get("name"),
                "address": result.get("formatted_address"),
                "rating": result.get("rating"),
                "user_ratings_total": result.get("user_ratings_total", 0),
                "price_level": self._format_price_level(result.get("price_level")),
                "types": result.get("types", []),
                "open_now": result.get("opening_hours", {}).get("open_now"),
                "photos": self._get_photo_urls(api_key, result.get("photos", [])),
            }

            # Determine venue type from Google's types
            place["venue_type"] = self._determine_venue_type(result.get("types", []), result.get("name", ""))

            places.append(place)

        return places

    def _format_price_level(self, level: int | None) -> str:
        """Convert price level to human-readable format."""
        if level is None:
            return "Price not available"
        levels = {
            0: "Free",
            1: "Inexpensive ($)",
            2: "Moderate ($$)",
            3: "Expensive ($$$)",
            4: "Very Expensive ($$$$)",
        }
        return levels.get(level, "Price not available")

    def _determine_venue_type(self, types: list, name: str) -> str:
        """Determine the type of venue based on Google's types and name."""
        name_lower = name.lower()

        if "school" in types or "school" in name_lower or "academy" in name_lower:
            return "School"
        if "studio" in name_lower:
            return "Studio"
        if "workshop" in name_lower:
            return "Workshop"
        if "class" in name_lower or "lesson" in name_lower:
            return "Class"
        if "store" in types or "shop" in name_lower:
            return "Supply Store"
        if "gym" in types or "fitness" in name_lower:
            return "Fitness Center"
        if "art_gallery" in types:
            return "Gallery"
        if "community" in name_lower or "center" in name_lower:
            return "Community Center"

        return "Venue"

    def _get_photo_urls(self, api_key: str, photos: list, max_photos: int = 1) -> list:
        """Get photo URLs for the place."""
        photo_urls = []
        for photo in photos[:max_photos]:
            photo_ref = photo.get("photo_reference")
            if photo_ref:
                url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference={photo_ref}&key={api_key}"
                photo_urls.append(url)
        return photo_urls
