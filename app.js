
// FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDuTdJUlItMQ1N60_5EOTc4J-0L7Vq09-k",
  authDomain: "eric-cycles-dashboard.firebaseapp.com",
  projectId: "eric-cycles-dashboard"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

let usuarioAtual = null;
let editId = null;

function login(){
  auth.signInWithEmailAndPassword(
    document.getElementById('email').value,
    document.getElementById('senha').value
  ).catch(e=>alert(e.message));
}

function logout(){ auth.signOut(); }

auth.onAuthStateChanged(user=>{
  if(!user){
    loginBox.style.display='block';
    appBox.style.display='none';
    return;
  }

  db.collection('usuarios').doc(user.email).get().then(doc => {

  if (!doc.exists) {
    alert('Usuário sem perfil cadastrado no Firestore');
    auth.signOut();
    return;
  }

  usuarioAtual = doc.data();

  if (!usuarioAtual.role) {
    alert('Perfil sem campo "role"');
    auth.signOut();
    return;
  }

  perfil.innerText = 'Perfil: ' + usuarioAtual.role;

  loginBox.style.display = 'none';
  appBox.style.display = 'block';

  carregarOrdens();
});

});

function criarOrdem(){
  if(usuarioAtual.role === 'leitura') return alert('Somente leitura');

  db.collection('ordens').add({
    cliente: cliente.value,
    responsavel: responsavel.value,
    operacoes: operacoes.value.split('\n').map(o=>({texto:o,feito:false})),
    status: status.value,
    ativo: true,
    criado: new Date()
  });

  cliente.value='';
  responsavel.value='';
  operacoes.value='';
}

function carregarOrdens(){
  db.collection('ordens').where('ativo','==',true)
  .onSnapshot(snapshot=>{
    lista.innerHTML='';
    snapshot.forEach(doc=>{
      const d = doc.data();
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${d.cliente}</strong><br>
        ${d.responsavel}<br>
        <span class="status-${d.status}">${d.status}</span><br>
        <button onclick="abrirModal('${doc.id}')">Editar</button>
        ${usuarioAtual.role==='admin' ? `<button onclick="arquivar('${doc.id}')">Arquivar</button>` : ''}
      `;
      lista.appendChild(li);
    });
  });
}

function abrirModal(id){
  editId = id;
  db.collection('ordens').doc(id).get().then(doc=>{
    const d = doc.data();
    m_cliente.value = d.cliente;
    m_responsavel.value = d.responsavel;
    m_operacoes.value = d.operacoes.map(o=>o.texto).join('\n');
    m_status.value = d.status;
    modal.style.display='flex';
  });
}

function salvarEdicao(){
  db.collection('ordens').doc(editId).update({
    cliente: m_cliente.value,
    responsavel: m_responsavel.value,
    operacoes: m_operacoes.value.split('\n').map(o=>({texto:o,feito:false})),
    status: m_status.value
  });
  fecharModal();
}

function fecharModal(){ modal.style.display='none'; }

function arquivar(id){ db.collection('ordens').doc(id).update({ativo:false}); }

document.addEventListener('DOMContentLoaded', () => {

  const loginBox = document.getElementById('login');
  const appBox = document.getElementById('app');
  const perfil = document.getElementById('perfil');
  const lista = document.getElementById('lista');

  if (!loginBox || !appBox) {
    console.error('ERRO: elementos #login ou #app não encontrados');
    return;
  }

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

});

