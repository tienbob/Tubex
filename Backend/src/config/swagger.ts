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
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date and time when the warehouse was created'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date and time when the warehouse was last updated'
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
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'password123'
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'companyName', 'role'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'newuser@example.com'
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'securePassword123'
            },
            companyName: {
              type: 'string',
              example: 'Construction Ltd.'
            },
            role: {
              type: 'string',
              enum: ['admin', 'manager', 'staff', 'supplier', 'dealer'],
              example: 'admin'
            }
          }
        },
        EmployeeRegistrationRequest: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName', 'invitationCode'],
          properties: {
            email: {
              type: 'string', 
              format: 'email',
              example: 'employee@example.com'
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'securePassword123'
            },
            firstName: {
              type: 'string',
              example: 'John'
            },
            lastName: {
              type: 'string',
              example: 'Doe'
            },
            invitationCode: {
              type: 'string',
              example: 'ABCD1234'
            },
            role: {
              type: 'string',
              enum: ['admin', 'manager', 'staff'],
              default: 'staff'
            }
          }
        },
        OAuthRegistrationCompletionRequest: {
          type: 'object',
          required: ['tempUserId', 'company'],
          properties: {
            tempUserId: {
              type: 'string',
              format: 'uuid'
            },
            company: {
              type: 'object',
              required: ['name', 'type', 'taxId', 'businessLicense', 'address'],
              properties: {
                name: {
                  type: 'string',
                  example: 'ABC Construction'
                },
                type: {
                  type: 'string',
                  enum: ['supplier', 'dealer'],
                  example: 'dealer'
                },
                taxId: {
                  type: 'string',
                  example: 'TAX123456'
                },
                businessLicense: {
                  type: 'string',
                  example: 'BL789012'
                },
                address: {
                  type: 'string',
                  example: '123 Main St, City, Country'
                }
              }
            },
            userRole: {
              type: 'string',
              enum: ['admin', 'manager', 'staff'],
              default: 'admin'
            }
          }
        },
        InvitationCodeRequest: {
          type: 'object',
          required: ['companyId'],
          properties: {
            companyId: {
              type: 'string',
              format: 'uuid'
            }
          }
        },
        InvitationCodeResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success'
            },
            data: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'ABCD1234'
                },
                expiresAt: {
                  type: 'string',
                  format: 'date-time'
                },
                companyName: {
                  type: 'string'
                }
              }
            }
          }
        },
        CompanyVerificationRequest: {
          type: 'object',
          required: ['companyId', 'status'],
          properties: {
            companyId: {
              type: 'string',
              format: 'uuid'
            },
            status: {
              type: 'string',
              enum: ['active', 'rejected']
            },
            reason: {
              type: 'string',
              description: 'Required if status is rejected'
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
            firstName: {
              type: 'string'
            },
            lastName: {
              type: 'string'
            },
            role: {
              type: 'string',
              enum: ['admin', 'manager', 'staff', 'supplier', 'dealer']
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
            firstName: {
              type: 'string'
            },
            lastName: {
              type: 'string'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            role: {
              type: 'string',
              enum: ['admin', 'manager', 'staff', 'supplier', 'dealer']
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'pending', 'suspended']
            }
          }
        },
        UserListResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success'
            },
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/User'
              }
            },
            pagination: {
              $ref: '#/components/schemas/PaginationResponse'
            }
          }
        },
        UserDetailResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success'
            },
            data: {
              $ref: '#/components/schemas/User'
            }
          }
        },
        
        // Company Schemas
        Company: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            type: {
              type: 'string',
              enum: ['supplier', 'dealer']
            },
            status: {
              type: 'string',
              enum: ['active', 'pending', 'rejected', 'suspended']
            },
            taxId: {
              type: 'string'
            },
            businessLicense: {
              type: 'string'
            },
            address: {
              type: 'string'
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
              type: 'string',
              example: 'Steel Pipe 20mm'
            },
            description: {
              type: 'string',
              example: 'High-quality galvanized steel pipe'
            },
            base_price: {
              type: 'number',
              format: 'float',
              example: 15.99
            },
            unit: {
              type: 'string',
              example: 'meter'
            },
            supplier_id: {
              type: 'string',
              format: 'uuid'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'out_of_stock'],
              default: 'active'
            }
          }
        },
        ProductUpdateRequest: {
          type: 'object',
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
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'out_of_stock']
            }
          }
        },
        ProductListResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success'
            },
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Product'
              }
            },
            pagination: {
              $ref: '#/components/schemas/PaginationResponse'
            }
          }
        },
        ProductDetailResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success'
            },
            data: {
              $ref: '#/components/schemas/Product'
            }
          }
        },
        BulkStatusUpdateRequest: {
          type: 'object',
          required: ['productIds', 'status'],
          properties: {
            productIds: {
              type: 'array',
              items: {
                type: 'string',
                format: 'uuid'
              },
              description: 'List of product IDs to update'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'out_of_stock'],
              description: 'New status to apply to all selected products'
            }
          }
        },
        ProductPriceHistory: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            product_id: {
              type: 'string',
              format: 'uuid'
            },
            price: {
              type: 'number',
              format: 'float'
            },
            effective_date: {
              type: 'string',
              format: 'date-time'
            },
            created_by: {
              type: 'string',
              format: 'uuid'
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
              enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
            },
            total_amount: {
              type: 'number',
              format: 'float'
            },
            shipping_address: {
              type: 'string'
            },
            delivery_date: {
              type: 'string',
              format: 'date-time'
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
        OrderCreateRequest: {
          type: 'object',
          required: ['items', 'shipping_address'],
          properties: {
            customer_id: {
              type: 'string',
              format: 'uuid'
            },
            shipping_address: {
              type: 'string',
              example: '123 Main St, City, Country'
            },
            delivery_date: {
              type: 'string',
              format: 'date-time'
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['product_id', 'quantity'],
                properties: {
                  product_id: {
                    type: 'string',
                    format: 'uuid'
                  },
                  quantity: {
                    type: 'number',
                    format: 'float'
                  }
                }
              }
            },
            notes: {
              type: 'string'
            }
          }
        },
        OrderUpdateRequest: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
            },
            shipping_address: {
              type: 'string'
            },
            delivery_date: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        OrderListResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success'
            },
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Order'
              }
            },
            pagination: {
              $ref: '#/components/schemas/PaginationResponse'
            }
          }
        },
        OrderDetailResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success'
            },
            data: {
              $ref: '#/components/schemas/Order'
            }
          }
        },
        OrderStatusUpdateRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
            },
            notes: {
              type: 'string',
              description: 'Optional notes about the status change'
            }
          }
        },
        BulkProcessOrdersRequest: {
          type: 'object',
          required: ['orderIds', 'action'],
          properties: {
            orderIds: {
              type: 'array',
              items: {
                type: 'string',
                format: 'uuid'
              }
            },
            action: {
              type: 'string',
              enum: ['confirm', 'process', 'ship', 'deliver', 'cancel']
            },
            notes: {
              type: 'string'
            }
          }
        },
        
        // Inventory Schemas
        Inventory: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            product_id: {
              type: 'string',
              format: 'uuid'
            },
            warehouse_id: {
              type: 'string',
              format: 'uuid'
            },
            quantity: {
              type: 'number',
              format: 'float'
            },
            batch_id: {
              type: 'string',
              format: 'uuid'
            },
            last_updated: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        InventoryCreateRequest: {
          type: 'object',
          required: ['product_id', 'warehouse_id', 'quantity'],
          properties: {
            product_id: {
              type: 'string',
              format: 'uuid'
            },
            warehouse_id: {
              type: 'string',
              format: 'uuid'
            },
            quantity: {
              type: 'number',
              format: 'float'
            },
            batch_id: {
              type: 'string',
              format: 'uuid'
            }
          }
        },
        InventoryUpdateRequest: {
          type: 'object',
          required: ['product_id', 'quantity'],
          properties: {
            product_id: {
              type: 'string',
              format: 'uuid'
            },
            warehouse_id: {
              type: 'string',
              format: 'uuid'
            },
            quantity: {
              type: 'number',
              format: 'float',
              description: 'New quantity value or amount to adjust (when using adjust=true)'
            },
            batch_id: {
              type: 'string',
              format: 'uuid'
            },
            adjust: {
              type: 'boolean',
              description: 'If true, quantity value will be added/subtracted from current value instead of replacing it',
              default: false
            }
          }
        },
        InventoryAdjustRequest: {
          type: 'object',
          required: ['adjustment'],
          properties: {
            adjustment: {
              type: 'number',
              format: 'float',
              description: 'Amount to add (positive) or subtract (negative) from current quantity'
            },
            reason: {
              type: 'string',
              description: 'Reason for the adjustment'
            },
            reference: {
              type: 'string',
              description: 'Reference document ID (e.g., order ID)'
            }
          }
        },
        InventoryListResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success'
            },
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Inventory'
              }
            },
            pagination: {
              $ref: '#/components/schemas/PaginationResponse'
            }
          }
        },
        InventoryDetailResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success'
            },
            data: {
              $ref: '#/components/schemas/Inventory'
            }
          }
        },
        ProductInventorySummary: {
          type: 'object',
          properties: {
            product_id: {
              type: 'string',
              format: 'uuid'
            },
            product_name: {
              type: 'string'
            },
            total_quantity: {
              type: 'number',
              format: 'float'
            },
            locations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  warehouse_id: {
                    type: 'string',
                    format: 'uuid'
                  },
                  warehouse_name: {
                    type: 'string'
                  },
                  quantity: {
                    type: 'number',
                    format: 'float'
                  }
                }
              }
            }
          }
        },
        InventoryTransferRequest: {
          type: 'object',
          required: ['product_id', 'source_warehouse_id', 'destination_warehouse_id', 'quantity'],
          properties: {
            product_id: {
              type: 'string',
              format: 'uuid'
            },
            source_warehouse_id: {
              type: 'string',
              format: 'uuid'
            },
            destination_warehouse_id: {
              type: 'string',
              format: 'uuid'
            },
            batch_id: {
              type: 'string',
              format: 'uuid'
            },
            quantity: {
              type: 'number',
              format: 'float'
            },
            notes: {
              type: 'string'
            }
          }
        },
        InventoryAuditLog: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            inventory_id: {
              type: 'string',
              format: 'uuid'
            },
            product_id: {
              type: 'string',
              format: 'uuid'
            },
            warehouse_id: {
              type: 'string',
              format: 'uuid'
            },
            previous_quantity: {
              type: 'number',
              format: 'float'
            },
            new_quantity: {
              type: 'number',
              format: 'float'
            },
            change_type: {
              type: 'string',
              enum: ['addition', 'reduction', 'transfer_in', 'transfer_out', 'adjustment']
            },
            reference_id: {
              type: 'string',
              description: 'Reference to order ID or other document that caused the change'
            },
            created_by: {
              type: 'string',
              format: 'uuid'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        LowStockResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success'
            },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product_id: {
                    type: 'string',
                    format: 'uuid'
                  },
                  product_name: {
                    type: 'string'
                  },
                  current_quantity: {
                    type: 'number',
                    format: 'float'
                  },
                  threshold: {
                    type: 'number',
                    format: 'float'
                  },
                  warehouse_id: {
                    type: 'string',
                    format: 'uuid'
                  },
                  warehouse_name: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        ExpiringBatchesResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success'
            },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  batch_id: {
                    type: 'string',
                    format: 'uuid'
                  },
                  batch_number: {
                    type: 'string'
                  },
                  product_id: {
                    type: 'string',
                    format: 'uuid'
                  },
                  product_name: {
                    type: 'string'
                  },
                  expiry_date: {
                    type: 'string',
                    format: 'date'
                  },
                  remaining_days: {
                    type: 'integer'
                  },
                  quantity: {
                    type: 'number',
                    format: 'float'
                  },
                  warehouse_id: {
                    type: 'string',
                    format: 'uuid'
                  },
                  warehouse_name: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
          // Warehouse schemas are already defined at the beginning of the file
        
        // Batch Schemas
        Batch: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            product_id: {
              type: 'string',
              format: 'uuid'
            },
            batch_number: {
              type: 'string'
            },
            manufacturing_date: {
              type: 'string',
              format: 'date'
            },
            expiry_date: {
              type: 'string',
              format: 'date'
            },
            quantity: {
              type: 'number',
              format: 'float'
            },
            supplier_id: {
              type: 'string',
              format: 'uuid'
            }
          }
        },
        
        // Company Verification Schemas
        PendingVerificationResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success'
            },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  company_id: {
                    type: 'string',
                    format: 'uuid'
                  },
                  company_name: {
                    type: 'string'
                  },
                  company_type: {
                    type: 'string',
                    enum: ['supplier', 'dealer']
                  },
                  submitted_at: {
                    type: 'string',
                    format: 'date-time'
                  },
                  documents: {
                    type: 'object',
                    properties: {
                      business_license: {
                        type: 'string',
                        format: 'uri'
                      },
                      tax_id: {
                        type: 'string'
                      },
                      additional_docs: {
                        type: 'array',
                        items: {
                          type: 'string',
                          format: 'uri'
                        }
                      }
                    }
                  }
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
      }
    }
  },
  apis: [
    './src/services/**/routes.ts',
    './src/services/**/controller.ts',
    './src/services/**/*.routes.ts',
    './src/services/**/*.controller.ts',
    './src/app.ts'
  ]
};

export const swaggerSpec = swaggerJsdoc(options);