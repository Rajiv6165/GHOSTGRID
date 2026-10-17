import json
import os
import google.generativeai as genai
from typing import Dict, List, Any
import logging
from .ai_config import SYSTEM_PROMPT

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.api_key = os.getenv('GEMINI_API_KEY')
        if self.api_key and self.api_key.strip():
            genai.configure(api_key=self.api_key)
            model_name = os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')
            self.model = genai.GenerativeModel(
                model_name=model_name
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
            
            formatted_prompt = SYSTEM_PROMPT.replace('{user_prompt}', prompt)
            logger.info(f"Generating system architecture via Gemini for prompt: {prompt}")
            
            try:
                response = self.model.generate_content(
                    formatted_prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
            except Exception as model_err:
                # If model name failed, try standard fallback model
                if 'not found' in str(model_err).lower():
                    logger.warning(f"Model error ({model_err}), trying gemini-1.5-flash fallback")
                    fallback_model = genai.GenerativeModel(model_name='gemini-1.5-flash')
                    response = fallback_model.generate_content(
                        formatted_prompt,
                        generation_config={"response_mime_type": "application/json"}
                    )
                else:
                    raise model_err
            
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
                pos_x = n.get('x')
                if pos_x is None:
                    pos_x = n.get('position', {}).get('x', 0)
                pos_y = n.get('y')
                if pos_y is None:
                    pos_y = n.get('position', {}).get('y', 0)
                
                label = n.get('label') or n.get('data', {}).get('label', 'Service')
                description = n.get('description') or n.get('data', {}).get('description', '')
                
                transformed_nodes.append({
                    "id": str(n.get('id', '')),
                    "type": n.get('type', 'service'),
                    "position": {
                        "x": float(pos_x),
                        "y": float(pos_y)
                    },
                    "data": {
                        "label": label,
                        "description": description
                    }
                })
            
            transformed_edges = []
            for e in result.get('edges', []):
                edge_label = e.get('label') or e.get('data', {}).get('label', '')
                transformed_edges.append({
                    "source": str(e.get('source', '')),
                    "target": str(e.get('target', '')),
                    "data": {
                        "label": edge_label
                    }
                })
            
            return {
                "nodes": transformed_nodes,
                "edges": transformed_edges
            }
            
        except Exception as e:
            logger.error(f"Failed to generate system architecture via Gemini: {e}", exc_info=True)
            # Fallback response if AI fails (e.g. key missing or network failure)
            # 10-15 nodes production-grade layout with at least 12 edges
            return {
                "nodes": [
                    {
                        "id": "cdn-1",
                        "type": "gateway",
                        "position": {"x": 100, "y": 150},
                        "data": {"label": "Cloudflare CDN", "description": "Edge caching, DDoS mitigation, and global SSL termination"}
                    },
                    {
                        "id": "lb-1",
                        "type": "gateway",
                        "position": {"x": 350, "y": 150},
                        "data": {"label": "Load Balancer", "description": "High availability reverse proxy routing traffic across cluster"}
                    },
                    {
                        "id": "gateway-1",
                        "type": "gateway",
                        "position": {"x": 600, "y": 150},
                        "data": {"label": "API Gateway", "description": "Request routing, authentication verification, and rate limiting"}
                    },
                    {
                        "id": "auth-1",
                        "type": "service",
                        "position": {"x": 850, "y": 150},
                        "data": {"label": "Auth Service", "description": "OAuth2 / JWT issuance, token verification, and user sessions"}
                    },
                    {
                        "id": "cache-1",
                        "type": "cache",
                        "position": {"x": 1100, "y": 150},
                        "data": {"label": "Redis Cache", "description": "In-memory cache for fast session retrieval and query caching"}
                    },
                    {
                        "id": "service-user",
                        "type": "service",
                        "position": {"x": 350, "y": 450},
                        "data": {"label": "User Service", "description": "Manages user profiles, preferences, and account metadata"}
                    },
                    {
                        "id": "api-core",
                        "type": "api",
                        "position": {"x": 600, "y": 450},
                        "data": {"label": "Core API Service", "description": "Primary business logic orchestration and REST endpoints"}
                    },
                    {
                        "id": "queue-1",
                        "type": "queue",
                        "position": {"x": 850, "y": 450},
                        "data": {"label": "RabbitMQ Message Queue", "description": "Asynchronous task queue and event-driven message bus"}
                    },
                    {
                        "id": "service-worker",
                        "type": "service",
                        "position": {"x": 1100, "y": 450},
                        "data": {"label": "Worker Service", "description": "Background job processor for async tasks and notifications"}
                    },
                    {
                        "id": "db-primary",
                        "type": "database",
                        "position": {"x": 350, "y": 750},
                        "data": {"label": "PostgreSQL Primary", "description": "Relational database for transactional core entity records"}
                    },
                    {
                        "id": "db-replica",
                        "type": "database",
                        "position": {"x": 600, "y": 750},
                        "data": {"label": "Read Replica DB", "description": "Read-only replica for high-throughput query offloading"}
                    },
                    {
                        "id": "monitoring-1",
                        "type": "service",
                        "position": {"x": 850, "y": 750},
                        "data": {"label": "Prometheus Monitoring", "description": "Real-time metrics scraping, alerting, and observability"}
                    }
                ],
                "edges": [
                    {
                        "source": "cdn-1",
                        "target": "lb-1",
                        "data": {"label": "Forward cache misses"}
                    },
                    {
                        "source": "lb-1",
                        "target": "gateway-1",
                        "data": {"label": "Distribute HTTP requests"}
                    },
                    {
                        "source": "gateway-1",
                        "target": "auth-1",
                        "data": {"label": "Authenticate token"}
                    },
                    {
                        "source": "auth-1",
                        "target": "cache-1",
                        "data": {"label": "Validate session"}
                    },
                    {
                        "source": "gateway-1",
                        "target": "api-core",
                        "data": {"label": "Dispatch API call"}
                    },
                    {
                        "source": "api-core",
                        "target": "service-user",
                        "data": {"label": "Fetch profile"}
                    },
                    {
                        "source": "api-core",
                        "target": "cache-1",
                        "data": {"label": "Query hot cache"}
                    },
                    {
                        "source": "api-core",
                        "target": "queue-1",
                        "data": {"label": "Publish async events"}
                    },
                    {
                        "source": "queue-1",
                        "target": "service-worker",
                        "data": {"label": "Consume job queue"}
                    },
                    {
                        "source": "api-core",
                        "target": "db-primary",
                        "data": {"label": "Write transactions"}
                    },
                    {
                        "source": "service-user",
                        "target": "db-replica",
                        "data": {"label": "Read user records"}
                    },
                    {
                        "source": "db-primary",
                        "target": "db-replica",
                        "data": {"label": "Streaming replication"}
                    },
                    {
                        "source": "service-worker",
                        "target": "monitoring-1",
                        "data": {"label": "Job completion telemetry"}
                    },
                    {
                        "source": "gateway-1",
                        "target": "monitoring-1",
                        "data": {"label": "Traffic & latency metrics"}
                    }
                ]
            }