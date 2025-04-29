import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tubex API Documentation',
      version: '1.0.0',
      description: 'API documentation for Tubex B2B SaaS Platform'
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1'
      }
    ],
    components: {
      schemas: {
        AuthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success'
            },
            data: {
              type: 'object',
              properties: {
                userId: {
                  type: 'string',
                  format: 'uuid'
                },
                companyId: {
                  type: 'string',
                  format: 'uuid'
                },
                accessToken: {
                  type: 'string'
                },
                refreshToken: {
                  type: 'string'
                }
              }
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error'
            },
            message: {
              type: 'string'
            }
          }
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./src/services/**/routes.ts']
};

export const swaggerSpec = swaggerJsdoc(options);