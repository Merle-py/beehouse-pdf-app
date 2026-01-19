import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import { getSupabaseClient } from '@/lib/supabase/dev-client';
import { autorizacaoUpdateSchema } from '@/lib/validations/db-schemas';

// GET /api/autorizacoes/[id] - Get single autorizacao
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = getSupabaseClient();

        const { user, response } = await getAuthenticatedUser();
        if (!user) return response!;

        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        const { data: autorizacao, error } = await supabase
            .from('vw_autorizacoes_completas')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !autorizacao) {
            return NextResponse.json(
                { error: 'Autorização não encontrada' },
                { status: 404 }
            );
        }

        return NextResponse.json({ autorizacao });
    } catch (error: any) {
        console.error('Error getting autorizacao:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar autorização' },
            { status: 500 }
        );
    }
}

// PUT /api/autorizacoes/[id] - Update autorizacao
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = getSupabaseClient();

        const { user, response } = await getAuthenticatedUser();
        if (!user) return response!;

        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        const body = await req.json();

        // Validate input
        const validation = autorizacaoUpdateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.errors },
                { status: 400 }
            );
        }

        // Check current status - can only edit drafts
        const { data: current } = await supabase
            .from('autorizacoes_vendas')
            .select('status')
            .eq('id', id)
            .single();

        if (current && current.status !== 'rascunho') {
            return NextResponse.json(
                { error: 'Apenas rascunhos podem ser editados' },
                { status: 400 }
            );
        }

        const { data: autorizacao, error } = await supabase
            .from('autorizacoes_vendas')
            .update(validation.data)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating autorizacao:', error);

            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Autorização não encontrada ou você não tem permissão' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Autorização atualizada com sucesso',
            autorizacao,
        });
    } catch (error: any) {
        console.error('Error updating autorizacao:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar autorização' },
            { status: 500 }
        );
    }
}

// DELETE /api/autorizacoes/[id] - Delete autorizacao
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = getSupabaseClient();

        const { user, response } = await getAuthenticatedUser();
        if (!user) return response!;

        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        // Check if signed - cannot delete signed authorizations
        const { data: current } = await supabase
            .from('autorizacoes_vendas')
            .select('status')
            .eq('id', id)
            .single();

        if (current && current.status === 'assinado') {
            return NextResponse.json(
                { error: 'Não é possível excluir autorizações assinadas' },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('autorizacoes_vendas')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting autorizacao:', error);

            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Autorização não encontrada ou você não tem permissão' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Autorização excluída com sucesso',
        });
    } catch (error: any) {
        console.error('Error deleting autorizacao:', error);
        return NextResponse.json(
            { error: 'Erro ao excluir autorização' },
            { status: 500 }
        );
    }
}
