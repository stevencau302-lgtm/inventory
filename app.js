// ===== InventoryPro - Modern Inventory App =====

// --- State ---
let products = JSON.parse(localStorage.getItem('inv_products')) || [];
let categories = JSON.parse(localStorage.getItem('inv_categories')) || [];
let currentPage = 'dashboard';
let editingId = null;

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    if (!products.length && !categories.length) loadSampleData();
    initNav();
    initModals();
    initMobile();
    initTheme();
    initSearch();
    render();
});

// --- Navigation ---
function initNav() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            showPage(link.dataset.page);
        });
    });
}

function showPage(page) {
    currentPage = page;
    document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.page === page));
    render();
    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
}

// --- Mobile ---
function initMobile() {
    document.getElementById('mobileMenuBtn').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });
}

// --- Theme ---
function initTheme() {
    const saved = localStorage.getItem('inv_theme') || 'dark';
    document.documentElement.classList.toggle('dark', saved === 'dark');
    document.getElementById('themeBtn').addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('inv_theme', isDark ? 'dark' : 'light');
        document.getElementById('themeBtn').innerHTML = isDark 
            ? '<i class="fas fa-sun text-sm"></i>' 
            : '<i class="fas fa-moon text-sm"></i>';
    });
}

// --- Search ---
function initSearch() {
    document.getElementById('searchInput').addEventListener('input', () => {
        if (currentPage === 'products') render();
    });
}

// --- Modals ---
function initModals() {
    const pm = document.getElementById('productModal');
    const cm = document.getElementById('categoryModal');
    
    document.getElementById('closeModalBtn').addEventListener('click', () => closeModal(pm));
    document.getElementById('cancelModalBtn').addEventListener('click', () => closeModal(pm));
    pm.addEventListener('click', e => { if (e.target === pm) closeModal(pm); });
    
    document.getElementById('closeCatModalBtn').addEventListener('click', () => closeModal(cm));
    document.getElementById('cancelCatBtn').addEventListener('click', () => closeModal(cm));
    cm.addEventListener('click', e => { if (e.target === cm) closeModal(cm); });
    
    document.getElementById('productForm').addEventListener('submit', handleProductSave);
    document.getElementById('categoryForm').addEventListener('submit', handleCategorySave);
}

function openModal(el) {
    el.classList.remove('hidden');
    requestAnimationFrame(() => el.classList.add('active'));
}

function closeModal(el) {
    el.classList.remove('active');
    setTimeout(() => el.classList.add('hidden'), 300);
    editingId = null;
}

function openProductModal(product = null) {
    editingId = product?.id || null;
    document.getElementById('modalTitle').textContent = product ? 'Edit Produk' : 'Tambah Produk';
    const sel = document.getElementById('productCategory');
    sel.innerHTML = '<option value="">Pilih Kategori</option>' + categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    
    if (product) {
        document.getElementById('productName').value = product.name;
        document.getElementById('productSku').value = product.sku;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productMinStock').value = product.minStock;
        document.getElementById('productDescription').value = product.description || '';
    } else {
        document.getElementById('productForm').reset();
        document.getElementById('productMinStock').value = 10;
    }
    openModal(document.getElementById('productModal'));
}

function openCategoryModal() {
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryIcon').value = 'fas fa-tag';
    document.getElementById('categoryColor').value = '#6366f1';
    openModal(document.getElementById('categoryModal'));
}

// --- CRUD ---
function handleProductSave(e) {
    e.preventDefault();
    const data = {
        id: editingId || uid(),
        name: document.getElementById('productName').value,
        sku: document.getElementById('productSku').value,
        category: document.getElementById('productCategory').value,
        stock: +document.getElementById('productStock').value,
        price: +document.getElementById('productPrice').value,
        minStock: +document.getElementById('productMinStock').value,
        description: document.getElementById('productDescription').value,
        createdAt: editingId ? (products.find(p => p.id === editingId)?.createdAt || now()) : now(),
        updatedAt: now()
    };
    if (editingId) {
        const i = products.findIndex(p => p.id === editingId);
        if (i > -1) products[i] = data;
        toast('Produk berhasil diperbarui!', 'success');
    } else {
        products.unshift(data);
        toast('Produk berhasil ditambahkan!', 'success');
    }
    save(); render();
    closeModal(document.getElementById('productModal'));
}

function handleCategorySave(e) {
    e.preventDefault();
    categories.push({
        id: uid(),
        name: document.getElementById('categoryName').value,
        icon: document.getElementById('categoryIcon').value,
        color: document.getElementById('categoryColor').value,
        createdAt: now()
    });
    save(); render();
    closeModal(document.getElementById('categoryModal'));
    toast('Kategori berhasil ditambahkan!', 'success');
}

function deleteProduct(id) {
    if (!confirm('Hapus produk ini?')) return;
    products = products.filter(p => p.id !== id);
    save(); render();
    toast('Produk dihapus!', 'success');
}

function editProduct(id) {
    openProductModal(products.find(p => p.id === id));
}

function deleteCategory(id) {
    if (!confirm('Hapus kategori ini?')) return;
    categories = categories.filter(c => c.id !== id);
    save(); render();
    toast('Kategori dihapus!', 'success');
}

// --- Render ---
function render() {
    const content = document.getElementById('content');
    switch(currentPage) {
        case 'dashboard': content.innerHTML = renderDashboard(); break;
        case 'products': content.innerHTML = renderProducts(); break;
        case 'categories': content.innerHTML = renderCategories(); break;
        case 'reports': content.innerHTML = renderReports(); break;
        case 'settings': content.innerHTML = renderSettings(); break;
    }
    bindPageEvents();
}

function renderDashboard() {
    const total = products.length;
    const inStock = products.filter(p => p.stock > p.minStock).length;
    const low = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
    const value = products.reduce((s, p) => s + p.price * p.stock, 0);
    const recent = products.slice(0, 5);

    return `
    <div class="space-y-6">
        <div>
            <h2 class="text-2xl font-bold">Dashboard</h2>
            <p class="text-slate-500 text-sm mt-1">Overview inventory kamu hari ini</p>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            ${statCard('fa-box', 'Total Produk', total, 'from-brand-500/20 to-brand-600/5', 'text-brand-400')}
            ${statCard('fa-check-circle', 'Stok Tersedia', inStock, 'from-emerald-500/20 to-emerald-600/5', 'text-emerald-400')}
            ${statCard('fa-triangle-exclamation', 'Stok Rendah', low, 'from-amber-500/20 to-amber-600/5', 'text-amber-400')}
            ${statCard('fa-wallet', 'Total Nilai', formatRp(value), 'from-purple-500/20 to-purple-600/5', 'text-purple-400')}
        </div>

        <div class="glass-card overflow-hidden">
            <div class="flex items-center justify-between p-5 border-b border-white/5">
                <h3 class="font-semibold">Produk Terbaru</h3>
                <button onclick="showPage('products')" class="text-xs text-brand-400 hover:text-brand-300 font-medium transition">
                    Lihat Semua <i class="fas fa-arrow-right ml-1"></i>
                </button>
            </div>
            <div class="overflow-x-auto">
                <table class="data-table">
                    <thead><tr><th>Produk</th><th>Kategori</th><th>Stok</th><th>Harga</th><th>Status</th></tr></thead>
                    <tbody>
                        ${recent.map(p => `
                            <tr>
                                <td><div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold">${p.name.substring(0,2).toUpperCase()}</div>
                                    <span class="font-medium text-white">${p.name}</span>
                                </div></td>
                                <td>${p.category}</td>
                                <td>${p.stock}</td>
                                <td>${formatRp(p.price)}</td>
                                <td>${statusBadge(p)}</td>
                            </tr>
                        `).join('')}
                        ${recent.length === 0 ? '<tr><td colspan="5" class="text-center py-8 text-slate-500">Belum ada produk</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;
}

function renderProducts() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    let filtered = products.filter(p => 
        p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search)
    );

    return `
    <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h2 class="text-2xl font-bold">Produk</h2>
                <p class="text-slate-500 text-sm mt-1">${filtered.length} produk ditemukan</p>
            </div>
            <button onclick="openProductModal()" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-sm font-medium text-white hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 transition">
                <i class="fas fa-plus"></i> Tambah Produk
            </button>
        </div>

        <div class="glass-card overflow-hidden">
            <div class="overflow-x-auto">
                <table class="data-table">
                    <thead><tr><th>Produk</th><th>SKU</th><th>Kategori</th><th>Stok</th><th>Harga</th><th>Status</th><th class="text-right">Aksi</th></tr></thead>
                    <tbody>
                        ${filtered.map(p => `
                            <tr>
                                <td><div class="flex items-center gap-3">
                                    <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold">${p.name.substring(0,2).toUpperCase()}</div>
                                    <div><p class="font-medium text-white">${p.name}</p><p class="text-xs text-slate-500">${p.description?.substring(0,30) || ''}</p></div>
                                </div></td>
                                <td><code class="text-xs bg-surface-800 px-2 py-0.5 rounded text-slate-400">${p.sku}</code></td>
                                <td>${p.category}</td>
                                <td class="font-medium">${p.stock}</td>
                                <td>${formatRp(p.price)}</td>
                                <td>${statusBadge(p)}</td>
                                <td class="text-right">
                                    <div class="flex justify-end gap-1">
                                        <button onclick="editProduct('${p.id}')" class="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500 hover:text-white flex items-center justify-center transition text-xs"><i class="fas fa-pen"></i></button>
                                        <button onclick="deleteProduct('${p.id}')" class="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition text-xs"><i class="fas fa-trash"></i></button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                        ${filtered.length === 0 ? '<tr><td colspan="7" class="text-center py-12 text-slate-500"><i class="fas fa-box-open text-3xl mb-3 block"></i>Tidak ada produk ditemukan</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;
}

function renderCategories() {
    return `
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold">Kategori</h2>
                <p class="text-slate-500 text-sm mt-1">${categories.length} kategori</p>
            </div>
            <button onclick="openCategoryModal()" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-sm font-medium text-white shadow-lg shadow-brand-500/25 transition">
                <i class="fas fa-plus"></i> Tambah Kategori
            </button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            ${categories.map(c => {
                const count = products.filter(p => p.category === c.name).length;
                return `
                <div class="glass-card p-6 text-center group">
                    <div class="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-xl" style="background:${c.color}20;color:${c.color}">
                        <i class="${c.icon}"></i>
                    </div>
                    <h3 class="font-semibold text-white">${c.name}</h3>
                    <p class="text-sm text-slate-500 mt-1">${count} produk</p>
                    <button onclick="deleteCategory('${c.id}')" class="mt-4 text-xs text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition">
                        <i class="fas fa-trash mr-1"></i>Hapus
                    </button>
                </div>`;
            }).join('')}
            ${categories.length === 0 ? '<div class="col-span-full text-center py-16 text-slate-500"><i class="fas fa-tags text-4xl mb-4 block"></i><p>Belum ada kategori</p></div>' : ''}
        </div>
    </div>`;
}

function renderReports() {
    const totalItems = products.reduce((s, p) => s + p.stock, 0);
    const totalValue = products.reduce((s, p) => s + p.price * p.stock, 0);
    const avg = products.length ? totalValue / products.length : 0;
    const low = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
    const out = products.filter(p => p.stock === 0).length;

    return `
    <div class="space-y-6">
        <h2 class="text-2xl font-bold">Laporan</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="glass-card p-6">
                <div class="w-11 h-11 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center text-lg mb-4"><i class="fas fa-chart-line"></i></div>
                <h3 class="font-semibold text-white mb-1">Laporan Stok</h3>
                <p class="text-xs text-slate-500 mb-4">Overview stok per kategori</p>
                <div class="flex gap-6 text-sm">
                    <div><p class="text-slate-500 text-xs">Total Items</p><p class="font-bold text-white text-lg">${totalItems.toLocaleString()}</p></div>
                    <div><p class="text-slate-500 text-xs">Kategori</p><p class="font-bold text-white text-lg">${categories.length}</p></div>
                </div>
            </div>
            <div class="glass-card p-6">
                <div class="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-lg mb-4"><i class="fas fa-money-bill-trend-up"></i></div>
                <h3 class="font-semibold text-white mb-1">Laporan Nilai</h3>
                <p class="text-xs text-slate-500 mb-4">Total nilai inventory</p>
                <div class="flex gap-6 text-sm">
                    <div><p class="text-slate-500 text-xs">Total Nilai</p><p class="font-bold text-white text-lg">${formatRp(totalValue)}</p></div>
                    <div><p class="text-slate-500 text-xs">Rata-rata</p><p class="font-bold text-white text-lg">${formatRp(avg)}</p></div>
                </div>
            </div>
            <div class="glass-card p-6">
                <div class="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-lg mb-4"><i class="fas fa-triangle-exclamation"></i></div>
                <h3 class="font-semibold text-white mb-1">Alert Stok</h3>
                <p class="text-xs text-slate-500 mb-4">Produk perlu restock</p>
                <div class="flex gap-6 text-sm">
                    <div><p class="text-slate-500 text-xs">Stok Rendah</p><p class="font-bold text-amber-400 text-lg">${low}</p></div>
                    <div><p class="text-slate-500 text-xs">Habis</p><p class="font-bold text-red-400 text-lg">${out}</p></div>
                </div>
            </div>
        </div>
    </div>`;
}

function renderSettings() {
    const isDark = document.documentElement.classList.contains('dark');
    return `
    <div class="space-y-6 max-w-lg">
        <h2 class="text-2xl font-bold">Pengaturan</h2>
        <div class="glass-card divide-y divide-white/5">
            <div class="p-5 flex items-center justify-between">
                <div><p class="font-medium text-white">Mode Gelap</p><p class="text-xs text-slate-500">Aktifkan tema gelap</p></div>
                <button id="settingsThemeBtn" class="w-12 h-7 rounded-full ${isDark ? 'bg-brand-500' : 'bg-slate-700'} relative transition-colors">
                    <span class="absolute top-1 ${isDark ? 'right-1' : 'left-1'} w-5 h-5 bg-white rounded-full shadow transition-all"></span>
                </button>
            </div>
            <div class="p-5 flex items-center justify-between">
                <div><p class="font-medium text-white">Reset Data</p><p class="text-xs text-slate-500">Hapus semua data</p></div>
                <button id="resetBtn" class="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 text-xs font-medium hover:bg-red-500 hover:text-white transition">Reset</button>
            </div>
            <div class="p-5 flex items-center justify-between">
                <div><p class="font-medium text-white">Load Sample</p><p class="text-xs text-slate-500">Isi data contoh</p></div>
                <button id="sampleBtn" class="px-3 py-1.5 rounded-lg bg-brand-500/15 text-brand-400 text-xs font-medium hover:bg-brand-500 hover:text-white transition">Load</button>
            </div>
        </div>
    </div>`;
}

function bindPageEvents() {
    if (currentPage === 'settings') {
        document.getElementById('settingsThemeBtn')?.addEventListener('click', () => {
            document.getElementById('themeBtn').click();
            render();
        });
        document.getElementById('resetBtn')?.addEventListener('click', () => {
            if (!confirm('Reset semua data?')) return;
            products = []; categories = [];
            save(); render();
            toast('Data berhasil direset!', 'warning');
        });
        document.getElementById('sampleBtn')?.addEventListener('click', () => {
            loadSampleData(); render();
            toast('Sample data dimuat!', 'success');
        });
    }
}

// --- Helpers ---
function statCard(icon, label, value, gradient, textColor) {
    return `
    <div class="stat-card">
        <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center">
                <i class="fas ${icon} ${textColor} text-lg"></i>
            </div>
            <div>
                <p class="text-2xl font-bold text-white">${value}</p>
                <p class="text-xs text-slate-500 mt-0.5">${label}</p>
            </div>
        </div>
    </div>`;
}

function statusBadge(p) {
    if (p.stock === 0) return '<span class="badge badge-danger">Habis</span>';
    if (p.stock <= p.minStock) return '<span class="badge badge-warning">Stok Rendah</span>';
    return '<span class="badge badge-success">Tersedia</span>';
}

function formatRp(n) {
    return new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', minimumFractionDigits:0, maximumFractionDigits:0 }).format(n);
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }
function now() { return new Date().toISOString(); }
function save() { localStorage.setItem('inv_products', JSON.stringify(products)); localStorage.setItem('inv_categories', JSON.stringify(categories)); }

function toast(msg, type='success') {
    const icons = { success:'fa-check-circle text-emerald-400', error:'fa-xmark-circle text-red-400', warning:'fa-exclamation-circle text-amber-400' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<i class="fas ${icons[type]}"></i><span class="text-sm text-white font-medium">${msg}</span>`;
    document.getElementById('toastContainer').appendChild(t);
    setTimeout(() => { t.style.animation = 'slideOutRight 0.4s forwards'; setTimeout(() => t.remove(), 400); }, 3000);
}

// --- Sample Data ---
function loadSampleData() {
    categories = [
        { id: uid(), name: 'Elektronik', icon: 'fas fa-laptop', color: '#6366f1', createdAt: now() },
        { id: uid(), name: 'Pakaian', icon: 'fas fa-shirt', color: '#ec4899', createdAt: now() },
        { id: uid(), name: 'Makanan', icon: 'fas fa-utensils', color: '#f59e0b', createdAt: now() },
        { id: uid(), name: 'Furnitur', icon: 'fas fa-couch', color: '#10b981', createdAt: now() },
        { id: uid(), name: 'Olahraga', icon: 'fas fa-dumbbell', color: '#ef4444', createdAt: now() },
        { id: uid(), name: 'Kesehatan', icon: 'fas fa-heart-pulse', color: '#0ea5e9', createdAt: now() }
    ];
    products = [
        { id: uid(), name:'MacBook Pro M3', sku:'ELK-001', category:'Elektronik', stock:25, price:35000000, minStock:5, description:'Laptop Apple terbaru dengan chip M3', createdAt:now(), updatedAt:now() },
        { id: uid(), name:'iPhone 15 Pro Max', sku:'ELK-002', category:'Elektronik', stock:50, price:22000000, minStock:10, description:'Smartphone flagship Apple', createdAt:now(), updatedAt:now() },
        { id: uid(), name:'Samsung Galaxy S24 Ultra', sku:'ELK-003', category:'Elektronik', stock:3, price:18000000, minStock:10, description:'Smartphone premium Samsung', createdAt:now(), updatedAt:now() },
        { id: uid(), name:'Sony WH-1000XM5', sku:'ELK-004', category:'Elektronik', stock:40, price:4500000, minStock:8, description:'Headphone noise cancelling premium', createdAt:now(), updatedAt:now() },
        { id: uid(), name:'Kaos Polos Premium', sku:'PKN-001', category:'Pakaian', stock:200, price:85000, minStock:50, description:'Kaos cotton combed 30s', createdAt:now(), updatedAt:now() },
        { id: uid(), name:'Jaket Bomber', sku:'PKN-002', category:'Pakaian', stock:45, price:350000, minStock:15, description:'Jaket bomber waterproof', createdAt:now(), updatedAt:now() },
        { id: uid(), name:'Celana Jeans Slim', sku:'PKN-003', category:'Pakaian', stock:8, price:280000, minStock:20, description:'Celana jeans stretch premium', createdAt:now(), updatedAt:now() },
        { id: uid(), name:'Kopi Arabica 1kg', sku:'MKN-001', category:'Makanan', stock:0, price:150000, minStock:20, description:'Biji kopi arabica Toraja', createdAt:now(), updatedAt:now() },
        { id: uid(), name:'Mie Instan Box', sku:'MKN-002', category:'Makanan', stock:500, price:3500, minStock:100, description:'Mie instan per box isi 40', createdAt:now(), updatedAt:now() },
        { id: uid(), name:'Meja Kerja Minimalis', sku:'FRN-001', category:'Furnitur', stock:12, price:1500000, minStock:5, description:'Meja kerja kayu jati 120cm', createdAt:now(), updatedAt:now() },
        { id: uid(), name:'Kursi Ergonomis', sku:'FRN-002', category:'Furnitur', stock:7, price:2500000, minStock:3, description:'Kursi kantor mesh ergonomis', createdAt:now(), updatedAt:now() },
        { id: uid(), name:'Dumbbell Set 20kg', sku:'OLR-001', category:'Olahraga', stock:30, price:750000, minStock:10, description:'Set dumbbell adjustable', createdAt:now(), updatedAt:now() },
        { id: uid(), name:'Yoga Mat Premium', sku:'OLR-002', category:'Olahraga', stock:2, price:350000, minStock:15, description:'Matras yoga 6mm anti slip', createdAt:now(), updatedAt:now() },
        { id: uid(), name:'Vitamin C 1000mg', sku:'KSH-001', category:'Kesehatan', stock:150, price:95000, minStock:30, description:'Suplemen vitamin C isi 60', createdAt:now(), updatedAt:now() },
        { id: uid(), name:'Masker Medis Box', sku:'KSH-002', category:'Kesehatan', stock:0, price:45000, minStock:50, description:'Masker medis 3 ply isi 50', createdAt:now(), updatedAt:now() }
    ];
    save();
}

// Expose to global
window.showPage = showPage;
window.openProductModal = openProductModal;
window.openCategoryModal = openCategoryModal;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.deleteCategory = deleteCategory;
