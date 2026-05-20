// ===== Inventory Pro - Modern Inventory Management =====

// State Management
let products = JSON.parse(localStorage.getItem('inventoryProducts')) || [];
let categories = JSON.parse(localStorage.getItem('inventoryCategories')) || [];
let transactions = JSON.parse(localStorage.getItem('inventoryTransactions')) || [];
let currentPage = 'dashboard';
let editingProductId = null;
let transactionPage = 1;
const transactionsPerPage = 5;

// DOM Elements
const searchInput = document.getElementById('searchInput');
const productModal = document.getElementById('productModal');
const categoryModal = document.getElementById('categoryModal');
const productForm = document.getElementById('productForm');
const categoryForm = document.getElementById('categoryForm');
const toastContainer = document.getElementById('toastContainer');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initModals();
    initSettings();
    initFilters();
    initPagination();

    if (products.length === 0 && categories.length === 0) {
        loadSampleData();
    }

    if (transactions.length === 0) {
        generateSampleTransactions();
    }

    renderAll();
    renderCharts();
});


// ===== Navigation =====
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            if (page) showPage(page);
        });
    });

    // Mobile menu toggle
    const mobileToggle = document.getElementById('mobileMenuToggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            const menu = document.querySelector('.navbar-menu');
            menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
        });
    }
}

function showPage(pageName) {
    // Map certain nav items to actual page ids
    const pageMap = {
        'dashboard': 'dashboard',
        'products': 'products',
        'transactions': 'dashboard',
        'returns': 'dashboard',
        'pending': 'dashboard',
        'stockopname': 'dashboard',
        'reports': 'reports',
        'analytics': 'reports',
        'tutorial': 'settings',
        'categories': 'categories',
        'settings': 'settings'
    };

    const targetPage = pageMap[pageName] || 'dashboard';

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === pageName);
    });

    // Update pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    const pageEl = document.getElementById(`page-${targetPage}`);
    if (pageEl) pageEl.classList.add('active');

    currentPage = pageName;
}


// ===== Modal Management =====
function initModals() {
    document.getElementById('addProductBtn').addEventListener('click', () => openProductModal());
    document.getElementById('closeModal').addEventListener('click', () => closeProductModal());
    document.getElementById('cancelModal').addEventListener('click', () => closeProductModal());
    productForm.addEventListener('submit', handleProductSubmit);

    document.getElementById('addCategoryBtn').addEventListener('click', () => openCategoryModal());
    document.getElementById('closeCategoryModal').addEventListener('click', () => closeCategoryModal());
    document.getElementById('cancelCategoryModal').addEventListener('click', () => closeCategoryModal());
    categoryForm.addEventListener('submit', handleCategorySubmit);

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
    renderCharts();
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
        renderCharts();
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
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('lowStock').textContent = lowStock;
    document.getElementById('outOfStock').textContent = outOfStock;
    document.getElementById('totalValue').textContent = formatCurrency(totalValue);

    renderTransactions();
    renderBestSellers();
    renderStockAlerts();
}

function renderTransactions() {
    const container = document.getElementById('recentTransactions');
    const totalPages = Math.max(1, Math.ceil(transactions.length / transactionsPerPage));
    const start = (transactionPage - 1) * transactionsPerPage;
    const pageTransactions = transactions.slice(start, start + transactionsPerPage);

    if (pageTransactions.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 30px; color: var(--text-muted);">
                <i class="fas fa-exchange-alt" style="font-size:1.5rem; margin-bottom:8px; display:block;"></i>
                Belum ada transaksi
            </div>`;
    } else {
        container.innerHTML = pageTransactions.map(t => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <span class="transaction-sku">${t.sku} — ${t.name}</span>
                    <span class="transaction-date">${formatDate(t.date)}</span>
                </div>
                <div class="transaction-meta">
                    <span class="transaction-badge ${t.type}">${t.type === 'masuk' ? 'Masuk' : 'Keluar'}</span>
                    <span class="transaction-qty">${t.qty} unit</span>
                </div>
            </div>
        `).join('');
    }

    document.getElementById('transPageInfo').textContent = `${transactionPage} / ${totalPages}`;
}

function renderBestSellers() {
    const container = document.getElementById('bestSellerList');
    // Sort products by stock descending (simulate sales = high initial stock - current stock)
    const sorted = [...products]
        .map(p => ({ ...p, sold: Math.max(0, (p.minStock * 5) - p.stock + Math.floor(Math.random() * 20)) }))
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5);

    if (sorted.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 30px; color: var(--text-muted);">
                <i class="fas fa-trophy" style="font-size:1.5rem; margin-bottom:8px; display:block;"></i>
                Belum ada data produk
            </div>`;
    } else {
        container.innerHTML = sorted.map((p, i) => `
            <div class="bestseller-item">
                <div class="bestseller-info">
                    <span class="bestseller-rank">${i + 1}</span>
                    <span class="bestseller-name">${p.name}</span>
                </div>
                <div class="bestseller-meta">
                    ${i < 3 ? '<span class="bestseller-badge">Best Seller</span>' : ''}
                    <span class="bestseller-sold">${p.sold} terjual</span>
                </div>
            </div>
        `).join('');
    }
}

function renderStockAlerts() {
    const container = document.getElementById('stockAlertList');
    const alertProducts = products.filter(p => p.stock > 0 && p.stock <= p.minStock);

    if (alertProducts.length === 0) {
        container.innerHTML = `
            <div class="alert-empty">
                <i class="fas fa-check-circle"></i>
                <p>Semua produk stok aman</p>
            </div>`;
    } else {
        container.innerHTML = `<div class="alert-list">${alertProducts.map(p => `
            <div class="alert-item">
                <div class="alert-item-info">
                    <span class="alert-item-name">${p.name}</span>
                    <span class="alert-item-sku">${p.sku} — Min: ${p.minStock}</span>
                </div>
                <span class="alert-item-stock">Stok: ${p.stock}</span>
            </div>
        `).join('')}</div>`;
    }
}


function renderProducts() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
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
            </tr>`;
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
            </div>`;
    }).join('');

    if (categories.length === 0) {
        grid.innerHTML = `
            <div style="text-align: center; padding: 60px; color: var(--text-muted); grid-column: 1/-1;">
                <i class="fas fa-tags" style="font-size: 2.5rem; margin-bottom: 12px; display: block;"></i>
                <p>Belum ada kategori. Tambahkan kategori baru!</p>
            </div>`;
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


// ===== Recharts Integration =====
function renderCharts() {
    renderBarChart();
    renderLineChart();
}

function renderBarChart() {
    const container = document.getElementById('barChartContainer');
    if (!container || !window.Recharts) return;

    // Top 5 products by simulated sales
    const topProducts = [...products]
        .map(p => ({
            name: p.name.length > 12 ? p.name.substring(0, 12) + '...' : p.name,
            penjualan: Math.floor(Math.random() * 80) + 20
        }))
        .slice(0, 5);

    if (topProducts.length === 0) {
        container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);">Belum ada data</div>';
        return;
    }

    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = Recharts;

    const ChartComponent = React.createElement(ResponsiveContainer, { width: '100%', height: '100%' },
        React.createElement(BarChart, { data: topProducts, margin: { top: 10, right: 20, left: 0, bottom: 20 } },
            React.createElement(CartesianGrid, { strokeDasharray: '3 3', stroke: '#2d3a52' }),
            React.createElement(XAxis, { dataKey: 'name', stroke: '#64748b', fontSize: 11, angle: -15, textAnchor: 'end' }),
            React.createElement(YAxis, { stroke: '#64748b', fontSize: 11 }),
            React.createElement(Tooltip, {
                contentStyle: { background: '#1e2a42', border: '1px solid #2d3a52', borderRadius: '8px', color: '#f1f5f9' },
                labelStyle: { color: '#94a3b8' }
            }),
            React.createElement(Bar, { dataKey: 'penjualan', fill: '#6366f1', radius: [6, 6, 0, 0] })
        )
    );

    ReactDOM.render(ChartComponent, container);
}

function renderLineChart() {
    const container = document.getElementById('lineChartContainer');
    if (!container || !window.Recharts) return;

    // Generate 7 days of data
    const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const lineData = days.map(day => ({
        name: day,
        masuk: Math.floor(Math.random() * 30) + 5,
        keluar: Math.floor(Math.random() * 25) + 3
    }));

    const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = Recharts;

    const ChartComponent = React.createElement(ResponsiveContainer, { width: '100%', height: '100%' },
        React.createElement(LineChart, { data: lineData, margin: { top: 10, right: 20, left: 0, bottom: 10 } },
            React.createElement(CartesianGrid, { strokeDasharray: '3 3', stroke: '#2d3a52' }),
            React.createElement(XAxis, { dataKey: 'name', stroke: '#64748b', fontSize: 12 }),
            React.createElement(YAxis, { stroke: '#64748b', fontSize: 12 }),
            React.createElement(Tooltip, {
                contentStyle: { background: '#1e2a42', border: '1px solid #2d3a52', borderRadius: '8px', color: '#f1f5f9' },
                labelStyle: { color: '#94a3b8' }
            }),
            React.createElement(Legend, { wrapperStyle: { fontSize: '12px', color: '#94a3b8' } }),
            React.createElement(Line, { type: 'monotone', dataKey: 'masuk', stroke: '#10b981', strokeWidth: 2, dot: { fill: '#10b981', r: 4 }, name: 'Masuk' }),
            React.createElement(Line, { type: 'monotone', dataKey: 'keluar', stroke: '#ef4444', strokeWidth: 2, dot: { fill: '#ef4444', r: 4 }, name: 'Keluar' })
        )
    );

    ReactDOM.render(ChartComponent, container);
}


// ===== Pagination =====
function initPagination() {
    document.getElementById('prevTransBtn').addEventListener('click', () => {
        if (transactionPage > 1) {
            transactionPage--;
            renderTransactions();
        }
    });
    document.getElementById('nextTransBtn').addEventListener('click', () => {
        const totalPages = Math.ceil(transactions.length / transactionsPerPage);
        if (transactionPage < totalPages) {
            transactionPage++;
            renderTransactions();
        }
    });
}

// ===== Filters & Search =====
function initFilters() {
    if (searchInput) searchInput.addEventListener('input', () => renderProducts());
    document.getElementById('filterCategory').addEventListener('change', () => renderProducts());
    document.getElementById('filterStatus').addEventListener('change', () => renderProducts());

    const selectAll = document.getElementById('selectAll');
    if (selectAll) {
        selectAll.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('#productsTableBody input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = this.checked);
        });
    }
}

// ===== Settings =====
function initSettings() {
    document.getElementById('resetDataBtn').addEventListener('click', () => {
        if (confirm('Yakin ingin menghapus semua data? Aksi ini tidak bisa dibatalkan.')) {
            products = [];
            categories = [];
            transactions = [];
            saveData();
            renderAll();
            renderCharts();
            showToast('Semua data berhasil direset!', 'warning');
        }
    });

    document.getElementById('loadSampleBtn').addEventListener('click', () => {
        loadSampleData();
        generateSampleTransactions();
        renderAll();
        renderCharts();
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

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
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
    localStorage.setItem('inventoryTransactions', JSON.stringify(transactions));
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

function generateSampleTransactions() {
    const sampleProducts = products.length > 0 ? products : [
        { name: 'MacBook Pro M3', sku: 'ELK-001' },
        { name: 'iPhone 15 Pro', sku: 'ELK-002' },
        { name: 'Kaos Polos Premium', sku: 'PKN-001' },
        { name: 'Mie Instan Box', sku: 'MKN-001' },
        { name: 'Kursi Ergonomis', sku: 'FRN-002' }
    ];

    transactions = [];
    const now = new Date();

    for (let i = 0; i < 15; i++) {
        const p = sampleProducts[Math.floor(Math.random() * Math.min(sampleProducts.length, 8))];
        const daysAgo = Math.floor(Math.random() * 14);
        const date = new Date(now);
        date.setDate(date.getDate() - daysAgo);

        transactions.push({
            id: generateId(),
            name: p.name,
            sku: p.sku,
            type: Math.random() > 0.4 ? 'masuk' : 'keluar',
            qty: Math.floor(Math.random() * 20) + 1,
            date: date.toISOString()
        });
    }

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    saveData();
}

// Make functions globally accessible
window.showPage = showPage;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.deleteCategory = deleteCategory;
