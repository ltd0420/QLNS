#!/usr/bin/env python3
"""
FastAPI service for attrition inference.

Loads the trained scaler + logistic regression model from dataset/models/attrition_lr.joblib
and exposes POST /predict endpoint that accepts PCA component arrays.
"""

from pathlib import Path
from typing import List, Optional

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field, model_validator

# Import BERT sentiment analyzer
try:
    from sentiment_bert import get_analyzer
    BERT_AVAILABLE = True
except ImportError:
    BERT_AVAILABLE = False
    print("Warning: BERT sentiment analyzer not available. Install transformers and torch.")

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR.parent / "dataset" / "models" / "attrition_lr.joblib"

if not MODEL_PATH.exists():
  raise RuntimeError(f"Model file not found at {MODEL_PATH}")

bundle = joblib.load(MODEL_PATH)
SCALER = bundle["scaler"]
MODEL = bundle["model"]

app = FastAPI(title="HR Attrition Predictor", version="1.0.0")


class PCASample(BaseModel):
  components: List[float] = Field(..., description="Array of PCA component values")

  @model_validator(mode="after")
  def check_components(self):
    if not self.components:
      raise ValueError("components array must not be empty")
    return self


class BatchRequest(BaseModel):
  samples: List[PCASample] = Field(..., description="List of PCA samples to predict")

  @model_validator(mode="after")
  def check_samples(self):
    if not self.samples:
      raise ValueError("samples list must contain at least one entry")
    return self


@app.get("/healthz")
async def health_check():
  return {"status": "ok", "model_path": str(MODEL_PATH)}


@app.post("/predict")
async def predict(batch: BatchRequest, threshold: float = Query(0.5, gt=0.0, lt=1.0)):
  try:
    matrix = np.array([sample.components for sample in batch.samples], dtype=float)
    scaled = SCALER.transform(matrix)
    probs = MODEL.predict_proba(scaled)[:, 1]
    labels = (probs >= threshold).astype(int)
    return [
      {"probability": float(prob), "label": int(label)}
      for prob, label in zip(probs, labels)
    ]
  except Exception as error:
    raise HTTPException(status_code=400, detail=str(error)) from error


class SentimentRequest(BaseModel):
  text: str = Field(..., description="Text to analyze")
  rating: Optional[float] = Field(None, ge=1.0, le=5.0, description="Optional rating (1-5)")


@app.post("/sentiment")
async def analyze_sentiment(request: SentimentRequest):
  """
  Analyze sentiment using BERT model (PhoBERT for Vietnamese)
  """
  if not BERT_AVAILABLE:
    raise HTTPException(
      status_code=503,
      detail="BERT sentiment analyzer not available. Please install transformers and torch."
    )
  
  try:
    analyzer = get_analyzer()
    result = analyzer.analyze(request.text, request.rating)
    return result
  except Exception as error:
    raise HTTPException(status_code=500, detail=f"Sentiment analysis error: {str(error)}") from error


if __name__ == "__main__":
  import uvicorn

  uvicorn.run(app, host="0.0.0.0", port=8001)

