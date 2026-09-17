# AWS React Deployment POC

A small, professional-looking React + Vite dashboard used to demonstrate and compare two ways of deploying **the same React application** on AWS:

1. **AWS Amplify Hosting** – Git-based frontend hosting (GitHub → Amplify → HTTPS URL)
2. **AWS Container** – Docker → Amazon ECR → AWS App Runner → HTTPS URL

The application is intentionally simple: no backend, no database, no authentication, no API calls, and **no AWS credentials are required to run it locally**.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Technologies](#3-technologies)
4. [Prerequisites](#4-prerequisites)
5. [Local Setup](#5-local-setup)
6. [React Development](#6-react-development)
7. [Production Build](#7-production-build)
8. [Docker Build](#8-docker-build)
9. [Docker Local Testing](#9-docker-local-testing)
10. [GitHub Setup](#10-github-setup)
11. [AWS Amplify Deployment](#11-aws-amplify-deployment)
12. [Amazon ECR Setup](#12-amazon-ecr-setup)
13. [AWS App Runner Deployment](#13-aws-app-runner-deployment)
14. [Amplify vs Container Comparison](#14-amplify-vs-container-comparison)
15. [Optional ECS/Fargate Architecture](#15-optional-ecsfargate-architecture)
16. [Troubleshooting](#16-troubleshooting)
17. [Cleanup Instructions](#17-cleanup-instructions)
18. [Which Steps Need the AWS Console?](#18-which-steps-need-the-aws-console)
19. [Security Notes](#19-security-notes)

---

## 1. Project Overview

| Item | Value |
|---|---|
| Project name | `aws-react-deployment-poc` |
| Application | React + Vite (JavaScript) |
| Environment | AWS POC |
| Purpose | Compare AWS Amplify Hosting with Docker + ECR + App Runner |
| Local dev URL | http://localhost:5173 |
| Local Docker URL | http://localhost:8080 |

The page shows:

- A header and subtitle
- Application information (Application, Environment, Status)
- Two deployment option cards (AWS Amplify and AWS Container) with their deployment flow
- A deployment comparison table
- A footer

### Project structure

```text
aws-react-deployment-poc/
│
├── public/
│   └── favicon.svg
│
├── src/
│   ├── App.jsx          # Dashboard UI (header, info, cards, table, footer)
│   ├── App.css          # Component styles
│   ├── main.jsx         # React entry point
│   └── index.css        # Global styles / design tokens
│
├── .github/workflows/
│   └── deploy-ecs.yml   # GitHub Actions: build -> ECR -> ECS Express Mode
│
├── docs/
│   └── GITHUB_ACTIONS_ECS_SETUP.md
│
├── .dockerignore
├── .gitignore
├── Dockerfile           # Multi-stage build: Node 22 build -> Nginx runtime
├── README.md
├── amplify.yml          # AWS Amplify build specification
├── index.html           # Vite HTML entry
├── package.json
├── package-lock.json
└── vite.config.js
```

---

## 2. Architecture

### Option 1 – AWS Amplify Hosting

```text
React + Vite
     |
     v
   GitHub
     |
     v
AWS Amplify Hosting
     |
     v
 Live HTTPS URL
```

### Option 2 – AWS Container (Docker + ECR + App Runner)

```text
React + Vite
     |
     v
   Docker
     |
     v
Amazon ECR
     |
     v
AWS App Runner
     |
     v
 Live HTTPS URL
```

### Detailed deployment flow – Amplify

```text
Developer
   |
   | git push
   v
GitHub
   |
   v
AWS Amplify
   |
   +--> npm ci
   |
   +--> npm run build
   |
   v
dist/
   |
   v
Amplify Hosting
   |
   v
Browser
```

### Detailed deployment flow – Container

```text
Developer
   |
   v
React Source
   |
   v
Docker Build
   |
   v
Docker Image
   |
   v
Amazon ECR
   |
   v
AWS App Runner
   |
   v
Nginx
   |
   v
React Application
   |
   v
Browser
```

---

## 3. Technologies

| Technology | Role |
|---|---|
| React 18 | UI library |
| Vite 4 | Dev server and production bundler |
| JavaScript (ESM) | Application language |
| Node.js + npm | Tooling and dependency management |
| Docker | Container image build |
| Nginx (alpine) | Serves the production build inside the container |
| AWS Amplify Hosting | Git-based frontend hosting |
| Amazon ECR | Private container image registry |
| AWS App Runner | Managed container hosting with HTTPS |

Only `react`, `react-dom`, `vite` and `@vitejs/plugin-react` are used. No other runtime libraries are required.

> **Note on versions:** the project is pinned to Vite 4 so that it runs on Node.js 16 or newer. If you are on Node.js 20+ you can upgrade `vite` and `@vitejs/plugin-react` in `package.json` to their latest versions without any code changes. The Docker image always builds with Node 22, and AWS Amplify uses its own Node runtime, so both cloud paths are unaffected by your local Node version.

---

## 4. Prerequisites

### For local development

- **Node.js** 16.13 or newer (Node 20 LTS or 22 LTS recommended)
- **npm** (bundled with Node.js)
- **Git**

### For the Docker path

- **Docker Desktop** (Windows/macOS) or Docker Engine (Linux), running
- **AWS CLI v2** (only for pushing to Amazon ECR)
- An **AWS account** with permission to use Amazon ECR and AWS App Runner

### For the Amplify path

- A **GitHub** account
- An **AWS account** with permission to use AWS Amplify

Check your tools:

```bash
node --version
npm --version
git --version
docker --version
aws --version
```

---

## 5. Local Setup

Clone or copy the project, then install dependencies:

```bash
npm install
```

This creates `node_modules/` and (on first install) `package-lock.json`. Commit `package-lock.json` — both Amplify and the Dockerfile use `npm ci`, which requires it.

---

## 6. React Development

Start the Vite development server:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

Changes to files in `src/` are hot-reloaded in the browser. Stop the server with `Ctrl + C`.

---

## 7. Production Build

Create the optimized production build:

```bash
npm run build
```

Output is written to `dist/`:

```text
dist/
├── index.html
├── favicon.svg
└── assets/
    ├── index-<hash>.js
    └── index-<hash>.css
```

Optionally preview the production build locally (serves `dist/` on http://localhost:4173):

```bash
npm run preview
```

The build contains **no hardcoded AWS URLs** – the same `dist/` output works on Amplify, in the Docker/Nginx image, or on any static host.

---

## 8. Docker Build

The `Dockerfile` is a two-stage build:

1. **Stage 1 (`node:22-alpine`)** – runs `npm ci` and `npm run build` to produce `dist/`
2. **Stage 2 (`nginx:alpine`)** – copies `dist/` into Nginx's web root and serves it on port **80**

Build the image (Docker must be running):

```bash
docker build -t aws-react-deployment-poc .
```

Verify the image exists:

```bash
docker images aws-react-deployment-poc
```

The final image only contains Nginx and the static files – Node.js and `node_modules` are not included.

---

## 9. Docker Local Testing

### Run the container

```bash
docker run -d -p 8080:80 --name aws-react-deployment-poc aws-react-deployment-poc
```

Open:

```text
http://localhost:8080
```

You should see exactly the same dashboard as the Vite development server.

### Check the container

```bash
docker ps
```

```bash
docker logs aws-react-deployment-poc
```

### Stop the container

```bash
docker stop aws-react-deployment-poc
```

### Remove the container

```bash
docker rm aws-react-deployment-poc
```

### (Optional) Remove the image

```bash
docker rmi aws-react-deployment-poc
```

---

## 10. GitHub Setup

Amplify deploys from a Git repository, so push the project to GitHub first.

1. Create a new **empty** repository on GitHub named `aws-react-deployment-poc` (no README, no .gitignore – the project already has them).
2. From the project folder run:

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "Initial AWS React deployment POC"
```

```bash
git branch -M main
```

```bash
git remote add origin https://github.com/<GITHUB_USER>/aws-react-deployment-poc.git
```

```bash
git push -u origin main
```

Replace `<GITHUB_USER>` with your GitHub username or organisation.

Check the working tree is clean before pushing:

```bash
git status
```

`.gitignore` already excludes `node_modules/`, `dist/` and every `.env*` file, so no build output or secrets are committed.

---

## 11. AWS Amplify Deployment

### Flow

```text
Local React Project
       ↓
Git Repository
       ↓
GitHub
       ↓
AWS Amplify
       ↓
Connect Repository
       ↓
Select main branch
       ↓
Build
       ↓
Deploy
       ↓
Amplify HTTPS URL
```

### Build specification (`amplify.yml`)

The repository already contains a Vite-compatible `amplify.yml`:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - "**/*"
  cache:
    paths:
      - node_modules/**/*
```

Amplify detects this file automatically when the repository is connected.

### Steps (AWS Console)

1. **Create a GitHub repository** and **push this project** (see [GitHub Setup](#10-github-setup)).
2. Sign in to the AWS Console and open **AWS Amplify**.
3. Choose **Create new app** (also shown as *Deploy an app* / *Host web app*).
4. Select **GitHub** as the source and click **Next**.
5. Authorize AWS Amplify to access your GitHub account when prompted (you may install the Amplify GitHub App and grant it access to just this repository).
6. Select the repository **`aws-react-deployment-poc`**.
7. Select the **`main`** branch.
8. On the *App settings* page, verify that Amplify detected the build settings from `amplify.yml`. The build commands should be `npm ci` and `npm run build`, with `dist` as the output directory.
9. Click **Save and deploy**.
10. Wait for the *Provision → Build → Deploy → Verify* pipeline to finish (typically 2–4 minutes).
11. Open the generated Amplify URL. It has the form `https://main.<app-id>.amplifyapp.com` – the exact value is generated by AWS.

From now on, every `git push` to `main` triggers a new Amplify build and deployment automatically.

---

## 12. Amazon ECR Setup

Amazon ECR is the private registry that stores the Docker image App Runner will run.

Use placeholders throughout – **never commit a real account ID or credentials**:

| Placeholder | Meaning | Example format |
|---|---|---|
| `<AWS_ACCOUNT_ID>` | Your 12-digit AWS account ID | `123456789012` |
| `<AWS_REGION>` | The region you deploy to | `us-east-1`, `ap-south-1`, `eu-west-1` |

### 12.1 Create the ECR repository (AWS Console)

1. Open the AWS Console and go to **Amazon ECR**.
2. In the left menu choose **Repositories** (under *Private registry*).
3. Click **Create repository**.
4. Leave visibility as **Private**.
5. Repository name: **`aws-react-deployment-poc`**.
6. Leave the remaining options at their defaults (you may enable *Scan on push* if you like).
7. Click **Create repository**.
8. Note the repository URI shown in the console. It has the form:

```text
<AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/aws-react-deployment-poc
```

(Equivalent CLI command: `aws ecr create-repository --repository-name aws-react-deployment-poc --region <AWS_REGION>`)

### 12.2 Configure the AWS CLI

Make sure the AWS CLI is installed and configured with an IAM identity that has ECR push permissions (for example the managed policy `AmazonEC2ContainerRegistryPowerUser`). Configure it with:

```bash
aws configure
```

Enter your access key, secret key, default region and output format when prompted. **Do not put these values in any project file.**

Confirm the identity being used:

```bash
aws sts get-caller-identity
```

### 12.3 Authenticate Docker with ECR

```bash
aws ecr get-login-password --region <AWS_REGION> | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com
```

Expected output: `Login Succeeded`.

### 12.4 Build the image (if not already built)

```bash
docker build -t aws-react-deployment-poc .
```

### 12.5 Tag the image for ECR

```bash
docker tag aws-react-deployment-poc:latest <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/aws-react-deployment-poc:latest
```

### 12.6 Push the image to ECR

```bash
docker push <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/aws-react-deployment-poc:latest
```

### 12.7 Verify

In the ECR console, open the repository and confirm an image with tag `latest` is listed. Or via CLI:

```bash
aws ecr list-images --repository-name aws-react-deployment-poc --region <AWS_REGION>
```

> **Apple Silicon / ARM users:** App Runner runs x86_64 (amd64) images. If you build on an ARM machine, build with `docker build --platform linux/amd64 -t aws-react-deployment-poc .` before tagging and pushing.

---

## 13. AWS App Runner Deployment

> **Update (September 2026):** AWS App Runner stopped accepting new customers on
> April 30, 2026, so accounts without an existing App Runner service cannot create one.
> Use the automated **GitHub Actions → Amazon ECR → Amazon ECS Express Mode** pipeline
> instead — setup guide: [docs/GITHUB_ACTIONS_ECS_SETUP.md](docs/GITHUB_ACTIONS_ECS_SETUP.md).
> The steps below are kept for accounts that still have App Runner access.

AWS App Runner pulls the image from ECR, runs it, and exposes it behind a managed HTTPS endpoint – no servers, load balancers or certificates to manage.

### Flow

```text
AWS Console
    ↓
App Runner
    ↓
Create service
    ↓
Container registry
    ↓
Amazon ECR
    ↓
aws-react-deployment-poc
    ↓
latest
```

### Steps (AWS Console)

1. Open the AWS Console and go to **AWS App Runner** (use the **same region** as your ECR repository).
2. Click **Create service**.
3. **Source and deployment**
   - Repository type: **Container registry**
   - Provider: **Amazon ECR**
   - Container image URI: click **Browse** and select repository **`aws-react-deployment-poc`** and image tag **`latest`**
   - Deployment trigger: **Manual** (or **Automatic** if you want every new `latest` push to redeploy)
   - ECR access role: choose **Create new service role** (App Runner creates `AppRunnerECRAccessRole` so it can pull from ECR)
   - Click **Next**
4. **Configure service**
   - Service name: **`aws-react-deployment-poc`**
   - Virtual CPU / memory: the smallest option (e.g. 0.25 vCPU / 0.5 GB) is more than enough for Nginx serving static files
   - **Port: `80`** – this must match the `EXPOSE 80` in the Dockerfile
   - Environment variables: none required
   - Leave auto scaling, health check (TCP on port 80 is fine), networking and security at their defaults
   - Click **Next**
5. **Review and create** → click **Create & deploy**.
6. Wait until the service status becomes **Running** (usually 3–5 minutes for the first deployment).
7. Open the **Default domain** shown on the service page. App Runner generates a public HTTPS URL of the form `https://<random-id>.<region>.awsapprunner.com` – the exact value is assigned by AWS at creation time.

### Redeploying a new version

1. Rebuild, tag and push the image to ECR again (sections 12.4–12.6).
2. In the App Runner console open the service and click **Deploy** (if the deployment trigger is *Manual*). With *Automatic* triggers, pushing a new `latest` tag redeploys by itself.

---

## 14. Amplify vs Container Comparison

| Feature | Amplify | Container |
|---|---|---|
| React Hosting | Yes | Yes |
| Docker | No | Yes |
| Amazon ECR | No | Yes |
| App Runner | No | Yes |
| Git-based Deployment | Yes | Optional |
| Infrastructure Control | Lower | Higher |
| Main Purpose | Frontend Hosting | Container Deployment |

### When to use AWS Amplify

Use Amplify when the primary requirement is **frontend / web application hosting** and a **simple Git-based deployment workflow**. You connect a repository, Amplify builds on every push, and it handles the CDN, HTTPS and branch previews for you. There is no Docker image to maintain.

### When to use the Container approach

Use the Docker → ECR → App Runner approach when the application needs to be **packaged and deployed as a container**, or when container-based deployment is already **part of the platform requirement** (for example, the rest of the platform runs on ECR/App Runner/ECS and you want one consistent artifact type). You control the runtime (Nginx here), the base image and the build, and the same image could later run on ECS, EKS or elsewhere.

Neither option is universally better – choose the one that matches how your team ships software and what your platform standards require.

---

## 15. Optional ECS/Fargate Architecture

This POC deploys the container with **AWS App Runner** because it is the simplest managed way to run a container with HTTPS. The **same Docker image** in ECR could later be deployed with Amazon ECS on AWS Fargate if you need more control (custom VPC networking, sidecars, service discovery, ALB routing rules, etc.):

```text
Amazon ECR
    ↓
ECS Cluster
    ↓
Fargate Service
    ↓
Application Load Balancer
    ↓
React Container
```

High-level steps (not implemented in this POC):

1. Create an ECS cluster (Fargate launch type).
2. Create a task definition that references the ECR image and exposes container port 80.
3. Create an ECS service running the task, attached to an Application Load Balancer target group.
4. Point a Route 53 record and an ACM certificate at the load balancer for HTTPS.

Nothing in the Dockerfile or the image needs to change for this expansion.

---

## 16. Troubleshooting

### `npm install` failure

- Check your Node.js version: `node --version` (must be 16.13 or newer).
- Make sure you are in the project root (where `package.json` is).
- Delete `node_modules` and `package-lock.json` **only if necessary**, then run `npm install` again.
- If you are behind a corporate proxy, configure npm's proxy settings.

### `npm run dev` – port 5173 already in use

Vite automatically picks the next free port (e.g. 5174) and prints the URL in the terminal. Or stop whatever is using 5173.

### Docker build failure

Check that Docker is installed and the daemon is running:

```bash
docker --version
```

```bash
docker info
```

If `docker info` reports it cannot connect to the daemon, start Docker Desktop and wait until it shows *Running*. Also make sure `package-lock.json` exists – `npm ci` fails without it.

### Port 8080 already used

Map the container to another host port:

```bash
docker run -d -p 8081:80 --name aws-react-deployment-poc aws-react-deployment-poc
```

Then open:

```text
http://localhost:8081
```

### Container name already in use

If `docker run` says the name is already in use, remove the old container first:

```bash
docker rm -f aws-react-deployment-poc
```

### ECR authentication failure

Check:

- AWS CLI installation (`aws --version`)
- AWS CLI credentials (`aws sts get-caller-identity` should return your account)
- AWS region (the `--region` in the login command must match the repository's region)
- The ECR repository exists and the name matches exactly
- IAM permissions (`ecr:GetAuthorizationToken`, `ecr:BatchCheckLayerAvailability`, `ecr:PutImage`, `ecr:InitiateLayerUpload`, `ecr:UploadLayerPart`, `ecr:CompleteLayerUpload`)

Never paste credentials into project files or documentation.

### App Runner deployment failure

Check:

- The ECR repository and region match the App Runner service region
- The image tag (`latest`) exists in the repository
- The service **Port is `80`**
- The ECR access role was created (App Runner needs permission to pull the image)
- The application logs and deployment logs in the App Runner console (*Logs* tab)

### Amplify build failure

Check:

- `package.json` scripts (`build` must be `vite build`)
- `package-lock.json` is committed (Amplify runs `npm ci`)
- `amplify.yml` is in the repository root and `baseDirectory` is `dist`
- The Node.js version used by the Amplify build image (you can pin it in *App settings → Build settings → Build image settings*, or add `- nvm use 20` to the `preBuild` commands)
- The build logs in the Amplify console for the exact failing command

### The page loads but looks unstyled or blank

- Hard-refresh the browser (`Ctrl + Shift + R`).
- For Docker, rebuild the image after code changes – the image contains a snapshot of `dist/`.

---

## 17. Cleanup Instructions

> **Cost warning:** AWS resources may incur charges depending on the selected services and configuration (App Runner charges for provisioned/active compute, ECR for storage, Amplify for build minutes and hosting). Verify the current AWS pricing before running long-term resources, and delete everything you no longer need.

### Local

```bash
docker stop aws-react-deployment-poc
```

```bash
docker rm aws-react-deployment-poc
```

```bash
docker rmi aws-react-deployment-poc
```

### AWS Amplify

```text
AWS Amplify
 → App (aws-react-deployment-poc)
 → App settings → General settings → Delete app
```

### AWS App Runner

```text
AWS App Runner
 → Services → aws-react-deployment-poc
 → Actions → Delete service
```

Delete the App Runner service **before** the ECR repository so nothing is still pulling the image.

### Amazon ECR

```text
Amazon ECR
 → Repositories → aws-react-deployment-poc
 → Delete repository (confirm deleting all images)
```

### Optional

- Delete the `AppRunnerECRAccessRole` IAM role if it was created only for this POC and nothing else uses it.
- Delete the GitHub repository if it was created only for this POC.

---

## 18. Which Steps Need the AWS Console?

| Step | Needs AWS account / Console? |
|---|---|
| `npm install`, `npm run dev`, `npm run build` | No |
| `docker build`, `docker run` (local test) | No |
| GitHub repository + `git push` | No (GitHub only) |
| Amplify: connect repo, build, deploy | **Yes** (AWS Console + GitHub authorization) |
| ECR: create repository | **Yes** (AWS Console or CLI) |
| ECR: `docker login` / `docker push` | **Yes** (AWS CLI credentials) |
| App Runner: create service | **Yes** (AWS Console) |
| Cleanup of AWS resources | **Yes** (AWS Console) |

Everything up to and including local Docker testing works completely offline from AWS.

---

## 19. Security Notes

- No AWS credentials, account IDs, API keys, tokens or passwords are stored in this repository. All AWS-specific values in this README are placeholders (`<AWS_ACCOUNT_ID>`, `<AWS_REGION>`, `<GITHUB_USER>`).
- `.gitignore` and `.dockerignore` both exclude `.env` and `.env.*` files so they are never committed or copied into the image.
- AWS CLI credentials belong in `~/.aws/credentials` (created by `aws configure`) or in environment variables on your machine / CI runner – never in project files.
- If environment variables are needed in the future, document them with placeholder values only, e.g. `VITE_API_BASE_URL=<your-api-url>`.
