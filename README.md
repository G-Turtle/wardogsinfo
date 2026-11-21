# 워독스 정보실

워독스 공략, 맵·모드 정보, 업데이트를 모으는 비공식 팬 사이트입니다. HTML과 CSS만으로 구성되어 있어 별도 설치나 빌드 없이 GitHub Pages에서 배포할 수 있습니다.

## 로컬에서 열기

브라우저에서 `index.html`을 엽니다.

- `index.html`에서 사이트 소개와 자료를 수정합니다.
- `styles.css`에서 색상과 레이아웃을 수정합니다.
- `.nojekyll`은 GitHub Pages의 Jekyll 빌드를 건너뛰는 빈 파일입니다.

첫 글을 등록할 때는 `index.html`의 해당 분류 안에 `<article>`을 추가하고, 그 안에 `<h4>` 제목과 본문을 작성하세요. 필요한 경우 게임 버전, 확인 날짜, 출처 링크를 같이 넣으세요. 글을 등록하면 자료 목록의 ‘아직 등록된 글이 없습니다.’ 문구도 지웁니다.

## GitHub Pages로 처음 배포하기

1. [GitHub 새 저장소 만들기](https://github.com/new)에서 이름을 `wardogsinfo`로 정하고 **Public**을 선택합니다. GitHub Free에서는 공개 저장소에서 Pages를 사용할 수 있습니다. README, .gitignore, 라이선스 초기화는 선택 해제합니다. [GitHub Docs · 로컬 코드 올리기](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)
2. 이 프로젝트 폴더에서 PowerShell을 열고 아래 명령을 실행합니다. `YOUR-USERNAME`을 본인의 GitHub 사용자 이름으로 바꾸세요. 저장소 이름을 다르게 정했다면 주소에도 반영합니다.

   ```powershell
   git init -b main
   git add -- index.html styles.css .nojekyll README.md
   git commit -m "Create Wardogs info site"
   git remote add origin https://github.com/YOUR-USERNAME/wardogsinfo.git
   git push -u origin main
   ```

   커밋 시 작성자 정보가 없다는 오류가 나오면 `git config user.name "이름"`과 `git config user.email "GitHub에 등록한 이메일"`을 실행한 뒤 커밋부터 다시 진행합니다. 푸시 시 로그인 창이 열리면 GitHub에 로그인합니다.

3. GitHub 저장소에서 **Settings → Pages**로 이동합니다. **Build and deployment**에서 **Source**를 **Deploy from a branch**로 선택하고, **Branch**를 **main**, 폴더를 **/(root)**로 지정한 뒤 **Save**를 누릅니다. [GitHub Docs · 게시 소스 설정](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
4. 배포가 끝나면 **Settings → Pages**에 표시되는 사이트 링크를 엽니다. 예상 주소는 `https://YOUR-USERNAME.github.io/wardogsinfo/`입니다. 배포 진행 상태는 저장소의 **Actions** 탭에서 확인할 수 있습니다. [GitHub Docs · 사이트 만들기](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)

## 배포한 사이트 수정하기

파일을 수정하고 브라우저에서 확인한 후 변경 내용을 `main`으로 푸시하면 GitHub Pages가 다시 배포합니다.

```powershell
git add -- index.html styles.css
git commit -m "Update Wardogs information"
git push
```
