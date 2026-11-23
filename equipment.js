const sectionNav = document.querySelector('#site-nav');
const sectionButtons = sectionNav.querySelectorAll('button');
const equipmentSection = document.querySelector('#equipment');
const equipmentButton = sectionNav.querySelector('[aria-controls="equipment"]');
const loadoutBag = document.querySelector('#loadout-bag');
const loadoutBagFrame = loadoutBag.querySelector('.loadout-bag-frame');
const loadoutBagTrigger = loadoutBag.querySelector('.loadout-bag-trigger');
const loadoutBagFeedback = loadoutBag.querySelector('.loadout-bag-feedback');
const bagPickerDialog = document.querySelector('#loadout-bag-picker');
const bagPickerList = bagPickerDialog.querySelector('.loadout-bag-picker-grid');
const bagPickerStatus = bagPickerDialog.querySelector('.loadout-bag-picker-status');
const loadoutBagSummary = loadoutBag.querySelector('.loadout-bag-summary');
const loadoutWeightValue = loadoutBagSummary.querySelector('.loadout-weight-value');
const loadoutWeightStage = loadoutBagSummary.querySelector('.loadout-weight-stage');
const loadoutWeightSegments = loadoutBagSummary.querySelectorAll('.loadout-weight-gauge span');
const itemSection = document.querySelector('#loadout-items');
const ammoSection = document.querySelector('#loadout-ammo');
const loadoutSection = document.querySelector('#loadout');
const loadoutButton = sectionNav.querySelector('[aria-controls~="loadout"]');
const loadoutNav = document.querySelector('#loadout-nav');
const loadoutViews = loadoutNav.querySelectorAll('[data-loadout-view]');
const loadoutEquipmentView = loadoutNav.querySelector('[data-loadout-view="equipment"]');
const loadoutGearView = loadoutNav.querySelector('[data-loadout-view="gear"]');
const loadoutOverview = loadoutSection.querySelector('.loadout-overview');
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
const priceFormat = new Intl.NumberFormat('ko-KR');
const catalogRequests = new Map();
const equippedWeapons = new Map();
const equippedMagazines = new Map();
const bagInventories = new Map();
let bagItemDrag;
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
});
const weaponSetupPicker = createWeaponSetupPicker(weaponAmmoPreparation);
const itemPicker = createCatalogPicker(itemSection, 'items', 'localItems', '아이템', {
  emptyMessage: '',
  onSelect: placeSelectedItem,
});
const ammoPicker = createCatalogPicker(ammoSection, 'ammo', 'localAmmo', '탄약', {
  emptyMessage: '',
  loadCategory: loadAmmoCategory,
  onSelect: placeSelectedItem,
});
const gearPicker = createCatalogPicker(loadoutGear.querySelector('.gear-picker'), 'items', 'localItems', '장구', {
  onSelect: equipGear,
});

loadoutBagTrigger.addEventListener('click', () => openBagPicker());
loadoutBagFrame.addEventListener('pointermove', moveBagItemDrag);
loadoutBagFrame.addEventListener('pointerup', dropBagItem);
loadoutBagFrame.addEventListener('pointercancel', cancelBagItemDrag);
loadoutBagFrame.addEventListener('lostpointercapture', cancelBagItemDrag);
window.addEventListener('blur', cancelBagItemDrag);
window.addEventListener('keydown', (event) => {
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
window.addEventListener('resize', () => {
  if (bagPickerDialog.open) updateBagPickerBackdrop();
});

sectionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectedSection.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-pressed', 'true');
    selectedSection = button;
    updateSectionVisibility();
  });
});

loadoutViews.forEach((button) => {
  button.addEventListener('click', () => {
    selectedLoadoutView.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-pressed', 'true');
    selectedLoadoutView = button;
    updateSectionVisibility();
  });
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
  element.addEventListener('contextmenu', (event) => {
    if (!element.hasAttribute('data-equipped-item')) return;

    event.preventDefault();
    setEquippedWeapon(element.dataset.slot, null);
  });
});

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

function updateSectionVisibility() {
  cancelBagItemDrag();
  const inLoadout = selectedSection === loadoutButton;
  const loadoutView = selectedLoadoutView.dataset.loadoutView;
  const inLoadoutEquipment = inLoadout && loadoutView === 'equipment';
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

function equipWeapon(item, slot) {
  if (weaponLoadoutSlots.hidden || selectedWeaponLoadoutSlot.dataset.slot !== slot) return;

  setEquippedWeapon(slot, item);
  const { ammo: ammoAction } = weaponSetupActions.get(slot);
  if (!ammoAction.disabled) {
    showWeaponSetup('ammo');
    ammoAction.focus({ preventScroll: true });
  }
}

function setEquippedWeapon(slot, item) {
  const previousCode = equippedWeapons.get(slot)?.code;
  if (item) equippedWeapons.set(slot, item);
  else equippedWeapons.delete(slot);
  if (previousCode !== item?.code) {
    weaponSetupPicker.forget(slot);
    equippedMagazines.delete(slot);
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
  renderLoadoutWeight();
}

function renderWeaponFeed(slot) {
  const weapon = equippedWeapons.get(slot);
  const feed = weaponLoadoutFeeds.get(slot);
  feed.hidden = !weapon;
  if (!weapon) return;

  const magazine = equippedMagazines.get(slot);
  const feedType = weapon.attachmentSlots?.magazine?.length ? '탄창' : '탄약';
  const image = feed.firstElementChild;
  image.src = magazine ? catalogImageUrl(magazine) : `./assets/ui/파츠_${feedType}.png`;
  image.alt = magazine?.name ?? feedType;
}

function setEquippedMagazine(slot, magazine) {
  if (magazine) equippedMagazines.set(slot, magazine);
  else equippedMagazines.delete(slot);
  renderWeaponFeed(slot);
  renderOverviewWeaponParts(slot);
  renderLoadoutWeight();
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
    const installed = stage === 'magazine' ? equippedMagazines.get(slot) : weaponSetupPicker.getPart(slot, stage);
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
  renderLoadoutWeight();
}

function renderLoadoutWeight() {
  const equippedItems = [...equippedWeapons.values(), ...equippedMagazines.values(), ...equippedGear.values()];
  const equippedWeight = equippedItems.reduce((sum, item) => sum + (item.weight ?? 0), 0);
  const bagCode = equippedGear.get('backpack')?.code;
  const bagContents = bagInventories.get(bagCode) ?? [];
  const total = bagContents.reduce((sum, { item, count }) => sum + (item.weight ?? 0) * count, equippedWeight);

  loadoutWeightValue.textContent = (Math.round(total / 10) / 10).toFixed(1);
  loadoutWeightStage.textContent = weightStages.findLast(({ start }) => total >= start).label;
  loadoutWeightSegments.forEach((segment, index) => {
    const start = weightStages[index].start;
    const end = weightStages[index + 1]?.start ?? maxWeightGauge;
    const fill = Math.max(0, Math.min(1, (total - start) / (end - start)));
    segment.style.setProperty('--weight-fill', `${fill * 100}%`);
  });
}

function updateBagPickerBackdrop() {
  const navTop = Math.max(0, loadoutNav.getBoundingClientRect().top);
  bagPickerDialog.style.setProperty('--bag-picker-dim-start', `${navTop}px`);
}

async function openBagPicker(pendingItem) {
  if (loadoutBag.hidden || equippedGear.has('backpack') || bagPickerDialog.open) return;

  const request = ++bagPickerRequest;
  updateBagPickerBackdrop();
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
    })));
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
  renderLoadoutWeight();
  return true;
}

async function renderBagSlots(bagCode) {
  cancelBagItemDrag();
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
  price.textContent = formatCatalogPrice(item.price * entry.count);
  tile.append(image, price);

  const stack = stackLimit > 1 ? document.createElement('span') : null;
  if (stack) {
    stack.className = 'loadout-bag-item-stack';
    stack.textContent = `${entry.count}/${stackLimit}`;
    tile.append(stack);
  }

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
      price.textContent = formatCatalogPrice(item.price * entry.count);
    }
    loadoutBagFeedback.textContent = '';
    renderLoadoutWeight();
  });
  return tile;
}

function startBagItemDrag(event, tile, image, entry, bag) {
  if (event.button !== 0 || !event.isPrimary || bagItemDrag) return;

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
    left: rect.left + 1,
    top: rect.top + 1,
    width: (rect.width - 2) / slot.width,
    height: (rect.height - 2) / slot.height,
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

  magazineButton.addEventListener('click', () => selectStage('magazine'));
  ammoButton.addEventListener('click', () => selectStage('ammo'));
  result.addEventListener('click', () => {
    const state = preparations.get(activeSlot);
    if (stages.hidden || !state?.magazine || !state.ammo) return;

    const magazine = {
      ...state.magazine,
      name: `${state.magazine.name} (${state.ammo.name})`,
      loadedAmmo: state.ammo,
    };
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
    if (!preparations.has(slot)) preparations.set(slot, { stage: null, magazine: null, ammo: null });
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
    renderAmmoStageItem(result, ready);

    if (attachmentStages.hidden) return;

    const weapon = equippedWeapons.get(activeSlot);
    const hasMagazines = Boolean(weapon.attachmentSlots?.magazine?.length);
    feedButton.disabled = !weapon.compatibleAmmoCodes?.length;
    feedButton.querySelector('.weapon-attachment-slot-label').textContent = hasMagazines ? '탄창' : '탄약';
    feedButton.querySelector('.weapon-ammo-magazine-icon').hidden = !hasMagazines;
    feedButton.querySelector('.weapon-ammo-round-icon').hidden = hasMagazines;
    renderAmmoStageItem(feedButton, hasMagazines ? state.magazine : state.ammo);
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

  function clearSelection(slot, stage) {
    const state = preparations.get(slot);
    if (!state?.[stage]) return false;

    state[stage] = null;
    if (stage === 'magazine') state.ammo = null;
    renderOverviewWeaponParts(slot);
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
      const card = createCatalogCard(item, () => selectItem(item), '선택');
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
      const catalog = await (isAmmo ? loadCatalog('ammo', 'localAmmo') : loadCatalog('parts', 'localParts'));
      if (request !== requestId) return;

      entries = getItemsByCode(catalog, codes);
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
      state[state.stage] = item;
      renderOverviewWeaponParts(activeSlot);
      renderStages(state);
      renderPage();
      grid.querySelector('.weapon-card-action[aria-pressed="true"]')?.focus({ preventScroll: true });
    }
  }

  function forget(slot) {
    preparations.delete(slot);
    if (activeSlot === slot) close();
  }

  return { open, close, forget, getPart, clearSelection };
}

function renderAmmoStageItem(slot, item) {
  if (slot.dataset.chosenItem === item?.code) return;

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
  price.textContent = formatCatalogPrice(item.price);
  preview.append(image, price);
  slot.append(preview);
  slot.dataset.chosenItem = item.code;
  slot.title = item.name;
}

function createCatalogPicker(section, catalogName, localCatalogKey, label, {
  emptyMessage = `${label} 목록이 비어 있습니다.`,
  loadCategory = loadPickerCategory,
  onSelect,
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

  window.addEventListener('resize', () => {
    if (!section.closest('[hidden]') && updatePageSize()) renderPage();
  });

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
    const slots = filteredItems.slice(firstItem, firstItem + pageSize).map((item) =>
      createCatalogCard(item, canSelect ? () => onSelect(item, slotType) : undefined));

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

function createCatalogCard(item, activate, actionLabel = '장착') {
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
  card.querySelector('.weapon-price').textContent = formatCatalogPrice(item.price);
  if (activate) {
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'weapon-card-action';
    action.setAttribute('aria-label', `${item.name} ${actionLabel}`);
    action.addEventListener('click', activate);
    card.append(action);
  }
  return card;
}

function catalogImageUrl(item) {
  return `./assets/items/${encodeURIComponent(item.code)}.png`;
}

function formatCatalogPrice(price) {
  return `$${priceFormat.format(price)}`;
}
