/**
 * Define estruturas e utilidades relacionadas a histórias
 * Inclui a interface principal de Story e funções auxiliares para manipulação de texto
 */

import { Scene } from "./Scene";

/**
 * Interface principal que define a estrutura de uma história
 * 
 * @interface Story
 * @property {string} id - Identificador único da história
 * @property {string} title - Título da história
 * @property {string} briefing - Briefing inicial fornecido pelo usuário
 * @property {string} proposal - Proposta de história gerada pela IA
 * @property {string} style - Estilo visual escolhido para as imagens
 * @property {Scene[]} scenes - Array de cenas que compõem a história
 * @property {Date} createdAt - Data de criação da história
 * @property {Object[]} visualSamples - Amostras de estilos visuais (opcional)
 * @property {Object} selectedVisualSample - Amostra de estilo visual selecionada (opcional)
 */
export interface Story {
  id: string;
  title: string;
  briefing: string;
  proposal: string;
  style: string;
  scenes: Scene[];
  createdAt: Date;

  // Amostras de estilos visuais (opcional)
  visualSamples?: {
    title: string;
    description: string;
    narration: string;
    dialogue: string;
    imageUrl: string;
  }[];

  // Amostra de estilo visual selecionada (opcional)
  selectedVisualSample?: {
    title: string;
    description: string;
    narration: string;
    dialogue: string;
    imageUrl: string;
  };
}