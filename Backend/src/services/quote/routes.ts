import { Router } from 'express';
import { quoteController } from './controller';
import { authenticate, authorize } from '../../middleware';
import { asyncHandler } from '../../middleware/asyncHandler';

const router = Router();

// Require authentication for all quote routes
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Quotes
 *   description: Quote generation and management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     QuoteItem:
 *       type: object
 *       required:
 *         - productId
 *         - quantity
 *         - unitPrice
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         productId:
 *           type: string
 *           format: uuid
 *         description:
 *           type: string
 *         quantity:
 *           type: number
 *           minimum: 1
 *         unitPrice:
 *           type: number
 *         discount:
 *           type: number
 *         tax:
 *           type: number
 *         notes:
 *           type: string
 *     Quote:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         quoteNumber:
 *           type: string
 *         companyId:
 *           type: string
 *           format: uuid
 *         customerId:
 *           type: string
 *           format: uuid
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/QuoteItem'
 *         subtotal:
 *           type: number
 *         discountTotal:
 *           type: number
 *         taxTotal:
 *           type: number
 *         total:
 *           type: number
 *         issueDate:
 *           type: string
 *           format: date
 *         validUntil:
 *           type: string
 *           format: date
 *         status:
 *           type: string
 *           enum: [draft, sent, accepted, declined, expired, converted]
 *         deliveryAddress:
 *           type: string
 *         notes:
 *           type: string
 *         termsAndConditions:
 *           type: string
 *         metadata:
 *           type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /quotes:
 *   post:
 *     summary: Create quote
 *     description: Create a new quote for a customer
 *     tags: [Quotes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - items
 *               - validUntil
 *             properties:
 *               customerId:
 *                 type: string
 *                 format: uuid
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/QuoteItem'
 *               validUntil:
 *                 type: string
 *                 format: date
 *               deliveryAddress:
 *                 type: string
 *               notes:
 *                 type: string
 *               termsAndConditions:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Quote created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Quote'
 */

/**
 * @swagger
 * /quotes:
 *   get:
 *     summary: Get all quotes
 *     description: Retrieve all quotes with pagination and filtering options
 *     tags: [Quotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of quotes per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending, accepted, rejected, expired, converted]
 *         description: Filter quotes by status
 *     responses:
 *       200:
 *         description: List of quotes
 *       401:
 *         description: Unauthorized
 */
router.get('/', asyncHandler(quoteController.getAllQuotes));

/**
 * @swagger
 * /quotes/{id}:
 *   get:
 *     summary: Get quote details
 *     description: Retrieve detailed information about a specific quote
 *     tags: [Quotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Quote details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Quote'
 *   
 *   put:
 *     summary: Update quote
 *     description: Update an existing quote
 *     tags: [Quotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/QuoteItem'
 *               validUntil:
 *                 type: string
 *                 format: date
 *               deliveryAddress:
 *                 type: string
 *               notes:
 *                 type: string
 *               termsAndConditions:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Quote updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Quote'
 */

/**
 * @swagger
 * /quotes/{id}:
 *   delete:
 *     summary: Delete a quote
 *     description: Delete a quote by its ID
 *     tags: [Quotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Quote ID
 *     responses:
 *       200:
 *         description: Quote deleted successfully
 *       400:
 *         description: Quote cannot be deleted
 *       404:
 *         description: Quote not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', asyncHandler(quoteController.deleteQuote));

/**
 * @swagger
 * /quotes/{id}/send:
 *   post:
 *     summary: Send quote
 *     description: Send a quote to the customer via email
 *     tags: [Quotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientEmail
 *             properties:
 *               recipientEmail:
 *                 type: string
 *                 format: email
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *               ccEmails:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *     responses:
 *       200:
 *         description: Quote sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /quotes/{id}/convert-to-invoice:
 *   post:
 *     summary: Convert to invoice
 *     description: Convert an accepted quote to an invoice
 *     tags: [Quotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentTerm:
 *                 type: string
 *               issueDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Quote converted to invoice successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invoiceId:
 *                   type: string
 *                   format: uuid
 */

// Export the router
export const quoteRoutes = router;

