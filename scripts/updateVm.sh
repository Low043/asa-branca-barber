#!/bin/bash

SERVER_IP="136.248.100.48"
SERVER_USER="ubuntu"
DEST_DIR="~/asa-branca-barber"

FILES_TO_SEND=(
  "dist"
  "package.json"
  "pnpm-lock.yaml"
  "prisma"
  ".env"
)

rsync -avzP --delete "${FILES_TO_SEND[@]}" $SERVER_USER@$SERVER_IP:$DEST_DIR
