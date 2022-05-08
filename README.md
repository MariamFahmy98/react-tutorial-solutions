# Tic Tac Toe DevOps Project
Building and deploying a simple Tic Tac Toe application using Jenkins, Docker and EC2 instance.

## Prerequisites
- Node js
- Docker
- Jenkins
- Prometheus
- Ansible
- Git and Github

## Project Structure
- Dockerfile - Contains commands to build and run the docker image.
- Jenkinsfile - Contains the pipeline script which will help in building, testing and deploying the application.
- playbook.yml - Create and run an Ansible Playbook which contains a list of ordered tasks that should be executed on a remote server.
- conf - A configuraton folder contains nginx configuartion (used in the reverse proxy nginx to support blue/green deployment) as well as prometheus configuration, both are mounted to docker containers.
- .eslintric.yml - Define the configuration structure which will be used in analyzing source code for programmatic and stylistic errors.
- src/tests - Contains unit tests for the application.
- src/e2e-tests - Contains end to end tests for the application.

## Introduction
A docker image is created for Tic Tac Toe application using multi-stage builds:
- The first stage:
  - It uses ```node:18.1.0-alpine3.15``` as its base image.
  - It copies both ```package.json``` and ```package-lock.json``` into the container's file system.
  - It runs ```npm ci --only=production``` to install the required dependencies.
  - It copies all project files into the container's file system.
  - It runs ```npm run build``` to produce optimized static files that contains ```index.html``` (it will be used in nginx server to render it in the second stage).
- The second stage:
  - It uses ```nginx:1.21.6-alpine``` as its base image.
  - Copying ```build/index.html``` generated from the first stage into ```/usr/share/nginx/html``` to override the basic static site with the static file of the application.

From this docker image, we can create a container that includes everything needed to run an application: code, runtime, system tools, system libraries and settings.
To support a blue/green deployment mechanism, another container called ```proxy-server``` will be created and it mounts ```conf/nginx/default.conf``` such that whenever there is a new version of the application, nginx proxy server will route the HTTP requests to the new deployed container instead of the old one.
 
 ## CI/CD pipeline stages:
 - <b> Unit test stage </b>                                                                                                           
   It runs unit tests for the Tic Tac Toe application.
 - <b> Format stage </b>                                                                   
   It checks and formats the code base.
 - <b> Lint stage </b>                                            
   It analyzes the source code for programmatic and stylistic errors.
 - <b> Security testing stage (audit) </b>                                                                   
   It checks direct dependencies, devDependencies and asks for a report of known vulnerabilities.
 - <b> Performance testing stage (analysis) </b>                                                                  
   It finds out what modules make up the most of its size and optimizing it.
 - <b> Build docker image stage </b>                                             
   It builds a docker image for the Tic Tac Toe application.
 - <b> Push image to ECR stage </b>
   - It gets the credentials of Jenkins service in AWS and logins into Amazon Elastic Container Registery.
   - It pushes the docker image of the Tic Tac Toe application.
 - <b> Deploy stage </b>
   - It runs a container called ```app-${GIT_COMMIT}``` (```GIT_COMMIT``` is the current Git commit’s secure hash algorithm).
   - After checking the new container' status, Jenkins runs ```sed``` command which will substitute the container's old version with the container's recent version, then it stops the old container.
   - It runs another container that uses ```nginx:1.21.6-alpine``` as its base image, it acts as reverse proxy server that route the HTTP requests to the container that contains the Tic Tac Toe application. In case the reverse proxy container already exists, it sends a HUP signal to reload the container and update its ```/etc/nginx/conf.d/default.conf```.
- <b> E2E tests stage </b>                                                  
  It runs end to end tests for the Tic Tac Toe application.

In case of sucess/failure builds, an email is sent to the developer to be notified.

## Ansible playbook
Ansible install the required software on the machine that is responsible for the pipeline execution:
- Docker
- Java
- Jenkins
- Node js
- AWS CLI
- Prometheus
- Node Exporter

## Metrics Monitoring
- Creating a container for node exporter that exports all metrics on ```/mertics``` path so that prometheus can pull the required metrics from it.
  ```
  docker run --name exporter -d -p 9100:9100 --network siemens prom/node-exporter
  ```
- Creating a container for prometheus for monitoring and mounts ```conf/prometheus.yml``` that targets the ```exporter``` container.
  ```
  docker run --name prom -d -p 9090:9090 --network siemens -v /home/mariamfahmy2498/tic-tac-toe-devops-project/conf/prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus
  ```
  ### Examples
  - Monitoring the average amount of CPU time spent in system mode, per second, over the last minute (in seconds) by ``` rate(node_cpu_seconds_total{mode="system"}[1m])```
  - Monitoring the filesystem space available to non-root users (in bytes) by ```node_filesystem_avail_bytes```
  - Monitoring the average network traffic received, per second, over the last minute (in bytes) by ```rate(node_network_receive_bytes_total[1m])```