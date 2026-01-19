import { NextRequest, NextResponse } from 'next/server';
import { empresaCreateSchema } from '@/lib/validations/db-schemas';
import { Empresa } from '@/types/database';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import { getSupabaseClient } from '@/lib/supabase/dev-client';

// GET /api/empresas - List all empresas for current user
export async function GET(req: NextRequest) {
    try {
        const supabase = getSupabaseClient();

        const { user, response } = await getAuthenticatedUser();
        if (!user) return response!;

        const { searchParams } = new URL(req.url);
        const tipo = searchParams.get('tipo');
        const search = searchParams.get('search');

        let query = supabase
            .from('empresas')
            .select(`
        *,
        imoveis(count)
      `)
            .order('created_at', { ascending: false });

        // Add filters
        if (tipo && (tipo === 'PF' || tipo === 'PJ')) {
            query = query.eq('tipo', tipo);
        }

        if (search) {
            query = query.or(
                `nome.ilike.%${search}%,razao_social.ilike.%${search}%,cpf.ilike.%${search}%,cnpj.ilike.%${search}%`
            );
        }

        const { data: empresas, error, count } = await query;

        if (error) {
            console.error('Error listing empresas:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            empresas: empresas || [],
            total: count || 0,
        });
    } catch (error: any) {
        console.error('Error listing empresas:', error);
        return NextResponse.json(
            { error: 'Erro ao listar empresas' },
            { status: 500 }
        );
    }
}

// POST /api/empresas - Create new empresa
export async function POST(req: NextRequest) {
    try {
        const supabase = getSupabaseClient();

        const { user, response } = await getAuthenticatedUser();
        if (!user) return response!;

        const body = await req.json();

        // Validate input
        const validation = empresaCreateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.errors },
                { status: 400 }
            );
        }

        const data = validation.data;

        // Create empresa with user ID
        const { data: empresa, error } = await supabase
            .from('empresas')
            .insert({
                ...data,
                created_by_user_id: user.id, // Uses mock UUID in dev, real UUID in production
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating empresa:', error);

            // Handle unique constraint violations
            if (error.code === '23505') {
                if (error.message.includes('cpf')) {
                    return NextResponse.json(
                        { error: 'Uma empresa com este CPF já existe' },
                        { status: 409 }
                    );
                }
                if (error.message.includes('cnpj')) {
                    return NextResponse.json(
                        { error: 'Uma empresa com este CNPJ já existe' },
                        { status: 409 }
                    );
                }
            }

            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // TODO: Sync to Bitrix24 in background

        return NextResponse.json(
            {
                message: 'Empresa criada com sucesso',
                empresa,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating empresa:', error);
        return NextResponse.json(
            { error: 'Erro ao criar empresa' },
            { status: 500 }
        );
    }
}
