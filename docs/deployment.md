# AgentFlow: Deployment Guide

AgentFlow supports multiple deployment topologies for development, continuous integration, and production hosting.

## 1. Local Full-Stack Development (Recommended)

The easiest way to run both the React frontend and live backend API in a single process:

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and supply GEMINI_API_KEY

# 3. Start development server
npm run dev
```

The application will be live at `http://localhost:3000`.

## 2. Dedicated Python FastAPI Backend

To run the standalone Python backend:

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows

# 3. Install Python requirements
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env

# 5. Run FastAPI with Uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

FastAPI interactive OpenAPI documentation is available at `http://localhost:8000/docs`.

Run backend unit tests:
```bash
pytest tests/
```

## 3. Scheduled Automation via GitHub Actions

AgentFlow includes a pre-configured scheduled workflow in `.github/workflows/scheduled_check.yml`.
Configure the following GitHub repository secrets:
- `AGENTFLOW_API_URL`: Your deployed backend URL (e.g. `https://api.yourdomain.com`).
- `AGENTFLOW_API_KEY`: Bearer token for authenticating scheduled execution requests.

The workflow will run every Monday through Friday at 08:00 and 16:00 UTC.

## 4. Cloud Deployment (AWS / GCP / Cloud Run)

- **Frontend**: Can be statically deployed to Firebase Hosting, Vercel, or AWS S3 + CloudFront.
- **Backend**: Containerized via Docker and deployed to Google Cloud Run, AWS App Runner, or AWS ECS.
- **AWS Lambda & Step Functions Extension**: For enterprise scaling, tool actions can be decomposed into AWS Lambda tasks coordinated by AWS Step Functions with Amazon SQS queues for failure retries.
