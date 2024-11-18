const fs = require('fs');

const apiUrl = process.env.REACT_APP_TARGET_ADDRESS; 
if (!apiUrl) {
    console.error('NO ADDRES');
    process.exit(1);
}

const templatePath = path.join(__dirname, 'netlify.template.toml');
const outputPath = path.join(__dirname, 'netlify.toml');

const template = fs.readFileSync(templatePath, 'utf-8');
const result = template.replace('{{API_BACKEND_URL}}', apiUrl);

fs.writeFileSync(outputPath, result);
console.log(`netlify.toml сгенерирован с API_BACKEND_URL: ${apiUrl}`);
