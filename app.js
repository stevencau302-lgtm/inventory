// ===== Inventory Pro - Modern Inventory Management =====

// State Management
let products = JSON.parse(localStorage.getItem('inventoryProducts')) || [];
let categories = JSON.parse(localStorage.getItem('inventoryCategories')) || [];
let currentPage = 'dashboard';
let editingProductId = null;

// DOM Elements
const sidebar = document.getElementById('sidebar');
const mobileToggle = document.getElementById('mobileToggle');
const searchInput = document.getElementById('searchInput');
const themeToggle = document.getElementById('themeToggle');
const productModal = document.getElementById('productModal');
const categoryModal = document.getElementById('categoryModal');
const productForm = document.getElementById('productForm');
const categoryForm = document.getElementById('categoryForm');
const toastContainer = document.getElementById('toastContainer');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    initModals();
    initSettings();
    initFilters();
    
    if (products.length === 0 && categories.length === 0) {
        loadSampleData();
    }
    
    renderAll();
});

// ===== Theme Management =====
function initTheme() {
    const savedTheme = localStorage.getItem('inventoryTheme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.checked = savedTheme === 'dark';
        darkModeToggle.addEventListener('change', toggleTheme);
    }
    
    themeToggle.addEventListener('click', toggleTheme);
    updateThemeIcon();
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('inventoryTheme', newTheme);
    
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) darkModeToggle.checked = newTheme === 'dark';
    
    updateThemeIcon();
}

function updateThemeIcon() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// ===== Navigation =====
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            showPage(page);
        });
    });
    
    mobileToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Close sidebar on page click (mobile)
    document.querySelector('.main-content').addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('active');
        }
    });
}

function showPage(pageName) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageName);
    });
    
    // Update pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(`page-${pageName}`).classList.add('active');
    
    currentPage = pageName;
    
    // Close mobile sidebar
    sidebar.classList.remove('active');
}

// ===== Modal Management =====
function initModals() {
    // Product Modal
    document.getElementById('addProductBtn').addEventListener('click', () => openProductModal());
    document.getElementById('closeModal').addEventListener('click', () => closeProductModal());
    document.getElementById('cancelModal').addEventListener('click', () => closeProductModal());
    productForm.addEventListener('submit', handleProductSubmit);
    
    // Category Modal
    document.getElementById('addCategoryBtn').addEventListener('click', () => openCategoryModal());
    document.getElementById('closeCategoryModal').addEventListener('click', () => closeCategoryModal());
    document.getElementById('cancelCategoryModal').addEventListener('click', () => closeCategoryModal());
    categoryForm.addEventListener('submit', handleCategorySubmit);
    
    // Close on overlay click
    productModal.addEventListener('click', (e) => {
        if (e.target === productModal) closeProductModal();
    });
    categoryModal.addEventListener('click', (e) => {
        if (e.target === categoryModal) closeCategoryModal();
    });
}

function openProductModal(product = null) {
    editingProductId = product ? product.id : null;
    document.getElementById('modalTitle').textContent = product ? 'Edit Produk' : 'Tambah Produk';
    
    // Populate categories dropdown
    const select = document.getElementById('productCategory');
    select.innerHTML = '<option value="">Pilih Kategori</option>';
    categories.forEach(cat => {
        select.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
    });
    
    if (product) {
        document.getElementById('productName').value = product.name;
        document.getElementById('productSku').value = product.sku;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productMinStock').value = product.minStock;
        document.getElementById('productDescription').value = product.description || '';
    } else {
        productForm.reset();
        document.getElementById('productMinStock').value = 10;
    }
    
    productModal.classList.add('active');
}

function closeProductModal() {
    productModal.classList.remove('active');
    editingProductId = null;
    productForm.reset();
}

function openCategoryModal() {
    categoryModal.classList.add('active');
}

function closeCategoryModal() {
    categoryModal.classList.remove('active');
    categoryForm.reset();
}

// ===== CRUD Operations =====
function handleProductSubmit(e) {
    e.preventDefault();
    
    const productData = {
        id: editingProductId || generateId(),
        name: document.getElementById('productName').value,
        sku: document.getElementById('productSku').value,
        category: document.getElementById('productCategory').value,
        stock: parseInt(document.getElementById('productStock').value),
        price: parseInt(document.getElementById('productPrice').value),
        minStock: parseInt(document.getElementById('productMinStock').value),
        description: document.getElementById('productDescription').value,
        createdAt: editingProductId 
            ? products.find(p => p.id === editingProductId)?.createdAt || new Date().toISOString()
            : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    if (editingProductId) {
        const index = products.findIndex(p => p.id === editingProductId);
        if (index !== -1) {
            products[index] = productData;
            showToast('Produk berhasil diperbarui!', 'success');
        }
    } else {
        products.unshift(productData);
        showToast('Produk berhasil ditambahkan!', 'success');
    }
    
    saveData();
    renderAll();
    closeProductModal();
}

function handleCategorySubmit(e) {
    e.preventDefault();
    
    const categoryData = {
        id: generateId(),
        name: document.getElementById('categoryName').value,
        icon: document.getElementById('categoryIcon').value,
        color: document.getElementById('categoryColor').value,
        createdAt: new Date().toISOString()
    };
    
    categories.push(categoryData);
    saveData();
    renderAll();
    closeCategoryModal();
    showToast('Kategori berhasil ditambahkan!', 'success');
}

function deleteProduct(id) {
    if (confirm('Yakin ingin menghapus produk ini?')) {
        products = products.filter(p => p.id !== id);
        saveData();
        renderAll();
        showToast('Produk berhasil dihapus!', 'success');
    }
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (product) openProductModal(product);
}

function deleteCategory(id) {
    if (confirm('Yakin ingin menghapus kategori ini?')) {
        categories = categories.filter(c => c.id !== id);
        saveData();
        renderAll();
        showToast('Kategori berhasil dihapus!', 'success');
    }
}


// ===== Rendering =====
function renderAll() {
    renderDashboard();
    renderProducts();
    renderCategories();
    renderReports();
    updateCategoryFilters();
}

function renderDashboard() {
    const totalProducts = products.length;
    const inStock = products.filter(p => p.stock > p.minStock).length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    
    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('inStock').textContent = inStock;
    document.getElementById('lowStock').textContent = lowStock;
    document.getElementById('totalValue').textContent = formatCurrency(totalValue);
    
    // Recent products (top 5)
    const recent = products.slice(0, 5);
    const tbody = document.getElementById('recentProducts');
    tbody.innerHTML = recent.map(p => `
        <tr>
            <td>
                <div class="product-cell">
                    <div class="product-thumb">${p.name.substring(0, 2).toUpperCase()}</div>
                    <span class="product-name">${p.name}</span>
                </div>
            </td>
            <td>${p.category}</td>
            <td>${p.stock}</td>
            <td>${formatCurrency(p.price)}</td>
            <td><span class="status-badge ${getStatus(p)}">${getStatusLabel(p)}</span></td>
        </tr>
    `).join('');
}

function renderProducts() {
    const searchTerm = searchInput.value.toLowerCase();
    const filterCat = document.getElementById('filterCategory').value;
    const filterStatus = document.getElementById('filterStatus').value;
    
    let filtered = products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchTerm) || 
                           p.sku.toLowerCase().includes(searchTerm);
        const matchCategory = !filterCat || p.category === filterCat;
        const matchStatus = !filterStatus || getStatus(p) === filterStatus;
        return matchSearch && matchCategory && matchStatus;
    });
    
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = filtered.map(p => `
        <tr>
            <td><input type="checkbox" data-id="${p.id}"></td>
            <td>
                <div class="product-cell">
                    <div class="product-thumb">${p.name.substring(0, 2).toUpperCase()}</div>
                    <span class="product-name">${p.name}</span>
                </div>
            </td>
            <td><code>${p.sku}</code></td>
            <td>${p.category}</td>
            <td>${p.stock}</td>
            <td>${formatCurrency(p.price)}</td>
            <td><span class="status-badge ${getStatus(p)}">${getStatusLabel(p)}</span></td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit" onclick="editProduct('${p.id}')" title="Edit">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteProduct('${p.id}')" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fas fa-box-open" style="font-size: 2rem; margin-bottom: 12px; display: block;"></i>
                    Tidak ada produk ditemukan
                </td>
            </tr>
        `;
    }
}

function renderCategories() {
    const grid = document.getElementById('categoriesGrid');
    grid.innerHTML = categories.map(cat => {
        const count = products.filter(p => p.category === cat.name).length;
        return `
            <div class="category-card">
                <div class="category-icon" style="background: ${cat.color}20; color: ${cat.color};">
                    <i class="${cat.icon}"></i>
                </div>
                <h3>${cat.name}</h3>
                <p>${count} produk</p>
                <button class="btn btn-danger btn-sm" style="margin-top:12px;" onclick="deleteCategory('${cat.id}')">
                    <i class="fas fa-trash"></i> Hapus
                </button>
            </div>
        `;
    }).join('');
    
    if (categories.length === 0) {
        grid.innerHTML = `
            <div style="text-align: center; padding: 60px; color: var(--text-muted); grid-column: 1/-1;">
                <i class="fas fa-tags" style="font-size: 2.5rem; margin-bottom: 12px; display: block;"></i>
                <p>Belum ada kategori. Tambahkan kategori baru!</p>
            </div>
        `;
    }
}

function renderReports() {
    const totalItems = products.reduce((sum, p) => sum + p.stock, 0);
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const avgValue = products.length > 0 ? totalValue / products.length : 0;
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
    const outStock = products.filter(p => p.stock === 0).length;
    
    document.getElementById('reportTotalItems').textContent = totalItems.toLocaleString();
    document.getElementById('reportCategories').textContent = categories.length;
    document.getElementById('reportTotalValue').textContent = formatCurrency(totalValue);
    document.getElementById('reportAvgValue').textContent = formatCurrency(avgValue);
    document.getElementById('reportLowStock').textContent = lowStock;
    document.getElementById('reportOutStock').textContent = outStock;
}

function updateCategoryFilters() {
    const select = document.getElementById('filterCategory');
    const currentVal = select.value;
    select.innerHTML = '<option value="">Semua Kategori</option>';
    categories.forEach(cat => {
        select.innerHTML += `<option value="${cat.name}" ${cat.name === currentVal ? 'selected' : ''}>${cat.name}</option>`;
    });
}

// ===== Filters & Search =====
function initFilters() {
    searchInput.addEventListener('input', () => renderProducts());
    document.getElementById('filterCategory').addEventListener('change', () => renderProducts());
    document.getElementById('filterStatus').addEventListener('change', () => renderProducts());
    
    // Select all checkbox
    document.getElementById('selectAll').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('#productsTableBody input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = this.checked);
    });
}

// ===== Settings =====
function initSettings() {
    document.getElementById('resetDataBtn').addEventListener('click', () => {
        if (confirm('Yakin ingin menghapus semua data? Aksi ini tidak bisa dibatalkan.')) {
            products = [];
            categories = [];
            saveData();
            renderAll();
            showToast('Semua data berhasil direset!', 'warning');
        }
    });
    
    document.getElementById('loadSampleBtn').addEventListener('click', () => {
        loadSampleData();
        renderAll();
        showToast('Data contoh berhasil dimuat!', 'success');
    });
}

// ===== Utility Functions =====
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function getStatus(product) {
    if (product.stock === 0) return 'out-of-stock';
    if (product.stock <= product.minStock) return 'low-stock';
    return 'in-stock';
}

function getStatusLabel(product) {
    const status = getStatus(product);
    switch (status) {
        case 'in-stock': return 'Tersedia';
        case 'low-stock': return 'Stok Rendah';
        case 'out-of-stock': return 'Habis';
        default: return '';
    }
}

function saveData() {
    localStorage.setItem('inventoryProducts', JSON.stringify(products));
    localStorage.setItem('inventoryCategories', JSON.stringify(categories));
}

function showToast(message, type = 'success') {
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-times-circle',
        warning: 'fas fa-exclamation-circle'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.4s ease forwards';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ===== Sample Data =====
function loadSampleData() {
    categories = [
        { id: generateId(), name: 'Elektronik', icon: 'fas fa-laptop', color: '#6366f1', createdAt: new Date().toISOString() },
        { id: generateId(), name: 'Pakaian', icon: 'fas fa-shirt', color: '#ec4899', createdAt: new Date().toISOString() },
        { id: generateId(), name: 'Makanan', icon: 'fas fa-utensils', color: '#f59e0b', createdAt: new Date().toISOString() },
        { id: generateId(), name: 'Furnitur', icon: 'fas fa-couch', color: '#10b981', createdAt: new Date().toISOString() },
        { id: generateId(), name: 'Olahraga', icon: 'fas fa-football', color: '#ef4444', createdAt: new Date().toISOString() },
        { id: generateId(), name: 'Kesehatan', icon: 'fas fa-heart-pulse', color: '#0ea5e9', createdAt: new Date().toISOString() }
    ];
    
    products = [
        { id: generateId(), name: 'MacBook Pro M3', sku: 'ELK-001', category: 'Elektronik', stock: 25, price: 35000000, minStock: 5, description: 'Laptop Apple terbaru', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: generateId(), name: 'iPhone 15 Pro', sku: 'ELK-002', category: 'Elektronik', stock: 50, price: 22000000, minStock: 10, description: 'Smartphone premium Apple', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: generateId(), name: 'Samsung Galaxy S24', sku: 'ELK-003', category: 'Elektronik', stock: 3, price: 18000000, minStock: 10, description: 'Smartphone flagship Samsung', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: generateId(), name: 'Kaos Polos Premium', sku: 'PKN-001', category: 'Pakaian', stock: 200, price: 85000, minStock: 50, description: 'Kaos cotton combed 30s', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: generateId(), name: 'Jaket Bomber', sku: 'PKN-002', category: 'Pakaian', stock: 45, price: 350000, minStock: 15, description: 'Jaket bomber waterproof', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: generateId(), name: 'Celana Jeans Slim', sku: 'PKN-003', category: 'Pakaian', stock: 8, price: 280000, minStock: 20, description: 'Celana jeans stretch', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: generateId(), name: 'Mie Instan Box', sku: 'MKN-001', category: 'Makanan', stock: 500, price: 3500, minStock: 100, description: 'Mie instan per box', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: generateId(), name: 'Kopi Arabica 1kg', sku: 'MKN-002', category: 'Makanan', stock: 0, price: 150000, minStock: 20, description: 'Biji kopi arabica premium', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: generateId(), name: 'Meja Kerja Minimalis', sku: 'FRN-001', category: 'Furnitur', stock: 12, price: 1500000, minStock: 5, description: 'Meja kerja kayu jati', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: generateId(), name: 'Kursi Ergonomis', sku: 'FRN-002', category: 'Furnitur', stock: 7, price: 2500000, minStock: 3, description: 'Kursi kantor ergonomis', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: generateId(), name: 'Dumbbell Set 20kg', sku: 'OLR-001', category: 'Olahraga', stock: 30, price: 750000, minStock: 10, description: 'Set dumbbell adjustable', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: generateId(), name: 'Yoga Mat Premium', sku: 'OLR-002', category: 'Olahraga', stock: 2, price: 350000, minStock: 15, description: 'Matras yoga anti slip', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: generateId(), name: 'Vitamin C 1000mg', sku: 'KSH-001', category: 'Kesehatan', stock: 150, price: 95000, minStock: 30, description: 'Suplemen vitamin C', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: generateId(), name: 'Masker Medis Box', sku: 'KSH-002', category: 'Kesehatan', stock: 0, price: 45000, minStock: 50, description: 'Masker medis 3 ply', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ];
    
    saveData();
}

// Make showPage globally accessible
window.showPage = showPage;
