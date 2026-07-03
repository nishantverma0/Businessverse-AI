from langchain_core.tools import tool

@tool
def budget_calc(monthly_costs: float, headcount: int, runway_months: int) -> dict:
    """Calculate total budget and burn rate."""
    burn = monthly_costs + headcount * 10000
    return {"monthly_burn": burn, "total_budget": burn * runway_months}

@tool
def cash_flow_forecast(starting_cash: float, monthly_revenue: float,
                       monthly_burn: float, months: int) -> dict:
    """Forecast cash flow over N months."""
    series, cash = [], starting_cash
    for m in range(1, months + 1):
        cash += monthly_revenue - monthly_burn
        series.append({"month": m, "cash": round(cash, 2)})
    return {"forecast": series, "runway_ok": cash > 0}