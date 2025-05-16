/**
 * Definição das rotas da API para o sistema de histórias
 * Gerencia endpoints para criar, ler, atualizar e excluir histórias e cenas
 */

import express from 'express';
import * as storyController from '../controllers/storyController';
import * as sceneController from '../controllers/sceneController';

const router = express.Router();

/**
 * Rota para criar nova história
 * POST /api/stories
 * 
 * @body {string} briefing - Briefing inicial da história
 * @returns {Story} A história criada
 */
router.post('/stories', async (req, res) => {
  try {
    const { briefing } = req.body;
    
    if (!briefing || briefing.trim() === '') {
      return res.status(400).json({ error: 'Briefing é obrigatório' });
    }
    
    const story = await storyController.createStory(briefing);
    res.json(story);
  } catch (error: any) {
    console.error('Erro ao criar história:', error);
    res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
});

/**
 * Rota para definir estilo visual
 * POST /api/stories/:id/style
 * 
 * @param {string} id - ID da história
 * @body {string} style - Estilo visual desejado
 * @body {number} sampleCount - Número de amostras a serem geradas (opcional)
 * @returns {Object} Objeto com amostras de estilo geradas
 */
router.post('/stories/:id/style', async (req, res) => {
  try {
    const { style, sampleCount } = req.body;
    
    if (!style || style.trim() === '') {
      return res.status(400).json({ error: 'Estilo visual é obrigatório' });
    }
    
    const count = sampleCount || 3;
    const styleSamples = await storyController.setStoryStyle(req.params.id, style, count);
    res.json({ styleSamples });
  } catch (error: any) {
    console.error('Erro ao definir estilo visual:', error);
    res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
});

/**
 * Rota para gerar cenas
 * POST /api/stories/:id/scenes
 * 
 * @param {string} id - ID da história
 * @body {number} numScenes - Número de cenas a serem geradas
 * @body {string} samplePrompt - Prompt de exemplo (opcional)
 * @returns {Object} Objeto com cenas geradas
 */
router.post('/stories/:id/scenes', async (req, res) => {
  try {
    const { numScenes, samplePrompt } = req.body;
    
    // Validar número de cenas
    const parsedNumScenes = parseInt(numScenes);
    if (isNaN(parsedNumScenes) || parsedNumScenes < 3 || parsedNumScenes > 15) {
      return res.status(400).json({ error: 'Número de cenas deve estar entre 3 e 15' });
    }
    
    // Gerar cenas com o número exato solicitado
    const scenes = await storyController.generateStoryScenes(req.params.id, parsedNumScenes, samplePrompt);
    
    // Verificar se o número de cenas geradas corresponde ao solicitado
    if (scenes.length !== parsedNumScenes) {
      console.warn(`Atenção: Foram solicitadas ${parsedNumScenes} cenas, mas foram geradas ${scenes.length}.`);
    }
    
    res.json({ scenes });
  } catch (error: any) {
    console.error('Erro ao gerar cenas:', error);
    res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
});

/**
 * Rota para obter história completa
 * GET /api/stories/:id
 * 
 * @param {string} id - ID da história
 * @returns {Story} A história completa com suas cenas
 */
router.get('/stories/:id', (req, res) => {
  try {
    const story = storyController.getStory(req.params.id);
    res.json(story);
  } catch (error: any) {
    console.error('Erro ao obter história:', error);
    res.status(404).json({ error: error.message || 'História não encontrada' });
  }
});

/**
 * Rota para listar todas as histórias
 * GET /api/stories
 * 
 * @returns {Story[]} Array de todas as histórias
 */
router.get('/stories', (req, res) => {
  const stories = storyController.getAllStories();
  res.json(stories);
});

/**
 * Rota para atualizar uma cena específica
 * PUT /api/scenes/:id
 * 
 * @param {string} id - ID da cena
 * @body {Object} Objeto com campos a serem atualizados
 * @returns {Scene} A cena atualizada
 */
router.put('/scenes/:id', async (req, res) => {
  try {
    const updates = req.body;
    const updatedScene = await sceneController.updateScene(req.params.id, updates);
    res.json(updatedScene);
  } catch (error: any) {
    console.error('Erro ao atualizar cena:', error);
    res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
});

/**
 * Rota para regenerar imagem para uma cena
 * POST /api/scenes/:id/regenerate-image
 * 
 * @param {string} id - ID da cena
 * @body {string} customPrompt - Prompt personalizado para a imagem
 * @returns {Scene} A cena com imagem atualizada
 */
router.post('/scenes/:id/regenerate-image', async (req, res) => {
  try {
    const { customPrompt } = req.body;
    
    // Verificar se a cena existe
    let scene;
    try {
      scene = await sceneController.getScene(req.params.id);
    } catch (error) {
      // Se a cena não existir, retornamos um erro 404 para o cliente saber que deve tratar isso
      return res.status(404).json({ 
        error: 'Cena não encontrada', 
        message: 'A cena solicitada não foi encontrada. Verifique o ID ou gere novas cenas.' 
      });
    }
    
    // Buscar história associada à cena
    const story = storyController.getStory(scene.storyId);
    
    // Obter cenas anteriores para manter consistência
    const previousScenes = sceneController.getScenesByStory(scene.storyId)
      .filter(s => s.order < scene.order);
    const previousImages = previousScenes.map(s => s.imageUrl).filter(url => url && url.startsWith('http'));
    
    const updatedScene = await sceneController.regenerateSceneImage(
      scene.id, 
      customPrompt,
      story.style, 
      previousImages
    );
    
    res.json(updatedScene);
  } catch (error: any) {
    console.error('Erro ao regenerar imagem:', error);
    res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
});

/**
 * Rota para gerar amostras visuais
 * POST /api/stories/:id/visual-samples
 * 
 * @param {string} id - ID da história
 * @body {string} style - Estilo visual desejado
 * @returns {Object} Objeto com amostras visuais geradas
 */
router.post('/stories/:id/visual-samples', async (req, res) => {
  try {
    const { style } = req.body;
    
    if (!style || style.trim() === '') {
      return res.status(400).json({ error: 'Estilo visual é obrigatório' });
    }
    
    // Verificar se a história existe
    let story;
    try {
      story = storyController.getStory(req.params.id);
    } catch (error) {
      return res.status(404).json({ 
        error: 'História não encontrada', 
        message: 'A história solicitada não foi encontrada. Crie uma nova história.' 
      });
    }
    
    // Gerar exatamente 3 exemplos visuais
    const visualSamples = await storyController.generateVisualSamples(story.id, style);
    
    res.json({ visualSamples });
  } catch (error: any) {
    console.error('Erro ao gerar amostras visuais:', error);
    res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
});

/**
 * Rota para selecionar amostra visual
 * POST /api/stories/:id/select-visual
 * 
 * @param {string} id - ID da história
 * @body {number} sampleIndex - Índice da amostra visual selecionada
 * @returns {Story} A história atualizada
 */
router.post('/stories/:id/select-visual', async (req, res) => {
  try {
    const { sampleIndex } = req.body;
    
    if (sampleIndex === undefined || sampleIndex < 0) {
      return res.status(400).json({ error: 'Índice de amostra inválido' });
    }
    
    const updatedStory = await storyController.selectVisualSample(req.params.id, sampleIndex);
    
    res.json(updatedStory);
  } catch (error: any) {
    console.error('Erro ao selecionar amostra visual:', error);
    res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
});

/**
 * Rota para exportar história em HTML
 * GET /api/stories/:id/export
 * 
 * @param {string} id - ID da história
 * @returns {string} Documento HTML da história completa
 */
router.get('/stories/:id/export', (req, res) => {
  try {
    const html = storyController.generateHtmlExport(req.params.id);
    res.setHeader('Content-Disposition', 'attachment; filename=historia.html');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error: any) {
    console.error('Erro ao exportar HTML:', error);
    res.status(500).json({ error: error.message || 'Erro ao exportar HTML' });
  }
});

/**
 * Rota para atualizar proposta de história
 * PUT /api/stories/:id/proposal
 * 
 * @param {string} id - ID da história
 * @body {string} proposal - Nova proposta de história
 * @returns {Story} A história atualizada
 */
router.put('/stories/:id/proposal', async (req, res) => {
  try {
    const { proposal } = req.body;
    
    if (!proposal || proposal.trim() === '') {
      return res.status(400).json({ error: 'Proposta de história é obrigatória' });
    }
    
    const updatedStory = await storyController.updateStoryProposal(req.params.id, proposal);
    res.json(updatedStory);
  } catch (error: any) {
    console.error('Erro ao atualizar proposta:', error);
    res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
});

export default router;