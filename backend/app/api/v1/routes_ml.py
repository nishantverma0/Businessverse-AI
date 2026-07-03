from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.db.models import MLPrediction
from app.schemas import MLRequest
from app.ml.registry import ModelRegistry
from app.observability.metrics import ML_LATENCY
import time

router = APIRouter()

FEATURE_ORDER = {
    "revenue": ["leads", "conversion", "avg_deal", "marketing_spend", "month"],
    "success": ["funding", "team_size", "market_size", "traction"],
    "churn": ["usage", "tenure_months", "tickets", "nps"],
    "demand": ["history", "trend", "seasonality"],
}

@router.post("/ml/{model}/predict")
async def predict(model: str, body: MLRequest, db: AsyncSession = Depends(get_session)):
    start = time.time()
    m = ModelRegistry.get(model)
    feats = [[body.inputs[k] for k in FEATURE_ORDER[model]]]
    if hasattr(m, "predict_proba"):
        out = {"probability": float(m.predict_proba(feats)[0][1])}
    else:
        out = {"prediction": float(m.predict(feats)[0])}
    ML_LATENCY.labels(model=model).observe(time.time() - start)
    if body.company_id:
        db.add(MLPrediction(company_id=body.company_id, model=model,
                            inputs=body.inputs, output=out, model_version="v1"))
        await db.commit()
    return out