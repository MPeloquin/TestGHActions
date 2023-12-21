const fs = require('fs');
const path = require('path');

// Function to recursively search for dependencies with a specific version
function searchForVersion(rootFolder, version, depth = 0) {
    if (depth >= 3) {
        return;
    }
    // Get the list of files in the current folder
    const files = fs.readdirSync(rootFolder);

    // Iterate through each file
    files.forEach((file) => {
        if (file === '.git' || file === '.github') {
            return;
        }
        // Get the full path of the current file
        const filePath = path.join(rootFolder, file);
        console.log(depth, file, filePath);
        // Check if the current file is a directory
        if (fs.statSync(filePath).isDirectory()) {
            // If it is a directory, recursively call the function on that directory
            searchForVersion(filePath, version, depth + 1);
        } else if (file === 'package.json') {
            // If it is a package.json file, read its content
            const content = fs.readFileSync(filePath, 'utf-8');

            try {
                // Parse the JSON content
                const packageJson = JSON.parse(content);

                // Check if dependencies or devDependencies have the specified version
                checkDependencies(packageJson.dependencies, version, filePath);
                checkDependencies(packageJson.devDependencies, version, filePath);
            } catch (error) {
                console.error(`Error parsing ${filePath}: ${error.message}`);
            }
        }
    });
}

// Function to check dependencies for a specific version
function checkDependencies(dependencies, version, filePath) {
    console.log(dependencies, filePath);
    if (dependencies) {
        Object.keys(dependencies).forEach((dependency) => {
            const depVersion = dependencies[dependency];
            if (depVersion === version) {
                console.log(`Found ${dependency}@${version} in ${filePath}`);
            }
        });
    }
}

// Specify the root folder to start the search
const rootFolder = './';

// Specify the version to search for
const targetVersion = '1.0.0';

// Start the search
searchForVersion(rootFolder, targetVersion);
