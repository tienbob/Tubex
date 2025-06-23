import { Router } from 'express';
import { invoiceController } from './controller';
import { invoiceValidators } from './validators';
import { authenticate, authorize, validate } from '../../middleware';
import { asyncHandler } from '../../middleware/asyncHandler';

const router = Router();

// Require authentication for all invoice routes
router.use(authenticate);

/**
 * @swagger
 * /api/v1/invoices:
 *   post:
 *     summary: Create a new invoice
 *     description: Create a new invoice for products or services
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - billingAddress
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *                 description: Related order ID (optional)
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                     - unitPrice
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                       description: Product ID
 *                     description:
 *                       type: string
 *                       description: Item description
 *                     quantity:
 *                       type: number
 *                       minimum: 1
 *                       description: Item quantity
 *                     unitPrice:
 *                       type: number
 *                       minimum: 0
 *                       description: Unit price
 *                     discount:
 *                       type: number
 *                       minimum: 0
 *                       description: Discount amount
 *                     tax:
 *                       type: number
 *                       minimum: 0
 *                       description: Tax amount
 *               paymentTerm:
 *                 type: string
 *                 enum: [immediate, net7, net15, net30, net45, net60, net90]
 *                 description: Payment term for the invoice
 *               issueDate:
 *                 type: string
 *                 format: date
 *                 description: Date when the invoice is issued
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 description: Date until which the invoice is due
 *               billingAddress:
 *                 type: object
 *                 required:
 *                   - street
 *                   - city
 *                   - province
 *                   - postalCode
 *                   - country
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   province:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   country:
 *                     type: string
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/', validate(invoiceValidators.createInvoice), asyncHandler(invoiceController.createInvoice));

/**
 * @swagger
 * /api/v1/invoices:
 *   get:
 *     summary: Get all invoices
 *     description: Retrieve all invoices with pagination and filtering options
 *     tags: [Invoices]
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
 *         description: Number of invoices per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, sent, viewed, paid, partially_paid, overdue, void]
 *         description: Filter invoices by status
 *     responses:
 *       200:
 *         description: List of invoices
 *       401:
 *         description: Unauthorized
 */
router.get('/', asyncHandler(invoiceController.getAllInvoices));

/**
 * @swagger
 * /api/v1/invoices/{id}:
 *   get:
 *     summary: Get an invoice by ID
 *     description: Retrieve an invoice by its ID
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice details
 *       404:
 *         description: Invoice not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', asyncHandler(invoiceController.getInvoiceById));

/**
 * @swagger
 * /api/v1/invoices/{id}/pdf:
 *   get:
 *     summary: Generate PDF for an invoice
 *     description: Generate and download a PDF for the invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Invoice not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/pdf', asyncHandler(invoiceController.generatePdf));

/**
 * @swagger
 * /api/v1/invoices/{id}:
 *   put:
 *     summary: Update an invoice
 *     description: Update an existing invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Invoice ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, sent, viewed, paid, partially_paid, overdue, void]
 *               paidAmount:
 *                 type: number
 *                 minimum: 0
 *               paymentTerm:
 *                 type: string
 *                 enum: [immediate, net7, net15, net30, net45, net60, net90]
 *               issueDate:
 *                 type: string
 *                 format: date
 *               dueDate:
 *                 type: string
 *                 format: date
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                     - unitPrice
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: number
 *                     unitPrice:
 *                       type: number
 *     responses:
 *       200:
 *         description: Invoice updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Invoice not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', validate(invoiceValidators.updateInvoice), asyncHandler(invoiceController.updateInvoice));

/**
 * @swagger
 * /api/v1/invoices/{id}:
 *   delete:
 *     summary: Void an invoice
 *     description: Mark an invoice as void (admin only)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice voided successfully
 *       404:
 *         description: Invoice not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authorize({ roles: ['admin'] }), asyncHandler(invoiceController.deleteInvoice));

/**
 * @swagger
 * /api/v1/invoices/order/{id}:
 *   post:
 *     summary: Create invoice from order
 *     description: Create a new invoice based on an existing order
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Order ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentTerm:
 *                 type: string
 *                 enum: [immediate, net7, net15, net30, net45, net60, net90]
 *                 default: net30
 *               issueDate:
 *                 type: string
 *                 format: date
 *                 description: Date when the invoice is issued
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 description: Date until which the invoice is due
 *               billingAddress:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   province:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   country:
 *                     type: string
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 */
router.post('/order/:id', validate(invoiceValidators.createInvoiceFromOrder), asyncHandler(invoiceController.createInvoiceFromOrder));

/**
 * @swagger
 * /api/v1/invoices/{id}/payment:
 *   post:
 *     summary: Record payment for an invoice
 *     description: Record a payment transaction for an invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Invoice ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - paymentMethod
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Payment amount
 *               paymentMethod:
 *                 type: string
 *                 description: Payment method used
 *               paymentDate:
 *                 type: string
 *                 format: date
 *                 description: Date when payment was made
 *               notes:
 *                 type: string
 *                 description: Additional notes about the payment
 *     responses:
 *       200:
 *         description: Payment recorded successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Invoice not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/payment', validate(invoiceValidators.recordPayment), asyncHandler(invoiceController.recordPayment));

/**
 * @swagger
 * /api/v1/invoices/{id}/send:
 *   post:
 *     summary: Send an invoice
 *     description: Mark an invoice as sent and optionally send email notification
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Invoice ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address to send the invoice to
 *               message:
 *                 type: string
 *                 description: Optional message to include with the invoice
 *     responses:
 *       200:
 *         description: Invoice sent successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Invoice not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/send', asyncHandler(invoiceController.sendInvoice));

/**
 * @swagger
 * /api/v1/invoices/company/{companyId}:
 *   get:
 *     summary: Get all invoices for a company
 *     description: Retrieve all invoices for a specific company
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Company ID
 *     responses:
 *       200:
 *         description: List of invoices for the company
 *       401:
 *         description: Unauthorized
 */
router.get('/company/:companyId', asyncHandler(invoiceController.getAllInvoices));

/**
 * @swagger
 * /api/v1/invoices/company/{companyId}/{id}:
 *   get:
 *     summary: Get an invoice by ID for a company
 *     description: Retrieve an invoice by its ID for a specific company
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Company ID
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice details for the company
 *       404:
 *         description: Invoice not found
 *       401:
 *         description: Unauthorized
 */
router.get('/company/:companyId/:id', asyncHandler(invoiceController.getInvoiceById));

/**
 * @swagger
 * /api/v1/invoices/company/{companyId}/{id}/pdf:
 *   get:
 *     summary: Generate PDF for an invoice of a company
 *     description: Generate and download a PDF for the invoice of a specific company
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Company ID
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: PDF file for the invoice of the company
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Invoice not found
 *       401:
 *         description: Unauthorized
 */
router.get('/company/:companyId/:id/pdf', asyncHandler(invoiceController.generatePdf));

/**
 * @swagger
 * /api/v1/invoices/company/{companyId}/{id}:
 *   put:
 *     summary: Update an invoice for a company
 *     description: Update an existing invoice for a specific company
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Company ID
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Invoice ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, sent, viewed, paid, partially_paid, overdue, void]
 *               paidAmount:
 *                 type: number
 *                 minimum: 0
 *               paymentTerm:
 *                 type: string
 *                 enum: [immediate, net7, net15, net30, net45, net60, net90]
 *               issueDate:
 *                 type: string
 *                 format: date
 *               dueDate:
 *                 type: string
 *                 format: date
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                     - unitPrice
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: number
 *                     unitPrice:
 *                       type: number
 *     responses:
 *       200:
 *         description: Invoice updated successfully for the company
 *       400:
 *         description: Bad request
 *       404:
 *         description: Invoice not found
 *       401:
 *         description: Unauthorized
 */
router.put('/company/:companyId/:id', validate(invoiceValidators.updateInvoice), asyncHandler(invoiceController.updateInvoice));

/**
 * @swagger
 * /api/v1/invoices/company/{companyId}/{id}:
 *   delete:
 *     summary: Void an invoice for a company
 *     description: Mark an invoice as void for a specific company (admin only)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Company ID
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid *         required: true
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice voided successfully for the company
 *       404:
 *         description: Invoice not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/company/:companyId/:id', authorize({ roles: ['admin'] }), asyncHandler(invoiceController.deleteInvoice));

/**
 * @swagger
 * /api/v1/invoices/company/{companyId}/order/{id}:
 *   post:
 *     summary: Create invoice from order for a company
 *     description: Create a new invoice based on an existing order for a specific company
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Company ID
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Order ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentTerm:
 *                 type: string
 *                 enum: [immediate, net7, net15, net30, net45, net60, net90]
 *                 default: net30
 *               issueDate:
 *                 type: string
 *                 format: date
 *                 description: Date when the invoice is issued
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 description: Date until which the invoice is due
 *               billingAddress:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   province:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   country:
 *                     type: string
 *     responses:
 *       201:
 *         description: Invoice created successfully for the company
 *       400:
 *         description: Bad request
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 */
router.post('/company/:companyId/order/:id', validate(invoiceValidators.createInvoiceFromOrder), asyncHandler(invoiceController.createInvoiceFromOrder));

/**
 * @swagger
 * /api/v1/invoices/company/{companyId}/{id}/payment:
 *   post:
 *     summary: Record payment for an invoice of a company
 *     description: Record a payment transaction for an invoice of a specific company
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Company ID
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Invoice ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - paymentMethod
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Payment amount
 *               paymentMethod:
 *                 type: string
 *                 description: Payment method used
 *               paymentDate:
 *                 type: string
 *                 format: date
 *                 description: Date when payment was made
 *               notes:
 *                 type: string
 *                 description: Additional notes about the payment
 *     responses:
 *       200:
 *         description: Payment recorded successfully for the company
 *       400:
 *         description: Bad request
 *       404:
 *         description: Invoice not found
 *       401:
 *         description: Unauthorized
 */
router.post('/company/:companyId/:id/payment', validate(invoiceValidators.recordPayment), asyncHandler(invoiceController.recordPayment));

/**
 * @swagger
 * /api/v1/invoices/company/{companyId}/{id}/send:
 *   post:
 *     summary: Send an invoice of a company
 *     description: Mark an invoice as sent for a specific company and optionally send email notification
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Company ID
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Invoice ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address to send the invoice to
 *               message:
 *                 type: string
 *                 description: Optional message to include with the invoice
 *     responses:
 *       200:
 *         description: Invoice sent successfully for the company
 *       400:
 *         description: Bad request
 *       404:
 *         description: Invoice not found
 *       401:
 *         description: Unauthorized
 */
router.post('/company/:companyId/:id/send', asyncHandler(invoiceController.sendInvoice));

/**
 * @swagger
 * /api/v1/invoices/company/{companyId}:
 *   post:
 *     summary: Create a new invoice
 *     description: Create a new invoice for products or services
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - billingAddress
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *                 description: Related order ID (optional)
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                     - unitPrice
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                       description: Product ID
 *                     description:
 *                       type: string
 *                       description: Item description
 *                     quantity:
 *                       type: number
 *                       minimum: 1
 *                       description: Item quantity
 *                     unitPrice:
 *                       type: number
 *                       minimum: 0
 *                       description: Unit price
 *                     discount:
 *                       type: number
 *                       minimum: 0
 *                       description: Discount amount
 *                     tax:
 *                       type: number
 *                       minimum: 0
 *                       description: Tax amount
 *               paymentTerm:
 *                 type: string
 *                 enum: [immediate, net7, net15, net30, net45, net60, net90]
 *                 description: Payment term for the invoice
 *               issueDate:
 *                 type: string
 *                 format: date
 *                 description: Date when the invoice is issued
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 description: Date until which the invoice is due
 *               billingAddress:
 *                 type: object
 *                 required:
 *                   - street
 *                   - city
 *                   - province
 *                   - postalCode
 *                   - country
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   province:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   country:
 *                     type: string
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/company/:companyId', validate(invoiceValidators.createInvoice), asyncHandler(invoiceController.createInvoice));

/**
 * @swagger
 * /api/v1/invoices/company/{companyId}:
 *   get:
 *     summary: Get all invoices
 *     description: Retrieve all invoices with pagination and filtering options
 *     tags: [Invoices]
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
 *         description: Number of invoices per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, sent, viewed, paid, partially_paid, overdue, void]
 *         description: Filter invoices by status
 *     responses:
 *       200:
 *         description: List of invoices
 *       401:
 *         description: Unauthorized
 */
router.get('/company/:companyId', asyncHandler(invoiceController.getAllInvoices));

/**
 * @swagger
 * /api/v1/invoices/company/{companyId}/{id}:
 *   get:
 *     summary: Get an invoice by ID
 *     description: Retrieve an invoice by its ID
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice details
 *       404:
 *         description: Invoice not found
 *       401:
 *         description: Unauthorized
 */
router.get('/company/:companyId/:id', asyncHandler(invoiceController.getInvoiceById));

/**
 * @swagger
 * /api/v1/invoices/company/{companyId}/{id}/pdf:
 *   get:
 *     summary: Generate PDF for an invoice
 *     description: Generate and download a PDF for the invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Invoice not found
 *       401:
 *         description: Unauthorized
 */
router.get('/company/:companyId/:id/pdf', asyncHandler(invoiceController.generatePdf));

/**
 * @swagger
 * /api/v1/invoices/company/{companyId}/{id}:
 *   put:
 *     summary: Update an invoice
 *     description: Update an existing invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Invoice ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, sent, viewed, paid, partially_paid, overdue, void]
 *               paidAmount:
 *                 type: number
 *                 minimum: 0
 *               paymentTerm:
 *                 type: string
 *                 enum: [immediate, net7, net15, net30, net45, net60, net90]
 *               issueDate:
 *                 type: string
 *                 format: date
 *               dueDate:
 *                 type: string
 *                 format: date
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                     - unitPrice
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: number
 *                     unitPrice:
 *                       type: number
 *     responses:
 *       200:
 *         description: Invoice updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Invoice not found
 *       401:
 *         description: Unauthorized
 */
router.put('/company/:companyId/:id', validate(invoiceValidators.updateInvoice), asyncHandler(invoiceController.updateInvoice));

/**
 * @swagger
 * /api/v1/invoices/company/{companyId}/{id}:
 *   delete:
 *     summary: Void an invoice
 *     description: Mark an invoice as void (admin only)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Invoice ID
 *     responses: *       200:
 *         description: Invoice voided successfully
 *       404:
 *         description: Invoice not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/company/:companyId/:id', authorize({ roles: ['admin'] }), asyncHandler(invoiceController.deleteInvoice));

/**
 * @swagger
 * /api/v1/invoices/company/{companyId}/order/{id}:
 *   post:
 *     summary: Create invoice from order
 *     description: Create a new invoice based on an existing order
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Order ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentTerm:
 *                 type: string
 *                 enum: [immediate, net7, net15, net30, net45, net60, net90]
 *                 default: net30
 *               issueDate:
 *                 type: string
 *                 format: date
 *                 description: Date when the invoice is issued
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 description: Date until which the invoice is due
 *               billingAddress:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   province:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   country:
 *                     type: string
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 */
router.post('/company/:companyId/order/:id', validate(invoiceValidators.createInvoiceFromOrder), asyncHandler(invoiceController.createInvoiceFromOrder));

/**
 * @swagger
 * /api/v1/invoices/company/{companyId}/{id}/payment:
 *   post:
 *     summary: Record payment for an invoice
 *     description: Record a payment transaction for an invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Invoice ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - paymentMethod
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Payment amount
 *               paymentMethod:
 *                 type: string
 *                 description: Payment method used
 *               paymentDate:
 *                 type: string
 *                 format: date
 *                 description: Date when payment was made
 *               notes:
 *                 type: string
 *                 description: Additional notes about the payment
 *     responses:
 *       200:
 *         description: Payment recorded successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Invoice not found
 *       401:
 *         description: Unauthorized
 */
router.post('/company/:companyId/:id/payment', validate(invoiceValidators.recordPayment), asyncHandler(invoiceController.recordPayment));

/**
 * @swagger
 * /api/v1/invoices/company/{companyId}/{id}/send:
 *   post:
 *     summary: Send an invoice
 *     description: Mark an invoice as sent and optionally send email notification
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Invoice ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address to send the invoice to
 *               message:
 *                 type: string
 *                 description: Optional message to include with the invoice
 *     responses:
 *       200:
 *         description: Invoice sent successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Invoice not found
 *       401:
 *         description: Unauthorized
 */
router.post('/company/:companyId/:id/send', asyncHandler(invoiceController.sendInvoice));

export const invoiceRoutes = router;
