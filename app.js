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

  window.criarOrdem = function () {
    if (usuarioAtual.role === 'leitura') {
      alert('Perfil somente leitura');
      return;
    }

    db.collection('ordens').add({
      cliente: cliente.value,
      responsavel: responsavel.value,
      operacoes: operacoes.value.split('\n').map(o => ({ texto: o, feito: false })),
      status: status.value,
      ativo: true,
      criado: new Date()
    });

    cliente.value = '';
    responsavel.value = '';
    operacoes.value = '';
  };

  function carregarOrdens() {
    db.collection('ordens').where('ativo', '==', true)
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
              : ''
            }
          `;
          lista.appendChild(li);
        });
      });
  }

  window.arquivar = function (id) {
    db.collection('ordens').doc(id).update({ ativo: false });
  };

});
