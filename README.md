# qe_pulumi_aws_webserver
A Quick Environment web server using node.js. This project uses Pulumi/node.js to stand up the environment

*NOTE:* this project assumes you are running Pulumi from Linux (e.g. calls to ssh-keygen)

## Install Pulumi
```
curl -fsSL https://get.pulumi.com | sh
npm install @pulumi/aws @pulumi/pulumi
```

## Install this project
```mkdir pulumi-project
cd pulumi-project
pulumi new  # (pick aws-javascript)
git clone https://github.com/mi5guided/qe_pulumi_aws_webserver.git
mv qe_pulumi_aws_webserver/* .
make
```

## Source Files
  - index.js: main entry point for the program 
    -- will create a pem and pub file
    -- override default values in the other modules
    -- invoke the other modules
  - network.js: module to create the VPC, etc
  - instance.js: module to create the ec2 instance
  - utilCidr.js: utility functions for CIDR math/manipulations

