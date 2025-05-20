// Configuração do Firebase
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  databaseURL: "https://SEU_PROJETO.firebaseio.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Referências do Firebase
const productsRef = database.ref('products');
const cartRef = database.ref('cart');

// Elementos da DOM
const promoGrid = document.getElementById('promo-grid');
const featuredCarousel = document.getElementById('featured-carousel');
const filterButtons = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const cartCount = document.querySelector('.cart-count');
const zoomModal = document.getElementById('zoom-modal');
const zoomedImage = document.getElementById('zoomed-image');
const modalProductName = document.getElementById('modal-product-name');
const modalProductPrice = document.getElementById('modal-product-price');
const modalAddToCart = document.getElementById('modal-add-to-car');
const closeModal = document.querySelector('.close-modal');

// Variáveis globais
let allProducts = [];
let currentProduct = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Carrega os produtos do Firebase
function loadProductsFromFirebase() {
  productsRef.on('value', (snapshot) => {
    allProducts = [];
    const data = snapshot.val();
    
    for (let id in data) {
      allProducts.push({
        id: id,
        ...data[id]
      });
    }
    
    // Carrega produtos em destaque (os 4 primeiros)
    loadFeaturedProducts(allProducts.slice(0, 4));
    // Carrega todos os produtos
    loadProducts();
    // Atualiza contador do carrinho
    updateCartCount();
  });
}

// Carrega produtos em destaque no carrossel
function loadFeaturedProducts(products) {
  featuredCarousel.innerHTML = '';
  
  products.forEach(product => {
    const productElement = document.createElement('div');
    productElement.className = 'promo-item';
    productElement.dataset.category = product.category;
    productElement.dataset.id = product.id;
    productElement.innerHTML = `
      <div class="promo-badge">-${product.discount}%</div>
      <img src="${product.image}" alt="${product.name}" class="product-image">
      <h3>${product.name}</h3>
      <p class="old-price">R$ ${product.oldPrice.toFixed(2).replace('.', ',')}</p>
      <p class="new-price">R$ ${product.newPrice.toFixed(2).replace('.', ',')}</p>
      <button class="add-to-cart" data-id="${product.id}">Adicionar ao Carrinho</button>
    `;
    featuredCarousel.appendChild(productElement);
  });
  
  // Adiciona eventos aos produtos do carrossel
  addProductEvents();
}

// Carrega produtos na grade
function loadProducts(category = 'all', searchTerm = '') {
  promoGrid.innerHTML = '';
  
  let filteredProducts = allProducts;
  
  // Filtra por categoria
  if (category !== 'all') {
    filteredProducts = filteredProducts.filter(product => product.category === category);
  }
  
  // Filtra por termo de busca
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredProducts = filteredProducts.filter(product => 
      product.name.toLowerCase().includes(term) || 
      product.category.toLowerCase().includes(term)
    );
  }
  
  // Exibe os produtos filtrados
  filteredProducts.forEach(product => {
    const productElement = document.createElement('div');
    productElement.className = 'promo-item';
    productElement.dataset.category = product.category;
    productElement.dataset.id = product.id;
    productElement.innerHTML = `
      <div class="promo-badge">-${product.discount}%</div>
      <img src="${product.image}" alt="${product.name}" class="product-image">
      <h3>${product.name}</h3>
      <p class="old-price">R$ ${product.oldPrice.toFixed(2).replace('.', ',')}</p>
      <p class="new-price">R$ ${product.newPrice.toFixed(2).replace('.', ',')}</p>
      <button class="add-to-cart" data-id="${product.id}">Adicionar ao Carrinho</button>
    `;
    promoGrid.appendChild(productElement);
  });
  
  // Adiciona eventos aos produtos
  addProductEvents();
}

// Adiciona eventos aos produtos
function addProductEvents() {
  // Evento de clique para zoom
  document.querySelectorAll('.product-image').forEach(img => {
    img.addEventListener('click', function() {
      const productId = this.closest('.promo-item').dataset.id;
      showProductZoom(productId);
    });
  });
  
  // Evento de adicionar ao carrinho
  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', function() {
      const productId = this.dataset.id;
      addToCart(productId);
    });
  });
}

// Mostra o zoom do produto
function showProductZoom(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  
  currentProduct = product;
  zoomedImage.src = product.image;
  modalProductName.textContent = product.name;
  modalProductPrice.textContent = `R$ ${product.newPrice.toFixed(2).replace('.', ',')}`;
  zoomModal.style.display = 'block';
}

// Fecha o modal
function closeZoomModal() {
  zoomModal.style.display = 'none';
  currentProduct = null;
}

// Adiciona produto ao carrinho
function addToCart(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  
  // Verifica se o produto já está no carrinho
  const existingItem = cart.find(item => item.id === productId);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.newPrice,
      image: product.image,
      quantity: 1
    });
  }
  
  // Atualiza o localStorage
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  
  // Feedback visual
  alert(`${product.name} adicionado ao carrinho!`);
}

// Atualiza contador do carrinho
function updateCartCount() {
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  cartCount.textContent = count;
}

// Carrossel automático
function setupCarousel() {
  const carousel = document.querySelector('.carousel');
  let scrollAmount = 0;
  const scrollStep = 270;
  const maxScroll = carousel.scrollWidth - carousel.clientWidth;
  
  // Botões de navegação
  document.querySelector('.prev').addEventListener('click', () => {
    scrollAmount = Math.max(scrollAmount - scrollStep, 0);
    carousel.scrollTo({ left: scrollAmount, behavior: 'smooth' });
  });
  
  document.querySelector('.next').addEventListener('click', () => {
    scrollAmount = Math.min(scrollAmount + scrollStep, maxScroll);
    carousel.scrollTo({ left: scrollAmount, behavior: 'smooth' });
  });
  
  // Auto-scroll
  let autoScrollInterval = setInterval(() => {
    scrollAmount += scrollStep;
    if (scrollAmount >= maxScroll) scrollAmount = 0;
    carousel.scrollTo({ left: scrollAmount, behavior: 'smooth' });
  }, 3000);
  
  // Pausa quando o mouse está sobre
  carousel.addEventListener('mouseenter', () => {
    clearInterval(autoScrollInterval);
  });
  
  carousel.addEventListener('mouseleave', () => {
    autoScrollInterval = setInterval(() => {
      scrollAmount += scrollStep;
      if (scrollAmount >= maxScroll) scrollAmount = 0;
      carousel.scrollTo({ left: scrollAmount, behavior: 'smooth' });
    }, 3000);
  });
}

// Filtro por categoria
function setupCategoryFilters() {
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      loadProducts(button.dataset.category);
    });
  });
}

// Busca de produtos
function setupSearch() {
  searchBtn.addEventListener('click', () => {
    const searchTerm = searchInput.value.trim();
    const activeCategory = document.querySelector('.filter-btn.active').dataset.category;
    loadProducts(activeCategory, searchTerm);
  });
  
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchBtn.click();
    }
  });
}

// Eventos do modal
closeModal.addEventListener('click', closeZoomModal);
modalAddToCart.addEventListener('click', () => {
  if (currentProduct) {
    addToCart(currentProduct.id);
    closeZoomModal();
  }
});

// Fecha o modal ao clicar fora
window.addEventListener('click', (e) => {
  if (e.target === zoomModal) {
    closeZoomModal();
  }
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  loadProductsFromFirebase();
  setupCarousel();
  setupCategoryFilters();
  setupSearch();
});
