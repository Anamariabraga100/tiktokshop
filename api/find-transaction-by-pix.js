// Vercel Serverless Function para encontrar transação pelo código PIX
// Rota: /api/find-transaction-by-pix
// ESM PURO - package.json tem "type": "module"

import { supabase } from './lib/supabase.js';

export default async function handler(req, res) {
  try {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS
    if (req.method === 'OPTIONS') {
      return res.status(200).json({ success: true });
    }

    // Apenas GET ou POST
    if (req.method !== 'GET' && req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Apenas requisições GET ou POST são permitidas'
      });
    }

    // Receber código PIX da query string ou body
    const pixCode = req.query.pixCode || req.body.pixCode;

    if (!pixCode) {
      return res.status(400).json({
        success: false,
        error: 'pixCode é obrigatório'
      });
    }

    console.log('🔍 Buscando transação pelo código PIX:', pixCode.substring(0, 50) + '...');

    // Buscar no banco de dados
    let orders = [];
    if (supabase && typeof supabase.from === 'function') {
      try {
        // Buscar por código PIX exato
        const { data: exactMatch, error: exactError } = await supabase
          .from('orders')
          .select('*')
          .eq('pix_code', pixCode)
          .order('created_at', { ascending: false });

        if (exactError && exactError.code !== 'PGRST116') {
          console.error('❌ Erro ao buscar por código exato:', exactError);
        } else if (exactMatch && exactMatch.length > 0) {
          orders = exactMatch;
          console.log('✅ Encontrado por código exato:', orders.length);
        }

        // Se não encontrou, buscar por código PIX do UmbrellaPag
        if (orders.length === 0) {
          const { data: umbrellaMatch, error: umbrellaError } = await supabase
            .from('orders')
            .select('*')
            .eq('umbrella_qr_code', pixCode)
            .order('created_at', { ascending: false });

          if (umbrellaError && umbrellaError.code !== 'PGRST116') {
            console.error('❌ Erro ao buscar por código UmbrellaPag:', umbrellaError);
          } else if (umbrellaMatch && umbrellaMatch.length > 0) {
            orders = umbrellaMatch;
            console.log('✅ Encontrado por código UmbrellaPag:', orders.length);
          }
        }

        // Se ainda não encontrou, buscar por substring (caso o código tenha sido truncado)
        if (orders.length === 0) {
          const substring = pixCode.substring(0, 50);
          // Buscar separadamente por cada campo
          const { data: pixCodeMatch, error: pixCodeError } = await supabase
            .from('orders')
            .select('*')
            .ilike('pix_code', `%${substring}%`)
            .order('created_at', { ascending: false })
            .limit(10);

          if (!pixCodeError && pixCodeMatch && pixCodeMatch.length > 0) {
            orders = pixCodeMatch;
            console.log('✅ Encontrado por substring no pix_code:', orders.length);
          } else {
            // Tentar buscar no umbrella_qr_code
            const { data: umbrellaMatch, error: umbrellaError } = await supabase
              .from('orders')
              .select('*')
              .ilike('umbrella_qr_code', `%${substring}%`)
              .order('created_at', { ascending: false })
              .limit(10);

            if (!umbrellaError && umbrellaMatch && umbrellaMatch.length > 0) {
              orders = umbrellaMatch;
              console.log('✅ Encontrado por substring no umbrella_qr_code:', orders.length);
            }
          }
        }

      } catch (error) {
        console.error('❌ Erro ao consultar banco:', error);
      }
    }

    // Verificar se o código PIX contém referência ao BluPay
    const isBluPay = pixCode.includes('blupay') || pixCode.includes('blupayip.com.br');
    const isUmbrellaPag = pixCode.includes('umbrellapag') || pixCode.includes('umbrella');

    // Extrair informações do código PIX (se for EMV)
    let pixInfo = null;
    try {
      // Tentar extrair informações do código EMV
      if (pixCode.startsWith('000201')) {
        // É um código EMV (padrão brasileiro)
        const urlMatch = pixCode.match(/https?:\/\/[^\s]+/);
        const amountMatch = pixCode.match(/5303986(\d{2})(\d{1,13})/);
        
        pixInfo = {
          format: 'EMV',
          hasUrl: !!urlMatch,
          url: urlMatch ? urlMatch[0] : null,
          amount: amountMatch ? {
            currency: 'BRL',
            value: parseFloat(amountMatch[2]) / 100
          } : null,
          provider: isBluPay ? 'BluPay' : isUmbrellaPag ? 'UmbrellaPag' : 'Desconhecido'
        };
      }
    } catch (error) {
      console.error('❌ Erro ao extrair informações do PIX:', error);
    }

    return res.status(200).json({
      success: true,
      pixCode: pixCode.substring(0, 50) + '...',
      analysis: {
        isBluPay: isBluPay,
        isUmbrellaPag: isUmbrellaPag,
        provider: isBluPay ? 'BluPay' : isUmbrellaPag ? 'UmbrellaPag' : 'Desconhecido',
        pixInfo: pixInfo
      },
      found: orders.length > 0,
      orders: orders.map(order => ({
        order_number: order.order_number,
        customer_cpf: order.customer_cpf ? order.customer_cpf.substring(0, 3) + '***' : null,
        total_price: order.total_price,
        status: order.status,
        umbrella_status: order.umbrella_status,
        umbrella_transaction_id: order.umbrella_transaction_id,
        created_at: order.created_at,
        umbrella_paid_at: order.umbrella_paid_at,
      })),
      message: orders.length > 0 
        ? `Encontrado ${orders.length} pedido(s) relacionado(s) a este código PIX`
        : isBluPay 
          ? '⚠️ Este código PIX é do BluPay, não do UmbrellaPag. Pode ser um PIX antigo ou de outro sistema.'
          : 'Nenhum pedido encontrado com este código PIX'
    });

  } catch (err) {
    console.error('❌ Erro ao buscar transação:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro desconhecido ao buscar transação'
    });
  }
}

