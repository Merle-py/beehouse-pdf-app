import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import { getSupabaseClient } from '@/lib/supabase/dev-client';
import { imovelCreateSchema } from '@/lib/validations/db-schemas';

// GET /api/imoveis - List all imoveis for current user
export async function GET(req: NextRequest) {
    try {
        const supabase = getSupabaseClient();

        const { user, response } = await getAuthenticatedUser();
        if (!user) return response!;

        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get('empresa_id');

        let query = supabase
            .from('imoveis')
            .select(`
        *,
        empresas!inner(tipo, nome, razao_social)
      `)
            .order('created_at', { ascending: false });

        if (empresaId) {
            query = query.eq('empresa_id', parseInt(empresaId));
        }

        const { data: imoveis, error } = await query;

        if (error) {
            console.error('Error listing imoveis:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            imoveis: imoveis || [],
            total: imoveis?.length || 0,
        });
    } catch (error: any) {
        console.error('Error listing imoveis:', error);
        return NextResponse.json(
            { error: 'Erro ao listar imóveis' },
            { status: 500 }
        );
    }
}

// POST /api/imoveis - Create new imovel
export async function POST(req: NextRequest) {
    try {
        const supabase = getSupabaseClient();

        const { user, response } = await getAuthenticatedUser();
        if (!user) return response!;

        const body = await req.json();

        // Validate input
        const validation = imovelCreateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.errors },
                { status: 400 }
            );
        }

        const data = validation.data;

        // Verify empresa exists and user has access (RLS will handle this)
        const { data: empresaCheck } = await supabase
            .from('empresas')
            .select('id')
            .eq('id', data.empresa_id)
            .single();

        if (!empresaCheck) {
            return NextResponse.json(
                { error: 'Empresa não encontrada ou você não tem permissão' },
                { status: 404 }
            );
        }

        // Create imovel
        const { data: imovel, error } = await supabase
            .from('imoveis')
            .insert({
                ...data,
                created_by_user_id: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating imovel:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // TODO: Sync to Bitrix24 as Deal

        return NextResponse.json(
            {
                message: 'Imóvel criado com sucesso',
                imovel,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating imovel:', error);
        return NextResponse.json(
            { error: 'Erro ao criar imóvel' },
            { status: 500 }
        );
    }
}
