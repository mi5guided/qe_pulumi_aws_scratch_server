// ****************************************************************************
// Main Entry Point for this Pulumi Project
//   Segemented out 2 modules: Networking and EC2 instance.
//   Looking into the promise of better modules
// ****************************************************************************

"use strict";
awsNetwork = require("./network");
awsInstance = require("./instance");

// Define and Deploy networking
netParams = {
  "cidr"    : "10.100.0.0/24",
  "subnets" : 4,
  "prefix"  : "qews"
};
awsNetwork.ddStart(netParams);

// Define and Deploy ec2 instance
ec2Params = {
  "size"    : "t3.nano",
  "ports"   : [80,22];
};
awsInstance.ddStart(ec2Params);
