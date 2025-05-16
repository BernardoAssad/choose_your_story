# Documentação Técnica: Choose Your Story

## Visão Geral do Sistema

**Choose Your Story** é uma aplicação web que permite a criação de histórias interativas com suporte de Inteligência Artificial. A plataforma foi desenvolvida com o objetivo de facilitar o processo criativo, permitindo que usuários forneçam um briefing inicial e, a partir disso, o sistema gere automaticamente uma proposta de história, cenas narrativas detalhadas e ilustrações consistentes com um estilo visual selecionado. Este projeto foi criado para o processo seletivo da vaga de Engenheiro de Software na Sticky, como parte de um desafio técnico proposto pela empresa.

O sistema é composto por:

- **Backend em Node.js com Express**
- **Frontend em HTML, CSS e JavaScript**
- **Integração com APIs da OpenAI** para geração de textos narrativos
- **API externa para geração de imagens** com base em prompts otimizados

## Estrutura Técnica do Projeto

O projeto segue uma estrutura baseada no padrão MVC (Model-View-Controller), organizada da seguinte forma:

- **Models**: Definem as estruturas dos dados utilizados, como histórias e cenas.
- **Controllers**: Centralizam a lógica de negócio para criação, edição e gerenciamento das histórias.
- **Routes**: Expõem os endpoints RESTful que conectam o frontend ao backend.
- **APIs**: Responsáveis por enviar e processar solicitações às plataformas de IA para geração de texto e imagens.
- **Utils**: Conjunto de funções auxiliares para tratamento de dados e respostas da IA.
- **Frontend**: Interface de interação com o usuário, desenvolvida para ser clara, responsiva e orientada à experiência criativa.
- **Modelo**: DALL-E 3 foi utilizado para a geração de imagens e OpenAI GPT-4 para a geração de textos narrativos estruturados.

## Fluxo da Aplicação

1. **Criação da História**  
   O usuário insere um briefing inicial. A partir dele, o sistema gera automaticamente uma proposta narrativa. Essa proposta pode ser revisada e editada antes de prosseguir.

2. **Definição do Número de Cenas**  
   O usuário escolhe quantas cenas deseja que a história tenha (mínimo de 3, máximo de 15). O sistema gera cada cena com título, descrição, narração e diálogo estruturado.

3. **Seleção de Estilo Visual**  
   Após definir a narrativa, o usuário seleciona um estilo visual. O sistema gera três amostras baseadas no estilo escolhido para que o usuário escolha a mais adequada.

4. **Geração de Imagens**  
   Com base no estilo selecionado, são geradas imagens exclusivas para cada cena da história, mantendo a consistência visual.

5. **Edição e Navegação**  
   O usuário pode editar livremente as cenas (texto e imagens), navegar entre elas e regenerar imagens conforme necessário.

6. **Exportação da História**  
   O sistema permite exportar a história completa em formato HTML, oferecendo uma versão finalizada e pronta para distribuição.

## Funcionalidades Técnicas

- **Validação de Dados**: Todos os inputs são validados tanto no frontend quanto no backend, garantindo segurança e previsibilidade nas interações.
- **Tratamento de Erros**: O sistema inclui mensagens claras para lidar com falhas de comunicação com as APIs ou dados inválidos.
- **Processamento Robusto de Texto**: As respostas da IA são processadas por funções que transformam o texto gerado em objetos estruturados, prontos para uso no frontend.
- **Consistência Visual**: Os prompts gerados para imagens são otimizados para manter uniformidade entre as ilustrações das cenas.
- **Interface Responsiva**: A UI foi projetada para fornecer feedback visual durante as etapas de geração e edição, incluindo modais, spinners e estados carregando.

## Considerações de Implementação

O sistema utiliza a API da OpenAI com parâmetros otimizados (como temperatura e limites de tokens) para garantir que as respostas sejam criativas e úteis, mas dentro de limites gerenciáveis. Foram implementadas estratégias de parsing e fallback para lidar com eventuais inconsistências nas respostas da IA.

Para evitar sobrecarga e manter a performance, o sistema também inclui delays controlados entre chamadas de geração de imagem e mecanismos de pré-carregamento visual.

## Testar o projeto

Para rodar o projeto, você precisa seguir alguns passos simples. Primeiro, clone o repositório e instale as dependências. Em seguida, configure o arquivo .env com sua chave da API OpenAI e inicie o servidor. Veja como fazer:

- Clone o repositório
```git clone https://github.com/seu-usuario/choose-your-story.git
cd choose-your-story```

- Instale as dependências
```npm install```

- Crie um arquivo .env na raiz do projeto
```echo "OPENAI_API_KEY=sua_chave_da_api_aqui" > .env```

- Compile o código TypeScript (se necessário)
```npm run build```

- Inicie o servidor
```npm start```

---

## Observação Final

Este projeto foi desenvolvido integralmente por **Bernardo Assad**, com o apoio de ferramentas de Inteligência Artificial, utilizadas tanto para acelerar o desenvolvimento quanto para garantir maior segurança, qualidade e clareza no código e na experiência do usuário.
