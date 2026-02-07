"""
YouTube Search Tool for finding beginner-friendly hobby videos.

Uses YouTube Data API v3 to search for and curate videos.
"""

import os
import json
from typing import Type

from pydantic import BaseModel, Field
from crewai.tools import BaseTool

try:
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
    YOUTUBE_API_AVAILABLE = True
except ImportError:
    YOUTUBE_API_AVAILABLE = False


class YouTubeSearchInput(BaseModel):
    """Input schema for YouTubeSearchTool."""

    query: str = Field(..., description="Search query for YouTube (e.g., 'pottery beginner tutorial')")
    max_results: int = Field(default=5, description="Maximum number of videos to return (1-10)")


class YouTubeSearchTool(BaseTool):
    """Search YouTube for beginner-friendly videos about a hobby."""

    name: str = "youtube_search"
    description: str = (
        "Search YouTube for beginner-friendly videos about a hobby. "
        "Returns video titles, channels, URLs, durations, and view counts. "
        "Use this to curate educational content for hobby beginners."
    )
    args_schema: Type[BaseModel] = YouTubeSearchInput

    def _run(self, query: str, max_results: int = 5) -> str:
        """
        Search YouTube for videos matching the query.

        Args:
            query: Search query (e.g., "pottery beginner tutorial")
            max_results: Maximum number of results to return (default 5)

        Returns:
            JSON string with video information
        """
        api_key = os.getenv("YOUTUBE_API_KEY")

        if not api_key:
            return json.dumps({
                "error": "YOUTUBE_API_KEY environment variable not set",
                "videos": []
            })

        if not YOUTUBE_API_AVAILABLE:
            return json.dumps({
                "error": "google-api-python-client not installed. Run: pip install google-api-python-client",
                "videos": []
            })

        try:
            youtube = build("youtube", "v3", developerKey=api_key)

            # Search for videos
            search_response = youtube.search().list(
                q=query,
                part="id,snippet",
                maxResults=min(max_results * 2, 20),  # Get more to filter
                type="video",
                videoDuration="medium",  # 4-20 minutes
                relevanceLanguage="en",
                safeSearch="strict",
                order="relevance"
            ).execute()

            video_ids = [item["id"]["videoId"] for item in search_response.get("items", [])]

            if not video_ids:
                return json.dumps({
                    "query": query,
                    "videos": [],
                    "message": "No videos found for this query"
                })

            # Get video details (duration, view count)
            videos_response = youtube.videos().list(
                part="contentDetails,statistics,snippet",
                id=",".join(video_ids)
            ).execute()

            videos = []
            for item in videos_response.get("items", []):
                # Parse duration (ISO 8601 format like PT15M32S)
                duration_iso = item["contentDetails"]["duration"]
                duration = self._parse_duration(duration_iso)
                duration_minutes = self._duration_to_minutes(duration_iso)

                # Filter: prefer 5-25 minute videos with decent view counts
                view_count = int(item["statistics"].get("viewCount", 0))
                if duration_minutes < 3 or duration_minutes > 30:
                    continue
                if view_count < 1000:
                    continue

                videos.append({
                    "title": item["snippet"]["title"],
                    "channel": item["snippet"]["channelTitle"],
                    "url": f"https://www.youtube.com/watch?v={item['id']}",
                    "thumbnail": item["snippet"]["thumbnails"]["high"]["url"],
                    "duration": duration,
                    "duration_minutes": duration_minutes,
                    "view_count": view_count,
                    "view_count_formatted": self._format_count(view_count),
                    "description": item["snippet"]["description"][:200] + "..." if len(item["snippet"]["description"]) > 200 else item["snippet"]["description"]
                })

                if len(videos) >= max_results:
                    break

            # Sort by view count (most popular first)
            videos.sort(key=lambda x: x["view_count"], reverse=True)

            return json.dumps({
                "query": query,
                "videos": videos[:max_results],
                "total_found": len(videos)
            }, indent=2)

        except HttpError as e:
            return json.dumps({
                "error": f"YouTube API error: {str(e)}",
                "videos": []
            })
        except Exception as e:
            return json.dumps({
                "error": f"Error searching YouTube: {str(e)}",
                "videos": []
            })

    def _parse_duration(self, iso_duration: str) -> str:
        """Convert ISO 8601 duration to human-readable format."""
        import re
        match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', iso_duration)
        if not match:
            return iso_duration

        hours, minutes, seconds = match.groups()
        parts = []
        if hours:
            parts.append(f"{hours}h")
        if minutes:
            parts.append(f"{minutes}m")
        elif hours:  # Add 0m if there are hours but no minutes
            parts.append("0m")
        if seconds and not hours:  # Only show seconds for shorter videos
            parts.append(f"{seconds}s")

        return " ".join(parts) if parts else "0m"

    def _duration_to_minutes(self, iso_duration: str) -> float:
        """Convert ISO 8601 duration to minutes."""
        import re
        match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', iso_duration)
        if not match:
            return 0

        hours = int(match.group(1) or 0)
        minutes = int(match.group(2) or 0)
        seconds = int(match.group(3) or 0)

        return hours * 60 + minutes + seconds / 60

    def _format_count(self, count: int) -> str:
        """Format view count for display."""
        if count >= 1_000_000:
            return f"{count / 1_000_000:.1f}M"
        elif count >= 1_000:
            return f"{count / 1_000:.1f}K"
        return str(count)
