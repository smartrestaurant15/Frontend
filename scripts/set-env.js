const fs = require('fs');
const path = require('path');

const apiUrl         = process.env['API_URL']          || 'https://api.smart-restaurant.online/api';
const chatbotApiKey  = process.env['CHATBOT_API_KEY']  || 'CHATBOT_API_KEY_PLACEHOLDER';
const n8nWebhookUrl  = process.env['N8N_WEBHOOK_URL']  || 'https://TU_INSTANCIA_N8N/webhook/smartrestaurant-chatbot';
const googleClientId = process.env['GOOGLE_CLIENT_ID'] || '512756127640-hm9hitju6rp7d749v8v9tiifqj19b3ko.apps.googleusercontent.com';

const content = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}',
  apiTimeout: 30000,
  googleClientId: '${googleClientId}',
  chatbotApiKey: '${chatbotApiKey}',
  n8nWebhookUrl: '${n8nWebhookUrl}'
};
`;

const targetPath = path.join(__dirname, '..', 'src', 'environments', 'environment.prod.ts');
fs.writeFileSync(targetPath, content, 'utf8');
console.log(`environment.prod.ts generado en ${targetPath}`);
