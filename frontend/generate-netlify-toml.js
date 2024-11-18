const fs = require('fs');

const apiUrl = process.env.REACT_APP_TARGET_ADDRESS; 
if (!apiUrl) {
    console.error('NO ADDRES');
    process.exit(1);
}

const template = fs.readFileSync('netlify.template.toml', 'utf-8');
const result = template.replace('{{API_BACKEND_URL}}', apiUrl);

fs.writeFileSync('netlify.toml', result);

