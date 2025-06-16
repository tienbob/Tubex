import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../database';
import { Company, User } from '../../database/models/sql';
import { Repository } from 'typeorm';

export class CompanyController {
    private companyRepository: Repository<Company>;
    private userRepository: Repository<User>;

    constructor() {
        this.companyRepository = AppDataSource.getRepository(Company);
        this.userRepository = AppDataSource.getRepository(User);
    }    /**
     * Get all companies with filtering and pagination
     */
    async getAllCompanies(req: Request, res: Response, next: NextFunction) {
        try {
            const {
                page = 1,
                limit = 10,
                search,
                type,
                status = 'active'
            } = req.query;

            const pageNum = parseInt(page as string) || 1;
            const limitNum = parseInt(limit as string) || 10;
            const offset = (pageNum - 1) * limitNum;

            // Build query conditions
            const queryBuilder = this.companyRepository.createQueryBuilder('company');

            // Apply search filter (search by company name only for now)
            if (search) {
                queryBuilder.andWhere(
                    'LOWER(company.name) LIKE LOWER(:search)',
                    { search: `%${search}%` }
                );
            }

            // Apply type filter
            if (type && (type === 'dealer' || type === 'supplier')) {
                queryBuilder.andWhere('company.type = :type', { type });
            }

            // Apply status filter
            if (status) {
                queryBuilder.andWhere('company.status = :status', { status });
            }

            // Get total count for pagination
            const totalItems = await queryBuilder.getCount();

            // Apply pagination and get results
            const companies = await queryBuilder
                .skip(offset)
                .take(limitNum)
                .orderBy('company.created_at', 'DESC')
                .getMany();

            const totalPages = Math.ceil(totalItems / limitNum);

            res.status(200).json({
                status: 'success',
                data: companies,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    totalItems,
                    totalPages
                }
            });
        } catch (error) {
            console.error('Error fetching companies:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to fetch companies'
            });
        }
    }

    /**
     * Get a single company by ID
     */
    async getCompanyById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const company = await this.companyRepository.findOne({
                where: { id }
            });

            if (!company) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Company not found'
                });
            }

            res.status(200).json({
                status: 'success',
                data: company
            });
        } catch (error) {
            console.error('Error fetching company:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to fetch company'
            });
        }
    }

    /**
     * Get multiple companies by IDs (batch request)
     */
    async getCompaniesByIds(req: Request, res: Response, next: NextFunction) {
        try {
            const { ids } = req.query;

            if (!ids || typeof ids !== 'string') {
                return res.status(400).json({
                    status: 'error',
                    message: 'Company IDs are required'
                });
            }

            const idArray = ids.split(',').map(id => id.trim()).filter(id => id);

            if (idArray.length === 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'At least one company ID is required'
                });
            }

            const companies = await this.companyRepository.findByIds(idArray);

            // Create a map for easy lookup
            const companiesMap: Record<string, any> = {};
            companies.forEach(company => {
                companiesMap[company.id] = company;
            });

            res.status(200).json({
                status: 'success',
                data: companiesMap
            });
        } catch (error) {
            console.error('Error fetching companies by IDs:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to fetch companies'
            });
        }
    }    /**
     * Get suppliers only
     */
    async getSuppliers(req: Request, res: Response, next: NextFunction) {
        try {
            // Add type filter and delegate to getAllCompanies logic
            req.query.type = 'supplier';
            return await this.getAllCompanies(req, res, next);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to fetch suppliers'
            });
        }
    }

    /**
     * Get dealers only
     */
    async getDealers(req: Request, res: Response, next: NextFunction) {
        try {
            // Add type filter and delegate to getAllCompanies logic
            req.query.type = 'dealer';
            return await this.getAllCompanies(req, res, next);
        } catch (error) {
            console.error('Error fetching dealers:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to fetch dealers'
            });
        }
    }
}

export const companyController = new CompanyController();
