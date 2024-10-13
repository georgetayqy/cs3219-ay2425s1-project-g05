#!/bin/bash 
# use this code as the code for the launch template of the EC2 instances registered to the 
# ECS run cluster
echo ECS_CLUSTER=peerprep-run-cluster >> /etc/ecs/ecs.config;

# install docker compose
# script taken from https://stackoverflow.com/questions/63708035/installing-docker-compose-on-amazon-ec2-linux-2-9kb-docker-compose-file
sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose;
sudo chmod +x /usr/local/bin/docker-compose;

# install dependencies
sudo yum -y install wget unzip;

# get judge0 binaries
wget https://github.com/judge0/judge0/releases/download/v1.13.1/judge0-v1.13.1.zip;
unzip judge0-v1.13.1.zip;

# start judge0
cd judge0-v1.13.1;
docker-compose up -d db redis;
sleep 10s;
docker-compose up -d;
sleep 5s;
