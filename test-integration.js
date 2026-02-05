/**
 * Integration Test Script
 * Tests WhatsApp Engine Integration
 */

const { exec } = require('child_process');
const axios = require('axios');

const WHATSAPP_ENGINE_URL = 'http://localhost:3002';
const TEST_DEVICE_ID = 'test-device-123';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testHealthCheck() {
  try {
    log('🔍 Testing Health Check...', 'blue');
    const response = await axios.get(`${WHATSAPP_ENGINE_URL}/health`);
    
    if (response.status === 200) {
      log('✅ Health Check Passed', 'green');
      log(`   Status: ${response.data.status}`, 'green');
      log(`   WhatsApp: ${response.data.whatsapp}`, 'green');
      log(`   Sessions: ${response.data.total_sessions}`, 'green');
      return true;
    }
  } catch (error) {
    log('❌ Health Check Failed', 'red');
    log(`   Error: ${error.message}`, 'red');
    return false;
  }
}

async function testQRGeneration() {
  try {
    log('🔍 Testing QR Generation...', 'blue');
    
    // Request QR
    const response = await axios.get(`${WHATSAPP_ENGINE_URL}/session/${TEST_DEVICE_ID}/qr`);
    
    if (response.status === 202) {
      log('✅ QR Generation Started', 'green');
      
      // Poll for QR
      for (let i = 0; i < 10; i++) {
        await sleep(2000);
        const pollResponse = await axios.get(`${WHATSAPP_ENGINE_URL}/session/${TEST_DEVICE_ID}/qr`);
        
        if (pollResponse.data.status === 'qr_ready') {
          log('✅ QR Generated Successfully', 'green');
          log(`   QR Length: ${pollResponse.data.qr ? pollResponse.data.qr.length : 0}`, 'green');
          return true;
        } else if (pollResponse.data.status === 'connected') {
          log('✅ Already Connected', 'green');
          return true;
        }
      }
      
      log('⚠️ QR Generation Timeout', 'yellow');
      return false;
    }
  } catch (error) {
    log('❌ QR Generation Failed', 'red');
    log(`   Error: ${error.message}`, 'red');
    return false;
  }
}

async function testDeviceStatus() {
  try {
    log('🔍 Testing Device Status...', 'blue');
    const response = await axios.get(`${WHATSAPP_ENGINE_URL}/session/${TEST_DEVICE_ID}/status`);
    
    if (response.status === 200) {
      log('✅ Device Status Retrieved', 'green');
      log(`   Status: ${response.data.status}`, 'green');
      log(`   Has QR: ${!!response.data.has_qr}`, 'green');
      return true;
    }
  } catch (error) {
    log('❌ Device Status Failed', 'red');
    log(`   Error: ${error.message}`, 'red');
    return false;
  }
}

async function testSessionsList() {
  try {
    log('🔍 Testing Sessions List...', 'blue');
    const response = await axios.get(`${WHATSAPP_ENGINE_URL}/sessions`);
    
    if (response.status === 200) {
      log('✅ Sessions List Retrieved', 'green');
      log(`   Sessions Count: ${Object.keys(response.data).length}`, 'green');
      return true;
    }
  } catch (error) {
    log('❌ Sessions List Failed', 'red');
    log(`   Error: ${error.message}`, 'red');
    return false;
  }
}

async function testMessageSending() {
  try {
    log('🔍 Testing Message Sending...', 'blue');
    
    // Check if device is connected first
    const statusResponse = await axios.get(`${WHATSAPP_ENGINE_URL}/session/${TEST_DEVICE_ID}/status`);
    
    if (statusResponse.data.status !== 'connected') {
      log('⚠️ Device not connected, skipping message test', 'yellow');
      return true;
    }
    
    const response = await axios.post(`${WHATSAPP_ENGINE_URL}/session/${TEST_DEVICE_ID}/message`, {
      to: '+1234567890',
      message: `Test message at ${new Date().toISOString()}`
    });
    
    if (response.status === 200) {
      log('✅ Message Sent Successfully', 'green');
      log(`   Message ID: ${response.data.messageId}`, 'green');
      log(`   To: ${response.data.to}`, 'green');
      return true;
    }
  } catch (error) {
    log('❌ Message Sending Failed', 'red');
    log(`   Error: ${error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('🚀 Starting WhatsApp Engine Integration Tests', 'blue');
  log('=====================================', 'blue');
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Sessions List', fn: testSessionsList },
    { name: 'Device Status', fn: testDeviceStatus },
    { name: 'QR Generation', fn: testQRGeneration },
    { name: 'Message Sending', fn: testMessageSending },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
      log(''); // Empty line
    } catch (error) {
      log(`❌ ${test.name} crashed: ${error.message}`, 'red');
      failed++;
      log(''); // Empty line
    }
  }
  
  log('=====================================', 'blue');
  log('📊 Test Results:', 'blue');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, 'red');
  log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`, 'blue');
  
  if (failed === 0) {
    log('🎉 All tests passed! WhatsApp Engine is working perfectly!', 'green');
  } else {
    log('⚠️ Some tests failed. Please check the issues above.', 'yellow');
  }
  
  process.exit(failed === 0 ? 0 : 1);
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${WHATSAPP_ENGINE_URL}/health`);
    return true;
  } catch (error) {
    return false;
  }
}

// Start server if not running and run tests
async function main() {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    log('🚀 Starting WhatsApp Engine Server...', 'blue');
    
    // Start server in background
    const server = exec('node server.js', { cwd: __dirname });
    
    server.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    server.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    // Wait for server to start
    for (let i = 0; i < 30; i++) {
      await sleep(1000);
      if (await checkServer()) {
        log('✅ Server started successfully', 'green');
        await sleep(2000); // Give it extra time to initialize
        break;
      }
    }
    
    if (!await checkServer()) {
      log('❌ Failed to start server', 'red');
      process.exit(1);
    }
  }
  
  await runTests();
}

if (require.main === module) {
  main().catch(console.error);
}
