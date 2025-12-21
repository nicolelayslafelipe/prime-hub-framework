import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Obter CEP da query string
    const url = new URL(req.url);
    const cep = url.searchParams.get('cep');

    console.log('[cep-lookup] Recebido CEP:', cep);

    // Validar CEP
    if (!cep) {
      return new Response(
        JSON.stringify({ success: false, error: 'CEP não informado', errorType: 'invalid_cep' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limpar CEP (apenas números)
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      return new Response(
        JSON.stringify({ success: false, error: 'CEP deve ter 8 dígitos', errorType: 'invalid_cep' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar no ViaCEP
    console.log('[cep-lookup] Consultando ViaCEP:', cleanCep);
    
    const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!viaCepResponse.ok) {
      console.log('[cep-lookup] Erro HTTP do ViaCEP:', viaCepResponse.status);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Não foi possível consultar o serviço de CEP',
          errorType: 'network_error'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await viaCepResponse.json();
    console.log('[cep-lookup] Resposta ViaCEP:', data);

    // ViaCEP retorna { erro: true } quando CEP não existe
    if (data.erro === true) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'CEP não encontrado',
          errorType: 'not_found'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sucesso - retornar dados formatados
    const result = {
      success: true,
      data: {
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
        isPartial: !data.logradouro,
      }
    };

    console.log('[cep-lookup] Retornando:', result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[cep-lookup] Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno ao buscar CEP',
        errorType: 'network_error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
