# backend-postgres-typescript

The backend-postgres-typescript project is a backend server for a language learning portal. It is built using TypeScript and follows a structured approach to organize its components. Here is an overview of its main components:

## 1. Project Structure

### Configuration Files:
- `.env`, `.env.test`: Environment variables.
- `tsconfig.json`: TypeScript configuration.
- `vitest.config.ts`: Vitest configuration for testing.
- `package.json`: Project dependencies and scripts.
- `Dockerfile`, `docker-compose.yml`: Docker configuration for containerization.
- `.github/workflows/`: GitHub Actions workflows for CI/CD.

### Source Code (`src/`):

#### Routers (`routers/`):
Defines the tRPC routers for different API endpoints.
- `appRouter.ts`: Combines all routers.
- `groupsRouter.ts`, `wordsRouter.ts`, `studySessionsRouter.ts`, `statisticsRouter.ts`: Specific routers for handling groups, words, study sessions, and statistics.

#### Middleware (`middleware/`):
Custom middleware for various functionalities.
- `compressionMiddleware.ts`: Handles response compression.
- `loggingMiddleware.ts`: Logs requests and errors.
- `cacheMiddleware.ts`: Implements caching using Redis.
- `validationMiddleware.ts`: Validates requests using Zod.
- `securityMiddleware.ts`: Sets up security headers and rate limiting.
- `metricsMiddleware.ts`: Collects metrics for monitoring.
- `errorMiddleware.ts`: Handles errors globally.

#### Services (`services/`):
Contains business logic independent of tRPC.
- `wordService.ts`, `groupService.ts`, `studySessionService.ts`, `statisticsService.ts`: Services for handling words, groups, study sessions, and statistics.

#### Prisma (`prisma/`):
Prisma ORM configuration and client initialization.
- `client.ts`: Initializes Prisma client.
- `schema.prisma`: Defines the database schema.
- `seed.ts`: Seeds the database with initial data.

#### Utils (`utils/`):
Utility functions and helpers.
- `logger.ts`: Configures logging using Winston.
- `errorHandler.ts`: Custom error handling.
- `dateUtils.ts`: Date and time utilities.

#### Routes (`routes/`):
Express routes for health checks and monitoring.
- `healthCheck.ts`: Basic health check endpoint.
- `monitoringRouter.ts`: Detailed health check and monitoring.
- `metricsRouter.ts`: Exposes metrics for Prometheus.

#### Context (`context.ts`):
Creates the context for tRPC, including Prisma client and services.

## 2. Testing

### Tests (`__tests__/`):
Organized into unit and integration tests.
- `integration/`: Tests for API endpoints and database interactions.
- `unit/`: Tests for individual services and utilities.
- `fixtures/`: Sample data for testing.
- `setup.ts`: Sets up and cleans up test data.

## 3. Database

### Prisma ORM:
Used for database interactions with PostgreSQL.
- `schema.prisma`: Defines models for words, groups, study sessions, and related entities.
- `client.ts`: Initializes Prisma client.
- `seed.ts`: Seeds the database with initial data.

## 4. API Documentation

### Swagger:
API documentation generated using Swagger.
- `swagger.ts`: Configures Swagger for API documentation.

## 5. CI/CD

### GitHub Actions:
Workflows for continuous integration and deployment.
- `ci.yml`: Runs tests and builds the project on push and pull requests.
- `docker.yml`: Builds and pushes Docker images.

## 6. Docker

### Dockerfile:
Defines the Docker image for the backend server.

### docker-compose.yml:
Configures Docker services for PostgreSQL and Redis.

## 7. Scripts

### Commands (`commands.md`):
Contains useful Docker and Prisma commands for development and testing.

Based on the provided Backend-Technical-Specs.md, here are the endpoints that need to be implemented and tested:

### API Endpoints

1. **GET /api/dashboard/last_study_session**
2. **GET /api/dashboard/study_progress**
3. **GET /api/dashboard/quick-stats**
4. **GET /api/study_activities/:id**
5. **GET /api/study_activities/:id/study_sessions**
6. **POST /api/study_activities**
7. **GET /api/words**
8. **GET /api/words/:id**
9. **GET /api/groups**
10. **GET /api/groups/:id**
11. **GET /api/groups/:id/words**
12. **GET /api/groups/:id/study_sessions**
13. **GET /api/study_sessions**
14. **GET /api/study_sessions/:id**
15. **GET /api/study_sessions/:id/words**
16. **POST /api/reset_history**
17. **POST /api/full_reset**
18. **POST /api/study_sessions/:id/words/:word_id/review**
19. **POST /api/study_sessions**
20. **POST /api/groups**
21. **POST /api/words**

### Implementation and Testing Checklist

- **GET /api/dashboard/last_study_session**
  - [x] Implement
  - [x] Unit Test
  - [x] Integration Test

- **GET /api/dashboard/study_progress**
  - [x] Implement
  - [x] Unit Test
  - [x] Integration Test

- **GET /api/dashboard/quick-stats**
  - [x] Implement
  - [x] Unit Test
  - [x] Integration Test

- **GET /api/study_activities/:id**
  - [x] Implement
  - [x] Unit Test
  - [x] Integration Test

- **GET /api/study_activities/:id/study_sessions**
  - [x] Implement
  - [x] Unit Test
  - [x] Integration Test

- **POST /api/study_activities**
  - [x] Implement
  - [x] Unit Test
  - [x] Integration Test

- **GET /api/words**
  - [x] Implement
  - [x] Unit Test
  - [x] Integration Test

- **GET /api/words/:id**
  - [x] Implement
  - [x] Unit Test
  - [x] Integration Test

- **GET /api/groups**
  - [x] Implement
  - [x] Unit Test
  - [x] Integration Test

- **GET /api/groups/:id**
  - [x] Implement
  - [x] Unit Test
  - [x] Integration Test

- **GET /api/groups/:id/words**
  - [x] Implement
  - [x] Unit Test
  - [x] Integration Test

- **GET /api/groups/:id/study_sessions**
  - [x] Implement
  - [x] Unit Test
  - [x] Integration Test

- **GET /api/study_sessions**
  - [x] Implement
  - [x] Unit Test
  - [x] Integration Test

- **GET /api/study_sessions/:id**
  - [x] Implement
  - [x] Unit Test
  - [x] Integration Test

- **GET /api/study_sessions/:id/words**
  - [x] Implement
  - [x] Unit Test
  - [x] Integration Test

- **POST /api/reset_history**
  - [x] Implement
  - [x] Unit Test
  - [x] Integration Test

- **POST /api/full_reset**
  - [x] Implement
  - [x] Unit Test
  - [x] Integration Test

- **POST /api/study_sessions/:id/words/:word_id/review**
  - [x] Implement
  - [x] Unit Test
  - [x] Integration Test

- **POST /api/study_sessions**
  - [x] Implement
  - [x] Unit Test
  - [x] Integration Test

- **POST /api/groups**
  - [x] Implement
  - [x] Unit Test
  - [x] Integration Test

- **POST /api/words**
  - [x] Implement
  - [x] Unit Test
  - [x] Integration Test