import json
import os
import google.generativeai as genai
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.api_key = os.getenv('GEMINI_API_KEY')
        if self.api_key and self.api_key.strip():
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel(
                model_name='gemini-3.5-flash',
                system_instruction="You are an architecture diagram generator. When given a system description, return ONLY a valid JSON object with this exact structure: {nodes: [{id: string, type: string, label: string, x: number, y: number}], edges: [{source: string, target: string, label: string}]}. Node types must be one of: service, database, api, gateway, cache, queue. Generate at least 6-10 nodes with proper x/y positions spaced 300px apart. No explanation, just JSON."
            )
        else:
            self.model = None
            logger.warning("GEMINI_API_KEY is not configured or is empty. Falling back to default architecture.")
            
    def generate_system_architecture(self, prompt: str) -> Dict[str, Any]:
        """
        Generate system architecture diagram from text prompt using Google Gemini.
        Returns structured data compatible with React Flow and our Django models.
        """
        try:
            if not self.model:
                raise ValueError("Gemini API key is not configured or is empty.")
            
            logger.info(f"Generating system architecture via Gemini Flash for prompt: {prompt}")
            response = self.model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            
            text_response = response.text.strip()
            logger.info(f"Gemini API raw response: {text_response}")
            
            # Clean response if LLM wrapped it in markdown code blocks
            if text_response.startswith("```"):
                # Remove code blocks if present
                lines = text_response.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                text_response = "\n".join(lines).strip()
            
            result = json.loads(text_response)
            
            # Map Gemini format to database expected format
            transformed_nodes = []
            for n in result.get('nodes', []):
                transformed_nodes.append({
                    "id": str(n.get('id', '')),
                    "type": n.get('type', 'service'),
                    "position": {
                        "x": float(n.get('x', 0)),
                        "y": float(n.get('y', 0))
                    },
                    "data": {
                        "label": n.get('label', 'Service'),
                        "description": ""
                    }
                })
            
            transformed_edges = []
            for e in result.get('edges', []):
                transformed_edges.append({
                    "source": str(e.get('source', '')),
                    "target": str(e.get('target', '')),
                    "data": {
                        "label": e.get('label', '')
                    }
                })
            
            return {
                "nodes": transformed_nodes,
                "edges": transformed_edges
            }
            
        except Exception as e:
            logger.error(f"Failed to generate system architecture via Gemini: {e}", exc_info=True)
            # Fallback response if AI fails (e.g. key missing or network failure)
            # Generate 6-10 nodes layout as requested to make a sensible fallback
            # spaced 300px horizontally and 150px vertically in a flow grid pattern
            return {
                "nodes": [
                    {
                        "id": "gateway-1",
                        "type": "gateway",
                        "position": {"x": 100, "y": 100},
                        "data": {"label": "API Gateway", "description": "Routing incoming requests"}
                    },
                    {
                        "id": "service-1",
                        "type": "service",
                        "position": {"x": 400, "y": 100},
                        "data": {"label": "Auth Service", "description": "User authentication and session management"}
                    },
                    {
                        "id": "service-2",
                        "type": "service",
                        "position": {"x": 400, "y": 250},
                        "data": {"label": "Content Service", "description": "Serving content metadata"}
                    },
                    {
                        "id": "cache-1",
                        "type": "cache",
                        "position": {"x": 700, "y": 100},
                        "data": {"label": "Redis Cache", "description": "Caching session data"}
                    },
                    {
                        "id": "database-1",
                        "type": "database",
                        "position": {"x": 700, "y": 250},
                        "data": {"label": "Postgres DB", "description": "Persistent content database"}
                    },
                    {
                        "id": "queue-1",
                        "type": "queue",
                        "position": {"x": 1000, "y": 250},
                        "data": {"label": "RabbitMQ", "description": "Asynchronous messaging queue"}
                    }
                ],
                "edges": [
                    {
                        "source": "gateway-1",
                        "target": "service-1",
                        "data": {"label": "Auth requests"}
                    },
                    {
                        "source": "gateway-1",
                        "target": "service-2",
                        "data": {"label": "Content requests"}
                    },
                    {
                        "source": "service-1",
                        "target": "cache-1",
                        "data": {"label": "Session check"}
                    },
                    {
                        "source": "service-2",
                        "target": "database-1",
                        "data": {"label": "Read/Write data"}
                    },
                    {
                        "source": "service-2",
                        "target": "queue-1",
                        "data": {"label": "Publish activity logs"}
                    }
                ]
            }