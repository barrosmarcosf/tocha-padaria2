'use strict';
/**
 * dump-schema.js — exporta DDL aproximado das tabelas principais via information_schema
 * Uso: node scripts/dump-schema.js > schema.sql
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const TABLES = [
    'pedidos', 'clientes', 'carrinhos', 'customer_sessions',
    'categorias', 'produtos', 'site_content',
    'funnel_events', 'funnel_aggregates', 'insights_log',
    'failed_payments_queue', 'payment_events', 'payment_logs',
    'usuarios', 'fornadas', 'produto_estoque_fornada',
];

async function main() {
    process.stdout.write(`-- Schema dump — ${new Date().toISOString()}\n-- Gerado por scripts/dump-schema.js\n\n`);

    for (const table of TABLES) {
        const { data, error } = await supabase.rpc('_dump_table_ddl', { p_table: table }).maybeSingle().catch(() => ({ data: null, error: { message: 'rpc indisponível' } }));

        // Fallback: information_schema
        const { data: cols } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, character_maximum_length, column_default, is_nullable, is_identity')
            .eq('table_schema', 'public')
            .eq('table_name', table)
            .order('ordinal_position');

        if (!cols || cols.length === 0) {
            process.stdout.write(`-- TABELA ${table}: não encontrada ou sem permissão\n\n`);
            continue;
        }

        process.stdout.write(`-- ═══════════════════════════════════════\n`);
        process.stdout.write(`CREATE TABLE IF NOT EXISTS ${table} (\n`);
        const lines = cols.map(c => {
            let type = c.data_type.toUpperCase();
            if (c.character_maximum_length) type += `(${c.character_maximum_length})`;
            const nullable = c.is_nullable === 'YES' ? '' : ' NOT NULL';
            const def = c.column_default ? ` DEFAULT ${c.column_default}` : '';
            return `    ${c.column_name} ${type}${nullable}${def}`;
        });
        process.stdout.write(lines.join(',\n'));
        process.stdout.write(`\n);\n\n`);
    }

    process.stdout.write('-- Fim do dump\n');
}

main().then(() => process.exit(0)).catch(e => { console.error(e.message); process.exit(1); });
