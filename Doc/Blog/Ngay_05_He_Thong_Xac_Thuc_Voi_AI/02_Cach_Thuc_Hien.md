# Ngày 5: Hệ Thống Xác Thực Với AI - Cách Thực Hiện

## Bước 1: Hiểu Rõ Authentication vs Authorization

### 🔒 Authentication = "Bạn Là Ai?"
- **Verify identity**: Xác minh danh tính người dùng
- **Login process**: Username/password, email/OTP, biometrics
- **Session management**: Maintain logged-in state
- **Example**: Showing ID card để vào building

### 🛡️ Authorization = "Bạn Được Phép Làm Gì?"
- **Check permissions**: Xác minh quyền truy cập tài nguyên
- **Role-based access**: Admin, Manager, Employee roles
- **Resource-level control**: File access, API endpoints
- **Example**: ID card cho phép vào floor nào, room nào

### 🤖 AI Giúp Gì Trong Security?
- **Generate secure patterns**: Best practices built-in
- **Identify vulnerabilities**: Code review cho security holes
- **Implement complex flows**: OAuth, JWT, 2FA
- **Performance optimization**: Efficient auth mechanisms

## Bước 2: JWT Authentication System

### 🎯 JWT Prompting Strategy

#### Template Prompt Cho JWT Implementation:
```
🎯 ROLE:
Bạn là Security Engineer với 10 năm kinh nghiệm trong enterprise authentication systems.

🔒 TASK:
Implement complete JWT authentication system cho B2B SaaS platform với TypeScript.

📋 REQUIREMENTS:
- Access tokens (15 phút expiry)
- Refresh tokens (7 ngày expiry)
- Token blacklisting for logout
- Automatic token refresh
- Secure token storage
- Multi-device session management

🛡️ SECURITY CONSTRAINTS:
- RS256 algorithm (không dùng HS256)
- Strong secret key management
- XSS protection
- CSRF protection
- Rate limiting for auth endpoints
- Secure HTTP-only cookies for refresh tokens

🎨 IMPLEMENTATION DETAILS:
- TypeScript với proper typing
- Redis for token blacklisting
- Express middleware for token validation
- Error handling cho all edge cases
- Comprehensive logging
- Unit tests với 95%+ coverage

⚡ PERFORMANCE:
- < 50ms token verification
- < 100ms token generation
- Efficient Redis operations
- Memory-optimized token storage

🎯 OUTPUT:
- JWT utility functions
- Authentication middleware
- Token refresh endpoint
- Logout với blacklisting
- Security headers middleware
- Comprehensive test suite
```

#### 🔧 Implementing JWT với AI Assistance:

**Step 1: Generate JWT Utilities**
```typescript
// AI-generated với above prompt
interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

class JWTService {
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private redisClient: Redis;

  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET!;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET!;
    this.redisClient = new Redis(process.env.REDIS_URL!);
  }

  async generateTokenPair(payload: JWTPayload): Promise<TokenPair> {
    const accessToken = jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: '15m',
      algorithm: 'RS256',
      issuer: 'tubex-api',
      audience: 'tubex-client'
    });

    const refreshToken = jwt.sign(
      { userId: payload.userId, sessionId: payload.sessionId },
      this.refreshTokenSecret,
      { expiresIn: '7d', algorithm: 'RS256' }
    );

    // Store refresh token trong Redis
    await this.redisClient.setex(
      `refresh_token:${payload.sessionId}`,
      7 * 24 * 60 * 60, // 7 days
      refreshToken
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 // 15 minutes
    };
  }

  async verifyAccessToken(token: string): Promise<JWTPayload> {
    try {
      // Check blacklist first
      const isBlacklisted = await this.redisClient.get(`blacklist:${token}`);
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }

      const payload = jwt.verify(token, this.accessTokenSecret, {
        algorithms: ['RS256'],
        issuer: 'tubex-api',
        audience: 'tubex-client'
      }) as JWTPayload;

      return payload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = jwt.verify(refreshToken, this.refreshTokenSecret) as {
        userId: string;
        sessionId: string;
      };

      // Check if refresh token exists trong Redis
      const storedToken = await this.redisClient.get(
        `refresh_token:${payload.sessionId}`
      );
      
      if (!storedToken || storedToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      // Get user data to generate new access token
      const user = await this.getUserById(payload.userId);
      const newPayload: JWTPayload = {
        userId: user.id,
        tenantId: user.tenantId,
        email: user.email,
        roles: user.roles,
        permissions: user.permissions,
        sessionId: payload.sessionId
      };

      return await this.generateTokenPair(newPayload);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async blacklistToken(token: string): Promise<void> {
    const decoded = jwt.decode(token) as any;
    const remainingTime = decoded.exp - Math.floor(Date.now() / 1000);
    
    if (remainingTime > 0) {
      await this.redisClient.setex(
        `blacklist:${token}`,
        remainingTime,
        'true'
      );
    }
  }
}
```

### 🔒 Advanced Prompting Cho Authentication Middleware:

```
Tôi đã có JWT service implementation. Bây giờ hãy tạo:

1. Express middleware để protect routes
2. Role-based authorization middleware
3. Tenant isolation middleware
4. Rate limiting middleware cho auth endpoints
5. Security headers middleware
6. Error handling middleware cho auth failures

Requirements:
- TypeScript với proper error types
- Detailed logging cho security events
- Flexible permission checking
- Performance optimized
- Easy to use trong route definitions
```

**AI sẽ generate:**
```typescript
// Authentication Middleware
export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        code: 'TOKEN_REQUIRED'
      });
    }

    const payload = await jwtService.verifyAccessToken(token);
    
    // Add user info to request
    req.user = payload;
    req.tenant = { id: payload.tenantId };
    
    // Log successful authentication
    logger.info('User authenticated', {
      userId: payload.userId,
      tenantId: payload.tenantId,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    next();
  } catch (error) {
    logger.warn('Authentication failed', {
      error: error.message,
      ip: req.ip,
      token: req.headers.authorization?.substring(0, 20) + '...'
    });

    return res.status(401).json({
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
};

// Role-based Authorization
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRoles = req.user?.roles || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      logger.warn('Authorization failed', {
        userId: req.user?.userId,
        requiredRoles: roles,
        userRoles: userRoles
      });

      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

// Tenant Isolation
export const requireTenant = (req: Request, res: Response, next: NextFunction) => {
  const tenantId = req.user?.tenantId;
  const requestedTenantId = req.params.tenantId || req.body.tenantId;

  if (requestedTenantId && requestedTenantId !== tenantId) {
    logger.warn('Tenant access violation', {
      userId: req.user?.userId,
      userTenant: tenantId,
      requestedTenant: requestedTenantId
    });

    return res.status(403).json({
      error: 'Access denied to this tenant',
      code: 'TENANT_ACCESS_DENIED'
    });
  }

  next();
};
```

## Bước 3: OAuth Integration Với AI

### 🌐 OAuth Flow Implementation

**Advanced Prompt:**
```
Implement OAuth 2.0 integration cho Google và Microsoft:

OAUTH FEATURES:
- Authorization code flow
- PKCE for security
- State parameter for CSRF protection
- Automatic user creation/linking
- Existing account linking
- Profile data sync

SECURITY REQUIREMENTS:
- Secure state management
- Token exchange validation
- Profile data validation
- Account linking safeguards
- Audit logging

INTEGRATION:
- Google OAuth 2.0
- Microsoft Azure AD
- Extensible for other providers
- Unified user experience
- Error handling for edge cases

TECHNICAL:
- TypeScript implementations
- Database schema for OAuth accounts
- Callback URL handling
- Frontend integration ready
- Comprehensive testing
```

### 🎯 2FA Implementation

**Prompt cho TOTP (Time-based One-Time Password):**
```
Implement TOTP-based 2FA system:

FEATURES:
- QR code generation for setup
- TOTP verification với time windows
- Backup codes generation
- Recovery flow
- Remember device functionality

SECURITY:
- Secret key encryption
- Time window validation
- Brute force protection
- Device fingerprinting
- Audit logging

INTEGRATION:
- Works với existing JWT flow
- Optional/mandatory per tenant
- Admin override capabilities
- Bulk enrollment support
- Mobile app friendly

TECHNICAL:
- Use speakeasy library
- QR code generation với qrcode
- Database schema for 2FA
- Recovery mechanisms
- User-friendly error messages
```

## Bước 4: Advanced Security Features

### 🛡️ Rate Limiting Implementation

**Detailed Prompt:**
```
Implement comprehensive rate limiting system:

RATE LIMITING TYPES:
- Per-IP rate limits
- Per-user rate limits
- Per-endpoint rate limits
- Sliding window algorithm
- Burst allowance

ATTACK PREVENTION:
- Brute force login protection
- Password reset abuse prevention
- API abuse protection
- Distributed rate limiting
- Intelligent blocking

IMPLEMENTATION:
- Redis-based rate limiting
- Configurable limits per endpoint
- Different limits for authenticated vs anonymous
- Bypass mechanisms for admin
- Detailed logging và monitoring

PERFORMANCE:
- Minimal latency impact
- Efficient Redis operations
- Memory optimization
- Graceful degradation
```

### 🔐 Advanced Password Security

**Security-focused Prompt:**
```
Implement enterprise-grade password system:

PASSWORD POLICIES:
- Minimum length requirements
- Character complexity rules
- Dictionary word prevention
- Common password blacklist
- Personal info prevention

SECURITY FEATURES:
- bcrypt với dynamic salt rounds
- Password history tracking
- Account lockout policies
- Suspicious activity detection
- Geographic anomaly detection

BUSINESS FEATURES:
- Password expiration policies
- Forced password changes
- Bulk password reset
- Admin password policies
- Compliance reporting

TECHNICAL:
- Efficient password hashing
- Secure password storage
- Password strength meter
- Async processing for heavy operations
- Audit trail for all changes
```

## Bước 5: Multi-Tenant Security Architecture

### 🏢 Tenant Isolation Strategy

**Advanced Architecture Prompt:**
```
Design complete multi-tenant security architecture:

ISOLATION LEVELS:
- Database-level isolation
- Application-level isolation
- API-level isolation
- File storage isolation
- Cache isolation

SECURITY BOUNDARIES:
- Row-level security (RLS)
- Tenant-specific encryption keys
- Isolated user sessions
- Cross-tenant access prevention
- Data export restrictions

PERFORMANCE:
- Efficient tenant context switching
- Optimized queries with tenant filters
- Tenant-specific caching
- Connection pooling per tenant
- Resource usage monitoring

COMPLIANCE:
- GDPR compliance per tenant
- Data residency requirements
- Audit trails per tenant
- Tenant-specific retention policies
- Privacy controls
```

### 🔍 Security Monitoring & Auditing

**Comprehensive Monitoring Prompt:**
```
Implement security monitoring system:

MONITORING AREAS:
- Authentication attempts
- Authorization failures
- Suspicious user behavior
- API abuse patterns
- Data access patterns

ALERT SYSTEMS:
- Real-time threat detection
- Anomaly detection algorithms
- Automated response systems
- Escalation procedures
- Integration với SIEM tools

AUDIT LOGGING:
- Complete audit trails
- Tamper-proof logging
- Long-term log retention
- Compliance reporting
- Forensic investigation support

DASHBOARDS:
- Security operations center (SOC)
- Real-time threat intelligence
- User behavior analytics
- Performance impact monitoring
- Compliance status tracking
```

## Bước 6: Testing & Validation

### 🧪 Security Testing Strategy

**Testing-focused Prompt:**
```
Create comprehensive security test suite:

TEST TYPES:
- Unit tests for auth functions
- Integration tests for auth flows
- Performance tests for auth endpoints
- Security tests for vulnerabilities
- Load tests for auth systems

SECURITY SCENARIOS:
- SQL injection attempts
- XSS attack vectors
- CSRF attacks
- JWT manipulation
- Brute force attacks
- Session hijacking
- Privilege escalation

AUTOMATED TESTING:
- Continuous security scanning
- Dependency vulnerability checks
- Code quality security rules
- Penetration testing automation
- Compliance validation

TOOLS INTEGRATION:
- OWASP ZAP for security scanning
- Snyk for dependency scanning
- SonarQube for code quality
- Custom security test utilities
- Performance benchmarking tools
```

## Bước 7: Performance Optimization

### ⚡ Auth Performance Tuning

**Performance Optimization Prompt:**
```
Optimize authentication system performance:

PERFORMANCE TARGETS:
- < 50ms token verification
- < 100ms login process
- < 25ms authorization checks
- < 200ms OAuth flows
- < 10ms cached lookups

OPTIMIZATION STRATEGIES:
- Redis caching for user data
- Connection pooling optimization
- Async processing for heavy operations
- Database query optimization
- CDN for static auth assets

MONITORING:
- Performance metrics collection
- Bottleneck identification
- Scalability testing
- Memory usage optimization
- CPU utilization monitoring

SCALING:
- Horizontal scaling strategies
- Load balancing for auth services
- Database read replicas
- Cache clustering
- CDN integration
```

## Bước 8: Deployment & Production Readiness

### 🚀 Production Security Checklist

**Production Readiness Prompt:**
```
Prepare authentication system for production:

SECURITY HARDENING:
- Security headers configuration
- TLS/SSL certificate setup
- Firewall rules configuration
- Network segmentation
- Intrusion detection systems

MONITORING & ALERTING:
- Real-time monitoring setup
- Alert thresholds configuration
- Log aggregation systems
- Performance monitoring
- Security incident response

BACKUP & RECOVERY:
- Database backup strategies
- Secret key backup procedures
- Disaster recovery planning
- Business continuity planning
- Data export procedures

COMPLIANCE:
- GDPR compliance validation
- SOC 2 preparation
- HIPAA compliance (if needed)
- Industry-specific requirements
- Regular compliance audits
```

---

**Congratulations!** Bạn đã có complete guide để implement enterprise-grade authentication system với AI assistance. 

**Key Takeaway:** Security không phải là afterthought - nó phải được build-in từ đầu với AI giúp ensure best practices được follow consistently.

**Next:** Apply những techniques này để build secure authentication cho Tubex platform! 🔐🚀
