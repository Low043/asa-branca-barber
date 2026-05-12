#!/bin/bash

SERVER_IP="136.248.100.48"
SERVER_USER="ubuntu"
DEST_DIR="~/asa-branca-barber"

FILES_TO_SEND=(
  "./dist/apps/api"
  "./dist/packages/db"
  "./package.json"
  "./pnpm-lock.yaml"
  "./pnpm-workspace.yaml"
  "./packages/db/package.json"
  "./packages/db/prisma"
  "./packages/db/prisma.config.js"
  "./.env"
)

rsync -avzP --delete --relative "${FILES_TO_SEND[@]}" $SERVER_USER@$SERVER_IP:$DEST_DIR
