// FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCXExMKGz5gKFnj2-KHAIMgbphUEKfV_KM",
  authDomain: "dashboard-eric-2021.firebaseapp.com",
  projectId: "dashboard-eric-2021"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

let usuarioAtual = null;
let editId = null;

document.addEventListener('DOMContentLoaded', () => {

  const loginBox = document.getElementById('login');
  const appBox   = document.getElementById('app');
  const perfil   = document.getElementById('perfil');
  const lista    = document.getElementById('lista');

  if (!loginBox || !appBox) {
    console.error('ERRO: elementos #login ou #app não encontrados');
    return;
  }

  // LOGIN (precisa ser global)
  window.login = function () {
    auth.signInWithEmailAndPassword(
      document.getElementById('email').value,
      document.getElementById('senha').value
    ).catch(e => alert(e.message));
  };

  window.logout = function () {
    auth.signOut();
  };

  auth.onAuthStateChanged(user => {

    if (!user) {
      loginBox.style.display = 'block';
      appBox.style.display = 'none';
      return;
    }

    db.collection('usuarios').doc(user.email).get().then(doc => {

      if (!doc.exists) {
        alert('Usuário sem perfil cadastrado');
        auth.signOut();
        return;
      }

      usuarioAtual = doc.data();

      if (perfil) {
        perfil.innerText = 'Perfil: ' + usuarioAtual.role;
      }

      loginBox.style.display = 'none';
      appBox.style.display = 'block';

      carregarOrdens();
    });

  });

  // ===== FUNÇÕES =====

function criarOrdem() {

  const clienteEl = document.getElementById('cliente');
  const responsavelEl = document.getElementById('responsavel');
  const operacoesEl = document.getElementById('operacoes');
  const statusEl = document.getElementById('status');

  // Verificação obrigatória
  if (!clienteEl || !responsavelEl || !operacoesEl || !statusEl) {
    alert('Erro interno: campos do formulário não encontrados');
    return;
  }

  if (!clienteEl.value.trim() || !responsavelEl.value.trim()) {
    alert('Cliente e responsável são obrigatórios');
    return;
  }

  // Garante que status nunca é undefined
  const statusFinal = statusEl.value || 'pendente';

  db.collection('ordens').add({
    cliente: clienteEl.value.trim(),
    responsavel: responsavelEl.value.trim(),
    operacoes: operacoesEl.value
      .split('\n')
      .filter(l => l.trim() !== '')
      .map(o => ({ texto: o, feito: false })),
    status: statusFinal,
    ativo: true,
    criado: new Date()
  });

  clienteEl.value = '';
  responsavelEl.value = '';
  operacoesEl.value = '';
}


