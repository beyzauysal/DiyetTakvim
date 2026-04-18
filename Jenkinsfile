pipeline {
  agent any

  options {
    timestamps()
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        sh '''
          set -e
          echo "=== Workspace ==="
          pwd
          ls -la
        '''
      }
    }

    stage('Backend — bağımlılıklar (npm ci)') {
      steps {
        sh '''
          set -e
          cd backend
          npm ci
          echo "Backend npm ci tamamlandı."
        '''
      }
    }

    stage('Frontend — bağımlılıklar (npm ci)') {
      steps {
        sh '''
          set -e
          cd frontend
          npm ci
          echo "Frontend npm ci tamamlandı."
        '''
      }
    }

    stage('Frontend — production build') {
      steps {
        sh '''
          set -e
          cd frontend
          npm run build
          echo "Frontend build tamamlandı (dist/)."
        '''
      }
    }

    stage('Docker Compose — config doğrulama') {
      steps {
        sh '''
          set -e
          docker compose -f docker-compose.yml config -q
          echo "docker compose config: geçerli."
        '''
      }
    }

    stage('Docker Compose — image build') {
      steps {
        sh '''
          set -e
          docker compose -f docker-compose.yml build
          echo "docker compose build tamamlandı."
        '''
      }
    }

    stage('Docker Compose — stack ayağa kaldırma (detached)') {
      steps {
        sh '''
          set -e
          docker compose -f docker-compose.yml up -d
          echo "docker compose up -d tamamlandı."
        '''
      }
    }

    stage('Smoke / Health — konteyner ve HTTP') {
      steps {
        sh '''
          set -e
          echo "=== docker compose ps ==="
          docker compose -f docker-compose.yml ps

          echo "=== Smoke: backend (içeriden) + frontend (compose ağı) ==="
          docker compose -f docker-compose.yml exec -T backend node -e "
            const http = require('http');
            function get(url) {
              return new Promise((resolve, reject) => {
                const req = http.get(url, (res) => {
                  let body = '';
                  res.on('data', (c) => { body += c; });
                  res.on('end', () => resolve({ status: res.statusCode, body }));
                });
                req.on('error', reject);
                req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout: ' + url)); });
              });
            }
            (async () => {
              const maxAttempts = 30;
              const delayMs = 2000;
              for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                  const api = await get('http://127.0.0.1:5050/api/water-intake/health');
                  if (api.status !== 200) throw new Error('API health HTTP ' + api.status);
                  const web = await get('http://frontend/');
                  if (web.status !== 200) throw new Error('Frontend HTTP ' + web.status);
                  console.log('[smoke] API:', api.status, api.body.slice(0, 120));
                  console.log('[smoke] Web:', web.status, web.body.slice(0, 120));
                  console.log('[smoke] Tum kontroller basarili.');
                  process.exit(0);
                } catch (e) {
                  console.log('[smoke] Deneme ' + attempt + '/' + maxAttempts + ': ' + e.message);
                  if (attempt === maxAttempts) {
                    console.error('[smoke] BASARISIZ:', e);
                    process.exit(1);
                  }
                  await new Promise((r) => setTimeout(r, delayMs));
                }
              }
            })();
          "

          echo "=== Smoke tamam ==="
        '''
      }
    }

    stage('Pipeline özeti') {
      steps {
        sh '''
          echo ""
          echo "============================================================"
          echo "  DiyetTakvim CI/CD: BASARILI"
          echo "  Stack ayakta. Demo URL'leri README.md içinde listelenmiştir."
          echo "  Not: Tarayıcıdan erişim için makinenizdeki localhost portları kullanılır."
          echo "============================================================"
          echo ""
        '''
      }
    }
  }

  post {
    failure {
      sh '''
        echo ""
        echo "============================================================"
        echo "  DiyetTakvim CI/CD: BASARISIZ — loglari inceleyin."
        echo "============================================================"
        echo ""
      '''
    }
  }
}
