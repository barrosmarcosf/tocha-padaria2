function getCurrentStoreStatus(config) {
    if (!config) config = { manualBlock: false, currentBatch: {}, nextBatch: {} };
    
    // 1. PRIORIDADE MÁXIMA: FECHAMENTO MANUAL
    if (config.manualBlock) {
        return { 
            isOpen: false, 
            statusMode: 'closed', 
            orderType: null, 
            message: 'Loja temporariamente fechada', 
            allowNextBatch: false, 
            nextBatchDate: null,
            nextBatchLabel: null,
            countdown: null
        };
    }

    const now = new Date();
    const brTimeStr = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    const brTime = new Date(brTimeStr);
    const nowMs = brTime.getTime();

    // Helper para formatar data amigável (ex: Sábado, 18/04)
    const formatDateLabel = (d) => {
        if (!d) return null;
        const date = d.includes('T') ? new Date(d) : new Date(d + 'T12:00:00');
        const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const dayName = days[date.getDay()];
        return `${dayName}, ${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth() + 1).padStart(2,'0')}`;
    };

    // Helper para extrair apenas DD/MM
    const formatSimpleDate = (d) => {
        if (!d) return null;
        const date = d.includes('T') ? new Date(d) : new Date(d + 'T12:00:00');
        return `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth() + 1).padStart(2,'0')}`;
    };

    // Helper para o countdown completo
    const formatFullCountdown = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        
        let parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (mins > 0) parts.push(`${mins}min`);
        
        // Se todas as unidades forem 0 mas ainda houver milissegundos, mostra 1min por padrão
        if (parts.length === 0 && ms > 0) return "1min";
        
        return parts.join(' ');
    };

    const parseDate = (d) => d ? new Date(d).getTime() : null;

    // --- NORMALIZAÇÃO DE SEGURANÇA (CORREÇÃO 16:59) ---
    // Garante que qualquer resquício de 16:59 seja convertido para 16:00
    const normalizeTime = (obj) => {
        if (obj && obj.end && typeof obj.end === 'string' && obj.end.includes(':59')) {
            obj.end = obj.end.replace(':59', ':00');
        }
    };
    normalizeTime(config.currentBatch);
    normalizeTime(config.nextBatch);

    // --- LÓGICA DE PROMOÇÃO AUTOMÁTICA (MODIFICA O OBJETO CONFIG SE NECESSÁRIO) ---
    // Se o fim da janela atual já passou, promovemos o próximo ciclo
    const cEnd = parseDate(config.currentBatch?.end);
    if (cEnd && nowMs > cEnd && config.nextBatch?.end) {
        config.needsPromotion = true;
        // Promoção: Ciclo 2 vira Ciclo 1
        config.currentBatch = { ...config.nextBatch };
        
        const pad = (n) => String(n).padStart(2, '0');
        const shiftDays = (dateStr, days, hourStr) => {
            if (!dateStr) return '';
            const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00');
            d.setDate(d.getDate() + days);
            const yyyy = d.getFullYear();
            const mm = pad(d.getMonth() + 1);
            const dd = pad(d.getDate());
            if (hourStr) return `${yyyy}-${mm}-${dd}T${hourStr}`;
            if (dateStr.includes('T')) {
                const hh = pad(d.getHours());
                const min = pad(d.getMinutes());
                return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
            }
            return `${yyyy}-${mm}-${dd}`;
        };

        // REGRA REATIVA: Recalcula janelas do novo Ciclo 1 baseado na bakeDate promovida mantendo horários
        const getShiftedWithTime = (date, days, originalTimeStr) => {
            const timePart = originalTimeStr && originalTimeStr.includes('T') ? originalTimeStr.split('T')[1] : (originalTimeStr || "00:00");
            return shiftDays(date, days, timePart);
        };

        const currentStartHour = config.currentBatch.start; // Já veio do nextBatch (old)
        const currentEndHour   = config.currentBatch.end;   // Já veio do nextBatch (old)

        config.currentBatch.start = getShiftedWithTime(config.currentBatch.bakeDate, -9, currentStartHour);
        config.currentBatch.end   = getShiftedWithTime(config.currentBatch.bakeDate, -2, currentEndHour);

        // Gera novo Ciclo 2 (Exatamente 7 dias após o anterior)
        config.nextBatch = {
            bakeDate: shiftDays(config.currentBatch.bakeDate, 7),
            start: shiftDays(config.currentBatch.start, 7),
            end: shiftDays(config.currentBatch.end, 7)
        };
    }

    const cStart = parseDate(config.currentBatch?.start);
    const currentBatchEnd = parseDate(config.currentBatch?.end);
    const nStart = parseDate(config.nextBatch?.start);
    const nEnd = parseDate(config.nextBatch?.end);

    // 2. ESTADO 1: JANELA ATIVA
    if (cStart && currentBatchEnd && nowMs >= cStart && nowMs <= currentBatchEnd) {
        const diffMs = currentBatchEnd - nowMs;
        const bakeDateStr = config.currentBatch?.bakeDate;
        if (!bakeDateStr) return { isOpen: false, statusMode: 'closed', message: 'Loja Fechada' };

        const bakeDateObj = bakeDateStr.includes('T') ? new Date(bakeDateStr) : new Date(bakeDateStr + 'T12:00:00');
        const weekDay = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'][bakeDateObj.getDay()];
        const countdownStr = formatFullCountdown(diffMs);

        // Regra Funcional: Transição conforme cronograma semanal
        const brDay = brTime.getDay();
        const brHour = brTime.getHours();
        
        // Quinta após 16:00 até Sábado 23:59 -> PRÉ-VENDA (Amarelo)
        const isPreVendaPeriod = (brDay === 4 && brHour >= 16) || brDay === 5 || brDay === 6;

        const statusMode = isPreVendaPeriod ? 'next_batch' : 'open';
        const prefix = isPreVendaPeriod ? 'Encomendas para o próximo sábado' : `Pedidos abertos para est${weekDay.endsWith('o')?'e':'a'} ${weekDay}`;
        const connector = isPreVendaPeriod ? 'dia ' : '';

        return {
            isOpen: true,
            statusMode: statusMode,
            orderType: isPreVendaPeriod ? 'pre_venda' : 'normal',
            message: `${prefix} — Fornada ${connector}${formatSimpleDate(bakeDateStr)} — Encerra em ${countdownStr}`,
            batchLabel: formatDateLabel(bakeDateStr),
            batchDate: bakeDateStr,
            cycleType: isPreVendaPeriod ? 'próxima fornada' : 'fornada atual',
            allowNextBatch: true,
            countdown: countdownStr,
            needsPromotion: config.needsPromotion,
            updatedConfig: config.needsPromotion ? config : null
        };
    }

    // 3. ESTADO 2: JANELA SECUNDÁRIA (Fallback se configurado manualmente)
    if (nStart && nEnd && nowMs >= nStart && nowMs <= nEnd) {
        const bakeDateStr = config.nextBatch?.bakeDate;
        if (!bakeDateStr) return { isOpen: false, statusMode: 'closed', message: 'Loja Fechada' };

        const diffMs = nEnd - nowMs;
        const countdownStr = formatFullCountdown(diffMs);

        return {
            isOpen: true,
            statusMode: 'next_batch',
            orderType: 'pre_venda',
            message: `Encomendas para o próximo sábado — Fornada dia ${formatSimpleDate(bakeDateStr)} — Encerra em ${countdownStr}`,
            batchLabel: formatDateLabel(bakeDateStr),
            batchDate: bakeDateStr,
            cycleType: 'próxima fornada',
            allowNextBatch: true,
            countdown: countdownStr,
            needsPromotion: config.needsPromotion,
            updatedConfig: config.needsPromotion ? config : null
        };
    }

    // 4. FORA DE QUALQUER JANELA
    return {
        isOpen: false,
        statusMode: 'closed',
        orderType: null,
        message: 'Loja temporariamente fechada',
        allowNextBatch: false,
        nextBatchDate: null,
        nextBatchLabel: null,
        countdown: null,
        needsPromotion: config.needsPromotion,
        updatedConfig: config.needsPromotion ? config : null
    };
}

async function getUnifiedStoreStatus(supabase) {
    try {
        const { data } = await supabase.from('site_content').select('value').eq('key', 'opening_hours').maybeSingle();
        const config = data ? data.value : null;
        const status = getCurrentStoreStatus(config);
        
        // Se a lógica detectou que precisa promover o ciclo, salva no banco agora mesmo
        if (status.needsPromotion && status.updatedConfig) {
            console.log("🚀 Virada de ciclo automática detectada! Promovendo Ciclo 2 para Ciclo 1...");
            const cleanConfig = { ...status.updatedConfig };
            delete cleanConfig.needsPromotion; // remove flag temporária
            
            await supabase.from('site_content').upsert([{ 
                key: 'opening_hours', 
                value: cleanConfig, 
                updated_at: new Date().toISOString() 
            }]);

            // [NOVO] Se virou o ciclo, pedidos pagos que eram da data promovida devem ser 'aceitos'
            const nextBakeDateForUpdate = cleanConfig.currentBatch?.bakeDate;
            if (nextBakeDateForUpdate) {
                const { data: pedidosToUpdate } = await supabase.from('pedidos').select('id, items').eq('status', 'paid');
                const targets = (pedidosToUpdate || []).filter(o => {
                    let items = o.items;
                    if (typeof items === 'string') { try { items = JSON.parse(items); } catch { return false; } }
                    return items?.batch_date === nextBakeDateForUpdate;
                });
                if (targets.length > 0) {
                    const ids = targets.map(t => t.id);
                    await supabase.from('pedidos').update({ status: 'aceito' }).in('id', ids);
                    console.log(`✅ ${ids.length} pedidos da nova fornada foram movidos para produção (ACEITO).`);
                }
            }
        }
        
        return status;
    } catch (e) {
        console.error("Erro no getUnifiedStoreStatus:", e);
        return getCurrentStoreStatus(null);
    }
}

module.exports = { getCurrentStoreStatus, getUnifiedStoreStatus };
