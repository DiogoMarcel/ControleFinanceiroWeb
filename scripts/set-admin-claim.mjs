// Script one-time: define role=admin para o usuário pelo e-mail
// Uso: node scripts/set-admin-claim.mjs <email>

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../apps/api/.env') });

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const email = process.argv[2];
if (!email) {
  console.error('Uso: node scripts/set-admin-claim.mjs <email>');
  process.exit(1);
}

const auth = getAuth();
const user = await auth.getUserByEmail(email);
await auth.setCustomUserClaims(user.uid, { role: 'admin' });
console.log(`✅ role=admin definido para ${email} (uid: ${user.uid})`);
console.log('Faça logout e login novamente para o token ser renovado.');
