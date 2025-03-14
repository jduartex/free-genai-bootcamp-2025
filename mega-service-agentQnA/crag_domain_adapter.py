import requests
import json
import logging
import asyncio
import re
from typing import Dict, Any, List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("crag-domain-adapter")

class CragDomainAdapter:
    """Adapter for the CRAG Mock API that routes queries to domain-specific endpoints"""
    
    def __init__(self, base_url="http://crag-mock-api:8000"):
        self.base_url = base_url
        self.domains = {
            "movie": self._setup_movie_domain(),
            "finance": self._setup_finance_domain(),
            "music": self._setup_music_domain(),
            "sports": self._setup_sports_domain(),
            "open": self._setup_open_domain()
        }
        # Track successful endpoints for future use
        self.successful_endpoints = {}
        self.fallback_endpoint = "/music/grammy_get_all_awarded_artists"
    
    def _setup_movie_domain(self) -> Dict[str, str]:
        return {
            "endpoint": "/movie/get_movie_info",
            "keywords": ["movie", "film", "actor", "actress", "director", "cinema", "hollywood"]
        }
    
    def _setup_finance_domain(self) -> Dict[str, str]:
        return {
            "endpoint": "/finance/get_info",
            "keywords": ["stock", "price", "market", "company", "financial", "dividend", "ticker", "shares"]
        }
    
    def _setup_music_domain(self) -> Dict[str, str]:
        return {
            "endpoint": "/music/get_artist_all_works",
            "keywords": ["music", "song", "artist", "album", "band", "grammy", "singer"]
        }
    
    def _setup_sports_domain(self) -> Dict[str, str]:
        return {
            "endpoint": "/sports/nba/get_games_on_date",
            "keywords": ["sports", "team", "player", "game", "match", "score", "nba", "basketball", "soccer"]
        }
    
    def _setup_open_domain(self) -> Dict[str, str]:
        return {
            "endpoint": "/open/search_entity_by_name",
            "keywords": []  # Fallback domain
        }
    
    def determine_domain(self, query: str) -> str:
        """Determine the domain based on the query content"""
        query_lower = query.lower()
        
        # Check each domain for keyword matches
        domain_scores = {}
        for domain, info in self.domains.items():
            score = 0
            for keyword in info["keywords"]:
                if keyword in query_lower:
                    score += 1
            domain_scores[domain] = score
        
        # Get the domain with the highest score
        best_domain = max(domain_scores.items(), key=lambda x: x[1])
        
        # If no clear domain match, use 'open'
        if best_domain[1] == 0:
            return "open"
        
        return best_domain[0]
    
    async def ask(self, query: str) -> Dict[str, Any]:
        """Process a query and route it to the appropriate domain endpoint"""
        if not query:
            return {"response": "Empty query", "status": "error"}
        
        logger.info(f"Processing query: {query[:50]}...")
        
        # Try a successful endpoint first if we've used this domain before
        domain = self.determine_domain(query)
        logger.info(f"Query domain: {domain}")
        
        if domain in self.successful_endpoints:
            result = await self._try_endpoint(
                self.successful_endpoints[domain],
                query
            )
            if result and "response" in result:
                return result
        
        # Try the default endpoint for this domain
        domain_info = self.domains[domain]
        result = await self._try_endpoint(domain_info["endpoint"], query)
        if result and "response" in result:
            # Remember this successful endpoint
            self.successful_endpoints[domain] = domain_info["endpoint"]
            return result
        
        # Try other endpoints in this domain
        all_endpoints = await self._get_domain_endpoints(domain)
        for endpoint in all_endpoints:
            if endpoint != domain_info["endpoint"]:
                result = await self._try_endpoint(endpoint, query)
                if result and "response" in result:
                    # Remember this successful endpoint
                    self.successful_endpoints[domain] = endpoint
                    return result
        
        # If domain-specific endpoints fail, use fallback
        logger.info(f"Domain endpoints failed, trying fallback endpoint")
        result = await self._try_endpoint(self.fallback_endpoint, query)
        if result and "response" in result:
            return result
        
        # If all else fails, return a helpful error
        return {
            "response": f"I couldn't find information about {query} in our knowledge base. The API might still be initializing or this topic might not be covered in the available domains (movie, finance, music, sports, general knowledge).",
            "status": "error"
        }
    
    async def _get_domain_endpoints(self, domain: str) -> List[str]:
        """Get all endpoints for a specific domain"""
        # Cache these to avoid repeated calls
        if hasattr(self, '_domain_endpoints_cache'):
            if domain in self._domain_endpoints_cache:
                return self._domain_endpoints_cache[domain]
        else:
            self._domain_endpoints_cache = {}
            
        # Start with the main domain endpoint
        endpoints = [self.domains[domain]["endpoint"]]
        
        try:
            # Try to get OpenAPI spec to find all endpoints
            response = await self._async_request("GET", f"{self.base_url}/openapi.json")
            if response.status_code == 200:
                spec = response.json()
                for path in spec.get("paths", {}):
                    if f"/{domain}/" in path:
                        endpoints.append(path)
        except Exception as e:
            logger.warning(f"Error getting domain endpoints: {e}")
        
        # Cache for future use
        self._domain_endpoints_cache[domain] = endpoints
        return endpoints
    
    async def _try_endpoint(self, endpoint: str, query: str) -> Optional[Dict[str, Any]]:
        """Try a specific endpoint with the query"""
        url = f"{self.base_url}{endpoint}"
        logger.info(f"Trying endpoint: {url}")
        
        payload = {"query": query}
        try:
            response = await self._async_request("POST", url, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                # All successful responses seem to have a 'result' key
                if "result" in data:
                    # Format the result for display
                    formatted_response = self._format_result(data["result"])
                    return {
                        "response": formatted_response,
                        "status": "success",
                        "endpoint": endpoint,
                        "raw_data": data
                    }
                else:
                    logger.warning(f"Unexpected response format from {endpoint}: {data}")
            else:
                logger.warning(f"Endpoint {endpoint} returned status {response.status_code}")
        except Exception as e:
            logger.error(f"Error calling {endpoint}: {e}")
            
        return None
    
    def _format_result(self, result: Any) -> str:
        """Format the result data into a readable response"""
        if isinstance(result, str):
            return result
            
        elif isinstance(result, dict):
            # Try to create a readable response from dictionary
            parts = []
            for key, value in result.items():
                formatted_key = key.replace("_", " ").title()
                parts.append(f"{formatted_key}: {value}")
            return "\n".join(parts)
            
        elif isinstance(result, list):
            # If it's a small list, format each item
            if len(result) <= 10:
                if all(isinstance(item, dict) for item in result):
                    # Format list of objects nicely
                    formatted_items = []
                    for item in result:
                        item_parts = []
                        for key, value in item.items():
                            formatted_key = key.replace("_", " ").title()
                            item_parts.append(f"{formatted_key}: {value}")
                        formatted_items.append("\n".join(item_parts))
                    return "\n\n".join(formatted_items)
                else:
                    # Simple list formatting
                    return "\n".join([f"- {item}" for item in result])
            else:
                # Just mention the number of items for long lists
                return f"Found {len(result)} items. The first few are: \n" + "\n".join([f"- {item}" for item in result[:5]])
        
        # Fallback to string representation
        return str(result)
    
    async def _async_request(self, method: str, url: str, **kwargs) -> Any:
        """Make an async HTTP request"""
        loop = asyncio.get_event_loop()
        if method.upper() == "GET":
            return await loop.run_in_executor(
                None, lambda: requests.get(url, **kwargs)
            )
        else:
            return await loop.run_in_executor(
                None, lambda: requests.post(url, **kwargs)
            )

# Create singleton instance
api = CragDomainAdapter()
