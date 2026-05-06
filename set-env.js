const fs = require('fs');
const path = require('path');

const openWeatherMapApiKey = process.env.OPEN_WEATHER_MAP_API_KEY;

const envConfigFile = `
export const environment = {
    production: true,
    openWeatherMapApiKey: '${openWeatherMapApiKey}'
};
`;

const targetPath = path.join(__dirname, './src/environments/environment.ts');
const targetDevPath = path.join(__dirname, './src/environments/environment.development.ts');

console.log('Generando archivo de entorno...');
fs.writeFileSync(targetPath, envConfigFile);
console.log(`Archivo generado en ${targetPath}`);
fs.writeFileSync(targetDevPath, envConfigFile);
console.log(`Archivo generado en ${targetDevPath}`);