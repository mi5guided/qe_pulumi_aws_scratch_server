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
      "prefix"      : "qews",
      "userData"    :
      `#!/bin/bash
      sudo yum -y update
      sudo yum -y install git
      sudo yum -y install htop
      cd /home/ec2-user

      # install node.js via nvm
      curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
      export NVM_DIR="$HOME/.nvm"
      [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
      [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
      nvm install 10

      # install pulumi
      sudo -u ec2-user mkdir -p /home/ec2-user/.pulumi/bin
      curl -fsSL https://get.pulumi.com | sudo -u ec2-user sh
      npm install @pulumi/aws @pulumi/pulumi
      echo 'export PATH=$PATH:/home/ec2-user/.pulumi/bin' >> /home/ec2-user/.bashrc

      # install the project
      sudo -u ec2-user git clone https://github.com/mi5guided/qe_pulumi_aws_webserver.git
      `
    };
    awsInstance.ddStart(ec2Params);
  } catch (err) {
    console.error(err);
  }
}

syncExecution();