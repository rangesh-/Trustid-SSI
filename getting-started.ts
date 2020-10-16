
// Load SDK library.
const sdk = require("../dist/index.js");
const fs = require("fs");
import { AccessPolicy, PolicyType} from "../dist/src/network/trustInterface";

import {FileKeystore} from "../dist/src/keystore/fileKeystore";


// Create new wallet. It follows a singleton approach.
const wal = sdk.Wallet.Instance;
console.log(wal)

// Initialize new FileKeystore with storage at ./keystore
const ks = new sdk.FileKeystore("file","./keystore/keystore");
wal.setKeystore(ks)
// ks.loadKeystore('file', '../keystore')

const ccp = JSON.parse(fs.readFileSync("../ccp.json", 'utf8'));

//console.log(ccp);
const config = {
    stateStore: '/tmp/statestore',
    caURL: 'https://localhost:7054',
    caName: 'ca-org1',
    caAdmin: 'admin',
    caPassword: 'adminpw',
    tlsOptions: {
        trustedRoots: "-----BEGIN CERTIFICATE-----\nMIICJzCCAc2gAwIBAgIUQsrklE6eXHoPGdDu1kgMqL77Z4AwCgYIKoZIzj0EAwIw\ncDELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMQ8wDQYDVQQH\nEwZEdXJoYW0xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMTE2Nh\nLm9yZzEuZXhhbXBsZS5jb20wHhcNMjAwOTI2MTIzMDAwWhcNMzUwOTIzMTIzMDAw\nWjBwMQswCQYDVQQGEwJVUzEXMBUGA1UECBMOTm9ydGggQ2Fyb2xpbmExDzANBgNV\nBAcTBkR1cmhhbTEZMBcGA1UEChMQb3JnMS5leGFtcGxlLmNvbTEcMBoGA1UEAxMT\nY2Eub3JnMS5leGFtcGxlLmNvbTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABHN3\nCYGUeEAUM/5JG6XG9Y4piVTnXvyPgw+HKRvXx3JOU1QYkJffEzeDjN6GlGTEH3HT\n5hfIhrnC1AcdHLhXyQijRTBDMA4GA1UdDwEB/wQEAwIBBjASBgNVHRMBAf8ECDAG\nAQH/AgEBMB0GA1UdDgQWBBTSdSOfTWbx478R5Uo1nMywdj4vxTAKBggqhkjOPQQD\nAgNIADBFAiEA4nx4g15h2+2G0YXzK6eQyi8EK+cTzdSsFsXHZvjWyXACIGU4v70u\nTtsez5oS06Lpei2IKpeLl9hxpNMCM3/FJSRr\n-----END CERTIFICATE-----\n",
        verify: false
    },
    mspId: 'Org1MSP',
    walletID: 'admin',
    asLocalhost: true,
    ccp: ccp,
    chaincodeName: "basic",
    fcn: "proxy",
    channel: "mychannel"
}

async function configureNetwork() {
    console.log("[*] Configuring network driver...")
    // Create HF driver
    var trustID = new sdk.TrustIdHf(config);
    // Add and configure the network driver in our wallet.
    wal.addNetwork("hf", trustID);
    await wal.networks["hf"].configureDriver()
}

// Create you own DID key pair and register it in the TrustID platform.
async function createDID(){
    // Generate key pair locally.
    const did = await wal.generateDID("RSA", "test", "test")
    console.log("[*] Generated DID: \n", did)
    await did.unlockAccount("test")
    // Register in the platform.
    await wal.networks.hf.createSelfIdentity(did)
    console.log("[*] Self identity registered")
    wal.setDefault(did)
    // Get the registered identity.
    let res = await wal.networks.hf.getIdentity(did, did.id)
    console.log("[*] Get registered identity\n", res)
}

// Interact with a service in the platform (you need to create a service before
// being able to call it).
async function serviceInteraction(){
    const did = await wal.getDID("default")

    console.log(did);
    
    // Get service
    let access: AccessPolicy = {policy: PolicyType.PublicPolicy, threshold: 0, registry:{}};

  //let res1= await wal.networks.hf.createService(did,"basic1","basic1",access,"mychannel");
   //console.log(res1);
    let res = await wal.networks.hf.getService(did, "basic1")
    console.log("[*] Service info:\n", res)
    // Create an asset in the service
    const asset = {ID: "asset12", Color: "blue", Size: 5, Owner: "Tomoko", AppraisedValue: 300}
    const assetStr = JSON.stringify(asset)
   
  //  res = await wal.networks.hf.invoke(did, "basic1",["createAsset","asset18","blue",5,"Y",300], "mychannel")
   // console.log("[*] Asset creation:\n", res)
    // Get the created asset.
    res = await wal.networks.hf.invoke(did, "basic1",["ReadAsset","asset18" ], "mychannel")
    console.log("[*] Asset registered\n", res)
}

// Use the wallet to make offchain interactions with your DID
async function walletInteraction(){
    const did = await wal.getDID("default")
 
    const payload = {hello: "AWESOME PROJECT!!!"}
    console.log("[*] Signing payload: \n", payload)
    const sign = await did.sign(payload)
    console.log("[*] DID signature\n", sign)
    console.log(did);
    let verify = await did.verify(sign, did)
    console.log("[*] Signature verification\n", verify)
    const did2 = await wal.generateDID("RSA", "test", "test")
    verify = await did.verify(sign, did2)
    console.log("[*] Signature wrong verification\n", verify)
}

// Main async function.
async function main() {
    await configureNetwork()
    await createDID()
    await serviceInteraction()
    await walletInteraction()
}

main().then(console.log).catch(console.log)
// tsc getting-started.ts && node getting-started.js
