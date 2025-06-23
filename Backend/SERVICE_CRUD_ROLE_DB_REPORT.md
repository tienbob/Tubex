# Backend Service CRUD, Role-Based Access, and Database Relationship Report

## 1. Invoice Service
- **CRUD Logic:**
  - Create: Only authenticated users. Checks order ownership, product validity, sets company/user context. Transactional save.
  - Read: Admins see all, others see only their own. Ownership and role checks on get-by-id.
  - Update: Only admin, owner, or creator. Only admin/creator can change status or items. Items can only be updated if DRAFT.
  - Delete: Only admin can void (soft-delete) an invoice.
- **Role Enforcement:** Admin, owner, creator. Admins can override most restrictions.
- **Multi-Tenancy:** All access is scoped by company/user. Company isolation enforced.
- **DB Relationships:** Invoice links to User (createdBy), Company (customerId), Order, and has many InvoiceItems (which link to Product).

## 2. Order Service
- **CRUD Logic:**
  - Create: Authenticated users. Product access filtered by role (dealer, supplier, admin). Inventory checked. Transactional save.
  - Read: Only orders for user's company unless admin.
  - Update: Only admin or order owner. Status changes logged in OrderHistory.
  - Delete: Only admin or order owner, with restrictions.
- **Role Enforcement:** Dealer can only order their catalog, supplier for their products, admin unrestricted.
- **Multi-Tenancy:** CompanyId always checked for access.
- **DB Relationships:** Order links to Company, User, OrderItems, and OrderHistory.

## 3. Payment Service
- **CRUD Logic:**
  - Create: Authenticated users. Payment context determined by order/invoice/company. Access checked for company.
  - Read: Payments filtered by company context.
  - Update/Delete: Restricted to admin or payment creator.
- **Role Enforcement:** Only users with company access can create/read. Admins can update/delete.
- **Multi-Tenancy:** CompanyId checked for all operations.
- **DB Relationships:** Payment links to Order, Invoice, User, Company.

## 4. Product Service
- **CRUD Logic:**
  - Create: Only company admin or supplier can create products for their own company. Dealers can create for active suppliers they are associated with.
  - Read: Products filtered by company/role.
  - Update/Delete: Only company admin, supplier, or dealer with correct company context.
- **Role Enforcement:** All roles are scoped to their company. There is no global admin; admin is only the admin of their own company. Role and company checks for all operations.
- **Multi-Tenancy:** CompanyId and supplierId checked for all operations. No cross-company access.
- **DB Relationships:** Product links to Company (supplier, dealer), ProductCategory, ProductPriceHistory.

## 5. Company Service
- **CRUD Logic:**
  - Create: Registration open, but company type and status checked.
  - Read: Admin can see all, others filtered by type/status.
  - Update/Delete: Only admin or company owner.
- **Role Enforcement:** Admin, company owner.
- **Multi-Tenancy:** CompanyId always checked.
- **DB Relationships:** Company links to User, Product, Order, Invoice, etc.

## 6. User Service
- **CRUD Logic:**
  - Create: Registration, invitation, or admin.
  - Read: Admin can see all, others see only their company or self.
  - Update/Delete: Admin, manager, or self (with restrictions).
- **Role Enforcement:** Admin, manager, staff. Hierarchy enforced in user-management.
- **Multi-Tenancy:** CompanyId checked for all operations.
- **DB Relationships:** User links to Company, UserAuditLog.

## 7. Inventory Service
- **CRUD Logic:**
  - Create/Update/Delete: Only users with company access. Strict company isolation.
  - Read: Only inventory for user's company. Role-based filtering (dealer, supplier).
- **Role Enforcement:** CompanyId and role checked for all operations.
- **Multi-Tenancy:** Strict company isolation.
- **DB Relationships:** Inventory links to Product, Company, Warehouse, Batch.

## 8. Warehouse Service
- **CRUD Logic:**
  - Create/Update/Delete: Only users with company access.
  - Read: Only warehouses for user's company.
- **Role Enforcement:** CompanyId checked for all operations.
- **Multi-Tenancy:** Strict company isolation.
- **DB Relationships:** Warehouse links to Company, Inventory.

## 9. User Management Service
- **CRUD Logic:**
  - List: Only users in same company, filtered by role hierarchy.
  - Update Role: Only admin/manager can update roles of lower users.
- **Role Enforcement:** Strict role hierarchy (admin > manager > staff).
- **Multi-Tenancy:** CompanyId checked for all operations.
- **DB Relationships:** User, UserAuditLog.

## 10. Other Services (Quote, Batch, Company Verification, Price List)
- **CRUD Logic:**
  - Similar patterns: Only users with correct role/company can create/read/update/delete.
- **Role Enforcement:** Role and company checks for all operations.
- **Multi-Tenancy:** CompanyId checked for all operations.
- **DB Relationships:** Each links to Company, User, and related domain tables.

---

## General Observations
- **Role-based access** is enforced at both route and controller levels.
- **Company isolation** is strict: users can only access their own company's data unless admin.
- **Admin** role can override most restrictions, but not company isolation in some services.
- **All CRUD operations** are transactional where needed (create/update with related items).
- **Database relationships** are explicit and use TypeORM decorators for referential integrity.
- **Soft delete** (status change) is used for most destructive operations.

---

## Recommendations
- Continue to enforce company isolation and role checks at both route and controller levels.
- Use TypeORM relations for all cross-entity links.
- Regularly audit role/ownership checks for new features.
- Consider adding more granular permissions if needed (e.g., per-resource ACLs).

---

> **Note:** In this system, a company manager can perform almost all actions that a company admin can, except in user management where the hierarchy is strictly enforced: **admin > manager > staff**. Only admins can manage (create, update, delete, assign roles to) managers and other admins. Managers can manage staff, but not other managers or admins.

---

**Report generated:** June 23, 2025
