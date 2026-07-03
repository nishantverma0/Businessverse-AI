from langchain_core.tools import tool
from app.ml.registry import ModelRegistry

@tool
def predict_revenue(leads: int, conversion: float, avg_deal: float,
                    marketing_spend: float, month: int) -> dict:
    """Predict next-month revenue from sales & marketing inputs."""
    model = ModelRegistry.get("revenue")
    pred = float(model.predict([[leads, conversion, avg_deal, marketing_spend, month]])[0])
    return {"predicted_revenue": round(pred, 2)}

@tool
def predict_success(funding: float, team_size: int, market_size: float, traction: float) -> dict:
    """Predict startup success probability (0-1)."""
    model = ModelRegistry.get("success")
    prob = float(model.predict_proba([[funding, team_size, market_size, traction]])[0][1])
    return {"success_probability": round(prob, 3)}

@tool
def predict_churn(usage: float, tenure_months: int, tickets: int, nps: int) -> dict:
    """Predict customer churn probability (0-1)."""
    model = ModelRegistry.get("churn")
    prob = float(model.predict_proba([[usage, tenure_months, tickets, nps]])[0][1])
    return {"churn_probability": round(prob, 3)}