const fs = require('fs');
const path = require('path');
const os = require('os');

let found = false;

function searchForVersion(rootFolder, depth = 0) {
    if (depth >= 3) {
        return;
    }
    const files = fs.readdirSync(rootFolder);

    files.forEach((file) => {
        if (file === '.git' || file === '.github' || found) {
            return;
        }
        const filePath = path.join(rootFolder, file);

        if (fs.statSync(filePath).isDirectory()) {
            // If it is a directory, recursively call the function on that directory
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

// Function to check dependencies for a specific version
function checkDependencies(dependencies) {
    if (dependencies) {
        Object.keys(dependencies).forEach((dependency) => {
            const depVersion = dependencies[dependency];
            if (depVersion.includes('-fix-') || depVersion.includes('-feat-')) {
                console.log(dependency, depVersion);
                setOutput('time', 'true');
            }
        });
    }
}

function setOutput(name, value) {
    const filePath = process.env['GITHUB_OUTPUT'] || '';
    fs.appendFileSync(filePath, `${name}=${value}${os.EOL}`);
}

searchForVersion('./');
