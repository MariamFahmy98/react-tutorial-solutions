pipeline {
  agent { label 'controller-node' }

  stages {
    stage('unit tests') {
      steps {
        sh 'npm install'
        sh 'npm test'
      }
    }

    stage('formatting') {
      steps {
        sh 'npm run prettify'
      }
    }
    
    stage('linting') {
      steps {
        sh 'npm run lint'
      }
    }

    stage('audit') {
      steps {
        sh 'npm audit || true'
      }
    }

    stage('analysis') {
      steps {
        sh 'npm run build'
        sh 'mkdir reports || true'
        sh 'npm run analyze > reports/analyzer.html'

        // publish html
        publishHTML (target: [
          allowMissing: false,
          alwaysLinkToLastBuild: true,
          keepAll: false,
          reportDir: 'reports',
          reportFiles: 'analyzer.html',
          reportName: "Bundle Analysis"
        ])
      }
    }

    stage('build image') {
      steps {
        sh 'docker build -t public.ecr.aws/u8c3s4x8/tic-tac-toe:latest .'
      }
    }

    stage('push image to ECR') {
      environment {
        AWS_ACCESS_KEY_ID     = credentials('jenkins-aws-secret-key-id')
        AWS_SECRET_ACCESS_KEY = credentials('jenkins-aws-secret-access-key')
      }

      steps {
        sh 'aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws/u8c3s4x8'
        sh 'docker push public.ecr.aws/u8c3s4x8/tic-tac-toe:latest'
      }
    }

    stage('deploy') {
      steps {
        sh 'docker run --name app-${GIT_COMMIT} -d --network siemens public.ecr.aws/u8c3s4x8/tic-tac-toe:latest'

        script {
          def containerHealth = sh(
            script: "docker inspect --format='{{json .State.Running}}' app-${GIT_COMMIT} || echo 'false'",
            returnStdout: true
          ).trim()

          echo "container health: ${containerHealth}"

          if(containerHealth == "true") {
            if(env.GIT_PREVIOUS_SUCCESSFUL_COMMIT) {
              sh "sed -i 's/app-${GIT_PREVIOUS_SUCCESSFUL_COMMIT}/app-${GIT_COMMIT}/' /home/mariamfahmy2498/Siemens-Project/react-tutorial-solutions/conf/nginx.conf"
              sh 'docker rm -f app-${GIT_PREVIOUS_SUCCESSFUL_COMMIT}'
            } else {
              sh "sed -i 's/app-blue/app-${GIT_COMMIT}/' ~/Siemens-Project/react-tutorial-solutions/conf/nginx.conf"
            }
          }
        }

        script {
          def proxyHealth = sh(
            script: "docker inspect --format='{{json .State.Running}}' proxy-server || echo 'false'",
            returnStdout: true
          ).trim()

          echo "proxy health: ${proxyHealth}"

          if(proxyHealth == "false") {
            sh 'docker rm -f proxy-server || true'
            sh 'docker run --name proxy-server -p 80:80 -v /home/mariamfahmy2498/Siemens-Project/react-tutorial-solutions/conf/nginx.conf:/etc/nginx/conf.d/default.conf:ro -d --network siemens nginx:1.21.6-alpine'
          } else {
            sh 'docker kill -s HUP proxy-server'
          }
        }
      }
    }

    stage('E2E tests') {
      steps {
        sh 'npm run test:e2e'
      }
    }
  }
}
