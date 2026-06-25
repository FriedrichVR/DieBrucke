const supabaseUrl = 'https://uelocqsryuvhcwmjjbho.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlbG9jcXNyeXV2aGN3bWpqYmhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzQ5MjMsImV4cCI6MjA5NzkxMDkyM30.uinZ-RlDIuQ7ZQlknhCmLef7Rzcb1DCWuxvwywkEFuw';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

let visitsChartInstance = null;
let sourcesChartInstance = null;
let pagesChartInstance = null;
let salesChartInstance = null;
let productsChartInstance = null;
let devicesChartInstance = null;
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    checkAuth();
    initNavigation();
    initLoginForm();
    initLogoutBtn();
});

async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        verifyAdmin(session.user);
    } else {
        showView('login');
        localStorage.removeItem('adminMode');
    }
}

async function verifyAdmin(user) {
    // Check if user is admin
    const { data, error } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    
    if (error || !data || data.role !== 'admin') {
        alert('Acceso denegado. No tienes permisos de administrador.');
        await supabaseClient.auth.signOut();
        showView('login');
        localStorage.removeItem('adminMode');
        return;
    }

    // Is Admin
    localStorage.setItem('adminMode', 'true');
    document.getElementById('sidebar').style.display = 'flex';
    document.getElementById('login-view').classList.remove('active');
    
    // Load dashboard by default
    showView('dashboard');
    loadDashboardData();
}

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-target]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            const target = item.getAttribute('data-target');
            showView(target);
            if (target === 'dashboard') loadDashboardData();
            if (target === 'payments') loadPayments();
            if (target === 'metrics') loadMetrics();
        });
    });
}

function showView(viewId) {
    const views = document.querySelectorAll('.view');
    views.forEach(v => v.classList.remove('active'));
    
    const targetView = document.getElementById(`${viewId}-view`);
    if (targetView) targetView.classList.add('active');
}

function initLoginForm() {
    const form = document.getElementById('login-form');
    const errorDiv = document.getElementById('login-error');
    const submitBtn = document.getElementById('login-submit');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            errorDiv.textContent = '';
            submitBtn.textContent = 'Ingresando...';
            submitBtn.disabled = true;

            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            submitBtn.textContent = 'Ingresar';
            submitBtn.disabled = false;

            if (error) {
                console.error(error);
                errorDiv.textContent = `Error: ${error.message}`;
            } else {
                verifyAdmin(data.user);
            }
        });
    }
}

function initLogoutBtn() {
    const btn = document.getElementById('logout-btn');
    if (btn) {
        btn.addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
            localStorage.removeItem('adminMode');
            document.getElementById('sidebar').style.display = 'none';
            showView('login');
        });
    }
}

async function loadDashboardData() {
    // Fetch metrics
    const { data: metrics, error: metricsError } = await supabaseClient
        .from('web_metrics')
        .select('*')
        .order('created_at', { ascending: false });

    if (metricsError) {
        console.error('Error fetching metrics:', metricsError);
        return;
    }

    // Chart.js Global defaults for minimalist look
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.scale.grid.color = 'rgba(255, 255, 255, 0.05)';
    Chart.defaults.scale.grid.borderColor = 'transparent';

    let totalVisits = 0;
    let totalTime = 0;
    let timeRecords = 0;
    let uniqueClients = new Set();
    let bounces = 0;

    if (metrics) {
        totalVisits = metrics.length;
        metrics.forEach(m => {
            if (m.client_id) uniqueClients.add(m.client_id);
            if (m.duration_seconds > 0) {
                totalTime += m.duration_seconds;
                timeRecords++;
            }
            // Bounce: duration < 5s
            if (m.duration_seconds < 5) {
                bounces++;
            }
        });
    }

    document.getElementById('total-visits').textContent = totalVisits;
    document.getElementById('unique-visitors').textContent = uniqueClients.size;
    
    if (timeRecords > 0) {
        document.getElementById('avg-time-page').textContent = Math.round(totalTime / timeRecords) + ' seg';
    } else {
        document.getElementById('avg-time-page').textContent = '0 seg';
    }

    if (totalVisits > 0) {
        document.getElementById('bounce-rate').textContent = Math.round((bounces / totalVisits) * 100) + '%';
    } else {
        document.getElementById('bounce-rate').textContent = '0%';
    }

    // Fetch payments and downloads
    const { data: payments } = await supabaseClient
        .from('payment_records')
        .select('amount, created_at, product_name, status')
        .in('status', ['approved', 'free_download']);
    
    let totalRevenue = 0;
    let totalSales = 0;
    let totalDownloads = 0;

    if (payments) {
        payments.forEach(p => {
            if (p.status === 'approved') {
                totalSales++;
                totalRevenue += Number(p.amount) || 0;
                totalDownloads++; // paid counts as download too
            } else if (p.status === 'free_download') {
                totalDownloads++;
            }
        });
    }

    document.getElementById('total-revenue').textContent = '$' + totalRevenue.toLocaleString('es-AR');
    document.getElementById('total-sales').textContent = totalSales;
    const downloadEl = document.getElementById('total-downloads');
    if (downloadEl) downloadEl.textContent = totalDownloads;

    if (metrics) {
        renderCharts(metrics, payments || []);
    }
}

function renderCharts(metrics, payments) {
    // Common Chart.js options for dark theme
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = '#2d3748';

    // 1. Visits over time (last 7 days)
    const dates = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        dates[d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })] = 0;
    }

    metrics.forEach(m => {
        const dateStr = new Date(m.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
        if (dates[dateStr] !== undefined) {
            dates[dateStr]++;
        }
    });

    const visitsCtx = document.getElementById('visitsChart');
    if (visitsChartInstance) visitsChartInstance.destroy();
    visitsChartInstance = new Chart(visitsCtx, {
        type: 'line',
        data: {
            labels: Object.keys(dates),
            datasets: [{
                label: 'Visitas',
                data: Object.values(dates),
                borderColor: '#00e5ff',
                backgroundColor: 'rgba(0, 229, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });

    // 2. Traffic Sources
    const sources = {};
    metrics.forEach(m => {
        let source = 'Directo';
        if (m.utm_source) source = `UTM: ${m.utm_source}`;
        else if (m.referrer) {
            try {
                source = new URL(m.referrer).hostname;
            } catch(e) {
                source = m.referrer;
            }
        }
        sources[source] = (sources[source] || 0) + 1;
    });

    // Common Tooltip Callback for Percentages
    const percentageTooltip = {
        callbacks: {
            label: function(context) {
                let label = context.label || '';
                if (label) label += ': ';
                let value = context.raw;
                let total = context.dataset.data.reduce((a, b) => a + b, 0);
                let percentage = total > 0 ? Math.round((value / total) * 100) + '%' : '0%';
                return label + value + ' (' + percentage + ')';
            }
        }
    };

    const sourcesCtx = document.getElementById('sourcesChart');
    if (sourcesChartInstance) sourcesChartInstance.destroy();
    sourcesChartInstance = new Chart(sourcesCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(sources),
            datasets: [{
                data: Object.values(sources),
                backgroundColor: ['#00e5ff', '#00e676', '#3b82f6', '#f59e0b', '#8b5cf6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'right' },
                tooltip: percentageTooltip
            }
        }
    });

    // 3. Pages Visited
    const pages = {};
    metrics.forEach(m => {
        pages[m.path] = (pages[m.path] || 0) + 1;
    });

    const pagesCtx = document.getElementById('pagesChart');
    if (pagesChartInstance) pagesChartInstance.destroy();
    pagesChartInstance = new Chart(pagesCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(pages),
            datasets: [{
                label: 'Visitas',
                data: Object.values(pages),
                backgroundColor: '#00e5ff',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });

    // 4. Sales over time
    const salesDates = {};
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        salesDates[d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })] = 0;
    }

    payments.forEach(p => {
        if (p.created_at && p.status === 'approved') {
            const dateStr = new Date(p.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
            if (salesDates[dateStr] !== undefined) {
                salesDates[dateStr] += Number(p.amount) || 0;
            }
        }
    });

    const salesCtx = document.getElementById('salesChart');
    if (salesChartInstance) salesChartInstance.destroy();
    salesChartInstance = new Chart(salesCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(salesDates),
            datasets: [{
                label: 'Ingresos ($)',
                data: Object.values(salesDates),
                backgroundColor: '#00e676',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });

    // 5. Top Selling Products
    const products = {};
    payments.forEach(p => {
        const prod = p.product_name || 'Desconocido';
        products[prod] = (products[prod] || 0) + 1;
    });

    const productsCtx = document.getElementById('productsChart');
    if (productsChartInstance) productsChartInstance.destroy();
    productsChartInstance = new Chart(productsCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(products),
            datasets: [{
                data: Object.values(products),
                backgroundColor: ['#00e676', '#00e5ff', '#f59e0b', '#3b82f6', '#8b5cf6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { 
                legend: { position: 'right' },
                tooltip: percentageTooltip
            }
        }
    });

    // 6. Devices / Browsers
    const devices = {};
    metrics.forEach(m => {
        let device = 'Otro';
        if (m.user_agent) {
            const ua = m.user_agent.toLowerCase();
            if (ua.includes('chrome') && !ua.includes('edg')) device = 'Chrome';
            else if (ua.includes('safari') && !ua.includes('chrome')) device = 'Safari';
            else if (ua.includes('firefox')) device = 'Firefox';
            else if (ua.includes('edg')) device = 'Edge';
            else if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) device = 'Móvil genérico';
        }
        devices[device] = (devices[device] || 0) + 1;
    });

    const devicesCtx = document.getElementById('devicesChart');
    if (devicesChartInstance) devicesChartInstance.destroy();
    devicesChartInstance = new Chart(devicesCtx, {
        type: 'pie',
        data: {
            labels: Object.keys(devices),
            datasets: [{
                data: Object.values(devices),
                backgroundColor: ['#38bdf8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { 
                legend: { position: 'bottom' },
                tooltip: percentageTooltip
            }
        }
    });
}

async function loadPayments() {
    const { data, error } = await supabaseClient
        .from('payment_records')
        .select('*')
        .in('status', ['approved', 'free_download'])
        .order('created_at', { ascending: false })
        .limit(50);
    
    if (error) {
        console.error('Error fetching payments:', error);
        return;
    }

    const tbody = document.getElementById('payments-table-body');
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay pagos o descargas registrados.</td></tr>';
        return;
    }

    data.forEach(p => {
        const date = new Date(p.created_at).toLocaleString('es-AR');
        const amount = p.status === 'free_download' ? 'Gratis' : `$${Number(p.amount).toLocaleString('es-AR')}`;
        const statusClass = p.status === 'approved' ? 'status-approved' : 'status-free';
        const statusLabel = p.status === 'approved' ? 'Aprobado' : 'Gratis';
        
        tbody.innerHTML += `
            <tr>
                <td>${date}</td>
                <td>${p.product_name || '-'}</td>
                <td>${p.client_name || p.client_email || 'Anónimo'}</td>
                <td>${amount}</td>
                <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
            </tr>
        `;
    });
}

async function loadMetrics() {
    const tbody = document.getElementById('metrics-table-body');
    tbody.innerHTML = '<tr><td colspan="4">Cargando...</td></tr>';

    const { data, error } = await supabaseClient
        .from('web_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
    
    if (error) {
        tbody.innerHTML = '<tr><td colspan="4">Error al cargar métricas.</td></tr>';
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No hay métricas registradas.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach(m => {
        const date = new Date(m.created_at).toLocaleString('es-AR');
        const origin = m.utm_source ? `UTM: ${m.utm_source}` : (m.referrer || 'Directo');
        const duration = m.duration_seconds !== null && m.duration_seconds !== undefined ? `${m.duration_seconds}s` : '-';
        
        tbody.innerHTML += `
            <tr>
                <td>${date}</td>
                <td>${m.path}</td>
                <td>${origin}</td>
                <td>${m.client_id}</td>
                <td>${duration}</td>
            </tr>
        `;
    });
}
