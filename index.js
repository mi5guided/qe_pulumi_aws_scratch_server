// ****************************************************************************
// Main Entry Point for this Pulumi Project
//   Segemented out 2 modules: Networking and EC2 instance.
//   Looking into the promise of better modules
// ****************************************************************************

"use strict";
const awsNetwork = require("./network");
const awsInstance = require("./instance");

// Define and Deploy networking
var netParams = {
  "cidr"    : "10.100.0.0/24",
  "subnets" : 4,
  "prefix"  : "qews"
};
awsNetwork.ddStart(netParams);

// Define and Deploy ec2 instance
var ec2Params = {
  "amiId"   : "",
  "size"    : "t3.nano",
  "ports"   : [80,22],
  "prefix"  : "qews"
};
awsInstance.ddStart(ec2Params);
