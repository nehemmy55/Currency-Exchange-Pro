# Currency-Exchange-Pro
- Deployment Guide

## Prerequisites
- Ubuntu server (20.04/22.04 recommended)
- Node.js 18.x
- npm 8.x+
- PM2 (for process management)
- Nginx (as reverse proxy)

## Installation Steps

### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2
# descriptive video :https://youtu.be/pIMgsGCDTZA
