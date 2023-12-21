const fs = require('fs');
const path = require('path');
const os = require("os");

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

function escapeData(s) {
    return toCommandValue(s)
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A')
}

function escapeProperty(s) {
    return toCommandValue(s)
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A')
        .replace(/:/g, '%3A')
        .replace(/,/g, '%2C')
}
const CMD_STRING = '::'

class Command {
    command
    message
    properties

    constructor(command, properties, message) {
        if (!command) {
            command = 'missing.command'
        }

        this.command = command
        this.properties = properties
        this.message = message
    }

    toString() {
        let cmdStr = CMD_STRING + this.command

        if (this.properties && Object.keys(this.properties).length > 0) {
            cmdStr += ' '
            let first = true
            for (const key in this.properties) {
                if (this.properties.hasOwnProperty(key)) {
                    const val = this.properties[key]
                    if (val) {
                        if (first) {
                            first = false
                        } else {
                            cmdStr += ','
                        }

                        cmdStr += `${key}=${escapeProperty(val)}`
                    }
                }
            }
        }

        cmdStr += `${CMD_STRING}${escapeData(this.message)}`
        return cmdStr
    }
}
function prepareKeyValueMessage(key, value) {
    const delimiter = `ghadelimiter_${123}`
    const convertedValue = toCommandValue(value)

    // These should realistically never happen, but just in case someone finds a
    // way to exploit uuid generation let's not allow keys or values that contain
    // the delimiter.
    if (key.includes(delimiter)) {
        throw new Error(
            `Unexpected input: name should not contain the delimiter "${delimiter}"`
        )
    }

    if (convertedValue.includes(delimiter)) {
        throw new Error(
            `Unexpected input: value should not contain the delimiter "${delimiter}"`
        )
    }

    return `${key}<<${delimiter}${os.EOL}${convertedValue}${os.EOL}${delimiter}`
}


function toCommandValue(input) {
    if (input === null || input === undefined) {
        return ''
    } else if (typeof input === 'string' || input instanceof String) {
        return input
    }
    return JSON.stringify(input)
}

 function setOutput(name, value) {
    const filePath = process.env['GITHUB_OUTPUT'] || ''
    if (filePath) {
        return issueFileCommand('OUTPUT', prepareKeyValueMessage(name, value))
    }

    process.stdout.write(os.EOL)
    issueCommand('set-output', {name}, toCommandValue(value))
}


function issueFileCommand(command, message) {
    const filePath = process.env[`GITHUB_${command}`]
    if (!filePath) {
        throw new Error(
            `Unable to find environment variable for file command ${command}`
        )
    }
    if (!fs.existsSync(filePath)) {
        throw new Error(`Missing file at path: ${filePath}`)
    }

    fs.appendFileSync(filePath, `${toCommandValue(message)}${os.EOL}`, {
        encoding: 'utf8'
    })
}

function issueCommand(
    command,
    properties,
    message
) {
    const cmd = new Command(command, properties, message)
    process.stdout.write(cmd.toString() + os.EOL)
}

searchForVersion('./');
setOutput('time', 'true');
