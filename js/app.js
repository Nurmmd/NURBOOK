const STORAGE = {
    usuarios: "nurbook_usuarios",
    produtos: "nurbook_produtos",
    carrinho: "nurbook_carrinho",
    pedidos: "nurbook_pedidos",
    afiliados: "nurbook_afiliados",
    sessao: "nurbook_sessao"
};



const IMAGENS = {

    // IMAGEM DO LOGO
    logo: "imagens/logo.png",

    // IMAGEM DO BANNER
    banner: "imagens/banner.jpg",

    // IMAGENS DOS PRODUTOS
    html: "imagens/html.jpg",
    java: "imagens/java.jpg",
    cpp: "imagens/cpp.jpg",
    javascript: "imagens/javascript.jpg",
    marketing: "imagens/marketing.jpg",
    forex: "imagens/forex.jpg",
    empreendedorismo: "imagens/empreendedorismo.jpg",
    excel: "imagens/excel.jpg",
    photoshop: "imagens/photoshop.jpg",
    design: "imagens/design.jpg",
    redes: "imagens/redes.jpg",
    mysql: "imagens/mysql.jpg",
    ia: "imagens/ia.jpg"
};




function lerStorage(chave, padrao) {

    try {

        const dados = localStorage.getItem(chave);

        return dados
            ? JSON.parse(dados)
            : padrao;

    } catch (erro) {

        console.error("Erro ao ler armazenamento:", erro);

        return padrao;
    }
}


function salvarStorage(chave, dados) {

    localStorage.setItem(
        chave,
        JSON.stringify(dados)
    );
}




let usuarios = lerStorage(STORAGE.usuarios, []);

let produtos = lerStorage(STORAGE.produtos, []);

let carrinho = lerStorage(STORAGE.carrinho, []);

let pedidos = lerStorage(STORAGE.pedidos, []);

let afiliados = lerStorage(STORAGE.afiliados, []);

let usuarioLogado = lerStorage(STORAGE.sessao, null);



function gerarID(prefixo = "id") {

    return prefixo + "_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 8);
}


function criarProdutosIniciais() {
    // Sem produtos de demonstração — marketplace começa vazio e pronto para produção.
    // Vendedores publicam produtos; admin aprova.
    if (!Array.isArray(produtos)) {
        produtos = [];
        salvarStorage(STORAGE.produtos, produtos);
    }
}

function escaparHTML(valor) {

    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}




function formatarMT(valor) {

    return Number(valor || 0)
        .toLocaleString("pt-MZ", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + " MT";
}



function notificar(mensagem, tipo = "normal") {

    const container =
        document.getElementById("toastContainer");

    const toast =
        document.createElement("div");

    toast.className =
        "toast " +
        (tipo === "success"
            ? "success"
            : tipo === "error"
                ? "error"
                : "");

    toast.innerHTML =
        escaparHTML(mensagem);

    container.appendChild(toast);

    setTimeout(() => {

        toast.remove();

    }, 3500);
}




function abrirModal(id) {

    document
        .getElementById(id)
        .classList.add("active");
}


function fecharModal(id) {

    document
        .getElementById(id)
        .classList.remove("active");
}



/* ===================== AUTENTICAÇÃO ===================== */

async function hashSenha(senha) {
    try {
        if (window.crypto && crypto.subtle) {
            const buf = await crypto.subtle.digest(
                "SHA-256",
                new TextEncoder().encode("nurbook::" + senha)
            );
            return Array.from(new Uint8Array(buf))
                .map(b => b.toString(16).padStart(2, "0"))
                .join("");
        }
    } catch (e) {
        console.error("Hash indisponível:", e);
    }
    return "plain:" + senha;
}

function usuarioPublico(u) {
    const { senha, senhaHash, ...publico } = u;
    return publico;
}

function authErro(id, mensagem) {
    const el = document.getElementById(id);
    if (!mensagem) { el.classList.remove("show"); el.textContent = ""; return; }
    el.textContent = mensagem;
    el.classList.add("show");
}

function authTab(aba) {
    const entrar = aba === "entrar";
    document.getElementById("tabEntrar").classList.toggle("active", entrar);
    document.getElementById("tabCriar").classList.toggle("active", !entrar);
    document.getElementById("formEntrar").classList.toggle("active", entrar);
    document.getElementById("formCriar").classList.toggle("active", !entrar);
    authErro("erroEntrar", "");
    authErro("erroCriar", "");
    setTimeout(() => {
        document.getElementById(entrar ? "loginUsuario" : "cadNome").focus();
    }, 50);
}

function alternarSenha(inputId, botao) {
    const input = document.getElementById(inputId);
    const mostrar = input.type === "password";
    input.type = mostrar ? "text" : "password";
    botao.querySelector("i").className =
        mostrar ? "fa-solid fa-eye-slash" : "fa-solid fa-eye";
}

function medirSenha() {
    const v = document.getElementById("cadSenha").value;
    let pontos = 0;
    if (v.length >= 6) pontos++;
    if (v.length >= 10) pontos++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) pontos++;
    if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) pontos++;
    const niveis = [
        ["0%", "#e5e7eb", ""],
        ["25%", "#dc2626", "Fraca"],
        ["50%", "#f59e0b", "Razoável"],
        ["75%", "#0d6efd", "Boa"],
        ["100%", "#16a34a", "Forte"]
    ];
    const n = v ? Math.max(1, pontos) : 0;
    const barra = document.getElementById("pwBarra");
    barra.style.width = niveis[n][0];
    barra.style.background = niveis[n][1];
    document.getElementById("pwTexto").textContent =
        v ? "Força da senha: " + niveis[n][2] : "";
}

function mostrarAuth(aba) {
    document.body.classList.add("auth-locked");
    authTab(aba || "entrar");
}

function liberarApp() {
    document.body.classList.remove("auth-locked");
    renderCategorias();
    renderProdutos();
    atualizarCarrinho();
    atualizarUsuario();
    atualizarDashboard();
    window.scrollTo(0, 0);
}

function abrirLogin() {
    if (usuarioLogado) { mostrarDashboard(); return; }
    mostrarAuth("entrar");
}

function abrirCadastro() {
    if (usuarioLogado) { mostrarDashboard(); return; }
    mostrarAuth("criar");
}

let tentativasLogin = 0;
let bloqueioLogin = 0;

async function fazerLogin() {
    authErro("erroEntrar", "");

    const agora = Date.now();
    if (agora < bloqueioLogin) {
        const seg = Math.ceil((bloqueioLogin - agora) / 1000);
        authErro("erroEntrar", "Muitas tentativas. Aguarde " + seg + "s e tente de novo.");
        return;
    }

    const entrada = document.getElementById("loginUsuario").value.trim();
    const senha = document.getElementById("loginSenha").value;

    if (!entrada || !senha) {
        authErro("erroEntrar", "Digite o utilizador e a senha.");
        return;
    }

    const btn = document.getElementById("btnEntrar");
    btn.disabled = true;

    const usuario = usuarios.find(u =>
        u.identificador.toLowerCase() === entrada.toLowerCase()
    );

    let ok = false;
    if (usuario) {
        if (usuario.senhaHash) {
            ok = usuario.senhaHash === await hashSenha(senha);
        } else if (typeof usuario.senha === "string") {
            // conta antiga (senha em texto): valida e migra para hash
            ok = usuario.senha === senha;
            if (ok) {
                usuario.senhaHash = await hashSenha(senha);
                delete usuario.senha;
                salvarStorage(STORAGE.usuarios, usuarios);
            }
        }
    }

    btn.disabled = false;

    if (!usuario) {
        authErro("erroEntrar", "Conta não encontrada. Crie uma conta para continuar.");
        return;
    }
    if (!ok) {
        tentativasLogin++;
        if (tentativasLogin >= 5) {
            bloqueioLogin = Date.now() + 30000;
            tentativasLogin = 0;
        }
        authErro("erroEntrar", "Senha incorreta.");
        return;
    }

    tentativasLogin = 0;
    usuarioLogado = usuarioPublico(usuario);
    salvarStorage(STORAGE.sessao, usuarioLogado);
    document.getElementById("loginSenha").value = "";

    liberarApp();
    notificar("Bem-vindo, " + usuarioLogado.nome + "!", "success");
}

async function fazerCadastro() {
    authErro("erroCriar", "");

    const nome = document.getElementById("cadNome").value.trim();
    const identificador = document.getElementById("cadEmail").value.trim();
    const senha = document.getElementById("cadSenha").value;
    const senha2 = document.getElementById("cadSenha2").value;
    const tipo = document.querySelector('input[name="cadTipo"]:checked').value;
    const termos = document.getElementById("cadTermos").checked;

    if (!nome || !identificador || !senha || !senha2) {
        authErro("erroCriar", "Preencha todos os campos.");
        return;
    }
    if (identificador.includes("@") &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identificador)) {
        authErro("erroCriar", "Digite um e-mail válido.");
        return;
    }
    if (senha.length < 6) {
        authErro("erroCriar", "A senha deve ter pelo menos 6 caracteres.");
        return;
    }
    if (senha !== senha2) {
        authErro("erroCriar", "As senhas não coincidem.");
        return;
    }
    if (!termos) {
        authErro("erroCriar", "Aceite os termos de uso para continuar.");
        return;
    }
    if (usuarios.some(u =>
        u.identificador.toLowerCase() === identificador.toLowerCase())) {
        authErro("erroCriar", "Este utilizador já existe. Vá ao separador Entrar.");
        return;
    }

    const btn = document.getElementById("btnCriar");
    btn.disabled = true;

    const usuario = {
        id: gerarID("user"),
        nome: nome,
        identificador: identificador,
        senhaHash: await hashSenha(senha),
        tipo: tipo,
        criadoEm: new Date().toISOString()
    };

    usuarios.push(usuario);
    salvarStorage(STORAGE.usuarios, usuarios);

    btn.disabled = false;

    usuarioLogado = usuarioPublico(usuario);
    salvarStorage(STORAGE.sessao, usuarioLogado);

    ["cadNome", "cadEmail", "cadSenha", "cadSenha2"].forEach(id => {
        document.getElementById(id).value = "";
    });
    document.getElementById("cadTermos").checked = false;
    medirSenha();

    liberarApp();
    notificar("Conta criada com sucesso!", "success");
}

function atualizarUsuario() {

    const elemento =
        document.getElementById("userName");


    if (!usuarioLogado) {

        elemento.textContent =
            "Entrar";

        return;
    }


    elemento.textContent =
        usuarioLogado.nome;
}




function sairDaConta() {
    usuarioLogado = null;
    carrinho = [];
    salvarStorage(STORAGE.carrinho, carrinho);
    localStorage.removeItem(STORAGE.sessao);
    atualizarUsuario();
    document.getElementById("dashboard").classList.remove("active");
    mostrarAuth("entrar");
    notificar("Você saiu da sua conta.", "success");
}

function mostrarDashboard() {

    if (!usuarioLogado) {

        abrirLogin();

        return;
    }


    const dashboard =
        document.getElementById("dashboard");

    dashboard.classList.add("active");

    dashboard.scrollIntoView({
        behavior: "smooth"
    });


    document.getElementById(
        "dashboardWelcome"
    ).textContent =
        "Olá, " +
        usuarioLogado.nome +
        ". Tipo de conta: " +
        usuarioLogado.tipo;


    atualizarDashboard();
}


function atualizarDashboard() {

    if (!usuarioLogado) {
        return;
    }


    const meusPedidos =
        pedidos.filter(p =>
            p.compradorId ===
            usuarioLogado.id
        );


    const meusProdutos =
        produtos.filter(p =>
            p.vendedorId ===
            usuarioLogado.id
        );


    let vendas = 0;

    pedidos.forEach(pedido => {

        pedido.itens.forEach(item => {

            if (
                item.vendedorId ===
                usuarioLogado.id
            ) {

                vendas +=
                    item.preco *
                    item.quantidade;
            }

        });

    });


    document.getElementById(
        "statCompras"
    ).textContent =
        meusPedidos.length;


    document.getElementById(
        "statProdutos"
    ).textContent =
        meusProdutos.length;


    document.getElementById(
        "statVendas"
    ).textContent =
        formatarMT(vendas);


    document.getElementById(
        "statSaldo"
    ).textContent =
        formatarMT(vendas);


    renderPedidos();
}




function renderPedidos() {

    const elemento =
        document.getElementById("listaPedidos");


    if (!usuarioLogado) {
        elemento.innerHTML = "";
        return;
    }


    const meusPedidos =
        pedidos.filter(p =>
            p.compradorId ===
            usuarioLogado.id
        );


    if (meusPedidos.length === 0) {

        elemento.innerHTML =
            "<p style='color:#6b7280'>" +
            "Ainda não existem pedidos." +
            "</p>";

        return;
    }


    elemento.innerHTML =
        meusPedidos
            .slice()
            .reverse()
            .slice(0, 5)
            .map(pedido => `

                <div style="
                    padding:15px 0;
                    border-bottom:1px solid #e5e7eb;
                ">

                    <strong>
                        Pedido #${escaparHTML(
                            pedido.id.substring(0, 8)
                        )}
                    </strong>

                    <br>

                    <span style="
                        color:#6b7280;
                        font-size:13px;
                    ">
                        ${escaparHTML(
                            pedido.data
                        )}
                    </span>

                    <br>

                    <strong>
                        ${formatarMT(pedido.total)}
                    </strong>

                    <br>

                    <span style="
                        color:#16a34a;
                        font-size:13px;
                    ">
                        ${escaparHTML(
                            pedido.status
                        )}
                    </span>

                </div>

            `)
            .join("");
}




function renderProdutos(lista = produtos) {

    const container =
        document.getElementById("listaProdutos");


    if (lista.length === 0) {

        container.innerHTML = `
            <div style="
                grid-column:1/-1;
                background:white;
                padding:30px;
                text-align:center;
                border-radius:14px;
            ">
                <i class="fa-solid fa-box-open"
                   style="font-size:35px;color:#9ca3af;">
                </i>

                <h3>
                    Nenhum produto encontrado
                </h3>

                <p style="color:#6b7280;">
                    Tente outra pesquisa.
                </p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        lista.map(produto => `

            <article class="product-card">

                <!-- IMAGEM DO PRODUTO
                     Caminho definido no objeto IMAGENS
                -->

                <img
                    class="product-image"
                    src="${escaparHTML(produto.imagem)}"
                    alt="${escaparHTML(produto.nome)}"
                    onerror="this.onerror=null;this.src='imagens/logo.png'">

                <div class="product-body">

                    <div class="product-category">
                        ${escaparHTML(produto.categoria)}
                    </div>

                    <h3 class="product-title">
                        ${escaparHTML(produto.nome)}
                    </h3>

                    <p class="product-description">
                        ${escaparHTML(produto.descricao)}
                    </p>

                    <div class="product-price">
                        ${formatarMT(produto.preco)}
                    </div>

                    <div class="product-meta">

                        <i class="fa-solid fa-user"></i>

                        ${escaparHTML(produto.vendedor)}

                        ·

                        ${produto.tipo === "digital"
                            ? "Digital"
                            : "Físico"}

                    </div>

                    <div class="product-actions">

                        <button
                            class="btn btn-primary"
                            onclick="adicionarAoCarrinho('${produto.id}')">

                            <i class="fa-solid fa-cart-plus"></i>
                            Comprar

                        </button>

                        <button
                            class="btn btn-outline"
                            onclick="afiliarProduto('${produto.id}')">

                            <i class="fa-solid fa-link"></i>
                            Afiliar

                        </button>

                    </div>

                </div>

            </article>

        `).join("");
}




function renderCategorias() {

    const categorias = [

        {
            nome: "Programação",
            icon: "fa-code"
        },

        {
            nome: "Tecnologia",
            icon: "fa-laptop-code"
        },

        {
            nome: "Marketing",
            icon: "fa-bullhorn"
        },

        {
            nome: "Finanças",
            icon: "fa-chart-line"
        },

        {
            nome: "Design",
            icon: "fa-palette"
        },

        {
            nome: "Empreendedorismo",
            icon: "fa-briefcase"
        },

        {
            nome: "Educação",
            icon: "fa-graduation-cap"
        }

    ];


    document.getElementById(
        "listaCategorias"
    ).innerHTML =

        categorias.map(categoria => `

            <div
                class="category-card"
                onclick="filtrarCategoria('${categoria.nome}')">

                <i class="fa-solid ${categoria.icon}">
                </i>

                <strong>
                    ${categoria.nome}
                </strong>

            </div>

        `).join("");
}




function filtrarCategoria(categoria) {

    const filtrados =
        produtos.filter(p =>
            p.categoria === categoria
        );


    document.getElementById(
        "resultadoBusca"
    ).textContent =
        "Categoria: " + categoria;


    renderProdutos(filtrados);


    document.getElementById(
        "produtos"
    ).scrollIntoView({
        behavior: "smooth"
    });
}




function pesquisarProdutos() {

    const termo =
        document
            .getElementById("campoBusca")
            .value
            .toLowerCase()
            .trim();


    if (!termo) {

        document.getElementById(
            "resultadoBusca"
        ).textContent =
            "Produtos disponíveis no marketplace.";

        renderProdutos();

        return;
    }


    const resultados =
        produtos.filter(produto =>

            produto.nome
                .toLowerCase()
                .includes(termo)

            ||

            produto.categoria
                .toLowerCase()
                .includes(termo)

            ||

            produto.descricao
                .toLowerCase()
                .includes(termo)

        );


    document.getElementById(
        "resultadoBusca"
    ).textContent =
        resultados.length +
        " produto(s) encontrado(s).";


    renderProdutos(resultados);
}




function adicionarAoCarrinho(id) {

    const produto =
        produtos.find(p =>
            p.id === id
        );


    if (!produto) {

        notificar(
            "Produto não encontrado.",
            "error"
        );

        return;
    }


    if (produto.estoque <= 0) {

        notificar(
            "Produto sem estoque.",
            "error"
        );

        return;
    }


    const existente =
        carrinho.find(item =>
            item.produtoId === id
        );


    if (existente) {

        if (
            existente.quantidade >=
            produto.estoque
        ) {

            notificar(
                "Quantidade máxima disponível atingida.",
                "error"
            );

            return;
        }

        existente.quantidade++;

    } else {

        carrinho.push({

            produtoId: produto.id,

            quantidade: 1

        });

    }


    salvarStorage(
        STORAGE.carrinho,
        carrinho
    );


    atualizarCarrinho();

    notificar(
        "Produto adicionado ao carrinho.",
        "success"
    );
}




function atualizarCarrinho() {

    const container =
        document.getElementById("cartItems");


    let total = 0;

    let quantidadeTotal = 0;


    if (carrinho.length === 0) {

        container.innerHTML = `
            <div style="
                text-align:center;
                padding:50px 20px;
                color:#6b7280;
            ">

                <i class="fa-solid fa-cart-shopping"
                   style="font-size:40px;">
                </i>

                <p>
                    O carrinho está vazio.
                </p>

            </div>
        `;

    } else {

        container.innerHTML =

            carrinho.map(item => {

                const produto =
                    produtos.find(p =>
                        p.id === item.produtoId
                    );


                if (!produto) {
                    return "";
                }


                const subtotal =
                    produto.preco *
                    item.quantidade;


                total += subtotal;

                quantidadeTotal +=
                    item.quantidade;


                return `

                    <div class="cart-item">

                        <div class="cart-item-top">

                            <div>

                                <strong>
                                    ${escaparHTML(
                                        produto.nome
                                    )}
                                </strong>

                                <br>

                                <small>
                                    ${formatarMT(
                                        produto.preco
                                    )}
                                </small>

                            </div>

                            <strong>
                                ${formatarMT(subtotal)}
                            </strong>

                        </div>

                        <div class="quantity-controls">

                            <button
                                onclick="alterarQuantidade(
                                    '${produto.id}',
                                    -1
                                )">

                                −

                            </button>

                            <span>
                                ${item.quantidade}
                            </span>

                            <button
                                onclick="alterarQuantidade(
                                    '${produto.id}',
                                    1
                                )">

                                +

                            </button>

                            <button
                                onclick="removerDoCarrinho(
                                    '${produto.id}'
                                )"
                                style="
                                    margin-left:auto;
                                    color:#dc2626;
                                ">

                                <i class="fa-solid fa-trash">
                                </i>

                            </button>

                        </div>

                    </div>

                `;

            }).join("");
    }


    document.getElementById(
        "cartTotal"
    ).textContent =
        formatarMT(total);


    document.getElementById(
        "cartCount"
    ).textContent =
        quantidadeTotal;
}




function alterarQuantidade(id, alteracao) {

    const item =
        carrinho.find(i =>
            i.produtoId === id
        );


    const produto =
        produtos.find(p =>
            p.id === id
        );


    if (!item || !produto) {
        return;
    }


    item.quantidade +=
        alteracao;


    if (item.quantidade <= 0) {

        carrinho =
            carrinho.filter(i =>
                i.produtoId !== id
            );

    }


    if (
        item.quantidade >
        produto.estoque
    ) {

        item.quantidade =
            produto.estoque;

        notificar(
            "Quantidade máxima disponível.",
            "error"
        );
    }


    salvarStorage(
        STORAGE.carrinho,
        carrinho
    );


    atualizarCarrinho();
}




function removerDoCarrinho(id) {

    carrinho =
        carrinho.filter(item =>
            item.produtoId !== id
        );


    salvarStorage(
        STORAGE.carrinho,
        carrinho
    );


    atualizarCarrinho();
}




function abrirCarrinho() {

    atualizarCarrinho();

    document
        .getElementById("cartSidebar")
        .classList.add("active");
}


function fecharCarrinho() {

    document
        .getElementById("cartSidebar")
        .classList.remove("active");
}


function finalizarCompra() {

    if (carrinho.length === 0) {

        notificar(
            "O carrinho está vazio.",
            "error"
        );

        return;
    }


    if (!usuarioLogado) {

        fecharCarrinho();

        abrirLogin();

        notificar(
            "Entre na sua conta para finalizar a compra.",
            "error"
        );

        return;
    }


    let total = 0;

    let possuiFisico = false;


    carrinho.forEach(item => {

        const produto =
            produtos.find(p =>
                p.id === item.produtoId
            );


        if (!produto) {
            return;
        }


        total +=
            produto.preco *
            item.quantidade;


        if (
            produto.tipo === "fisico"
        ) {

            possuiFisico = true;
        }

    });


    document.getElementById(
        "resumoCheckout"
    ).innerHTML = `

        <strong>
            Resumo da compra
        </strong>

        <br>

        ${carrinho.length}
        produto(s)

        <br>

        Total:
        <strong>
            ${formatarMT(total)}
        </strong>

    `;


    document.getElementById(
        "dadosEntrega"
    ).style.display =
        possuiFisico
            ? "block"
            : "none";


    fecharCarrinho();

    abrirModal("modalCheckout");
    setTimeout(()=>atualizarCamposPagamento("checkout"), 30);
}




async function confirmarCompra() {

    if (!usuarioLogado) {

        fecharModal("modalCheckout");

        abrirLogin();

        return;
    }


    if (carrinho.length === 0) {

        notificar(
            "O carrinho está vazio.",
            "error"
        );

        return;
    }


    const itens = [];

    let total = 0;

    let possuiFisico = false;


    for (const item of carrinho) {

        const produto =
            produtos.find(p =>
                p.id === item.produtoId
            );


        if (!produto) {
            continue;
        }


        if (
            produto.estoque <
            item.quantidade
        ) {

            notificar(
                "Estoque insuficiente para: " +
                produto.nome,
                "error"
            );

            return;
        }


        if (
            produto.tipo === "fisico"
        ) {

            possuiFisico = true;
        }


        itens.push({

            produtoId: produto.id,

            nome: produto.nome,

            preco: produto.preco,

            quantidade: item.quantidade,

            vendedor: produto.vendedor,

            vendedorId:
                produto.vendedorId || null,

            // Guarda o afiliado no próprio pedido para não perder a referência
            // se o visitante navegar, fechar a página ou alterar o link depois.
            afiliadoId: (refDe(produto.id) &&
                refDe(produto.id).id !== usuarioLogado.id &&
                refDe(produto.id).id !== produto.vendedorId)
                    ? refDe(produto.id).id : null,
            comissaoPercentual: Number(produto.comissao || 0)

        });


        total +=
            produto.preco *
            item.quantidade;

    }


    if (possuiFisico) {

        const provincia =
            document
                .getElementById(
                    "entregaProvincia"
                )
                .value
                .trim();

        const cidade =
            document
                .getElementById(
                    "entregaCidade"
                )
                .value
                .trim();

        const bairro =
            document
                .getElementById(
                    "entregaBairro"
                )
                .value
                .trim();

        const endereco =
            document
                .getElementById(
                    "entregaEndereco"
                )
                .value
                .trim();

        const telefone =
            document
                .getElementById(
                    "entregaTelefone"
                )
                .value
                .trim();


        if (
            !provincia ||
            !cidade ||
            !bairro ||
            !endereco ||
            !telefone
        ) {

            notificar(
                "Preencha os dados de entrega.",
                "error"
            );

            return;
        }

    }


    // Validação do método de pagamento (prefixos + dígitos)
    const pag = lerPagamento("checkout");
    if(!pag.ok){
        notificar(pag.mensagem, "error");
        return;
    }
    const metodo = pag.metodo;
    const pagDetalhe = pag.detalhe;

    // ---- M-Pesa real (C2B via backend) ----
    let mpesaResult = null;
    if(metodo === "M-Pesa" && pagDetalhe && pagDetalhe.tipo === "movel"){
        notificar("A enviar pedido M-Pesa para o telemóvel...", "normal");
        mpesaResult = await processarMpesaC2B({
            amount: total,
            phone: pagDetalhe.numero,
            orderId: "NB" + Date.now().toString(36).toUpperCase(),
            description: "Compra Nurbook"
        });
        if(!mpesaResult.ok){
            notificar(mpesaResult.message || "Pagamento M-Pesa recusado.", "error");
            return;
        }
        if(mpesaResult.simulated){
            notificar("M-Pesa em modo simulado (configure o servidor para cobrança real).", "normal");
        } else {
            notificar("Confirme o pagamento no telemóvel (PIN M-Pesa).", "success");
        }
        pagDetalhe.transactionId = mpesaResult.transactionId;
        pagDetalhe.conversationId = mpesaResult.conversationId;
        pagDetalhe.simulated = mpesaResult.simulated;
    }
    else if((metodo === "e-Mola" || metodo === "mKesh") && pagDetalhe && pagDetalhe.tipo === "movel"){
        notificar("A processar pagamento " + metodo + "...", "normal");
        await new Promise(r => setTimeout(r, 900));
        pagDetalhe.transactionId = "SIM" + Date.now().toString(36).toUpperCase();
        pagDetalhe.simulated = true;
        notificar("Pagamento " + metodo + " registado (simulado nesta versão).", "success");
    } else if(metodo === "Cartão internacional"){
        notificar("A processar cartão...", "normal");
        await new Promise(r => setTimeout(r, 800));
        pagDetalhe.transactionId = "CARD" + Date.now().toString(36).toUpperCase();
        pagDetalhe.simulated = true;
        notificar("Pagamento com cartão aceite (simulado).", "success");
    } else if(metodo === "Transferência bancária"){
        pagDetalhe.transactionId = "TRF" + Date.now().toString(36).toUpperCase();
        pagDetalhe.simulated = true;
        notificar("Pedido de transferência registado. Aguarde confirmação.", "success");
    }


 

    const pedido = {

        id: gerarID("pedido"),

        compradorId:
            usuarioLogado.id,

        comprador:
            usuarioLogado.nome,

        itens: itens,

        total: total,

        pagamento:
            metodo,
        pagamentoDetalhe: pagDetalhe,

        status:
            (metodo === "M-Pesa" && mpesaResult && !mpesaResult.simulated)
                ? "Aguarda confirmação M-Pesa"
                : "Pagamento simulado",

        data:
            new Date()
                .toLocaleString("pt-MZ"),

        entrega: possuiFisico
            ? {

                provincia:
                    document
                        .getElementById(
                            "entregaProvincia"
                        )
                        .value,

                cidade:
                    document
                        .getElementById(
                            "entregaCidade"
                        )
                        .value,

                bairro:
                    document
                        .getElementById(
                            "entregaBairro"
                        )
                        .value,

                endereco:
                    document
                        .getElementById(
                            "entregaEndereco"
                        )
                        .value,

                telefone:
                    document
                        .getElementById(
                            "entregaTelefone"
                        )
                        .value

            }
            : null

    };


    

    itens.forEach(item => {

        const produto =
            produtos.find(p =>
                p.id === item.produtoId
            );


        if (produto) {

            produto.estoque -=
                item.quantidade;

            produto.vendas =
                (produto.vendas || 0) +
                item.quantidade;
        }

    });


    pedidos.push(pedido);


    salvarStorage(
        STORAGE.pedidos,
        pedidos
    );


    salvarStorage(
        STORAGE.produtos,
        produtos
    );


    carrinho = [];


    salvarStorage(
        STORAGE.carrinho,
        carrinho
    );


    fecharModal("modalCheckout");

    atualizarCarrinho();

    renderProdutos();

    atualizarDashboard();


    notificar(
        "Compra realizada com sucesso! Pagamento simulado.",
        "success"
    );
}




function abrirVender() {

    if (!usuarioLogado) {

        abrirLogin();

        notificar(
            "Entre primeiro para publicar um produto.",
            "error"
        );

        return;
    }


    if (
        usuarioLogado.tipo !==
        "vendedor"
    ) {

        notificar(
            "No login, escolha 'Vendedor / Produtor' para publicar produtos.",
            "error"
        );

        return;
    }


    abrirModal("modalVender");
}


function publicarProduto() {

    if (!usuarioLogado) {

        abrirLogin();

        return;
    }


    const nome =
        document
            .getElementById("produtoNome")
            .value
            .trim();

    const categoria =
        document
            .getElementById("produtoCategoria")
            .value;

    const tipo =
        document
            .getElementById("produtoTipo")
            .value;

    const preco =
        Number(
            document
                .getElementById("produtoPreco")
                .value
        );

    const estoque =
        Number(
            document
                .getElementById("produtoEstoque")
                .value
        );

    const descricao =
        document
            .getElementById("produtoDescricao")
            .value
            .trim();


    if (
        !nome ||
        !descricao ||
        preco <= 0 ||
        estoque <= 0
    ) {

        notificar(
            "Preencha corretamente os dados do produto.",
            "error"
        );

        return;
    }


    

    const imagemPadrao =
        categoria === "Programação"
            ? IMAGENS.javascript
            : categoria === "Marketing"
                ? IMAGENS.marketing
                : categoria === "Finanças"
                    ? IMAGENS.forex
                    : categoria === "Design"
                        ? IMAGENS.design
                        : IMAGENS.ia;


    const produto = {

        id: gerarID("prod"),

        nome: nome,

        categoria: categoria,

        tipo: tipo,

        preco: preco,

        estoque: estoque,

        descricao: descricao,

        // IMAGEM DO PRODUTO
        imagem: imagemPadrao,

        vendedor:
            usuarioLogado.nome,

        vendedorId:
            usuarioLogado.id,

        vendas: 0,

        criadoEm:
            new Date().toISOString()

    };


    produtos.unshift(produto);


    salvarStorage(
        STORAGE.produtos,
        produtos
    );


    fecharModal("modalVender");


    document
        .getElementById("produtoNome")
        .value = "";

    document
        .getElementById("produtoPreco")
        .value = "";

    document
        .getElementById("produtoDescricao")
        .value = "";


    renderProdutos();

    atualizarDashboard();


    notificar(
        "Produto publicado com sucesso!",
        "success"
    );
}




function afiliarProduto(id) {

    if (!usuarioLogado) {

        abrirLogin();

        notificar(
            "Entre na sua conta para ser afiliado.",
            "error"
        );

        return;
    }


    if (
        usuarioLogado.tipo !==
        "afiliado"
    ) {

        notificar(
            "Entre como 'Afiliado' para gerar links.",
            "error"
        );

        return;
    }


    const produto =
        produtos.find(p =>
            p.id === id
        );


    if (!produto) {
        return;
    }


    const link =
        "https://nurbook.mz/produto/" +
        produto.id +
        "?afiliado=" +
        usuarioLogado.id;


    const registro = {

        id: gerarID("af"),

        afiliadoId:
            usuarioLogado.id,

        produtoId:
            produto.id,

        link: link,

        comissao: 10,

        data:
            new Date()
                .toLocaleString("pt-MZ")

    };


    afiliados.push(registro);


    salvarStorage(
        STORAGE.afiliados,
        afiliados
    );


    if (
        navigator.clipboard
    ) {

        navigator.clipboard
            .writeText(link)
            .catch(() => {});

    }


    notificar(
        "Link de afiliado copiado: " + link,
        "success"
    );
}




function irParaProdutos() {

    document
        .getElementById("produtos")
        .scrollIntoView({
            behavior: "smooth"
        });
}


function mostrarCategorias() {

    document
        .getElementById("categorias")
        .scrollIntoView({
            behavior: "smooth"
        });
}


function mostrarInicio() {

    document
        .getElementById("inicio")
        .scrollIntoView({
            behavior: "smooth"
        });
}




function iniciarNurbook() {
    criarProdutosIniciais();

    document.getElementById("anoAtual").textContent =
        new Date().getFullYear();
    document.getElementById("authAno").textContent =
        new Date().getFullYear();

    // Sem sessão válida: só a tela de entrada é mostrada
    const sessaoValida = usuarioLogado &&
        (usuarios.some(u => u.id === usuarioLogado.id) ||
            (usuarioLogado.tipo === "admin" && usuarioLogado.id === ADMIN_ID));

    if (sessaoValida) {
        liberarApp();
        notificar("Sessão restaurada: " + usuarioLogado.nome, "success");
    } else {
        usuarioLogado = null;
        localStorage.removeItem(STORAGE.sessao);
        mostrarAuth("entrar");
    }
}

document.addEventListener("keydown", function(event) {
    if (event.key !== "Enter") return;
    if (!document.body.classList.contains("auth-locked")) return;
    if (event.target.tagName === "BUTTON") return;
    if (document.getElementById("formEntrar").classList.contains("active")) {
        fazerLogin();
    } else {
        fazerCadastro();
    }
});

document.addEventListener(
    "click",
    function(event) {

        if (
            event.target.classList
                .contains("modal-overlay")
        ) {

            event.target
                .classList
                .remove("active");
        }

    }
);





/* ===== v2: carteira, afiliados, páginas de venda, admin ===== */
Object.assign(STORAGE,{carteira:"nurbook_carteira",saques:"nurbook_saques",refs:"nurbook_refs"});

const TAXA_VENDA=0.02,TAXA_SAQUE=0.10,MIN_SAQUE=100,PLAT="plataforma";

/* ===== Gateway de pagamento (validação + simulação) =====
 * Prefixos oficiais Moçambique (9 dígitos nacionais):
 *   M-Pesa  → Vodacom  84, 85
 *   e-Mola  → Movitel  86, 87  (88 também Movitel)
 *   mKesh   → Tmcel    82, 83
 */

/* URL do backend M-Pesa (Node). Em produção defina window.NURBOOK_API_BASE ou sirva tudo pelo mesmo host. */
const MPESA_API_BASE = (function(){
  if (typeof window !== "undefined" && window.NURBOOK_API_BASE) return window.NURBOOK_API_BASE;
  // Mesmo origin quando o Express serve o frontend (porta 3001) ou em produção
  if (typeof location !== "undefined") {
    if (location.port === "3001" || location.port === "" || location.protocol === "https:") return "";
  }
  return "http://localhost:3001";
})();

/**
 * Chama o backend para iniciar C2B M-Pesa (USSD Push).
 * Se o servidor não estiver configurado, devolve simulated:true.
 */
async function processarMpesaC2B({ amount, phone, orderId, description }) {
  const url = MPESA_API_BASE.replace(/\/$/, "") + "/api/mpesa/c2b";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, phone, orderId, description }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        message: data.message || "Falha ao iniciar pagamento M-Pesa.",
        code: data.code,
      };
    }
    return {
      ok: true,
      simulated: !!data.simulated,
      message: data.message,
      transactionId: data.transactionId,
      conversationId: data.conversationId,
      thirdPartyReference: data.thirdPartyReference,
    };
  } catch (e) {
    console.error("M-Pesa API:", e);
    return {
      ok: false,
      message: "Não foi possível contactar o servidor de pagamentos. Verifique se o backend está a correr (npm start na pasta server).",
      offline: true,
    };
  }
}

const PAG_PREFIXOS = {
  "M-Pesa":  ["84","85"],
  "e-Mola":  ["86","87","88"],
  "mKesh":   ["82","83"]
};
const PAG_LABEL = {
  "M-Pesa": "M-Pesa (Vodacom)",
  "e-Mola": "e-Mola (Movitel)",
  "mKesh":  "mKesh (Tmcel)"
};

function soDigitos(v){ return String(v||"").replace(/\D/g,""); }

function normalizarTelMZ(v){
  let d = soDigitos(v);
  // Remove código do país se colado (+258 / 00258 / 258)
  if(d.startsWith("00258")) d = d.slice(5);
  else if(d.startsWith("258") && d.length >= 12) d = d.slice(3);
  return d;
}

function validarNumeroMovel(metodo, numero){
  let d = normalizarTelMZ(numero);
  const prefs = PAG_PREFIXOS[metodo];
  if(!prefs) return { ok:false, msg:"Método móvel inválido.", digitos:d };
  if(d.length === 0) return { ok:false, msg:"Indique o número de telemóvel.", digitos:d };
  // Força no máximo 9 no campo visual
  if(d.length > 9) {
    d = d.slice(0, 9);
  }
  if(d.length < 9) return { ok:false, msg:`Faltam ${9-d.length} dígito(s). Use exactamente 9 dígitos.`, digitos:d };
  const prefixo = d.slice(0,2);
  if(!prefs.includes(prefixo)){
    const lista = prefs.join(", ");
    return {
      ok:false,
      msg:`Número inválido para ${metodo}. Deve começar por ${lista} (ex.: ${prefs[0]}1234567).`,
      digitos:d,
      prefixo
    };
  }
  return { ok:true, msg:`Número ${metodo} válido ✓`, digitos:d, prefixo };
}

function validarCartao(num, mes, ano, cvv, nome){
  const n = soDigitos(num);
  if(n.length < 13 || n.length > 19) return { ok:false, msg:"Número do cartão inválido (13–19 dígitos)." };
  // Luhn
  let sum=0, alt=false;
  for(let i=n.length-1;i>=0;i--){
    let d = parseInt(n[i],10);
    if(alt){ d*=2; if(d>9) d-=9; }
    sum += d; alt = !alt;
  }
  if(sum % 10 !== 0) return { ok:false, msg:"Número do cartão inválido (falha na verificação)." };
  const m = parseInt(mes,10), a = parseInt(ano,10);
  if(!(m>=1 && m<=12)) return { ok:false, msg:"Mês de validade inválido." };
  const agora = new Date();
  const yNow = agora.getFullYear() % 100;
  const mNow = agora.getMonth()+1;
  if(a < yNow || (a===yNow && m < mNow)) return { ok:false, msg:"Cartão expirado." };
  if(!/^\d{3,4}$/.test(String(cvv||""))) return { ok:false, msg:"CVV inválido (3 ou 4 dígitos)." };
  if(!nome || nome.trim().length < 3) return { ok:false, msg:"Indique o nome no cartão." };
  return { ok:true, msg:"Cartão válido.", brand: n[0]==="4"?"Visa":(n.startsWith("5")?"Mastercard":"Cartão") };
}

function validarContaBancaria(conta, banco){
  const d = soDigitos(conta);
  if(!banco) return { ok:false, msg:"Selecione o banco." };
  if(d.length < 9 || d.length > 21) return { ok:false, msg:"Número de conta / NIB inválido (9–21 dígitos)." };
  return { ok:true, msg:"Conta bancária aceite.", digitos:d };
}

function htmlCamposMovel(metodo, idPrefix){
  const prefs = PAG_PREFIXOS[metodo] || [];
  const exemplo = prefs[0] ? prefs[0] + "1234567" : "84XXXXXXX";
  return `
    <div class="pay-method-info">
      <strong>${PAG_LABEL[metodo]||metodo}</strong> — número de 9 dígitos que começa por
      <span class="pay-prefix-badge">${prefs.map(p=>`<span>${p}</span>`).join("")}</span>
    </div>
    <div class="form-group">
      <label for="${idPrefix}Numero">Número ${metodo}</label>
      <div class="input-wrap">
        <i class="fa-solid fa-mobile-screen-button lead-icon"></i>
        <input type="tel" inputmode="numeric" autocomplete="tel"
               id="${idPrefix}Numero" class="form-control"
               maxlength="9" placeholder="${exemplo}"
               oninput="onPagInput('${idPrefix}','${metodo}')">
      </div>
      <div class="pay-hint" id="${idPrefix}Hint">Introduza exactamente 9 dígitos começados por ${prefs.join(" ou ")}.</div>
    </div>`;
}

function htmlCamposCartao(idPrefix){
  return `
    <div class="pay-method-info">
      <strong>Cartão internacional</strong> — Visa ou Mastercard. Pagamento processado de forma segura (simulado nesta versão).
    </div>
    <div class="form-group">
      <label>Nome no cartão</label>
      <input type="text" id="${idPrefix}Nome" class="form-control" placeholder="Como está no cartão" autocomplete="cc-name">
    </div>
    <div class="form-group">
      <label>Número do cartão</label>
      <input type="text" inputmode="numeric" id="${idPrefix}Cartao" class="form-control"
             maxlength="19" placeholder="ACCT-000003" autocomplete="cc-number"
             oninput="this.value=this.value.replace(/[^0-9 ]/g,'').replace(/(\\d{4})(?=\\d)/g,'$1 ').trim()">
    </div>
    <div class="pay-card-grid">
      <div class="form-group">
        <label>Validade (MM/AA)</label>
        <div style="display:flex;gap:8px">
          <input type="text" inputmode="numeric" id="${idPrefix}Mes" class="form-control" maxlength="2" placeholder="MM" autocomplete="cc-exp-month">
          <input type="text" inputmode="numeric" id="${idPrefix}Ano" class="form-control" maxlength="2" placeholder="AA" autocomplete="cc-exp-year">
        </div>
      </div>
      <div class="form-group">
        <label>CVV</label>
        <input type="password" inputmode="numeric" id="${idPrefix}Cvv" class="form-control" maxlength="4" placeholder="•••" autocomplete="cc-csc">
      </div>
    </div>
    <div class="pay-hint" id="${idPrefix}Hint">Os dados do cartão não são enviados a nenhum servidor real nesta demo.</div>`;
}

function htmlCamposBanco(idPrefix){
  return `
    <div class="pay-method-info">
      <strong>Transferência bancária</strong> — indique o banco e o número de conta / NIB.
    </div>
    <div class="form-group">
      <label>Banco</label>
      <select id="${idPrefix}Banco" class="form-control">
        <option value="">Seleccione o banco</option>
        <option>Millennium BIM</option>
        <option>BCI</option>
        <option>Standard Bank</option>
        <option>Absa</option>
        <option>Moza Banco</option>
        <option>FNB Moçambique</option>
        <option>Banco Único</option>
        <option>Outro</option>
      </select>
    </div>
    <div class="form-group">
      <label>Número de conta / NIB</label>
      <input type="text" inputmode="numeric" id="${idPrefix}Conta" class="form-control"
             maxlength="21" placeholder="Apenas dígitos" oninput="this.value=this.value.replace(/\\D/g,'')">
    </div>
    <div class="pay-hint" id="${idPrefix}Hint">Confirme os dados antes de finalizar.</div>`;
}

function atualizarCamposPagamento(origem){
  // origem: 'checkout' | 'saque' | 'guest'
  let metodo, painel, idPrefix;
  if(origem === 'checkout'){
    metodo = (_$("metodoPagamento")||{}).value || "M-Pesa";
    painel = _$("painelPagamentoCheckout");
    idPrefix = "payChk";
  } else if(origem === 'saque'){
    metodo = (_$("saqueMetodo")||{}).value || "M-Pesa";
    painel = _$("painelPagamentoSaque");
    idPrefix = "paySaq";
  } else {
    return;
  }
  if(!painel) return;

  if(PAG_PREFIXOS[metodo]){
    painel.innerHTML = htmlCamposMovel(metodo, idPrefix);
  } else if(metodo === "Cartão internacional"){
    painel.innerHTML = htmlCamposCartao(idPrefix);
  } else {
    painel.innerHTML = htmlCamposBanco(idPrefix);
  }
}

function onPagInput(idPrefix, metodo){
  const inp = _$(idPrefix+"Numero");
  const hint = _$(idPrefix+"Hint");
  if(!inp) return;
  let limpo = normalizarTelMZ(inp.value).slice(0, 9); // nunca mais de 9 dígitos no campo
  if(inp.value !== limpo) inp.value = limpo;
  const r = validarNumeroMovel(metodo, limpo);
  inp.classList.toggle("is-valid", r.ok);
  inp.classList.toggle("is-invalid", !r.ok && limpo.length > 0);
  if(hint){
    hint.textContent = r.msg;
    hint.className = "pay-hint " + (r.ok ? "ok" : (limpo.length ? "err" : ""));
  }
}

function lerPagamento(origem){
  // Devolve { ok, metodo, detalhe, mensagem }
  let metodo, idPrefix;
  if(origem === 'checkout'){
    metodo = _$("metodoPagamento").value;
    idPrefix = "payChk";
  } else if(origem === 'saque'){
    metodo = _$("saqueMetodo").value;
    idPrefix = "paySaq";
  } else if(origem === 'guest'){
    metodo = _$("gPag").value;
    idPrefix = "payGst";
  } else {
    return { ok:false, mensagem:"Origem desconhecida." };
  }

  if(PAG_PREFIXOS[metodo]){
    const num = (_$(idPrefix+"Numero")||{}).value || "";
    const r = validarNumeroMovel(metodo, num);
    if(!r.ok) return { ok:false, metodo, mensagem:r.msg };
    return { ok:true, metodo, detalhe:{ numero:r.digitos, tipo:"movel" }, mensagem:r.msg };
  }
  if(metodo === "Cartão internacional"){
    const r = validarCartao(
      (_$(idPrefix+"Cartao")||{}).value,
      (_$(idPrefix+"Mes")||{}).value,
      (_$(idPrefix+"Ano")||{}).value,
      (_$(idPrefix+"Cvv")||{}).value,
      (_$(idPrefix+"Nome")||{}).value
    );
    if(!r.ok) return { ok:false, metodo, mensagem:r.msg };
    return { ok:true, metodo, detalhe:{ brand:r.brand, tipo:"cartao" }, mensagem:r.msg };
  }
  // Transferência
  const banco = (_$(idPrefix+"Banco")||{}).value;
  const conta = (_$(idPrefix+"Conta")||{}).value;
  const r = validarContaBancaria(conta, banco);
  if(!r.ok) return { ok:false, metodo, mensagem:r.msg };
  return { ok:true, metodo, detalhe:{ banco, conta:r.digitos, tipo:"banco" }, mensagem:r.msg };
}


const ADMIN_ID="adm_nurbook",ADM_E="fa2d4d129ad392c7743cc53f7b79ea06371958ecaeab31ee9db9d8f1efb02783",ADM_S="b5cc89fecc67bfb64b94e476dba451c1cc694eaf1a7cf3da3fc845b6e27b32b1";
const visivel=p=>!p.status||p.status==="aprovado";
const estadoTag=p=>{const k=p.status||"aprovado";return `<span class="st ${{pendente:"Pendente",aprovado:"Pago",rejeitado:"Rejeitado"}[k]}">${{pendente:"Em análise",aprovado:"Aprovado",rejeitado:"Rejeitado"}[k]}</span>`;};
usuarios=usuarios.filter(u=>u.tipo!=="admin");
let carteira=lerStorage(STORAGE.carteira,[]);
let saques=lerStorage(STORAGE.saques,[]);
let imgProduto=null;
const _$=id=>document.getElementById(id);
const esc=escaparHTML;
const R2=n=>Math.round(n*100)/100;
const somar=l=>R2(l.reduce((a,e)=>a+e.valor,0));
const ehAdmin=()=>!!usuarioLogado&&usuarioLogado.tipo==="admin";
const codAf=u=>"AF"+String(u.id).slice(-6).toUpperCase();
const linkProduto=(pid,u)=>location.href.split("#")[0]+"#/p/"+pid+(u?"/ref/"+codAf(u):"");
const saldoDe=uid=>somar(carteira.filter(m=>m.uid===uid));
const linhas=t=>String(t||"").split("\n").map(x=>x.trim()).filter(Boolean);
const paragrafos=t=>String(t||"").split(/\n{2,}/).map(x=>"<p>"+esc(x.trim()).replace(/\n/g,"<br>")+"</p>").join("");
const copiar=t=>{if(navigator.clipboard)navigator.clipboard.writeText(t).catch(()=>{});};
const tb=(h,r)=>r.length?`<div class="tbl-wrap"><table class="tbl"><thead><tr>${h.map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${r.map(x=>`<tr>${x.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`:'<p class="nota">Sem registos ainda.</p>';

function lancar(uid,tipo,valor,desc,ref){
    carteira.push({id:gerarID("mov"),uid,tipo,valor:R2(valor),desc,ref:ref||null,data:new Date().toLocaleString("pt-MZ")});
    salvarStorage(STORAGE.carteira,carteira);
}
function migrar(){
    let m=false;
    produtos.forEach(p=>{
        if(!p.subtitulo){p.subtitulo=(p.descricao||p.nome||"").slice(0,120);m=true;}
        if(!p.beneficios){p.beneficios=["Acesso imediato após o pagamento","Conteúdo prático e direto","Suporte do vendedor"];m=true;}
        if(p.comissao===undefined){p.comissao=20;m=true;}
        if(!p.status){p.status="aprovado";m=true;}
        if(p.garantia===undefined){p.garantia=7;m=true;}
    });
    if(m)salvarStorage(STORAGE.produtos,produtos);
    const novo=t=>(t==="vendedor"||t==="afiliado")?"parceiro":t;
    let u2=false;
    usuarios.forEach(u=>{if(novo(u.tipo)!==u.tipo){u.tipo="parceiro";u2=true;}});
    if(u2)salvarStorage(STORAGE.usuarios,usuarios);
    if(usuarioLogado&&novo(usuarioLogado.tipo)!==usuarioLogado.tipo){usuarioLogado.tipo="parceiro";salvarStorage(STORAGE.sessao,usuarioLogado);}
}

/* ---- afiliados ---- */
function regAf(uid,pid){
    let r=afiliados.find(a=>a.afiliadoId===uid&&a.produtoId===pid);
    if(!r){r={id:gerarID("af"),afiliadoId:uid,produtoId:pid,link:"",comissao:0,cliques:0,vendas:0,ganho:0,data:new Date().toLocaleString("pt-MZ")};afiliados.push(r);}
    return r;
}
function guardarRef(pid,cod){
    const u=usuarios.find(x=>codAf(x)===cod);
    if(!u||(usuarioLogado&&u.id===usuarioLogado.id))return;
    const r=lerStorage(STORAGE.refs,{});
    r[pid]={cod,t:Date.now()};
    salvarStorage(STORAGE.refs,r);
    const reg=regAf(u.id,pid);
    reg.cliques=(reg.cliques||0)+1;
    salvarStorage(STORAGE.afiliados,afiliados);
}
function refDe(pid){
    const r=lerStorage(STORAGE.refs,{})[pid];
    if(!r||Date.now()-r.t>30*864e5)return null;
    return usuarios.find(x=>codAf(x)===r.cod)||null;
}
function afiliarProduto(id){
    if(!usuarioLogado){abrirLogin();return;}
    const p=produtos.find(x=>x.id===id);
    if(!p)return;
    if(!(p.comissao>0)){notificar("Este produto não tem programa de afiliados.","error");return;}
    if(p.vendedorId===usuarioLogado.id){notificar("Não pode afiliar o seu próprio produto.","error");return;}
    const r=regAf(usuarioLogado.id,id);
    r.link=linkProduto(id,usuarioLogado);r.comissao=p.comissao;
    salvarStorage(STORAGE.afiliados,afiliados);
    copiar(r.link);
    notificar("Link copiado! Ganha "+p.comissao+"% por cada venda.","success");
    atualizarDashboard();
}
function copiarLink(id){const r=afiliados.find(a=>a.id===id);if(r){copiar(r.link);notificar("Link copiado.","success");}}

/* ---- liquidação de vendas: 2% plataforma, comissão afiliado, resto vendedor ---- */
function liquidarPedido(p){
    // Evita creditar duas vezes a mesma encomenda.
    if(!p || p.liquidado) return;
    p.itens.forEach(it=>{
        const A=R2(Number(it.preco)*Number(it.quantidade));
        const prod=produtos.find(x=>x.id===it.produtoId)||{};
        const taxa=R2(A*TAXA_VENDA);
        const af=it.afiliadoId ? usuarios.find(u=>u.id===it.afiliadoId) : null;
        const percentual=Number(it.comissaoPercentual ?? prod.comissao ?? 0);
        let com=0;
        if(af && af.id!==p.compradorId && af.id!==it.vendedorId && percentual>0){
            com=R2(A*percentual/100);
            if(com>0){
                lancar(af.id,"comissao",com,"Comissão de afiliado: "+it.nome,p.id);
                it.afiliadoId=af.id;
                const r=regAf(af.id,it.produtoId);
                r.comissao=percentual;
                r.vendas=(r.vendas||0)+Number(it.quantidade||1);
                r.ganho=R2((r.ganho||0)+com);
            }
        }
        const liq=R2(A-taxa-com);
        lancar(PLAT,"taxa_venda",taxa,"Taxa Nurbook 2%: "+it.nome,p.id);
        if(it.vendedorId)lancar(it.vendedorId,"venda",liq,"Venda: "+it.nome,p.id);
        else lancar(PLAT,"venda_propria",liq,"Venda própria: "+it.nome,p.id);
        it.taxa=taxa;it.comissao=com;it.liquido=liq;
    });
    p.liquidado=true;
    salvarStorage(STORAGE.pedidos,pedidos);
    salvarStorage(STORAGE.afiliados,afiliados);
}
const _confirmarCompra=confirmarCompra;
confirmarCompra=function(){
    const n=pedidos.length;
    _confirmarCompra();
    if(pedidos.length>n){liquidarPedido(pedidos[pedidos.length-1]);atualizarDashboard();}
};

/* ---- levantamentos ---- */
function abrirSaque(){
    const uid=ehAdmin()?PLAT:usuarioLogado.id;
    _$("saqueDisp").textContent=formatarMT(saldoDe(uid));
    _$("saqueInfo").textContent=ehAdmin()?"Sem taxa para o administrador.":"Taxa de levantamento: 10% · Mínimo: "+MIN_SAQUE+" MT";
    abrirModal("modalSaque"); setTimeout(()=>atualizarCamposPagamento("saque"), 30);
}
function previewSaque(){
    const v=parseFloat(_$("saqueValor").value)||0;
    _$("saquePrev").innerHTML=!v?"":ehAdmin()?`Receberá: <b>${formatarMT(v)}</b> (sem taxa)`:`Taxa (10%): <b>${formatarMT(R2(v*TAXA_SAQUE))}</b> · Receberá: <b>${formatarMT(R2(v*(1-TAXA_SAQUE)))}</b>`;
}
function pedirSaque(){
    const adm=ehAdmin(),uid=adm?PLAT:usuarioLogado.id,v=R2(parseFloat(_$("saqueValor").value)),n=_$("saqueNumero").value.trim(),m=_$("saqueMetodo").value;
    if(!(v>0)||(!adm&&v<MIN_SAQUE))return notificar(adm?"Indique um valor válido.":"Valor mínimo: "+MIN_SAQUE+" MT.","error");
    if(v>saldoDe(uid))return notificar("Saldo insuficiente.","error");
    if(n.replace(/\D/g,"").length<9)return notificar("Número ou conta inválido.","error");
    const s={id:gerarID("saque"),uid,nome:adm?"Administrador":usuarioLogado.nome,valor:v,taxa:adm?0:R2(v*TAXA_SAQUE),liquido:adm?v:R2(v*(1-TAXA_SAQUE)),metodo:m,destino:n,status:adm?"Pago":"Pendente",data:new Date().toLocaleString("pt-MZ")};
    saques.push(s);salvarStorage(STORAGE.saques,saques);
    lancar(uid,adm?"saque_admin":"saque",-v,"Levantamento "+m,s.id);
    fecharModal("modalSaque");_$("saqueValor").value="";_$("saquePrev").textContent="";
    atualizarDashboard();
    notificar(adm?"Levantamento registado: "+formatarMT(v):"Pedido enviado. Receberá "+formatarMT(s.liquido)+" após aprovação.","success");
}
function decidirSaque(id,pagar){
    if(!ehAdmin())return;
    const s=saques.find(x=>x.id===id);
    if(!s||s.status!=="Pendente")return;
    if(pagar){
        s.status="Pago";
        lancar(PLAT,"taxa_saque",s.taxa,"Taxa 10%: "+s.nome,s.id);
        notificar("Pague "+formatarMT(s.liquido)+" a "+s.nome+" ("+s.metodo+" "+s.destino+").","success");
    }else{
        s.status="Rejeitado";
        lancar(s.uid,"estorno_saque",s.valor,"Levantamento rejeitado",s.id);
        notificar("Levantamento rejeitado e valor devolvido.","success");
    }
    salvarStorage(STORAGE.saques,saques);
    atualizarDashboard();
}

/* ---- publicar produto ---- */
function abrirVender(){
    if(!usuarioLogado){abrirLogin();return;}
    imgProduto=null;_$("imgPrev").style.display="none";
    abrirModal("modalVender");
}
function usarModelo(){
    const t=_$("produtoDescricao");
    if(t.value.trim()&&!confirm("Substituir a descrição atual pelo modelo?"))return;
    t.value="O QUE É\nExplique em 2 ou 3 frases o que é o produto e qual problema ele resolve.\n\nO QUE VAI APRENDER / RECEBER\nDescreva os resultados concretos que o cliente vai ter depois de comprar.\n\nPOR QUE FUNCIONA\nMostre a sua experiência, o método ou os diferenciais.\n\nENTREGA\nComo e quando o cliente recebe (acesso imediato, entrega em X dias...).";
}
function previewImagem(inp){
    const f=inp.files[0];
    if(!f)return;
    if(!/^image\//.test(f.type)){notificar("Escolha um ficheiro de imagem.","error");return;}
    const r=new FileReader();
    r.onload=()=>{const im=new Image();im.onload=()=>{
        const k=Math.min(1,800/Math.max(im.width,im.height)),c=document.createElement("canvas");
        c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);
        c.getContext("2d").drawImage(im,0,0,c.width,c.height);
        imgProduto=c.toDataURL("image/jpeg",.78);
        _$("imgPrev").src=imgProduto;_$("imgPrev").style.display="block";
    };im.src=r.result;};
    r.readAsDataURL(f);
}
function publicarProduto(){
    if(!usuarioLogado){abrirLogin();return;}
    if(!ehParceiro())return notificar(MSG_PARC,"error");
    const g=id=>_$(id).value.trim(),nome=g("produtoNome"),desc=g("produtoDescricao"),sub=g("produtoSubtitulo");
    const preco=parseFloat(_$("produtoPreco").value),tipo=_$("produtoTipo").value,com=parseFloat(_$("produtoComissao").value);
    let estoque=parseInt(_$("produtoEstoque").value);
    const ben=linhas(_$("produtoBeneficios").value);
    if(nome.length<5)return notificar("Dê um nome claro ao produto (mín. 5 letras).","error");
    if(!(preco>0))return notificar("Defina um preço válido.","error");
    if(!(estoque>0)){if(tipo==="digital")estoque=9999;else return notificar("Defina o estoque.","error");}
    if(sub.length<10)return notificar("Escreva a promessa/subtítulo (mín. 10 letras).","error");
    if(desc.length<120)return notificar("Descrição curta: escreva pelo menos 120 caracteres.","error");
    if(ben.length<3)return notificar("Liste pelo menos 3 benefícios (um por linha).","error");
    if(!(com>=0&&com<=70))return notificar("Comissão de afiliados: de 0% a 70%.","error");
    const p={id:gerarID("prod"),nome,categoria:_$("produtoCategoria").value,tipo,preco,estoque,descricao:desc,subtitulo:sub,beneficios:ben,
        publico:linhas(_$("produtoPublico").value),conteudo:linhas(_$("produtoConteudo").value),garantia:parseInt(_$("produtoGarantia").value),
        comissao:com,status:"pendente",suporte:g("produtoSuporte"),imagem:imgProduto||"imagens/logo.png",
        vendedor:usuarioLogado.nome,vendedorId:usuarioLogado.id,vendas:0,criadoEm:new Date().toISOString()};
    produtos.unshift(p);
    try{salvarStorage(STORAGE.produtos,produtos);}
    catch(e){produtos.shift();notificar("Sem espaço para guardar a imagem. Use uma menor.","error");return;}
    fecharModal("modalVender");
    ["produtoNome","produtoPreco","produtoEstoque","produtoDescricao","produtoSubtitulo","produtoBeneficios","produtoPublico","produtoConteudo","produtoSuporte"].forEach(i=>{_$(i).value="";});
    imgProduto=null;
    renderProdutos();atualizarDashboard();
    notificar("Produto enviado para aprovação. Fica visível na loja assim que for aprovado.","success");
}

/* ---- vitrine e página de vendas ---- */
function renderProdutos(lista=produtos){
    lista=lista.filter(visivel);
    const c=_$("listaProdutos");
    if(!lista.length){c.innerHTML='<div class="vazio"><i class="fa-solid fa-box-open"></i><h3>Nenhum produto encontrado</h3><p>Tente outra pesquisa.</p></div>';return;}
    c.innerHTML=lista.map(p=>`<article class="product-card pc2">
<div class="pc-img" onclick="abrirProduto('${p.id}')"><img class="product-image" src="${esc(p.imagem)}" alt="${esc(p.nome)}" onerror="this.onerror=null;this.src='imagens/logo.png'"><span class="pc-badge">${p.tipo==="digital"?"Digital":"Físico"}</span>${p.comissao>0?`<span class="pc-aff">${p.comissao}% afiliado</span>`:''}</div>
<div class="product-body"><div class="product-category">${esc(p.categoria)}</div>
<h3 class="product-title" onclick="abrirProduto('${p.id}')">${esc(p.nome)}</h3>
<p class="product-description">${esc(p.subtitulo||p.descricao)}</p>
<div class="product-meta"><i class="fa-solid fa-user"></i> ${esc(p.vendedor)} · ${p.vendas||0} vendas</div>
<div class="product-price">${formatarMT(p.preco)}</div>
<div class="product-actions"><button class="btn btn-primary" onclick="abrirProduto('${p.id}')">Ver oferta</button>
<button class="btn btn-outline" onclick="adicionarAoCarrinho('${p.id}')" title="Adicionar ao carrinho"><i class="fa-solid fa-cart-plus"></i></button>
<button class="btn btn-outline so-parceiro" onclick="afiliarProduto('${p.id}')" title="Divulgar como afiliado"><i class="fa-solid fa-link"></i></button></div></div></article>`).join("");
}
function abrirProduto(id){location.hash="#/p/"+id;}
function fecharPagina(){if(!usuarioLogado){document.body.classList.remove("guest-sale");document.body.style.overflow="";_$("salesPage").classList.remove("active");return;}location.hash="#produtos";}
function comprarAgora(id){
    const p=produtos.find(x=>x.id===id);
    if(ehAdmin()){notificar("O administrador não pode comprar.","error");return;}
    if(p&&!visivel(p)){notificar("Produto ainda não aprovado.","error");return;}
    if(!usuarioLogado){comprarComoVisitante(id);return;}
    adicionarAoCarrinho(id);abrirCarrinho();
}
function rotear(){
    const pg=_$("salesPage"),m=location.hash.match(/^#\/p\/([^\/]+)(?:\/ref\/([^\/]+))?/);
    if(!m){pg.classList.remove("active");document.body.classList.remove("guest-sale");document.body.style.overflow="";return;}
    const p=produtos.find(x=>x.id===decodeURIComponent(m[1]));
    const meu=!!usuarioLogado&&!!p&&p.vendedorId===usuarioLogado.id;
    if(!p||(!visivel(p)&&!ehAdmin()&&!meu)){notificar("Produto não encontrado.","error");location.hash="#produtos";return;}
    if(m[2]&&visivel(p))guardarRef(p.id,m[2]);
    document.body.classList.toggle("guest-sale",!usuarioLogado);
    renderPaginaVenda(p);
    if(!visivel(p))pg.insertAdjacentHTML("afterbegin",'<div style="background:#fef3c7;color:#92400e;padding:10px 24px;font-weight:600;text-align:center">'+(p.status==="rejeitado"?"Produto rejeitado"+(p.motivo?": "+esc(p.motivo):""):"Em análise: ainda não está visível para os clientes.")+"</div>");
    pg.classList.add("active");pg.scrollTop=0;document.body.style.overflow="hidden";
}
window.addEventListener("hashchange",rotear);
function renderPaginaVenda(p){
    const ben=p.beneficios&&p.beneficios.length?p.beneficios:["Acesso imediato após a confirmação do pagamento","Conteúdo prático, claro e direto ao ponto","Suporte do vendedor para tirar dúvidas","Compra protegida pela Nurbook"];
    const gar=p.garantia===undefined?7:p.garantia,dig=p.tipo==="digital",wa=(p.suporte||"").replace(/\D/g,"");
    const lista=(a,c)=>`<ul class="sp-list ${c||""}">${a.map(x=>`<li><i class="fa-solid fa-circle-check"></i><span>${esc(x)}</span></li>`).join("")}</ul>`;
    const sec=(t,h)=>h?`<h2>${t}</h2>${h}`:"";
    _$("salesPage").innerHTML=`
<div class="sp-bar">${usuarioLogado?'<button class="btn btn-light" onclick="fecharPagina()"><i class="fa-solid fa-arrow-left"></i> Voltar</button>':'<button class="btn btn-primary" onclick="fecharPagina()"><i class="fa-solid fa-right-to-bracket"></i> Entrar / Criar conta</button>'}<strong>Nurbook</strong><button class="btn btn-success" onclick="comprarAgora('${p.id}')">Comprar · ${formatarMT(p.preco)}</button></div>
<div class="sp-hero"><div class="sp-wrap"><div>
<span class="sp-chip">${esc(p.categoria)} · ${dig?"Produto digital":"Produto físico"}</span>
<h1>${esc(p.nome)}</h1><p class="sp-sub">${esc(p.subtitulo||p.descricao.slice(0,160))}</p>
<div class="sp-meta"><span><i class="fa-solid fa-user"></i> ${esc(p.vendedor)}</span><span><i class="fa-solid fa-bag-shopping"></i> ${p.vendas||0} vendas</span>${gar?`<span><i class="fa-solid fa-shield-halved"></i> Garantia de ${gar} dias</span>`:''}</div></div>
<aside class="sp-buy"><img src="${esc(p.imagem)}" alt="${esc(p.nome)}" onerror="this.onerror=null;this.src='imagens/logo.png'">
<div class="sp-price">${formatarMT(p.preco)}</div>
<button class="btn btn-success sp-cta" onclick="comprarAgora('${p.id}')"><i class="fa-solid fa-lock"></i> Comprar agora</button>
<ul class="sp-trust"><li><i class="fa-solid fa-lock"></i>Pagamento seguro</li><li><i class="fa-solid fa-${dig?"bolt":"truck"}"></i>${dig?"Acesso imediato após o pagamento":"Entrega em Moçambique"}</li>${gar?`<li><i class="fa-solid fa-shield-halved"></i>${gar} dias de garantia</li>`:''}</ul></aside></div></div>
<div class="sp-body">
${sec("O que vai receber",lista(ben))}
${sec("Sobre este produto",paragrafos(p.descricao))}
${sec("Para quem é",p.publico&&p.publico.length?lista(p.publico):"")}
${sec("O que está incluído",p.conteudo&&p.conteudo.length?lista(p.conteudo,"sp-mod"):"")}
${gar?`<div class="sp-box"><i class="fa-solid fa-shield-halved"></i><div><strong>Garantia de ${gar} dias</strong><br>Se não ficar satisfeito, fale com o vendedor dentro de ${gar} dias após a compra.</div></div>`:''}
${sec("Sobre o vendedor",`<p><strong>${esc(p.vendedor)}</strong> · ${p.vendas||0} vendas na Nurbook.</p>${wa?`<a class="btn btn-outline" target="_blank" rel="noopener" href="https://wa.me/${wa}"><i class="fa-brands fa-whatsapp"></i> Falar com o vendedor</a>`:''}`)}
${p.comissao>0&&ehParceiro()&&p.vendedorId!==usuarioLogado.id?`<div class="sp-box aff"><i class="fa-solid fa-sack-dollar"></i><div><strong>Ganhe ${p.comissao}% por cada venda</strong><br>Divulgue este produto com o seu link de afiliado. <button class="btn btn-primary btn-sm" onclick="afiliarProduto('${p.id}')">Quero ser afiliado</button></div></div>`:''}
</div>
<div class="sp-sticky"><strong>${formatarMT(p.preco)}</strong><button class="btn btn-success" onclick="comprarAgora('${p.id}')">Comprar agora</button></div>`;
}

/* ---- v3: menu lateral, perfis e páginas ---- */
let vistaAtual="loja",guestPid=null;
const MSG_PARC="Só contas Vendedor / Afiliado podem fazer isto. Mude o tipo da conta em Minha conta.";
const ehParceiro=()=>!!usuarioLogado&&usuarioLogado.tipo==="parceiro";
const ROTULO={comprador:"Comprador",parceiro:"Vendedor / Afiliado",admin:"Administrador"};
const MENUS={
    comprador:[["loja","fa-store","Loja"],["pedidos","fa-receipt","Meus pedidos"],["conta","fa-user-gear","Minha conta"]],
    parceiro:[["painel","fa-gauge","Painel"],["marketplace","fa-bullhorn","Marketplace de afiliados"],["produtos","fa-box","Meus produtos"],["faturamento","fa-file-invoice-dollar","Faturamento de vendas"],["loja","fa-store","Loja"],["conta","fa-user-gear","Minha conta"]],
    admin:[["a-pendentes","fa-clipboard-check","Produtos pendentes"],["a-dinheiro","fa-coins","Dinheiro"],["a-monitor","fa-chart-line","Monitoramento"],["loja","fa-store","Loja"]]
};
const vistaInicial=()=>ehAdmin()?"a-pendentes":ehParceiro()?"painel":"loja";
function aplicarPerfil(){
    document.body.classList.remove("r-comprador","r-parceiro","r-admin");
    if(usuarioLogado)document.body.classList.add("r-"+usuarioLogado.tipo);
}
function menuLateral(abrir){document.body.classList.toggle("menu-aberto",abrir);if(abrir)renderMenu();}
function renderMenu(){
    if(!usuarioLogado)return;
    const t=usuarioLogado.tipo,pend=produtos.filter(p=>p.status==="pendente").length;
    _$("sideNav").innerHTML=(MENUS[t]||MENUS.comprador).map(([v,i,l])=>`<button class="${v===vistaAtual?"on":""}" onclick="irPara('${v}')"><i class="fa-solid ${i}"></i>${l}${v==="a-pendentes"&&pend?`<b class="badge">${pend}</b>`:""}</button>`).join("")+`<button class="sair" onclick="sairDaConta()"><i class="fa-solid fa-right-from-bracket"></i>Sair</button>`;
    _$("sideUser").innerHTML=`<strong>${esc(usuarioLogado.nome)}</strong><span>${ROTULO[t]||t}</span>`;
}
function irPara(v){
    const ok=!!usuarioLogado&&(MENUS[usuarioLogado.tipo]||[]).some(x=>x[0]===v);
    if(!ok)v="loja";
    vistaAtual=v;
    document.body.dataset.view=v==="loja"?"loja":"app";
    menuLateral(false);
    if(v!=="loja")renderView();
    renderMenu();
    window.scrollTo(0,0);
}
function mostrarDashboard(){if(!usuarioLogado){abrirLogin();return;}irPara(ehAdmin()?"a-pendentes":ehParceiro()?"painel":"conta");}
function abrirAdmin(){irPara("a-pendentes");}
function renderView(){
    if(!usuarioLogado||vistaAtual==="loja")return;
    const V={painel:vPainel,marketplace:vMarketplace,produtos:vProdutos,faturamento:vFaturamento,pedidos:vPedidos,conta:vConta,"a-pendentes":vPendentes,"a-dinheiro":vDinheiro,"a-monitor":vMonitor}[vistaAtual];
    if(V)_$("appView").innerHTML=V();
    renderMenu();
}
const _atualizarDashboard=atualizarDashboard;
atualizarDashboard=function(){_atualizarDashboard();renderView();};

const card=(i,v,t)=>`<div class="stat-card"><i class="fa-solid ${i}"></i><strong>${v}</strong><span>${t}</span></div>`;
const cab=(t,d)=>`<div class="section-title"><h2>${t}</h2><p>${d||""}</p></div>`;
const caixa=(t,h)=>`<div class="dashboard-box" style="margin-top:18px"><h3>${t}</h3>${h}</div>`;
const movRow=m=>[esc(m.data),esc(m.desc),`<b style="color:${m.valor<0?"#dc2626":"#16a34a"}">${formatarMT(m.valor)}</b>`];
const histSaques=id=>{const sq=saques.filter(s=>s.uid===id).slice(-6).reverse();return sq.length?"<h4 style='margin-top:16px'>Levantamentos</h4>"+tb(["Data","Valor","Receberá","Estado"],sq.map(s=>[esc(s.data),formatarMT(s.valor),formatarMT(s.liquido),`<span class="st ${s.status}">${s.status}</span>`])):"";};
const btnVer=id=>`<button class="btn btn-outline btn-sm" onclick="abrirProduto('${id}')">Ver</button>`;

/* --- vendedor / afiliado --- */
function vPainel(){
    const id=usuarioLogado.id,mov=carteira.filter(m=>m.uid===id);
    const itens=pedidos.reduce((n,p)=>n+p.itens.filter(i=>i.vendedorId===id).reduce((a,i)=>a+i.quantidade,0),0);
    return cab("Painel","Resumo das suas vendas e do dinheiro faturado.")+`<div class="stats">${card("fa-wallet",formatarMT(saldoDe(id)),"Saldo disponível")}${card("fa-money-bill-wave",formatarMT(somar(mov.filter(m=>m.tipo==="venda"))),"Faturado em vendas")}${card("fa-handshake",formatarMT(somar(mov.filter(m=>m.tipo==="comissao"))),"Comissões de afiliado")}${card("fa-bag-shopping",itens,"Unidades vendidas")}</div>`
    +caixa("Levantar dinheiro",`<p class="nota">A Nurbook cobra 2% por venda (já descontados) e 10% por levantamento. Mínimo ${MIN_SAQUE} MT.</p><button class="btn btn-primary" onclick="abrirSaque()"><i class="fa-solid fa-money-bill-transfer"></i> Levantar</button>`+histSaques(id))
    +caixa("Últimos movimentos",tb(["Data","Movimento","Valor"],mov.slice(-10).reverse().map(movRow)));
}
const HEAD_MKT=["Produto","Categoria","Preço","Comissão","Ganha por venda",""];
function linhasMkt(q){
    const id=usuarioLogado.id;q=(q||"").toLowerCase();
    return produtos.filter(p=>visivel(p)&&p.vendedorId!==id&&p.comissao>0&&(p.nome+" "+p.categoria+" "+p.vendedor).toLowerCase().includes(q))
        .sort((a,b)=>b.comissao-a.comissao).map(p=>{
            const r=afiliados.find(a=>a.afiliadoId===id&&a.produtoId===p.id&&a.link);
            return [esc(p.nome),esc(p.categoria),formatarMT(p.preco),p.comissao+"%",formatarMT(R2(p.preco*p.comissao/100)),btnVer(p.id)+(r?` <button class="btn btn-outline btn-sm" onclick="copiarLink('${r.id}')">Copiar link</button>`:` <button class="btn btn-primary btn-sm" onclick="afiliarProduto('${p.id}')">Afiliar-me</button>`)];
        });
}
function filtrarMkt(){_$("mktTabela").innerHTML=tb(HEAD_MKT,linhasMkt(_$("mktBusca").value));}
function vMarketplace(){
    const id=usuarioLogado.id,meus=afiliados.filter(a=>a.afiliadoId===id&&a.link);
    return cab("Marketplace de afiliados","Escolha produtos já publicados, gere o seu link e ganhe comissão por cada venda.")
    +`<div class="dashboard-box"><input class="form-control" id="mktBusca" placeholder="Pesquisar produto, categoria ou vendedor..." oninput="filtrarMkt()"><div id="mktTabela">${tb(HEAD_MKT,linhasMkt(""))}</div></div>`
    +caixa("Os meus links",`<p class="nota">O seu código de afiliado: <b class="cod">${codAf(usuarioLogado)}</b></p>`+tb(["Produto","Comissão","Cliques","Vendas","Ganho",""],meus.map(a=>{const p=produtos.find(x=>x.id===a.produtoId);return [esc(p?p.nome:"(removido)"),a.comissao+"%",a.cliques||0,a.vendas||0,formatarMT(a.ganho||0),`<button class="btn btn-outline btn-sm" onclick="copiarLink('${a.id}')">Copiar link</button>`];})));
}
function vProdutos(){
    const mp=produtos.filter(p=>p.vendedorId===usuarioLogado.id);
    return cab("Meus produtos","Cadastre produtos e acompanhe a aprovação.")+`<button class="btn btn-success" onclick="abrirVender()"><i class="fa-solid fa-plus"></i> Cadastrar produto</button>`
    +caixa("Produtos cadastrados",tb(["Produto","Preço","Vendas","Afiliado","Estado","Página de vendas"],mp.map(p=>[esc(p.nome),formatarMT(p.preco),p.vendas||0,(p.comissao||0)+"%",estadoTag(p)+(p.status==="rejeitado"&&p.motivo?`<br><small>${esc(p.motivo)}</small>`:""),btnVer(p.id)+` <button class="btn btn-outline btn-sm" onclick="copiar(linkProduto('${p.id}'));notificar('Link copiado.','success')">Copiar link</button>`])));
}
function vFaturamento(){
    const id=usuarioLogado.id,rows=[];let bruto=0,tx=0,cm=0,liq=0;
    pedidos.forEach(p=>p.itens.forEach(i=>{
        if(i.vendedorId!==id)return;
        const A=R2(i.preco*i.quantidade),t=i.taxa!==undefined?i.taxa:R2(A*TAXA_VENDA),c=i.comissao||0,l=i.liquido!==undefined?i.liquido:R2(A-t-c);
        bruto+=A;tx+=t;cm+=c;liq+=l;
        rows.push([esc(p.data),esc(i.nome),esc(p.comprador)+(p.contacto?`<br><small>${esc(p.contacto)}</small>`:""),formatarMT(A),formatarMT(t),formatarMT(c),formatarMT(l)]);
    }));
    const com=carteira.filter(m=>m.uid===id&&m.tipo==="comissao");
    return cab("Faturamento de vendas","Tudo o que vendeu e quanto ficou para si.")
    +`<div class="stats">${card("fa-chart-line",formatarMT(bruto),"Vendas brutas")}${card("fa-percent",formatarMT(tx),"Taxa Nurbook (2%)")}${card("fa-handshake",formatarMT(cm),"Comissões pagas a afiliados")}${card("fa-wallet",formatarMT(liq),"Líquido recebido")}</div>`
    +caixa("Vendas dos meus produtos",tb(["Data","Produto","Comprador","Valor","Taxa 2%","Afiliado","Líquido"],rows.reverse()))
    +caixa("Comissões que ganhei como afiliado",tb(["Data","Origem","Valor"],com.slice(-15).reverse().map(movRow)));
}
/* --- comprador / conta --- */
function vPedidos(){
    const id=usuarioLogado.id;
    return cab("Meus pedidos","Histórico das suas compras.")+caixa("Compras",tb(["Data","Produtos","Total","Pagamento","Estado"],pedidos.filter(p=>p.compradorId===id).reverse().map(p=>[esc(p.data),esc(p.itens.map(i=>i.nome).join(", ")),formatarMT(p.total),esc(p.pagamento),esc(p.status)])));
}
function vConta(){
    const u=usuarioLogado,p=ehParceiro();
    return cab("Minha conta")+caixa("Dados",`<p><b>Nome:</b> ${esc(u.nome)}</p><p><b>Utilizador:</b> ${esc(u.identificador)}</p><p><b>Tipo de conta:</b> ${ROTULO[u.tipo]}</p>${p?`<p><b>Código de afiliado:</b> <span class="cod">${codAf(u)}</span></p>`:""}`)
    +caixa("Tipo de conta",`<p class="nota">${p?"Como Vendedor / Afiliado pode cadastrar produtos e divulgar produtos de outros.":"Como Comprador só pode pesquisar e comprar. Para vender ou ganhar comissões, mude para Vendedor / Afiliado."}</p><button class="btn btn-primary" onclick="mudarTipo('${p?"comprador":"parceiro"}')">Mudar para ${p?"Comprador":"Vendedor / Afiliado"}</button>`);
}
function mudarTipo(t){
    if(!usuarioLogado||ehAdmin()||(t!=="comprador"&&t!=="parceiro"))return;
    const u=usuarios.find(x=>x.id===usuarioLogado.id);
    if(u){u.tipo=t;salvarStorage(STORAGE.usuarios,usuarios);}
    usuarioLogado.tipo=t;salvarStorage(STORAGE.sessao,usuarioLogado);
    aplicarPerfil();renderProdutos();
    notificar("Conta alterada para "+ROTULO[t]+".","success");
    irPara(t==="parceiro"?"painel":"loja");
}
/* --- administrador: só ver, aprovar/rejeitar e levantar --- */
function decidirProduto(id,ok){
    if(!ehAdmin())return;
    const p=produtos.find(x=>x.id===id);
    if(!p)return;
    let motivo="";
    if(!ok){const m=prompt("Motivo da rejeição (será mostrado ao vendedor):");if(m===null)return;motivo=m.trim();}
    p.status=ok?"aprovado":"rejeitado";p.motivo=motivo;
    salvarStorage(STORAGE.produtos,produtos);
    renderProdutos();renderView();
    notificar(ok?"Produto aprovado e publicado.":"Produto rejeitado.","success");
}
const acoesProd=p=>btnVer(p.id)+(p.status==="rejeitado"||p.status==="pendente"?` <button class="btn btn-success btn-sm" onclick="decidirProduto('${p.id}',true)">Aprovar</button>`:"")+(p.status!=="rejeitado"?` <button class="btn btn-danger btn-sm" onclick="decidirProduto('${p.id}',false)">Rejeitar</button>`:"");
function vPendentes(){
    const pend=produtos.filter(p=>p.status==="pendente");
    return cab("Produtos pendentes","Aprove ou rejeite os produtos enviados pelos vendedores.")
    +caixa(`Aguardam aprovação (${pend.length})`,tb(["Produto","Vendedor","Categoria","Tipo","Preço","Afiliado","Descrição",""],pend.map(p=>[esc(p.nome),esc(p.vendedor),esc(p.categoria),esc(p.tipo),formatarMT(p.preco),(p.comissao||0)+"%",esc((p.descricao||"").slice(0,90))+"…",acoesProd(p)])));
}
function vDinheiro(){
    const P=carteira.filter(m=>m.uid===PLAT),soma=t=>somar(P.filter(m=>m.tipo===t));
    const ord=saques.filter(s=>s.uid!==PLAT).sort((a,b)=>(a.status==="Pendente"?0:1)-(b.status==="Pendente"?0:1)).slice(0,15);
    const meus=saques.filter(s=>s.uid===PLAT).slice(-6).reverse();
    return cab("Dinheiro","Receita da plataforma, levantamentos e movimentos.")
    +`<div class="stats">${card("fa-wallet",formatarMT(somar(P)),"Saldo disponível")}${card("fa-coins",formatarMT(somar(P.filter(m=>m.valor>0))),"Receita total")}${card("fa-percent",formatarMT(soma("taxa_venda")),"Taxas de venda (2%)")}${card("fa-money-bill-transfer",formatarMT(soma("taxa_saque")),"Taxas de levantamento (10%)")}${card("fa-chart-line",formatarMT(somar(pedidos.map(p=>({valor:p.total})))),"Volume vendido")}</div>`
    +caixa("Levantar o meu dinheiro",`<p class="nota">O administrador levanta sem taxa.</p><button class="btn btn-primary" onclick="abrirSaque()"><i class="fa-solid fa-money-bill-transfer"></i> Levantar</button>`+(meus.length?tb(["Data","Valor","Destino"],meus.map(s=>[esc(s.data),formatarMT(s.valor),esc(s.metodo+" "+s.destino)])):""))
    +caixa(`Levantamentos dos utilizadores (${saques.filter(s=>s.uid!==PLAT&&s.status==="Pendente").length} pendentes)`,tb(["Data","Utilizador","Valor","Taxa 10%","A pagar","Destino","Estado",""],ord.map(s=>[esc(s.data),esc(s.nome),formatarMT(s.valor),formatarMT(s.taxa),formatarMT(s.liquido),esc(s.metodo+" "+s.destino),`<span class="st ${s.status}">${s.status}</span>`,s.status==="Pendente"?`<button class="btn btn-success btn-sm" onclick="decidirSaque('${s.id}',true)">Pagar</button> <button class="btn btn-danger btn-sm" onclick="decidirSaque('${s.id}',false)">Rejeitar</button>`:""])))
    +caixa("Movimentos da plataforma",tb(["Data","Movimento","Valor"],P.slice(-10).reverse().map(movRow)));
}
function vMonitor(){
    return cab("Monitoramento","Acompanhe vendas, utilizadores e produtos.")
    +`<div class="stats">${card("fa-users",usuarios.length,"Utilizadores")}${card("fa-box",produtos.filter(visivel).length,"Produtos aprovados")}${card("fa-clock",produtos.filter(p=>p.status==="pendente").length,"Produtos pendentes")}${card("fa-bag-shopping",pedidos.length,"Pedidos")}</div>`
    +caixa("Últimas vendas",tb(["Data","Comprador","Total","Taxa 2%","Pagamento"],pedidos.slice(-10).reverse().map(p=>[esc(p.data),esc(p.comprador),formatarMT(p.total),formatarMT(somar(p.itens.map(i=>({valor:i.taxa||0})))),esc(p.pagamento)])))
    +caixa("Utilizadores",tb(["Nome","Utilizador","Tipo","Saldo"],usuarios.map(u=>[esc(u.nome),esc(u.identificador),esc(ROTULO[u.tipo]||u.tipo),formatarMT(saldoDe(u.id))])))
    +caixa("Todos os produtos",tb(["Produto","Vendedor","Preço","Vendas","Estado",""],produtos.map(p=>[esc(p.nome),esc(p.vendedor),formatarMT(p.preco),p.vendas||0,estadoTag(p),acoesProd(p)])));
}

/* --- compra sem conta (visitante) --- */
function comprarComoVisitante(id){
    const p=produtos.find(x=>x.id===id);
    if(!p||!visivel(p))return;
    if(!(p.estoque>0)){notificar("Produto sem estoque.","error");return;}
    guestPid=id;
    _$("guestBody").innerHTML=`<div class="info-box"><strong>${esc(p.nome)}</strong><br>${formatarMT(p.preco)} · ${p.tipo==="digital"?"entrega digital":"entrega física"}</div>
<div class="form-group"><label>Nome completo</label><input id="gNome" class="form-control" autocomplete="name"></div>
<div class="form-group"><label>Telefone / WhatsApp</label><input id="gContacto" class="form-control" autocomplete="tel" placeholder="84 000 0000"></div>
<div class="form-group"><label>E-mail (opcional)</label><input id="gEmail" class="form-control" autocomplete="email"></div>
${p.tipo==="fisico"?`<div class="form-group"><label>Província e cidade</label><input id="gLocal" class="form-control"></div><div class="form-group"><label>Endereço de entrega</label><input id="gEnd" class="form-control"></div>`:""}
<div class="form-group"><label>Quantidade</label><input type="number" id="gQtd" class="form-control" min="1" max="${p.estoque}" value="1" oninput="totalGuest()"></div>
<div class="form-group"><label>Método de pagamento</label>
<select id="gPag" class="form-control" onchange="atualizarCamposPagamentoGuest()">
<option value="M-Pesa">M-Pesa (Vodacom)</option>
<option value="e-Mola">e-Mola (Movitel)</option>
<option value="mKesh">mKesh (Tmcel)</option>
<option value="Cartão internacional">Cartão internacional (Visa / Mastercard)</option>
</select></div>
<div id="painelPagamentoGuest" class="pay-panel"></div>
<p class="nota" id="gTotal"></p>
<button class="btn btn-success" style="width:100%" onclick="confirmarGuest()"><i class="fa-solid fa-lock"></i> Confirmar compra</button>
<p class="nota">Não precisa de criar conta. Pagamento simulado nesta versão.</p>`;
    totalGuest();abrirModal("modalGuest");setTimeout(atualizarCamposPagamentoGuest,40);
}

function atualizarCamposPagamentoGuest(){
  const metodo = (_$("gPag")||{}).value || "M-Pesa";
  const painel = _$("painelPagamentoGuest");
  if(!painel) return;
  const idPrefix = "payGst";
  if(PAG_PREFIXOS[metodo]){
    painel.innerHTML = htmlCamposMovel(metodo, idPrefix);
  } else if(metodo === "Cartão internacional"){
    painel.innerHTML = htmlCamposCartao(idPrefix);
  } else {
    painel.innerHTML = htmlCamposBanco(idPrefix);
  }
}

function totalGuest(){
    const p=produtos.find(x=>x.id===guestPid);
    if(!p)return;
    _$("gTotal").innerHTML="Total: <b>"+formatarMT(p.preco*Math.max(1,parseInt(_$("gQtd").value)||1))+"</b>";
}
async function confirmarGuest(){
    const p=produtos.find(x=>x.id===guestPid);
    if(!p||!visivel(p))return;
    const nome=_$("gNome").value.trim(),ct=_$("gContacto").value.trim(),q=parseInt(_$("gQtd").value)||0;
    if(nome.length<3)return notificar("Digite o seu nome.","error");
    if(ct.replace(/\D/g,"").length<9)return notificar("Digite um telefone válido.","error");
    if(q<1||q>p.estoque)return notificar("Quantidade inválida.","error");
    const pag = lerPagamento("guest");
    if(!pag.ok) return notificar(pag.mensagem, "error");
    let mpesaResult = null;
    if(pag.metodo === "M-Pesa" && pag.detalhe && pag.detalhe.tipo === "movel"){
        notificar("A enviar pedido M-Pesa...", "normal");
        mpesaResult = await processarMpesaC2B({
            amount: p.preco * q,
            phone: pag.detalhe.numero,
            orderId: "GV" + Date.now().toString(36).toUpperCase(),
            description: p.nome
        });
        if(!mpesaResult.ok) return notificar(mpesaResult.message, "error");
        if(mpesaResult.simulated) notificar("M-Pesa simulado (sem credenciais no servidor).", "normal");
        else notificar("Confirme o PIN no telemóvel.", "success");
        pag.detalhe.transactionId = mpesaResult.transactionId;
        pag.detalhe.conversationId = mpesaResult.conversationId;
        pag.detalhe.simulated = mpesaResult.simulated;
    }
    let entrega=null;
    if(p.tipo==="fisico"){
        const l=_$("gLocal").value.trim(),e=_$("gEnd").value.trim();
        if(!l||!e)return notificar("Preencha a morada de entrega.","error");
        entrega={local:l,endereco:e,telefone:ct};
    }
    const ped={id:gerarID("pedido"),compradorId:"visitante",comprador:nome,contacto:ct,email:_$("gEmail").value.trim(),
        itens:[{produtoId:p.id,nome:p.nome,preco:p.preco,quantidade:q,vendedor:p.vendedor,vendedorId:p.vendedorId||null,
            afiliadoId:(refDe(p.id)&&refDe(p.id).id!==p.vendedorId)?refDe(p.id).id:null,
            comissaoPercentual:Number(p.comissao||0)}],
        total:p.preco*q,pagamento:pag.metodo,pagamentoDetalhe:pag.detalhe,status:"Pagamento simulado",data:new Date().toLocaleString("pt-MZ"),entrega};
    p.estoque-=q;p.vendas=(p.vendas||0)+q;
    pedidos.push(ped);
    salvarStorage(STORAGE.pedidos,pedidos);salvarStorage(STORAGE.produtos,produtos);
    liquidarPedido(ped);
    const wa=(p.suporte||"").replace(/\D/g,"");
    _$("guestBody").innerHTML=`<div style="text-align:center;padding:10px"><i class="fa-solid fa-circle-check" style="font-size:54px;color:#16a34a"></i><h3 style="margin:12px 0">Compra confirmada!</h3><p>Obrigado, ${esc(nome)}. O vendedor vai contactá-lo no ${esc(ct)}.</p><p class="nota">Pedido ${esc(ped.id.slice(-8))}</p>${wa?`<a class="btn btn-outline" target="_blank" rel="noopener" href="https://wa.me/${wa}"><i class="fa-brands fa-whatsapp"></i> Falar com o vendedor</a><br><br>`:""}<button class="btn btn-primary" onclick="fecharModal('modalGuest')">Fechar</button></div>`;
    if(usuarioLogado)atualizarDashboard();
}

/* ---- navegação do login e acesso de administrador (só pelo login normal) ---- */
function authTab(a){
    _$("formEntrar").classList.toggle("active",a==="entrar");
    _$("formCriar").classList.toggle("active",a!=="entrar");
    _$("tabEntrar").classList.toggle("active",a==="entrar");
    _$("tabCriar").classList.toggle("active",a!=="entrar");
    authErro("erroEntrar","");authErro("erroCriar","");
    setTimeout(()=>{const f=_$(a==="entrar"?"loginUsuario":"cadNome");if(f)f.focus();},50);
}
const _fazerLogin=fazerLogin;
fazerLogin=async function(){
    const e=_$("loginUsuario").value.trim().toLowerCase(),sn=_$("loginSenha").value;
    if(!e||!sn||await hashSenha(e)!==ADM_E)return _fazerLogin();
    authErro("erroEntrar","");
    if(Date.now()<bloqueioLogin){authErro("erroEntrar","Muitas tentativas. Aguarde um momento.");return;}
    if(await hashSenha(sn)!==ADM_S){
        if(++tentativasLogin>=5){bloqueioLogin=Date.now()+30000;tentativasLogin=0;}
        authErro("erroEntrar","Senha incorreta.");return;
    }
    tentativasLogin=0;
    usuarioLogado={id:ADMIN_ID,nome:"Administrador",identificador:"",tipo:"admin"};
    salvarStorage(STORAGE.sessao,usuarioLogado);
    _$("loginSenha").value="";
    liberarApp();
};
const _fazerCadastro=fazerCadastro;
fazerCadastro=async function(){
    const e=_$("cadEmail").value.trim().toLowerCase();
    if(e&&await hashSenha(e)===ADM_E){authErro("erroCriar","Este utilizador já existe. Vá ao separador Entrar.");return;}
    return _fazerCadastro();
};
const _addCarrinho=adicionarAoCarrinho;
adicionarAoCarrinho=function(id){
    const p=produtos.find(x=>x.id===id);
    if(ehAdmin()){notificar("O administrador não pode comprar.","error");return;}
    if(p&&!visivel(p)){notificar("Produto ainda não aprovado.","error");return;}
    _addCarrinho(id);
};
const _abrirVender=abrirVender;
abrirVender=function(){
    if(!usuarioLogado){abrirLogin();return;}
    if(!ehParceiro()){notificar(ehAdmin()?"O administrador não pode vender nem se afiliar.":MSG_PARC,"error");return;}
    _abrirVender();
};
const _afiliarProduto=afiliarProduto;
afiliarProduto=function(id){
    if(!usuarioLogado){abrirLogin();return;}
    if(!ehParceiro()){notificar(ehAdmin()?"O administrador não pode vender nem se afiliar.":MSG_PARC,"error");return;}
    _afiliarProduto(id);
};

/* ---- ligação ao fluxo existente ---- */
const _liberarApp=liberarApp;
liberarApp=function(){
    migrar();_liberarApp();
    document.body.classList.remove("guest-sale");
    aplicarPerfil();
    _$("navAdmin").style.display="none";
    irPara(vistaInicial());
    rotear();
};
const _sairDaConta=sairDaConta;
sairDaConta=function(){
    _sairDaConta();
    _$("salesPage").classList.remove("active");
    document.body.classList.remove("menu-aberto","r-comprador","r-parceiro","r-admin","guest-sale");
    document.body.removeAttribute("data-view");
    vistaAtual="loja";document.body.style.overflow="";
};
const _iniciarNurbook=iniciarNurbook;
iniciarNurbook=function(){migrar();_iniciarNurbook();if(!usuarioLogado)rotear();};
const _pesquisarProdutos=pesquisarProdutos;
pesquisarProdutos=function(){if(usuarioLogado&&vistaAtual!=="loja")irPara("loja");_pesquisarProdutos();};

document.addEventListener(
    "DOMContentLoaded",
    iniciarNurbook
);

/* ===== Melhorias profissionais Nurbook (interface e permissões de visualização) ===== */
(function(){
    const fmt = n => formatarMT(Number(n)||0);

    /* Pesquisa global: aparece apenas no Marketplace de afiliados. */
    const _irParaProf = irPara;
    irPara = function(v){
        _irParaProf(v);
        document.body.classList.toggle("mkt-search", v === "marketplace" && ehParceiro());
        const campo = document.getElementById("campoBusca");
        if(campo && v !== "marketplace") campo.value = "";
    };

    /* Marketplace com imagem sempre visível, preço, comissão percentual e ganho por venda. */
    function renderCartoesMarketplace(termo){
        const host = document.getElementById("mktTabela");
        if(!host) return;
        const id = usuarioLogado.id;
        const q = String(termo||"").trim().toLowerCase();
        const lista = produtos.filter(p =>
            visivel(p) && p.vendedorId !== id && Number(p.comissao)>0 &&
            (String(p.nome||"")+" "+String(p.categoria||"")+" "+String(p.vendedor||"")).toLowerCase().includes(q)
        ).sort((a,b)=>Number(b.comissao)-Number(a.comissao));

        if(!lista.length){
            host.innerHTML='<div class="market-empty"><i class="fa-solid fa-box-open"></i><h3>Nenhum produto encontrado</h3><p>Tente outra pesquisa.</p></div>';
            return;
        }
        host.innerHTML='<div class="market-grid">'+lista.map(p=>{
            const reg=afiliados.find(a=>a.afiliadoId===id && a.produtoId===p.id && a.link);
            const ganho=R2(Number(p.preco)*Number(p.comissao)/100);
            const imagem=esc(p.imagem||"imagens/logo.png");
            return `<article class="market-card">
                <div class="market-photo" onclick="abrirProduto('${p.id}')" role="button" tabindex="0">
                    <img src="${imagem}" alt="${esc(p.nome)}" loading="lazy"
                         onerror="this.onerror=null;this.src='imagens/logo.png'">
                    <span class="market-commission">${Number(p.comissao)}% comissão</span>
                </div>
                <div class="market-content">
                    <small class="product-category">${esc(p.categoria||"Produto")}</small>
                    <h3>${esc(p.nome)}</h3>
                    <div class="market-price">${fmt(p.preco)}</div>
                    <div class="market-earn"><i class="fa-solid fa-wallet"></i> Ganha ${fmt(ganho)} por venda</div>
                    <div class="nota">Vendedor: ${esc(p.vendedor||"Vendedor Nurbook")}</div>
                    <div class="market-actions">
                        <button class="btn btn-outline btn-sm" onclick="abrirProduto('${p.id}')">Ver produto</button>
                        ${reg
                            ? `<button class="btn btn-primary btn-sm" onclick="copiarLink('${reg.id}')">Copiar link</button>`
                            : `<button class="btn btn-primary btn-sm" onclick="afiliarProduto('${p.id}')">Afiliar-me</button>`}
                    </div>
                </div>
            </article>`;
        }).join("")+'</div>';
    }

    vMarketplace = function(){
        const id=usuarioLogado.id;
        const meus=afiliados.filter(a=>a.afiliadoId===id&&a.link);
        return cab("Marketplace de afiliados","Escolha produtos, veja a comissão antes de divulgar e acompanhe os seus links.")
        +`<div class="dashboard-box">
            <label for="mktBusca"><b>Pesquisar produtos</b></label>
            <input class="form-control" id="mktBusca" placeholder="Nome, categoria ou vendedor..." oninput="filtrarMkt()">
            <div id="mktTabela"></div>
        </div>`
        +caixa("Os meus links de afiliado",
            `<p class="nota">Código de afiliado: <b class="cod">${codAf(usuarioLogado)}</b></p>`
            +tb(["Produto","Comissão","Cliques","Vendas","Ganho",""],meus.map(a=>{
                const p=produtos.find(x=>x.id===a.produtoId);
                return [esc(p?p.nome:"(produto removido)"),a.comissao+"%",a.cliques||0,a.vendas||0,fmt(a.ganho||0),
                    `<button class="btn btn-outline btn-sm" onclick="copiarLink('${a.id}')">Copiar link</button>`];
            }))
        );
    };
    filtrarMkt = function(){
        const m=document.getElementById("mktBusca");
        renderCartoesMarketplace(m?m.value:"");
    };

    /* Vitrine: mantém a imagem visível e apresenta também o ganho estimado do afiliado. */
    const _renderProdutosProf = renderProdutos;
    renderProdutos = function(lista=produtos){
        _renderProdutosProf(lista);
        if(!ehParceiro()) return;
        document.querySelectorAll("#listaProdutos .product-card").forEach(card=>{
            const title=card.querySelector(".product-title");
            if(!title) return;
            const p=produtos.find(x=>x.nome===title.textContent);
            if(!p || !(Number(p.comissao)>0) || p.vendedorId===usuarioLogado.id) return;
            if(card.querySelector(".market-earn")) return;
            const price=card.querySelector(".product-price");
            if(price){
                const info=document.createElement("div");
                info.className="market-earn";
                info.textContent=`Comissão: ${p.comissao}% · Ganha ${fmt(R2(p.preco*p.comissao/100))} por venda`;
                price.insertAdjacentElement("afterend",info);
            }
        });
    };

    /* Painel administrativo: nunca apresenta saldo, carteira ou valor bruto de contas alheias. */
    vMonitor = function(){
        const linhas=[];
        pedidos.slice(-30).reverse().forEach(p=>{
            (p.itens||[]).forEach(i=>{
                const taxa=Number(i.taxa||R2(Number(i.preco||0)*Number(i.quantidade||1)*TAXA_VENDA));
                linhas.push([esc(p.data||""),esc(i.nome||"Produto"),Number(i.quantidade||1),fmt(taxa)]);
            });
        });
        const totalTaxas=R2(carteira.filter(m=>m.uid===PLAT&&m.tipo==="taxa_venda").reduce((s,m)=>s+Number(m.valor||0),0));
        return cab("Monitoramento","Indicadores de atividade e taxas da plataforma. Os valores brutos das vendas e os saldos dos utilizadores são privados.")
        +`<div class="stats">
            ${card("fa-users",usuarios.length,"Utilizadores registados")}
            ${card("fa-box",produtos.filter(visivel).length,"Produtos aprovados")}
            ${card("fa-clock",produtos.filter(p=>p.status==="pendente").length,"Produtos pendentes")}
            ${card("fa-bag-shopping",pedidos.length,"Pedidos registados")}
            ${card("fa-percent",fmt(totalTaxas),"Taxas Nurbook acumuladas (2%)")}
        </div>`
        +caixa("Vendas e taxa da plataforma",
            tb(["Data","Produto","Unidades","Taxa Nurbook (2%)"],linhas))
        +caixa("Utilizadores",
            tb(["Nome","Tipo de conta"],usuarios.map(u=>[esc(u.nome),esc(ROTULO[u.tipo]||u.tipo)])))
        +caixa("Produtos",
            tb(["Produto","Vendedor","Unidades vendidas","Estado",""],produtos.map(p=>[
                esc(p.nome),esc(p.vendedor),Number(p.vendas||0),estadoTag(p),acoesProd(p)
            ])));
    };

    /* Carteira do administrador: apenas receitas próprias da Nurbook, nunca dinheiro de vendedores. */
    vDinheiro = function(){
        const P=carteira.filter(m=>m.uid===PLAT);
        const taxaVendas=R2(P.filter(m=>m.tipo==="taxa_venda").reduce((s,m)=>s+Number(m.valor||0),0));
        const taxaSaques=R2(P.filter(m=>m.tipo==="taxa_saque").reduce((s,m)=>s+Number(m.valor||0),0));
        const levantamentos=R2(P.filter(m=>m.tipo==="saque_admin").reduce((s,m)=>s+Math.abs(Number(m.valor||0)),0));
        const saldo=R2(taxaVendas+taxaSaques-levantamentos);
        const ord=saques.filter(s=>s.uid!==PLAT).sort((a,b)=>(a.status==="Pendente"?0:1)-(b.status==="Pendente"?0:1)).slice(0,20);
        const meus=saques.filter(s=>s.uid===PLAT).slice(-10).reverse();
        return cab("Carteira da Nurbook","Aqui aparecem exclusivamente as receitas da plataforma: 2% das vendas, taxas de levantamento e os levantamentos do administrador.")
        +`<div class="stats">
            ${card("fa-wallet",fmt(saldo),"Saldo dos descontos da Nurbook")}
            ${card("fa-percent",fmt(taxaVendas),"Descontos das vendas (2%)")}
            ${card("fa-money-bill-transfer",fmt(taxaSaques),"Taxas de levantamentos")}
            ${card("fa-arrow-up-from-bracket",fmt(levantamentos),"Levantamentos do administrador")}
        </div>`
        +caixa("Levantar receitas da Nurbook",
            `<p class="nota">O saldo apresentado é apenas da plataforma, não inclui carteiras ou vendas de vendedores e afiliados.</p>
             <button class="btn btn-primary" onclick="abrirSaque()"><i class="fa-solid fa-money-bill-transfer"></i> Levantar</button>`
             +(meus.length?tb(["Data","Valor","Destino"],meus.map(s=>[esc(s.data),fmt(s.valor),esc(s.metodo+" "+s.destino)])):""))
        +caixa("Pedidos de levantamento dos utilizadores",
            tb(["Data","Utilizador","Valor solicitado","Taxa","A pagar","Destino","Estado",""],ord.map(s=>[
                esc(s.data),esc(s.nome),fmt(s.valor),fmt(s.taxa),fmt(s.liquido),esc(s.metodo+" "+s.destino),
                `<span class="st ${s.status}">${s.status}</span>`,
                s.status==="Pendente"
                    ? `<button class="btn btn-success btn-sm" onclick="decidirSaque('${s.id}',true)">Pagar</button> <button class="btn btn-danger btn-sm" onclick="decidirSaque('${s.id}',false)">Rejeitar</button>`
                    : ""
            ])));
    };

    /* Navegação superior funcional. */
    function ligarNavegacao(){
        const links=document.querySelectorAll("header nav a");
        if(links[0]) links[0].onclick=e=>{e.preventDefault();irPara("loja");mostrarInicio();};
        if(links[1]) links[1].onclick=e=>{e.preventDefault();irPara("loja");setTimeout(mostrarCategorias,0);};
        if(links[2]) links[2].onclick=e=>{e.preventDefault();irPara("loja");setTimeout(irParaProdutos,0);};
        if(links[3]) links[3].onclick=e=>{e.preventDefault();mostrarDashboard();};
        const campo=document.getElementById("campoBusca");
        if(campo){
            campo.oninput=()=>{
                const destino=document.getElementById("mktBusca");
                if(destino){destino.value=campo.value;filtrarMkt();}
            };
        }
        document.body.classList.toggle("mkt-search",vistaAtual==="marketplace"&&ehParceiro());
    }
    // O saldo levantável do administrador é calculado exclusivamente pelas taxas.
    function saldoTaxasNurbook(){
        const P=carteira.filter(m=>m.uid===PLAT);
        const entradas= P.filter(m=>m.tipo==="taxa_venda"||m.tipo==="taxa_saque")
            .reduce((s,m)=>s+Number(m.valor||0),0);
        const saidas=P.filter(m=>m.tipo==="saque_admin")
            .reduce((s,m)=>s+Math.abs(Number(m.valor||0)),0);
        return R2(entradas-saidas);
    }
    const abrirSaqueAnterior=abrirSaque;
    abrirSaque=function(){
        if(!ehAdmin()) return abrirSaqueAnterior();
        _$("saqueDisp").textContent=formatarMT(saldoTaxasNurbook());
        _$("saqueInfo").textContent="Disponível apenas: taxas de venda (2%) + taxas de levantamento (10%).";
        abrirModal("modalSaque"); setTimeout(()=>atualizarCamposPagamento("saque"), 30);
    };
    const pedirSaqueAnterior=pedirSaque;
    pedirSaque=function(){
        if(!ehAdmin()) return pedirSaqueAnterior();
        const v=R2(parseFloat(_$("saqueValor").value)||0);
        const n=_$("saqueNumero").value.trim();
        const m=_$("saqueMetodo").value;
        if(!(v>0)) return notificar("Indique um valor válido.","error");
        if(v>saldoTaxasNurbook()) return notificar("O valor excede o saldo das taxas da Nurbook.","error");
        if(n.replace(/\D/g,"").length<9) return notificar("Número ou conta inválido.","error");
        const s={id:gerarID("saque"),uid:PLAT,nome:"Administrador",valor:v,taxa:0,liquido:v,metodo:m,destino:n,status:"Pago",data:new Date().toLocaleString("pt-MZ")};
        saques.push(s); salvarStorage(STORAGE.saques,saques);
        lancar(PLAT,"saque_admin",-v,"Levantamento das taxas da Nurbook "+m,s.id);
        fecharModal("modalSaque"); _$("saqueValor").value=""; _$("saquePrev").textContent="";
        atualizarDashboard();
        notificar("Levantamento registado: "+formatarMT(v),"success");
    };

    document.addEventListener("DOMContentLoaded",ligarNavegacao);
    const _renderViewProf=renderView;
    renderView=function(){
        _renderViewProf();
        if(vistaAtual==="marketplace"&&ehParceiro()){
            document.body.classList.add("mkt-search");
            renderCartoesMarketplace(document.getElementById("mktBusca")?.value||"");
        }else{
            document.body.classList.remove("mkt-search");
        }
        ligarNavegacao();
    };
})();


/* ---- Override: validação rigorosa de pagamento em saques ---- */
const _pedirSaqueBase = typeof pedirSaque === "function" ? pedirSaque : null;
pedirSaque = function(){
    const adm = ehAdmin();
    const uid = adm ? PLAT : usuarioLogado.id;
    const v = R2(parseFloat(_$("saqueValor").value) || 0);
    if(!(v > 0) || (!adm && v < MIN_SAQUE))
        return notificar(adm ? "Indique um valor válido." : "Valor mínimo: " + MIN_SAQUE + " MT.", "error");

    const saldoDisp = adm ? (typeof saldoTaxasNurbook === "function" ? saldoTaxasNurbook() : saldoDe(uid)) : saldoDe(uid);
    if(v > saldoDisp) return notificar("Saldo insuficiente.", "error");

    const pag = lerPagamento("saque");
    if(!pag.ok) return notificar(pag.mensagem, "error");

    const m = pag.metodo;
    const destino = pag.detalhe.tipo === "movel"
        ? pag.detalhe.numero
        : (pag.detalhe.banco + " · " + pag.detalhe.conta);

    const s = {
        id: gerarID("saque"),
        uid,
        nome: adm ? "Administrador" : usuarioLogado.nome,
        valor: v,
        taxa: adm ? 0 : R2(v * TAXA_SAQUE),
        liquido: adm ? v : R2(v * (1 - TAXA_SAQUE)),
        metodo: m,
        destino,
        pagamentoDetalhe: pag.detalhe,
        status: adm ? "Pago" : "Pendente",
        data: new Date().toLocaleString("pt-MZ")
    };
    saques.push(s);
    salvarStorage(STORAGE.saques, saques);
    lancar(uid, adm ? "saque_admin" : "saque", -v, "Levantamento " + m, s.id);
    fecharModal("modalSaque");
    if(_$("saqueValor")) _$("saqueValor").value = "";
    if(_$("saquePrev")) _$("saquePrev").textContent = "";
    atualizarDashboard();
    notificar(adm
        ? "Levantamento registado: " + formatarMT(v)
        : "Pedido enviado. Receberá " + formatarMT(s.liquido) + " após aprovação.",
        "success");
};

