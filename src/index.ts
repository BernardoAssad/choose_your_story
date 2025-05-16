/**
 * Servidor Express para a aplicação de criação de histórias
 * Configura endpoints da API e serve arquivos estáticos do frontend
 */

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import routes from './routes';

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

// Inicializa a aplicação Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para permitir requisições cross-origin
app.use(cors()); 

// Middleware para parsear JSON nas requisições
app.use(express.json()); 

// Configura o diretório para servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public'))); 

// Monta as rotas da API no prefixo '/api'
app.use('/api', routes);

/**
 * Rota para todas as outras requisições
 * Serve o arquivo HTML principal para permitir navegação por SPA
 */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

/**
 * Inicia o servidor na porta configurada
 * Exibe uma mensagem no console quando o servidor estiver rodando
 */
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});