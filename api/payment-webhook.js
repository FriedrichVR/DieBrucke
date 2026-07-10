// api/payment-webhook.js
// Función Serverless para recibir notificaciones de pago (webhooks) de Mercado Pago

// Cache global en memoria para evitar el procesamiento redundante de notificaciones duplicadas
const processedPayments = new Set();

export default async function handler(req, res) {
    // Manejar CORS de forma segura
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    // Mercado Pago envía la notificación en el cuerpo (body) de la petición
    // El objeto contiene: action, api_version, data, date_created, id, live_mode, type, user_id
    const { action, type, data } = req.body;

    const paymentId = data?.id || req.query.id;
    const topic = type || req.query.topic;

    // Solo procesamos si el tipo de notificación es "payment"
    if (!paymentId || (topic !== 'payment' && req.query.topic !== 'payment')) {
        // Retornamos 200 a Mercado Pago para confirmar recepción de otros eventos (ej. merchant_order)
        return res.status(200).json({ message: 'Notification received but not a payment' });
    }

    // 1. Lock preventivo: Evita condiciones de carrera concurrentes locales en el mismo contenedor
    if (processedPayments.has(paymentId)) {
        console.log(`[Deduplicación] El pago ${paymentId} ya está siendo procesado o ya fue procesado por esta instancia. Omitiendo.`);
        return res.status(200).json({ message: 'Notification already processed (locked)' });
    }

    // 1.5. Lock distribuido (Base de datos): Verificar si ya procesamos este pago
    const supabaseUrl = process.env.SUPABASE_URL || 'https://uelocqsryuvhcwmjjbho.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseKey) {
        try {
            const checkResponse = await fetch(`${supabaseUrl}/rest/v1/payment_records?payment_id=eq.${paymentId}`, {
                method: 'GET',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`
                }
            });
            if (checkResponse.ok) {
                const existingRecords = await checkResponse.json();
                if (existingRecords && existingRecords.length > 0) {
                    console.log(`[Deduplicación DB] El pago ${paymentId} ya existe en Supabase. Omitiendo procesamiento duplicado.`);
                    return res.status(200).json({ message: 'Notification already processed (found in DB)' });
                }
            }
        } catch (dbCheckError) {
            console.error('Error al verificar duplicados en Supabase:', dbCheckError);
        }
    }

    // Adquirir bloqueo temporal antes del fetch asíncrono
    processedPayments.add(paymentId);
    console.log(`[Deduplicación] Adquiriendo bloqueo para el pago ${paymentId}.`);

    try {
        // Consultar los detalles del pago en Mercado Pago usando el ID recibido
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
            }
        });

        if (!mpResponse.ok) {
            const errorText = await mpResponse.text();
            console.error('Error al consultar pago en Mercado Pago:', errorText);
            // Liberar el bloqueo si falla la consulta para permitir futuros reintentos
            processedPayments.delete(paymentId);
            return res.status(500).json({ message: 'Error fetching payment details from Mercado Pago' });
        }

        const payment = await mpResponse.json();

        // 2. Liberar el bloqueo si el pago NO está aprobado (ej. pendiente, rechazado)
        // Esto permite que cuando el pago finalmente se apruebe, la nueva notificación pueda procesarse.
        if (payment.status !== 'approved') {
            console.log(`[Deduplicación] El pago ${paymentId} tiene estado ${payment.status} (no aprobado). Liberando bloqueo.`);
            processedPayments.delete(paymentId);
            return res.status(200).json({ message: `Notification processed, status is ${payment.status}` });
        }

        // Si el pago está aprobado, mantenemos el bloqueo para ignorar segundas notificaciones.
        // Configuramos un temporizador de 5 minutos para limpiar la caché y no saturar la memoria.
        const cleanupTimeout = setTimeout(() => {
            processedPayments.delete(paymentId);
            console.log(`[Deduplicación] Bloqueo para el pago ${paymentId} removido de la caché tras expiración (5 min).`);
        }, 300000);

        const metadata = payment.metadata || {};
        const payer = payment.payer || {};
        
        // Decodificar el respaldo de seguridad de external_reference en caso de que metadata sea null/vacío
        const extRef = payment.external_reference || '';
        let refEmail = '', refName = '', refFilename = '', refDownloadUrl = '', refPageUrl = '';
        if (extRef && extRef.includes('|')) {
            const parts = extRef.split('|');
            refEmail = parts[0];
            refName = parts[1];
            refFilename = parts[2];
            refDownloadUrl = parts[3];
            refPageUrl = parts[4];
        }

        // Obtener datos del cliente priorizando metadata, luego external_reference y finalmente datos de la cuenta de MP
        const clientEmail = metadata.payer_email || refEmail || payer.email || '';
        const clientName = metadata.payer_name || refName || (payer.first_name ? `${payer.first_name} ${payer.last_name || ''}`.trim() : 'Cliente');
        
        // Obtener el nombre del producto
        let productName = metadata.product_name;
        if (!productName) {
            const items = payment.additional_info?.items || [];
            productName = items[0]?.title || 'Recurso';
        }
        // Limpiar prefijo "Pago - " o "Contribución voluntaria - " para que coincida con el nombre limpio de la web
        productName = productName.replace(/^(Pago - |Contribución voluntaria - )/, '');
        
        const downloadUrl = metadata.download_url || refDownloadUrl || '';
        const filename = metadata.filename || refFilename || '';
        
        let pageUrl = metadata.page_url || refPageUrl || '';
        // Limpiar parámetros de búsqueda de la URL si los hubiera
        if (pageUrl.includes('?')) {
            pageUrl = pageUrl.split('?')[0];
        }
        // Forzar extensión .html si se omitió por URLs limpias (ej. /product-3 -> /product-3.html)
        if (!pageUrl.endsWith('.html') && (pageUrl.endsWith('/product-3') || pageUrl.endsWith('/product-8'))) {
            pageUrl = pageUrl + '.html';
        }

        // Determinar si es entorno de testing o producción según el metadato del pago
        const environment = metadata.environment || 'production';
        const isProduction = environment === 'production';
        const n8nWebhookUrl = isProduction
            ? 'https://n8n.srv1202174.hstgr.cloud/webhook/65debfa2-2837-4f6b-8052-093144fcc2d8'
            : 'https://n8n.srv1202174.hstgr.cloud/webhook-test/65debfa2-2837-4f6b-8052-093144fcc2d8';

        console.log(`Pago ${paymentId} aprobado. Guardando en Supabase y enviando webhook a n8n...`);

        // Insert into Supabase
        try {
            const supabaseUrl = process.env.SUPABASE_URL || 'https://uelocqsryuvhcwmjjbho.supabase.co';
            // Use the service role key from .env to bypass RLS for inserting
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            
            if (supabaseKey) {
                const dbResponse = await fetch(`${supabaseUrl}/rest/v1/payment_records`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        payment_id: paymentId.toString(),
                        status: payment.status,
                        amount: Number(payment.transaction_amount),
                        product_name: productName,
                        client_email: clientEmail,
                        client_name: clientName,
                        environment: environment
                    })
                });

                if (!dbResponse.ok) {
                    const dbErrorText = await dbResponse.text();
                    console.error('Error al guardar pago en Supabase:', dbErrorText);
                    
                    // Si el error es por clave única duplicada (PostgREST 409 o contiene código 23505),
                    // abortamos para evitar duplicar el envío a n8n.
                    if (dbResponse.status === 409 || dbErrorText.includes('23505') || dbErrorText.includes('duplicate key') || dbErrorText.includes('already exists')) {
                        console.log(`[Deduplicación DB Concurrente] Conflicto al insertar pago ${paymentId} (ya guardado concurrentemente). Omitiendo webhook n8n.`);
                        processedPayments.delete(paymentId);
                        return res.status(200).json({ message: 'Notification already processed (concurrent DB insertion)' });
                    }
                }
            } else {
                console.warn('Falta SUPABASE_SERVICE_ROLE_KEY en el entorno.');
            }
        } catch (dbError) {
            console.error('Error al guardar pago en Supabase:', dbError);
            // We continue even if DB save fails to not block n8n
        }

        try {
            const n8nResponse = await fetch(n8nWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: clientName,
                    email: clientEmail,
                    productName: productName,
                    downloadUrl: downloadUrl,
                    filename: filename,
                    paymentId: paymentId,
                    status: payment.status,
                    source: 'payment_success',
                    submittedAt: new Date().toISOString(),
                    environment: environment,
                    pageUrl: pageUrl
                })
            });

            if (!n8nResponse.ok) {
                const n8nError = await n8nResponse.text();
                console.error('Error al enviar webhook a n8n:', n8nError);
                // Si falla, removemos de la caché para permitir reintentos
                processedPayments.delete(paymentId);
                clearTimeout(cleanupTimeout);
                return res.status(500).json({ message: 'Error sending webhook to n8n' });
            }
        } catch (n8nFetchError) {
            console.error('Excepción al enviar webhook a n8n:', n8nFetchError);
            processedPayments.delete(paymentId);
            clearTimeout(cleanupTimeout);
            return res.status(500).json({ message: 'Error sending webhook to n8n' });
        }

        return res.status(200).json({ message: 'Notification processed successfully' });
    } catch (error) {
        console.error('Error en el controlador del webhook:', error);
        if (paymentId) {
            processedPayments.delete(paymentId);
        }
        return res.status(500).json({ message: 'Internal server error' });
    }
}
