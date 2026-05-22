<div align="center">

# 🗂️ Mini Jira on AWS

### A cloud-native, team-based task management platform

*Software Cloud Computing · German International University · Spring 2026*

<br>

![AWS](https://img.shields.io/badge/AWS-Cloud-FF9900?style=for-the-badge&logo=amazonwebservices&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-Frontend-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![DynamoDB](https://img.shields.io/badge/DynamoDB-NoSQL-4053D6?style=for-the-badge&logo=amazondynamodb&logoColor=white)

<br>

**[🌐 Live Demo](http://d1grae8znyykb3.cloudfront.net)** · **[🏗️ Architecture](#️-architecture)** · **[🎬 Demo Scenario](#-demo-scenario)** · **[⚙️ Setup](#️-setup--installation)**

</div>

---

## 📖 Overview

Mini Jira is a lightweight, team-based task management application — a stripped-down Jira / Trello — built and hosted **entirely on AWS**. Managers create and assign tasks across teams, while employees see only their own team's work, with isolation enforced server-side.

Beyond standard CRUD, the system exercises a genuinely cloud-native architecture: **event-driven messaging** (SNS, SQS, EventBridge), a **Lambda-based image pipeline**, and **CloudWatch monitoring** — all deployed for **high availability** across two Availability Zones behind an Application Load Balancer and CloudFront.

<div align="center">

| 🔐 Role-based access | 🌍 Multi-AZ high availability | ⚡ Event-driven | 📊 Full observability |
|:---:|:---:|:---:|:---:|
| Manager / Employee / Teams | 2 AZs · ALB · Auto Scaling | SNS · SQS · EventBridge | CloudWatch dashboards & alarms |

</div>

---

## 🌐 Live Application

> ### 👉 **http://d1grae8znyykb3.cloudfront.net**
>
> Clicking the link opens the live application directly — no additional configuration required.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Live Application](#-live-application)
- [Architecture](#️-architecture)
- [Tech Stack](#-tech-stack)
- [Team](#-team)
- [Repository Structure](#-repository-structure)
- [Setup & Installation](#️-setup--installation)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Demo Scenario](#-demo-scenario)
- [Demo Video](#-demo-video)

---

## 🏗️ Architecture

The application is deployed across two Availability Zones (`us-east-1a` and `us-east-1b`) in the `us-east-1` region for high availability.

<div align="center">

![Mini-Jira AWS Architecture](docs/architecture.png)

</div>

**Request flow:** Users reach the app through **CloudFront** (HTTPS), which forwards to an internet-facing **Application Load Balancer**. The ALB distributes traffic across two **EC2 instances** (Node.js backend on port `3000`) in private subnets — one per AZ — managed by an **Auto Scaling Group**.

<details>
<summary><strong>📋 Full service breakdown (click to expand)</strong></summary>

<br>

| Service | Role in the System |
|---|---|
| **CloudFront** | Global CDN and HTTPS termination in front of the ALB |
| **Application Load Balancer** | Distributes traffic across EC2 instances; runs health checks |
| **EC2 (Auto Scaling Group)** | Hosts the Node.js / Express backend across 2 AZs |
| **Cognito** | User pool for authentication; stores `role` and `teamId` |
| **DynamoDB** | Stores Users, Teams, Projects, Tasks, Comments, AuditLog — GSIs on `teamId` and `assigneeId` |
| **S3** (originals + resized) | Task image attachments; versioned originals + Lambda-generated thumbnails |
| **Lambda — imageResize** | Triggered on S3 PUT; resizes uploaded images |
| **Lambda — AssignmentWorker** | Drains SQS, writes audit logs, publishes CloudWatch custom metrics |
| **Lambda — DailyDigest** | Triggered daily by EventBridge; emails task deadline reminders |
| **SNS + SQS** | Fan-out for task-assignment events (email notification + queue for the worker) |
| **EventBridge Scheduler** | Runs the daily digest Lambda on a cron schedule |
| **CloudWatch** | Dashboard, custom metrics, and alarms |
| **VPC + NAT Gateway** | Public subnets for the ALB; private subnets for EC2; NAT for outbound traffic |
| **IAM** | Least-privilege roles for EC2 and each Lambda |

</details>

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology |
|:---:|:---:|
| **Frontend** | Next.js · React · Tailwind CSS · dnd-kit (Kanban) |
| **Backend** | Node.js · Express · AWS SDK v3 |
| **Database** | Amazon DynamoDB |
| **Auth** | Amazon Cognito (JWT) |
| **Storage** | Amazon S3 |
| **Compute** | EC2 · AWS Lambda |
| **Messaging** | SNS · SQS · EventBridge |
| **Delivery** | CloudFront · Application Load Balancer |
| **Monitoring** | Amazon CloudWatch |

</div>

---

## 👥 Team

| Member | Name | Responsibility |
|:---:|---|---|
| **M1** | Aida Anwar | Cloud Architect & DevOps — VPC, EC2/ASG, ALB, CloudFront, CloudWatch |
| **M2** | Aisha Amr | Backend Lead — Cognito, auth middleware, Users/Teams/Projects API |
| **M3** | Hamza Essam | Backend — Tasks/Comments API, S3 integration, audit log |
| **M4** | Seif Tarek | Serverless & Event-Driven — Lambdas, SNS/SQS, EventBridge |
| **M5** | Rawan Ehab | Frontend — Next.js, Kanban board, auth pages, manager views |
| **M6** | Fares Belal | QA, Documentation & Architecture diagram |

---

## 📁 Repository Structure

```
mini-jira-aws/
├── 📂 backend/      → Node.js / Express REST API
├── 📂 frontend/     → Next.js frontend
├── 📂 infra/        → AWS infrastructure notes & DynamoDB schema docs
├── 📂 lambdas/      → Lambda functions (imageResize, AssignmentWorker, DailyDigest)
└── 📂 docs/         → Architecture diagram & screenshots
```

---

## ⚙️ Setup & Installation

### Prerequisites

- **Node.js** v20 or higher
- **AWS CLI** configured with valid IAM credentials
- An **AWS account**

### Backend

```bash
cd backend
cp ../.env.example .env        # fill in your real values
npm install
npm run dev                    # → http://localhost:3000
```

### Frontend

```bash
cd frontend
cp .env.example .env.local     # set NEXT_PUBLIC_API_URL
npm install
npm run dev                    # → http://localhost:3001
```

---

## 🔑 Environment Variables

> ⚠️ No secrets are committed. `.env` and `.env.local` are gitignored. See `.env.example` for the full list.

| Variable | Description |
|---|---|
| `AWS_REGION` | Deployment region (`us-east-1`) |
| `COGNITO_USER_POOL_ID` | Cognito User Pool ID |
| `COGNITO_CLIENT_ID` | Cognito App Client ID |
| `DYNAMODB_TABLE_TASKS` | Tasks table name |
| `DYNAMODB_TABLE_AUDIT_LOG` | AuditLog table name |
| `S3_BUCKET_ORIGINALS` | Originals bucket name |
| `S3_BUCKET_RESIZED` | Resized (thumbnails) bucket name |
| `SNS_TOPIC_TASK_ASSIGNED` | TaskAssigned-Topic ARN |
| `NEXT_PUBLIC_API_URL` | Backend API base URL (frontend) |

---

## 🚀 Deployment

<details>
<summary><strong>View the 8-step deployment sequence</strong></summary>

<br>

1. **Network** — Provision the VPC, subnets, Internet Gateway, and NAT Gateway.
2. **Database** — Create the DynamoDB tables with GSIs on `teamId` and `assigneeId`.
3. **Auth** — Create the Cognito User Pool with `custom:role` and `custom:teamId` attributes.
4. **Storage + Pipeline** — Create the S3 buckets (originals + resized) and deploy the `imageResize` Lambda with an S3 PUT trigger.
5. **Events** — Deploy the `AssignmentWorker` and `DailyDigest` Lambdas; wire up SNS, SQS, and the EventBridge schedule.
6. **Compute** — Launch the EC2 Auto Scaling Group (Amazon Linux 2023, Node.js 20) behind the ALB across both AZs.
7. **Delivery** — Create the CloudFront distribution with the ALB as origin.
8. **Monitoring** — Build the CloudWatch dashboard and alarm.

</details>

---

## 🎬 Demo Scenario

The following works on demo day **without any code changes**:

| Step | User | Action | Result |
|:---:|---|---|---|
| 1️⃣ | **Ali** (Manager) | Creates Task A → Sara (Frontend), Task B → Omar (Backend) | Sees all tasks; can filter by team |
| 2️⃣ | **Sara** (Frontend) | Logs in | Sees **only Task A**; can update its status |
| 3️⃣ | **Omar** (Backend) | Logs in | Sees **only Task B**; can add a comment |

> 🔒 **Team isolation** is enforced server-side via the `teamId-index` GSI and Cognito JWT claims — an employee cannot fetch another team's task even by guessing its ID.

---

## 🎥 Demo Video

> 🚧 **TODO:** Add demo video link (YouTube unlisted or Google Drive) before the **22 May 2026** deadline.

---

<div align="center">

**📅 Deadline:** 22 May 2026 · **📚 Course:** Software Cloud Computing 2026 · **🎓 University:** GIU

<br>

*Built with ☁️ on AWS*

</div>
