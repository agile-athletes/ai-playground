const fs = require('fs').promises;

/**
 * Writes data to a file.
 *
 * @param {string} filePath - The path to the file.
 * @param {object|string} data - The data to write. If an object is passed, it will be stringified as JSON.
 * @returns {Promise<void>}
 */
async function writeToFile(filePath, data) {
    try {
        const content = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`File written successfully to ${filePath}`);
    } catch (error) {
        console.error('Error writing file:', error);
        throw error;
    }
}

/**
 * Reads data from a file.
 *
 * @param {string} filePath - The path to the file.
 * @returns {Promise<object|string>} - Parsed JSON if possible, otherwise raw string.
 */
async function readFromFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        // Try to parse JSON, if applicable
        try {
            return JSON.parse(content);
        } catch {
            return content;
        }
    } catch (error) {
        console.error('Error reading file:', error);
        throw error;
    }
}

// Example usage:
// (async () => {
//     const filePath = './example.json';
//     const dataToWrite = { message: 'Hello, world!', timestamp: new Date() };
//
//     await writeToFile(filePath, dataToWrite);
//     const dataRead = await readFromFile(filePath);
//     console.log('Data read from file:', dataRead);
// })();
