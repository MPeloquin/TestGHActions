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

    files.forEach((file) => {
        if (file === '.git' || file === '.github' || found) {
            return;
        }

        const filePath = path.join(rootFolder, file);

        if (fs.statSync(filePath).isDirectory()) {
            searchForVersion(filePath, depth + 1);
        } else if (file === 'package.json') {
            const content = fs.readFileSync(filePath, 'utf-8');

            try {
                const packageJson = JSON.parse(content);

                checkDependencies(packageJson.dependencies);
                checkDependencies(packageJson.devDependencies);
            } catch (error) {
                console.error(`Error parsing ${filePath}: ${error.message}`);
            }
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
            setOutput('in-progress-dependency-found', 'true');
        }
    });
}

function setOutput(name, value) {
    const filePath = process.env['GITHUB_OUTPUT'] || '';
    fs.appendFileSync(filePath, `${name}=${value}${os.EOL}`);
}

searchForVersion('./');
