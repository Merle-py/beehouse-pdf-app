import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { autorizacaoCreateSchema } from '@/lib/validations/db-schemas';

// GET /api/autorizacoes - List all autorizacoes for current user
export async function GET(req: NextRequest) {
    try {
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const imovelId = searchParams.get('imovel_id');

        let query = supabase
            .from('vw_autorizacoes_completas')
            .select('*')
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        if (imovelId) {
            query = query.eq('imovel_id', parseInt(imovelId));
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
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

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

        // Verify imovel exists and user has access
        const { data: imovelCheck } = await supabase
            .from('imoveis')
            .select('id')
            .eq('id', data.imovel_id)
            .single();

        if (!imovelCheck) {
            return NextResponse.json(
                { error: 'Imóvel não encontrado ou você não tem permissão' },
                { status: 404 }
            );
        }

        // Calculate expiration date if prazo_exclusividade > 0
        let expiresAt = null;
        if (data.prazo_exclusividade > 0) {
            const now = new Date();
            expiresAt = new Date(now.getTime() + data.prazo_exclusividade * 24 * 60 * 60 * 1000).toISOString();
        }

        // Create autorizacao
        const { data: autorizacao, error } = await supabase
            .from('autorizacoes_vendas')
            .insert({
                ...data,
                created_by_user_id: user.id,
                expires_at: expiresAt,
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
