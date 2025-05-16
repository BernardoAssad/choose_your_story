/**
 * Controlador para gerenciamento de cenas da história
 * Responsável por criar, atualizar, recuperar e excluir cenas
 */

import { v4 as uuidv4 } from 'uuid';
import { Scene } from '../models/Scene';
import { generateImage } from '../api/imageGeneration';

// Array para armazenar todas as cenas em memória
const scenes: Scene[] = [];

/**
 * Cria uma nova cena para uma história
 * 
 * @param {string} storyId - ID da história à qual a cena pertence
 * @param {number} order - Ordem da cena na sequência da história
 * @param {Object} data - Dados da cena (título, descrição, narração, diálogo)
 * @returns {Promise<Scene>} A cena criada
 */
export async function createScene(storyId: string, order: number, data: any): Promise<Scene> {
  // Cria um novo objeto de cena com ID único
  const scene: Scene = {
    id: uuidv4(),            // Gera ID único para a cena
    storyId,                 // ID da história relacionada
    order,                   // Posição na sequência da história
    title: data.title || `Cena ${order + 1}`,  // Título ou valor padrão
    description: data.description || '',       // Descrição do ambiente/personagens
    narration: data.narration || '',          // Narração dos eventos
    dialogue: data.dialogue || '',            // Diálogos dos personagens
    imageUrl: ''                              // Inicialmente sem imagem
  };
  
  // Adiciona a cena ao array de cenas
  scenes.push(scene);
  return scene;
}

/**
 * Atualiza a imagem de uma cena existente
 * 
 * @param {string} sceneId - ID da cena a ser atualizada
 * @param {string} style - Estilo visual para a imagem
 * @param {Scene} scene - Objeto da cena para extrair dados para o prompt
 * @param {string[]} previousImages - URLs de imagens anteriores para manter consistência
 * @returns {Promise<Scene>} A cena atualizada
 */
export async function updateSceneImage(sceneId: string, style: string, scene: Scene, previousImages: string[] = []): Promise<Scene> {
  // Busca a cena no array
  const sceneObj = scenes.find(s => s.id === sceneId);
  if (!sceneObj) throw new Error('Cena não encontrada');
  
  try {
    // CORREÇÃO: Usar o sceneObj em vez do parâmetro scene
    const imageUrl = await generateImage("", style, sceneObj, previousImages);
    sceneObj.imageUrl = imageUrl;
  } catch (error) {
    // Em caso de erro, define uma imagem placeholder
    console.error("Erro ao gerar imagem:", error);
    sceneObj.imageUrl = "/images/placeholder.jpg";
  }
  
  return sceneObj;
}

/**
 * Regenera a imagem de uma cena usando um prompt personalizado
 * 
 * @param {string} sceneId - ID da cena a ter a imagem regenerada
 * @param {string} customPrompt - Prompt personalizado para a imagem
 * @param {string} style - Estilo visual para a imagem
 * @param {string[]} previousImages - URLs de imagens anteriores para manter consistência
 * @returns {Promise<Scene>} A cena atualizada
 */
export async function regenerateSceneImage(sceneId: string, customPrompt: string, style: string, previousImages: string[] = []): Promise<Scene> {
  // Busca a cena no array
  const sceneObj = scenes.find(s => s.id === sceneId);
  if (!sceneObj) throw new Error('Cena não encontrada');
  
  try {
    // CORREÇÃO: Se não houver prompt personalizado, use a descrição da cena
    if (!customPrompt || customPrompt.trim() === '') {
      // Se não há prompt customizado, usa a descrição da cena
      const imageUrl = await generateImage("", style, sceneObj, previousImages);
      sceneObj.imageUrl = imageUrl;
    } else {
      // Se há prompt customizado, usa-o diretamente
      const imageUrl = await generateImage(customPrompt, style, null, previousImages);
      sceneObj.imageUrl = imageUrl;
    }
  } catch (error) {
    // Em caso de erro, define uma imagem placeholder
    console.error("Erro ao gerar imagem:", error);
    sceneObj.imageUrl = "/images/placeholder.jpg";
  }
  
  return sceneObj;
}

/**
 * Obtém todas as cenas de uma história específica
 * 
 * @param {string} storyId - ID da história
 * @returns {Scene[]} Array de cenas ordenadas pela propriedade 'order'
 */
export function getScenesByStory(storyId: string): Scene[] {
  // Filtra cenas pela história e ordena pela ordem na sequência
  return scenes.filter(scene => scene.storyId === storyId).sort((a, b) => a.order - b.order);
}

/**
 * Obtém uma cena específica pelo ID
 * 
 * @param {string} sceneId - ID da cena a ser recuperada
 * @returns {Scene} A cena encontrada
 * @throws {Error} Se a cena não for encontrada
 */
export function getScene(sceneId: string): Scene {
  const scene = scenes.find(s => s.id === sceneId);
  if (!scene) throw new Error('Cena não encontrada');
  return scene;
}

/**
 * Atualiza os campos de uma cena existente
 * 
 * @param {string} sceneId - ID da cena a ser atualizada
 * @param {Object} updates - Objeto com os campos a serem atualizados
 * @returns {Promise<Scene>} A cena atualizada
 * @throws {Error} Se a cena não for encontrada
 */
export async function updateScene(sceneId: string, updates: any): Promise<Scene> {
  // Busca a cena no array
  const scene = scenes.find(s => s.id === sceneId);
  if (!scene) throw new Error('Cena não encontrada');
  
  // Atualiza apenas os campos fornecidos
  if (updates.title) scene.title = updates.title;
  if (updates.description) scene.description = updates.description;
  if (updates.narration) scene.narration = updates.narration;
  if (updates.dialogue) scene.dialogue = updates.dialogue;
  
  return scene;
}

/**
 * Remove uma cena do array de cenas
 * 
 * @param {string} sceneId - ID da cena a ser removida
 */
export function deleteScene(sceneId: string): void {
  const index = scenes.findIndex(s => s.id === sceneId);
  if (index !== -1) scenes.splice(index, 1);
}

/**
 * Obtém todas as cenas do sistema
 * 
 * @returns {Scene[]} Cópia do array de todas as cenas
 */
export function getAllScenes(): Scene[] {
  return [...scenes];
}

/**
 * Limpa todas as cenas do array
 * Útil para testes ou reset do sistema
 */
export function clearScenes(): void {
  scenes.length = 0;
}

/**
 * Gera imagens para todas as cenas de uma história
 * 
 * @param {string} storyId - ID da história
 * @param {string} style - Estilo visual para as imagens
 * @returns {Promise<Scene[]>} Array de cenas atualizadas com imagens
 */
export async function generateImagesForStory(storyId: string, style: string): Promise<Scene[]> {
  const storyScenes = getScenesByStory(storyId);
  const updatedScenes = [];
  
  // Array para armazenar URLs de imagens anteriores
  const previousImages = [];
  
  for (const scene of storyScenes) {
    // Use a própria cena como parâmetro e passe o array de imagens anteriores
    const updatedScene = await updateSceneImage(scene.id, style, scene, previousImages);
    
    // Adiciona a URL da imagem gerada ao array de imagens anteriores
    if (updatedScene.imageUrl && updatedScene.imageUrl !== "/images/placeholder.jpg") {
      previousImages.push(updatedScene.imageUrl);
    }
    
    updatedScenes.push(updatedScene);
  }
  
  return updatedScenes;
}