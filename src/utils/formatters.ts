/**
 * Remove caracteres especiais e limita o texto a um determinado comprimento
 * Útil para preparar textos para exibição ou uso em prompts
 * 
 * @param {string} text - Texto para sanitizar
 * @param {number} maxLength - Comprimento máximo (padrão: 100)
 * @returns {string} Texto sanitizado
 */
export function sanitizeText(text: string, maxLength: number = 100): string {
  if (!text) return '';
  
  // Remove caracteres especiais, mantendo apenas alfanuméricos e pontuação básica
  const sanitized = text
    .replace(/[^\w\s.,;:!?'"()-]/g, '')
    .trim();
  
  // Trunca o texto se exceder o comprimento máximo
  return sanitized.length > maxLength 
    ? sanitized.substring(0, maxLength) + '...' 
    : sanitized;
}

/**
 * Formata um prompt para geração de imagem com estilo e conteúdo
 * 
 * @param {string} prompt - Texto principal do prompt
 * @param {string} style - Estilo visual desejado
 * @returns {string} Prompt formatado para o gerador de imagens
 */
export function formatImagePrompt(prompt: string, style: string): string {
  const cleanPrompt = sanitizeText(prompt, 900);  // Limita o prompt a 900 caracteres
  const cleanStyle = sanitizeText(style, 50);     // Limita o estilo a 50 caracteres
  
  // Formata o prompt no padrão esperado pelo gerador de imagens
  return `${cleanStyle} style. ${cleanPrompt}. High quality, detailed, professional illustration.`;
}

/**
 * Formata uma data para exibição no padrão brasileiro
 * 
 * @param {Date} date - Data a ser formatada
 * @returns {string} Data formatada como string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Converte um texto para formato de URL amigável (slug)
 * 
 * @param {string} text - Texto a ser convertido
 * @returns {string} Slug gerado
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')                // Normaliza acentos
    .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
    .toLowerCase()                   // Converte para minúsculas
    .trim()                          // Remove espaços no início e fim
    .replace(/\s+/g, '-')            // Substitui espaços por hífens
    .replace(/[^\w-]+/g, '')         // Remove caracteres não-palavra
    .replace(/--+/g, '-');           // Substitui múltiplos hífens por um único
}

/**
 * Extrai uma amostra de texto para exibição em resumos
 * Tenta terminar a amostra em um ponto final para melhor legibilidade
 * 
 * @param {string} text - Texto completo
 * @param {number} maxLength - Tamanho máximo do resumo (padrão: 150)
 * @returns {string} Texto resumido
 */
export function getSummary(text: string, maxLength: number = 150): string {
  if (!text) return '';
  
  // Se já for menor que o tamanho máximo, retorna o texto completo
  if (text.length <= maxLength) return text;
  
  // Tenta encontrar um ponto final para terminar o resumo de forma natural
  const truncated = text.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  
  // Se encontrou um ponto final após metade do texto, termina ali
  if (lastPeriod > 0 && lastPeriod > maxLength * 0.5) {
    return truncated.substring(0, lastPeriod + 1);
  } else {
    // Senão, simplesmente trunca e adiciona reticências
    return truncated + '...';
  }
}

/**
 * Formata um objeto JSON para exibição mais legível
 * 
 * @param {any} data - Objeto para formatar
 * @returns {string} JSON formatado como string
 */
export function prettyJSON(data: any): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Converte lista de cenas em formato adequado para UI
 * Padroniza os campos e adiciona valores padrão onde necessário
 * 
 * @param {any[]} scenes - Lista de cenas
 * @returns {any[]} Cenas formatadas para UI
 */
export function formatScenesForUI(scenes: any[]): any[] {
  return scenes.map((scene, index) => ({
    index: index + 1,
    title: `Cena ${index + 1}`,
    description: scene.description,
    narration: scene.narration,
    dialogue: scene.dialogue || 'Não há diálogos nesta cena.',
    imageUrl: scene.imageUrl || '',
  }));
}

/**
 * Gera texto para prompt baseado nas cenas anteriores
 * Útil para manter consistência ao gerar novas cenas
 * 
 * @param {any[]} scenes - Cenas anteriores
 * @returns {string} Contexto para o prompt
 */
export function generateContextFromPreviousScenes(scenes: any[]): string {
  if (!scenes || scenes.length === 0) return '';
  
  // Usa apenas as 2 cenas mais recentes para limitar o tamanho do contexto
  const recentScenes = scenes.slice(-2);
  let context = 'Baseando-se nas seguintes cenas anteriores: ';
  
  // Compila informações relevantes de cada cena recente
  recentScenes.forEach((scene, index) => {
    context += `Cena ${scenes.indexOf(scene) + 1}: ${scene.description}. `;
    if (scene.narration) context += `${scene.narration} `;
    if (scene.dialogue) context += `Diálogo: ${scene.dialogue} `;
  });
  
  context += 'Continue a história de forma coerente.';
  return context;
}