# qe_pulumi_aws_webserver
A Quick Environment web server using node.js. This project uses Pulumi/node.js to stand up the environment

## Install Pulumi
  - curl -fsSL https://get.pulumi.com | sh
  - npm install @pulumi/aws @pulumi/pulumi

## Source Files
  - index.js: main entry point for the program
  - network.js: module to create the VPC, etc
  - instance.js: module to create the ec2 instance
