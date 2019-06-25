"use strict";
const aws = require("@pulumi/aws");
const pulumi = require("@pulumi/pulumi");
const AWSCore = require('aws-sdk');
const fs = require('fs');

var rsrcPulumi = {};
var ami;
const size = "t3.nano";    // t3.nano is really cheap
var userData =
`#!/bin/bash
echo "Hello, World! FINALLY GOT THIS WORKING!" > index.html
nohup python -m SimpleHTTPServer 80 &`;

// ****************************************************************************
// Gather environment information
// ****************************************************************************
/*
  pulumi.getStack() - returns the stack name (see Pulumi.basic-test.yaml)
  pulumi.getProject() - returns the project name (see Pulumi.yaml)
  pulumi.Config(<scope name>) - gets the configuration information for Stack, Project, or Provider scope
*/
let configPulumi = new pulumi.Config("aws");
var ec2 = new AWSCore.EC2({"region": configPulumi.get("region")});
var amiList = [];
var amiNameList = [];
var aznLinuxExp = /Amazon Linux 2.+gp2/;
var sinceDate = Date.parse("01 May 2019");

var params = { 
  "Owners" : [ "amazon" ],
  "Filters": [
    { "Name":"architecture", "Values":["x86_64"] },
    { "Name": "is-public", "Values":["true"] },
    { "Name":"virtualization-type", "Values":["hvm"] }
  ]
};

async function getAMIs() {
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
    amiList.forEach((x,i) => { console.log("xxx> "+x,amiNameList[i]); });
    ami = amiList[0];
    rsrcPulumiCreate();
  } catch (err) {
    console.log("error:", err);
    return(null);
  }
}

// ****************************************************************************
// Create resources
// ****************************************************************************
function rsrcPulumiCreate() {
  rsrcPulumi.vpc = new aws.ec2.Vpc("DY Working VPC", {
    cidrBlock: "10.10.0.0/16",
    tags: {Name: "DY Working VPC"}
  });
  
  rsrcPulumi.subnet = new aws.ec2.Subnet("DY Working Public Subnet 1", {
    cidrBlock: "10.10.1.0/24",
    tags: {Name:"DY Working Public Subnet 1"},
    vpcId: rsrcPulumi.vpc.id
  });
  
  rsrcPulumi.subnet = new aws.ec2.Subnet("DY Working Public Subnet 2", {
    cidrBlock: "10.10.2.0/24",
    tags: {Name:"DY Working Private Subnet 1"},
    vpcId: rsrcPulumi.vpc.id
  });

  rsrcPulumi.gw = new aws.ec2.InternetGateway("DY IGW", {
    tags:{Name:"DY IGW"},
    vpcId: rsrcPulumi.vpc.id
  });
  
  rsrcPulumi.routeTable = new aws.ec2.RouteTable("DY RouteTable",{vpcId:rsrcPulumi.vpc.id,tags:{Name:"DY RouteTable"}});
  
  rsrcPulumi.route = new aws.ec2.Route("DY Route", {
    destinationCidrBlock: "0.0.0.0/0",
    gatewayId: rsrcPulumi.gw.id,
    routeTableId: rsrcPulumi.routeTable.id
  });
  
  rsrcPulumi.routeTableAssociation = new aws.ec2.RouteTableAssociation("DY RouteTable Assoc", {
    routeTableId: rsrcPulumi.routeTable.id,
    subnetId: rsrcPulumi.subnet.id,
  });
  
  rsrcPulumi.group = new aws.ec2.SecurityGroup("web-secgrp", {
      ingress: [
          { protocol: "tcp", fromPort: 22, toPort: 22, cidrBlocks: ["0.0.0.0/0"] },
          { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
          { protocol: "tcp", fromPort: 8080, toPort: 8080, cidrBlocks: ["0.0.0.0/0"] },
          { protocol: "tcp", fromPort: 30, toPort: 32, cidrBlocks: ["0.0.0.0/0"] },
      ],
      vpcId:rsrcPulumi.vpc.id
  });
  
  rsrcPulumi.server = new aws.ec2.Instance("web-server-www", {
    tags: { "Name": "web-server-www" },
    subnetId: rsrcPulumi.subnet.id,
    associatePublicIpAddress: true,
    instanceType: size,
    securityGroups: [ rsrcPulumi.group.id ], // reference the group object above
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
    rsrcPulumi.server.urn,
    rsrcPulumi.server.id,
    rsrcPulumi.server.publicIp
  ]).apply(([x,y,z]) => {
    console.log("yy", x,y,z);
    p1 = x;
    p2 = y;
    p3 = z;

    console.log("in the end", p1, p2, p3);  
  });
}

// ****************************************************************************
// main body
// ****************************************************************************
getAMIs();
