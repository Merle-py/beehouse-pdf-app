import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import { getSupabaseClient } from '@/lib/supabase/dev-client';
import { autorizacaoCreateSchema } from '@/lib/validations/db-schemas';

// GET /api/autorizacoes - List all autorizacoes for current user
export async function GET(req: NextRequest) {
    try {
        const supabase = getSupabaseClient();

        const { user, response } = await getAuthenticatedUser();
        if (!user) return response!;

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        // Use view for complete data
        let query = supabase
            .from('vw_autorizacoes_completas')
            .select('*')
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data: autorizacoes, error } = await query;

        if (error) {
            console.error('Error listing autorizacoes:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            autorizacoes: autorizacoes || [],
            total: autorizacoes?.length || 0,
        });
    } catch (error: any) {
        console.error('Error listing autorizacoes:', error);
        return NextResponse.json(
            { error: 'Erro ao listar autorizações' },
            { status: 500 }
        );
    }
}

// POST /api/autorizacoes - Create new autorizacao
export async function POST(req: NextRequest) {
    try {
        const supabase = getSupabaseClient();

        const { user, response } = await getAuthenticatedUser();
        if (!user) return response!;

        const body = await req.json();

        // Validate input
        const validation = autorizacaoCreateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.errors },
                { status: 400 }
            );
        }

        const data = validation.data;

        // Create autorizacao with status from request or default to rascunho
        const { data: autorizacao, error } = await supabase
            .from('autorizacoes_vendas')
            .insert({
                ...data,
                created_by_user_id: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating autorizacao:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(
            {
                message: 'Autorização criada com sucesso',
                autorizacao,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating autorizacao:', error);
        return NextResponse.json(
            { error: 'Erro ao criar autorização' },
            { status: 500 }
        );
    }
}
