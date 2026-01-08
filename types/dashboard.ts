import { Company } from './company';
import { Property } from './property';

// Estatísticas do dashboard
export interface DashboardStats {
    totalCompanies: number;
    totalProperties: number;
    totalAuthorizations: number;
    pendingAuthorizations: number;
    signedAuthorizations: number;
    pendingSignatures: number;
}

// Cache do dashboard
export interface DashboardCacheData {
    stats: DashboardStats;
    companies: Company[];
    properties: Property[];
}

// Detalhes de autorização (página de detalhes)
export interface AuthorizationDetail {
    success: boolean;
    isOwner: boolean;
    isAdmin: boolean;
    hasAccess: boolean;
    company: Company;
    properties: Property[];
    canEdit: boolean;
    canDelete: boolean;
    message?: string;
}
