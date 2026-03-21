const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'error_out.txt');
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf16le');
  console.log(content.slice(-4000)); // Print last 4000 characters
} else {
  console.log('File not found');
}
