#!/usr/bin/env bash
# setup_database.sh
# Brings up the Postgres database for Payroll Microtechnique and guarantees
# working login accounts exist, whether this is a fresh volume or one you've
# used before.
#
# Usage:
#   ./setup_database.sh            # start DB, seed if needed, keep existing data
#   ./setup_database.sh --reset    # DANGER: wipes the Docker volume and starts clean
set -euo pipefail
cd "$(dirname "$0")"

if [[ "${1:-}" == "--reset" ]]; then
    echo "⚠️  --reset passed: stopping stack and deleting the Postgres volume..."
    docker-compose down -v
fi

echo "▶ Starting Postgres (docker-compose up -d postgres)..."
docker-compose up -d postgres

echo "▶ Waiting for Postgres to report healthy..."
for i in $(seq 1 30); do
    status=$(docker inspect --format='{{.State.Health.Status}}' payroll_postgres_db 2>/dev/null || echo "starting")
    if [[ "$status" == "healthy" ]]; then
        echo "✔ Postgres is healthy."
        break
    fi
    sleep 2
    if [[ $i -eq 30 ]]; then
        echo "✘ Postgres did not become healthy in time. Check: docker logs payroll_postgres_db"
        exit 1
    fi
done

echo "▶ Applying seed_default_users.sql (safe/idempotent, does not touch existing data)..."
docker cp seed_default_users.sql payroll_postgres_db:/tmp/seed_default_users.sql
docker exec -e PGPASSWORD=postgres payroll_postgres_db \
    psql -U postgres -d payroll_db -f /tmp/seed_default_users.sql

echo ""
echo "✅ Database is up on localhost:5433 (database: payroll_db)."
echo ""
echo "   Default Admin login:"
echo "     Email:    admin@microtechnique.local"
echo "     Password: Admin@12345"
echo ""
echo "   Default Employee login:"
echo "     Email:    employee@microtechnique.local"
echo "     Password: Employee@12345"
echo ""
echo "   SuperAdmin accounts already exist in the schema (nehal36936@gmail.com,"
echo "   microtechnique09@gmail.com) but their passwords are pre-hashed and not"
echo "   recoverable — use the Admin/Employee accounts above to test login, or"
echo "   register a new SuperAdmin-managed Admin via the app's /register page."
echo ""
echo "   Next: cd Backend && dotnet run   (backend listens on http://localhost:5125)"
