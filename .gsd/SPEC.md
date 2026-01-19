# SPEC.md — BeeHouse Sales Authorization System

> **Status**: `FINALIZED`
>
> ⚠️ **Planning Lock**: No code may be written until this spec is marked `FINALIZED`.

## Vision

BeeHouse-pdf-app is a real estate sales authorization management system that enables brokers to create, manage, and digitally sign sales authorization contracts (Autorizações de Venda) for properties. The system integrates seamlessly with Bitrix24 for CRM synchronization and authentication, uses Supabase for data persistence, and leverages ClickSign for digital signature workflows, providing a complete end-to-end solution for real estate authorization management.

## Current System State

This is a **brownfield project** — the core system is already built and deployed. The current implementation includes:

- ✅ Bitrix24 OAuth authentication
- ✅ Company/Individual (Empresa) management (PF and PJ entities)
- ✅ Property (Imóvel) management
- ✅ Sales Authorization (Autorização de Venda) CRUD
- ✅ PDF generation with React-PDF
- ✅ ClickSign integration for e-signatures
- ✅ Bidirectional Bitrix24 CRM sync
- ✅ Row-Level Security (RLS) for multi-tenant data isolation
- ✅ Server Components architecture for performance

**Technology Stack:**
- Next.js 14 App Router (React 18, TypeScript 5.3)
- Supabase (PostgreSQL 14, Auth, Storage)
- Bitrix24 (OAuth, REST API, CRM sync)
- ClickSign (E-signature API)
- Vercel (hosting)

## Goals

1. **Production System Maintenance** — Keep the deployed system running smoothly with bug fixes and critical updates
2. **Code Quality Improvements** — Address technical debt identified in architecture mapping (tests, error handling, TypeScript strict mode)
3. **Performance Optimization** — Continue optimizing Server Components usage and reduce bundle size
4. **Feature Enhancements** — Add capabilities based on user feedback and business needs

## Non-Goals (Out of Scope)

- Complete system rewrite (brownfield, not greenfield)
- Migration away from Bitrix24 integration (core dependency)
- Supporting multiple real estate companies (single-tenant per deployment)
- Mobile native apps (web-based system embedded in Bitrix24 iframe)
- Offline functionality (requires active internet connection)

## Constraints

### Technical Constraints
- Must run embedded in Bitrix24 iframe (CSP and CORS considerations)
- Supabase RLS policies must enforce data isolation per user
- PDF generation must be server-side only (security)
- ClickSign integration requires webhook endpoint for status updates
- Bitrix24 OAuth is the only authentication method (no email/password login)

### Business Constraints
- Brazilian market focus (Portuguese language, BR date/currency formats, CPF/CNPJ validation)
- Must maintain bidirectional sync with Bitrix24 CRM
- E-signature workflow is mandatory for legal compliance
- Authorization contracts follow specific legal template

### Performance Constraints
- Page load times < 3 seconds (Bitrix24 iframe environment)
- API responses < 1 second for CRUD operations
- PDF generation < 5 seconds per document
- Vercel serverless function limits (10s execution, 50MB bundle)

## Success Criteria

### System Reliability
- [ ] Zero data loss incidents
- [ ] 99.9% uptime for API endpoints
- [ ] All database operations protected by RLS policies
- [ ] Session management secure (HTTP-only cookies, 7-day expiry)

### Code Quality
- [ ] TypeScript strict mode enabled with zero errors
- [ ] Unit tests for business logic (>70% coverage)
- [ ] Integration tests for API endpoints
- [ ] Error boundaries implemented on all pages
- [ ] Centralized error logging (Sentry or equivalent)

### Performance
- [ ] Lighthouse score >90 for performance
- [ ] First Contentful Paint (FCP) < 1.5s
- [ ] Time to Interactive (TTI) < 3.5s
- [ ] Server Components used where possible (minimize client JS)

### User Experience
- [ ] All forms validate with Zod schemas
- [ ] Loading states on all async operations
- [ ] Toast notifications for all user actions
- [ ] Empty states with helpful guidance
- [ ] Responsive design (desktop and tablet)

## Core User Flows

### 1. Broker Authentication
**As a real estate broker**
- I want to authenticate via Bitrix24 OAuth
- So that I can access my companies, properties, and authorizations securely

### 2. Company Management
**As a broker**
- I want to create and manage companies (Empresas) - both individuals (PF) and legal entities (PJ)
- So that I can associate properties to property owners

### 3. Property Management
**As a broker**
- I want to create and manage properties (Imóveis) linked to companies
- So that I can generate sales authorizations for specific properties

### 4. Authorization Creation
**As a broker**
- I want to create sales authorizations with contract terms (exclusivity period, commission rate)
- So that I can formalize the agreement to sell a property

### 5. Digital Signature
**As a broker**
- I want to send authorization PDFs to ClickSign for the client's digital signature
- So that the contract is legally binding

### 6. CRM Synchronization
**As a broker**
- I want my authorizations automatically synced to Bitrix24 CRM
- So that my admin can track all deals in one place

### 7. Admin Oversight
**As an admin**
- I want to view all companies, properties and authorizations across all brokers
- So that I can monitor business performance

## Technical Requirements

| Requirement | Priority | Notes |
|-------------|----------|-------|
| Automated testing framework | Must-have | Currently missing — critical debt |
| Error boundary components | Must-have | Prevent white screen of death |
| TypeScript strict mode | Must-have | Improve type safety |
| Centralized logging | Should-have | Sentry integration recommended |
| API rate limiting | Should-have | Protect against abuse |
| CSRF protection | Should-have | Security best practice |
| ClickSign webhook signature verification | Should-have | Security improvement |
| Migrate to Supabase Auth sessions | Nice-to-have | Simplify auth architecture |
| Vercel KV caching | Nice-to-have | Performance boost |
| Internationalization (i18n) | Won't-have | Brazilian market only |

## Data Model (Existing)

### Tables
1. **user_profiles** - User accounts (extends Supabase Auth)
2. **empresas** - Companies/Individuals (PF or PJ entities with full details)
3. **imoveis** - Properties (linked to empresas with financial details)
4. **autorizacoes_vendas** - Sales authorizations (contract terms, ClickSign integration, PDF storage)

### Key Relationships
- User (1) → Empresas (many)
- Empresa (1) → Imóveis (many)
- Imóvel (1) → Autorizações (many)

### External Sync
- Empresas ↔ Bitrix24 Companies (bidirectional optional)
- Imóveis ↔ Bitrix24 SPA "Imóveis" (bidirectional optional)
- Autorizações → Bitrix24 SPA (unidirectional, with PDF link)

## Integration Points

### Supabase
- **Database**: PostgreSQL with RLS policies
- **Auth**: Extended with Bitrix24 OAuth
- **Storage**: Public bucket for PDF files

### Bitrix24
- **OAuth 2.0**: User authentication
- **REST API**: Company/property data sync
- **Smart Process Automation (SPA)**: Store authorizations as CRM items
- **Custom fields**: Link authorization PDFs back to properties

### ClickSign
- **API v3**: Upload PDFs, request signatures
- **Webhooks**: Status updates (signed, canceled, etc.)

## Security Model

### Authentication
- Bitrix24 OAuth 2.0 flow
- Custom session cookies (7-day expiry, HTTP-only)
- Middleware validates session on all protected routes

### Authorization
- Row-Level Security (RLS) enforces user isolation
- Admins can access all data via RLS policy
- Service role key isolated to server-side only

### Data Protection
- HTTPS only (Vercel enforces TLS)
- CORS restricted to Bitrix24 domains
- CSP headers allow Bitrix24 iframe embedding
- Input validation with Zod schemas

## Known Technical Debt

### High Priority
1. **No automated tests** - Zero test coverage (unit, integration, E2E)
2. **No error boundaries** - Component crashes cause white screen
3. **No centralized logging** - console.log only, no monitoring
4. **TypeScript strict mode disabled** - type safety compromised

### Medium Priority
5. **Mixed auth patterns** - Custom session cookies instead of Supabase Auth
6. **Inconsistent validation** - Some API routes lack Zod schemas
7. **Duplicate PDF endpoints** - `/api/pdf/generate` and `/api/pdf/generate-authorization`
8. **No API rate limiting** - Endpoints unprotected

### Low Priority
9. **Console logs in production** - Debug statements in middleware
10. **Unused config file** - `next.config.js` alongside `next.config.mjs`
11. **Missing SEO metadata** - Most pages lack meta tags
12. **No CSRF protection** - State-changing operations vulnerable

---

**Last updated:** 2026-01-19

**Next Steps (for user to define):**
- Finalize what work should be prioritized
- Convert to FINALIZED status when ready to begin planning
- Create ROADMAP.md with execution phases
