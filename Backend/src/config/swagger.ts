import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tubex API Documentation',
      version: '1.0.0',
      description: 'API documentation for Tubex B2B SaaS Platform for Construction Materials'
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1'
      }
    ],
    components: {
      schemas: {
        // Authentication Schemas
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
                role: {
                  type: 'string',
                  enum: ['admin', 'manager', 'staff']
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
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email'
            },
            password: {
              type: 'string',
              format: 'password'
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'companyName', 'role'],
          properties: {
            email: {
              type: 'string',
              format: 'email'
            },
            password: {
              type: 'string',
              format: 'password'
            },
            companyName: {
              type: 'string'
            },
            role: {
              type: 'string',
              enum: ['admin', 'manager', 'staff']
            }
          }
        },
        
        // User Schemas
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            role: {
              type: 'string',
              enum: ['admin', 'manager', 'staff']
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'pending', 'suspended']
            },
            company_id: {
              type: 'string',
              format: 'uuid'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        UserUpdateRequest: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email'
            },
            role: {
              type: 'string',
              enum: ['admin', 'manager', 'staff']
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'pending', 'suspended']
            }
          }
        },
        
        // Product Schemas
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            description: {
              type: 'string'
            },
            base_price: {
              type: 'number',
              format: 'float'
            },
            unit: {
              type: 'string'
            },
            supplier_id: {
              type: 'string',
              format: 'uuid'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'out_of_stock']
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        ProductCreateRequest: {
          type: 'object',
          required: ['name', 'base_price', 'unit'],
          properties: {
            name: {
              type: 'string'
            },
            description: {
              type: 'string'
            },
            base_price: {
              type: 'number',
              format: 'float'
            },
            unit: {
              type: 'string'
            },
            supplier_id: {
              type: 'string',
              format: 'uuid'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'out_of_stock']
            }
          }
        },
        
        // Order Schemas
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            customer_id: {
              type: 'string',
              format: 'uuid'
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
            },
            total_amount: {
              type: 'number',
              format: 'float'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/OrderItem'
              }
            }
          }
        },
        OrderItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            order_id: {
              type: 'string',
              format: 'uuid'
            },
            product_id: {
              type: 'string',
              format: 'uuid'
            },
            quantity: {
              type: 'number',
              format: 'float'
            },
            unit_price: {
              type: 'number',
              format: 'float'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        
        // Common Schemas
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
        },
        PaginationResponse: {
          type: 'object',
          properties: {
            total: {
              type: 'integer'
            },
            page: {
              type: 'integer'
            },
            limit: {
              type: 'integer'
            },
            pages: {
              type: 'integer'
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
    }],
    tags: [
      {
        name: 'Authentication',
        description: 'API endpoints for user authentication'
      },
      {
        name: 'Users',
        description: 'User management operations'
      },
      {
        name: 'Products',
        description: 'Product management operations'
      },
      {
        name: 'Orders',
        description: 'Order management operations'
      },
      {
        name: 'Inventory',
        description: 'Inventory management operations'
      }
    ]
  },
  apis: [
    './src/services/**/routes.ts',
    './src/services/**/controller.ts'
  ]
};

export const swaggerSpec = swaggerJsdoc(options);