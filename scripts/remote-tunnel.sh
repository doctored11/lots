#!/usr/bin/env bash
# Обратный SSH-туннель: домашний ПК -> VPS (Франкфурт)
# После запуска ты с любого места заходишь на VPS и через него попадаешь на домашний ПК:
#   ssh vps  →  ssh -p 2222 turboEd@localhost
#
# Перед запуском отредактируй VPS_USER и VPS_HOST под свою VPS.

VPS_USER="root"
VPS_HOST="136.244.88.222" # VPS Франкфурт (marzban-main)
REMOTE_PORT=2222         # порт на VPS, через который торчит домашний ПК
KEY="$HOME/.ssh/id_ed25519"

echo "Туннель: домашний ПК -> $VPS_USER@$VPS_HOST (порт $REMOTE_PORT)"
echo "Держи это окно открытым. Переподключение при обрыве — автоматически."

while true; do
  ssh -N -R $REMOTE_PORT:localhost:22 \
      -i "$KEY" \
      -o ServerAliveInterval=30 \
      -o ServerAliveCountMax=3 \
      -o ExitOnForwardFailure=yes \
      "$VPS_USER@$VPS_HOST"
  echo "Обрыв. Переподключение через 10с..."
  sleep 10
done
