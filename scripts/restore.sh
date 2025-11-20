#!/bin/bash

# SELMai Database Restore Script
# Restores a database backup

set -e

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide a backup file"
    echo "Usage: ./restore.sh <backup_file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -lh ./backups/selmai_backup_*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ Error: .env file not found!"
    exit 1
fi

echo "⚠️  WARNING: This will replace the current database!"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

echo "🔄 Starting database restore..."

# Decompress and restore
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | docker exec -i selmai-db-1 mysql \
        -u"$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME"
else
    cat "$BACKUP_FILE" | docker exec -i selmai-db-1 mysql \
        -u"$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME"
fi

echo "✅ Database restored successfully from: $BACKUP_FILE"
