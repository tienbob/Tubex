import mongoose from 'mongoose';

// Order Schema - For flexible order data and history
const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  companyId: { type: String, required: true, index: true },
  customerId: { type: String, required: true, index: true },
  items: [{
    productId: String,
    quantity: Number,
    unitPrice: Number,
    discount: Number,
    metadata: mongoose.Schema.Types.Mixed
  }],
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: String,
  deliveryAddress: {
    street: String,
    city: String,
    province: String,
    postalCode: String
  },
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Analytics Schema - For tracking user behavior and system metrics
const analyticsSchema = new mongoose.Schema({
  eventType: { type: String, required: true, index: true },
  companyId: { type: String, required: true, index: true },
  userId: String,
  timestamp: { type: Date, default: Date.now },
  data: mongoose.Schema.Types.Mixed,
  metadata: mongoose.Schema.Types.Mixed
});

// Audit Log Schema - For tracking system changes and user actions
const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: String, required: true },
  companyId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  changes: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
});

// Customer Activity Schema - For tracking customer interactions
const customerActivitySchema = new mongoose.Schema({
  customerId: { type: String, required: true, index: true },
  companyId: { type: String, required: true, index: true },
  activityType: { type: String, required: true },
  description: String,
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
});

// Create indexes
orderSchema.index({ createdAt: 1 });
analyticsSchema.index({ timestamp: 1 });
auditLogSchema.index({ timestamp: 1 });
customerActivitySchema.index({ timestamp: 1 });

// Export models
export const Order = mongoose.model('Order', orderSchema);
export const Analytics = mongoose.model('Analytics', analyticsSchema);
export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export const CustomerActivity = mongoose.model('CustomerActivity', customerActivitySchema);