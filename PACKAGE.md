# Packaging Westbridge as One Deployable File

You can package the **entire platform** (Next.js app + Postgres + ERPNext) into a single archive and run it on any machine or cloud that has Docker.

## What You Get

- **One archive file** (e.g. `westbridge-platform.zip`)
- **One command** to start everything: `./start.sh` or `docker compose -f docker-compose.platform.yml up -d`
- Runs on **any device, server, or cloud** where Docker and Docker Compose are installed (Linux, macOS, Windows, AWS, GCP, Azure, etc.)

## Create the Single Archive

From the project root (e.g. `/Users/westbridgeinc/v1/westbridge`):

```bash
cd /path/to/westbridge
zip -r ../westbridge-platform.zip . \
  -x "node_modules/*" \
  -x ".next/*" \
  -x ".git/*" \
  -x ".venv/*" \
  -x "lib/generated/*" \
  -x ".env" \
  -x "*.log" \
  -x ".DS_Store"
```

Or from the parent directory:

```bash
cd /path/to/v1
zip -r westbridge-platform.zip westbridge \
  -x "westbridge/node_modules/*" \
  -x "westbridge/.next/*" \
  -x "westbridge/.git/*" \
  -x "westbridge/.venv/*" \
  -x "westbridge/lib/generated/*" \
  -x "westbridge/.env" \
  -x "westbridge/*.log" \
  -x "westbridge/.DS_Store"
```

The archive will be **one file** (e.g. `westbridge-platform.zip`). Copy it to any host.

## Run Anywhere

1. **Install Docker** (and Docker Compose v2) on the target machine:  
   https://docs.docker.com/get-docker/

2. **Unzip the archive:**
   ```bash
   unzip westbridge-platform.zip -d westbridge
   cd westbridge
   ```

3. **Start the full platform:**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```
   Or without the script:
   ```bash
   docker compose -f docker-compose.platform.yml up -d --build
   ```

4. **Open in browser:**
   - App: **http://localhost:3000**
   - ERPNext: **http://localhost:8080** (complete first-time site setup in the UI if needed)

## What Runs in the Stack

| Service        | Port | Role                          |
|----------------|------|-------------------------------|
| **app**        | 3000 | Westbridge Next.js app        |
| **postgres**   | 5432 | App database (accounts, etc.) |
| **erpnext**    | 8080 | ERPNext (Frappe v16)          |
| **mariadb**    | 3307 | ERPNext database              |
| **redis**      | 6380 | ERPNext cache/queue           |
| **erpnext-worker** | — | ERPNext background jobs   |

## Cloud / Server Notes

- **Linux server:** Install Docker, copy the zip, unzip, run `./start.sh`. Use a process manager or systemd if you want the stack to restart on reboot (e.g. `restart: unless-stopped` is already set in the compose file).
- **Cloud (AWS, GCP, Azure):** Use a VM with Docker, copy the archive (e.g. S3 → download, or scp), unzip, run `./start.sh`. Optionally put the app behind a load balancer and use environment variables for production (e.g. `DATABASE_URL`, `ERPNEXT_URL`).
- **Ports:** Ensure 3000 and 8080 (and 5432 if you need external DB access) are open in the firewall/security group.

## Optional: Save the Archive to Downloads

```bash
cd /path/to/v1
zip -r ~/Downloads/westbridge-platform.zip westbridge \
  -x "westbridge/node_modules/*" \
  -x "westbridge/.next/*" \
  -x "westbridge/.git/*" \
  -x "westbridge/.venv/*" \
  -x "westbridge/lib/generated/*" \
  -x "westbridge/.env" \
  -x "westbridge/.DS_Store"
```

Then copy `~/Downloads/westbridge-platform.zip` to any device or server and follow the “Run Anywhere” steps above.
