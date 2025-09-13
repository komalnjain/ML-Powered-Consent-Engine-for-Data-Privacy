# Disable SSL verification for HuggingFace model downloads to avoid certificate errors
import os
os.environ["HF_HUB_DISABLE_SSL_VERIFICATION"] = "1"

from transformers import AutoTokenizer, BartForConditionalGeneration
import torch
from typing import Dict, List
import re

class PolicyAnalyzer:
    def __init__(self):
        # Initialize BART model and tokenizer for text summarization
        self.model_name = "facebook/bart-large-cnn"
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = BartForConditionalGeneration.from_pretrained(self.model_name)
        
        # Define categories of interest in privacy policies
        self.categories = {
            "data_collection": [
                "collect", "gather", "obtain", "track", "monitor", "record", "log", "store", "save", "retain", "capture", "acquire", "compile", "aggregate", "harvest", "receive", "access", "extract", "personal information", "personal data", "user data", "device data", "information we collect", "data we collect", "data collection", "data retention", "data storage", "data logging"
            ],
            "data_sharing": [
                "share", "disclose", "provide", "transfer", "sell", "third party", "partner", "affiliate", "vendor", "supplier", "external", "outside", "distribute", "release", "exchange", "grant access", "make available", "business partner", "marketing partner", "advertiser", "analytics provider", "data broker", "data sharing", "data disclosure", "data sale", "data transfer"
            ],
            "data_usage": [
                "use", "process", "analyze", "purpose", "improve", "personalize", "advertise", "evaluate", "assess", "study", "research", "develop", "test", "enhance", "operate", "manage", "administer", "support", "fulfill", "serve", "target", "profiling", "machine learning", "ai", "artificial intelligence", "data usage", "data processing", "data analysis", "data analytics", "data science"
            ],
            "data_security": [
                "protect", "secure", "encrypt", "safeguard", "confidential", "security measures", "security", "safety", "defend", "firewall", "antivirus", "access control", "data breach", "breach notification", "incident response", "data loss prevention", "cybersecurity", "compliance", "gdpr", "ccpa", "iso 27001", "data protection", "data security", "security protocol", "security policy", "security standard"
            ],
            "user_rights": [
                "right", "access", "delete", "modify", "control", "opt-out", "consent", "revoke", "withdraw", "update", "correct", "rectify", "restrict", "object", "portability", "request", "manage", "preferences", "settings", "choices", "privacy settings", "user rights", "data subject", "data request", "data removal", "data correction", "data update", "data access", "data deletion", "data erasure"
            ]
        }

    def _chunk_text(self, text: str, max_chunk_size: int = 1024) -> List[str]:
        """Split text into smaller chunks for processing"""
        # Split by paragraphs first
        paragraphs = text.split('\n\n')
        chunks = []
        current_chunk = ""
        
        for para in paragraphs:
            if len(current_chunk) + len(para) < max_chunk_size:
                current_chunk += para + "\n\n"
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = para + "\n\n"
        
        if current_chunk:
            chunks.append(current_chunk.strip())
            
        return chunks

    def _summarize_chunk(self, text: str, max_length: int = 150) -> str:
        """Summarize a chunk of text using BART"""
        inputs = self.tokenizer(text, max_length=1024, truncation=True, return_tensors="pt")
        
        summary_ids = self.model.generate(
            inputs["input_ids"],
            max_length=max_length,
            min_length=40,
            length_penalty=2.0,
            num_beams=4,
            early_stopping=True
        )
        
        return self.tokenizer.decode(summary_ids[0], skip_special_tokens=True)

    def _categorize_text(self, text: str) -> Dict[str, List[str]]:
        """Categorize text segments based on predefined categories"""
        categorized_points = {category: [] for category in self.categories}
        
        # Split text into sentences
        sentences = re.split(r'[.!?]+', text)
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
                
            # Check each category's keywords
            for category, keywords in self.categories.items():
                if any(keyword.lower() in sentence.lower() for keyword in keywords):
                    categorized_points[category].append(sentence)
        
        return categorized_points

    def analyze_policy(self, policy_text: str) -> Dict:
        """Analyze and summarize a privacy policy"""
        # Split text into manageable chunks
        chunks = self._chunk_text(policy_text)
        
        # Summarize each chunk
        summaries = []
        for chunk in chunks:
            summary = self._summarize_chunk(chunk)
            summaries.append(summary)
        
        # Combine summaries
        combined_summary = " ".join(summaries)
        
        # Categorize the points
        categorized_points = self._categorize_text(combined_summary)
        
        # Calculate risk scores based on the findings
        risk_scores = self._calculate_risk_scores(categorized_points)
        
        return {
            "summary": combined_summary,
            "categories": categorized_points,
            "risk_scores": risk_scores,
            "overall_risk": sum(risk_scores.values()) / len(risk_scores) if risk_scores else 0
        }

    def _calculate_risk_scores(self, categorized_points: Dict[str, List[str]]) -> Dict[str, float]:
        """Calculate risk scores for each category"""
        risk_scores = {}
        
        # Risk factors for each category
        risk_factors = {
            "data_collection": 0.8,  # High risk for extensive data collection
            "data_sharing": 1.0,     # Highest risk for data sharing
            "data_usage": 0.6,       # Medium risk for data usage
            "data_security": 0.4,    # Lower risk if security measures are in place
            "user_rights": 0.3       # Lower risk if user rights are clearly stated
        }
        
        for category, points in categorized_points.items():
            # Base score on number of points found
            base_score = min(len(points) * 2, 10)  # Cap at 10
            
            # Apply risk factor
            risk_scores[category] = base_score * risk_factors.get(category, 0.5)
            
            # Normalize to 0-10 scale
            risk_scores[category] = min(risk_scores[category], 10)
            
        return risk_scores
