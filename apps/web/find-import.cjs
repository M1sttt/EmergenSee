const fs = require('fs');
const path = require('path');
function walk(dir) {
    let results = [];
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory() && !fullPath.includes('node_modules') && !fullPath.includes('.git') && !fullPath.includes('dist')) {
            results = results.concat(walk(fullPath));
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');
            lines.forEach((line, i) => {
                if (line.includes('from') && line.includes('../')) {
                    results.push(`${fullPath}:${i + 1} => ${line.trim()}`);
                }
            });
        }
    }); return results;
}
console.log(walk('.').join('\n'));