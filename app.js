// ================= FIREBASE =================
const firebaseConfig = {
  apiKey: "AIzaSyCXExMKGz5gKFnj2-KHAIMgbphUEKfV_KM",
  authDomain: "dashboard-eric-2021.firebaseapp.com",
  projectId: "dashboard-eric-2021"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// ================= ESTADO =================
let usuarioAtual = null;
let editId = null;

// ================= DOM READY =================
document.addEventListener('DOMContentLoaded', () => {

  const loginBox = document.getElementById('login');
  const appBox   = document.getElementById('app');
  const perfil   = document.getElementById('perfil');
  const lista    = document.getElementById('lista');

  // ---------- LOGIN ----------
  window.login = function () {
    auth.signInWithEmailAndPassword(
      document.getElementById('email').value,
      document.getElementById('senha').value
    ).catch(err => alert(err.message));
  };

  window.logout = function () {
    auth.signOut();
  };

  // ---------- AUTH STATE ----------
  auth.onAuthStateChanged(user => {

    if (!user) {
      loginBox.style.display = 'block';
      appBox.style.display = 'none';
      return;
    }

    db.collection('usuarios').doc(user.email).get().then(doc => {

      if (!doc.exists || !doc.data().role) {
        alert('Usuário sem perfil configurado');
        auth.signOut();
        return;
      }

      usuarioAtual = doc.data();
      perfil.innerText = 'Perfil: ' + usuarioAtual.role;

      loginBox.style.display = 'none';
      appBox.style.display = 'block';

      carregarOrdens();
    });
  });

  // ---------- CRIAR ORDEM ----------
  window.criarOrdem = function () {

    if (!usuarioAtual || usuarioAtual.role === 'leitura') {
      alert('Sem permissão');
      return;
    }

    const clienteEl = document.getElementById('cliente');
    const responsavelEl = document.getElementById('responsavel');
    const operacoesEl = document.getElementById('operacoes');
    const statusEl = document.getElementById('status');

    if (!clienteEl || !responsavelEl || !operacoesEl || !statusEl) {
      alert('Erro interno');
      return;
    }

    const cliente = clienteEl.value.trim();
    const responsavel = responsavelEl.value.trim();
    const status = statusEl.value || 'pendente';

    if (!cliente || !responsavel) {
      alert('Cliente e responsável obrigatórios');
      return;
    }

    const operacoes = operacoesEl.value
      .split('\n')
      .map(o => o.trim())
      .filter(o => o !== '')
      .map(o => ({ texto: o, feito: false }));

    db.collection('ordens').add({
      cliente,
      responsavel,
      operacoes,
      status,
      ativo: true,
      criado: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      clienteEl.value = '';
      responsavelEl.value = '';
      operacoesEl.value = '';
    })
    .catch(err => {
      console.error(err);
      alert('Erro ao criar ordem');
    });
  };

  // ---------- LISTAR ----------
  function carregarOrdens() {
    db.collection('ordens')
      .where('ativo', '==', true)
      .onSnapshot(snapshot => {
        lista.innerHTML = '';
        snapshot.forEach(doc => {
          const d = doc.data();
          const li = document.createElement('li');
          li.innerHTML = `
            <strong>${d.cliente}</strong><br>
            ${d.responsavel}<br>
            <span>${d.status}</span><br>
            ${usuarioAtual.role === 'admin'
              ? `<button onclick="arquivar('${doc.id}')">Arquivar</button>`
              : ''}
          `;
          lista.appendChild(li);
        });
      });
  }

  // ---------- ARQUIVAR ----------
  window.arquivar = function (id) {
    if (usuarioAtual.role !== 'admin') return;
    db.collection('ordens').doc(id).update({ ativo: false });
  };

});
