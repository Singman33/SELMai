#!/bin/bash

# SELMai Database Backup Script
# Creates a backup of the MariaDB database

set -e

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="selmai_backup_${TIMESTAMP}.sql"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ Error: .env file not found!"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🗄️  Starting database backup..."

# Create backup using docker exec
docker exec selmai-db-1 mysqldump \
    -u"$DB_USER" \
    -p"$DB_PASSWORD" \
    "$DB_NAME" > "$BACKUP_DIR/$BACKUP_FILE"

# Compress the backup
gzip "$BACKUP_DIR/$BACKUP_FILE"

echo "✅ Backup completed: $BACKUP_DIR/${BACKUP_FILE}.gz"

# Keep only last 7 backups
echo "🧹 Cleaning old backups (keeping last 7)..."
cd "$BACKUP_DIR"
ls -t selmai_backup_*.sql.gz | tail -n +8 | xargs -r rm --

echo "✅ Backup process completed successfully!"
