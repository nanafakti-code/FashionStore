
async function test() {
    const url = 'http://localhost:4321/api/cart/add';
    const body = {
        variantId: '52569b85-9ada-4fd4-8583-cff55036cd60',
        quantity: 1,
        variantName: 'Estándar Gris',
        price: 239900
    };
    console.log('Testing POST to', url);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Body:', text);
    } catch (e) {
        console.error('Error:', e.message);
        // Try 4322
        try {
            const url2 = 'http://localhost:4322/api/cart/add';
            console.log('Retrying with', url2);
            const res2 = await fetch(url2, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            console.log('Status 4322:', res2.status);
            console.log('Body 4322:', await res2.text());
        } catch (e2) {
            console.error('Error 4322:', e2.message);
        }
    }
}
test();
