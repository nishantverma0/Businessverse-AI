import os, joblib

ARTIFACT_DIR = os.getenv("ML_ARTIFACT_DIR", "app/ml/artifacts")

class ModelRegistry:
    _cache = {}

    @classmethod
    def get(cls, name: str):
        if name not in cls._cache:
            path = f"{ARTIFACT_DIR}/{name}_latest.pkl"
            cls._cache[name] = joblib.load(path)
        return cls._cache[name]