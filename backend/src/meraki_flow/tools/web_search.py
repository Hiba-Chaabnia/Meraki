"""
Web Search Tool for finding local hobby experiences.

Uses DuckDuckGo search as a free fallback for rural areas
where Google Places may not have comprehensive results.
"""

import json
from typing import Type

from pydantic import BaseModel, Field
from crewai.tools import BaseTool

try:
    from duckduckgo_search import DDGS
    DDGS_AVAILABLE = True
except ImportError:
    DDGS_AVAILABLE = False


class WebSearchInput(BaseModel):
    """Input schema for WebSearchTool."""

    query: str = Field(..., description="Search query (e.g., 'pottery workshop Austin Texas')")
    max_results: int = Field(default=5, description="Maximum number of results to return (1-10)")


class WebSearchTool(BaseTool):
    """Search the web for local hobby experiences using DuckDuckGo."""

    name: str = "web_search"
    description: str = (
        "Search the web for local hobby workshops, meetups, and classes. "
        "Use this as a fallback when Google Places doesn't have enough results, "
        "especially for rural areas or niche hobbies. Returns titles, URLs, and snippets."
    )
    args_schema: Type[BaseModel] = WebSearchInput

    def _run(self, query: str, max_results: int = 5) -> str:
        """
        Search the web using DuckDuckGo.

        Args:
            query: Search query
            max_results: Maximum number of results (default 5)

        Returns:
            JSON string with search results
        """
        if not DDGS_AVAILABLE:
            return json.dumps({
                "error": "duckduckgo-search not installed. Run: pip install duckduckgo-search",
                "results": []
            })

        try:
            results = []

            with DDGS() as ddgs:
                search_results = list(ddgs.text(
                    query,
                    max_results=max_results * 2,  # Get more to filter
                    safesearch="moderate"
                ))

                for result in search_results:
                    # Filter out non-relevant results
                    url = result.get("href", "")
                    title = result.get("title", "")

                    # Skip social media, news aggregators, and non-relevant sites
                    skip_domains = ["facebook.com", "twitter.com", "instagram.com",
                                    "pinterest.com", "reddit.com", "wikipedia.org",
                                    "amazon.com", "ebay.com"]
                    if any(domain in url.lower() for domain in skip_domains):
                        continue

                    # Prioritize relevant sites
                    priority_keywords = ["meetup", "eventbrite", "class", "workshop",
                                         "studio", "lesson", "course", "community"]
                    is_priority = any(kw in url.lower() or kw in title.lower()
                                      for kw in priority_keywords)

                    results.append({
                        "title": title,
                        "url": url,
                        "snippet": result.get("body", ""),
                        "is_priority": is_priority,
                        "source": self._extract_domain(url)
                    })

            # Sort by priority, then take top results
            results.sort(key=lambda x: x["is_priority"], reverse=True)
            final_results = results[:max_results]

            # Remove the is_priority field from output
            for r in final_results:
                del r["is_priority"]

            return json.dumps({
                "query": query,
                "results": final_results,
                "total_found": len(results)
            }, indent=2)

        except Exception as e:
            return json.dumps({
                "error": f"Error performing web search: {str(e)}",
                "results": []
            })

    def _extract_domain(self, url: str) -> str:
        """Extract domain name from URL for display."""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            domain = parsed.netloc.replace("www.", "")
            return domain
        except Exception:
            return url
