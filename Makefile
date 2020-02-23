up: 
	pulumi up

down: 
	pulumi destroy

out:
	pulumi stack output

preview:
	time node preTest.js

access-test:
	aws --profile pulumitargetacct s3 ls

~/.nvm:
	# install nvm (node environment manager)
	curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.35.2/install.sh | bash

~/.pulumi/bin:
	# install pulumi
	mkdir -p ~/.pulumi/bin
	curl -fsSL https://get.pulumi.com | sh
	echo 'export PATH=$PATH:$(HOME)/.pulumi/bin' >> ~/.bashrc

install-tools: ~/.nvm ~/.pulumi/bin
	# install node.js via nvm
	# (because of how nvm works, have to run it from a shell script)
	./install_node.sh

	# install packages we need for this project
	npm install @pulumi/aws @pulumi/awsx @pulumi/pulumi
