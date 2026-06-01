#!/bin/sh
# Hapus image dan container lama yang tidak dipakai (lebih dari 24h)
docker system prune -af --filter until=24h 2>/dev/null

# Hapus image yang tidak terpakai (dangling + unreferenced)
docker image prune -af 2>/dev/null

# Hapus cache build yang sudah lama
docker builder prune -af 2>/dev/null
