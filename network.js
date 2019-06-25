"use strict";
const aws = require("@pulumi/aws");
const pulumi = require("@pulumi/pulumi");
const AWSCore = require('aws-sdk');

// Default module values
modConfig = {
  "cidr"       : "10.200.10.0/24",
  "subnets"    : 2,
  "prefix"     : "qe",
  "subnetCIDR" : []
};
var rsrcPulumiNetwork = {};

// figure out the CIDR blocks
function subnetting(cidr) {
  cidrOcts = cidr.split("/")[0].split(".");
}

function setModuleConfig(parm) {
  if (parm.cidr !== undefined) {
    modConfig.cidr = parm.cidr;
  }
  if (parm.subnets !== undefined) {
    modConfig.subnets = parm.subnets;
  }
  if (parm.prefix !== undefined) {
    modConfig.prefix = parm.prefix;
  }

  for (let i=0; i<modConfig.subnets; i++) {
    modConfig.subnetCIDR=
  }
}

function rsrcPulumiCreate() {
  rsrcPulumiNetwork.vpc = new aws.ec2.Vpc("DY Working VPC", {
    cidrBlock: "10.10.0.0/16",
    tags: {Name: "DY Working VPC"}
  });
  
  rsrcPulumiNetwork.subnet = new aws.ec2.Subnet("DY Working Public Subnet 1", {
    cidrBlock: "10.10.1.0/24",
    tags: {Name:"DY Working Public Subnet 1"},
    vpcId: rsrcPulumiNetwork.vpc.id
  });
  
  rsrcPulumiNetwork.subnet = new aws.ec2.Subnet("DY Working Public Subnet 2", {
    cidrBlock: "10.10.2.0/24",
    tags: {Name:"DY Working Private Subnet 1"},
    vpcId: rsrcPulumiNetwork.vpc.id
  });

  rsrcPulumiNetwork.gw = new aws.ec2.InternetGateway("DY IGW", {
    tags:{Name:"DY IGW"},
    vpcId: rsrcPulumiNetwork.vpc.id
  });
  
  rsrcPulumiNetwork.routeTable = new aws.ec2.RouteTable("DY RouteTable",{vpcId:rsrcPulumiNetwork.vpc.id,tags:{Name:"DY RouteTable"}});
  
  rsrcPulumiNetwork.route = new aws.ec2.Route("DY Route", {
    destinationCidrBlock: "0.0.0.0/0",
    gatewayId: rsrcPulumiNetwork.gw.id,
    routeTableId: rsrcPulumiNetwork.routeTable.id
  });
  
  rsrcPulumiNetwork.routeTableAssociation = new aws.ec2.RouteTableAssociation("DY RouteTable Assoc", {
    routeTableId: rsrcPulumiNetwork.routeTable.id,
    subnetId: rsrcPulumiNetwork.subnet.id,
  });
  
  rsrcPulumiNetwork.group = new aws.ec2.SecurityGroup("web-secgrp", {
      ingress: [
          { protocol: "tcp", fromPort: 22, toPort: 22, cidrBlocks: ["0.0.0.0/0"] },
          { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
          { protocol: "tcp", fromPort: 8080, toPort: 8080, cidrBlocks: ["0.0.0.0/0"] },
          { protocol: "tcp", fromPort: 30, toPort: 32, cidrBlocks: ["0.0.0.0/0"] },
      ],
      vpcId:rsrcPulumiNetwork.vpc.id
  });
  
  rsrcPulumiNetwork.server = new aws.ec2.Instance("web-server-www", {
    tags: { "Name": "web-server-www" },
    subnetId: rsrcPulumiNetwork.subnet.id,
    associatePublicIpAddress: true,
    instanceType: size,
    securityGroups: [ rsrcPulumiNetwork.group.id ], // reference the group object above
    ami: ami,
    userData: userData              // start a simple web server
  });

  postDeploy();
}

// ****************************************************************************
// Custom output
// ****************************************************************************
function postDeploy() {
  let p1;
  let p2;
  let p3;

  pulumi.all([
    rsrcPulumiNetwork.server.urn,
    rsrcPulumiNetwork.server.id,
    rsrcPulumiNetwork.server.publicIp
  ]).apply(([x,y,z]) => {
    console.log("yy", x,y,z);
    p1 = x;
    p2 = y;
    p3 = z;

    console.log("in the end", p1, p2, p3);  
  });
}

function ddStart(params) {
  setModuleConfig(params);
  rsrcPulumiCreate();
}

module.exports.ddStart = ddStart;

