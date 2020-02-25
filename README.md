# Quick Environment: Simple Server using Pulumi AWS node.js
A Quick Environment for a simple scratch linux server in AWS. This project uses Pulumi/node.js to stand up the environment.<br/>
*NOTE:* this project assumes you are running Pulumi from Linux (e.g. calls to ssh-keygen)

## Install Pulumi
```
  $ curl -fsSL https://get.pulumi.com | sh
  $ npm install @pulumi/aws @pulumi/pulumi
```

## Install this project
```
  $ mkdir pulumi-project
  $ cd pulumi-project
  $ pulumi new aws-javascript # Create a new Pulumi project and stack from a template
  $ git clone https://github.com/mi5guided/qe_pulumi_aws_webserver.git .
  $ make
```

## Source Files
  - index.js: main entry point for the program<br/>
  -- will create a pem and pub file<br/>
  -- override default values in the other modules<br/>
  -- invoke the other modules<br/>
  - network.js: module to create the VPC, etc
  - instance.js: module to create the ec2 instance
  - utilCidr.js: utility functions for CIDR math/manipulations

## Standing up the environment
```
  $ pulumi login --local  # this will bypass the need to log into the pulumi cloud service
  $ pulumi config         # will ask about region and profile
  $ pulumi preview --json # analogous to terraform plan
  $ pulumi up             # update the stack (analogous to terraform apply)
```