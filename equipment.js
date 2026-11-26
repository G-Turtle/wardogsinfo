const siteCanvas = document.querySelector('.site-canvas');
const sectionNav = document.querySelector('#site-nav');
const sectionButtons = sectionNav.querySelectorAll('button');
const patchNotesSection = document.querySelector('#patch-notes');
const patchNotesButton = sectionNav.querySelector('[aria-controls="patch-notes"]');
const patchSeasonTimeline = patchNotesSection.querySelector('.patch-season-timeline');
const patchList = patchNotesSection.querySelector('.patch-list');
const patchListEmpty = patchNotesSection.querySelector('.patch-list-empty');
const patchDetailPanel = patchNotesSection.querySelector('.patch-detail-panel');
const patchDetailEmpty = patchNotesSection.querySelector('.patch-detail-empty');
const equipmentSection = document.querySelector('#equipment');
const equipmentButton = sectionNav.querySelector('[aria-controls="equipment"]');
const statsButton = sectionNav.querySelector('[aria-controls="stats-nav"]');
const statsNav = document.querySelector('#stats-nav');
const statsViews = statsNav.querySelectorAll('[data-stats-slot]');
const attachmentStatsPanel = document.querySelector('#attachment-stats');
const attachmentStatsStatus = attachmentStatsPanel.querySelector('.attachment-stats-status');
const attachmentStatsScroll = attachmentStatsPanel.querySelector('.attachment-stats-scroll');
const attachmentStatsTable = attachmentStatsPanel.querySelector('.attachment-stats-table');
const statsWeaponTrigger = statsNav.querySelector('.stats-weapon-trigger');
const statsWeaponDialog = document.querySelector('#stats-weapon-dialog');
const loadoutBag = document.querySelector('#loadout-bag');
const loadoutBagContent = loadoutBag.querySelector('.loadout-bag-content');
const loadoutBagFrame = loadoutBagContent.querySelector('.loadout-bag-frame');
const loadoutBagTrigger = loadoutBag.querySelector('.loadout-bag-trigger');
const loadoutBagFeedback = loadoutBag.querySelector('.loadout-bag-feedback');
const bagPickerDialog = document.querySelector('#loadout-bag-picker');
const bagPickerList = bagPickerDialog.querySelector('.loadout-bag-picker-grid');
const bagPickerStatus = bagPickerDialog.querySelector('.loadout-bag-picker-status');
const loadoutBagSummary = loadoutBag.querySelector('.loadout-bag-summary');
const loadoutBagCostValue = loadoutBagSummary.querySelector('.loadout-bag-cost-value');
const loadoutWeightPanel = loadoutBagSummary.querySelector('.loadout-weight');
const loadoutWeightValue = loadoutBagSummary.querySelector('.loadout-weight-value');
const loadoutWeightStage = loadoutBagSummary.querySelector('.loadout-weight-stage');
const loadoutWeightSegments = loadoutBagSummary.querySelectorAll('.loadout-weight-gauge span');
const itemSection = document.querySelector('#loadout-items');
const ammoSection = document.querySelector('#loadout-ammo');
const loadoutSection = document.querySelector('#loadout');
const loadoutButton = sectionNav.querySelector('[aria-controls~="loadout"]');
const loadoutNav = document.querySelector('#loadout-nav');
const loadoutViews = loadoutNav.querySelectorAll('[data-loadout-view]');
const loadoutOverviewView = loadoutNav.querySelector('[data-loadout-view="overview"]');
const loadoutEquipmentView = loadoutNav.querySelector('[data-loadout-view="equipment"]');
const loadoutGearView = loadoutNav.querySelector('[data-loadout-view="gear"]');
const loadoutOverview = loadoutSection.querySelector('.loadout-overview');
const overviewBackpackPanel = loadoutOverview.querySelector('.loadout-overview-backpack-panel');
const loadoutGear = loadoutSection.querySelector('#loadout-gear');
const backpackCategory = loadoutGear.querySelector('.gear-picker [data-slot="backpack"]');
const gearSlotButtons = Array.from(loadoutGear.querySelectorAll('.loadout-gear-button'));
const overviewGearButtons = loadoutOverview.querySelectorAll('.loadout-overview-gear-button');
const equippedGear = new Map();
const gearSlotViews = [...gearSlotButtons, ...overviewGearButtons].map((button) => {
  const art = button.querySelector('.loadout-gear-art');
  const price = document.createElement('span');
  price.className = 'loadout-gear-price';
  price.hidden = true;
  art.append(price);
  return { ...createSlotView(button, '.loadout-gear-label'), price };
});
let selectedSection = sectionNav.querySelector('[aria-pressed="true"]');
const patchSeasonRequests = new Map();
let patchSeasonSelectionRequest = 0;
let selectedStatsView = statsNav.querySelector('[data-stats-slot][aria-pressed="true"]');
let selectedStatsWeapon;
let attachmentStatsRequest = 0;
let selectedLoadoutView = loadoutNav.querySelector('[data-loadout-view][aria-pressed="true"]');
let selectedGearSlot = loadoutGear.querySelector('[aria-pressed="true"]');

const weaponLoadoutSlots = equipmentSection.querySelector('.weapon-loadout-slots');
const weaponLoadoutButtons = weaponLoadoutSlots.querySelectorAll('.weapon-loadout-slot');
const weaponAmmoPreparation = equipmentSection.querySelector('#weapon-ammo-preparation');
const weaponCatalog = equipmentSection.querySelector('.weapon-picker-catalog');
const weaponSetupActions = new Map(Array.from(weaponLoadoutButtons, (button) => {
  const actions = button.nextElementSibling;
  return [button.dataset.slot, {
    ammo: actions.querySelector('[data-ammo-action]'),
    attachments: actions.querySelector('[data-attachment-action]'),
  }];
}));
const weaponLoadoutFeeds = new Map(Array.from(weaponLoadoutButtons, (button) => [
  button.dataset.slot, button.querySelector('.weapon-slot-feed'),
]));
const overviewWeaponSlots = loadoutOverview.querySelectorAll('.loadout-overview-weapon-slot');
const weaponSlotViews = [...weaponLoadoutButtons, ...overviewWeaponSlots].map(
  (slot) => createSlotView(slot, '.weapon-slot-name'),
);
let selectedWeaponLoadoutSlot = weaponLoadoutSlots.querySelector('[aria-pressed="true"]');
const cardTemplate = document.querySelector('#weapon-card-template');
const priceFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const catalogRequests = new Map();
const equippedWeapons = new Map();
const equippedMagazines = new Map();
let weaponEquipRequest = 0;
const bagInventories = new Map();
let bagItemDrag;
let siteScale;
let actualLoadoutWeight = 0;
let weightPreview;
const weightPreviewHandlers = new WeakMap();
const weightStages = [
  { start: 0, label: '초경량' },
  { start: 1000, label: '경무장' },
  { start: 1700, label: '중간' },
  { start: 2700, label: '중무장' },
  { start: 4000, label: '초중무장' },
];
const maxWeightGauge = 5500;
let bagLayoutRequest = 0;
let bagPickerRequest = 0;
const ammoCodesByCategory = {
  카트리지: ['AMMO-029', 'AMMO-030'],
  로켓: ['AMMO-031', 'AMMO-032', 'AMMO-033'],
  기타: ['AMMO-034', 'ITEM-063', 'ITEM-064'],
};

const weaponPicker = createCatalogPicker(weaponCatalog, 'weapons', 'localWeapons', '무기', {
  onSelect: equipWeapon,
  onWeightPreview: getWeaponEquipWeight,
});
const statsWeaponCatalog = weaponCatalog.cloneNode(true);
statsWeaponCatalog.querySelectorAll('[data-category]').forEach((button) => {
  if (button.hasAttribute('data-item-codes')) button.remove();
  else button.removeAttribute('data-slot');
});
const statsWeaponGrid = statsWeaponCatalog.querySelector('.weapon-grid');
statsWeaponGrid.id = 'stats-weapon-grid';
statsWeaponCatalog.querySelectorAll('.weapon-page-arrow').forEach((button) => {
  button.setAttribute('aria-controls', statsWeaponGrid.id);
});
statsWeaponDialog.querySelector('.catalog-dialog-body').append(statsWeaponCatalog);
const statsWeaponPicker = createCatalogPicker(statsWeaponCatalog, 'weapons', 'localWeapons', '무기', {
  actionLabel: '선택',
  onSelect: (weapon) => {
    selectedStatsWeapon = weapon;
    statsWeaponTrigger.textContent = weapon.name;
    statsWeaponDialog.close();
    updateAttachmentStats();
  },
});
const weaponSetupPicker = createWeaponSetupPicker(weaponAmmoPreparation);
const itemPicker = createCatalogPicker(itemSection, 'items', 'localItems', '아이템', {
  emptyMessage: '',
  onSelect: placeSelectedItem,
  onWeightPreview: getBagItemAdditionWeight,
});
const ammoPicker = createCatalogPicker(ammoSection, 'ammo', 'localAmmo', '탄약', {
  emptyMessage: '',
  loadCategory: loadAmmoCategory,
  onSelect: placeSelectedItem,
  onWeightPreview: getBagItemAdditionWeight,
});
const gearPicker = createCatalogPicker(loadoutGear.querySelector('.gear-picker'), 'items', 'localItems', '장구', {
  onSelect: equipGear,
  onWeightPreview: (item, slot) => equippedGear.has(slot) ? null : getGearWeight(slot, item),
});

loadoutBagTrigger.addEventListener('click', () => openBagPicker());
bagPickerDialog.addEventListener('close', () => clearWeightPreview(bagPickerDialog));
loadoutBagFrame.addEventListener('pointermove', moveBagItemDrag);
loadoutBagFrame.addEventListener('pointerup', dropBagItem);
loadoutBagFrame.addEventListener('pointercancel', cancelBagItemDrag);
loadoutBagFrame.addEventListener('lostpointercapture', cancelBagItemDrag);
window.addEventListener('blur', cancelBagItemDrag);
window.addEventListener('blur', () => clearWeightPreview());
document.addEventListener('pointerover', (event) => {
  if (event.pointerType !== 'touch') updateWeightPreview(event.target, event.ctrlKey);
});
document.addEventListener('pointerout', (event) => {
  if (event.pointerType !== 'touch') updateWeightPreview(event.relatedTarget, event.ctrlKey);
});
window.addEventListener('keydown', (event) => {
  if (event.key === 'Control' && weightPreview) updateWeightPreview(weightPreview.element, event.ctrlKey);
  if (event.key === 'Escape') cancelBagItemDrag();

  const drag = bagItemDrag;
  if (event.code !== 'KeyR' || !drag?.ghost || event.altKey || event.ctrlKey || event.metaKey) return;

  event.preventDefault();
  if (event.repeat) return;

  const { width, height } = drag.entry.item.inventory;
  if (width === height) return;

  drag.rotation = drag.rotation === 0 ? 1 : 0;
  updateBagDragPreview(drag);
});
window.addEventListener('keyup', (event) => {
  if (event.key === 'Control' && weightPreview) updateWeightPreview(weightPreview.element, event.ctrlKey);
});
fitSiteCanvas();
window.addEventListener('resize', fitSiteCanvas);
initializePatchNotes();

const headerLayoutObserver = new ResizeObserver(alignStatsNavigation);
headerLayoutObserver.observe(sectionNav.parentElement);
headerLayoutObserver.observe(sectionNav.previousElementSibling);

function alignStatsNavigation() {
  const headerLeft = sectionNav.parentElement.getBoundingClientRect().left;
  const buttonLeft = sectionButtons[0].getBoundingClientRect().left;
  statsNav.style.setProperty('--stats-nav-inset', `${(buttonLeft - headerLeft) / siteScale}px`);
}

function fitSiteCanvas() {
  cancelBagItemDrag();
  const viewport = document.documentElement;
  siteScale = Math.min(1, viewport.clientWidth / siteCanvas.offsetWidth,
    viewport.clientHeight / siteCanvas.offsetHeight);
  viewport.style.setProperty('--layout-scale', siteScale);
}

sectionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectedSection.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-pressed', 'true');
    selectedSection = button;
    updateSectionVisibility();
  });
});

async function initializePatchNotes() {
  try {
    const index = await fetchPatchJson('./patchnote/index.json');
    if (!Array.isArray(index.seasons)) throw new Error('Invalid patch note index');

    patchSeasonTimeline.replaceChildren();
    index.seasons.forEach((season, indexValue) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.season = season.id;
      button.setAttribute('aria-pressed', String(indexValue === 0));

      const node = document.createElement('span');
      node.className = 'patch-season-node';
      node.setAttribute('aria-hidden', 'true');

      const label = document.createElement('span');
      label.className = 'patch-season-label';
      const name = document.createElement('strong');
      name.textContent = season.name;
      label.append(name);
      button.append(node, label);
      button.addEventListener('click', () => selectPatchSeason(season));
      patchSeasonTimeline.append(button);
    });

    if (index.seasons.length) await selectPatchSeason(index.seasons[0]);
    else showPatchStatus('등록된 시즌이 없습니다.', '표시할 패치가 없습니다.');
  } catch (error) {
    console.error(error);
    showPatchStatus('패치노트를 불러올 수 없습니다.', '잠시 후 다시 시도해 주세요.');
  }
}

async function selectPatchSeason(season) {
  const request = ++patchSeasonSelectionRequest;
  patchSeasonTimeline.querySelectorAll('[data-season]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.season === season.id));
  });
  showPatchStatus('패치 내역을 불러오는 중…', '');

  try {
    const seasonData = await loadPatchSeason(season);
    if (request !== patchSeasonSelectionRequest) return;
    if (!Array.isArray(seasonData.patches)) throw new Error(`Invalid patch season: ${season.id}`);
    renderPatchList(seasonData.patches);
  } catch (error) {
    if (request !== patchSeasonSelectionRequest) return;
    console.error(error);
    showPatchStatus('패치 내역을 불러올 수 없습니다.', '잠시 후 다시 시도해 주세요.');
  }
}

function loadPatchSeason(season) {
  if (!patchSeasonRequests.has(season.id)) {
    const request = fetchPatchJson(`./patchnote/${season.file}`)
      .catch((error) => {
        patchSeasonRequests.delete(season.id);
        throw error;
      });
    patchSeasonRequests.set(season.id, request);
  }
  return patchSeasonRequests.get(season.id);
}

async function fetchPatchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load patch notes (${response.status})`);
  return response.json();
}

function renderPatchList(patches) {
  patchList.replaceChildren();
  patchDetailPanel.querySelectorAll('article').forEach((article) => article.remove());

  if (!patches.length) {
    showPatchStatus('이 시즌에는 표시할 패치가 없습니다.', '선택한 시즌에 등록된 패치가 없습니다.');
    return;
  }

  patchListEmpty.hidden = true;
  patches.forEach((patch, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.patch = patch.id;
    button.setAttribute('aria-pressed', String(index === 0));

    const title = document.createElement('strong');
    title.textContent = patch.title;
    const metadata = document.createElement('span');
    const date = document.createElement('time');
    date.dateTime = patch.date;
    date.textContent = formatPatchDate(patch.date);
    const divider = document.createElement('span');
    divider.setAttribute('aria-hidden', 'true');
    divider.textContent = '/';
    const version = document.createTextNode(`v${patch.version}`);
    metadata.append(date, divider, version);
    button.append(title, metadata);
    button.addEventListener('click', () => selectPatch(patch.id));
    patchList.append(button);

    patchDetailPanel.append(createPatchArticle(patch, index !== 0));
  });
  patchDetailEmpty.hidden = true;
}

function createPatchArticle(patch, hidden) {
  const article = document.createElement('article');
  article.dataset.patchDetail = patch.id;
  article.hidden = hidden;

  const header = document.createElement('header');
  const title = document.createElement('h2');
  title.textContent = patch.title;
  const metadata = document.createElement('p');
  const version = document.createElement('span');
  version.textContent = `v${patch.version}`;
  const date = document.createElement('time');
  date.dateTime = patch.date;
  date.textContent = formatPatchDate(patch.date);
  metadata.append(version, date);
  header.append(title, metadata);

  const copy = document.createElement('div');
  copy.className = 'patch-detail-copy';
  if (patch.summary) {
    const summary = document.createElement('p');
    summary.className = 'patch-detail-intro';
    summary.textContent = patch.summary;
    copy.append(summary);
  }
  if (Array.isArray(patch.highlights) && patch.highlights.length) {
    const section = document.createElement('section');
    const heading = document.createElement('h3');
    heading.textContent = '이번 업데이트';
    const highlights = document.createElement('div');
    highlights.className = 'patch-highlight-grid';
    patch.highlights.forEach((highlight) => {
      const item = document.createElement('span');
      item.textContent = highlight;
      highlights.append(item);
    });
    section.append(heading, highlights);
    copy.append(section);
  }
  if (Array.isArray(patch.sections)) {
    patch.sections.forEach((patchSection) => {
      const section = document.createElement('section');
      const heading = document.createElement('h3');
      heading.textContent = patchSection.title;
      const list = document.createElement('ul');
      (patchSection.items ?? []).forEach((text) => {
        const item = document.createElement('li');
        item.textContent = text;
        list.append(item);
      });
      section.append(heading, list);
      copy.append(section);
    });
  }
  article.append(header, copy);
  return article;
}

function selectPatch(patchId) {
  patchList.querySelectorAll('[data-patch]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.patch === patchId));
  });
  patchDetailPanel.querySelectorAll('[data-patch-detail]').forEach((article) => {
    article.hidden = article.dataset.patchDetail !== patchId;
  });
  patchDetailPanel.scrollTop = 0;
}

function showPatchStatus(listMessage, detailMessage) {
  patchList.replaceChildren();
  patchListEmpty.textContent = listMessage;
  patchListEmpty.hidden = !listMessage;
  patchDetailPanel.querySelectorAll('article').forEach((article) => article.remove());
  patchDetailEmpty.textContent = detailMessage;
  patchDetailEmpty.hidden = !detailMessage;
}

function formatPatchDate(date) {
  return typeof date === 'string' ? date.replaceAll('-', '.') : '';
}

statsViews.forEach((button) => {
  button.addEventListener('click', () => {
    selectedStatsView.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-pressed', 'true');
    selectedStatsView = button;
    updateAttachmentStats();
  });
});

statsWeaponTrigger.addEventListener('click', () => {
  statsWeaponDialog.style.setProperty('--catalog-dialog-dim-start', `${statsNav.offsetTop}px`);
  statsWeaponDialog.showModal();
  statsWeaponPicker.open();
});

attachmentStatsScroll.addEventListener('wheel', (event) => {
  const { deltaMode, deltaX, deltaY } = event;
  if (event.ctrlKey || event.shiftKey || Math.abs(deltaY) <= Math.abs(deltaX)) return;

  const { scrollLeft, scrollWidth, clientWidth } = attachmentStatsScroll;
  const maxScrollLeft = scrollWidth - clientWidth;
  if (maxScrollLeft <= 0) return;

  const deltaScale = deltaMode === WheelEvent.DOM_DELTA_LINE ? 16
    : deltaMode === WheelEvent.DOM_DELTA_PAGE ? clientWidth : 1;
  const nextScrollLeft = Math.max(0, Math.min(maxScrollLeft, scrollLeft + deltaY * deltaScale));
  if (nextScrollLeft === scrollLeft) return;

  event.preventDefault();
  attachmentStatsScroll.scrollLeft = nextScrollLeft;
}, { passive: false });

loadoutViews.forEach((button) => {
  button.addEventListener('click', () => {
    selectedLoadoutView.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-pressed', 'true');
    selectedLoadoutView = button;
    updateSectionVisibility();
  });
});

loadoutBagSummary.querySelector('.loadout-bag-cost-back').addEventListener('click', () => {
  loadoutOverviewView.click();
  loadoutOverviewView.focus();
});

weaponLoadoutButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectWeaponLoadoutSlot(button);
    showWeaponSetup();
    openSelectedWeaponPicker();
  });

  Object.entries(weaponSetupActions.get(button.dataset.slot)).forEach(([mode, action]) => {
    action.addEventListener('click', () => {
      const show = action.getAttribute('aria-expanded') === 'false';
      selectWeaponLoadoutSlot(button);
      showWeaponSetup(show ? mode : undefined);
      if (!show) openSelectedWeaponPicker();
    });
  });
});

function selectWeaponLoadoutSlot(button) {
  selectedWeaponLoadoutSlot.setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-pressed', 'true');
  selectedWeaponLoadoutSlot = button;
}

function showWeaponSetup(mode, stage) {
  weaponEquipRequest++;
  clearWeightPreview(equipmentSection);
  const show = Boolean(mode);
  const activeSlot = selectedWeaponLoadoutSlot.dataset.slot;
  weaponAmmoPreparation.hidden = !show;
  equipmentSection.classList.toggle('weapon-picker-ammo-mode', show);
  weaponCatalog.hidden = show;
  for (const [slot, actions] of weaponSetupActions) {
    for (const [actionMode, action] of Object.entries(actions)) {
      action.setAttribute('aria-expanded', String(mode === actionMode && slot === activeSlot));
    }
  }
  if (show) weaponSetupPicker.open(activeSlot, mode, stage);
  else weaponSetupPicker.close();
}

function openSelectedWeaponPicker() {
  weaponPicker.setSlot(selectedWeaponLoadoutSlot.dataset.slot);
  weaponPicker.open();
}

overviewWeaponSlots.forEach((button) => {
  button.addEventListener('click', () => {
    const target = weaponLoadoutSlots.querySelector(`[data-slot="${button.dataset.slot}"]`);
    selectWeaponLoadoutSlot(target);
    loadoutEquipmentView.click();
    target.focus();
  });
});

weaponSlotViews.forEach(({ element }) => {
  bindWeightPreview(element, () => element.hasAttribute('data-equipped-item')
    ? -getWeaponSlotWeight(element.dataset.slot) : null);
  element.addEventListener('contextmenu', (event) => {
    if (!element.hasAttribute('data-equipped-item')) return;

    event.preventDefault();
    setEquippedWeapon(element.dataset.slot, null);
  });
});

for (const [slot, feed] of weaponLoadoutFeeds) {
  bindWeightPreview(feed, () => equippedWeapons.get(slot)?.attachmentSlots?.magazine?.length
    ? getRemovalWeight(equippedMagazines.get(slot))
    : -getWeaponSlotWeight(slot));
  feed.addEventListener('contextmenu', (event) => {
    if (!equippedWeapons.get(slot)?.attachmentSlots?.magazine?.length) return;

    event.stopPropagation();
    if (!equippedMagazines.has(slot)) return;

    event.preventDefault();
    setEquippedMagazine(slot, null);
  });
}

gearSlotButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectGearSlot(button);
    openSelectedGearPicker();
  });
});

overviewGearButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const slot = button.dataset.slot;
    if (equippedGear.has(slot)) return;

    selectGearSlot(gearSlotButtons.find((candidate) => candidate.dataset.slot === slot));
    loadoutGearView.click();
    selectedGearSlot.focus();
  });
});

gearSlotViews.forEach(({ element }) => {
  bindWeightPreview(element, () => {
    const slot = element.dataset.slot;
    const item = equippedGear.get(slot);
    return item ? -getGearWeight(slot, item) : null;
  });
  element.addEventListener('contextmenu', (event) => {
    const slot = element.dataset.slot;
    if (!equippedGear.has(slot)) return;

    event.preventDefault();
    setEquippedGear(slot, null);
  });
});

function selectGearSlot(button) {
  selectedGearSlot.setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-pressed', 'true');
  selectedGearSlot = button;
}

function openSelectedGearPicker() {
  gearPicker.setSlot(selectedGearSlot.dataset.slot);
  gearPicker.open();
}

async function updateAttachmentStats() {
  const request = ++attachmentStatsRequest;
  const label = selectedStatsView.textContent;
  const codes = selectedStatsWeapon?.attachmentSlots?.[selectedStatsView.dataset.statsSlot];
  const emptyMessage = `호환되는 ${label} 부품이 없습니다.`;
  attachmentStatsTable.hidden = true;
  attachmentStatsTable.setAttribute('aria-label', `호환 ${label} 비교`);
  if (!selectedStatsWeapon) return;
  if (!codes?.length) {
    attachmentStatsStatus.textContent = emptyMessage;
    return;
  }

  attachmentStatsStatus.textContent = `${label} 목록을 불러오는 중…`;
  try {
    const parts = await loadCatalog('parts', 'localParts');
    if (request !== attachmentStatsRequest) return;

    const attachments = getItemsByCode(parts, codes);
    if (attachments.length) renderAttachmentStats(attachments, label);
    attachmentStatsStatus.textContent = attachments.length ? '' : emptyMessage;
    attachmentStatsTable.hidden = !attachments.length;
    attachmentStatsScroll.scrollLeft = 0;
  } catch (error) {
    if (request !== attachmentStatsRequest) return;

    console.error(error);
    attachmentStatsStatus.textContent = `${label} 목록을 불러올 수 없습니다.`;
  }
}

function renderAttachmentStats(attachments, label) {
  const [nameRow, imageRow, ...statRows] = attachmentStatsTable.rows;
  const availableStats = new Set(attachments.flatMap((attachment) => Object.keys(attachment.stats ?? {})));
  for (const row of attachmentStatsTable.rows) row.replaceChildren(row.cells[0]);
  for (const row of statRows) row.hidden = !availableStats.has(row.dataset.stat);
  const visibleStatRows = statRows.filter((row) => !row.hidden);

  for (const attachment of attachments) {
    const name = document.createElement('th');
    name.scope = 'col';
    name.textContent = attachment.name;
    nameRow.append(name);

    const image = document.createElement('img');
    image.alt = '';
    image.addEventListener('error', () => {
      image.alt = `기본 ${label} 아이콘`;
      image.src = `./assets/ui/파츠_${label}.png`;
    }, { once: true });
    image.src = catalogImageUrl(attachment);
    imageRow.insertCell().append(image);
  }

  for (const row of visibleStatRows) {
    const values = attachments.map((attachment) => attachment.stats?.[row.dataset.stat]);
    const rangesBySign = new Map([1, -1].map((sign) => {
      const magnitudes = values.filter((value) => Number.isFinite(value) && Math.sign(value) === sign).map(Math.abs);
      return [sign, { min: Math.min(...magnitudes), max: Math.max(...magnitudes) }];
    }));
    const lowerIsBetter = row.hasAttribute('data-lower-is-better');

    for (const value of values) {
      const cell = row.insertCell();
      if (!Number.isFinite(value)) {
        cell.textContent = '—';
        continue;
      }

      cell.textContent = `${value > 0 ? '+' : ''}${value}`;
      if (value === 0) {
        cell.classList.add('stat-neutral');
        continue;
      }

      const improved = lowerIsBetter ? value < 0 : value > 0;
      const { min, max } = rangesBySign.get(Math.sign(value));
      const magnitude = Math.abs(value);
      const intensity = max === min ? 100 : 100 * (magnitude - min) / (max - min);
      cell.classList.add(improved ? 'stat-improved' : 'stat-worsened');
      if (magnitude === max) cell.classList.add('stat-strongest');
      cell.style.setProperty('--stat-intensity', `${intensity}%`);
    }
  }
}

function updateSectionVisibility() {
  cancelBagItemDrag();
  clearWeightPreview();
  const inLoadout = selectedSection === loadoutButton;
  const loadoutView = selectedLoadoutView.dataset.loadoutView;
  const inLoadoutEquipment = inLoadout && loadoutView === 'equipment';
  const inLoadoutOverview = inLoadout && loadoutView === 'overview';
  const bagFrameHost = inLoadoutOverview ? overviewBackpackPanel : loadoutBagContent;
  if (loadoutBagFrame.parentElement !== bagFrameHost) bagFrameHost.prepend(loadoutBagFrame);
  const bagSummaryHost = inLoadoutOverview ? loadoutOverview : loadoutBag;
  if (loadoutBagSummary.parentElement !== bagSummaryHost) bagSummaryHost.append(loadoutBagSummary);

  patchNotesSection.hidden = selectedSection !== patchNotesButton;
  statsNav.hidden = selectedSection !== statsButton;
  attachmentStatsPanel.hidden = statsNav.hidden;
  loadoutNav.hidden = !inLoadout;
  loadoutOverview.hidden = loadoutView !== 'overview';
  loadoutGear.hidden = loadoutView !== 'gear';
  loadoutSection.hidden = !inLoadout || (loadoutOverview.hidden && loadoutGear.hidden);
  equipmentSection.hidden = selectedSection !== equipmentButton && !inLoadoutEquipment;
  equipmentSection.classList.toggle('weapon-picker-in-loadout', inLoadoutEquipment);
  weaponLoadoutSlots.hidden = !inLoadoutEquipment;
  if (!inLoadoutEquipment) showWeaponSetup();
  loadoutBag.hidden = !inLoadout || !selectedLoadoutView.matches('[aria-controls~="loadout-bag"]');
  itemSection.hidden = !inLoadout || loadoutView !== 'items';
  ammoSection.hidden = !inLoadout || loadoutView !== 'ammo';

  if (!equipmentSection.hidden && weaponAmmoPreparation.hidden) {
    weaponPicker.setSlot(inLoadoutEquipment ? selectedWeaponLoadoutSlot.dataset.slot : '');
    weaponPicker.open();
  }
  if (!itemSection.hidden) itemPicker.open();
  if (!ammoSection.hidden) ammoPicker.open();
  if (inLoadout && loadoutView === 'gear') openSelectedGearPicker();
}

function equipGear(item, slot) {
  const index = gearSlotButtons.findIndex((button) => button.dataset.slot === slot);
  if (index === -1 || equippedGear.has(slot)) return;

  setEquippedGear(slot, item);
  const nextSlot = gearSlotButtons[index + 1];
  if (nextSlot && selectedSection === loadoutButton && selectedLoadoutView === loadoutGearView) {
    selectGearSlot(nextSlot);
    openSelectedGearPicker();
    nextSlot.focus({ preventScroll: true });
  }
}

function createSlotView(element, labelSelector) {
  const image = element.querySelector('img');
  const label = element.querySelector(labelSelector);
  return { element, image, label, emptyImage: image.getAttribute('src'), emptyLabel: label.textContent };
}

function renderEquippedSlot({ element, image, label, emptyImage, emptyLabel }, item) {
  image.src = item ? catalogImageUrl(item) : emptyImage;
  label.textContent = item?.name ?? emptyLabel;
  element.title = item?.name ?? '';
  if (item) element.dataset.equippedItem = item.code;
  else delete element.dataset.equippedItem;
}

async function equipWeapon(item, slot) {
  if (weaponLoadoutSlots.hidden || selectedWeaponLoadoutSlot.dataset.slot !== slot) return;

  const request = ++weaponEquipRequest;
  let defaultFeed;
  if (item.defaultFeed && equippedWeapons.get(slot)?.code !== item.code) {
    try {
      defaultFeed = await loadDefaultWeaponFeed(item);
    } catch (error) {
      if (request !== weaponEquipRequest) return;

      console.error(error);
      weaponCatalog.querySelector('[role="status"]').textContent = '기본 장착 아이템을 불러올 수 없습니다.';
      return;
    }
    if (request !== weaponEquipRequest) return;
  }

  setEquippedWeapon(slot, item, defaultFeed);
  const { ammo: ammoAction } = weaponSetupActions.get(slot);
  if (!ammoAction.disabled) {
    showWeaponSetup('ammo');
    ammoAction.focus({ preventScroll: true });
  }
}

function setEquippedWeapon(slot, item, defaultFeed) {
  weaponEquipRequest++;
  const previousCode = equippedWeapons.get(slot)?.code;
  if (item) equippedWeapons.set(slot, item);
  else equippedWeapons.delete(slot);
  if (previousCode !== item?.code) {
    weaponSetupPicker.forget(slot);
    equippedMagazines.delete(slot);
    if (defaultFeed) {
      const { ammo, magazine } = defaultFeed;
      weaponSetupPicker.setPreparation(slot, ammo, magazine);
      if (magazine) equippedMagazines.set(slot, createLoadedMagazine(magazine, ammo));
    }
  }

  weaponSlotViews.forEach((view) => {
    if (view.element.dataset.slot === slot) renderEquippedSlot(view, item);
  });
  renderOverviewWeaponParts(slot);
  renderWeaponFeed(slot);

  const { ammo: ammoAction, attachments: attachmentAction } = weaponSetupActions.get(slot);
  const hasAmmo = Boolean(item?.compatibleAmmoCodes?.length);
  const hasAttachments = ['optic', 'foregrip', 'muzzle'].some((type) => item?.attachmentSlots?.[type]?.length);
  ammoAction.disabled = !hasAmmo;
  ammoAction.toggleAttribute('data-available', hasAmmo);
  attachmentAction.disabled = !hasAttachments;
  attachmentAction.toggleAttribute('data-available', hasAttachments);
  const becameUnavailable = [ammoAction, attachmentAction].some(
    (action) => action.disabled && action.getAttribute('aria-expanded') === 'true',
  );
  if (becameUnavailable) {
    showWeaponSetup();
    openSelectedWeaponPicker();
  }
  renderLoadoutSummary();
}

async function loadDefaultWeaponFeed({ defaultFeed: { ammoCode, magazineCode } }) {
  const [[ammo], parts] = await Promise.all([
    loadWeaponAmmo([ammoCode]),
    magazineCode ? loadCatalog('parts', 'localParts') : [],
  ]);
  const magazine = parts.find(({ code }) => code === magazineCode);
  if (!ammo || (magazineCode && !magazine)) throw new Error('Default equipment feed item is missing');

  return { ammo, magazine };
}

function createLoadedMagazine(magazine, ammo) {
  return { ...magazine, name: `${magazine.name} (${ammo.name})`, loadedAmmo: ammo };
}

async function getWeaponEquipWeight(item, slot) {
  if (equippedWeapons.get(slot)?.code === item.code) return 0;

  const weaponDelta = getItemWeight(item) - getWeaponSlotWeight(slot);
  if (!item.defaultFeed) return weaponDelta;

  try {
    const { ammo, magazine } = await loadDefaultWeaponFeed(item);
    return weaponDelta + (magazine ? getItemWeight(magazine) : getItemWeight(ammo, 1));
  } catch {
    return null;
  }
}

function renderWeaponFeed(slot) {
  const weapon = equippedWeapons.get(slot);
  const feed = weaponLoadoutFeeds.get(slot);
  feed.hidden = !weapon;
  if (!weapon) return;

  const hasMagazines = Boolean(weapon.attachmentSlots?.magazine?.length);
  const installed = getInstalledWeaponPart(slot, hasMagazines ? 'magazine' : 'ammo');
  const feedType = hasMagazines ? '탄창' : '탄약';
  const image = feed.firstElementChild;
  image.src = installed ? catalogImageUrl(installed) : `./assets/ui/파츠_${feedType}.png`;
  image.alt = installed?.name ?? feedType;
}

function setEquippedMagazine(slot, magazine) {
  if (magazine) equippedMagazines.set(slot, magazine);
  else equippedMagazines.delete(slot);
  renderWeaponFeed(slot);
  renderOverviewWeaponParts(slot);
  renderLoadoutSummary({ keepWeightPreview: Boolean(magazine) });
}

function renderOverviewWeaponParts(slot) {
  const weaponSlot = loadoutOverview.querySelector(`.loadout-overview-weapon-slot[data-slot="${slot}"]`);
  const item = equippedWeapons.get(slot);
  const parts = item?.attachmentSlots;
  const slots = [
    parts?.optic?.length && ['optic', '스코프'],
    parts?.magazine?.length ? ['magazine', '탄창'] : item?.compatibleAmmoCodes?.length && ['ammo', '탄약'],
    parts?.foregrip?.length && ['foregrip', '손잡이'],
    parts?.muzzle?.length && ['muzzle', '총구'],
  ].filter(Boolean);

  Array.from(weaponSlot.nextElementSibling.children).forEach((cell, index) => {
    if (!slots[index]) {
      cell.replaceChildren();
      cell.setAttribute('aria-label', `빈 슬롯 ${index + 1}`);
      return;
    }

    const [stage, label] = slots[index];
    let button = cell.firstElementChild;
    if (!button) {
      button = createOverviewWeaponPartButton(slot);
      cell.append(button);
    }
    const installed = getInstalledWeaponPart(slot, stage);
    cell.removeAttribute('aria-label');
    button.dataset.partStage = stage;
    button.setAttribute('aria-label', installed ? `${label} 선택: ${installed.name}` : `${label} 선택`);
    button.title = installed?.name ?? label;
    button.firstElementChild.src = installed ? catalogImageUrl(installed) : `./assets/ui/파츠_${label}.png`;
  });
}

function createOverviewWeaponPartButton(slot) {
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-controls', 'weapon-ammo-preparation');
  const image = document.createElement('img');
  image.alt = '';
  button.append(image);
  bindWeightPreview(button, () => {
    const stage = button.dataset.partStage;
    return getRemovalWeight(getInstalledWeaponPart(slot, stage), stage === 'ammo' ? 1 : undefined);
  });

  button.addEventListener('click', () => {
    const stage = button.dataset.partStage;
    const mode = stage === 'magazine' || stage === 'ammo' ? 'ammo' : 'attachments';
    selectWeaponLoadoutSlot(weaponLoadoutSlots.querySelector(`[data-slot="${slot}"]`));
    loadoutEquipmentView.click();
    showWeaponSetup(mode, stage);
  });
  button.addEventListener('contextmenu', (event) => {
    const stage = button.dataset.partStage;
    if (stage === 'magazine') {
      if (!equippedMagazines.has(slot)) return;
      setEquippedMagazine(slot, null);
    } else if (!weaponSetupPicker.clearSelection(slot, stage)) return;

    event.preventDefault();
  });
  return button;
}

function setEquippedGear(slot, item) {
  if (item) equippedGear.set(slot, item);
  else equippedGear.delete(slot);

  gearSlotViews.forEach((view) => {
    if (view.element.dataset.slot !== slot) return;

    renderEquippedSlot(view, item);
    view.price.textContent = item ? formatCatalogPrice(item.price) : '';
    view.price.hidden = !item;
  });

  if (slot === 'backpack') {
    loadoutBagTrigger.hidden = Boolean(item);
    loadoutBagFeedback.textContent = '';
    renderBagSlots(item?.code);
  }
  renderLoadoutSummary();
}

function getItemWeight(item, count = item?.priceQuantity ?? 1) {
  return (item?.weight ?? 0) * count;
}

function getRemovalWeight(item, count) {
  return item ? -getItemWeight(item, count) : null;
}

function getBagContentsWeight(contents) {
  return contents.reduce((sum, { item, count }) => sum + getItemWeight(item, count), 0);
}

function getGearWeight(slot, item) {
  const contents = slot === 'backpack' ? bagInventories.get(item.code) ?? [] : [];
  return getItemWeight(item) + getBagContentsWeight(contents);
}

function getInstalledWeaponPart(slot, stage) {
  return stage === 'magazine' ? equippedMagazines.get(slot) : weaponSetupPicker.getPart(slot, stage);
}

function getInstalledWeaponParts(slot, weapon) {
  const stages = ['optic', 'foregrip', 'muzzle'];
  if (!weapon.attachmentSlots?.magazine?.length) stages.push('ammo');
  return stages.map((stage) => ({
    item: getInstalledWeaponPart(slot, stage),
    count: stage === 'ammo' ? 1 : undefined,
  })).filter(({ item }) => item);
}

function getWeaponSlotWeight(slot) {
  const weapon = equippedWeapons.get(slot);
  if (!weapon) return 0;

  const parts = getInstalledWeaponParts(slot, weapon);
  const baseWeight = getItemWeight(weapon) + getItemWeight(getInstalledWeaponPart(slot, 'magazine'));
  return parts.reduce((sum, { item, count }) => sum + getItemWeight(item, count), baseWeight);
}

function bindWeightPreview(element, getDelta) {
  weightPreviewHandlers.set(element, getDelta);
}

function updateWeightPreview(element, ctrlKey = false) {
  while (element && !weightPreviewHandlers.has(element)) element = element.parentElement;
  if (weightPreview?.element === element && weightPreview?.ctrlKey === ctrlKey) return;

  clearWeightPreview();
  if (!element || bagItemDrag) return;

  renderWeightPreview(element, ctrlKey);
}

async function renderWeightPreview(element, ctrlKey) {
  const preview = { element, ctrlKey };
  weightPreview = preview;
  const delta = await weightPreviewHandlers.get(element)(ctrlKey);
  if (weightPreview !== preview) return;

  if (Number.isFinite(delta)) renderLoadoutWeight(Math.max(0, actualLoadoutWeight + delta), true);
  else renderLoadoutWeight(actualLoadoutWeight);
}

function clearWeightPreview(container) {
  if (!weightPreview || (container && !container.contains(weightPreview.element))) return;

  weightPreview = undefined;
  renderLoadoutWeight(actualLoadoutWeight);
}

function renderLoadoutWeight(total, isPreview = false) {
  loadoutWeightPanel.classList.toggle('is-previewing', isPreview);
  loadoutWeightValue.textContent = (Math.round(total / 10) / 10).toFixed(1);
  loadoutWeightStage.textContent = weightStages.findLast(({ start }) => total >= start).label;
  loadoutWeightSegments.forEach((segment, index) => {
    const start = weightStages[index].start;
    const end = weightStages[index + 1]?.start ?? maxWeightGauge;
    const fill = Math.max(0, Math.min(1, (total - start) / (end - start)));
    segment.style.setProperty('--weight-fill', `${fill * 100}%`);
  });
}

function renderLoadoutSummary({ keepWeightPreview = false } = {}) {
  const parts = [...equippedWeapons].flatMap(([slot, weapon]) => getInstalledWeaponParts(slot, weapon));
  const equippedItems = [...equippedWeapons.values(), ...equippedMagazines.values(), ...equippedGear.values()];
  const bagCode = equippedGear.get('backpack')?.code;
  const bagContents = bagInventories.get(bagCode) ?? [];
  const entries = [...equippedItems.map((item) => ({ item })), ...parts, ...bagContents];
  actualLoadoutWeight = entries.reduce((sum, { item, count }) => sum + getItemWeight(item, count), 0);
  if (keepWeightPreview && weightPreview) {
    renderWeightPreview(weightPreview.element, weightPreview.ctrlKey);
  } else {
    weightPreview = undefined;
    renderLoadoutWeight(actualLoadoutWeight);
  }
  const prices = entries.map(({ item, count }) => getItemPrice(item, count));
  const knownTotal = prices.reduce((sum, price) => sum + (price ?? 0), 0);
  const hasUnknownPrices = prices.includes(null);
  loadoutBagCostValue.textContent = `${formatCatalogPrice(knownTotal)}${hasUnknownPrices ? '+' : ''}`;
  loadoutBagCostValue.title = hasUnknownPrices ? '가격을 확인하지 못한 아이템이 있습니다.' : '';
}

async function openBagPicker(pendingItem) {
  if (loadoutBag.hidden || equippedGear.has('backpack') || bagPickerDialog.open) return;

  clearWeightPreview();
  const request = ++bagPickerRequest;
  bagPickerDialog.style.setProperty('--catalog-dialog-dim-start', `${loadoutNav.offsetTop}px`);
  bagPickerList.replaceChildren();
  bagPickerStatus.textContent = '가방 목록을 불러오는 중…';
  bagPickerDialog.showModal();

  try {
    const [bags, layouts] = await Promise.all([
      loadPickerCategory(backpackCategory, 'items', 'localItems'),
      pendingItem ? loadBagLayouts() : null,
    ]);
    if (!bagPickerDialog.open || request !== bagPickerRequest) return;

    const choices = pendingItem
      ? bags.filter(({ code }) => planBagItemAddition(getBagSlots(layouts, code), bagInventories.get(code) ?? [], pendingItem))
      : bags;
    bagPickerList.replaceChildren(...choices.map((item) => createCatalogCard(item, () => {
      if (!bagPickerDialog.open || equippedGear.has('backpack')) return;
      if (pendingItem && !storeBagItem(item.code, getBagSlots(layouts, item.code), pendingItem)) {
        bagPickerStatus.textContent = '이 아이템을 담을 공간이 없습니다.';
        return;
      }

      bagPickerDialog.close();
      equipGear(item, 'backpack');
      if (selectedLoadoutView !== loadoutGearView) loadoutBag.querySelector('h3').focus({ preventScroll: true });
    }, '장착', () => getGearWeight('backpack', item) + getBagAdditionWeight(pendingItem))));
    if (choices.length) bagPickerStatus.textContent = '';
    else bagPickerStatus.textContent = pendingItem ? '이 아이템을 담을 수 있는 가방이 없습니다.' : '선택할 가방이 없습니다.';
  } catch (error) {
    if (!bagPickerDialog.open || request !== bagPickerRequest) return;

    console.error(error);
    bagPickerStatus.textContent = '가방 목록을 불러올 수 없습니다.';
  }
}

function placeSelectedItem(item) {
  if (itemSection.hidden && ammoSection.hidden) return;

  return placeItemInBag(item);
}

function getBagAdditionWeight(item) {
  return getItemWeight(item, item?.inventory?.stackIncrement ?? 1);
}

async function getBagItemAdditionWeight(item) {
  const bagCode = equippedGear.get('backpack')?.code;
  if (!bagCode) return getBagAdditionWeight(item);

  try {
    const layouts = await loadBagLayouts();
    const slots = getBagSlots(layouts, bagCode);
    const contents = bagInventories.get(bagCode) ?? [];
    return planBagItemAddition(slots, contents, item) ? getBagAdditionWeight(item) : null;
  } catch {
    return null;
  }
}

async function placeItemInBag(item) {
  const bag = equippedGear.get('backpack');
  if (!bag) {
    openBagPicker(item);
    return;
  }

  try {
    const layouts = await loadBagLayouts();
    if (equippedGear.get('backpack') !== bag) return;

    if (storeBagItem(bag.code, getBagSlots(layouts, bag.code), item)) {
      renderLoadoutSummary({ keepWeightPreview: true });
      loadoutBagFeedback.textContent = '';
      renderBagSlots(bag.code);
    } else {
      loadoutBagFeedback.textContent = '가방에 이 아이템을 담을 공간이 없습니다.';
    }
  } catch (error) {
    if (equippedGear.get('backpack') !== bag) return;

    console.error(error);
    loadoutBagFeedback.textContent = '가방 슬롯을 불러올 수 없습니다.';
  }
}

function loadBagLayouts() {
  return loadCatalog('bag-slots', 'localBagSlots', (entries) =>
    entries !== null && typeof entries === 'object' && !Array.isArray(entries));
}

function getBagSlots(layouts, bagCode) {
  const configuration = layouts[bagCode]?.slots;
  if (!Array.isArray(configuration)) return null;

  return configuration.flatMap((slot) => {
    if (slot?.type === 'equipment') return [{ ...slot, width: 1, height: 3 }];
    if (slot?.type === 'container' &&
        Number.isInteger(slot.width) && slot.width > 0 &&
        Number.isInteger(slot.height) && slot.height > 0) return [slot];
    return [];
  });
}

function getBagItemSize({ item, rotation = 0 }) {
  const { width, height } = item.inventory;
  return rotation === 1 ? { width: height, height: width } : { width, height };
}

function bagItemsOverlap(first, second) {
  if (first.slotIndex !== second.slotIndex) return false;

  const firstSize = getBagItemSize(first);
  const secondSize = getBagItemSize(second);
  return first.column < second.column + secondSize.width &&
    first.column + firstSize.width > second.column &&
    first.row < second.row + secondSize.height &&
    first.row + firstSize.height > second.row;
}

function findFreeBagSpace(slots, contents, item) {
  const { width, height } = item.inventory;
  const rotations = width === height ? [0] : [0, 1];
  for (const [slotIndex, slot] of slots.entries()) {
    if (slot.type !== 'container') continue;
    const placed = contents.filter((entry) => entry.slotIndex === slotIndex);
    for (let row = 0; row < slot.height; row++) {
      for (let column = 0; column < slot.width; column++) {
        for (const rotation of rotations) {
          const position = { slotIndex, row, column, rotation };
          const candidate = { ...position, item };
          if (fitsBagSlot(slots, candidate) && !placed.some((entry) => bagItemsOverlap(candidate, entry))) {
            return position;
          }
        }
      }
    }
  }
  return null;
}

function planBagItemAddition(slots, contents, item) {
  const { stackIncrement = 1, stackLimit } = item.inventory;
  if (!slots || !Number.isInteger(stackIncrement) || stackIncrement < 1 ||
      !Number.isInteger(stackLimit) || stackLimit < 1) return null;

  let remaining = stackIncrement;
  const stackUpdates = [];
  for (const stack of contents) {
    if (stack.item.code !== item.code || stack.count >= stackLimit) continue;

    const added = Math.min(remaining, stackLimit - stack.count);
    stackUpdates.push({ stack, added });
    remaining -= added;
    if (remaining === 0) break;
  }

  const newStacks = [];
  while (remaining > 0) {
    const position = findFreeBagSpace(slots, [...contents, ...newStacks], item);
    if (!position) return null;

    const count = Math.min(remaining, stackLimit);
    newStacks.push({ ...position, item, count });
    remaining -= count;
  }
  return { stackUpdates, newStacks };
}

function storeBagItem(bagCode, slots, item) {
  const contents = bagInventories.get(bagCode) ?? [];
  const addition = planBagItemAddition(slots, contents, item);
  if (!addition) return false;

  addition.stackUpdates.forEach(({ stack, added }) => { stack.count += added; });
  contents.push(...addition.newStacks);
  bagInventories.set(bagCode, contents);
  return true;
}

async function renderBagSlots(bagCode) {
  cancelBagItemDrag();
  clearWeightPreview(loadoutBagFrame);
  const request = ++bagLayoutRequest;
  loadoutBagFrame.replaceChildren();
  if (!bagCode) return;

  try {
    const layouts = await loadBagLayouts();
    if (request !== bagLayoutRequest) return;

    const slots = getBagSlots(layouts, bagCode);
    if (!slots) {
      loadoutBagFrame.textContent = '등록된 가방 슬롯이 없습니다.';
      return;
    }

    if (!slots.length) return;

    const list = document.createElement('div');
    list.className = 'loadout-bag-slots';
    list.setAttribute('role', 'list');
    list.setAttribute('aria-label', '가방 슬롯');
    list.style.setProperty('--bag-slot-count', slots.length);
    list.style.setProperty('--bag-column-count', slots.reduce((total, slot) => total + slot.width, 0));
    list.style.setProperty('--bag-row-count', Math.max(...slots.map((slot) => slot.height)));
    const bag = { code: bagCode, slots, contents: bagInventories.get(bagCode) ?? [] };
    list.append(...slots.map((slot, index) => createBagSlot(slot, index, bag)));
    loadoutBagFrame.replaceChildren(list);
  } catch (error) {
    if (request !== bagLayoutRequest) return;

    console.error(error);
    loadoutBagFrame.textContent = '가방 슬롯을 불러올 수 없습니다.';
  }
}

function createBagSlot({ type, label, width, height }, index, bag) {
  const slot = document.createElement('div');
  slot.className = `loadout-bag-slot is-${type}`;
  slot.setAttribute('role', 'listitem');
  slot.dataset.slotIndex = index;
  slot.style.setProperty('--bag-slot-columns', width);
  slot.style.setProperty('--bag-slot-rows', height);

  if (type === 'equipment') {
    const image = document.createElement('img');
    image.src = './assets/ui/주 무기.png';
    image.alt = '';
    slot.setAttribute('aria-label', `${label || '장비 슬롯'} ${width}×${height}`);
    slot.append(image);
  } else {
    slot.setAttribute('aria-label', `컨테이너 ${width}×${height}`);
    for (let cellIndex = 0; cellIndex < width * height; cellIndex++) {
      const cell = document.createElement('span');
      cell.className = 'loadout-bag-cell';
      cell.setAttribute('aria-hidden', 'true');
      slot.append(cell);
    }
    const entries = bag.contents.filter((entry) => entry.slotIndex === index);
    slot.append(...entries.map((entry) => createBagItem(entry, bag)));
  }
  return slot;
}

function createBagItem(entry, bag) {
  const { item, column, row, rotation = 0 } = entry;
  const { contents } = bag;
  const tile = document.createElement('div');
  tile.className = 'loadout-bag-item';
  tile.title = item.name;
  const { width, height } = getBagItemSize(entry);
  const { stackIncrement = 1, stackLimit } = item.inventory;
  tile.style.setProperty('--bag-item-column', column);
  tile.style.setProperty('--bag-item-row', row);
  tile.style.setProperty('--bag-item-width', width);
  tile.style.setProperty('--bag-item-height', height);
  tile.style.setProperty('--bag-item-rotation', `${90 * rotation}deg`);
  tile.classList.toggle('is-sideways', rotation === 1);

  const image = document.createElement('img');
  image.src = catalogImageUrl(item);
  image.alt = item.name;
  image.draggable = false;
  const price = document.createElement('span');
  price.className = 'loadout-bag-item-price';
  price.textContent = formatCatalogPrice(getItemPrice(item, entry.count));
  tile.append(image, price);

  const stack = stackLimit > 1 ? document.createElement('span') : null;
  if (stack) {
    stack.className = 'loadout-bag-item-stack';
    stack.textContent = `${entry.count}/${stackLimit}`;
    tile.append(stack);
  }

  bindWeightPreview(tile, (ctrlKey) => -getItemWeight(item, ctrlKey ? entry.count : Math.min(entry.count, stackIncrement)));
  tile.addEventListener('pointerdown', (event) => startBagItemDrag(event, tile, image, entry, bag));
  tile.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    if (bagItemDrag) return;

    const entryIndex = contents.indexOf(entry);
    if (entryIndex === -1) return;

    entry.count = event.ctrlKey ? 0 : Math.max(0, entry.count - stackIncrement);
    if (entry.count === 0) {
      contents.splice(entryIndex, 1);
      tile.remove();
    } else if (stack) {
      stack.textContent = `${entry.count}/${stackLimit}`;
      price.textContent = formatCatalogPrice(getItemPrice(item, entry.count));
    }
    loadoutBagFeedback.textContent = '';
    renderLoadoutSummary();
  });
  return tile;
}

function startBagItemDrag(event, tile, image, entry, bag) {
  if (event.button !== 0 || !event.isPrimary || bagItemDrag) return;

  clearWeightPreview();
  event.preventDefault();
  loadoutBagFrame.setPointerCapture(event.pointerId);
  bagItemDrag = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    rotation: entry.rotation ?? 0,
    tile, image, entry, bag,
  };
}

function moveBagItemDrag(event) {
  const drag = bagItemDrag;
  if (!drag || drag.pointerId !== event.pointerId) return;

  if (!drag.ghost) {
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 4) return;

    const { width, height } = drag.image.getBoundingClientRect();
    const sideways = drag.rotation === 1;
    drag.ghost = drag.image.cloneNode();
    drag.ghost.alt = '';
    drag.ghost.className = 'loadout-bag-drag-image';
    drag.ghost.style.width = `${sideways ? height : width}px`;
    drag.ghost.style.height = `${sideways ? width : height}px`;
    drag.preview = document.createElement('div');
    drag.preview.className = 'loadout-bag-drop-preview';
    drag.preview.setAttribute('aria-hidden', 'true');
    drag.tile.classList.add('is-dragging');
    document.body.append(drag.preview, drag.ghost);
  }

  drag.pointer = { clientX: event.clientX, clientY: event.clientY };
  updateBagDragPreview(drag);
}

function updateBagDragPreview(drag) {
  const { clientX, clientY } = drag.pointer;
  drag.ghost.style.left = `${clientX}px`;
  drag.ghost.style.top = `${clientY}px`;
  drag.ghost.style.setProperty('--bag-item-rotation', `${90 * drag.rotation}deg`);

  const target = getBagDropTarget(drag.pointer, drag);
  drag.preview.hidden = !target;
  if (!target) return;

  const { position, cell, plan } = target;
  const { width, height } = getBagItemSize(plan?.transfer ? plan.target : {
    item: drag.entry.item,
    rotation: drag.rotation,
  });
  drag.preview.classList.toggle('is-valid', Boolean(plan));
  drag.preview.style.left = `${cell.left + position.column * cell.width}px`;
  drag.preview.style.top = `${cell.top + position.row * cell.height}px`;
  drag.preview.style.width = `${width * cell.width}px`;
  drag.preview.style.height = `${height * cell.height}px`;
}

function getBagDropTarget({ clientX, clientY }, { entry, bag, rotation }) {
  const slotElement = document.elementFromPoint(clientX, clientY)?.closest('.loadout-bag-slot');
  if (!slotElement || !loadoutBagFrame.contains(slotElement)) return null;

  const slotIndex = Number(slotElement.dataset.slotIndex);
  const slot = bag.slots[slotIndex];
  const rect = slotElement.getBoundingClientRect();
  const cell = slot.type === 'container' ? slotElement.firstElementChild.getBoundingClientRect() : {
    left: rect.left + siteScale,
    top: rect.top + siteScale,
    width: (rect.width - 2 * siteScale) / slot.width,
    height: (rect.height - 2 * siteScale) / slot.height,
  };
  const { width, height } = getBagItemSize({ item: entry.item, rotation });
  const position = {
    slotIndex,
    column: Math.round((clientX - cell.left) / cell.width - width / 2),
    row: Math.round((clientY - cell.top) / cell.height - height / 2),
  };
  const plan = planBagItemDrop(bag, entry, position, rotation);
  return { cell, position: plan?.position ?? position, plan };
}

function bagItemPosition({ slotIndex, column, row }) {
  return { slotIndex, column, row };
}

function fitsBagSlot(slots, entry) {
  const { slotIndex, column, row } = entry;
  const slot = slots[slotIndex];
  const { width, height } = getBagItemSize(entry);
  return slot.type === 'container' && column >= 0 && row >= 0 &&
    column + width <= slot.width && row + height <= slot.height;
}

function planBagItemDrop({ slots, contents }, entry, position, rotation) {
  if (slots[position.slotIndex].type !== 'container') return null;

  const proposed = { ...entry, ...position, rotation };
  const [target, blockingItem] = contents.filter((other) => other !== entry && bagItemsOverlap(proposed, other));
  if (blockingItem) return null;
  if (!target) return fitsBagSlot(slots, proposed) ? { position } : null;

  const destination = bagItemPosition(target);
  if (target.item.code === entry.item.code) {
    const transfer = Math.min(entry.count, target.item.inventory.stackLimit - target.count);
    return transfer > 0 ? { position: destination, target, transfer } : null;
  }

  const origin = bagItemPosition(entry);
  const moved = { ...proposed, ...destination };
  const swapped = { ...target, ...origin };
  if (!fitsBagSlot(slots, moved) || !fitsBagSlot(slots, swapped) ||
      bagItemsOverlap(moved, swapped)) return null;
  const blocked = contents.some((other) => other !== entry && other !== target &&
    (bagItemsOverlap(moved, other) || bagItemsOverlap(swapped, other)));
  return blocked ? null : { position: destination, target };
}

function dropBagItem(event) {
  const drag = bagItemDrag;
  if (!drag || drag.pointerId !== event.pointerId) return;

  const plan = drag.ghost && getBagDropTarget(event, drag)?.plan;
  cancelBagItemDrag();
  if (!plan) return;

  const { entry, bag } = drag;
  if (plan.transfer) {
    plan.target.count += plan.transfer;
    entry.count -= plan.transfer;
    if (entry.count === 0) bag.contents.splice(bag.contents.indexOf(entry), 1);
  } else {
    if (plan.target) Object.assign(plan.target, bagItemPosition(entry));
    Object.assign(entry, plan.position, { rotation: drag.rotation });
  }

  loadoutBagFeedback.textContent = '';
  renderLoadoutSummary();
  renderBagSlots(bag.code);
}

function cancelBagItemDrag(event) {
  const drag = bagItemDrag;
  if (!drag || (event?.pointerId !== undefined && event.pointerId !== drag.pointerId)) return;

  bagItemDrag = undefined;
  drag.tile.classList.remove('is-dragging');
  drag.ghost?.remove();
  drag.preview?.remove();
  if (loadoutBagFrame.hasPointerCapture(drag.pointerId)) loadoutBagFrame.releasePointerCapture(drag.pointerId);
}

function createWeaponSetupPicker(section) {
  const stages = section.querySelector('.weapon-ammo-stages');
  const attachmentStages = section.querySelector('.weapon-attachment-stages');
  const feedButton = attachmentStages.querySelector('[data-attachment-stage="feed"]');
  const attachmentButtons = attachmentStages.querySelectorAll('[data-attachment-stage]:not([data-attachment-stage="feed"])');
  const magazineButton = section.querySelector('[data-ammo-stage="magazine"]');
  const ammoButton = section.querySelector('[data-ammo-stage="ammo"]');
  const result = section.querySelector('.weapon-ammo-ready-slot');
  const grid = section.querySelector('#weapon-ammo-grid');
  const pickerFrame = grid.parentElement;
  const status = section.querySelector('[role="status"]');
  const pageButtons = section.querySelectorAll('[data-direction]');
  const preparations = new Map();
  const pageSize = 12;
  let activeSlot;
  let requestId = 0;
  let entries = [];
  let page = 0;
  let lastWheelTurn;

  bindWeightPreview(magazineButton, () => getPreparedMagazineWeight(getPart(activeSlot, 'magazine')));
  bindWeightPreview(ammoButton, (ctrlKey) => {
    const ammo = getPart(activeSlot, 'ammo');
    if (!ammo) return null;

    return ctrlKey ? getBagItemAdditionWeight(ammo) : getBagAdditionWeight(ammo);
  });
  bindWeightPreview(result, () => getPreparedMagazineWeight(getPart(activeSlot, 'magazine')));
  bindWeightPreview(feedButton, () => equippedWeapons.get(activeSlot)?.attachmentSlots?.magazine?.length
    ? getPreparedMagazineWeight(getPart(activeSlot, 'magazine'))
    : getRemovalWeight(getPart(activeSlot, 'ammo'), 1));
  magazineButton.addEventListener('click', () => selectStage('magazine'));
  ammoButton.addEventListener('click', (event) => {
    if (event.ctrlKey) {
      const ammo = getPart(activeSlot, 'ammo');
      if (event.button === 0 && ammo) return placeItemInBag(ammo);
      return;
    }

    selectStage('ammo');
  });
  result.addEventListener('click', () => {
    const state = preparations.get(activeSlot);
    if (stages.hidden || !state?.magazine || !state.ammo) return;

    const magazine = createLoadedMagazine(state.magazine, state.ammo);
    if (equippedMagazines.has(activeSlot)) {
      placeItemInBag(magazine);
      return;
    }

    setEquippedMagazine(activeSlot, magazine);
  });
  feedButton.addEventListener('click', () => {
    showWeaponSetup('ammo');
    weaponSetupActions.get(activeSlot)?.ammo.focus({ preventScroll: true });
  });
  attachRemoval(feedButton, () => equippedWeapons.get(activeSlot)?.attachmentSlots?.magazine?.length ? 'magazine' : 'ammo');
  attachmentButtons.forEach((button) => {
    const stage = button.dataset.attachmentStage;
    bindWeightPreview(button, () => getRemovalWeight(getPart(activeSlot, stage)));
    button.addEventListener('click', () => selectStage(stage));
    attachRemoval(button, () => stage);
  });
  pageButtons.forEach((button) => {
    button.addEventListener('click', () => turnPage(Number(button.dataset.direction)));
  });

  pickerFrame.addEventListener('wheel', (event) => {
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    const direction = Math.sign(delta);
    if (section.hidden || attachmentStages.hidden || event.ctrlKey || !direction || !canTurnPage(direction)) return;

    event.preventDefault();
    if (lastWheelTurn?.direction === direction && event.timeStamp - lastWheelTurn.time < 220) return;

    lastWheelTurn = { direction, time: event.timeStamp };
    turnPage(direction);
  }, { passive: false });

  function open(slot, mode, stage) {
    activeSlot = slot;
    if (!preparations.has(slot)) setPreparation(slot);
    const hasMagazines = Boolean(equippedWeapons.get(slot)?.attachmentSlots?.magazine?.length);
    const showAttachments = mode === 'attachments';
    section.setAttribute('aria-label', showAttachments ? '부착물' : '탄약 준비');
    stages.hidden = showAttachments || !hasMagazines;
    attachmentStages.hidden = !showAttachments;
    selectStage(stage ?? (showAttachments ? 'optic' : hasMagazines ? 'magazine' : 'ammo'));

    if (stage) {
      const target = showAttachments
        ? attachmentStages.querySelector(`[data-attachment-stage="${stage}"]`)
        : hasMagazines ? magazineButton : weaponSetupActions.get(slot).ammo;
      target?.focus();
    }
  }

  function close() {
    requestId++;
    activeSlot = undefined;
  }

  function renderStages(state) {
    magazineButton.setAttribute('aria-pressed', String(state.stage === 'magazine'));
    ammoButton.setAttribute('aria-pressed', String(state.stage === 'ammo'));
    ammoButton.disabled = !state.magazine;
    renderAmmoStageItem(magazineButton, state.magazine);
    renderAmmoStageItem(ammoButton, state.ammo);
    const ready = state.ammo ? state.magazine : null;
    result.hidden = !ready;
    renderAmmoStageItem(result, ready, { loadedAmmo: ready ? state.ammo : null });

    if (attachmentStages.hidden) return;

    const weapon = equippedWeapons.get(activeSlot);
    const hasMagazines = Boolean(weapon.attachmentSlots?.magazine?.length);
    feedButton.disabled = !weapon.compatibleAmmoCodes?.length;
    feedButton.querySelector('.weapon-attachment-slot-label').textContent = hasMagazines ? '탄창' : '탄약';
    feedButton.querySelector('.weapon-ammo-magazine-icon').hidden = !hasMagazines;
    feedButton.querySelector('.weapon-ammo-round-icon').hidden = hasMagazines;
    renderAmmoStageItem(feedButton, hasMagazines ? state.magazine : state.ammo, { count: hasMagazines ? undefined : 1 });
    attachmentButtons.forEach((button) => {
      const stage = button.dataset.attachmentStage;
      button.setAttribute('aria-pressed', String(state.stage === stage));
      renderAmmoStageItem(button, state[stage]);
    });
  }

  function attachRemoval(button, getStage) {
    button.addEventListener('contextmenu', (event) => {
      if (clearSelection(activeSlot, getStage())) event.preventDefault();
    });
  }

  function getPart(slot, stage) {
    return preparations.get(slot)?.[stage];
  }

  function getPreparedMagazineWeight(magazine) {
    if (!magazine) return null;

    return equippedMagazines.has(activeSlot) ? getBagItemAdditionWeight(magazine) : getItemWeight(magazine);
  }

  function getSelectionWeight(item, state) {
    if (state.stage === 'magazine') return getPreparedMagazineWeight(item);
    if (state.stage === 'ammo') {
      if (state.magazine) return getBagAdditionWeight(item);

      const chamberWeight = getItemWeight(item, 1) - getItemWeight(state.ammo, 1);
      return getBagItemAdditionWeight(item).then((bagWeight) => chamberWeight + (bagWeight ?? 0));
    }
    return getItemWeight(item) - getItemWeight(state[state.stage]);
  }

  function clearSelection(slot, stage) {
    const state = preparations.get(slot);
    if (!state?.[stage]) return false;

    state[stage] = null;
    if (stage === 'magazine') state.ammo = null;
    if (stage === 'ammo') renderWeaponFeed(slot);
    renderOverviewWeaponParts(slot);
    renderLoadoutSummary();
    if (slot === activeSlot) {
      renderStages(state);
      renderPage();
    }
    return true;
  }

  function renderPage() {
    const start = page * pageSize;
    const state = preparations.get(activeSlot);
    const selectedCode = state?.[state.stage]?.code;
    const cards = entries.slice(start, start + pageSize).map((item) => {
      const card = createCatalogCard(item, () => selectItem(item), '선택', () => getSelectionWeight(item, state));
      card.querySelector('.weapon-card-action').setAttribute('aria-pressed', String(item.code === selectedCode));
      return card;
    });
    renderCatalogGrid(grid, cards, pageSize);
    pageButtons.forEach((button) => {
      button.disabled = !canTurnPage(Number(button.dataset.direction));
    });
  }

  function canTurnPage(direction) {
    const next = page + direction;
    return next >= 0 && next * pageSize < entries.length;
  }

  function turnPage(direction) {
    if (!canTurnPage(direction)) return;

    page += direction;
    renderPage();
  }

  async function selectStage(stage) {
    const state = preparations.get(activeSlot);
    const weapon = equippedWeapons.get(activeSlot);
    if (!state || !weapon || (stage === 'ammo' && weapon.attachmentSlots?.magazine?.length && !state.magazine)) return;

    clearWeightPreview(section);
    const request = ++requestId;
    state.stage = stage;
    entries = [];
    page = 0;
    lastWheelTurn = undefined;
    status.textContent = '';
    renderStages(state);
    renderPage();
    const isAmmo = stage === 'ammo';
    const codes = isAmmo ? weapon.compatibleAmmoCodes : weapon.attachmentSlots?.[stage];
    const label = isAmmo ? '탄종' : stage === 'magazine' ? '탄창' : '부착물';
    const emptyMessage = `호환되는 ${label}이 없습니다.`;
    if (!codes?.length) {
      status.textContent = emptyMessage;
      return;
    }

    status.textContent = `${label} 목록을 불러오는 중…`;
    try {
      const matches = await (isAmmo ? loadWeaponAmmo(codes)
        : loadCatalog('parts', 'localParts').then((catalog) => getItemsByCode(catalog, codes)));
      if (request !== requestId) return;

      entries = matches;
      status.textContent = entries.length ? '' : emptyMessage;
      renderPage();
    } catch (error) {
      if (request !== requestId) return;

      console.error(error);
      status.textContent = `${label} 목록을 불러올 수 없습니다.`;
    }
  }

  function selectItem(item) {
    const state = preparations.get(activeSlot);
    if (!state || !entries.includes(item)) return;

    if (state.stage === 'magazine') {
      if (state.magazine?.code !== item.code) state.ammo = null;
      state.magazine = item;
      selectStage('ammo');
      ammoButton.focus({ preventScroll: true });
    } else {
      const chamberRound = state.stage === 'ammo' && !equippedWeapons.get(activeSlot)?.attachmentSlots?.magazine?.length;
      state[state.stage] = item;
      if (chamberRound) renderWeaponFeed(activeSlot);
      renderOverviewWeaponParts(activeSlot);
      renderLoadoutSummary();
      renderStages(state);
      renderPage();
      grid.querySelector('.weapon-card-action[aria-pressed="true"]')?.focus({ preventScroll: true });
      if (chamberRound) placeItemInBag(item);
    }
  }

  function forget(slot) {
    preparations.delete(slot);
    if (activeSlot === slot) close();
  }

  function setPreparation(slot, ammo = null, magazine = null) {
    preparations.set(slot, { stage: null, ammo, magazine });
  }

  return { open, close, forget, getPart, clearSelection, setPreparation };
}

function renderAmmoStageItem(slot, item, { loadedAmmo, count } = {}) {
  const selection = loadedAmmo ? `${item.code}:${loadedAmmo.code}` : item?.code;
  if (slot.dataset.chosenItem === selection) return;

  slot.querySelector('.weapon-ammo-stage-preview')?.remove();
  if (!item) {
    delete slot.dataset.chosenItem;
    slot.removeAttribute('title');
    return;
  }

  const preview = document.createElement('span');
  preview.className = 'weapon-ammo-stage-preview';
  const image = document.createElement('img');
  image.hidden = true;
  image.addEventListener('load', () => { image.hidden = false; }, { once: true });
  image.src = catalogImageUrl(item);
  image.alt = item.name;
  const price = document.createElement('span');
  price.className = 'weapon-price';
  price.textContent = formatCatalogPrice(getItemPrice(loadedAmmo ? { ...item, loadedAmmo } : item, count));
  preview.append(image, price);
  slot.append(preview);
  slot.dataset.chosenItem = selection;
  slot.title = item.name;
}

function createCatalogPicker(section, catalogName, localCatalogKey, label, {
  emptyMessage = `${label} 목록이 비어 있습니다.`,
  loadCategory = loadPickerCategory,
  actionLabel = '장착',
  onSelect,
  onWeightPreview,
} = {}) {
  const categoryButtons = section.querySelectorAll('[data-category]');
  const pageButtons = section.querySelectorAll('[data-direction]');
  const pickerFrame = section.querySelector('.weapon-picker-frame');
  const grid = section.querySelector('.weapon-grid');
  const pageMarkers = section.querySelector('.weapon-page-markers');
  const statusLabel = section.querySelector('[role="status"]');

  let selectedCategory = section.querySelector('[data-category][aria-pressed="true"]');
  let selectedSlot = '';
  let renderedSlot;
  const categoryBySlot = new Map();
  let loadedCategory;
  let loadingCategory;
  let requestId = 0;
  let statusMessage;
  let filteredItems = [];
  let pageSize;
  let currentPage = 0;
  let lastWheelTurn;

  categoryButtons.forEach((button) => {
    button.addEventListener('click', () => {
      selectCategory(button);
      openPicker();
    });
  });

  function selectCategory(button) {
    selectedCategory.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-pressed', 'true');
    selectedCategory = button;
  }

  function setSlot(slot) {
    if (slot === selectedSlot) return;

    categoryBySlot.set(selectedSlot, selectedCategory);
    selectedSlot = slot;
    categoryButtons.forEach((button) => {
      button.hidden = slot ? button.dataset.slot !== slot : button.hasAttribute('data-item-codes');
    });
    selectCategory(categoryBySlot.get(slot) ?? Array.from(categoryButtons).find((button) => !button.hidden));
  }

  pageButtons.forEach((button) => {
    const direction = Number(button.dataset.direction);
    button.addEventListener('click', () => {
      if (canTurnPage(direction)) turnPage(direction);
    });
  });

  pickerFrame.addEventListener('wheel', (event) => {
    const direction = Math.sign(event.deltaY);
    if (!direction || event.ctrlKey || !canTurnPage(direction)) return;

    event.preventDefault();
    if (lastWheelTurn?.direction === direction && event.timeStamp - lastWheelTurn.time < 220) return;

    lastWheelTurn = { direction, time: event.timeStamp };
    turnPage(direction);
  }, { passive: false });

  function updatePageSize() {
    const style = getComputedStyle(section);
    const columns = Number(style.getPropertyValue('--picker-columns'));
    const rows = Number(style.getPropertyValue('--picker-rows'));
    const newPageSize = columns * rows;
    if (newPageSize === pageSize) return false;

    currentPage = Math.floor(currentPage * (pageSize ?? newPageSize) / newPageSize);
    pageSize = newPageSize;
    return true;
  }

  function canTurnPage(direction) {
    const nextPage = currentPage + direction;
    return nextPage >= 0 && nextPage * pageSize < filteredItems.length;
  }

  function turnPage(direction) {
    currentPage += direction;
    renderPage();
  }

  function renderPage() {
    renderedSlot = selectedSlot;
    const firstItem = currentPage * pageSize;
    const slotType = selectedCategory.dataset.slot;
    const canSelect = onSelect && (selectedSlot || !slotType);
    const slots = filteredItems.slice(firstItem, firstItem + pageSize).map((item) => createCatalogCard(item,
      canSelect ? () => onSelect(item, slotType) : undefined, actionLabel,
      canSelect && onWeightPreview ? () => onWeightPreview(item, slotType) : undefined));

    renderCatalogGrid(grid, slots, pageSize);

    let status = filteredItems.length ? '' : statusMessage ?? emptyMessage;
    if (pageMarkers) {
      const pageCount = Math.ceil(filteredItems.length / pageSize);
      const markers = document.createDocumentFragment();
      for (let page = 0; page < pageCount; page += 1) {
        const marker = document.createElement('span');
        marker.classList.toggle('is-current', page === currentPage);
        markers.append(marker);
      }
      pageMarkers.replaceChildren(markers);
      if (pageCount) status = `${currentPage + 1} / ${pageCount} 페이지`;
    }
    statusLabel.textContent = status;

    pageButtons.forEach((button) => {
      button.setAttribute('aria-disabled', String(!canTurnPage(Number(button.dataset.direction))));
    });
  }

  async function openPicker() {
    const sizeChanged = updatePageSize();
    if (selectedCategory === loadedCategory || selectedCategory === loadingCategory) {
      if (sizeChanged || renderedSlot !== selectedSlot) renderPage();
      return;
    }

    const category = selectedCategory;
    const currentRequest = ++requestId;
    const itemCodes = category.dataset.itemCodes;
    const catalogLabel = itemCodes && catalogName !== 'items' ? '아이템' : label;
    loadedCategory = undefined;
    loadingCategory = category;
    filteredItems = [];
    currentPage = 0;
    lastWheelTurn = undefined;
    statusMessage = `${catalogLabel} 목록을 불러오는 중…`;
    renderPage();

    try {
      const entries = await loadCategory(category, catalogName, localCatalogKey);
      if (currentRequest !== requestId) return;

      filteredItems = entries;
      loadedCategory = category;
      statusMessage = undefined;
      renderPage();
    } catch (error) {
      if (currentRequest !== requestId) return;

      console.error(error);
      statusMessage = `${catalogLabel} 목록을 불러올 수 없습니다.`;
      renderPage();
    } finally {
      if (currentRequest === requestId) loadingCategory = undefined;
    }
  }

  return { open: openPicker, setSlot };
}

function renderCatalogGrid(grid, cards, pageSize) {
  clearWeightPreview(grid);
  while (cards.length < pageSize) {
    const slot = document.createElement('li');
    slot.className = 'weapon-slot-empty';
    slot.setAttribute('aria-hidden', 'true');
    cards.push(slot);
  }
  grid.replaceChildren(...cards);
}

async function loadPickerCategory(category, catalogName, localCatalogKey) {
  const { itemCodes, category: tag } = category.dataset;
  if (itemCodes) {
    const items = await loadCatalog('items', 'localItems');
    return getItemsByCode(items, itemCodes.split(' '));
  }

  const entries = await loadCatalog(catalogName, localCatalogKey);
  return entries.filter((item) => item.tags.includes(tag));
}

async function loadAmmoCategory(category, catalogName, localCatalogKey) {
  const tag = category.dataset.category;
  const ammoRequest = loadCatalog(catalogName, localCatalogKey);
  const codes = ammoCodesByCategory[tag];

  if (tag === '기타') {
    const [ammo, items] = await Promise.all([ammoRequest, loadCatalog('items', 'localItems')]);
    return getItemsByCode([...ammo, ...items], codes);
  }

  const ammo = await ammoRequest;
  return codes ? getItemsByCode(ammo, codes) : ammo.filter((item) => item.name.endsWith(`(${tag})`));
}

async function loadWeaponAmmo(codes) {
  const catalogs = [];
  if (codes.some((code) => code.startsWith('AMMO-'))) catalogs.push(loadCatalog('ammo', 'localAmmo'));
  if (codes.some((code) => code.startsWith('ITEM-'))) catalogs.push(loadCatalog('items', 'localItems'));
  return getItemsByCode((await Promise.all(catalogs)).flat(), codes);
}

function getItemsByCode(entries, codes) {
  return codes.map((code) => entries.find((item) => item.code === code)).filter(Boolean);
}

function loadCatalog(catalogName, localCatalogKey, isValid = Array.isArray) {
  if (!catalogRequests.has(catalogName)) {
    const request = readCatalog(catalogName, localCatalogKey)
      .then((entries) => {
        if (!isValid(entries)) throw new Error(`Invalid catalog: ${catalogName}`);
        return entries;
      })
      .catch((error) => {
        catalogRequests.delete(catalogName);
        throw error;
      });
    catalogRequests.set(catalogName, request);
  }
  return catalogRequests.get(catalogName);
}

async function readCatalog(catalogName, localCatalogKey) {
  if (location.protocol === 'file:') {
    // A page opened from disk cannot fetch the separate JSON file.
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `./itemdata/${catalogName}.local.js`;
      script.addEventListener('load', resolve, { once: true });
      script.addEventListener('error', () => {
        script.remove();
        reject(new Error(`Could not load the local catalog: ${catalogName}`));
      }, { once: true });
      document.head.append(script);
    });
    return window[localCatalogKey];
  }

  const response = await fetch(`./itemdata/${catalogName}.json`);
  if (!response.ok) {
    throw new Error(`Could not load the ${catalogName} catalog (${response.status})`);
  }
  return response.json();
}

function createCatalogCard(item, activate, actionLabel = '장착', getWeightDelta) {
  const card = cardTemplate.content.firstElementChild.cloneNode(true);
  const { width, height } = item.inventory;
  const size = card.querySelector('.weapon-size');

  card.classList.toggle('item-card-medical', item.tags.includes('의료'));
  size.setAttribute('aria-label', `크기: 가로 ${width}칸, 세로 ${height}칸`);
  size.style.setProperty('--weapon-width', width);
  for (let cell = 0; cell < width * height; cell += 1) {
    size.append(document.createElement('span'));
  }

  const image = document.createElement('img');
  image.alt = '';
  image.hidden = true;
  image.addEventListener('load', () => { image.hidden = false; }, { once: true });
  image.addEventListener('error', () => image.remove(), { once: true });
  image.src = catalogImageUrl(item);
  card.querySelector('.weapon-art').append(image);

  card.querySelector('.weapon-name').textContent = item.name;
  const pricedQuantity = item.priceQuantity ? item.inventory.stackIncrement ?? item.priceQuantity : 1;
  card.querySelector('.weapon-price').textContent = formatCatalogPrice(getItemPrice(item, pricedQuantity));
  if (activate) {
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'weapon-card-action';
    action.setAttribute('aria-label', `${item.name} ${actionLabel}`);
    action.addEventListener('click', activate);
    card.append(action);
  }
  if (getWeightDelta) bindWeightPreview(card, getWeightDelta);
  return card;
}

function catalogImageUrl(item) {
  return `./assets/items/${encodeURIComponent(item.code)}.png`;
}

function formatCatalogPrice(price) {
  return Number.isFinite(price) ? `$${priceFormat.format(price)}` : '—';
}

function getItemPrice(item, count = item.priceQuantity ?? 1) {
  if (!Number.isFinite(item.price)) return null;

  let unitPrice = item.price / (item.priceQuantity ?? 1);
  if (item.loadedAmmo) {
    const ammoPrice = getItemPrice(item.loadedAmmo, item.capacity);
    if (ammoPrice === null) return null;
    unitPrice = Math.trunc(unitPrice + ammoPrice);
  }
  return unitPrice * count;
}
