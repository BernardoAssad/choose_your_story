/**
 * Controlador para gerenciamento de histórias
 * Responsável por criar, atualizar, recuperar histórias e gerenciar seus estilos visuais
 * Orquestra o fluxo de geração de conteúdo e imagens para cada história
 */

import { v4 as uuidv4 } from 'uuid';
import { generateStoryProposal, generateScenes, generateStyleSamples } from '../api/openai';
import { Story } from '../models/Story';
import { Scene } from '../models/Scene';
import * as sceneController from './sceneController';
import { generateImage } from '../api/imageGeneration';

/**
 * Repositório em memória para armazenar todas as histórias
 * Em um ambiente de produção, seria substituído por um banco de dados
 */
const stories: Story[] = [];

/**
 * Cria uma nova história baseada em um briefing fornecido pelo usuário
 * Gera uma proposta narrativa usando IA e inicializa a estrutura da história
 * 
 * @param {string} briefing - Briefing inicial da história
 * @returns {Promise<Story>} A história criada com proposta gerada pela IA
 */
export async function createStory(briefing: string): Promise<Story> {
  // Gera proposta narrativa através da API OpenAI
  const proposal = await generateStoryProposal(briefing);

  // Cria novo objeto de história com ID único
  const story: Story = {
    id: uuidv4(),
    title: proposal.split('.')[0], // Usa a primeira frase como título
    briefing,
    proposal,
    style: '',
    scenes: [],
    createdAt: new Date(),
    visualSamples: [],
    selectedVisualSample: undefined
  };

  // Armazena a história no repositório
  stories.push(story);
  return story;
}

/**
 * Gera amostras visuais para uma história baseadas em um estilo específico
 * Permite ao usuário visualizar diferentes representações da história antes de prosseguir
 * 
 * @param {string} storyId - ID da história
 * @param {string} style - Estilo visual desejado (ex: "realista", "cartoon")
 * @returns {Promise<any[]>} Array de objetos de amostra visual com imagens
 * @throws {Error} Se a história não for encontrada ou houver erro na geração
 */
export async function generateVisualSamples(storyId: string, style: string): Promise<any[]> {
  // Localiza a história no repositório
  const story = stories.find(s => s.id === storyId);
  if (!story) throw new Error('História não encontrada');

  // Armazena o estilo escolhido na história
  story.style = style;

  const visualSamples = [];
  try {
    // Gera exatamente 3 amostras visuais diferentes do mesmo estilo
    for (let i = 0; i < 3; i++) {
      // Cria prompt específico para amostra visual
      const samplePrompt = `Ilustração no estilo ${style} mostrando: ${story.proposal.substring(0, 100).replace(/"/g, "'")}. Alta qualidade, cores vivas, personagens completos, sem texto.`;
      
      // Cria objeto de cena provisório para gerar a imagem
      const mockScene = {
        description: story.proposal.substring(0, 100)
      };
      
      // Gera imagem através da API
      const imageUrl = await generateImage(samplePrompt, style, mockScene);
      
      // Adiciona a amostra visual ao array
      visualSamples.push({
        title: `Exemplo ${i + 1}`,
        description: `Exemplo visual no estilo ${style}`,
        narration: '',
        dialogue: '',
        imageUrl
      });
    }

    // Armazena as amostras na história
    story.visualSamples = visualSamples;
    return visualSamples;
  } catch (error) {
    console.error("Erro ao gerar amostras visuais:", error);
    throw error;
  }
}

/**
 * Seleciona uma amostra visual específica para a história
 * Define o estilo visual que será aplicado a todas as cenas
 * 
 * @param {string} storyId - ID da história
 * @param {number} sampleIndex - Índice da amostra visual selecionada
 * @returns {Promise<Story>} A história atualizada com a amostra selecionada
 * @throws {Error} Se a história ou amostra não forem encontradas
 */
export async function selectVisualSample(storyId: string, sampleIndex: number): Promise<Story> {
  // Localiza a história no repositório
  const story = stories.find(s => s.id === storyId);
  if (!story) throw new Error('História não encontrada');
  
  // Valida a seleção da amostra
  if (!story.visualSamples || sampleIndex < 0 || sampleIndex >= story.visualSamples.length) {
    throw new Error('Amostra visual inválida');
  }
  
  // Define a amostra visual selecionada
  story.selectedVisualSample = story.visualSamples[sampleIndex];
  
  return story;
}

/**
 * Gera código HTML para exportar uma história completa
 * Permite ao usuário baixar a história para visualização offline
 * 
 * @param {string} storyId - ID da história a ser exportada
 * @returns {string} Código HTML da história formatada
 */
export function generateHtmlExport(storyId: string): string {
  const story = getStory(storyId);
  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${story.title}</title>
  <style>
    body { font-family: sans-serif; padding: 20px; max-width: 800px; margin: auto; }
    h1, h2 { text-align: center; }
    .scene { margin-bottom: 30px; border-bottom: 1px solid #ccc; padding-bottom: 20px; }
    .scene img { width: 100%; max-height: 400px; object-fit: contain; }
    .dialogue { background: #f1f1f1; padding: 10px; }
  </style></head><body>
  <h1>${story.title}</h1>`;

  // Adiciona cada cena ao documento HTML
  story.scenes.forEach((scene, index) => {
    html += `<div class="scene">
      <h2>${scene.title || 'Cena ' + (index + 1)}</h2>
      ${scene.imageUrl ? `<img src="${scene.imageUrl}" />` : ''}
      <p><strong>Descrição:</strong><br>${scene.description}</p>
      <p><strong>Narração:</strong><br>${scene.narration}</p>
      <div class="dialogue"><strong>Diálogo:</strong><br>${scene.dialogue}</div>
    </div>`;
  });

  html += `</body></html>`;
  return html;
}

/**
 * Define o estilo visual para uma história e gera amostras de descrição
 * 
 * @param {string} storyId - ID da história
 * @param {string} style - Estilo visual desejado
 * @param {number} sampleCount - Número de amostras a serem geradas (padrão: 3)
 * @returns {Promise<string[]>} Array de descrições de estilo
 * @throws {Error} Se a história não for encontrada
 */
export async function setStoryStyle(storyId: string, style: string, sampleCount: number = 3): Promise<string[]> {
  // Localiza a história no repositório
  const story = stories.find(s => s.id === storyId);
  if (!story) throw new Error('História não encontrada');
  
  // Armazena o estilo na história
  story.style = style;
  
  // Gera amostras textuais do estilo visual
  const styleSamples = await generateStyleSamples(story.proposal, style, sampleCount);
  return styleSamples;
}

/**
 * Gera cenas para uma história e suas respectivas imagens
 * Processamento principal que cria o conteúdo narrativo e visual da história
 * 
 * @param {string} storyId - ID da história
 * @param {number} numScenes - Número de cenas a serem geradas
 * @param {string} samplePrompt - Prompt de exemplo (opcional)
 * @returns {Promise<Scene[]>} Array de objetos de cena com texto e imagens
 * @throws {Error} Se a história não for encontrada
 */
export async function generateStoryScenes(storyId: string, numScenes: number, samplePrompt?: string): Promise<Scene[]> {
  // Localiza a história no repositório
  const story = stories.find(s => s.id === storyId);
  if (!story) throw new Error('História não encontrada');
  
  // Gera o conteúdo textual das cenas através da API OpenAI
  const generatedScenes = await generateScenes(story.proposal, numScenes);
  const sceneObjects: Scene[] = [];
  
  // Ajusta o número de cenas geradas para corresponder ao solicitado
  let adjustedScenes = [...generatedScenes];
  
  // Se foram geradas menos cenas que o solicitado, preenche as faltantes
  if (adjustedScenes.length < numScenes) {
    console.warn(`Foram geradas apenas ${adjustedScenes.length} de ${numScenes} cenas solicitadas. Gerando as restantes...`);
    
    while (adjustedScenes.length < numScenes) {
      const lastScene = adjustedScenes[adjustedScenes.length - 1];
      const newScene = {
        title: `Cena ${adjustedScenes.length + 1}`,
        description: lastScene ? `Continuação: ${lastScene.description}` : 'Nova cena',
        narration: lastScene ? lastScene.narration : 'Narração da cena',
        dialogue: lastScene ? lastScene.dialogue : ''
      };
      adjustedScenes.push(newScene);
    }
  } 
  // Se foram geradas mais cenas que o solicitado, remove as excedentes
  else if (adjustedScenes.length > numScenes) {
    console.warn(`Foram geradas ${adjustedScenes.length} cenas, limitando para ${numScenes} conforme solicitado.`);
    adjustedScenes = adjustedScenes.slice(0, numScenes);
  }
  
  // Cria objetos de cena no sistema para cada cena gerada
  for (let i = 0; i < adjustedScenes.length; i++) {
    const sceneData = adjustedScenes[i];
    const scene = await sceneController.createScene(storyId, i, sceneData);
    sceneObjects.push(scene);
  }
  
  // Atualiza a história com as cenas geradas
  story.scenes = sceneObjects;
  
  // Gera imagens para todas as cenas se um estilo visual já foi definido
  if (story.style) {
    await sceneController.generateImagesForStory(storyId, story.style);
  }
  
  return sceneObjects;
}

/**
 * Obtém uma história específica pelo ID com suas cenas
 * 
 * @param {string} storyId - ID da história a ser recuperada
 * @returns {Story} A história completa com todas as suas cenas
 * @throws {Error} Se a história não for encontrada
 */
export function getStory(storyId: string): Story {
  // Localiza a história no repositório
  const story = stories.find(s => s.id === storyId);
  if (!story) throw new Error('História não encontrada');
  
  // Carrega as cenas associadas a esta história
  story.scenes = sceneController.getScenesByStory(storyId);
  return story;
}

/**
 * Obtém todas as histórias do sistema com suas respectivas cenas
 * 
 * @returns {Story[]} Array de todas as histórias com dados completos
 */
export function getAllStories(): Story[] {
  return stories.map(story => ({
    ...story,
    scenes: sceneController.getScenesByStory(story.id)
  }));
}

/**
 * Atualiza a proposta de uma história existente
 * Permite ao usuário editar a narrativa principal
 * 
 * @param {string} storyId - ID da história a ser atualizada
 * @param {string} proposal - Nova proposta de história
 * @returns {Promise<Story>} A história atualizada
 * @throws {Error} Se a história não for encontrada
 */
export async function updateStoryProposal(storyId: string, proposal: string): Promise<Story> {
  // Localiza a história no repositório
  const story = stories.find(s => s.id === storyId);
  if (!story) throw new Error('História não encontrada');
  
  // Atualiza a proposta e recalcula o título
  story.proposal = proposal;
  story.title = proposal.split('.')[0];
  
  return story;
}

/**
 * Remove uma história e todas as suas cenas do sistema
 * 
 * @param {string} storyId - ID da história a ser removida
 */
export function deleteStory(storyId: string): void {
  const index = stories.findIndex(s => s.id === storyId);
  if (index !== -1) {
    // Remove todas as cenas associadas a esta história
    const scenesToDelete = sceneController.getScenesByStory(storyId);
    scenesToDelete.forEach(scene => sceneController.deleteScene(scene.id));
    
    // Remove a história do repositório
    stories.splice(index, 1);
  }
}