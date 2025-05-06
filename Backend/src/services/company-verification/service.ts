import { AppDataSource } from '../../database/ormconfig';
import { Company } from '../../database/models/sql';
import { AppError } from '../../middleware/errorHandler';
import { sendVerificationNotification } from '../email/service';

export class CompanyVerificationService {
    private companyRepository = AppDataSource.getRepository(Company);

    async verifyCompany(companyId: string, verificationData: {
        isApproved: boolean;
        rejectionReason?: string;
        verifiedBy: string;
    }) {
        const company = await this.companyRepository.findOne({ 
            where: { id: companyId }
        });

        if (!company) {
            throw new AppError(404, 'Company not found');
        }

        if (company.status !== 'pending_verification') {
            throw new AppError(400, `Company is already ${company.status}`);
        }

        // Update company status
        company.status = verificationData.isApproved ? 'active' : 'rejected';
        
        // Store verification metadata
        company.metadata = {
            ...company.metadata,
            verification: {
                verifiedAt: new Date(),
                verifiedBy: verificationData.verifiedBy,
                rejectionReason: verificationData.rejectionReason
            }
        };

        await this.companyRepository.save(company);

        // Send notification to company admin
        await sendVerificationNotification(company);

        return company;
    }

    async validateBusinessLicense(licenseNumber: string): Promise<boolean> {
        // TODO: Integrate with government business registry API
        // This is a placeholder for actual business license validation
        return licenseNumber.length >= 8;
    }

    async validateTaxId(taxId: string): Promise<boolean> {
        // TODO: Integrate with tax authority API
        // This is a placeholder for actual tax ID validation
        return /^\d{10}$/.test(taxId);
    }
}