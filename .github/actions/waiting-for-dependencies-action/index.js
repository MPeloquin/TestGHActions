const fs = require('fs');
const path = require('path');

function searchForVersion(rootFolder, depth = 0) {
    if (depth >= 3) {
        return;
    }
    const files = fs.readdirSync(rootFolder);

    files.forEach((file) => {
        if (file === '.git' || file === '.github') {
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

                checkDependencies(packageJson.dependencies, filePath);
                checkDependencies(packageJson.devDependencies, filePath);
            } catch (error) {
                console.error(`Error parsing ${filePath}: ${error.message}`);
            }
        }
    });
}

// Function to check dependencies for a specific version
function checkDependencies(dependencies, filePath) {
    if (dependencies) {
        Object.keys(dependencies).forEach((dependency) => {
            const depVersion = dependencies[dependency];
            console.log(depVersion);
            if (depVersion === "1.1.0") {
                console.log(`Found ${dependency}@${version} in ${filePath}`);
            }
        });
    }
}

function setOutput(key, value) {
    const output = process.env['GITHUB_OUTPUT']
    console.log(`::set-output name=${key}::${value}`)
    console.log(output)
    fs.appendFileSync(output, `${key}=${value}`)
}

searchForVersion('./');
setOutput('time', 'true');
