/**
 * Módulo para geração de conteúdo da história usando a API OpenAI
 * Responsável por criar o conteúdo narrativo, cenas e estilos visuais
 */


import OpenAI from "openai";
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

// Configura a API com a chave da OpenAI
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error('OPENAI_API_KEY não encontrada no arquivo .env');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Extrai o conteúdo da resposta da API OpenAI
 * 
 * @param {any} response - Resposta da API da OpenAI
 * @returns {string} Conteúdo extraído da resposta
 * @throws {Error} Se o conteúdo não for válido
 */
function extractContent(response: any): string {
  const content = response.choices?.[0]?.message?.content;
  if (!content) throw new Error('Resposta da API não contém conteúdo válido');
  return content;
}

/**
 * Gera uma proposta de história baseada em um briefing
 * 
 * @param {string} briefing - Descrição geral da história desejada
 * @returns {Promise<string>} Texto da proposta de história
 */
export async function generateStoryProposal(briefing: string): Promise<string> {
  const prompt = `Crie uma história linear envolvente baseada no seguinte briefing: ${briefing}. 
  IMPORTANTE: Retorne APENAS um resumo da história sem divisão em cenas. 
  Use um parágrafo para introduzir a premissa, alguns para o desenvolvimento e um para o desfecho.
  NÃO divida o texto em cenas, personagens ou capítulos numerados.
  Escreva em português do Brasil, com no máximo 300 palavras totais.`;
  
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
  });
  
  return extractContent(response);
}

/**
 * Gera cenas para uma história existente
 * 
 * @param {string} storyProposal - Proposta de história a partir da qual gerar cenas
 * @param {number} numScenes - Número de cenas a serem geradas
 * @returns {Promise<any[]>} Array de objetos de cena
 */
export async function generateScenes(storyProposal: string, numScenes: number): Promise<any[]> {
  // Validar e limitar o número de cenas
  const actualNumScenes = Math.min(Math.max(numScenes, 3), 15);
  
  const prompt = `Baseado na seguinte história: "${storyProposal}", crie EXATAMENTE ${actualNumScenes} cenas sequenciais. 
  VOCÊ DEVE CRIAR EXATAMENTE ${actualNumScenes} CENAS, NÃO MAIS E NÃO MENOS.

FORMATO ESPERADO:
Para cada cena, forneça claramente:

Cena 1:
Título: [título descritivo]
Descrição: [ambiente, personagens, visuais]
Narração: [o que acontece na cena]
Diálogo: [diálogos se houver]

Cena 2:
[e assim por diante até a Cena ${actualNumScenes}]

IMPORTANTE:
- Todo o texto deve estar em português do Brasil
- Cada cena deve ter um título descritivo
- As descrições devem ser visuais e específicas
- Os diálogos devem ser naturais e interessantes
- MANTENHA EXATAMENTE O FORMATO ACIMA, com cada item em sua própria linha
- LEMBRE-SE: CRIAR EXATAMENTE ${actualNumScenes} CENAS, COMEÇANDO NA CENA 1 E TERMINANDO NA CENA ${actualNumScenes}`;
  
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 3000,
  });
  
  const content = extractContent(response);
  const processedScenes = processScenes(content, actualNumScenes, storyProposal);
  
  // Verificar se o número de cenas processadas corresponde ao solicitado
  if (processedScenes.length !== actualNumScenes) {
    console.warn(`Processamento gerou ${processedScenes.length} cenas, mas ${actualNumScenes} foram solicitadas. Ajustando...`);
    
    // Ajustar para garantir o número correto de cenas
    if (processedScenes.length < actualNumScenes) {
      // Preencher cenas faltantes
      for (let i = processedScenes.length; i < actualNumScenes; i++) {
        processedScenes.push({
          title: `Cena ${i + 1}`,
          description: `Continuação da história em ${storyProposal.substring(0, 50)}...`,
          narration: "A história continua...",
          dialogue: ""
        });
      }
    } else {
      // Cortar cenas excedentes
      return processedScenes.slice(0, actualNumScenes);
    }
  }
  
  return processedScenes;
}

/**
 * Processa o texto gerado pela API e converte em objetos de cena estruturados
 * 
 * @param {string} content - Texto bruto retornado pela API
 * @param {number} numScenes - Número esperado de cenas
 * @param {string} storyProposal - Proposta original da história
 * @returns {any[]} Array de objetos de cena processados
 */
function processScenes(content: string, numScenes: number, storyProposal: string): any[] {
  const scenes = [];
  
  // Dividir por "Cena X:"
  const sceneBlocks = content.split(/Cena\s+\d+\s*:/i);
  
  for (let i = 1; i < sceneBlocks.length; i++) {
    const block = sceneBlocks[i].trim();
    
    const titleMatch = block.match(/Título\s*:\s*(.*?)(?:\r?\n|$)/i);
    const descMatch = block.match(/Descrição\s*:\s*([\s\S]*?)(?=Narração\s*:|Diálogo\s*:|$)/i);
    const narrMatch = block.match(/Narração\s*:\s*([\s\S]*?)(?=Diálogo\s*:|$)/i);
    const diagMatch = block.match(/Diálogo\s*:\s*([\s\S]*?)$/i);
    
    scenes.push({
      title: titleMatch && titleMatch[1] ? titleMatch[1].trim() : `Cena ${i}`,
      description: descMatch && descMatch[1] ? descMatch[1].trim() : '',
      narration: narrMatch && narrMatch[1] ? narrMatch[1].trim() : '',
      dialogue: diagMatch && diagMatch[1] ? diagMatch[1].trim() : ''
    });
  }
  
  // Processamento alternativo se necessário
  if (scenes.length === 0) {
    const lines = content.split('\n');
    let currentScene = null;
    let currentField = null;
    
    for (let line of lines) {
      line = line.trim();
      
      const sceneMatch = line.match(/^Cena\s+(\d+)\s*:?\s*$/i);
      if (sceneMatch) {
        if (currentScene) scenes.push(currentScene);
        currentScene = {
          title: `Cena ${sceneMatch[1]}`,
          description: '',
          narration: '',
          dialogue: ''
        };
        currentField = null;
        continue;
      }
      
      if (!currentScene) continue;
      
      // Detectar campos
      if (line.match(/^Título\s*:/i)) {
        currentField = 'title';
        const value = line.replace(/^Título\s*:\s*/i, '').trim();
        if (value) currentScene.title = value;
      } 
      else if (line.match(/^Descrição\s*:/i)) {
        currentField = 'description';
        const value = line.replace(/^Descrição\s*:\s*/i, '').trim();
        if (value) currentScene.description = value;
      } 
      else if (line.match(/^Narração\s*:/i)) {
        currentField = 'narration';
        const value = line.replace(/^Narração\s*:\s*/i, '').trim();
        if (value) currentScene.narration = value;
      } 
      else if (line.match(/^Diálogo\s*:/i)) {
        currentField = 'dialogue';
        const value = line.replace(/^Diálogo\s*:\s*/i, '').trim();
        if (value) currentScene.dialogue = value;
      } 
      else if (currentField && line) {
        // Adicionar ao campo atual
        if (currentField === 'title') {
          currentScene.title = currentScene.title ? `${currentScene.title} ${line}` : line;
        } else if (currentField === 'description') {
          currentScene.description = currentScene.description ? `${currentScene.description}\n${line}` : line;
        } else if (currentField === 'narration') {
          currentScene.narration = currentScene.narration ? `${currentScene.narration}\n${line}` : line;
        } else if (currentField === 'dialogue') {
          currentScene.dialogue = currentScene.dialogue ? `${currentScene.dialogue}\n${line}` : line;
        }
      }
    }
    
    if (currentScene) scenes.push(currentScene);
  }
  
  // Criar cenas padrão se necessário
  if (scenes.length === 0) {
    for (let i = 0; i < numScenes; i++) {
      scenes.push({
        title: `Cena ${i + 1}`,
        description: `Parte ${i + 1} da história sobre "${storyProposal.substring(0, 30)}..."`,
        narration: "Cena sem conteúdo específico.",
        dialogue: ""
      });
    }
  }
  
  return scenes;
}

/**
 * Gera amostras de estilo visual para uma história
 * 
 * @param {string} storyProposal - Proposta da história
 * @param {string} style - Estilo visual desejado
 * @param {number} count - Número de amostras a serem geradas (padrão: 3)
 * @returns {Promise<string[]>} Array de descrições de estilos visuais
 */
export async function generateStyleSamples(storyProposal: string, style: string, count: number = 3): Promise<string[]> {
  const sampleCount = Math.min(Math.max(count, 1), 5);
  
  const prompt = `Baseado na história: "${storyProposal}", crie ${sampleCount} descrições detalhadas para imagens 
  no estilo visual "${style}". Cada descrição deve:
  
  1. Representar uma cena diferente da história
  2. Ser detalhada o suficiente para um gerador de imagens AI
  3. Focar em elementos visuais como personagens, ambiente, iluminação, cores, perspectiva 
  4. Estar em português do Brasil
  
  Enumere cada descrição (1., 2., etc.) e use linguagem detalhada e visual.`;
  
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
  });
  
  const content = extractContent(response);
  const descriptions = content.split(/\d+\.\s/).filter(s => s.trim().length > 0);
  
  return descriptions.slice(0, sampleCount);
}