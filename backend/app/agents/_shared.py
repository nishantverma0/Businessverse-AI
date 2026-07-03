# Shared worker postprocess helper; imported into worker agents.
def _worker_result(agent_name, artifact_type, resp, state):
    artifacts = dict(state.get("artifacts", {}))
    artifacts[agent_name] = {"type": artifact_type, "content": resp.content}
    # mark first pending task for this agent as done
    tasks = []
    marked = False
    for t in state.get("tasks", []):
        if not marked and t["assignee"] == agent_name and t["status"] == "pending":
            t = {**t, "status": "done"}
            marked = True
        tasks.append(t)
    return {
        "messages": [resp],
        "artifacts": artifacts,
        "tasks": tasks,
        "decision_log": [{"agent": agent_name, "action": f"{artifact_type}_generated"}],
        "usage": resp.response_metadata.get("token_usage", {}),
    }