import json
import os
from openai import OpenAI
from typing import Dict, List, Any


class AIService:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    def generate_system_architecture(self, prompt: str) -> Dict[str, Any]:
        """
        Generate system architecture diagram from text prompt using OpenAI.
        Returns structured data compatible with React Flow.
        """
        from .ai_config import SYSTEM_PROMPT
        system_prompt = SYSTEM_PROMPT
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            # Parse the JSON response
            result = json.loads(response.choices[0].message.content)
            
            # Validate structure
            if 'nodes' not in result or 'edges' not in result:
                raise ValueError("Invalid response structure from AI")
            
            return result
            
        except Exception as e:
            # Fallback response if AI fails
            return {
                "nodes": [
                    {
                        "id": "fallback-1",
                        "type": "service",
                        "position": {"x": 100, "y": 100},
                        "data": {"label": "Service", "description": "Fallback service node"}
                    }
                ],
                "edges": []
            }