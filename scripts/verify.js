import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const deployedPath = path.resolve(__dirname, '../src/contracts/deployedAddress.json');
  if (!fs.existsSync(deployedPath)) {
    console.error('❌ deployedAddress.json not found. Please deploy first.');
    process.exit(1);
  }

  const deployedConfig = JSON.parse(fs.readFileSync(deployedPath, 'utf8'));
  const contractAddress = deployedConfig.address;
  console.log(`🔍 Preparing verification for PaymentLink at: ${contractAddress}`);

  const contractFile = path.resolve(__dirname, '../contracts/PaymentLink.sol');
  const sourceCode = fs.readFileSync(contractFile, 'utf8');

  const params = new URLSearchParams();
  params.append('module', 'contract');
  params.append('action', 'verifysourcecode');
  params.append('contractaddress', contractAddress);
  params.append('codeformat', 'solidity-single-file');
  params.append('contractname', 'PaymentLink');
  params.append('compilerversion', 'v0.8.20+commit.a1b79de6');
  params.append('optimizationUsed', '1');
  params.append('runs', '200');
  params.append('sourceCode', sourceCode);

  const endpoint = 'https://scan.bohr.life/api';
  console.log(`📤 Submitting verification payload to BohrScan API (${endpoint})...`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }

    console.log('📥 Response status:', response.status);
    console.log('📥 Result:', data);

    if (data && (data.status === '1' || data.message?.includes('Pass') || data.message?.includes('Submitted') || data.result?.includes('guid'))) {
      console.log('🎉 Verification request accepted successfully!');
      const guid = data.result;
      console.log(`🆔 Verification tracking GUID: ${guid}`);

      console.log('⏳ Polling verification status on explorer...');
      for (let i = 0; i < 15; i++) {
        await new Promise((res) => setTimeout(res, 4000));
        try {
          const statusRes = await fetch(`https://scan.bohr.life/api/v2/smart-contracts/${contractAddress}`);
          if (statusRes.ok) {
            const contractInfo = await statusRes.json();
            if (contractInfo.is_verified) {
              console.log('✅ Contract is now officially VERIFIED on BohrScan!');
              console.log(`🔗 Explorer URL: https://scan.bohr.life/address/${contractAddress}#code`);
              return;
            }
          }
        } catch {}
      }
      console.log(`ℹ️ Contract submitted. View status at: https://scan.bohr.life/address/${contractAddress}#code`);
    } else {
      console.log('API output:', data);
    }
  } catch (err) {
    console.error('❌ Error during verification:', err);
    process.exit(1);
  }
}

main();
