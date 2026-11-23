# 워독스 정보실

워독스 패치노트, 장비, 스탯, 도감, 무장 정보를 모으는 비공식 팬 사이트입니다. 별도 설치나 빌드 없이 GitHub Pages에서 배포할 수 있습니다.

## 로컬에서 열기

브라우저에서 `index.html`을 엽니다.

- `index.html`에서 사이트 제목과 상단 탭을 수정합니다.
- `styles.css`에서 색상과 레이아웃을 수정합니다.
- `.nojekyll`은 GitHub Pages의 Jekyll 빌드를 건너뛰는 빈 파일입니다.

## 무기와 아이템 데이터 수정하기

`assets/items` 폴더에 무기 목록의 `code`와 같은 이름의 `.png` 파일을 넣으면 카드 중앙에 표시됩니다. 예를 들어 `부시마스터 M17S`의 이미지 파일명은 `WPN-001.png`입니다.

아이템과 탄약의 `inventory.stackIncrement`는 한 번 클릭할 때 가방에 추가되는 개수이며, 가방에서 우클릭할 때도 같은 개수를 뺍니다. Ctrl을 누른 채 우클릭하면 해당 스택 전체가 제거됩니다. `inventory.stackLimit`는 한 스택에 담을 수 있는 최대 개수입니다.

가방 안에서 아이템을 드래그하면 보관 칸 사이로 옮기거나 서로 자리를 바꿀 수 있습니다. 같은 아이템에 놓으면 대상 스택의 빈 용량만큼 합쳐지고, 남은 수량은 원래 칸에 유지됩니다.

`weight`는 아이템 한 개의 무게를 0.01kg 단위로 저장한 정수입니다. 예를 들어 `8`은 0.08kg입니다.

무기의 `compatibleAmmoCodes`와 `attachmentSlots`는 게임 내 호환 탄약과 파츠의 코드 목록입니다. 호환되는 항목이 없으면 빈 배열을 사용합니다. 탄약과 파츠의 `compatibleWeaponCodes`에는 같은 관계를 무기 코드로 기록합니다.

무장 → 장비의 탄약 준비 화면은 장착된 무기의 `attachmentSlots.magazine`과 `compatibleAmmoCodes`를 사용해 `itemdata/parts.json`과 `itemdata/ammo.json`에서 선택 목록을 가져옵니다.

배포 사이트는 장비 탭에서 `itemdata/weapons.json`을, 무장 → 아이템 탭에서 `itemdata/items.json`을 읽습니다. 무장 → 탄약 전개 탭은 `itemdata/ammo.json`을 읽고, 기타 태그의 배터리는 `itemdata/items.json`에서 가져옵니다. `index.html`을 파일로 직접 열 때도 변경 사항을 확인하려면 데이터를 수정한 뒤 아래 명령을 실행합니다.

```powershell
$weaponRows = Get-Content -Raw -Encoding utf8 itemdata/weapons.json | ConvertFrom-Json | ForEach-Object {
    '  ' + ($_ | Select-Object code, name, tags, weight, price, inventory, compatibleAmmoCodes, attachmentSlots | ConvertTo-Json -Depth 3 -Compress)
}
$localCatalog = "// Generated from weapons.json for file:// previews.`nwindow.localWeapons = [`n" + ($weaponRows -join ",`n") + "`n];`n"
[IO.File]::WriteAllText((Join-Path $PWD 'itemdata/weapons.local.js'), $localCatalog)

$itemRows = Get-Content -Raw -Encoding utf8 itemdata/items.json | ConvertFrom-Json | ForEach-Object {
    '  ' + ($_ | Select-Object code, name, tags, weight, price, inventory | ConvertTo-Json -Compress)
}
$itemLocalCatalog = "// Generated from items.json for file:// previews.`nwindow.localItems = [`n" + ($itemRows -join ",`n") + "`n];`n"
[IO.File]::WriteAllText((Join-Path $PWD 'itemdata/items.local.js'), $itemLocalCatalog)

$ammoRows = Get-Content -Raw -Encoding utf8 itemdata/ammo.json | ConvertFrom-Json | ForEach-Object {
    '  ' + ($_ | Select-Object code, name, tags, weight, price, inventory, compatibleWeaponCodes | ConvertTo-Json -Compress)
}
$ammoLocalCatalog = "// Generated from ammo.json for file:// previews.`nwindow.localAmmo = [`n" + ($ammoRows -join ",`n") + "`n];`n"
[IO.File]::WriteAllText((Join-Path $PWD 'itemdata/ammo.local.js'), $ammoLocalCatalog)

$partRows = Get-Content -Raw -Encoding utf8 itemdata/parts.json | ConvertFrom-Json | ForEach-Object {
    '  ' + ($_ | Select-Object code, name, tags, weight, price, inventory, slot, compatibleWeaponCodes | ConvertTo-Json -Depth 3 -Compress)
}
$partLocalCatalog = "// Generated from parts.json for file:// previews.`nwindow.localParts = [`n" + ($partRows -join ",`n") + "`n];`n"
[IO.File]::WriteAllText((Join-Path $PWD 'itemdata/parts.local.js'), $partLocalCatalog)
```

## 가방 슬롯 데이터 수정하기

`itemdata/bag-slots.json`에서 가방별 내부 구성을 관리합니다. 왼쪽의 `ITEM-...` 키는 `itemdata/items.json`에 있는 가방의 `code`와 일치합니다. `slots: null`은 규격 미입력 상태입니다. 실제 슬롯이 없는 가방은 `slots: []`로 입력합니다.

| 코드 | 가방 |
| --- | --- |
| `ITEM-016` | 파우치 |
| `ITEM-017` | 정찰 가방 |
| `ITEM-018` | 야전 가방 |
| `ITEM-019` | 작전 가방 |
| `ITEM-020` | 공세 가방 |
| `ITEM-021` | 대형 가방 |
| `ITEM-022` | 사수용 가방 + 슬링 |
| `ITEM-023` | 무장 가방 + 슬링 2개 |

규격을 입력하려면 해당 가방의 `slots`를 배열로 바꿉니다. 배열 순서가 표시 순서이며, 한 가방 안에서 각 `id`는 서로 달라야 합니다.

- `container`는 독립된 보관 격자입니다. `width`는 가로 칸 수, `height`는 세로 칸 수이며 각각 양의 정수로 입력합니다. 같은 규격의 컨테이너가 여러 개면 각 컨테이너를 별도로 적습니다.
- `equipment`는 장비 한 개를 장착하는 슬롯입니다. `label`에는 표시할 이름을 입력합니다. 장착 대상을 제한하려면 `accepts.tags`에 기존 데이터의 태그를, `accepts.itemCodes`에 아이템 또는 무기 코드를 입력합니다. 둘 다 지정하면 둘 중 하나에 일치하는 장비를 허용합니다. 제한이 없는 슬롯은 `accepts`를 생략합니다.

아래는 입력 형식 예시입니다. 실제 화면에 표시되는 규격은 `bag-slots.json`의 값을 따릅니다.

```json
{
  "ITEM-017": {
    "slots": [
      { "id": "pocket-1", "type": "container", "width": 1, "height": 2 },
      { "id": "pocket-2", "type": "container", "width": 1, "height": 2 },
      { "id": "pocket-3", "type": "container", "width": 1, "height": 2 }
    ]
  },
  "ITEM-018": {
    "slots": [
      { "id": "main", "type": "container", "width": 2, "height": 4 }
    ]
  },
  "ITEM-022": {
    "slots": [
      { "id": "main", "type": "container", "width": 2, "height": 4 },
      { "id": "sling", "type": "equipment", "label": "슬링", "accepts": { "tags": ["저격소총"] } }
    ]
  }
}
```

기존 파일에서는 해당 가방의 항목만 바꿔 저장합니다. 무장 → 장구에서 가방을 장착하면 우측 가방 UI에 배열 순서대로 슬롯이 표시됩니다. `equipment` 슬롯은 항상 가로 1칸, 세로 3칸입니다.

배포 사이트는 JSON을 직접 읽습니다. `index.html`을 브라우저에서 파일로 열어 확인하는 경우 가방 슬롯 JSON을 수정한 뒤 다음 명령으로 로컬용 데이터를 갱신합니다.

```powershell
$bagSlotJson = (Get-Content -Raw -Encoding utf8 itemdata/bag-slots.json).TrimEnd()
$bagSlotLocalCatalog = "// Generated from bag-slots.json for file:// previews.`nwindow.localBagSlots = $bagSlotJson;`n"
[IO.File]::WriteAllText((Join-Path $PWD 'itemdata/bag-slots.local.js'), $bagSlotLocalCatalog)
```

## GitHub Pages로 처음 배포하기

1. [GitHub 새 저장소 만들기](https://github.com/new)에서 이름을 `wardogsinfo`로 정하고 **Public**을 선택합니다. GitHub Free에서는 공개 저장소에서 Pages를 사용할 수 있습니다. README, .gitignore, 라이선스 초기화는 선택 해제합니다. [GitHub Docs · 로컬 코드 올리기](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)
2. 이 프로젝트 폴더에서 PowerShell을 열고 아래 명령을 실행합니다. `YOUR-USERNAME`을 본인의 GitHub 사용자 이름으로 바꾸세요. 저장소 이름을 다르게 정했다면 주소에도 반영합니다.

   ```powershell
   git init -b main
   git add -- index.html styles.css equipment.js itemdata/weapons.json itemdata/weapons.local.js itemdata/items.json itemdata/items.local.js itemdata/ammo.json itemdata/ammo.local.js itemdata/parts.json itemdata/parts.local.js itemdata/bag-slots.json itemdata/bag-slots.local.js assets .nojekyll README.md
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
git add -- index.html styles.css equipment.js itemdata/weapons.json itemdata/weapons.local.js itemdata/items.json itemdata/items.local.js itemdata/ammo.json itemdata/ammo.local.js itemdata/parts.json itemdata/parts.local.js itemdata/bag-slots.json itemdata/bag-slots.local.js assets
git commit -m "Update Wardogs information"
git push
```
