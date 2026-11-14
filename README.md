# Nurbook · Marketplace Moçambique

Marketplace digital completo para **compra, venda e afiliados** em Moçambique.  
Frontend profissional + backend Node.js com **M-Pesa Open API (Vodacom MZ)**.

---

## Arranque rápido

```bash
# Requisitos: Node.js 18+
chmod +x start.sh
./start.sh
```

Abra no browser: **http://localhost:3001**

Ou manualmente:

```bash
cd server
cp .env.example .env   # se ainda não existir
npm install
npm start
```

---

## Estrutura

```
nurbook/
├── index.html              # App (HTML)
├── css/styles.css          # Estilos
├── js/app.js               # Lógica do marketplace
├── imagens/                # Placeholders SVG (logo, banner, produtos)
├── server/
│   ├── index.js            # Express: estático + API M-Pesa
│   ├── mpesa.js            # Cliente Open API Vodacom MZ
│   ├── package.json
│   ├── .env.example
│   └── .env                # Credenciais (não versionar)
├── start.sh
├── package.json
└── README.md
```

---

## Funcionalidades

| Área | Detalhe |
|------|---------|
| **Contas** | Comprador · Vendedor/Afiliado · Admin |
| **Loja** | Categorias, pesquisa, carrinho, páginas de venda |
| **Pagamentos** | M-Pesa, e-Mola, mKesh, transferência, cartão |
| **Validação móvel** | 9 dígitos + prefixos correctos (84/85, 86/87/88, 82/83) |
| **M-Pesa real** | C2B via Open API Vodacom (backend) |
| **Afiliados** | Links com rastreio e comissões |
| **Carteira** | Taxa 2% venda · 10% saque · levantamentos |
| **Admin** | Aprovação de produtos, saques, monitorização |
| **Visitante** | Compra sem criar conta |

Dados guardados em `localStorage` (pode evoluir para base de dados).

---

## M-Pesa real (Vodacom Moçambique)

> **Não use a Daraja (Quénia).** Em Moçambique o portal é:  
> https://developer.mpesa.vm.co.mz/

### Credenciais

1. Registe-se no portal e crie uma aplicação  
2. Copie **API Key**, **Public Key** e **Service Provider Code**  
3. Em `server/.env`:

```env
MPESA_ENV=sandbox
MPESA_API_KEY=sua_api_key
MPESA_PUBLIC_KEY=sua_public_key
MPESA_SERVICE_PROVIDER_CODE=171717
MPESA_ORIGIN=developer.mpesa.vm.co.mz
PORT=3001
FRONTEND_ORIGIN=*
```

Sem keys, o sistema corre em **modo simulado** (UI completa, sem cobrança real).

### Fluxo

1. Cliente escolhe M-Pesa e número (84/85)  
2. Frontend valida e chama `POST /api/mpesa/c2b`  
3. Servidor cifra a API Key (RSA) e pede C2B à Vodacom  
4. Cliente confirma no telemóvel com PIN  

Endpoints:

- `GET  /api/health`
- `GET  /api/mpesa/status`
- `POST /api/mpesa/c2b`
- `GET  /api/mpesa/query?ref=...&third=...`

---

## Prefixos de telemóvel

| Método | Prefixo | Dígitos |
|--------|---------|---------|
| M-Pesa | 84, 85 | 9 |
| e-Mola | 86, 87, 88 | 9 |
| mKesh | 82, 83 | 9 |

Números com prefixo errado são rejeitados no formulário.

---

## Admin

Login pelo formulário normal com as credenciais de administrador configuradas no código (hashes).  
Não é possível criar conta admin pelo registo público.

---

## Produção

1. `MPESA_ENV=live` + keys de produção  
2. HTTPS obrigatório  
3. Servir frontend e API no mesmo domínio **ou** definir `window.NURBOOK_API_BASE` e `FRONTEND_ORIGIN`  
4. **Nunca** expor API Key / Public Key no browser  

---

## Imagens

Substitua os ficheiros em `imagens/` pelos seus (logo, banner, produtos).  
Imagens de produto e logo incluídas. Marketplace inicia sem produtos — vendedores publicam e admin aprova.

---

## Licença / uso

Projecto de demonstração profissional para o ecossistema digital moçambicano.  
Adapte, ligue a uma base de dados e publique com as suas credenciais M-Pesa.
