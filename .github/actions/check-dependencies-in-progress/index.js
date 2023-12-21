const fs = require('fs');
const path = require('path');
const os = require('os');

const InProgressVersionNames = ['-fix-', '-feat-', '--canary'];

let found = false;
function searchForVersion(rootFolder, depth = 0) {
    if (depth >= 3 || found) {
        return;
    }
    const files = fs.readdirSync(rootFolder);
    console.log(files);

    files.forEach((file) => {
        if (file === '.git' || file === '.github' || found) {
            return;
        }

        const filePath = path.join(rootFolder, file);

        if (fs.statSync(filePath).isDirectory()) {
            searchForVersion(filePath, depth + 1);
        } else if (file === 'package.json') {
            const content = fs.readFileSync(filePath, 'utf-8');
            const packageJson = JSON.parse(content);
            checkDependencies(packageJson.dependencies);
            checkDependencies(packageJson.devDependencies);
        }
    });
}

function checkDependencies(dependencies) {
    if (!dependencies) {
        return;
    }

    Object.keys(dependencies).forEach((dependency) => {
        const depVersion = dependencies[dependency];
        if (InProgressVersionNames.some((name) => depVersion.includes(name))) {
            found = true;
            setOutput('has-dependency-in-progress', 'true');
        }
    });
}

function setOutput(name, value) {
    const filePath = process.env['GITHUB_OUTPUT'] || '';
    fs.appendFileSync(filePath, `${name}=${value}${os.EOL}`);
}

searchForVersion('./');
