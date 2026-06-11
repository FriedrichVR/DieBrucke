// api/create-preference.js
// Función Serverless para crear una preferencia de pago en Mercado Pago

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

    const { amount, title, email, name, downloadUrl, filename } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Invalid or missing amount' });
    }

    const referer = req.headers.referer || (req.headers.host ? `https://${req.headers.host}` : 'https://diebrucke.studio');
    const host = req.headers.host || '';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    
    // Set notification_url to point to our Serverless Function api/payment-webhook
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const isProduction = !isLocal;
    const notificationUrl = isLocal
        ? 'https://diebrucke.studio/api/payment-webhook' // Fallback to a live endpoint so it doesn't fail MP's validation
        : `${protocol}://${host}/api/payment-webhook`;

    try {
        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: [
                    {
                        title: title || 'Contribución voluntaria',
                        unit_price: Number(amount),
                        quantity: 1,
                        currency_id: 'ARS'
                    }
                ],
                payer: email ? {
                    email: email,
                    name: name || undefined
                } : undefined,
                back_urls: {
                    success: referer,
                    pending: referer,
                    failure: referer
                },
                auto_return: 'approved',
                notification_url: notificationUrl,
                external_reference: [
                    email || '',
                    name || '',
                    filename || '',
                    downloadUrl || '',
                    referer || ''
                ].join('|'),
                metadata: {
                    product_name: title || 'Contribución voluntaria',
                    payer_name: name || undefined,
                    payer_email: email || undefined,
                    download_url: downloadUrl || undefined,
                    filename: filename || undefined,
                    environment: isProduction ? 'production' : 'test',
                    page_url: referer
                }
            })
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            console.error('Mercado Pago API error:', errorDetails);
            return res.status(response.status).json({ 
                message: 'Error creating preference on Mercado Pago', 
                details: errorDetails 
            });
        }

        const data = await response.json();
        return res.status(200).json({
            id: data.id,
            init_point: data.init_point,
            sandbox_init_point: data.sandbox_init_point
        });
    } catch (error) {
        console.error('Server error creating preference:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
