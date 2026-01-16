import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { autorizacaoUpdateSchema } from '@/lib/validations/db-schemas';

// GET /api/autorizacoes/[id] - Get single autorizacao with full details
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

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
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

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

        // Check if already signed
        const { data: current } = await supabase
            .from('autorizacoes_vendas')
            .select('status')
            .eq('id', id)
            .single();

        if (current?.status === 'assinado') {
            return NextResponse.json(
                { error: 'Não é possível atualizar uma autorização já assinada' },
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
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        // Check if already signed
        const { data: current } = await supabase
            .from('autorizacoes_vendas')
            .select('status')
            .eq('id', id)
            .single();

        if (current?.status === 'assinado') {
            return NextResponse.json(
                { error: 'Não é possível excluir uma autorização já assinada' },
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
