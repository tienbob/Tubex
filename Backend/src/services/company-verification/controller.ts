import { Request, Response, NextFunction } from 'express';
import { CompanyVerificationService } from './service';
import { AppDataSource } from '../../database/ormconfig';
import { Company } from '../../database/models/sql/company';

export class CompanyVerificationController {
    private verificationService = new CompanyVerificationService();

    async verifyCompany(req: Request, res: Response, next: NextFunction) {
        try {
            const { companyId } = req.params;
            const { isApproved, rejectionReason } = req.body;
            const verifiedBy = (req.user as any).id; // Admin user ID

            const company = await this.verificationService.verifyCompany(companyId, {
                isApproved,
                rejectionReason,
                verifiedBy
            });

            res.json({
                status: 'success',
                data: {
                    company,
                    message: `Company ${isApproved ? 'approved' : 'rejected'} successfully`
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async getPendingVerifications(req: Request, res: Response, next: NextFunction) {
        const companyRepository = AppDataSource.getRepository(Company);
        
        try {
            const pendingCompanies = await companyRepository.find({
                where: { status: 'pending_verification' },
                order: { created_at: 'ASC' }
            });

            res.json({
                status: 'success',
                data: { companies: pendingCompanies }
            });
        } catch (error) {
            next(error);
        }
    }
}