import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { Invoice, InvoiceItem } from '../../database/models/sql/invoice';
import { config } from '../../config';

export class PdfGenerationService {
    private static LOGO_PATH = path.join(__dirname, '../../../public/assets/logo.png');
    private static TEMP_DIR = path.join(__dirname, '../../../temp');

    /**
     * Generate a PDF invoice and return the file path
     */
    static async generateInvoicePdf(invoice: Invoice, items: InvoiceItem[], companyDetails: any): Promise<string> {
        // Ensure temp directory exists
        if (!fs.existsSync(this.TEMP_DIR)) {
            fs.mkdirSync(this.TEMP_DIR, { recursive: true });
        }

        const outputPath = path.join(this.TEMP_DIR, `invoice_${invoice.invoiceNumber.replace(/[^a-z0-9]/gi, '_')}.pdf`);
        
        return new Promise((resolve, reject) => {
            try {
                // Create a new PDF document
                const doc = new PDFDocument({ margin: 50 });
                
                // Pipe output to file
                const stream = fs.createWriteStream(outputPath);
                doc.pipe(stream);
                
                // Add company logo if it exists
                if (fs.existsSync(this.LOGO_PATH)) {
                    doc.image(this.LOGO_PATH, 50, 45, { width: 150 });
                    doc.moveDown(2);
                } else {
                    doc.fontSize(20).text(companyDetails.name || 'Company Name', 50, 45);
                    doc.moveDown();
                }
                  // Add company details
                doc.fontSize(10)
                    .text(companyDetails.address?.street || '', 50, 95);
                
                // Format address line safely with null checks
                const cityProvince = [
                    companyDetails.address?.city,
                    companyDetails.address?.province,
                    companyDetails.address?.postalCode
                ].filter(Boolean).join(', ');
                
                doc.text(cityProvince || '', 50, 110)
                    .text(companyDetails.address?.country || '', 50, 125)
                    .text('Phone: ' + (companyDetails.phone || ''), 50, 140)
                    .text('Email: ' + (companyDetails.email || ''), 50, 155);
                
                // Add invoice details on the right side
                doc.fontSize(20)
                    .text('INVOICE', 400, 45)
                    .fontSize(10)
                    .text('Invoice #: ' + invoice.invoiceNumber, 400, 80)
                    .text('Issue Date: ' + new Date(invoice.issueDate).toLocaleDateString(), 400, 95)
                    .text('Due Date: ' + new Date(invoice.dueDate).toLocaleDateString(), 400, 110)
                    .text('Status: ' + invoice.status.toUpperCase(), 400, 125);
                
                // Add billing address
                doc.fontSize(14).text('Bill To:', 50, 200);
                if (invoice.billingAddress) {
                    doc.fontSize(10)
                        .text(invoice.billingAddress.street || '', 50, 220)
                        .text(invoice.billingAddress.city + ', ' + invoice.billingAddress.province + ' ' + invoice.billingAddress.postalCode, 50, 235)
                        .text(invoice.billingAddress.country || '', 50, 250);
                }
                
                // Create invoice table
                doc.moveDown(4);
                this.generateInvoiceTable(doc, items);
                
                // Add totals
                const totals = this.calculateTotals(items);
                doc.fontSize(10);
                
                const tableTop = 350;
                const tableWidth = 500;
                
                doc.text('Subtotal:', 400, tableTop + totals.items.length * 30 + 30);
                doc.text('$' + totals.subtotal.toFixed(2), tableWidth, tableTop + totals.items.length * 30 + 30, { align: 'right' });
                
                doc.text('Tax:', 400, tableTop + totals.items.length * 30 + 50);
                doc.text('$' + totals.tax.toFixed(2), tableWidth, tableTop + totals.items.length * 30 + 50, { align: 'right' });
                
                doc.text('Discount:', 400, tableTop + totals.items.length * 30 + 70);
                doc.text('$' + totals.discount.toFixed(2), tableWidth, tableTop + totals.items.length * 30 + 70, { align: 'right' });
                
                doc.fontSize(12).font('Helvetica-Bold').text('Total:', 400, tableTop + totals.items.length * 30 + 100);
                doc.fontSize(12).font('Helvetica-Bold').text('$' + totals.total.toFixed(2), tableWidth, tableTop + totals.items.length * 30 + 100, { align: 'right' });
                
                if (invoice.paidAmount > 0) {
                    doc.text('Paid:', 400, tableTop + totals.items.length * 30 + 120);
                    doc.text('$' + invoice.paidAmount.toFixed(2), tableWidth, tableTop + totals.items.length * 30 + 120, { align: 'right' });
                    
                    doc.fontSize(12).font('Helvetica-Bold').text('Balance Due:', 400, tableTop + totals.items.length * 30 + 150);
                    doc.fontSize(12).font('Helvetica-Bold').text('$' + (totals.total - invoice.paidAmount).toFixed(2), tableWidth, tableTop + totals.items.length * 30 + 150, { align: 'right' });
                }
                
                // Add payment terms
                doc.moveDown(6);
                doc.fontSize(10).text('Payment Terms: ' + this.getPaymentTermDescription(invoice.paymentTerm), 50);
                
                // Add notes if any
                if (invoice.notes) {
                    doc.moveDown();
                    doc.text('Notes: ' + invoice.notes, 50);
                }
                
                // Add footer
                const footerTop = doc.page.height - 50;
                doc.fontSize(10).text('Thank you for your business!', 50, footerTop, { align: 'center' });
                
                // Finalize the PDF and end the stream
                doc.end();
                
                stream.on('finish', () => {
                    resolve(outputPath);
                });
                
                stream.on('error', (err) => {
                    reject(err);
                });
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Generate the invoice items table
     */
    private static generateInvoiceTable(doc: typeof PDFDocument, items: InvoiceItem[]) {
        const tableTop = 350;
        const tableHeaders = ['Item', 'Description', 'Quantity', 'Unit Price', 'Tax', 'Discount', 'Total'];
        const tableWidths = [50, 180, 50, 70, 50, 50, 60];
        
        // Draw table headers
        doc.fontSize(10).font('Helvetica-Bold');
        let xPos = 50;
        
        for (let i = 0; i < tableHeaders.length; i++) {
            doc.text(tableHeaders[i], xPos, tableTop);
            xPos += tableWidths[i];
        }
        
        // Draw horizontal line
        doc.moveTo(50, tableTop + 20)
           .lineTo(550, tableTop + 20)
           .stroke();
        
        // Draw table rows
        doc.font('Helvetica');
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const y = tableTop + 30 + (i * 30);
            
            // Calculate row values
            const itemTotal = (item.quantity * item.unitPrice) - item.discount + item.tax;
            
            // Draw row data
            xPos = 50;
            doc.text((i + 1).toString(), xPos, y);
            
            xPos += tableWidths[0];
            doc.text(item.description || `Product #${item.productId.substring(0, 8)}`, xPos, y);
            
            xPos += tableWidths[1];
            doc.text(item.quantity.toString(), xPos, y);
            
            xPos += tableWidths[2];
            doc.text('$' + item.unitPrice.toFixed(2), xPos, y);
            
            xPos += tableWidths[3];
            doc.text('$' + item.tax.toFixed(2), xPos, y);
            
            xPos += tableWidths[4];
            doc.text('$' + item.discount.toFixed(2), xPos, y);
            
            xPos += tableWidths[5];
            doc.text('$' + itemTotal.toFixed(2), xPos, y);
        }
        
        // Draw horizontal line
        doc.moveTo(50, tableTop + 30 + (items.length * 30))
           .lineTo(550, tableTop + 30 + (items.length * 30))
           .stroke();
    }
    
    /**
     * Calculate subtotal, tax, discount, and total
     */
    private static calculateTotals(items: InvoiceItem[]) {
        let subtotal = 0;
        let tax = 0;
        let discount = 0;
        
        for (const item of items) {
            subtotal += item.quantity * item.unitPrice;
            tax += item.tax || 0;
            discount += item.discount || 0;
        }
        
        const total = subtotal + tax - discount;
        
        return { subtotal, tax, discount, total, items };
    }
    
    /**
     * Get human-readable payment term description
     */
    private static getPaymentTermDescription(paymentTerm: string): string {
        const terms: Record<string, string> = {
            'immediate': 'Due immediately',
            'net7': 'Net 7 days',
            'net15': 'Net 15 days',
            'net30': 'Net 30 days',
            'net45': 'Net 45 days',
            'net60': 'Net 60 days',
            'net90': 'Net 90 days',
        };
        
        return terms[paymentTerm] || paymentTerm;
    }
}
