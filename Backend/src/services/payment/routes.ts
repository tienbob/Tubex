import express from 'express';
import { paymentController } from './controller';
import { paymentValidators } from './validators';
import { authenticate, validate } from '../../middleware';
import { asyncHandler } from '../../middleware/asyncHandler';
import { Request, Response, NextFunction } from 'express';

export const paymentRoutes = express.Router();

/**
 * @swagger
 * /api/v1/payments:
 *   post:
 *     summary: Create a new payment
 *     description: Create a new payment record for an order or invoice
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionId
 *               - customerId
 *               - amount
 *               - paymentMethod
 *               - paymentType
 *               - paymentDate
 *             properties:
 *               transactionId:
 *                 type: string
 *               orderId:
 *                 type: string
 *                 format: uuid
 *               invoiceId:
 *                 type: string
 *                 format: uuid
 *               customerId:
 *                 type: string
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [credit_card, bank_transfer, cash, check, paypal, stripe, other]
 *               paymentType:
 *                 type: string
 *                 enum: [order_payment, invoice_payment, refund, advance_payment, adjustment]
 *               paymentDate:
 *                 type: string
 *                 format: date-time
 *               externalReferenceId:
 *                 type: string
 *               notes:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Payment created successfully
 */
interface CreatePaymentRequest extends Request {
    body: {
        transactionId: string;
        orderId?: string;
        invoiceId?: string;
        customerId: string;
        amount: number;
        paymentMethod: string;
        paymentType: string;
        paymentDate: string;
        externalReferenceId?: string;
        notes?: string;
        metadata?: Record<string, any>;
    };
}

paymentRoutes.post(
        '/',        authenticate,
        validate(paymentValidators.createPayment),
        asyncHandler((req: CreatePaymentRequest, res: Response, next: NextFunction) => {
                return paymentController.createPayment(req, res);
        })
);

/**
 * @swagger
 * /api/v1/payments:
 *   get:
 *     summary: Get all payments
 *     description: Retrieve a list of all payments with optional filtering
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by order ID
 *       - in: query
 *         name: invoiceId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by invoice ID
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Filter by customer ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by payment date (start)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by payment date (end)
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *         description: Filter by payment method
 *       - in: query
 *         name: reconciliationStatus
 *         schema:
 *           type: string
 *         description: Filter by reconciliation status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of payments
 */
paymentRoutes.get(
    '/',
    authenticate,
    validate(paymentValidators.getPayments),
    asyncHandler(paymentController.getPayments)
);

/**
 * @swagger
 * /api/v1/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     description: Retrieve a single payment by its ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment details
 *       404:
 *         description: Payment not found
 */
paymentRoutes.get(
    '/:id',
    authenticate,
    validate(paymentValidators.getPaymentById),
    asyncHandler(paymentController.getPaymentById)
);

/**
 * @swagger
 * /api/v1/payments/{id}:
 *   put:
 *     summary: Update payment
 *     description: Update an existing payment record
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Payment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionId:
 *                 type: string
 *               orderId:
 *                 type: string
 *                 format: uuid
 *               invoiceId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [credit_card, bank_transfer, cash, check, paypal, stripe, other]
 *               paymentType:
 *                 type: string
 *                 enum: [order_payment, invoice_payment, refund, advance_payment, adjustment]
 *               paymentDate:
 *                 type: string
 *                 format: date-time
 *               externalReferenceId:
 *                 type: string
 *               notes:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Payment updated successfully
 *       404:
 *         description: Payment not found
 */
paymentRoutes.put(
    '/:id',
    authenticate,
    validate(paymentValidators.updatePayment),
    asyncHandler(paymentController.updatePayment)
);

/**
 * @swagger
 * /api/v1/payments/{id}:
 *   delete:
 *     summary: Delete payment
 *     description: Delete a payment record
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment deleted successfully
 *       404:
 *         description: Payment not found
 */
paymentRoutes.delete(
    '/:id',
    authenticate,
    validate(paymentValidators.deletePayment),
    asyncHandler(paymentController.deletePayment)
);

/**
 * @swagger
 * /api/v1/payments/{id}/reconcile:
 *   post:
 *     summary: Reconcile payment
 *     description: Mark a payment as reconciled or change its reconciliation status
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Payment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reconciliationStatus
 *             properties:
 *               reconciliationStatus:
 *                 type: string
 *                 enum: [unreconciled, reconciled, disputed, pending_review]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment reconciled successfully
 *       404:
 *         description: Payment not found
 */
paymentRoutes.post(
    '/:id/reconcile',
    authenticate,
    validate(paymentValidators.reconcilePayment),
    asyncHandler(paymentController.reconcilePayment)
);

