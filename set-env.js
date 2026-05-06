const fs = require('fs');
const path = require('path');

const envDir = path.join(__dirname, './src/environments');

if (!fs.existsSync(envDir)) {
    console.log('Creando la carpeta de entornos...');
    fs.mkdirSync(envDir, { recursive: true });
}

const openWeatherMapApiKey = process.env.OPEN_WEATHER_MAP_API_KEY;

const envConfigFile = `
export const environment = {
    production: true,
    openWeatherMapApiKey: '${openWeatherMapApiKey}'
};
`;

const targetPath = path.join(envDir, 'environment.ts');
const targetDevPath = path.join(envDir, 'environment.development.ts');

console.log('Generando archivos de entorno...');
fs.writeFileSync(targetPath, envConfigFile);
fs.writeFileSync(targetDevPath, envConfigFile);
console.log('¡Archivos creados con éxito!');