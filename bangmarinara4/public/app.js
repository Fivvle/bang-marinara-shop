/* ============================
   BANG MARINARA — app.js v3
   ============================ */

// Color pattern: B=#1f56b5 A=#fcdf03 N=#d62929 G=#4eb51f (repeating)
const LETTER_COLORS = ['#1f56b5','#fcdf03','#d62929','#4eb51f'];

const PRODUCTS = [
  { id:1, name:'STRUCTURE COAT', category:'outerwear', price:298, emoji:'🖤', bg:'#1a1a1a', color:'#c8ff00', desc:'Oversized wool-blend coat with raw-hem finishes. Dropped shoulders, minimal internal structure. Charcoal.', sizes:['XS','S','M','L','XL'] },
  { id:2, name:'VOID SHIRT', category:'tops', price:88, emoji:'□', bg:'#f0ede6', color:'#0a0a0a', desc:'Boxy-cut heavyweight cotton shirt. Triple-stitched seams. Slightly oversized through the torso.', sizes:['XS','S','M','L','XL','XXL'] },
  { id:3, name:'MATTER TROUSER', category:'bottoms', price:145, emoji:'||', bg:'#3d3530', color:'#f2efe8', desc:'Wide-leg cotton-linen trouser. Elastic waist. Two deep side pockets. Stone & Ink.', sizes:['XS','S','M','L','XL'] },
  { id:4, name:'FIELD JACKET', category:'outerwear', price:245, emoji:'◈', bg:'#5a6348', color:'#f2efe8', desc:'Ripstop shell, four chest pockets, single back vent. Unlined. Sage green.', sizes:['S','M','L','XL'] },
  { id:5, name:'ARCHIVE TEE', category:'tops', price:52, emoji:'A', bg:'#b84a2e', color:'#f2efe8', desc:'Relaxed heavyweight jersey. Drop shoulder. Screen-printed archive mark at left chest.', sizes:['XS','S','M','L','XL','XXL'] },
  { id:6, name:'RIB KNIT', category:'tops', price:96, emoji:'≡', bg:'#c4b8a8', color:'#0a0a0a', desc:'Merino wool ribbed knit. Crew neck. No logo. Wears under everything.', sizes:['XS','S','M','L','XL'] },
  { id:7, name:'UTILITY PANT', category:'bottoms', price:165, emoji:'✦', bg:'#2c2c2c', color:'#c8ff00', desc:'Six-pocket cargo cut in dense cotton twill. Straight leg, natural waist. Black or Tan.', sizes:['XS','S','M','L','XL'] },
];

const ACCESSORIES = [
  { id:8, name:'CANVAS BAG', category:'accessories', price:65, emoji:'⬡', bg:'#e8dfc8', color:'#0a0a0a', desc:'Waxed canvas tote. Interior zip pocket. 16" handles. Fits a laptop.', sizes:['ONE SIZE'] },
  { id:9, name:'WOOL SCARF', category:'accessories', price:78, emoji:'~', bg:'#7a7469', color:'#f2efe8', desc:'Hand-loomed 100% merino. 200cm length. No fringe. Does exactly one job.', sizes:['ONE SIZE'] },
  { id:10, name:'LEATHER CARD CASE', category:'accessories', price:42, emoji:'▭', bg:'#3a2a1a', color:'#e8dfc8', desc:'Vegetable-tanned leather. Holds 6 cards. Gets better with use.', sizes:['ONE SIZE'] },
];

let cart = JSON.parse(localStorage.getItem('bm_cart') || '[]');
let currentUser = JSON.parse(localStorage.getItem('bm_user') || 'null');
let selectedSize = null;
let currentProduct = null;
let activeSection = null;

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  renderProducts(PRODUCTS, 'products-grid');
  renderProducts(ACCESSORIES, 'accessories-grid');
  updateCartCount();
  updateAuthUI();
});

// ---- REVEAL INTERACTION ----
function showReveal(el) {
  const prefix = el.dataset.revealPrefix;
  const rest = el.dataset.reveal;
  const color = window.getComputedStyle(el).color;

  const strip = document.getElementById('reveal-text');
  // prefix letter in same color, rest in ink
  strip.innerHTML = `<span style="color:${color}">${prefix}</span><span style="color:#0a0a0a">${rest}</span>`;
  strip.classList.add('visible');
}

function hideReveal() {
  document.getElementById('reveal-text').classList.remove('visible');
}

// ---- SECTION NAVIGATION ----
function openSection(sectionId) {
  const hero = document.getElementById('hero');
  const section = document.getElementById(sectionId);

  activeSection = sectionId;
  hero.classList.add('exiting');

  setTimeout(() => {
    hero.style.display = 'none';
    section.classList.remove('hidden');
    section.classList.add('entering');
    window.scrollTo(0, 0);
    document.getElementById('reveal-text').classList.remove('visible');
  }, 360);
}

function closeSection(sectionId) {
  const hero = document.getElementById('hero');
  const section = document.getElementById(sectionId);

  section.classList.add('hidden');
  section.classList.remove('entering');
  hero.style.display = '';
  hero.classList.remove('exiting');
  activeSection = null;
  window.scrollTo(0, 0);
}

// ---- RENDER PRODUCTS ----
function renderProducts(list, gridId) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = list.map(p => `
    <div class="product-card" onclick="openProduct(${p.id}, '${gridId}')">
      <div class="product-img">
        <div class="product-img-inner" style="background:${p.bg};color:${p.color}">${p.emoji}</div>
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-category">${p.category}</div>
        <div class="product-price">$${p.price}</div>
      </div>
    </div>
  `).join('');
}

// ---- FILTER ----
function filterProducts(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filtered = cat === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === cat);
  renderProducts(filtered, 'products-grid');
}

// ---- PRODUCT MODAL ----
function openProduct(id, gridId) {
  const allProducts = [...PRODUCTS, ...ACCESSORIES];
  currentProduct = allProducts.find(p => p.id === id);
  selectedSize = null;
  const p = currentProduct;

  document.getElementById('product-detail').innerHTML = `
    <div class="pd-img" style="background:${p.bg};color:${p.color}">${p.emoji}</div>
    <div class="pd-name">${p.name} — ${p.category.toUpperCase()}</div>
    <div class="pd-price">$${p.price}</div>
    <div class="pd-desc">${p.desc}</div>
    <div class="pd-size-label">SELECT SIZE</div>
    <div class="size-row">
      ${p.sizes.map(s => `<button class="size-btn" onclick="selectSize('${s}', this)">${s}</button>`).join('')}
    </div>
    <button class="submit-btn" onclick="addToCart()">ADD TO BAG</button>
    <div id="pd-msg" class="form-error"></div>
  `;
  openModal('product-modal');
}

function selectSize(size, btn) {
  selectedSize = size;
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

function addToCart() {
  if (!selectedSize) {
    document.getElementById('pd-msg').textContent = 'Please select a size.';
    return;
  }
  const p = currentProduct;
  cart.push({ id: p.id, name: p.name, price: p.price, size: selectedSize });
  saveCart();
  updateCartCount();
  closeModal('product-modal');
  if (currentUser) saveCartToServer();
}

// ---- CART ----
function openCart() {
  const items = document.getElementById('cart-items');
  const total = document.getElementById('cart-total');
  document.getElementById('cart-msg').textContent = '';

  if (cart.length === 0) {
    items.innerHTML = '<p style="font-family:var(--font-mono);font-size:13px;color:#777;padding:20px 0">Your bag is empty.</p>';
    total.innerHTML = '';
  } else {
    items.innerHTML = cart.map((item, i) => `
      <div class="cart-item">
        <div>
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-size">Size: ${item.size}</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="cart-item-price">$${item.price}</div>
          <button class="cart-item-remove" onclick="removeFromCart(${i})">✕</button>
        </div>
      </div>
    `).join('');
    const sum = cart.reduce((a, c) => a + c.price, 0);
    total.innerHTML = `<strong>TOTAL</strong> — $${sum}`;
  }
  openModal('cart-modal');
}

function removeFromCart(i) {
  cart.splice(i, 1);
  saveCart();
  updateCartCount();
  if (currentUser) saveCartToServer();
  openCart();
}

function saveCart() { localStorage.setItem('bm_cart', JSON.stringify(cart)); }

function updateCartCount() {
  document.querySelectorAll('#cart-count, #cart-count-acc').forEach(el => {
    if (el) el.textContent = cart.length;
  });
}

async function checkout() {
  if (!currentUser) { document.getElementById('cart-msg').textContent = 'Please sign in to checkout.'; return; }
  if (cart.length === 0) { document.getElementById('cart-msg').textContent = 'Your bag is empty.'; return; }
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, items: cart }),
    });
    const data = await res.json();
    if (data.success) {
      cart = []; saveCart(); updateCartCount();
      document.getElementById('cart-msg').textContent = '✓ Order placed. Thank you.';
      document.getElementById('cart-msg').style.color = '#2a7a2a';
      document.getElementById('cart-items').innerHTML = '';
      document.getElementById('cart-total').innerHTML = '';
    } else {
      document.getElementById('cart-msg').textContent = data.error || 'Checkout failed.';
    }
  } catch { document.getElementById('cart-msg').textContent = 'Network error. Try again.'; }
}

// ---- AUTH ----
function updateAuthUI() {
  const authLink = document.getElementById('auth-link');
  const logoutBtn = document.getElementById('logout-btn');
  const userDisplay = document.getElementById('user-name-display');
  if (currentUser) {
    if (authLink) authLink.classList.add('hidden');
    if (logoutBtn) logoutBtn.classList.remove('hidden');
    if (userDisplay) userDisplay.textContent = currentUser.name.split(' ')[0].toUpperCase();
  } else {
    if (authLink) authLink.classList.remove('hidden');
    if (logoutBtn) logoutBtn.classList.add('hidden');
    if (userDisplay) userDisplay.textContent = '';
  }
}

function switchTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('login-form').classList.toggle('hidden', !isLogin);
  document.getElementById('register-form').classList.toggle('hidden', isLogin);
  document.querySelectorAll('.tab-btn').forEach((b, i) => b.classList.toggle('active', isLogin ? i === 0 : i === 1));
}

async function login() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  document.getElementById('login-error').textContent = '';
  if (!email || !password) { document.getElementById('login-error').textContent = 'Fill all fields.'; return; }
  try {
    const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, password}) });
    const data = await res.json();
    if (data.success) { currentUser = data.user; localStorage.setItem('bm_user', JSON.stringify(currentUser)); closeModal('auth-modal'); updateAuthUI(); }
    else { document.getElementById('login-error').textContent = data.error || 'Login failed.'; }
  } catch { document.getElementById('login-error').textContent = 'Network error.'; }
}

async function register() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  document.getElementById('register-error').textContent = '';
  if (!name || !email || !password) { document.getElementById('register-error').textContent = 'Fill all fields.'; return; }
  if (password.length < 6) { document.getElementById('register-error').textContent = 'Password min 6 chars.'; return; }
  try {
    const res = await fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name, email, password}) });
    const data = await res.json();
    if (data.success) { currentUser = data.user; localStorage.setItem('bm_user', JSON.stringify(currentUser)); closeModal('auth-modal'); updateAuthUI(); }
    else { document.getElementById('register-error').textContent = data.error || 'Registration failed.'; }
  } catch { document.getElementById('register-error').textContent = 'Network error.'; }
}

function logout() { currentUser = null; localStorage.removeItem('bm_user'); updateAuthUI(); }

async function saveCartToServer() {
  if (!currentUser) return;
  try { await fetch('/api/cart', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({userId: currentUser.id, cart}) }); } catch {}
}

// ---- MODALS ----
function openModal(id) { document.getElementById(id).classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); document.body.style.overflow = ''; }
