import os, numpy as np, joblib
from sklearn.datasets import make_classification, make_regression
import xgboost as xgb
import lightgbm as lgb

OUT = "app/ml/artifacts"
os.makedirs(OUT, exist_ok=True)

def train_revenue():
    X, y = make_regression(n_samples=2000, n_features=5, noise=15, random_state=1)
    y = np.abs(y) * 100
    m = xgb.XGBRegressor(n_estimators=200, max_depth=4).fit(X, y)
    joblib.dump(m, f"{OUT}/revenue_latest.pkl")

def train_success():
    X, y = make_classification(n_samples=2000, n_features=4, random_state=2)
    m = lgb.LGBMClassifier(n_estimators=200).fit(X, y)
    joblib.dump(m, f"{OUT}/success_latest.pkl")

def train_churn():
    X, y = make_classification(n_samples=2000, n_features=4, weights=[0.7], random_state=3)
    m = xgb.XGBClassifier(n_estimators=200, max_depth=4).fit(X, y)
    joblib.dump(m, f"{OUT}/churn_latest.pkl")

def train_demand():
    X, y = make_regression(n_samples=2000, n_features=3, noise=10, random_state=4)
    y = np.abs(y) * 50
    m = xgb.XGBRegressor(n_estimators=150).fit(X, y)
    joblib.dump(m, f"{OUT}/demand_latest.pkl")

if __name__ == "__main__":
    train_revenue(); train_success(); train_churn(); train_demand()
    print("Trained all models ->", OUT)