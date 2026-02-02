
async function check() {
    const url = 'http://localhost:4321/api/products/macbook-pro-16-m3-max/variants';
    console.log('Checking variants from', url);
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log('Keys of first item:', Object.keys(data[0] || {}));
        console.log('First item:', JSON.stringify(data[0], null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
}
check();
