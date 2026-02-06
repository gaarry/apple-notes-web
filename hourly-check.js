#!/usr/bin/env node

/**
 * Apple Notes Web - Hourly Optimization Check
 * 
 * 这个脚本每小时自动运行，检查项目状态并生成优化建议
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_DIR = path.join(__dirname);
const LOG_FILE = path.join(PROJECT_DIR, 'optimization.log');

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    
    console.log(message);
    fs.appendFileSync(LOG_FILE, logMessage);
}

function runTests() {
    log('🧪 Running automated tests...');
    
    try {
        execSync('node test.js', { cwd: PROJECT_DIR, stdio: 'inherit' });
        log('✅ All tests passed!');
        return true;
    } catch (error) {
        log('❌ Tests failed!');
        return false;
    }
}

function checkDeployment() {
    log('🌐 Checking deployment status...');
    
    // Check if Vercel deployment is successful
    try {
        const response = execSync(
            'curl -s https://api.github.com/repos/gaarry/apple-notes-web/deployments',
            { encoding: 'utf8', timeout: 10000 }
        );
        
        if (response.includes('apple-notes-web-five.vercel.app')) {
            log('✅ Deployment is active');
            return true;
        }
    } catch (error) {
        log('⚠️ Could not verify deployment');
    }
    
    return false;
}

function checkPerformance() {
    log('⚡ Checking performance metrics...');
    
    // Check file sizes
    const files = [
        { name: 'index.html', max: 10 },
        { name: 'css/style.css', max: 10 },
        { name: 'css/sidebar.css', max: 10 },
        { name: 'js/app.js', max: 20 }
    ];
    
    let allGood = true;
    
    for (const file of files) {
        const filepath = path.join(PROJECT_DIR, file.name);
        
        if (fs.existsSync(filepath)) {
            const size = fs.statSync(filepath).size / 1024; // KB
            
            if (size > file.max) {
                log(`⚠️ ${file.name} is ${size.toFixed(1)}KB (max: ${file.max}KB)`);
                allGood = false;
            }
        }
    }
    
    if (allGood) {
        log('✅ All file sizes are within limits');
    }
    
    return allGood;
}

function generateSuggestions() {
    log('💡 Optimization Suggestions:');
    log('');
    log('1. Consider migrating to React for better maintainability');
    log('2. Add more animation effects');
    log('3. Implement dark mode toggle');
    log('4. Add note export functionality (PDF, Markdown)');
    log('5. Implement folder/tag system');
    log('6. Add collaboration features');
    log('');
}

function main() {
    log('');
    log('='.repeat(60));
    log('🍎 Apple Notes Web - Hourly Optimization Check');
    log('='.repeat(60));
    log('');
    
    // Run tests
    const testsPassed = runTests();
    
    // Check deployment
    const deployed = checkDeployment();
    
    // Check performance
    const performant = checkPerformance();
    
    // Generate suggestions
    generateSuggestions();
    
    // Summary
    log('');
    log('='.repeat(60));
    log('📊 Summary:');
    log(`  Tests: ${testsPassed ? '✅ Passed' : '❌ Failed'}`);
    log(`  Deployment: ${deployed ? '✅ Active' : '⚠️ Unknown'}`);
    log(`  Performance: ${performant ? '✅ Good' : '⚠️ Issues'}`);
    log('='.repeat(60));
    log('');
}

// Run if executed directly
if (require.main === module) {
    main();
}

module.exports = { runTests, checkDeployment, checkPerformance, generateSuggestions };
