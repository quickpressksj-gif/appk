# QuickPress Authentication Backend (FastAPI + MongoDB Atlas + Firebase)

Sprint 1 scope: authentication only.

## Run locally

```bash
cd backend-python
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # fill MONGODB_URI, Firebase and JWT values
uvicorn app.main:app --reload --port 8000
```

Point the frontends at it with `VITE_API_BASE_URL=http://localhost:8000`.

## Database

`MONGODB_URI` set  → MongoDB Atlas via Motor (production/local).
`MONGODB_URI` empty → in-memory store with the identical repository interface
(preview only, data is lost on restart). No application code changes between
the two — see `app/db/client.py`.

Collections: `users`, `customers`, `partners`, `riders`, `admins`,
plus `refresh_tokens` and `otp_attempts` for session and OTP policy.

## Endpoints

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/auth/phone/send-otp` | public |
| POST | `/api/auth/phone/verify` | public (Firebase ID token) |
| POST | `/api/auth/google` | public (Firebase ID token) |
| POST | `/api/auth/apple` | public (Firebase ID token) |
| GET | `/api/auth/me` | bearer access token |
| POST | `/api/auth/refresh` | refresh token in body |
| POST | `/api/auth/logout` | bearer access token |
