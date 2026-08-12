
- **Frontend:** Next.js
- **Backend:** Laravel
- **Database:** MySQL
- **Infrastructure:** Docker

## Getting Started

### Prerequisites
- Docker & Docker Compose

### Installation

1. Clone the repo
   git clone https://github.com/your-username/Restaurant-Management-System.git

2. Setup Backend environment
   cp backend/.env.example backend/.env

3. Start all services
   docker-compose up --build

4. Run migrations
   docker-compose exec backend php artisan migrate

## Access
| Service     | URL                   |
|-------------|-----------------------|
| Frontend    | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| phpMyAdmin  | http://localhost:8080 |