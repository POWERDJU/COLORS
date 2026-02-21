# 어린이 색칠놀이 웹앱

브라우저에서 동작하는 정적(HTML/CSS/JS) 색칠공부 앱입니다.  
GitHub Pages로 바로 배포해서 모바일에서도 사용할 수 있습니다.

## 1) 로컬 실행

아래 중 하나로 실행:

```powershell
py -m http.server 5500
```

접속:

- `http://localhost:5500`

## 2) GitHub 업로드

### 방법 A: Git CLI 사용

프로젝트 루트에서 실행:

```powershell
git init
git add .
git commit -m "feat: deploy-ready coloring app"
git branch -M main
git remote add origin https://github.com/<YOUR_ID>/<YOUR_REPO>.git
git push -u origin main
```

### 방법 B: GitHub Desktop 또는 웹 업로드

- GitHub Desktop: `File > Add local repository` 후 `Publish repository`
- 웹 업로드: GitHub에서 새 저장소 생성 후 `Upload files`로 프로젝트 전체 업로드

## 3) GitHub Pages 배포

이 저장소에는 `.github/workflows/deploy-pages.yml`이 포함되어 있어 `main` 푸시 시 자동 배포됩니다.

GitHub 저장소에서:

1. `Settings` → `Pages`
2. `Build and deployment`를 `GitHub Actions`로 선택
3. `main` 브랜치에 푸시하면 자동 배포

배포 URL 예시:

- `https://<YOUR_ID>.github.io/<YOUR_REPO>/`

## 4) 모바일에서 설치형(PWA) 사용

이 프로젝트는 `manifest.webmanifest` + `sw.js`를 포함합니다.

- Android(Chrome): 메뉴 → `홈 화면에 추가`
- iPhone(Safari): 공유 → `홈 화면에 추가`

## 5) 주요 배포 파일

- `manifest.webmanifest` : 앱 메타데이터
- `sw.js` : 오프라인 캐시
- `.nojekyll` : GitHub Pages 정적 배포 보장
- `.github/workflows/deploy-pages.yml` : 자동 배포
- `.gitignore` : 불필요 파일 제외

## 6) 배포 후 점검

1. 이미지 로딩 확인 (`images/level*/*.png`)
2. 레벨/도구 동작 확인
3. 모바일에서 터치 색칠/슬라이드 도구창 확인
4. 홈 화면 추가 후 재실행 확인
