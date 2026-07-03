from app.graph.state import CompanyState

def route(state: CompanyState) -> str:
    if state.get("requires_approval"):
        return "human"
    pending = [t for t in state.get("tasks", []) if t["status"] == "pending"]
    if not pending:
        return "END"
    return pending[0]["assignee"]