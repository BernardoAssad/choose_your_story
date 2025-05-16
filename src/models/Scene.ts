/**
 * Interface da cena que define sua estrutura
 * 
 * @interface Scene
 * @property {string} id - Identificador único da cena
 * @property {string} storyId - ID da história à qual a cena pertence
 * @property {number} order - Posição na sequência da história
 * @property {string} title - Título da cena
 * @property {string} description - Descrição do ambiente e personagens
 * @property {string} narration - Narração dos eventos
 * @property {string} dialogue - Diálogos entre personagens
 * @property {string} imageUrl - URL da imagem da cena
 */
export interface Scene {
  id: string;
  storyId: string;
  order: number;
  title: string;
  description: string;
  narration: string;
  dialogue: string;
  imageUrl: string;
}