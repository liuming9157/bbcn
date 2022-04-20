#!/bin/bash
sudo yum install -y yum-utils
sudo yum-config-manager \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install docker-ce docker-ce-cli containerd.io
# install docker-compose
#pip3 install docker-compose
 DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
 mkdir -p $DOCKER_CONFIG/cli-plugins
 curl -SL https://github.com/docker/compose/releases/download/v2.2.3/docker-compose-linux-x86_64 -o $DOCKER_CONFIG/cli-plugins/docker-compose
 chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
# go into the app dir
cd /root

# fetch nginx and docker-compose files
wget https://raw.githubusercontent.com/liuming9157/bbcn/master/hosting/docker-compose.yaml
wget https://raw.githubusercontent.com/liuming9157/bbcn/master/hosting/.env


# boot the stack
docker compose up -d

# return
cd -