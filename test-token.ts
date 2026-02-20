
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const ADMIN_EMAIL = 'admin@fashionstore.com';
const TOKEN_SECRET = 'test-secret-key-1234567890'; // Fixed secret for testing

export interface AdminSession {
    username: string;
    isAdmin: boolean;
    createdAt: number;
}

function createAdminSessionToken(username: string): string {
    const session: AdminSession = {
        username,
        isAdmin: true,
        createdAt: Date.now()
    };

    const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
    const signature = createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');

    return `${payload}.${signature}`;
}

function verifyAdminSessionToken(token: string): AdminSession | null {
    try {
        if (!token || typeof token !== 'string') return null;

        const parts = token.split('.');
        if (parts.length !== 2) return null;

        const payload = parts[0];
        const signature = parts[1];

        // Verificar firma HMAC
        const expectedSignature = createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');

        // Debug output
        console.log('Payload:', payload);
        console.log('Signature:', signature);
        console.log('Expected Signature:', expectedSignature);

        const sigBuffer = Buffer.from(signature, 'utf-8');
        const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');

        if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
            console.log('Signature mismatch!');
            return null;
        }

        // Decodificar payload
        const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
        const session = JSON.parse(decoded) as AdminSession;

        console.log('Decoded session:', session);

        // Verificar que la sesión no haya expirado (24 horas)
        const expiryTime = 24 * 60 * 60 * 1000;
        if (Date.now() - session.createdAt > expiryTime) {
            console.log('Session expired!');
            return null;
        }

        return session;
    } catch (e) {
        console.error('Verification error:', e);
        return null;
    }
}

// RUN TEST
console.log('--- STARTING TOKEN TEST ---');
const token = createAdminSessionToken(ADMIN_EMAIL);
console.log('Generated Token:', token);

const verified = verifyAdminSessionToken(token);
console.log('Verification Result:', verified ? 'SUCCESS' : 'FAILED');
