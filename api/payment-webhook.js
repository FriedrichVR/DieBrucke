// api/payment-webhook.js
// Función Serverless para recibir notificaciones de pago (webhooks) de Mercado Pago

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
            return res.status(500).json({ message: 'Error fetching payment details from Mercado Pago' });
        }

        const payment = await mpResponse.json();

        // Solo enviamos a n8n si el pago ha sido aprobado/acreditado
        if (payment.status === 'approved') {
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

            console.log(`Pago ${paymentId} aprobado. Enviando webhook a n8n (${isProduction ? 'Producción' : 'Testing'})...`);

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
                return res.status(500).json({ message: 'Error sending webhook to n8n' });
            }
        }

        return res.status(200).json({ message: 'Notification processed successfully' });
    } catch (error) {
        console.error('Error en el controlador del webhook:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
