# Linux一键安装脚本
> 注意：采用此一键安装脚本需要确保是新机器，机器中没有装其他版本的docker和docker-compose.如果安装遇到问题，请到[issues](https://github.com/liuming9157/bbcn/issues)贴出报错信息

### centOS一键安装脚本
```
yum install -y wget && wget -O install.sh https://raw.githubusercontent.com/liuming9157/bbcn/master/hosting/aliyun/centos.sh && sh install.sh
```
### Ubuntu/Deepin一键安装脚本
```
wget -O install.sh https://raw.githubusercontent.com/liuming9157/bbcn/master/hosting//aliyun/ubuntu.sh && sudo bash install.sh
```

### Debian一键安装脚本
```
wget -O install.sh https://raw.githubusercontent.com/liuming9157/bbcn/master/hosting//aliyun/debian.sh && bash install.sh
```