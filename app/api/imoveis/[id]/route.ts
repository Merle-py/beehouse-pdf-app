import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import { getSupabaseClient } from '@/lib/supabase/dev-client';
import { imovelUpdateSchema } from '@/lib/validations/db-schemas';

// GET /api/imoveis/[id] - Get single imovel
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

        const { data: imovel, error } = await supabase
            .from('imoveis')
            .select(`
        *,
        empresas!inner(tipo, nome, razao_social)
      `)
            .eq('id', id)
            .single();

        if (error || !imovel) {
            return NextResponse.json(
                { error: 'Imóvel não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({ imovel });
    } catch (error: any) {
        console.error('Error getting imovel:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar imóvel' },
            { status: 500 }
        );
    }
}

// PUT /api/imoveis/[id] - Update imovel
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
        const validation = imovelUpdateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.errors },
                { status: 400 }
            );
        }

        const { data: imovel, error } = await supabase
            .from('imoveis')
            .update(validation.data)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating imovel:', error);

            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Imóvel não encontrado ou você não tem permissão' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Imóvel atualizado com sucesso',
            imovel,
        });
    } catch (error: any) {
        console.error('Error updating imovel:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar imóvel' },
            { status: 500 }
        );
    }
}

// DELETE /api/imoveis/[id] - Delete imovel
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

        const { error } = await supabase
            .from('imoveis')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting imovel:', error);

            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Imóvel não encontrado ou você não tem permissão' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Imóvel excluído com sucesso',
        });
    } catch (error: any) {
        console.error('Error deleting imovel:', error);
        return NextResponse.json(
            { error: 'Erro ao excluir imóvel' },
            { status: 500 }
        );
    }
}
