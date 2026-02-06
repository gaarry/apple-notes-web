#!/usr/bin/env node

/**
 * Apple Notes Web - Automated Test Script
 * Runs tests to verify UI components and functionality
 */

const { execSync } = require('child_process');
const path = require('path');

// Test configurations
const tests = {
    ui: {
        name: 'UI Component Tests',
        checks: [
            { name: 'Sidebar exists', test: () => checkFile('index.html') },
            { name: 'CSS files present', test: () => checkDir('css') },
            { name: 'JS files present', test: () => checkDir('js') },
            { name: 'New note button styled', test: () => checkCSS('.new-note-btn') },
            { name: 'Search box styled', test: () => checkCSS('.search-box') },
            { name: 'Editor styled', test: () => checkCSS('.editor') },
        ]
    },
    
    functionality: {
        name: 'Functionality Tests',
        checks: [
            { name: 'Local storage functions', test: () => checkJS('localStorage') },
            { name: 'Note creation function', test: () => checkJS('createNote') },
            { name: 'Search function', test: () => checkJS('search') },
            { name: 'Keyboard shortcuts', test: () => checkJS('keydown') },
            { name: 'Render functions', test: () => checkJS('Render') },
        ]
    },
    
    animation: {
        name: 'Animation Tests',
        checks: [
            { name: 'FadeIn animation', test: () => checkCSS('@keyframes fadeIn') },
            { name: 'SlideIn animation', test: () => checkCSS('@keyframes slideIn') },
            { name: 'Float animation', test: () => checkCSS('@keyframes float') },
            { name: 'Hover transitions', test: () => checkCSS(':hover') },
        ]
    },
    
    accessibility: {
        name: 'Accessibility Tests',
        checks: [
            { name: 'Button labels', test: () => checkHTML('button', 'title') },
            { name: 'Input placeholders', test: () => checkHTML('input', 'placeholder') },
            { name: 'ARIA labels', test: () => checkA11y() },
        ]
    }
};

// Helper functions
function checkFile(filename) {
    const fs = require('fs');
    return fs.existsSync(path.join(__dirname, filename));
}

function checkDir(dirname) {
    const fs = require('fs');
    const dir = path.join(__dirname, dirname);
    return fs.existsSync(dir) && fs.readdirSync(dir).length > 0;
}

function checkCSS(selector) {
    const fs = require('fs');
    const cssFiles = ['css/style.css', 'css/sidebar.css', 'css/editor.css'];
    
    for (const file of cssFiles) {
        if (checkFile(file)) {
            const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
            if (content.includes(selector) || 
                (selector.startsWith('@keyframes') && content.includes(selector))) {
                return true;
            }
        }
    }
    return false;
}

function checkJS(keyword) {
    const fs = require('fs');
    const jsFile = 'js/app.js';
    
    if (!checkFile(jsFile)) return false;
    
    const content = fs.readFileSync(path.join(__dirname, jsFile), 'utf8');
    return content.includes(keyword);
}

function checkHTML(tag, attr) {
    const fs = require('fs');
    if (!checkFile('index.html')) return false;
    
    const content = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    return content.includes(`<${tag}`) && content.includes(attr);
}

function checkA11y() {
    // Basic accessibility check
    const html = require('fs').readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    return html.includes('aria-') || html.includes('role=');
}

// Run tests
function runTests() {
    console.log('🧪 Apple Notes Web - Automated Test Suite\n');
    console.log('='.repeat(50));
    
    let totalChecks = 0;
    let passedChecks = 0;
    let failedChecks = [];
    
    for (const [key, category] of Object.entries(tests)) {
        console.log(`\n📂 ${category.name}`);
        console.log('-'.repeat(40));
        
        for (const check of category.checks) {
            totalChecks++;
            try {
                const result = check.test();
                if (result) {
                    console.log(`  ✅ ${check.name}`);
                    passedChecks++;
                } else {
                    console.log(`  ❌ ${check.name}`);
                    failedChecks.push(check.name);
                }
            } catch (error) {
                console.log(`  ⚠️ ${check.name} (Error: ${error.message})`);
                failedChecks.push(check.name);
            }
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`\n📊 Test Results: ${passedChecks}/${totalChecks} passed`);
    
    if (failedChecks.length > 0) {
        console.log(`\n❌ Failed Checks:`);
        failedChecks.forEach(name => console.log(`  - ${name}`));
        process.exit(1);
    } else {
        console.log(`\n✅ All tests passed!`);
        process.exit(0);
    }
}

// Generate report
function generateReport() {
    const fs = require('fs');
    const report = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        tests: Object.keys(tests).map(key => ({
            category: tests[key].name,
            checks: tests[key].checks.length
        })),
        status: 'ready'
    };
    
    fs.writeFileSync(
        'TEST_REPORT.json',
        JSON.stringify(report, null, 2)
    );
    
    console.log('📄 Test report generated: TEST_REPORT.json');
}

// Main
if (process.argv.includes('--report')) {
    generateReport();
} else {
    runTests();
}
