import os
import requests
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

class MockKnowledgeGraphTool:
    """Tool for querying the Mock Knowledge Graph API from Meta CRAG KDD Challenge."""
    
    def __init__(self):
        """Initialize the tool with API URL from environment variable."""
        self.api_url = os.getenv("CRAG_MOCK_API_URL", "http://localhost:8080")
        logger.info(f"Initialized Mock Knowledge Graph tool with API URL: {self.api_url}")
    
    def search_entities(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Search for entities in the knowledge graph.
        
        Args:
            query: The search query string
            limit: Maximum number of results to return
            
        Returns:
            List of entity dictionaries with their properties
        """
        try:
            response = requests.get(
                f"{self.api_url}/entities/search",
                params={"q": query, "limit": limit},
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error searching entities: {str(e)}")
            return []
    
    def get_entity_details(self, entity_id: str) -> Dict[str, Any]:
        """
        Get detailed information about a specific entity.
        
        Args:
            entity_id: The ID of the entity to retrieve
            
        Returns:
            Dictionary containing entity details
        """
        try:
            response = requests.get(
                f"{self.api_url}/entities/{entity_id}",
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error getting entity details: {str(e)}")
            return {}
    
    def get_related_entities(self, entity_id: str, relation_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get entities related to a specific entity.
        
        Args:
            entity_id: The ID of the entity
            relation_type: Optional type of relation to filter by
            
        Returns:
            List of related entities with relation information
        """
        try:
            params = {}
            if relation_type:
                params["relation_type"] = relation_type
                
            response = requests.get(
                f"{self.api_url}/entities/{entity_id}/related",
                params=params,
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error getting related entities: {str(e)}")
            return []
    
    def query_knowledge_graph(self, query: str) -> Dict[str, Any]:
        """
        Comprehensive query to the knowledge graph.
        
        Args:
            query: Natural language query about entities and their relations
            
        Returns:
            Dictionary containing query results and relevant information
        """
        try:
            # First search for relevant entities
            entities = self.search_entities(query)
            if not entities:
                return {"result": "No relevant entities found for the query."}
            
            # Get details for the most relevant entity
            main_entity = entities[0]
            entity_details = self.get_entity_details(main_entity.get("id"))
            
            # Get related entities
            related = self.get_related_entities(main_entity.get("id"))
            
            # Compile results
            return {
                "main_entity": entity_details,
                "related_entities": related,
                "all_matching_entities": entities
            }
        except Exception as e:
            logger.error(f"Error querying knowledge graph: {str(e)}")
            return {"error": str(e)}
