import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { empresaUpdateSchema } from '@/lib/validations/db-schemas';

// GET /api/empresas/[id] - Get single empresa with linked imoveis
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

        // Get empresa
        const { data: empresa, error: empresaError } = await supabase
            .from('empresas')
            .select('*')
            .eq('id', id)
            .single();

        if (empresaError || !empresa) {
            return NextResponse.json(
                { error: 'Empresa não encontrada' },
                { status: 404 }
            );
        }

        // Get linked imoveis
        const { data: imoveis } = await supabase
            .from('imoveis')
            .select('*')
            .eq('empresa_id', id)
            .order('created_at', { ascending: false });

        return NextResponse.json({
            empresa,
            imoveis: imoveis || [],
        });
    } catch (error: any) {
        console.error('Error getting empresa:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar empresa' },
            { status: 500 }
        );
    }
}

// PUT /api/empresas/[id] - Update empresa
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
        const validation = empresaUpdateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.errors },
                { status: 400 }
            );
        }

        const { data: empresa, error } = await supabase
            .from('empresas')
            .update(validation.data)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating empresa:', error);

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

            // RLS will return error if user doesn't have access
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Empresa não encontrada ou você não tem permissão' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // TODO: Sync to Bitrix24 in background

        return NextResponse.json({
            message: 'Empresa atualizada com sucesso',
            empresa,
        });
    } catch (error: any) {
        console.error('Error updating empresa:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar empresa' },
            { status: 500 }
        );
    }
}

// DELETE /api/empresas/[id] - Delete empresa
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

        const { error } = await supabase
            .from('empresas')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting empresa:', error);

            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Empresa não encontrada ou você não tem permissão' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Empresa excluída com sucesso',
        });
    } catch (error: any) {
        console.error('Error deleting empresa:', error);
        return NextResponse.json(
            { error: 'Erro ao excluir empresa' },
            { status: 500 }
        );
    }
}
