# app-image-mp3

Starter monorepo for editing MP3 metadata and cover art.

## Structure

- `frontend/` - Next.js UI for uploading MP3 files and editing metadata
- `backend/` - FastAPI service for reading and updating ID3 tags

## MVP

1. Upload an MP3 file
2. Read current metadata and cover art
3. Edit common tags such as title, artist, album, genre, year, track, and comment
4. Replace or add cover art
5. Download the updated MP3 file

## Frontend

```bash
cd frontend
npm run dev
```

## Backend

```bash
cd backend
venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Planned API

- `POST /api/v1/mp3/read` - read metadata from an uploaded MP3 file
- `POST /api/v1/mp3/update` - update metadata and return a new MP3 file

## Docker

Run both services locally:

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

Environment variables come from the shell or `.env` file next to `docker-compose.yml`.

Recommended values for local Docker:

```env
NEXT_PUBLIC_API_BASE_URL=/api/mp3
BACKEND_INTERNAL_API_URL=http://backend:8000
API_SHARED_TOKEN=change-me-long-random-token
BACKEND_CORS_ORIGINS=http://localhost:3000
```

## Dokploy

This repo is ready for a Compose-based Dokploy deployment.

1. Create a new Compose application in Dokploy
2. Point it to this repository
3. Use `docker-compose.yml`
4. Set environment variables:

```env
NEXT_PUBLIC_API_BASE_URL=/api/mp3
BACKEND_INTERNAL_API_URL=http://backend:8000
API_SHARED_TOKEN=change-me-long-random-token
BACKEND_CORS_ORIGINS=https://your-frontend-domain
BACKEND_PORT=8000
BACKEND_HOST=0.0.0.0
```

Important:

- the browser now talks only to `frontend /api/mp3/*`, and the frontend server forwards requests to backend with `API_SHARED_TOKEN`
- `API_SHARED_TOKEN` must be identical in both frontend and backend containers
- `BACKEND_INTERNAL_API_URL` should stay on the internal Docker network, for example `http://backend:8000`
- `BACKEND_CORS_ORIGINS` should still include the frontend domain if you expose the backend publicly for diagnostics
