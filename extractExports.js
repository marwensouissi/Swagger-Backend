const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, 'k6');
const output = {};

function extractExportedFunctions(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const exportRegex = /export\s+(?:async\s+)?function\s+(\w+)/g;
  const matches = [...content.matchAll(exportRegex)];
  return matches.map(match => match[1]);
}

fs.readdirSync(rootDir, { withFileTypes: true }).forEach(dirent => {
  if (dirent.isDirectory() && dirent.name.endsWith('Management')) {
    const moduleName = dirent.name.replace(/Management$/, '');
    const dirPath = path.join(rootDir, dirent.name);
    const exportedFunctions = [];

    fs.readdirSync(dirPath).forEach(file => {
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isFile() && file.endsWith('.js')) {
        exportedFunctions.push(...extractExportedFunctions(filePath));
      }
    });

    if (exportedFunctions.length > 0) {
      output[moduleName] = exportedFunctions;
    }
  }
});

const outputFilePath = path.join(__dirname, 'exported-functions.json');
fs.writeFileSync(outputFilePath, JSON.stringify(output, null, 2), 'utf8');

console.log(`Exported functions saved to ${outputFilePath}`);
