"use strict";
const aws = require("@pulumi/aws");
const pulumi = require("@pulumi/pulumi");
const AWSCore = require('aws-sdk');
const awsNetwork = require("./network");
const events = require('events');

// Default module values
let modConfig = {
  "amiId"        : "",
  "size"         : "t3.nano",
  "prefix"       : "qe",
  "ports"        : [22],
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
  if (parm.userData !== undefined) {
    modConfig.userData = parm.userData;
  }
}

// ****************************************************************************
// Get AMI IDs
// ****************************************************************************
async function getAMIs() {
  let configPulumi = new pulumi.Config("aws");
  var ec2 = new AWSCore.EC2({"region": configPulumi.get("region")});
  let amiList = [];
  let amiNameList = [];
  let aznLinuxExp = /Amazon Linux 2.+gp2/;
  let sinceDate = Date.parse("01 May 2019");
  var params = { 
    "Owners" : [ "amazon" ],
    "Filters": [
      { "Name":"architecture", "Values":["x86_64"] },
      { "Name": "is-public", "Values":["true"] },
      { "Name":"virtualization-type", "Values":["hvm"] }
    ]
  };

  try {
    let amImages = await ec2.describeImages(params).promise();
    amImages.Images.forEach((x) => {
      let descParse;
      if (x.Description != undefined) {
        descParse = x.Description.match(aznLinuxExp);
      } else {
        descParse = null;
      }
      if (sinceDate < Date.parse(x.CreationDate) && (descParse)){
        amiList.push(x.ImageId);
        amiNameList.push(x.Name);
      }
    });
    console.log(amiList.length,"images found");
    console.log("using:",amiList[0],amiNameList[0]);
    modConfig.amiId = amiList[0];
    eventEmitter.emit('doneAMI');
  } catch (err) {
    console.log("error:", err);
    return(null);
  }
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
    publicKey:"ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDgYN11f/qoujD4cUw6K//770absgxNg/8vD+zoVEVOtrSWlaRVeUmzqQ05wNAk1QrO+mXnhkGIq0AIN4g0g58/G5HdZNqCWvaTHmgWiXlQf1x96IGEw+D4hdFNKW5V8uZWXbQp0qZhXDJF8JJGo0ai98ovL3ihSZj0G6wNkJEhjUSysBn95COfgZfgEzGyPkC79HX+5C+ksA7KTXX/Ky161456JziwYW0ECZ+F0b55cZX6iRIWmO6nWXdELfZTOsOXKKSULp6zAxYPmVFRYUni0d1mOdVhAgIJ4IrXgdi3Q8IqNc13PaLK1UZtIVQKmSANdIJV7R4L0sKiRzCuQYQV dougyoon@doug-ext-usb"
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

  // need to call this here, since sometimes, we get called from an event
  postDeploy();
}

// ****************************************************************************
// Custom output
// ****************************************************************************
function postDeploy() {
  pulumi.all([
    rsrcPulumiNetwork.server.id,
    rsrcPulumiNetwork.server.publicIp,
    rsrcPulumiNetwork.keypair.keyName
  ]).apply(([x,y]) => {
    console.log("Instance Info", x,y,z);
    console.log("ssh -i",z,"ec2_user@"+y)
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
    eventEmitter.on('doneAMI',rsrcPulumiCreate);
  } else {
    rsrcPulumiCreate();
  }
}

module.exports.ddStart = ddStart;
module.exports.pulumiResources = rsrcPulumiNetwork;
