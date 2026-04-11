// Mock global de firebase-admin/app para todos os testes
export const initializeApp = () => ({});
export const cert = () => ({});
export const getApps = () => [{}]; // array não-vazio → bloco if no firebase.ts não executa
