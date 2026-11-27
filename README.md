# Sarana restaurant management system

## Run locally with Docker Compose

From the repository root, prepare Laravel's environment on a fresh checkout:

```sh
cp -n backend/.env.example backend/.env
```

If `APP_KEY` in `backend/.env` is empty, generate a key with
`openssl rand -base64 32` and set `APP_KEY=base64:<generated value>`.

```sh
docker compose up --build -d
docker compose logs -f backend
```

Laravel runs migrations during startup. On a **fresh test database**, initialize
the demo administrator after migrations finish:

```sh
docker compose exec backend php artisan db:seed --force
```

Open [the frontend](http://localhost:3000) and sign in with `supperadmin` and
`password123` to test [role settings](http://localhost:3000/settings/role).
Laravel listens on port 8000. [phpMyAdmin](http://localhost:8080) accepts the
database credentials from the root `.env` (`DB_USERNAME` and `DB_PASSWORD`).
Without overrides, these default to `sarana` and `local-test`.

Run `docker compose down` to stop the stack. Database data and uploads persist
in named volumes.
