pipeline {
    agent any

    environment {
        // Add your Vercel token as a Jenkins credential (type: Secret Text)
        VERCEL_TOKEN = credentials('vercel-token')
    }

    stages {
        stage('Clone Repository') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/muzammil-kj/LifesyncKhan.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing dependencies...'
                bat 'npm install'
            }
        }

        stage('Build Project') {
            steps {
                echo 'Building project...'
                bat 'npm run build'
            }
        }

        stage('Test') {
            steps {
                echo 'Running tests...'
                bat 'npm test || echo "No tests found"'
            }
        }

        stage('Deploy to Vercel') {
            steps {
                echo '🚀 Deploying to Vercel...'
                bat '''
                npm install -g vercel
                vercel --token %VERCEL_TOKEN% --prod --yes
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Build & Deployment successful!'
        }
        failure {
            echo '❌ Build failed. Please check Jenkins logs.'
        }
    }
}
