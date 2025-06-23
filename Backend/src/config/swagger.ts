import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tubex API Documentation',
      version: '2.0.0', // Updated version for 2025
      description: 'API documentation for Tubex B2B SaaS Platform for Construction Materials',
      contact: {
        name: 'Tubex Support',
        email: 'support@tubex.com',
        url: 'https://tubex.com/support'
      }
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1'
      },
      {
        url: '/api/v2',
        description: 'API v2 (2025)'
      }
    ],
    components: {
      schemas: {
        // User Schema
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the user'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address of the user'
            },
            password_hash: {
              type: 'string',
              description: 'Hashed password'
            },
            role: {
              type: 'string',
              enum: ['admin', 'manager', 'staff'],
              description: 'Role of the user in the system'
            },
            status: {
              type: 'string',
              description: 'User account status'
            },
            company_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the company the user belongs to'
            },
            metadata: {
              type: 'object',
              description: 'Additional metadata for the user'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Date and time when the user was created'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Date and time when the user was last updated'
            }
          }
        },
        
        // Company Schema
        Company: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the company'
            },
            name: {
              type: 'string',
              description: 'Name of the company'
            },
            type: {
              type: 'string',
              enum: ['dealer', 'supplier'],
              description: 'Type of company'
            },
            tax_id: {
              type: 'string',
              description: 'Tax ID of the company'
            },
            business_license: {
              type: 'string',
              description: 'Business license number'
            },
            address: {
              type: 'object',
              properties: {
                street: {
                  type: 'string',
                  description: 'Street address'
                },
                city: {
                  type: 'string',
                  description: 'City'
                },
                province: {
                  type: 'string',
                  description: 'Province or state'
                },
                postalCode: {
                  type: 'string',
                  description: 'Postal or ZIP code'
                }
              }
            },
            business_category: {
              type: 'string',
              description: 'Category of business'
            },
            employee_count: {
              type: 'integer',
              description: 'Number of employees'
            },
            year_established: {
              type: 'integer',
              description: 'Year the company was established'
            },
            contact_phone: {
              type: 'string',
              description: 'Contact phone number'
            },
            subscription_tier: {
              type: 'string',
              enum: ['free', 'basic', 'premium'],
              description: 'Subscription tier of the company'
            },
            status: {
              type: 'string',
              enum: ['pending_verification', 'active', 'suspended', 'rejected'],
              description: 'Status of the company'
            },
            metadata: {
              type: 'object',
              description: 'Additional metadata for the company'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Date and time when the company was created'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Date and time when the company was last updated'
            }
          }
        },
        
        // Warehouse Schema
        Warehouse: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the warehouse'
            },
            name: {
              type: 'string',
              description: 'Name of the warehouse'
            },
            address: {
              type: 'string',
              description: 'Physical address of the warehouse'
            },
            company_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the company that owns this warehouse'
            },
            capacity: {
              type: 'number',
              description: 'Storage capacity of the warehouse'
            },
            contact_info: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Contact person name'
                },
                phone: {
                  type: 'string',
                  description: 'Contact phone number'
                },
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'Contact email address'
                }
              }
            },
            type: {
              type: 'string',
              enum: ['main', 'secondary', 'distribution', 'storage'],
              description: 'Type of warehouse'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'under_maintenance'],
              description: 'Current status of the warehouse'
            },
            notes: {
              type: 'string',
              description: 'Additional notes about the warehouse'
            },
            metadata: {
              type: 'object',
              description: 'Additional metadata for the warehouse'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Date and time when the warehouse was created'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Date and time when the warehouse was last updated'
            }
          }
        },

        // Product Schema
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the product'
            },
            name: {
              type: 'string',
              description: 'Name of the product'
            },
            description: {
              type: 'string',
              description: 'Product description'
            },
            base_price: {
              type: 'number',
              description: 'Base price of the product'
            },
            unit: {
              type: 'string',
              description: 'Unit of measurement'
            },
            supplier_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the supplier company'
            },
            status: {
              type: 'string',
              description: 'Product status'
            },
            metadata: {
              type: 'object',
              description: 'Additional metadata for the product'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Date and time when the product was created'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Date and time when the product was last updated'
            }
          }
        },

        // Order Schema
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the order'
            },
            customerId: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the customer'
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
              description: 'Order status'
            },
            paymentStatus: {
              type: 'string',
              enum: ['pending', 'paid', 'failed', 'refunded'],
              description: 'Payment status'
            },
            paymentMethod: {
              type: 'string',
              description: 'Payment method'
            },
            totalAmount: {
              type: 'number',
              description: 'Total order amount'
            },
            deliveryAddress: {
              type: 'object',
              properties: {
                street: {
                  type: 'string',
                  description: 'Street address'
                },
                city: {
                  type: 'string',
                  description: 'City'
                },
                province: {
                  type: 'string',
                  description: 'Province or state'
                },
                postalCode: {
                  type: 'string',
                  description: 'Postal or ZIP code'
                }
              },
              description: 'Delivery address'
            },
            metadata: {
              type: 'object',
              description: 'Additional metadata for the order'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date and time when the order was created'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date and time when the order was last updated'
            }
          }
        },

        // Quote Schema
        Quote: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the quote'
            },
            customerId: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the customer who created the quote'
            },
            createdById: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the user who created the quote'
            },
            quoteNumber: {
              type: 'string',
              description: 'Unique quote number'
            },
            status: {
              type: 'string',
              enum: ['DRAFT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED'],
              description: 'Status of the quote'
            },
            totalAmount: {
              type: 'number',
              description: 'Total amount of the quote'
            },
            validUntil: {
              type: 'string',
              format: 'date-time',
              description: 'Validity date of the quote'
            },
            deliveryAddress: {
              type: 'string',
              description: 'Delivery address for the quote'
            },
            metadata: {
              type: 'object',
              description: 'Additional metadata for the quote'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date and time when the quote was created'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date and time when the quote was last updated'
            }
          }
        },

        // QuoteItem Schema
        QuoteItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the quote item'
            },
            quoteId: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the associated quote'
            },
            productId: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the product'
            },
            quantity: {
              type: 'number',
              description: 'Quantity of the product'
            },
            unitPrice: {
              type: 'number',
              description: 'Unit price of the product'
            },
            discount: {
              type: 'number',
              description: 'Discount applied to the product'
            },
            notes: {
              type: 'string',
              description: 'Additional notes for the quote item'
            }
          }
        },

        // OrderItem Schema
        OrderItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the order item'
            },
            orderId: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the associated order'
            },
            productId: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the product'
            },
            quantity: {
              type: 'number',
              description: 'Quantity of the product'
            },
            unitPrice: {
              type: 'number',
              description: 'Unit price of the product'
            },
            discount: {
              type: 'number',
              description: 'Discount applied to the product'
            },
            metadata: {
              type: 'object',
              description: 'Additional metadata for the order item'
            }
          }
        },

        // UserAuditLog Schema
        UserAuditLog: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the audit log entry'
            },
            target_user_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the target user'
            },
            performed_by_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the user who performed the action'
            },
            action: {
              type: 'string',
              enum: ['role_update', 'status_update', 'removal'],
              description: 'Type of action performed'
            },
            changes: {
              type: 'object',
              properties: {
                previous: {
                  type: 'object',
                  properties: {
                    role: {
                      type: 'string',
                      description: 'Previous role'
                    },
                    status: {
                      type: 'string',
                      description: 'Previous status'
                    }
                  }
                },
                new: {
                  type: 'object',
                  properties: {
                    role: {
                      type: 'string',
                      description: 'New role'
                    },
                    status: {
                      type: 'string',
                      description: 'New status'
                    }
                  }
                }
              },
              description: 'Changes made'
            },
            reason: {
              type: 'string',
              description: 'Reason for the change'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Date and time when the action was performed'
            }
          }
        },

        // OrderHistory Schema
        OrderHistory: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the order history entry'
            },
            order_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the order'
            },
            user_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the user who made the change'
            },
            previous_status: {
              type: 'string',
              description: 'Previous order status'
            },
            new_status: {
              type: 'string',
              description: 'New order status'
            },
            notes: {
              type: 'string',
              description: 'Notes about the change'
            },
            metadata: {
              type: 'object',
              description: 'Additional metadata for the order history entry'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Date and time when the change was made'
            }
          }
        },

        // MongoDB Models
        MongoOrder: {
          type: 'object',
          properties: {
            orderId: {
              type: 'string',
              description: 'Unique identifier for the order'
            },
            companyId: {
              type: 'string',
              description: 'ID of the company'
            },
            customerId: {
              type: 'string',
              description: 'ID of the customer'
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: {
                    type: 'string',
                    description: 'ID of the product'
                  },
                  quantity: {
                    type: 'number',
                    description: 'Quantity of the product'
                  },
                  unitPrice: {
                    type: 'number',
                    description: 'Unit price of the product'
                  },
                  discount: {
                    type: 'number',
                    description: 'Discount amount'
                  },
                  metadata: {
                    type: 'object',
                    description: 'Additional metadata for the order item'
                  }
                }
              }
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
              description: 'Order status'
            },
            paymentStatus: {
              type: 'string',
              enum: ['pending', 'paid', 'failed', 'refunded'],
              description: 'Payment status'
            },
            paymentMethod: {
              type: 'string',
              description: 'Payment method'
            },
            deliveryAddress: {
              type: 'object',
              properties: {
                street: {
                  type: 'string',
                  description: 'Street address'
                },
                city: {
                  type: 'string',
                  description: 'City'
                },
                province: {
                  type: 'string',
                  description: 'Province or state'
                },
                postalCode: {
                  type: 'string',
                  description: 'Postal or ZIP code'
                }
              }
            },
            metadata: {
              type: 'object',
              description: 'Additional metadata for the order'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date and time when the order was created'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date and time when the order was last updated'
            }
          }
        },

        // Analytics Schema
        Analytics: {
          type: 'object',
          properties: {
            eventType: {
              type: 'string',
              description: 'Type of analytics event'
            },
            companyId: {
              type: 'string',
              description: 'ID of the company'
            },
            userId: {
              type: 'string',
              description: 'ID of the user'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Time when the event occurred'
            },
            data: {
              type: 'object',
              description: 'Event data'
            },
            metadata: {
              type: 'object',
              description: 'Additional metadata for the analytics event'
            }
          }
        },

        // AuditLog Schema
        AuditLog: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              description: 'Type of action performed'
            },
            entityType: {
              type: 'string',
              description: 'Type of entity that was affected'
            },
            entityId: {
              type: 'string',
              description: 'ID of the entity that was affected'
            },
            companyId: {
              type: 'string',
              description: 'ID of the company'
            },
            userId: {
              type: 'string',
              description: 'ID of the user who performed the action'
            },
            changes: {
              type: 'object',
              description: 'Changes made'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Time when the action was performed'
            }
          }
        },

        // CustomerActivity Schema
        CustomerActivity: {
          type: 'object',
          properties: {
            customerId: {
              type: 'string',
              description: 'ID of the customer'
            },
            companyId: {
              type: 'string',
              description: 'ID of the company'
            },
            activityType: {
              type: 'string',
              description: 'Type of activity'
            },
            description: {
              type: 'string',
              description: 'Description of the activity'
            },
            metadata: {
              type: 'object',
              description: 'Additional metadata for the activity'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Time when the activity occurred'
            }
          }
        },
        
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
                  format: 'uuid',
                  description: 'Unique identifier for the user'
                },
                companyId: {
                  type: 'string',
                  format: 'uuid',
                  description: 'Company ID the user belongs to'
                },
                role: {
                  type: 'string',
                  enum: ['admin', 'manager', 'staff', 'supplier', 'dealer'],
                  description: 'User role in the system'
                },
                accessToken: {
                  type: 'string',
                  description: 'JWT token for API access'
                },
                refreshToken: {
                  type: 'string',
                  description: 'Token used to obtain new access tokens'
                }
              }
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
            },
            code: {
              type: 'integer',
              description: 'Error code for client reference'
            }
          }
        },
        PaginationResponse: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Total number of records available'
            },
            page: {
              type: 'integer',
              description: 'Current page number'
            },
            limit: {
              type: 'integer',
              description: 'Number of records per page'
            },
            pages: {
              type: 'integer',
              description: 'Total number of pages available'
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['success'],
              example: 'success'
            },
            message: {
              type: 'string'
            }
          }
        },
        HealthCheckResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'healthy'
            },
            environment: {
              type: 'string',
              example: 'production'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
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
        description: 'API endpoints for user authentication and registration'
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
      },
      {
        name: 'Warehouses',
        description: 'Warehouse management operations'
      },
      {
        name: 'Batches',
        description: 'Batch management operations'
      },
      {
        name: 'CompanyVerification',
        description: 'Endpoints for company verification processes'
      },
      {
        name: 'Reports',
        description: 'Reporting and analytics endpoints'
      },
      {
        name: 'Health',
        description: 'System health and monitoring endpoints'
      },
      {
        name: 'Quotes',
        description: 'Quote management operations'
      }
    ],
    paths: {
      // Health check endpoint
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'API health check endpoint',
          description: 'Returns the health status of the API',
          responses: {
            200: {
              description: 'API is healthy',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/HealthCheckResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/quotes': {
        post: {
          summary: 'Create a new quote',
          tags: ['Quotes'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Quote'
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Quote created successfully'
            }
          }
        },
        get: {
          summary: 'Get all quotes',
          tags: ['Quotes'],
          responses: {
            200: {
              description: 'List of quotes'
            }
          }
        }
      },
      '/quotes/{id}': {
        get: {
          summary: 'Get a quote by ID',
          tags: ['Quotes'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string'
              }
            }
          ],
          responses: {
            200: {
              description: 'Quote details'
            }
          }
        },
        put: {
          summary: 'Update a quote',
          tags: ['Quotes'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string'
              }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Quote'
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Quote updated successfully'
            }
          }
        },
        delete: {
          summary: 'Delete a quote',
          tags: ['Quotes'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string'
              }
            }
          ],
          responses: {
            200: {
              description: 'Quote deleted successfully'
            }
          }
        }
      },
      '/quotes/{id}/convert': {
        post: {
          summary: 'Convert a quote to an order',
          tags: ['Quotes'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string'
              }
            }
          ],
          responses: {
            201: {
              description: 'Quote converted to order successfully'
            }
          }
        }
      }
    }  },  apis: [
    './src/services/auth/routes.ts',
    './src/services/company/routes.ts',
    './src/services/user/routes.ts',
    './src/app.ts'
  ]
};

export const swaggerSpec = swaggerJsdoc(options);
