#!/bin/bash
set -e

cd /home/qadmin/LiteLLM/w1router/
git pull origin main --force

cd /home/qadmin/LiteLLM/w1router/ui/litellm-dashboard/
/home/qadmin/LiteLLM/w1router/ui/litellm-dashboard/build_ui.sh

cd /home/qadmin/LiteLLM/w1router/
docker compose build --no-cache litellm
docker compose down
docker compose up -d
