import { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { env } from './env';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Language Learning Portal API',
      version: '1.0.0',
      description: 'API documentation for the Language Learning Portal',
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: env.NODE_ENV,
      },
    ],
  },
  apis: ['./src/routers/*.ts'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  // Swagger page
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Docs in JSON format
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}; 