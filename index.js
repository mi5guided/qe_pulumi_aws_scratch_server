// ****************************************************************************
// Main Entry Point for this Pulumi Project
//   Segemented out 2 modules: Networking and EC2 instance.
//   Looking into the promise of better modules
// ****************************************************************************

"use strict";
const awsNetwork = require("./network");
const awsInstance = require("./instance");
const fs = require("fs");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

async function syncExecution() {
  let keyMaterial;
  const keyFile = "./generic-keypair.pem.pub";
  try {
    // check to see if we have a PEM key to log into the instance; if not, create one
    if (fs.existsSync(keyFile) === false) {
      const {stdout,stderr} = await exec('ssh-keygen -f generic-keypair.pem');
    }

    // Read key material
    keyMaterial = fs.readFileSync(keyFile, "utf8");
    console.log(keyMaterial);

    // Define and Deploy networking
    var netParams = {
      "cidr"    : "10.100.0.0/24",
      "subnets" : 4,
      "prefix"  : "qews"
    };
    awsNetwork.ddStart(netParams);

    // Define and Deploy ec2 instance
    var ec2Params = {
    //  "amiId"   : "ami-00c79db59589996b9",
      "amiId"       : "",
      "keyMaterial" : keyMaterial,
      "size"        : "t3.nano",
      "ports"       : [80,22],
      "prefix"      : "qews"
    };
    awsInstance.ddStart(ec2Params);
  } catch (err) {
    console.error(err);
  }
}

syncExecution();