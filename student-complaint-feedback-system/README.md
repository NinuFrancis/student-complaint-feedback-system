# Campus Voice – Student Complaint & Feedback Management System

A full-stack DevOps internship project with a React frontend, Node.js/Express REST API, Docker containers, GitHub Actions, GHCR, and AWS EC2 deployment.

> **Important demo limitation:** Complaints are stored in backend memory. They reset whenever the backend container restarts or is recreated. No database is used, as permitted by the assignment brief. The Admin Dashboard is a demonstration interface, not an authenticated production admin system. Do not enter real confidential student information.

## 1. Features

### Student view
- Submit a complaint with student name, ID, category, title, and description.
- View recent complaints and their current status.

### Admin demo view
- View and search all complaints.
- Filter by status.
- Update complaint status and add an administrative response.
- Delete a complaint.

### REST API
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/complaints` | List complaints; optional `?status=Resolved` or `?category=Library` |
| GET | `/api/complaints/:id` | Get one complaint |
| POST | `/api/complaints` | Create a complaint |
| PUT | `/api/complaints/:id` | Update status and/or admin response |
| DELETE | `/api/complaints/:id` | Delete a complaint |

## 2. Project structure

```text
student-complaint-feedback-system/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── index.html
│   └── package.json
├── backend/
│   ├── server.js
│   ├── Dockerfile
│   └── package.json
├── deploy/
│   └── docker-compose.yml
├── .github/
│   └── workflows/
│       └── ci-cd.yml
├── .gitignore
└── README.md
```

## 3. Run locally without Docker

Requirements: Node.js 20 or later and npm.

### Start backend
Open a terminal:
```bash
cd backend
npm install
npm start
```
Backend: `http://localhost:5000`  
Health check: `http://localhost:5000/api/health`

### Start frontend
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the Vite URL shown in the terminal, normally `http://localhost:5173`. Vite proxies `/api` requests to the backend at port 5000.

## 4. Run locally using Docker Compose

From the project root:
```bash
docker build -t campus-voice-backend ./backend
docker build -t campus-voice-frontend ./frontend
```

For a local compose run, create a temporary `.env` file in the project root:
```env
IMAGE_PREFIX=campus-voice
IMAGE_TAG=local
```
Tag the images to match:
```bash
docker tag campus-voice-backend campus-voice-backend:local
docker tag campus-voice-frontend campus-voice-frontend:local
```
Then run:
```bash
docker compose -f deploy/docker-compose.yml --env-file .env up -d
```
Open `http://localhost`. Backend health check: `http://localhost:5000/api/health`.

Stop:
```bash
docker compose -f deploy/docker-compose.yml --env-file .env down
```

## 5. Upload the project to GitHub

1. Sign in at https://github.com.
2. Click **New repository**.
3. Repository name: `student-complaint-feedback-system`.
4. Choose **Public** (as required for evaluator access, unless your institution says otherwise).
5. Do not initialize with a README, `.gitignore`, or license because this project already contains them.
6. Create the repository.
7. Extract this ZIP file on your computer.
8. Open PowerShell or a terminal inside the extracted project folder.
9. Run the following commands, replacing `YOUR-GITHUB-USERNAME` with your GitHub username:

```bash
git init
git add .
git commit -m "Initial commit - Campus Voice DevOps project"
git branch -M main
git remote add origin https://github.com/YOUR-GITHUB-USERNAME/student-complaint-feedback-system.git
git push -u origin main
```

Refresh the GitHub repository page. Confirm that `frontend`, `backend`, `deploy`, and `.github/workflows/ci-cd.yml` are visible.

If Git is not installed, install Git from https://git-scm.com/downloads and reopen the terminal. GitHub may ask you to authenticate in a browser or with a personal access token; never put a token in a source file.

## 6. Prepare AWS EC2

Create an Ubuntu EC2 instance (Ubuntu 22.04 or 24.04 is suitable). In its security group, add inbound rules:

| Type | Port | Source |
|---|---:|---|
| SSH | 22 | Your public IP only |
| HTTP | 80 | `0.0.0.0/0` |
| Custom TCP | 5000 | Your public IP (or restrict as appropriate) |

Port 5000 is exposed for direct backend health/API testing. The frontend also reaches the backend through Nginx at `/api`. For a production deployment, restrict or remove public access to port 5000.

Connect to EC2 using SSH, then install Docker:
```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
```
Log out and reconnect so the Docker group change takes effect. Verify:
```bash
docker --version
docker compose version
```

## 7. Configure GitHub Actions secrets

In the GitHub repository, open **Settings → Secrets and variables → Actions → New repository secret**. Add:

| Secret name | Value |
|---|---|
| `EC2_HOST` | EC2 public IPv4 address or DNS |
| `EC2_USER` | Usually `ubuntu` for Ubuntu EC2 |
| `EC2_SSH_KEY` | Full contents of the private `.pem` key |
| `GHCR_USERNAME` | Your GitHub username |
| `GHCR_TOKEN` | GitHub Personal Access Token (classic) with `read:packages` scope |

The workflow uses the built-in `GITHUB_TOKEN` to publish images. The EC2 token is used only to pull images. Keep all secrets in GitHub Secrets; never commit private keys or tokens.

To create the pull token: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token. Select `read:packages`. If your organization requires SSO, authorize the token as instructed by GitHub.

## 8. Enable and run CI/CD

1. Push the project to the `main` branch.
2. Open the repository's **Actions** tab.
3. Select **Build, Push and Deploy Campus Voice**.
4. Inspect the `build-and-push` job. It builds frontend and backend images and pushes them to GHCR.
5. Inspect the `deploy` job. It copies the Compose file to EC2, logs in to GHCR, pulls both images, and starts the containers.
6. A green check mark means the workflow completed. If it fails, open the failed step's log and correct the reported issue.

The workflow file is `.github/workflows/ci-cd.yml`. It runs on pushes to `main` and can also be started manually using **Run workflow**.

## 9. Verify deployment

Replace `EC2_PUBLIC_IP` with the EC2 public IPv4 address:

- Frontend: `http://EC2_PUBLIC_IP`
- Backend health endpoint: `http://EC2_PUBLIC_IP:5000/api/health`
- Complaints API: `http://EC2_PUBLIC_IP:5000/api/complaints`
- Frontend-proxied API: `http://EC2_PUBLIC_IP/api/complaints`

On EC2:
```bash
docker compose -f ~/campus-voice/docker-compose.yml ps
docker logs campus-voice-frontend
docker logs campus-voice-backend
```

Check that:
- [ ] Frontend loads in a browser.
- [ ] A new complaint can be submitted.
- [ ] The complaint appears in the recent list and admin dashboard.
- [ ] Admin can update status and save a response.
- [ ] Backend health endpoint returns JSON with `"status":"ok"`.
- [ ] Both images appear in the repository's GitHub Packages / Packages area.
- [ ] GitHub Actions workflow succeeds.
- [ ] Application is accessible using the EC2 public IP.
- [ ] No credentials, `.pem` files, or tokens are present in the repository.

## 10. Submission details

| Item | What to submit |
|---|---|
| Project Name | Campus Voice – Student Complaint & Feedback Management System |
| GitHub Repository | `https://github.com/YOUR-GITHUB-USERNAME/student-complaint-feedback-system` |
| Frontend URL | `http://EC2_PUBLIC_IP` |
| Backend API URL | `http://EC2_PUBLIC_IP:5000/api/health` |
| CI/CD Status | Successful GitHub Actions workflow run |

## Notes and troubleshooting

- **In-memory data:** Sample records are loaded when the backend starts. New complaints are not permanent and are lost if the backend restarts.
- **Port 80 already in use:** Stop the service using port 80 or change the host-side port mapping in `deploy/docker-compose.yml`.
- **GitHub Actions cannot SSH:** Check `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`, port 22 access, and that the matching public key is installed in EC2's `authorized_keys`.
- **GHCR pull denied:** Check `GHCR_USERNAME`, `GHCR_TOKEN` and the token's `read:packages` permission. Confirm that the packages are published.
- **Frontend shows an API error:** Check `docker compose ps`, backend logs, and that the backend container is healthy.
- **Do not share your private SSH key or personal access token.**

This is an educational demonstration project. The admin view has no login/role-based access control and should not be used with real student complaints or sensitive information.
