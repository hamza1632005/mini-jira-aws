# 🗂️ Mini Jira on AWS
> Cloud Computing Project — GIU 2026

A simplified project management tool (Jira-like) built entirely on AWS services.

## 👥 Team Members

| Member | Name | Role |
|--------|------|------|
| M1 | Ahmed | Cloud Architect & DevOps Lead |
| M2 | Sara | Backend Lead — Auth & Core API |
| M3 | Omar | Backend Dev — Tasks, Comments & S3 |
| M4 | Nour | Serverless & Event-Driven Engineer |
| M5 | Karim | Frontend Developer |
| M6 | Dina | QA, Docs & Architecture Diagram |

## 🏗️ Architecture

> Architecture diagram will be added after T-16 (Dina)

## 🔗 Live App

> CloudFront URL: *TBD after deployment*

## 📁 Repository Structure

\`\`\`
mini-jira-aws/
├── backend/        # Node.js/Express REST API
├── frontend/       # Next.js frontend
├── infra/          # AWS infrastructure notes & schema docs
├── lambdas/        # AWS Lambda functions
└── docs/           # Architecture diagrams & screenshots
\`\`\`

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- AWS CLI configured
- AWS account with IAM credentials

### Backend Setup
\`\`\`bash
cd backend
cp ../.env.example .env
# Fill in your real values in .env
npm install
npm run dev
\`\`\`

### Frontend Setup
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

## 🎬 Demo Scenario

1. Login as **Ali** (manager) → create tasks, assign to team
2. Login as **Sara** (employee, Frontend) → sees only her tasks
3. Login as **Omar** (employee, Backend) → sees only his tasks

## 🎥 Demo Video

> Link will be added before submission deadline (22 May 2026)

## 📋 Deployment Steps

> Will be documented after T-15 integration testing

## 🔑 Environment Variables

See `.env.example` for all required variables.

---
**Deadline:** 22 May 2026 | **Course:** ICS608 Cloud Computing