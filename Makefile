.PHONY: up down build migrate seed logs test fmt

up:        ; docker compose up -d
down:      ; docker compose down
build:     ; docker compose build
logs:      ; docker compose logs -f backend
migrate:   ; docker compose exec backend alembic upgrade head
revision:  ; docker compose exec backend alembic revision --autogenerate -m "$(m)"
seed:      ; docker compose exec backend python -m app.db.seed
test:      ; docker compose exec backend pytest -q
fmt:       ; docker compose exec backend ruff format app
train:     ; docker compose exec backend python -m app.ml.train.train_all