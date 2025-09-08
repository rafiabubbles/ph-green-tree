// =====================
// DOM Elements
// =====================
const categoryList = document.getElementById('category-list'); // Left sidebar
const plantList = document.getElementById('plant-list');       // Main content
const loadingSpinner = document.getElementById('loading-spinner');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');

// Pagination container
const paginationContainer = document.createElement('div');
paginationContainer.className = 'flex justify-center mt-6 gap-4';
plantList.parentElement.appendChild(paginationContainer);

// =====================
// State
// =====================
let cart = [];
let activeCategoryBtn = null;
let allPlants = [];
let currentPage = 1;
const itemsPerPage = 6;

// =====================
// 1️⃣ Fetch Categories
// =====================
async function fetchCategories() {
  try {
    const res = await fetch('https://openapi.programming-hero.com/api/categories');
    const data = await res.json();
    const categories = data.data || [];

    // Add "All Plants" as first category
    const allCategory = { id: '', category_name: 'All Plants' };
    displayCategories([allCategory, ...categories]);

  } catch (error) {
    console.error('Category fetch error:', error);
  }
}

// =====================
// Display Categories on Left Sidebar
// =====================
function displayCategories(categories) {
  categoryList.innerHTML = '';

  categories.forEach(cat => {
    const catName = cat.name || cat.category_name || 'No Name';
    const catId = cat.id || cat.category_id || '';

    const btn = document.createElement('button');
    btn.textContent = catName;
    btn.className = 'w-full text-left px-3 py-2 my-1 bg-green-200 rounded hover:bg-green-300 transition';

    btn.addEventListener('click', () => {
      if (activeCategoryBtn) activeCategoryBtn.classList.remove('bg-green-400');
      btn.classList.add('bg-green-400');
      activeCategoryBtn = btn;

      currentPage = 1; // Reset page
      fetchPlantsByCategory(catId);
    });

    categoryList.appendChild(btn);
  });
}

// =====================
// 2️⃣ Fetch Trees/Plants by Category
// =====================
async function fetchPlantsByCategory(categoryId = '') {
  loadingSpinner.classList.remove('hidden');
  plantList.innerHTML = '';
  paginationContainer.innerHTML = '';

  let url = 'https://openapi.programming-hero.com/api/plants';
  if (categoryId) url = `https://openapi.programming-hero.com/api/category/${categoryId}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    allPlants = categoryId ? data.data || [] : data.plants || [];
    displayPlantsPage(currentPage);

  } catch (error) {
    console.error('Plant fetch error:', error);
  } finally {
    loadingSpinner.classList.add('hidden');
  }
}

// =====================
// 3️⃣ Display Plants with Pagination
// =====================
function displayPlantsPage(page) {
  plantList.innerHTML = '';

  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedPlants = allPlants.slice(start, end);

  paginatedPlants.forEach(plant => {
    const image = plant.image || (plant.images && plant.images[0]?.url) || 'https://via.placeholder.com/300x200';
    const name = plant.name || plant.common_name || 'No Name';
    const desc = plant.description || plant.short_desc || 'No description available';
    const category = plant.category || plant.category_name || 'No category';
    const price = plant.price || 10;

    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md p-4 flex flex-col hover:shadow-xl transition cursor-pointer';

    card.innerHTML = `
      <img src="${image}" alt="${name}" class="h-40 w-full object-cover rounded mb-3">
      <h4 class="font-bold text-lg mb-2 hover:text-green-600">${name}</h4>
      <p class="text-sm text-gray-600 mb-3 line-clamp-4">${desc}</p>
      <div class="flex justify-between items-center text-sm mb-3">
        <span class="font-medium text-gray-700">Category: ${category}</span>
        <span class="font-semibold text-green-700">$${price}</span>
      </div>
      <button class="btn btn-sm bg-green-500 text-white hover:bg-green-600">Add to Cart</button>
    `;

    // Add to Cart
    const addBtn = card.querySelector('button');
    addBtn.addEventListener('click', e => {
      e.stopPropagation(); // prevent modal open
      addToCart({ ...plant, price });
    });

    // Whole card clickable for modal
    card.addEventListener('click', () => showPlantModal(plant.id));

    plantList.appendChild(card);
  });

  renderPaginationButtons();
}

// =====================
// 4️⃣ Pagination Buttons
// =====================
function renderPaginationButtons() {
  paginationContainer.innerHTML = '';

  const totalPages = Math.ceil(allPlants.length / itemsPerPage);
  if (totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.textContent = 'Previous';
  prevBtn.className = 'px-4 py-1 bg-green-300 rounded hover:bg-green-400';
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      displayPlantsPage(currentPage);
    }
  });

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.className = 'px-4 py-1 bg-green-300 rounded hover:bg-green-400';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      displayPlantsPage(currentPage);
    }
  });

  paginationContainer.appendChild(prevBtn);
  paginationContainer.appendChild(nextBtn);
}

// =====================
// 5️⃣ Plant Modal
// =====================
async function showPlantModal(plantId) {
  try {
    const res = await fetch(`https://openapi.programming-hero.com/api/plant/${plantId}`);
    const data = await res.json();
    const plant = data.data;

    const modal = document.getElementById('product_modal');
    const modalBody = document.getElementById('modal-body');

    modalBody.innerHTML = `
      <h3 class="font-bold text-2xl mb-2">${plant.name || 'No Name'}</h3>
      <img src="${plant.image || (plant.images && plant.images[0]?.url) || 'https://via.placeholder.com/400x250'}" 
           alt="${plant.name}" class="w-full h-60 object-cover rounded mb-4">
      <p class="text-gray-700 mb-2"><strong>Description:</strong> ${plant.description || 'No description'}</p>
      <p class="text-gray-700 mb-2"><strong>Category:</strong> ${plant.category || plant.category_name || 'N/A'}</p>
      <p class="text-green-700 font-bold text-lg"><strong>Price:</strong> $${plant.price || 10}</p>
    `;

    modal.showModal();

    const closeBtn = modal.querySelector('button');
    closeBtn.addEventListener('click', () => modal.close(), { once: true });

    modal.addEventListener('click', e => {
      if (e.target === modal) modal.close();
    }, { once: true });

  } catch (error) {
    console.error('Plant detail error:', error);
  }
}

// =====================
// 6️⃣ Cart Functions
// =====================
function addToCart(plant) {
  const existingItem = cart.find(item => item.id === plant.id);
  if (existingItem) existingItem.quantity += 1;
  else cart.push({ ...plant, quantity: 1 });

  updateCart();
}

function updateCart() {
  cartItems.innerHTML = '';
  let total = 0;

  cart.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${item.name} x${item.quantity} - $${item.price * item.quantity}
      <span class="cursor-pointer text-red-500 ml-2 remove-item">❌</span>
    `;
    cartItems.appendChild(li);
    total += item.price * item.quantity;

    li.querySelector('.remove-item').addEventListener('click', () => removeFromCart(item.id));
  });

  cartTotal.textContent = total.toFixed(2);
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  updateCart();
}

// =====================
// 7️⃣ Initial Load
// =====================
fetchCategories();
fetchPlantsByCategory();
