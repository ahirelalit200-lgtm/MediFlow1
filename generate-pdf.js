// Generate PDF from COMPLETE_FEATURES_LIST.md
// This script converts the markdown file to a PDF

const fs = require('fs');
const path = require('path');

console.log('📄 PDF Generation Script');
console.log('========================\n');

console.log('To generate a PDF from COMPLETE_FEATURES_LIST.md, you have several options:\n');

console.log('Option 1: Use an online converter');
console.log('  1. Open https://www.markdowntopdf.com/');
console.log('  2. Upload COMPLETE_FEATURES_LIST.md');
console.log('  3. Download the generated PDF\n');

console.log('Option 2: Use VS Code extension');
console.log('  1. Install "Markdown PDF" extension in VS Code');
console.log('  2. Open COMPLETE_FEATURES_LIST.md');
console.log('  3. Right-click → "Markdown PDF: Export (pdf)"\n');

console.log('Option 3: Use npm package (recommended)');
console.log('  Run these commands:');
console.log('  npm install -g md-to-pdf');
console.log('  md-to-pdf COMPLETE_FEATURES_LIST.md\n');

console.log('Option 4: Use pandoc (if installed)');
console.log('  pandoc COMPLETE_FEATURES_LIST.md -o COMPLETE_FEATURES_LIST.pdf\n');

console.log('Option 5: Print to PDF from browser');
console.log('  1. Open the HTML version (creating now...)\n');

// Create HTML version for browser printing
const mdContent = fs.readFileSync('COMPLETE_FEATURES_LIST.md', 'utf8');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SmileCare - Complete Features List</title>
  <style>
    @media print {
      @page {
        margin: 1.5cm;
        size: A4;
      }
      body {
        font-size: 11pt;
      }
      h1 {
        page-break-before: always;
      }
      h1:first-of-type {
        page-break-before: avoid;
      }
      pre, blockquote {
        page-break-inside: avoid;
      }
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #333;
      background: #f9f9f9;
    }
    
    .container {
      background: white;
      padding: 40px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      border-radius: 8px;
    }
    
    h1 {
      color: #1976d2;
      border-bottom: 3px solid #1976d2;
      padding-bottom: 10px;
      margin-top: 30px;
    }
    
    h2 {
      color: #2196F3;
      margin-top: 25px;
      border-left: 4px solid #2196F3;
      padding-left: 15px;
    }
    
    h3 {
      color: #42A5F5;
      margin-top: 20px;
    }
    
    h4 {
      color: #64B5F6;
    }
    
    code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      color: #d32f2f;
    }
    
    pre {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      border-left: 4px solid #1976d2;
    }
    
    pre code {
      background: none;
      color: #333;
    }
    
    ul, ol {
      margin-left: 20px;
      margin-bottom: 15px;
    }
    
    li {
      margin-bottom: 8px;
    }
    
    strong {
      color: #1976d2;
    }
    
    hr {
      border: none;
      border-top: 2px solid #e0e0e0;
      margin: 30px 0;
    }
    
    .emoji {
      font-size: 1.2em;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    
    th {
      background: #1976d2;
      color: white;
    }
    
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1976d2;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 1000;
    }
    
    .print-button:hover {
      background: #1565c0;
    }
    
    @media print {
      .print-button {
        display: none;
      }
      .container {
        box-shadow: none;
        padding: 0;
      }
      body {
        background: white;
      }
    }
    
    .checkmark {
      color: #4CAF50;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <button class="print-button" onclick="window.print()">🖨️ Print to PDF</button>
  <div class="container">
    <div id="content"></div>
  </div>
  
  <script>
    // Simple markdown to HTML converter
    const markdown = \`${mdContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
    
    let html = markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
      // Checkmarks
      .replace(/✅/g, '<span class="checkmark">✅</span>')
      // Code blocks
      .replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, '<pre><code>$1</code></pre>')
      // Inline code
      .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
      // Lists
      .replace(/^\\- (.*$)/gim, '<li>$1</li>')
      // Horizontal rules
      .replace(/^---$/gim, '<hr>')
      // Line breaks
      .replace(/\\n\\n/g, '</p><p>')
      .replace(/\\n/g, '<br>');
    
    // Wrap list items in ul
    html = html.replace(/(<li>.*<\\/li>)/s, '<ul>$1</ul>');
    
    // Wrap in paragraphs
    html = '<p>' + html + '</p>';
    
    document.getElementById('content').innerHTML = html;
  </script>
</body>
</html>`;

fs.writeFileSync('COMPLETE_FEATURES_LIST.html', htmlContent);

console.log('✅ Created: COMPLETE_FEATURES_LIST.html');
console.log('\nTo create PDF:');
console.log('1. Open COMPLETE_FEATURES_LIST.html in your browser');
console.log('2. Click the "Print to PDF" button (or press Ctrl+P)');
console.log('3. Select "Save as PDF" as the printer');
console.log('4. Click "Save"\n');

console.log('📁 File location:');
console.log('   ' + path.resolve('COMPLETE_FEATURES_LIST.html') + '\n');
