#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
echo "=== Nurbook Marketplace ==="
if [ ! -f server/.env ]; then
  cp server/.env.example server/.env
  echo "Criado server/.env — preencha credenciais M-Pesa quando tiver."
fi
echo ""
echo "A arrancar em http://localhost:3001"
echo ""
exec node server/index.js
