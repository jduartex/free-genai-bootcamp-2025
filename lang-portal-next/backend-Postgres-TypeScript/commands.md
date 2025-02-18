# Stop and remove existing containers
docker-compose down -v

# Start fresh containers
docker-compose up -d

# Wait for PostgreSQL to be ready
sleep 5

# Reset the test database and create a new migration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/words_test" npx prisma migrate reset --force
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/words_test" npx prisma migrate dev --name init

# Apply migrations to test database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/words_test" npx prisma migrate reset --force

## Generate the Prisma client with the latest schema
npx prisma generate

# Run all tests
npm run test

# Or run with coverage
npm run test:coverage

# Or run in watch mode
npm run test:watch

npm run test src/__tests__/integration/groups.test.ts