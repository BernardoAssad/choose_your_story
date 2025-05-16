/**
 * Script principal de front-end para a aplicação de criação de histórias
 * Gerencia a interface de usuário, interações e comunicação com a API
 */

// Variáveis de estado da aplicação
let currentStory = null;       // Armazena a história atual
let currentScenes = [];        // Armazena as cenas da história atual
let currentSceneIndex = 0;     // Índice da cena sendo visualizada

/**
 * Referências para os elementos do DOM
 * Divididos por seções, botões, inputs e displays
 */
// Elementos DOM - Seções principais
const createStorySection = document.getElementById('create-story-section');
const storyProposalSection = document.getElementById('story-proposal-section');
const styleInputSection = document.getElementById('style-input-section');
const storyViewerSection = document.getElementById('story-viewer-section');
const finalStorySection = document.getElementById('final-story-section');
const loadingElement = document.getElementById('loading');

// Elementos DOM - Botões de ação
const createStoryBtn = document.getElementById('create-story-btn');
const generateScenesBtn = document.getElementById('generate-scenes-btn');
const generateStyleBtn = document.getElementById('generate-style-btn');
const prevSceneBtn = document.getElementById('prev-scene-btn');
const nextSceneBtn = document.getElementById('next-scene-btn');
const editStoryBtn = document.getElementById('edit-story-btn');
const editDescriptionBtn = document.getElementById('edit-description-btn');
const editNarrationBtn = document.getElementById('edit-narration-btn');
const editDialogueBtn = document.getElementById('edit-dialogue-btn');
const regenerateImageBtn = document.getElementById('regenerate-image-btn');
const finishStoryBtn = document.getElementById('finish-story-btn');
const downloadStoryBtn = document.getElementById('download-story-btn');
const newStoryBtn = document.getElementById('new-story-btn');

// Elementos DOM - Inputs e displays para interação
const briefingInput = document.getElementById('briefing');
const styleInput = document.getElementById('style');
const numScenesInput = document.getElementById('num-scenes');
const storyProposalText = document.getElementById('story-proposal');
const sceneTitle = document.getElementById('scene-title');
const sceneImage = document.getElementById('scene-image');
const sceneDescription = document.getElementById('scene-description');
const sceneNarration = document.getElementById('scene-narration');
const sceneDialogue = document.getElementById('scene-dialogue');
const sceneCounter = document.getElementById('scene-counter');
const finalStoryContent = document.getElementById('final-story-content');

/**
 * Configuração de event listeners para botões da interface
 * Cada botão é vinculado à sua função correspondente
 */
createStoryBtn.addEventListener('click', createStory);
generateScenesBtn.addEventListener('click', generateScenes);
generateStyleBtn.addEventListener('click', handleStyleAndSamples);
prevSceneBtn.addEventListener('click', showPreviousScene);
nextSceneBtn.addEventListener('click', showNextScene);
if (editStoryBtn) editStoryBtn.addEventListener('click', editStory);
if (editDescriptionBtn) editDescriptionBtn.addEventListener('click', editDescription);
if (editNarrationBtn) editNarrationBtn.addEventListener('click', editNarration);
if (editDialogueBtn) editDialogueBtn.addEventListener('click', editDialogue);
if (regenerateImageBtn) regenerateImageBtn.addEventListener('click', regenerateImage);
if (finishStoryBtn) finishStoryBtn.addEventListener('click', finishStory);
if (downloadStoryBtn) downloadStoryBtn.addEventListener('click', downloadStory);
if (newStoryBtn) newStoryBtn.addEventListener('click', resetApp);

/**
 * Cria uma nova história baseada no briefing fornecido pelo usuário
 * Envia uma requisição POST para a API e exibe a proposta ao usuário
 */
async function createStory() {
  const briefing = briefingInput.value.trim();

  if (!briefing) {
    alert('Por favor, insira um briefing para a história.');
    return;
  }

  showLoading(true);

  try {
    const response = await fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ briefing })
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    currentStory = data;

    storyProposalText.textContent = currentStory.proposal;

    createStorySection.classList.add('hidden');
    storyProposalSection.classList.remove('hidden');
  } catch (error) {
    alert('Erro ao criar história: ' + (error.message || 'Erro desconhecido'));
    console.error('Erro completo:', error);
  } finally {
    showLoading(false);
  }
}

/**
 * Gera as cenas da história com base no número especificado
 * Valida o input e faz requisição à API para gerar o conteúdo das cenas
 */
async function generateScenes() {
  const numScenes = parseInt(numScenesInput.value);
  
  // Validar número de cenas
  if (isNaN(numScenes) || numScenes < 3 || numScenes > 15) {
    alert('Por favor, insira um número de cenas entre 3 e 15.');
    return;
  }

  showLoading(true);

  try {
    const response = await fetch(`/api/stories/${currentStory.id}/scenes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numScenes: numScenes })
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    // Verificar se o número de cenas recebidas corresponde ao solicitado
    if (data.scenes.length !== numScenes) {
      console.warn(`Atenção: Solicitadas ${numScenes} cenas, mas recebidas ${data.scenes.length}.`);
    }
    
    currentScenes = data.scenes;
    currentSceneIndex = 0;

    // Avançar para a seção de estilo visual
    storyProposalSection.classList.add('hidden');
    styleInputSection.classList.remove('hidden');
  } catch (error) {
    alert('Erro ao gerar cenas: ' + (error.message || 'Erro desconhecido'));
    console.error('Erro completo:', error);
  } finally {
    showLoading(false);
  }
}

/**
 * Processa o estilo visual escolhido, gera amostras e aplica às cenas
 * Fluxo completo de seleção de estilo visual e geração de imagens
 */
async function handleStyleAndSamples() {
  const style = styleInput.value.trim();
  if (!style) {
    alert('Digite um estilo visual válido');
    return;
  }

  showLoading(true);

  try {
    // Primeiro, enviamos o estilo para gerar amostras visuais
    const samplesResponse = await fetch(`/api/stories/${currentStory.id}/visual-samples`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ style })
    });

    if (!samplesResponse.ok) {
      throw new Error(`Erro HTTP: ${samplesResponse.status}`);
    }

    const { visualSamples } = await samplesResponse.json();
    
    // Se não houver amostras, mostramos um erro
    if (!visualSamples || visualSamples.length === 0) {
      throw new Error('Não foi possível gerar amostras visuais');
    }

    // Pré-carregar imagens antes de mostrar o modal
    const preloadedSamples = await Promise.all(
      visualSamples.map(sample => {
        return new Promise((resolve) => {
          if (!sample.imageUrl || typeof sample.imageUrl !== 'string' || !sample.imageUrl.startsWith('http')) {
            // Se não houver URL válida, definimos um placeholder
            sample.imageUrl = '/images/placeholder.jpg';
            resolve(sample);
            return;
          }

          const img = new Image();
          
          img.onload = () => {
            resolve(sample);
          };
          
          img.onerror = () => {
            console.warn(`Falha ao carregar imagem: ${sample.imageUrl}`);
            sample.imageUrl = '/images/placeholder.jpg';
            resolve(sample);
          };
          
          // Iniciar carregamento da imagem
          img.src = sample.imageUrl;
        });
      })
    );

    // IMPORTANTE: Esconder o carregamento antes de mostrar o modal
    showLoading(false);
    
    // Depois que todas as imagens foram carregadas, mostre o modal seletor
    const selection = await showVisualSampleSelector(preloadedSamples);

    // Se o usuário cancelar, paramos aqui
    if (selection === null) {
      return;
    }

    // Mostrar o carregamento novamente para a próxima etapa
    showLoading(true);

    // Selecionamos a amostra visual escolhida
    const selectResponse = await fetch(`/api/stories/${currentStory.id}/select-visual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sampleIndex: selection })
    });

    if (!selectResponse.ok) {
      throw new Error(`Erro HTTP: ${selectResponse.status}`);
    }

    // Agora, vamos gerar as imagens para todas as cenas
    let imagesGenerated = 0;
    let errors = 0;

    // Função para delay entre requisições
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Geramos imagens para cada cena
    for (let i = 0; i < currentScenes.length; i++) {
      try {
        // Adicionamos um pequeno delay entre requisições para evitar sobrecarga da API
        if (i > 0) await delay(1500); // Aumentamos o delay para dar mais tempo à API
        
        const scene = currentScenes[i];
        const regenerateResponse = await fetch(`/api/scenes/${scene.id}/regenerate-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (regenerateResponse.ok) {
          const updatedScene = await regenerateResponse.json();
          currentScenes[i] = updatedScene;
          imagesGenerated++;
        } else {
          errors++;
          console.error(`Erro ao gerar imagem para cena ${i + 1}:`, await regenerateResponse.text());
        }
      } catch (error) {
        errors++;
        console.error(`Erro ao processar imagem para cena ${i + 1}:`, error);
      }
    }

    // Atualizamos a visualização das cenas
    updateSceneView();

    // Avançamos para a visualização da história
    styleInputSection.classList.add('hidden');
    storyViewerSection.classList.remove('hidden');

    // Notificamos o usuário sobre o status das imagens
    if (errors > 0) {
      alert(`Atenção: ${errors} de ${currentScenes.length} imagens não puderam ser geradas. As cenas sem imagens usarão um placeholder.`);
    }
  } catch (error) {
    alert('Erro ao processar estilo visual: ' + (error.message || 'Erro desconhecido'));
    console.error('Erro completo:', error);
  } finally {
    showLoading(false);
  }
}

/**
 * Exibe um modal para o usuário escolher entre amostras visuais
 * 
 * @param {Array} samples - Array de objetos de amostra com URLs de imagens
 * @returns {Promise<number|null>} - Índice da amostra selecionada ou null se cancelado
 */
async function showVisualSampleSelector(samples) {
  return new Promise((resolve) => {
    // Garantimos que o loading esteja oculto antes de mostrar o modal
    showLoading(false);
    
    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    modal.style.zIndex = '3000'; // Definir z-index maior que o do loading (2000)
    
    // Estrutura HTML do modal com estilos inline para garantir uma exibição consistente
    modal.innerHTML = `
      <div class="edit-modal-content">
        <h3>Escolha um estilo visual</h3>
        <p style="text-align: center; margin-bottom: 20px;">Selecione uma das opções abaixo para definir o estilo visual da sua história</p>
        <div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center">
          ${samples.map((s, i) => `
            <div 
              style="
                cursor: pointer; 
                width: 220px; 
                text-align: center; 
                padding: 10px; 
                border-radius: 8px; 
                transition: all 0.2s ease;
                border: 2px solid transparent;
                margin-bottom: 15px;
              " 
              class="style-sample" 
              data-index="${i}"
              onmouseover="this.style.backgroundColor='#f0f7fa'; this.style.transform='scale(1.02)';"
              onmouseout="this.style.backgroundColor='transparent'; this.style.transform='scale(1)';"
            >
              <div style="
                width: 200px; 
                height: 200px; 
                background-image: url('${s.imageUrl}'); 
                background-size: cover; 
                background-position: center; 
                border-radius: 8px;
                margin: 0 auto;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              "></div>
              <p style="margin-top: 10px; font-weight: bold;">Opção ${i + 1}</p>
            </div>
          `).join('')}
        </div>
        <div style="text-align: center; margin-top: 20px;">
          <button 
            id="cancel-style-selection" 
            style="
              background-color: #95a5a6; 
              margin-right: 10px;
              padding: 10px 20px;
              border: none;
              border-radius: 4px;
              color: white;
              cursor: pointer;
            "
          >Cancelar</button>
        </div>
      </div>
    `;

    // Adicionamos tratamento de eventos
    modal.addEventListener('click', e => {
      const target = e.target.closest('.style-sample');
      if (target) {
        // Destacamos visualmente a seleção
        const index = parseInt(target.getAttribute('data-index'));
        
        // Resetamos a borda de todos os estilos
        modal.querySelectorAll('.style-sample').forEach(el => {
          el.style.border = '2px solid transparent';
          el.style.backgroundColor = 'transparent';
        });
        
        // Atualizamos o visual para dar feedback ao usuário
        target.style.border = '2px solid #3498db';
        target.style.backgroundColor = '#e1f0fa';
        
        // Esperamos um pouco para mostrar o feedback visual
        setTimeout(() => {
          document.body.removeChild(modal);
          resolve(index);
        }, 300);
      }
    });

    // Botão de cancelar
    modal.querySelector('#cancel-style-selection').addEventListener('click', () => {
      document.body.removeChild(modal);
      resolve(null);
    });

    // Adicionamos o modal ao body
    document.body.appendChild(modal);
  });
}

/**
 * Atualiza a visualização da cena atual com seus dados
 * Define título, imagem, descrição, narração e diálogos da cena
 */
function updateSceneView() {
  const scene = currentScenes[currentSceneIndex];
  if (!scene) {
    console.error('Cena atual não encontrada');
    return;
  }
  
  if (sceneTitle) {
    sceneTitle.textContent = scene.title || `Cena ${currentSceneIndex + 1}`;
  }
  
  if (sceneImage) {
    if (scene.imageUrl && scene.imageUrl.startsWith('http')) {
      sceneImage.style.backgroundImage = `url(${scene.imageUrl})`;
      sceneImage.innerHTML = '';
    } else {
      sceneImage.style.backgroundImage = 'none';
      sceneImage.innerHTML = '<div class="image-error">Imagem não disponível</div>';
    }
  }
  
  if (sceneDescription) {
    sceneDescription.innerHTML = formatText(scene.description);
  }
  
  if (sceneNarration) {
    sceneNarration.innerHTML = formatText(scene.narration);
  }
  
  if (sceneDialogue) {
    sceneDialogue.innerHTML = formatDialogue(scene.dialogue);
  }
  
  if (sceneCounter) {
    sceneCounter.textContent = `Cena ${currentSceneIndex + 1} de ${currentScenes.length}`;
  }
  
  if (prevSceneBtn) {
    prevSceneBtn.disabled = currentSceneIndex === 0;
  }
  
  if (nextSceneBtn) {
    nextSceneBtn.disabled = currentSceneIndex === currentScenes.length - 1;
  }
}

/**
 * Navega para a cena anterior se disponível
 */
function showPreviousScene() {
  if (currentSceneIndex > 0) {
    currentSceneIndex--;
    updateSceneView();
  }
}

/**
 * Navega para a próxima cena se disponível
 */
function showNextScene() {
  if (currentSceneIndex < currentScenes.length - 1) {
    currentSceneIndex++;
    updateSceneView();
  }
}

/**
 * Formata texto simples para exibição HTML
 * 
 * @param {string} text - Texto a ser formatado
 * @returns {string} - HTML formatado com quebras de linha
 */
function formatText(text) {
  if (!text || text.trim() === '') {
    return '<em>Não disponível</em>';
  }
  return text.split('\n').join('<br>');
}

/**
 * Formata diálogos para exibição destacando personagens
 * 
 * @param {string} dialogue - Texto de diálogo a ser formatado
 * @returns {string} - HTML formatado com personagens destacados
 */
function formatDialogue(dialogue) {
  if (!dialogue || dialogue.trim() === '') {
    return '<em>Não há diálogos nesta cena.</em>';
  }
  
  return dialogue.split('\n').map(line => {
    const match = line.match(/^([^:]+):(.+)$/);
    if (match) {
      const [_, character, speech] = match;
      return `<strong>${character}:</strong> ${speech}`;
    }
    return line;
  }).join('<br>');
}

/**
 * Cria e exibe um modal de edição para diferentes campos
 * 
 * @param {string} fieldName - Nome do campo sendo editado
 * @param {string} content - Conteúdo atual do campo
 * @param {Function} saveCallback - Função chamada ao salvar com o novo conteúdo
 */
function openEditModal(fieldName, content, saveCallback) {
  const modal = document.createElement('div');
  modal.className = 'edit-modal';
  
  modal.innerHTML = `
    <div class="edit-modal-content">
      <h3>Editar ${fieldName}</h3>
      <textarea id="edit-field-content" rows="10">${content || ''}</textarea>
      <div class="edit-modal-buttons">
        <button id="cancel-edit-btn">Cancelar</button>
        <button id="save-edit-btn">Salvar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('cancel-edit-btn').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  document.getElementById('save-edit-btn').addEventListener('click', () => {
    const newContent = document.getElementById('edit-field-content').value;
    saveCallback(newContent);
    document.body.removeChild(modal);
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

/**
 * Inicia a edição da proposta de história
 */
function editStory() {
  openEditModal('proposta de história', currentStory.proposal, updateStory);
}

/**
 * Inicia a edição da descrição da cena atual
 */
function editDescription() {
  const scene = currentScenes[currentSceneIndex];
  openEditModal('descrição da cena', scene.description, updateDescription);
}

/**
 * Inicia a edição da narração da cena atual
 */
function editNarration() {
  const scene = currentScenes[currentSceneIndex];
  openEditModal('narração', scene.narration, updateNarration);
}

/**
 * Inicia a edição dos diálogos da cena atual
 */
function editDialogue() {
  const scene = currentScenes[currentSceneIndex];
  openEditModal('diálogo', scene.dialogue, updateDialogue);
}

/**
 * Regenera a imagem da cena atual através da API
 */
async function regenerateImage() {
  if (!currentScenes || currentScenes.length === 0) return;
  
  const scene = currentScenes[currentSceneIndex];
  showLoading(true);
  
  try {
    const response = await fetch(`/api/scenes/${scene.id}/regenerate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const updatedScene = await response.json();
      currentScenes[currentSceneIndex] = updatedScene;
      updateSceneView();
    } else {
      throw new Error('Falha ao regenerar imagem');
    }
  } catch (error) {
    alert('Erro ao regenerar imagem: ' + (error.message || 'Erro desconhecido'));
  } finally {
    showLoading(false);
  }
}

/**
 * Atualiza a proposta de história no servidor
 * 
 * @param {string} newProposal - Nova proposta de história
 */
async function updateStory(newProposal) {
  showLoading(true);
  
  try {
    const response = await fetch(`/api/stories/${currentStory.id}/proposal`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposal: newProposal })
    });
    
    if (response.ok) {
      const updatedStory = await response.json();
      currentStory = updatedStory;
      storyProposalText.textContent = currentStory.proposal;
    } else {
      throw new Error('Falha ao atualizar história');
    }
  } catch (error) {
    alert('Erro ao atualizar história: ' + (error.message || 'Erro desconhecido'));
  } finally {
    showLoading(false);
  }
}

/**
 * Atualiza a descrição da cena atual no servidor
 * 
 * @param {string} newDescription - Nova descrição da cena
 */
async function updateDescription(newDescription) {
  const scene = currentScenes[currentSceneIndex];
  updateSceneField(scene.id, { description: newDescription });
}

/**
 * Atualiza a narração da cena atual no servidor
 * 
 * @param {string} newNarration - Nova narração da cena
 */
async function updateNarration(newNarration) {
  const scene = currentScenes[currentSceneIndex];
  updateSceneField(scene.id, { narration: newNarration });
}

/**
 * Atualiza o diálogo da cena atual no servidor
 * 
 * @param {string} newDialogue - Novo diálogo da cena
 */
async function updateDialogue(newDialogue) {
  const scene = currentScenes[currentSceneIndex];
  updateSceneField(scene.id, { dialogue: newDialogue });
}

/**
 * Atualiza campos de uma cena no servidor
 * 
 * @param {string} sceneId - ID da cena a ser atualizada
 * @param {Object} updates - Objeto com os campos a serem atualizados
 */
async function updateSceneField(sceneId, updates) {
  showLoading(true);
  
  try {
    const response = await fetch(`/api/scenes/${sceneId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    
    if (response.ok) {
      const updatedScene = await response.json();
      const index = currentScenes.findIndex(s => s.id === sceneId);
      if (index !== -1) {
        currentScenes[index] = updatedScene;
        updateSceneView();
      }
    } else {
      throw new Error('Falha ao atualizar cena');
    }
  } catch (error) {
    alert('Erro ao atualizar cena: ' + (error.message || 'Erro desconhecido'));
  } finally {
    showLoading(false);
  }
}

/**
 * Finaliza a edição da história e mostra a visualização completa
 * Prepara todos os elementos para visualização final
 */
function finishStory() {
  // Gerar visualização final da história
  finalStoryContent.innerHTML = '';
  
  // Título da história
  const storyTitle = document.createElement('h2');
  storyTitle.textContent = currentStory.title || 'História Sem Título';
  finalStoryContent.appendChild(storyTitle);
  
  // Adicionar cada cena à visualização final
  currentScenes.forEach((scene, index) => {
    const sceneElement = document.createElement('div');
    sceneElement.className = 'final-scene';
    
    // Título da cena
    const titleElement = document.createElement('h3');
    titleElement.textContent = scene.title || `Cena ${index + 1}`;
    sceneElement.appendChild(titleElement);
    
    // Imagem da cena
    if (scene.imageUrl) {
      const imageElement = document.createElement('div');
      imageElement.className = 'final-scene-image';
      imageElement.style.backgroundImage = `url(${scene.imageUrl})`;
      sceneElement.appendChild(imageElement);
    }
    
    // Descrição
    const descriptionTitle = document.createElement('h4');
    descriptionTitle.textContent = 'Descrição';
    sceneElement.appendChild(descriptionTitle);
    
    const descriptionElement = document.createElement('div');
    descriptionElement.className = 'final-scene-description';
    descriptionElement.innerHTML = formatText(scene.description);
    sceneElement.appendChild(descriptionElement);
    
    // Narração
    const narrationTitle = document.createElement('h4');
    narrationTitle.textContent = 'Narração';
    sceneElement.appendChild(narrationTitle);
    
    const narrationElement = document.createElement('div');
    narrationElement.className = 'final-scene-narration';
    narrationElement.innerHTML = formatText(scene.narration);
    sceneElement.appendChild(narrationElement);
    
    // Diálogo
    const dialogueTitle = document.createElement('h4');
    dialogueTitle.textContent = 'Diálogo';
    sceneElement.appendChild(dialogueTitle);
    
    const dialogueElement = document.createElement('div');
    dialogueElement.className = 'final-scene-dialogue';
    dialogueElement.innerHTML = formatDialogue(scene.dialogue);
    sceneElement.appendChild(dialogueElement);
    
    finalStoryContent.appendChild(sceneElement);
  });
  
  // Mostrar a seção final
  storyViewerSection.classList.add('hidden');
  finalStorySection.classList.remove('hidden');
}

/**
 * Gera e inicia o download da história em formato HTML
 * Cria um documento HTML completo com estilos e conteúdo
 */
/**
 * Gera e inicia o download da história em formato HTML
 * Cria um documento HTML completo com estilos e conteúdo
 */
function downloadStory() {
  // Criar conteúdo HTML para download
  let content = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${currentStory.title || 'Minha História'}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; text-align: center; }
        h2 { color: #3498db; margin-top: 30px; }
        .scene-image { width: 100%; height: 400px; background-size: contain; background-position: center; background-repeat: no-repeat; margin: 20px 0; }
        .scene-section { margin-bottom: 20px; }
        h3 { color: #2c3e50; }
        .scene { border-bottom: 1px solid #ddd; padding-bottom: 30px; margin-bottom: 30px; }
        .dialogue { background-color: #f9f9f9; padding: 15px; border-left: 3px solid #3498db; }
    </style>
</head>
<body>
    <h1>${currentStory.title || 'Minha História'}</h1>
`;

  // Adicionar cada cena
  currentScenes.forEach((scene, index) => {
    content += `
    <div class="scene">
        <h2>${scene.title || `Cena ${index + 1}`}</h2>
        <div class="scene-image" style="background-image: url(${scene.imageUrl || ''})"></div>
        
        <div class="scene-section">
            <h3>Descrição</h3>
            <div>${formatText(scene.description)}</div>
        </div>
        
        <div class="scene-section">
            <h3>Narração</h3>
            <div>${formatText(scene.narration)}</div>
        </div>
        
        <div class="scene-section">
            <h3>Diálogo</h3>
            <div class="dialogue">${formatDialogue(scene.dialogue)}</div>
        </div>
    </div>
`;
  });

  content += `
</body>
</html>
`;

  // Criar blob e link para download
  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentStory.title || 'minha-historia'}.html`;
  document.body.appendChild(a);
  a.click();
  
  // Limpar
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Reinicia a aplicação para criar uma nova história
 * Limpa os dados atuais e retorna à tela inicial
 */
function resetApp() {
  // Voltar à tela inicial
  finalStorySection.classList.add('hidden');
  styleInputSection.classList.add('hidden');
  storyViewerSection.classList.add('hidden');
  storyProposalSection.classList.add('hidden');
  createStorySection.classList.remove('hidden');
  
  // Limpar dados
  currentStory = null;
  currentScenes = [];
  currentSceneIndex = 0;
  
  // Limpar inputs
  briefingInput.value = '';
  styleInput.value = '';
  if (numScenesInput) numScenesInput.value = '5';
}

/**
 * Controla a exibição do indicador de carregamento
 * 
 * @param {boolean} show - Define se o indicador deve ser exibido ou ocultado
 */
function showLoading(show) {
  if (loadingElement) {
    if (show) {
      loadingElement.classList.remove('hidden');
    } else {
      loadingElement.classList.add('hidden');
    }
  }
}