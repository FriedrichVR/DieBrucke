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
    const { data: metrics } = await supabaseClient
        .from('web_metrics')
        .select('*');
    
    document.getElementById('total-visits').textContent = metrics ? metrics.length : 0;

    // Calculate Average Time
    if (metrics && metrics.length > 0) {
        let totalTime = 0;
        let validTimeEntries = 0;
        metrics.forEach(m => {
            if (m.duration_seconds && m.duration_seconds > 0 && m.duration_seconds < 7200) { // filter out weird anomalies
                totalTime += m.duration_seconds;
                validTimeEntries++;
            }
        });
        const avgTime = validTimeEntries > 0 ? Math.floor(totalTime / validTimeEntries) : 0;
        document.getElementById('avg-time-page').textContent = `${avgTime} seg`;
    } else {
        document.getElementById('avg-time-page').textContent = '0 seg';
    }

    // Fetch payments
    const { data: payments } = await supabaseClient
        .from('payment_records')
        .select('amount, created_at, product_name')
        .eq('status', 'approved');
    
    let totalRevenue = 0;
    let totalSales = 0;
    if (payments) {
        totalSales = payments.length;
        totalRevenue = payments.reduce((acc, curr) => acc + Number(curr.amount), 0);
    }

    document.getElementById('total-revenue').textContent = '$' + totalRevenue.toLocaleString('es-AR');
    document.getElementById('total-sales').textContent = totalSales;

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
                legend: { position: 'right' }
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
        if (p.created_at) {
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
            plugins: { legend: { position: 'right' } }
        }
    });

    // 6. Devices / Browsers
    const devices = {};
    metrics.forEach(m => {
        let device = 'Otro';
        if (m.user_agent) {
            const ua = m.user_agent.toLowerCase();
            if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) device = 'Móvil';
            else device = 'Escritorio';
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
                backgroundColor: ['#8b5cf6', '#3b82f6', '#00e5ff'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

async function loadPayments() {
    const tbody = document.getElementById('payments-table-body');
    tbody.innerHTML = '<tr><td colspan="5">Cargando...</td></tr>';

    const { data, error } = await supabaseClient
        .from('payment_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
    
    if (error) {
        tbody.innerHTML = '<tr><td colspan="5">Error al cargar pagos.</td></tr>';
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No hay pagos registrados.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach(p => {
        const date = new Date(p.created_at).toLocaleString('es-AR');
        const statusClass = p.status === 'approved' ? 'status-approved' : '';
        const statusText = p.status === 'approved' ? 'Aprobado' : p.status;
        
        tbody.innerHTML += `
            <tr>
                <td>${date}</td>
                <td>${p.client_name || p.client_email || 'Anónimo'}</td>
                <td>${p.product_name}</td>
                <td>$${p.amount}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
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
