#!/bin/bash
# Apaga todos os subscribers da Novu que contêm "bulk" no subscriberId ou name

NOVU_API_URL="${NOVU_API_URL:-http://localhost:3000}"
NOVU_API_KEY="${NOVU_API_KEY:?NOVU_API_KEY is required}"
PAGE=0
PAGE_SIZE=100
DELETED=0
FOUND=0

echo "Buscando subscribers com 'bulk' no nome..."

while true; do
  RESPONSE=$(curl -s -X GET \
    "${NOVU_API_URL}/v1/subscribers?page=${PAGE}&limit=${PAGE_SIZE}" \
    -H "Authorization: ApiKey ${NOVU_API_KEY}" \
    -H "Content-Type: application/json")

  # Extrai o total de items na página
  COUNT=$(echo "$RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
subscribers = data.get('data', [])
print(len(subscribers))
" 2>/dev/null)

  if [ -z "$COUNT" ] || [ "$COUNT" -eq 0 ]; then
    break
  fi

  # Filtra e apaga os que têm "bulk" (case-insensitive) no subscriberId ou firstName/lastName
  BULK_IDS=$(echo "$RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
subscribers = data.get('data', [])
for s in subscribers:
    sub_id = s.get('subscriberId', '')
    first = s.get('firstName', '') or ''
    last = s.get('lastName', '') or ''
    full_name = first + ' ' + last
    if 'bulk' in sub_id.lower() or 'bulk' in full_name.lower():
        print(sub_id)
" 2>/dev/null)

  for SUB_ID in $BULK_IDS; do
    FOUND=$((FOUND + 1))
    echo "  Apagando: ${SUB_ID}"
    DEL_RESP=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
      "${NOVU_API_URL}/v1/subscribers/${SUB_ID}" \
      -H "Authorization: ApiKey ${NOVU_API_KEY}")

    if [ "$DEL_RESP" -eq 200 ] || [ "$DEL_RESP" -eq 204 ]; then
      DELETED=$((DELETED + 1))
      echo "    OK (${DEL_RESP})"
    else
      echo "    ERRO (HTTP ${DEL_RESP}) — ${SUB_ID}"
    fi
  done

  # Se retornou menos que o page size, chegamos ao fim
  if [ "$COUNT" -lt "$PAGE_SIZE" ]; then
    break
  fi

  PAGE=$((PAGE + 1))
done

echo ""
echo "Concluído. Encontrados: ${FOUND} | Apagados: ${DELETED}"
