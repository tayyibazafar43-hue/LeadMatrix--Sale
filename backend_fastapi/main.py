"""
LeadMatrix — FastAPI Backend Reference Implementation
Compatible with Supabase and React Frontend
"""

from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import os

app = FastAPI(title="LeadMatrix ML Qualification Engine", version="2.4.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LeadBase(BaseModel):
    name: str
    company: str
    email: str
    phone: Optional[str] = ""
    industry: str = "Other"
    company_size: str = "11-50"
    source: str = "Inbound Demo"
    budget: float = 0.0
    timeline: str = "3-6 months"
    decision_maker_seniority: str = "Manager / Lead"
    intent_score: int = 50
    tech_stack_match: bool = False

class LeadCreate(LeadBase):
    pass

class LeadReviewDecision(BaseModel):
    action: str = Field(..., description="approve | reject | override")
    notes: Optional[str] = None
    overrideScore: Optional[int] = None
    reviewer: Optional[str] = "Sales Director"

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "version": "2.4.0",
        "model": "XGBoost-Ensemble-v2.4",
        "storage": "supabase" if os.getenv("SUPABASE_URL") else "persistent_storage",
        "timestamp": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
