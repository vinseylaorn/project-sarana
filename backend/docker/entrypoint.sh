#!/bin/sh
set -e

echo "Waiting for MySQL to be ready..."
until php -r "
try {
    new PDO('mysql:host=${DB_HOST};port=${DB_PORT}', '${DB_USERNAME}', '${DB_PASSWORD}');
    exit(0);
} catch (Exception \$e) {
    exit(1);
}
" 2>/dev/null; do
  echo "MySQL is unavailable - sleeping 2s"
  sleep 2
done
echo "MySQL is up - continuing"

php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

php artisan migrate --force

exec "$@"