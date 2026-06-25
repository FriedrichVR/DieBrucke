const supabaseUrl = 'https://uelocqsryuvhcwmjjbho.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlbG9jcXNyeXV2aGN3bWpqYmhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzQ5MjMsImV4cCI6MjA5NzkxMDkyM30.uinZ-RlDIuQ7ZQlknhCmLef7Rzcb1DCWuxvwywkEFuw';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

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
    // Basic stats
    const { count: visitsCount } = await supabaseClient
        .from('web_metrics')
        .select('*', { count: 'exact', head: true });
    
    document.getElementById('total-visits').textContent = visitsCount || 0;

    const { data: payments } = await supabaseClient
        .from('payment_records')
        .select('amount')
        .eq('status', 'approved');
    
    let totalRevenue = 0;
    let totalSales = 0;
    if (payments) {
        totalSales = payments.length;
        totalRevenue = payments.reduce((acc, curr) => acc + Number(curr.amount), 0);
    }

    document.getElementById('total-revenue').textContent = '$' + totalRevenue.toLocaleString('es-AR');
    document.getElementById('total-sales').textContent = totalSales;
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
        
        tbody.innerHTML += `
            <tr>
                <td>${date}</td>
                <td>${m.path}</td>
                <td>${origin}</td>
                <td>${m.client_id}</td>
            </tr>
        `;
    });
}
