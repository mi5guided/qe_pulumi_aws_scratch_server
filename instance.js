"use strict";
const aws = require("@pulumi/aws");
const pulumi = require("@pulumi/pulumi");
const awsNetwork = require("./network");
const events = require('events');

// Default module values
let modConfig = {
  "amiId"        : "",
  "size"         : "t3.nano",
  "prefix"       : "qe",
  "ports"        : [22],
  "keyMaterial"  : "",
  "userData"     : 
  `#!/bin/bash
  echo "Hello, World! FINALLY GOT THIS WORKING!" > index.html
  nohup python -m SimpleHTTPServer 80 &`
};
let rsrcPulumiNetwork = {};
var eventEmitter = new events.EventEmitter();

// ****************************************************************************
// Configure module
// ****************************************************************************
function setModuleConfig(parm) {
  if (parm.amiId !== undefined) {
    modConfig.amiId = parm.amiId;
  }
  if (parm.size !== undefined) {
    modConfig.size = parm.size;
  }
  if (parm.prefix !== undefined) {
    modConfig.prefix = parm.prefix;
  }
  if (parm.ports !== undefined) {
    modConfig.ports = parm.ports;
  }
  if (parm.keyMaterial !== undefined) {
    modConfig.keyMaterial = parm.keyMaterial;
  }
  if (parm.userData !== undefined) {
    modConfig.userData = parm.userData;
  }
}

// ****************************************************************************
// Get AMI IDs
// ****************************************************************************
function getAMIs() {
  const awsLinux = pulumi.output(aws.getAmi({
    filters: [
      { "name": "architecture", "values": ["x86_64"]},
      { "name": "is-public", "values":["true"] },
      { "name": "virtualization-type", "values":["hvm"] },
      { "name": "name", "values":["amzn2-ami-hvm-2.0*-gp2"] }
    ],
    owners: ["amazon"],
    mostRecent: true
  })).apply(result => result.id);
  modConfig.amiId = awsLinux;
}

// ****************************************************************************
// Create resources
// ****************************************************************************
function rsrcPulumiCreate() {
  let sgParam = {vpcId:awsNetwork.pulumiResources.vpc.id, ingress:[]};

  for (let i=0; i<modConfig.ports.length; i++) {
    sgParam.ingress.push({
      protocol: "tcp",
      fromPort: modConfig.ports[i],
      toPort: modConfig.ports[i],
      cidrBlocks: ["0.0.0.0/0"]
    });
  }
  rsrcPulumiNetwork.group = new aws.ec2.SecurityGroup(modConfig.prefix+"SecurityGroup", sgParam);

  rsrcPulumiNetwork.keypair = new aws.ec2.KeyPair(modConfig.prefix+"KeyPair", {
    keyName  : "generic-keypair.pem",
    publicKey: modConfig.keyMaterial
  });

  rsrcPulumiNetwork.server = new aws.ec2.Instance(modConfig.prefix+"Instance", {
    tags: { "Name": modConfig.prefix+"Instance" },
    subnetId: awsNetwork.pulumiResources.subnet0.id,
    associatePublicIpAddress: true,
    instanceType: modConfig.size,
    securityGroups: [ rsrcPulumiNetwork.group.id ],
    ami: modConfig.amiId,
    keyName: rsrcPulumiNetwork.keypair.keyName,
    userData: modConfig.userData
  });
}

// ****************************************************************************
// Custom output
// ****************************************************************************
function postDeploy() {
  pulumi.all([
    rsrcPulumiNetwork.server.id,
    rsrcPulumiNetwork.server.publicIp,
    rsrcPulumiNetwork.keypair.keyName
  ]).apply(([x,y,z]) => {
    console.log("Instance Info", x,y,z);
    console.log("ssh -i",z,"ec2-user@"+y)
  });
}

// ****************************************************************************
// API into this module
// ****************************************************************************
function ddStart(params) {
  setModuleConfig(params);

  // if no AMI specified, go find a recent AMI
  if (modConfig.amiId === "") {
    getAMIs();
  }
  rsrcPulumiCreate();
  postDeploy();
}

module.exports.ddStart = ddStart;
module.exports.pulumiResources = rsrcPulumiNetwork;
