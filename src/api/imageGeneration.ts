/**
 * Módulo para geração de imagens da história usando a API OpenAI
 * Responsável por criar o conteúdo visual, personagens, cenários e estilos.
 */

import OpenAI from "openai";
import dotenv from 'dotenv';

/**
 * Configuração inicial do módulo
 * Carrega variáveis de ambiente e inicializa o cliente da API OpenAI
 */
dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error('API key da OpenAI não encontrada no arquivo .env');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Gera uma imagem baseada em um prompt, estilo e informações de cena
 * Mantém consistência entre cenas de uma mesma história
 * 
 * @param {string} [prompt] - Texto de prompt personalizado (opcional)
 * @param {string} [style] - Estilo visual desejado (opcional)
 * @param {any} [scene] - Objeto de cena contendo descrição e metadados (opcional)
 * @param {string[]} [previousImages=[]] - URLs de imagens anteriores para manter consistência
 * @returns {Promise<string>} URL da imagem gerada ou caminho para placeholder
 */
export async function generateImage(
  prompt?: string,
  style?: string,
  scene?: any,
  previousImages: string[] = []
): Promise<string> {
  
  // Adiciona instruções para manter consistência visual entre cenas
  let consistencyPrompt = "";
  if (previousImages && previousImages.length > 0) {
    consistencyPrompt = "Mantenha a aparência consistente dos personagens com as cenas anteriores. ";
  }
  
  // Parte 1: Tratamento específico para amostras de estilo
  if (prompt && prompt.includes("Ilustração no estilo")) {
    return generateStyleSample(prompt, style);
  }
  
  // Parte 2: Uso de prompt direto fornecido pelo usuário/sistema
  if (prompt && prompt.trim() !== '') {
    
    // Adiciona instruções de consistência ao prompt
    let finalPrompt = `Create an image based on this description: ${consistencyPrompt}${prompt.trim()}`;
    
    // Adiciona informações sobre continuidade para cenas não-iniciais
    if (scene && scene.order && scene.order > 0) {
      finalPrompt += ` Esta é a cena ${scene.order + 1} de uma sequência contínua. Mantenha os personagens visualmente idênticos às cenas anteriores.`;
    }
    
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: finalPrompt,
        n: 1,
        size: "1024x1024",
        quality: "hd",
        style: "vivid",
      });

      const url = response.data?.[0]?.url;
      return url || "/images/placeholder.jpg";
    } catch (error) {
      console.error("Erro ao gerar imagem com prompt direto:", error);
      return "/images/placeholder.jpg";
    }
  }
  
  // Parte 3: Uso da descrição da cena fornecida no objeto scene
  if (scene && scene.description && typeof scene.description === 'string' && scene.description.trim() !== '') {
    
    // Usa a descrição da cena como base para o prompt
    let finalPrompt = `Create an image based on this description: ${consistencyPrompt}${scene.description.trim()}`;
    
    // Adiciona instruções de consistência para cenas não-iniciais
    if (scene.order && scene.order > 0) {
      finalPrompt += ` Esta é a cena ${scene.order + 1} de uma sequência contínua. Mantenha os mesmos personagens, com a mesma aparência física, roupas e cores das cenas anteriores.`;
    }
    
    // Adiciona informações de estilo, se fornecidas
    if (style && style.trim() !== '') {
      const translatedStyle = translateStyleToEnglish(style);
      finalPrompt = `${translatedStyle} ${finalPrompt}`;
    }

    // Limita o tamanho do prompt para a API
    if (finalPrompt.length > 1000) {
      finalPrompt = finalPrompt.slice(0, 1000);
    }

    // Chamada à API DALL-E 3
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: finalPrompt,
        n: 1,
        size: "1024x1024",
        quality: "hd",
        style: "vivid",
      });

      const url = response.data?.[0]?.url;
      return url || "/images/placeholder.jpg";
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
      return "/images/placeholder.jpg";
    }
  } 
  // Parte 4: Uso de campos alternativos quando a descrição está ausente
  else if (scene) {
    let alternativeText = '';
    
    // Tenta usar narração, diálogo ou título como fallback
    if (scene.narration && typeof scene.narration === 'string' && scene.narration.trim() !== '') {
      alternativeText = scene.narration.trim();
    } else if (scene.dialogue && typeof scene.dialogue === 'string' && scene.dialogue.trim() !== '') {
      alternativeText = scene.dialogue.trim();
    } else if (scene.title && typeof scene.title === 'string' && scene.title.trim() !== '') {
      alternativeText = scene.title.trim();
    }
    
    if (alternativeText) {
      // Criar prompt a partir do texto alternativo
      let finalPrompt = `Create an image based on this description: ${consistencyPrompt}${alternativeText}`;
      
      // Adiciona informações de consistência para cenas não-iniciais
      if (scene.order && scene.order > 0) {
        finalPrompt += ` Esta é a cena ${scene.order + 1} de uma sequência contínua. Mantenha os mesmos personagens, com a mesma aparência física, roupas e cores das cenas anteriores.`;
      }
      
      // Adiciona informações de estilo, se fornecidas
      if (style && style.trim() !== '') {
        const translatedStyle = translateStyleToEnglish(style);
        finalPrompt = `${translatedStyle} ${finalPrompt}`;
      }
      
      // Limita o tamanho do prompt
      if (finalPrompt.length > 1000) {
        finalPrompt = finalPrompt.slice(0, 1000);
      }
      
      // Chamada à API DALL-E 3
      try {
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: finalPrompt,
          n: 1,
          size: "1024x1024",
          quality: "hd",
          style: "vivid",
        });
        
        const url = response.data?.[0]?.url;
        return url || "/images/placeholder.jpg";
      } catch (error) {
        console.error("Erro ao gerar imagem com texto alternativo:", error);
        return "/images/placeholder.jpg";
      }
    }
  }
  
  // Fallback para casos onde não temos dados suficientes
  console.error("Sem descrição ou prompt válidos para gerar imagem");
  return "/images/placeholder.jpg";
}

/**
 * Gera uma amostra visual para demonstrar um estilo específico
 * Usado para permitir ao usuário escolher entre diferentes opções visuais
 * 
 * @param {string} prompt - Prompt completo com instruções de estilo
 * @param {string} [style] - Estilo visual adicional (opcional)
 * @returns {Promise<string>} URL da imagem de amostra gerada
 */
async function generateStyleSample(prompt: string, style?: string): Promise<string> {
  // Extrai o estilo do prompt utilizando regex
  const styleMatch = prompt.match(/estilo\s+([^\s,]+)/i);
  const requestedStyle = styleMatch?.[1] || style || '';
  
  // Traduz o estilo para termo equivalente em inglês
  const translatedStyle = translateStyleToEnglish(requestedStyle);
  
  // Cria prompt simplificado para demonstrar o estilo visual
  const finalPrompt = `${translatedStyle} style image with people`;
  
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: finalPrompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      style: "vivid",
    });
    
    const url = response.data?.[0]?.url;
    return url || "/images/placeholder.jpg";
  } catch (error) {
    console.error("Erro ao gerar amostra de estilo:", error);
    return "/images/placeholder.jpg";
  }
}

/**
 * Traduz termos de estilo visual do português para o inglês
 * Permite usar terminologia artística adequada nos prompts para a API
 * 
 * @param {string} style - Termo de estilo em português
 * @returns {string} Termo equivalente em inglês ou o original se não houver mapeamento
 */
function translateStyleToEnglish(style: string): string {
  if (!style) return 'realistic';
  
  // Mapeamento de termos de estilo do português para o inglês
  const styleMap: Record<string, string> = {
    'realista': 'photorealistic',
    'fotorrealista': 'hyper-realistic',
    'aquarela': 'watercolor painting',
    'cartoon': 'cartoon',
    'anime': 'anime style',
    'óleo': 'oil painting',
    'pastel': 'pastel drawing',
    'pixelart': 'pixel art',
    'pintura': 'painting'
  };
  
  const lowerStyle = style.toLowerCase();
  return styleMap[lowerStyle] ?? style;
}