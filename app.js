// ===== Global Variables =====
let currentLevel = 1;
let currentImageIndex = 0;
let currentTool = 'brush';
let currentColor = '#FF6B6B';
let brushSize = 20;
let canvas, ctx;
let outlineCanvas, outlineCtx;
let originalImage = null;
let isDrawing = false;

// Region masking for constrained drawing
let currentRegionMask = null;  // Uint8Array mask for allowed pixels
let currentRegionWidth = 0;
let currentRegionHeight = 0;
let outlinePixelData = null;   // Cached outline pixels (RGBA)
let outlineHardMask = null;    // Pixels considered real outline
let outlineBarrierMask = null; // Cached barrier mask from outlines
let lastDrawX = null;
let lastDrawY = null;
let strokeBaseImageData = null; // Snapshot of canvas at stroke start
let rainbowProgress = 0;
let blowAnimFrameId = null;
let blowPointerX = 0;
let blowPointerY = 0;
let blowHoldMs = 0;
let blowLastTimestamp = null;
let isCanvasImageRotated = false;
let currentColoringSource = 'gallery'; // 'gallery' | 'custom'
let currentColoringName = '';
let customImageObjectUrl = null;
const OUTLINE_THRESHOLD = 185;
const OUTLINE_ALPHA_THRESHOLD = 24;


// Extended color palette (64 colors): vivid primaries + pastel/watercolor tones
const colors = [
    '#FF0000', '#FF3B30', '#FF6B6B', '#E53935', '#C62828', '#B71C1C', '#FF1744', '#D50000',
    '#FF6F00', '#FF8F00', '#FFA000', '#FFB300', '#FFC107', '#FFD54F', '#FF9800', '#FF7043',
    '#FFFF00', '#FFEB3B', '#FDD835', '#FBC02D', '#F9A825', '#F57F17', '#FFF176', '#FFF59D',
    '#00C853', '#00E676', '#2ECC71', '#4CAF50', '#43A047', '#388E3C', '#66BB6A', '#A5D6A7',
    '#00BFA5', '#1DE9B6', '#26A69A', '#00ACC1', '#00BCD4', '#26C6DA', '#4DD0E1', '#80DEEA',
    '#2962FF', '#2979FF', '#1E88E5', '#1565C0', '#0D47A1', '#3F51B5', '#5C6BC0', '#90CAF9',
    '#651FFF', '#7C4DFF', '#8E24AA', '#9C27B0', '#AB47BC', '#BA68C8', '#CE93D8', '#E1BEE7',
    '#FF4081', '#F50057', '#EC407A', '#F06292', '#F48FB1', '#8D6E63', '#A1887F', '#000000'
];

// Glitter colors for sparkle effect
const glitterColors = [
    { name: 'Gold', base: '#FFD700', light: '#FFF9E6', sparkle: '#FFFACD' },
    { name: 'Silver', base: '#C0C0C0', light: '#F0F0F0', sparkle: '#FFFFFF' },
    { name: 'Pink', base: '#FF69B4', light: '#FFB6D9', sparkle: '#FFC0CB' },
    { name: 'Blue', base: '#1E90FF', light: '#87CEEB', sparkle: '#ADD8E6' },
    { name: 'Purple', base: '#9370DB', light: '#D8BFD8', sparkle: '#E6E6FA' },
    { name: 'Green', base: '#00FA9A', light: '#98FB98', sparkle: '#AFEEEE' },
    { name: 'Red', base: '#FF4500', light: '#FFA07A', sparkle: '#FFB6C1' },
    { name: 'Turquoise', base: '#40E0D0', light: '#AFEEEE', sparkle: '#E0FFFF' },
    { name: 'Orange', base: '#FF8C00', light: '#FFD700', sparkle: '#FFE4B5' },
    { name: 'Violet', base: '#EE82EE', light: '#DDA0DD', sparkle: '#F8E8FF' }
];

let currentGlitterColor = glitterColors[0]; // Default to gold
const stampEmojis = [
    '🐝', '🌸', '💛', '⭐', '🐢', '🌼', '💚', '🌟', '🐬', '🌻', '💙', '✨',
    '🐠', '🍀', '💜', '💖', '🐱', '🦋', '🌈', '❤️', '🐶', '🍓', '🧡', '💫',
    '🚗', '🚒', '🚓', '🚑', '🚜', '🚀', '☀️', '☁️', '🌙', '🎈', '🎁', '🎉'
];
const COLORS_PER_PAGE = 32;
const STAMPS_PER_PAGE = 12;
const brushSizeOptions = [5, 10, 20, 30, 50, 100, 200, 300];
let currentStampEmoji = stampEmojis[0];
let currentStampPage = 0;
let currentColorPage = 0;

const toolOptionConfig = {
    brush: { color: true, size: true, stamp: false, glitter: false },
    marker: { color: true, size: true, stamp: false, glitter: false },
    blowpen: { color: true, size: true, stamp: false, glitter: false },
    paintbomb: { color: true, size: true, stamp: false, glitter: false },
    stamp: { color: false, size: true, stamp: true, glitter: false },
    rainbow: { color: false, size: true, stamp: false, glitter: false },
    eraser: { color: false, size: true, stamp: false, glitter: false },
    glitter: { color: false, size: true, stamp: false, glitter: true }
};
const toolDisplayNames = {
    brush: '브러시',
    marker: '싸인펜',
    blowpen: '불어펜',
    paintbomb: '물감폭탄',
    stamp: '스탬프',
    rainbow: '무지개 펜',
    eraser: '지우개',
    glitter: '반짝이풀'
};
let isToolOptionsCollapsed = true;
let pendingOptionSelections = new Set();
let optionSelectionSessionId = 0;


// Level image data
const levelImages = {
    1: [
        { name: 'Baby Dino', file: 'baby_dino.png' },
        { name: 'Round Fish', file: 'round_fish.png' },
        { name: 'Police Car', file: 'police_car.png' },
        { name: 'Cat Face', file: 'cat_face.png' },
        { name: 'Fire Truck', file: 'fire_truck.png' },
        { name: 'Butterfly', file: 'butterfly.png' },
        { name: 'Sun', file: 'sun.png' },
        { name: 'Dog Face', file: 'dog_face.png' },
        { name: 'Small Rocket', file: 'small_rocket.png' },
        { name: 'Ambulance', file: 'ambulance.png' }
    ],
    2: [
        { name: 'T-Rex', file: 'trex.png' },
        { name: 'Tropical Fish', file: 'tropical_fish.png' },
        { name: 'Police Bus', file: 'police_bus.png' },
        { name: 'Ladybug', file: 'ladybug.png' },
        { name: 'Rabbit', file: 'rabbit.png' },
        { name: 'Turtle', file: 'turtle.png' },
        { name: 'Cement Mixer Truck', file: 'cement_mixer_truck.png' },
        { name: 'Robot', file: 'robot.png' },
        { name: 'Flowers', file: 'flowers.png' },
        { name: 'Truck', file: 'truck.png' }
    ],
    3: [
        { name: 'Brachiosaurus', file: 'brachiosaurus.png' },
        { name: 'Coral Fish', file: 'coral_fish.png' },
        { name: 'Fire Ladder Truck', file: 'fire_ladder_truck.png' },
        { name: 'Lion', file: 'lion.png' },
        { name: 'Elephant', file: 'elephant.png' },
        { name: 'Penguins', file: 'penguins.png' },
        { name: 'Excavator', file: 'excavator.png' },
        { name: 'Wedding Cake', file: 'wedding_cake.png' },
        { name: 'Dragon', file: 'dragon.png' },
        { name: 'Pirate Ship', file: 'pirate_ship.png' }
    ]
};

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', function () {
    initColorPalette();
    initGlitterPalette();
    initStampPalette();
    initBrushSizeSlider();
    initToolOptionsInteractions();
    const customImageInput = document.getElementById('custom-image-input');
    if (customImageInput) {
        customImageInput.addEventListener('change', handleCustomImageUpload);
        customImageInput.addEventListener('input', handleCustomImageUpload);
    }
    document.addEventListener('change', function (event) {
        const target = event.target;
        if (target && target.id === 'custom-image-input') {
            handleCustomImageUpload(event);
        }
    }, true);
    window.openCustomImagePicker = openCustomImagePicker;
    window.handleCustomImageUpload = handleCustomImageUpload;
    selectTool('brush', false);
    setToolOptionsCollapsed(true);
    registerServiceWorker();
});

function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    const isLocalHost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (isLocalHost) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
            regs.forEach((reg) => reg.unregister());
        }).catch(() => { });
        return;
    }

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((err) => {
            console.warn('Service worker registration failed:', err);
        });
    });
}

function initColorPalette() {
    const selectedIndex = colors.indexOf(currentColor);
    if (selectedIndex < 0) {
        currentColor = colors[0];
        currentColorPage = 0;
    } else {
        currentColorPage = Math.floor(selectedIndex / COLORS_PER_PAGE);
    }
    renderColorPalettePage();
}

function getColorPageCount() {
    return Math.max(1, Math.ceil(colors.length / COLORS_PER_PAGE));
}

function renderColorPalettePage() {
    const palette = document.getElementById('color-palette');
    if (!palette) return;

    const totalPages = getColorPageCount();
    currentColorPage = Math.max(0, Math.min(totalPages - 1, currentColorPage));
    const startIndex = currentColorPage * COLORS_PER_PAGE;
    const pageColors = colors.slice(startIndex, startIndex + COLORS_PER_PAGE);

    palette.innerHTML = '';
    pageColors.forEach((color) => {
        const btn = document.createElement('button');
        btn.className = 'color-btn' + (color === currentColor ? ' active' : '');
        btn.style.backgroundColor = color;
        btn.onclick = () => selectColor(color);
        palette.appendChild(btn);
    });

    const indicator = document.getElementById('color-page-indicator');
    if (indicator) {
        indicator.textContent = `${currentColorPage + 1}/${totalPages}`;
    }

    const prevBtn = document.getElementById('color-page-prev');
    if (prevBtn) {
        prevBtn.disabled = currentColorPage <= 0;
    }

    const nextBtn = document.getElementById('color-page-next');
    if (nextBtn) {
        nextBtn.disabled = currentColorPage >= totalPages - 1;
    }
}

function changeColorPage(direction) {
    const totalPages = getColorPageCount();
    currentColorPage = Math.max(0, Math.min(totalPages - 1, currentColorPage + direction));
    renderColorPalettePage();
}

function initBrushSizeSlider() {
    const palette = document.getElementById('brush-size-options');
    if (!palette) return;

    palette.innerHTML = '';

    brushSizeOptions.forEach((size) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'size-btn' + (size === brushSize ? ' active' : '');
        btn.dataset.size = String(size);
        btn.textContent = size + 'px';
        btn.onclick = () => selectBrushSize(size, btn);
        palette.appendChild(btn);
    });
}

function initToolOptionsInteractions() {
    const drawer = document.getElementById('tool-options-drawer');
    if (!drawer) return;

    // Keep option-panel scrolling gestures isolated from canvas gestures.
    const stopPropagation = (e) => e.stopPropagation();
    drawer.addEventListener('touchstart', stopPropagation, { passive: true });
    drawer.addEventListener('touchmove', stopPropagation, { passive: true });
    drawer.addEventListener('wheel', stopPropagation, { passive: true });

    const content = document.getElementById('tool-options-content');
    if (!content) return;
    content.addEventListener('touchstart', stopPropagation, { passive: true });
    content.addEventListener('touchmove', stopPropagation, { passive: true });
    content.addEventListener('wheel', stopPropagation, { passive: true });
}

function selectBrushSize(size, selectedBtn) {
    brushSize = size;

    document.querySelectorAll('.size-btn').forEach((btn) => {
        btn.classList.remove('active');
    });

    if (selectedBtn) {
        selectedBtn.classList.add('active');
    } else {
        const fallbackBtn = document.querySelector(`.size-btn[data-size="${size}"]`);
        if (fallbackBtn) fallbackBtn.classList.add('active');
    }

    markToolOptionCompleted('size');
}

function initGlitterPalette() {
    const palette = document.getElementById('glitter-palette');
    palette.innerHTML = '';

    glitterColors.forEach((glitter, index) => {
        const btn = document.createElement('button');
        btn.className = 'glitter-btn' + (index === 0 ? ' active' : '');
        btn.style.background = `linear-gradient(135deg, ${glitter.base}, ${glitter.light})`;
        btn.onclick = () => selectGlitterColor(glitter, btn);
        btn.title = glitter.name;
        palette.appendChild(btn);
    });
}


// ===== Screen Navigation =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function selectLevel(level) {
    currentLevel = level;
    displayGallery();
    showScreen('gallery-screen');
}

function updateColoringBackButton() {
    const backBtn = document.querySelector('#coloring-screen .coloring-header .back-btn');
    if (!backBtn) return;

    if (currentColoringSource === 'custom') {
        backBtn.innerHTML = '<span>&larr;</span> 처음 화면';
    } else {
        backBtn.innerHTML = '<span>&larr;</span> 그림 선택';
    }
}

function openCustomImagePicker() {
    const input = document.getElementById('custom-image-input');
    if (!input) return;
    input.value = '';
    input.click();
}

function processCustomImageFile(file) {
    if (!file) return;
    try {
        startCustomColoring(file);
    } catch (error) {
        console.error('Custom image start failed:', error);
        alert('이미지를 여는 중 오류가 발생했습니다.');
    }
}

function handleCustomImageUpload(event) {
    const input = event && event.target ? event.target : document.getElementById('custom-image-input');
    if (!input) return;
    const file = input.files && input.files[0];
    if (!file) return;

    processCustomImageFile(file);
    input.value = '';
}

function startCustomColoring(file) {
    const finalizeStart = (imageSrc) => {
        if (!imageSrc) {
            alert('이미지를 불러오지 못했습니다.');
            return;
        }

        if (customImageObjectUrl && customImageObjectUrl.startsWith('blob:')) {
            URL.revokeObjectURL(customImageObjectUrl);
        }
        customImageObjectUrl = imageSrc.startsWith('blob:') ? imageSrc : null;

        currentColoringSource = 'custom';
        currentImageIndex = -1;
        currentColoringName = (file.name || 'my_image').replace(/\.[^/.]+$/, '') || 'my_image';
        updateColoringBackButton();

        showScreen('coloring-screen');
        isCanvasImageRotated = false;
        applyCanvasRotationState();
        updateToolOptionSections(false);
        setToolOptionsCollapsed(true);
        initCanvas({
            name: currentColoringName,
            src: imageSrc
        });
    };

    if (window.URL && typeof URL.createObjectURL === 'function') {
        try {
            const blobUrl = URL.createObjectURL(file);
            finalizeStart(blobUrl);
            return;
        } catch (error) {
            console.warn('createObjectURL failed, falling back to FileReader', error);
        }
    }

    const reader = new FileReader();
    reader.onload = function (loadEvent) {
        const result = loadEvent && loadEvent.target ? loadEvent.target.result : null;
        if (typeof result === 'string' && result.length > 0) {
            finalizeStart(result);
            return;
        }
        alert('이미지를 불러오지 못했습니다.');
    };
    reader.onerror = function () {
        alert('이미지를 불러오는 중 오류가 발생했습니다.');
    };
    reader.readAsDataURL(file);
}

function goBack(target) {
    showScreen(target);
}

function goToGallery() {
    if (currentColoringSource === 'custom') {
        showScreen('main-screen');
        return;
    }
    showScreen('gallery-screen');
}

function initStampPalette() {
    const palette = document.getElementById('stamp-palette');
    if (!palette) return;

    const selectedIndex = Math.max(0, stampEmojis.indexOf(currentStampEmoji));
    currentStampPage = Math.floor(selectedIndex / STAMPS_PER_PAGE);
    renderStampPalettePage();
}

function getStampPageCount() {
    return Math.max(1, Math.ceil(stampEmojis.length / STAMPS_PER_PAGE));
}

function renderStampPalettePage() {
    const palette = document.getElementById('stamp-palette');
    if (!palette) return;

    const totalPages = getStampPageCount();
    currentStampPage = Math.max(0, Math.min(totalPages - 1, currentStampPage));
    const startIndex = currentStampPage * STAMPS_PER_PAGE;
    const pageStamps = stampEmojis.slice(startIndex, startIndex + STAMPS_PER_PAGE);

    palette.innerHTML = '';
    pageStamps.forEach((emoji) => {
        const btn = document.createElement('button');
        btn.className = 'stamp-btn' + (emoji === currentStampEmoji ? ' active' : '');
        btn.textContent = emoji;
        btn.onclick = () => selectStampEmoji(emoji);
        palette.appendChild(btn);
    });

    const indicator = document.getElementById('stamp-page-indicator');
    if (indicator) {
        indicator.textContent = `${currentStampPage + 1}/${totalPages}`;
    }

    const prevBtn = document.getElementById('stamp-page-prev');
    if (prevBtn) {
        prevBtn.disabled = currentStampPage <= 0;
    }

    const nextBtn = document.getElementById('stamp-page-next');
    if (nextBtn) {
        nextBtn.disabled = currentStampPage >= totalPages - 1;
    }
}

function changeStampPage(direction) {
    const totalPages = getStampPageCount();
    currentStampPage = Math.max(0, Math.min(totalPages - 1, currentStampPage + direction));
    renderStampPalettePage();
}

function goToMain() {
    showScreen('main-screen');
}


// ===== Gallery =====
function displayGallery() {
    const grid = document.getElementById('gallery-grid');
    const title = document.getElementById('gallery-title');

    title.textContent = currentLevel + '?④퀎 - 洹몃┝ ?좏깮';
    grid.innerHTML = '';

    levelImages[currentLevel].forEach((image, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.onclick = () => startColoring(index);

        const imagePath = 'images/level' + currentLevel + '/' + image.file;
        item.innerHTML = '<div style="height: 180px; display: flex; align-items: center; justify-content: center; background: white;">' +
            '<img src="' + imagePath + '" alt="' + image.name + '" loading="lazy" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'block\';">' +
            '<div style="display:none;">' + createThumbnailSVG(image.name) + '</div>' +
            '</div><div class="gallery-item-title">' + image.name.toUpperCase() + '</div>';

        grid.appendChild(item);
    });
}

function createThumbnailSVG(name) {
    return '<svg width="120" height="120" viewBox="0 0 120 120">' +
        '<rect x="10" y="10" width="100" height="100" fill="none" stroke="#ccc" stroke-width="2" rx="10"/>' +
        '<text x="60" y="65" text-anchor="middle" font-size="12" fill="#999">' + name + '</text>' +
        '</svg>';
}

// ===== Coloring =====
function startColoring(imageIndex) {
    currentImageIndex = imageIndex;
    const imageData = levelImages[currentLevel][imageIndex];
    currentColoringSource = 'gallery';
    currentColoringName = imageData.name;
    updateColoringBackButton();

    const coloringTitle = document.getElementById('coloring-title');
    if (coloringTitle) {
        coloringTitle.textContent = imageData.name + ' ?됱튌?섍린';
    }

    showScreen('coloring-screen');
    isCanvasImageRotated = false;
    applyCanvasRotationState();
    updateToolOptionSections(false);
    setToolOptionsCollapsed(true);
    initCanvas(imageData);
}

function applyCanvasRotationState() {
    const screen = document.getElementById('coloring-screen');
    if (!screen) return;
    screen.classList.toggle('image-rotated', isCanvasImageRotated);

    const drawer = document.getElementById('tool-options-drawer');
    if (drawer) {
        drawer.classList.toggle('rotated-for-image', isCanvasImageRotated);
    }
}

function initCanvas(imageData) {
    canvas = document.getElementById('coloring-canvas');
    ctx = canvas.getContext('2d');

    outlineCanvas = document.getElementById('outline-canvas');
    outlineCtx = outlineCanvas.getContext('2d');

    const imagePath = imageData.src ? imageData.src : ('images/level' + currentLevel + '/' + imageData.file);
    const viewport = getCanvasViewportSize();

    const img = new Image();
    img.onload = function () {
        const canvasWidth = viewport.width;
        const canvasHeight = viewport.height;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        outlineCanvas.width = canvasWidth;
        outlineCanvas.height = canvasHeight;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        outlineCtx.clearRect(0, 0, outlineCanvas.width, outlineCanvas.height);
        const bounds = getImageContentBounds(img);
        const drawPadding = Math.max(0, Math.round(Math.min(canvasWidth, canvasHeight) * 0.002));
        const fitWidth = Math.max(1, canvasWidth - drawPadding * 2);
        const fitHeight = Math.max(1, canvasHeight - drawPadding * 2);
        const shouldRotateForFit = bounds.width > bounds.height && canvasHeight > canvasWidth;
        isCanvasImageRotated = shouldRotateForFit;
        applyCanvasRotationState();
        const fitSourceWidth = shouldRotateForFit ? bounds.height : bounds.width;
        const fitSourceHeight = shouldRotateForFit ? bounds.width : bounds.height;
        const scale = Math.min(fitWidth / fitSourceWidth, fitHeight / fitSourceHeight);
        const drawWidth = Math.max(1, Math.round(bounds.width * scale));
        const drawHeight = Math.max(1, Math.round(bounds.height * scale));
        outlineCtx.save();
        outlineCtx.translate(canvasWidth / 2, canvasHeight / 2);
        if (shouldRotateForFit) {
            outlineCtx.rotate(Math.PI / 2);
        }
        outlineCtx.drawImage(
            img,
            bounds.x,
            bounds.y,
            bounds.width,
            bounds.height,
            -drawWidth / 2,
            -drawHeight / 2,
            drawWidth,
            drawHeight
        );
        outlineCtx.restore();
        cacheOutlinePixels();

        console.log('Image loaded successfully');
        console.log('Coloring canvas size:', canvas.width, 'x', canvas.height);
        console.log('Outline canvas size:', outlineCanvas.width, 'x', outlineCanvas.height);

        originalImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
        strokeBaseImageData = null;

        setupCanvasEvents();
    };

    img.onerror = function () {
        console.log('Image load failed, using placeholder:', imagePath);

        const canvasWidth = viewport.width;
        const canvasHeight = viewport.height;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        outlineCanvas.width = canvasWidth;
        outlineCanvas.height = canvasHeight;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        isCanvasImageRotated = false;
        applyCanvasRotationState();
        outlineCtx.clearRect(0, 0, outlineCanvas.width, outlineCanvas.height);
        drawPlaceholderImage(imageData.name);
        cacheOutlinePixels();

        originalImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
        strokeBaseImageData = null;

        setupCanvasEvents();
    };

    img.src = imagePath;
}

function getImageContentBounds(img) {
    const fullWidth = Math.max(1, img.width);
    const fullHeight = Math.max(1, img.height);
    const maxSampleSide = 1024;
    const sampleScale = Math.min(1, maxSampleSide / Math.max(fullWidth, fullHeight));
    const sampleWidth = Math.max(1, Math.round(fullWidth * sampleScale));
    const sampleHeight = Math.max(1, Math.round(fullHeight * sampleScale));

    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = sampleWidth;
    sampleCanvas.height = sampleHeight;
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
    if (!sampleCtx) {
        return { x: 0, y: 0, width: fullWidth, height: fullHeight };
    }
    sampleCtx.clearRect(0, 0, sampleWidth, sampleHeight);
    sampleCtx.drawImage(img, 0, 0, sampleWidth, sampleHeight);

    const data = sampleCtx.getImageData(0, 0, sampleWidth, sampleHeight).data;
    const sampleBounds = detectSampleContentBounds(data, sampleWidth, sampleHeight);
    if (!sampleBounds) {
        return { x: 0, y: 0, width: fullWidth, height: fullHeight };
    }

    const edgePadding = Math.max(1, Math.round(Math.min(sampleWidth, sampleHeight) * 0.01));
    const minX = Math.max(0, sampleBounds.minX - edgePadding);
    const minY = Math.max(0, sampleBounds.minY - edgePadding);
    const maxX = Math.min(sampleWidth - 1, sampleBounds.maxX + edgePadding);
    const maxY = Math.min(sampleHeight - 1, sampleBounds.maxY + edgePadding);

    const unscaledX = Math.floor(minX / sampleScale);
    const unscaledY = Math.floor(minY / sampleScale);
    const unscaledW = Math.ceil((maxX - minX + 1) / sampleScale);
    const unscaledH = Math.ceil((maxY - minY + 1) / sampleScale);

    const x = Math.max(0, Math.min(fullWidth - 1, unscaledX));
    const y = Math.max(0, Math.min(fullHeight - 1, unscaledY));
    const width = Math.max(1, Math.min(fullWidth - x, unscaledW));
    const height = Math.max(1, Math.min(fullHeight - y, unscaledH));

    return { x, y, width, height };
}

function detectSampleContentBounds(data, width, height) {
    const background = estimateBackgroundColor(data, width, height);
    const backgroundLum = (background.r * 3 + background.g * 4 + background.b) / 8;
    const alphaThreshold = 12;
    const darkThreshold = Math.max(105, backgroundLum - 16);
    const colorDiffThreshold = 46;
    const pixelCount = width * height;
    const mask = new Uint8Array(pixelCount);

    for (let y = 0; y < height; y++) {
        const rowStart = y * width * 4;
        for (let x = 0; x < width; x++) {
            const px = rowStart + x * 4;
            const idx = y * width + x;
            const alpha = data[px + 3];
            if (alpha <= alphaThreshold) continue;

            const r = data[px];
            const g = data[px + 1];
            const b = data[px + 2];
            const lum = (r * 3 + g * 4 + b) / 8;
            const colorDiff =
                Math.abs(r - background.r) +
                Math.abs(g - background.g) +
                Math.abs(b - background.b);

            if (lum <= darkThreshold || colorDiff >= colorDiffThreshold) {
                mask[idx] = 1;
            }
        }
    }

    if (width > 4 && height > 4) {
        const filtered = new Uint8Array(mask);
        for (let y = 1; y < height - 1; y++) {
            const rowBase = y * width;
            for (let x = 1; x < width - 1; x++) {
                const idx = rowBase + x;
                if (!mask[idx]) continue;
                let neighbors = 0;
                if (mask[idx - 1]) neighbors++;
                if (mask[idx + 1]) neighbors++;
                if (mask[idx - width]) neighbors++;
                if (mask[idx + width]) neighbors++;
                if (neighbors === 0) filtered[idx] = 0;
            }
        }
        mask.set(filtered);
    }

    const visited = new Uint8Array(pixelCount);
    const queue = new Int32Array(pixelCount);
    const minComponentArea = Math.max(30, Math.floor(pixelCount * 0.00015));
    const borderKeepArea = Math.max(1600, Math.floor(pixelCount * 0.08));

    let unionMinX = width;
    let unionMinY = height;
    let unionMaxX = -1;
    let unionMaxY = -1;

    let largestAny = null;
    let largestAnyArea = 0;
    let largestInterior = null;
    let largestInteriorArea = 0;

    for (let seed = 0; seed < pixelCount; seed++) {
        if (!mask[seed] || visited[seed]) continue;

        let qStart = 0;
        let qEnd = 0;
        queue[qEnd++] = seed;
        visited[seed] = 1;

        let area = 0;
        let minX = width;
        let minY = height;
        let maxX = -1;
        let maxY = -1;

        while (qStart < qEnd) {
            const idx = queue[qStart++];
            const y = Math.floor(idx / width);
            const x = idx - y * width;

            area++;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;

            if (x > 0) {
                const n = idx - 1;
                if (mask[n] && !visited[n]) {
                    visited[n] = 1;
                    queue[qEnd++] = n;
                }
            }
            if (x < width - 1) {
                const n = idx + 1;
                if (mask[n] && !visited[n]) {
                    visited[n] = 1;
                    queue[qEnd++] = n;
                }
            }
            if (y > 0) {
                const n = idx - width;
                if (mask[n] && !visited[n]) {
                    visited[n] = 1;
                    queue[qEnd++] = n;
                }
            }
            if (y < height - 1) {
                const n = idx + width;
                if (mask[n] && !visited[n]) {
                    visited[n] = 1;
                    queue[qEnd++] = n;
                }
            }
        }

        const touchesBorder =
            minX === 0 ||
            minY === 0 ||
            maxX === width - 1 ||
            maxY === height - 1;

        if (area > largestAnyArea) {
            largestAnyArea = area;
            largestAny = { minX, minY, maxX, maxY };
        }

        if (!touchesBorder && area > largestInteriorArea) {
            largestInteriorArea = area;
            largestInterior = { minX, minY, maxX, maxY };
        }

        if (area < minComponentArea) continue;
        if (touchesBorder && area < borderKeepArea) continue;

        if (minX < unionMinX) unionMinX = minX;
        if (minY < unionMinY) unionMinY = minY;
        if (maxX > unionMaxX) unionMaxX = maxX;
        if (maxY > unionMaxY) unionMaxY = maxY;
    }

    if (unionMaxX >= unionMinX && unionMaxY >= unionMinY) {
        return { minX: unionMinX, minY: unionMinY, maxX: unionMaxX, maxY: unionMaxY };
    }
    if (largestInterior && largestInteriorArea >= 12) {
        return largestInterior;
    }
    if (largestAny && largestAnyArea >= 12) {
        return largestAny;
    }
    return null;
}

function estimateBackgroundColor(data, width, height) {
    const valuesR = [];
    const valuesG = [];
    const valuesB = [];
    const step = Math.max(1, Math.floor(Math.min(width, height) / 180));

    function collect(x, y) {
        const px = (y * width + x) * 4;
        const alpha = data[px + 3];
        if (alpha < 200) return;
        const r = data[px];
        const g = data[px + 1];
        const b = data[px + 2];
        const lum = (r * 3 + g * 4 + b) / 8;
        if (lum < 170) return;
        valuesR.push(r);
        valuesG.push(g);
        valuesB.push(b);
    }

    for (let x = 0; x < width; x += step) {
        collect(x, 0);
        collect(x, height - 1);
    }
    for (let y = 0; y < height; y += step) {
        collect(0, y);
        collect(width - 1, y);
    }

    if (valuesR.length === 0) {
        return { r: 250, g: 250, b: 250 };
    }

    return {
        r: getMedian(valuesR),
        g: getMedian(valuesG),
        b: getMedian(valuesB)
    };
}

function getMedian(values) {
    const sorted = values.slice().sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
    }
    return sorted[middle];
}

function getCanvasViewportSize() {
    const wrapper = document.querySelector('.canvas-wrapper');
    if (wrapper) {
        const rect = wrapper.getBoundingClientRect();
        const width = Math.floor(rect.width);
        const height = Math.floor(rect.height);
        if (width > 0 && height > 0) {
            return { width, height };
        }
    }

    // Fallback size if layout is not yet measured.
    const fallbackWidth = Math.max(320, Math.floor(window.innerWidth - 140));
    const fallbackHeight = Math.max(320, Math.floor(window.innerHeight - 220));
    return { width: fallbackWidth, height: fallbackHeight };
}

// Make white/light pixels transparent on outline canvas
function makeWhiteTransparent() {
    const imageData = outlineCtx.getImageData(0, 0, outlineCanvas.width, outlineCanvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // If pixel is white or very light (near white), make it transparent
        if (r > 200 && g > 200 && b > 200) {
            data[i + 3] = 0; // Set alpha to 0 (transparent)
        }
    }

    outlineCtx.putImageData(imageData, 0, 0);
}

function setupCanvasEvents() {
    canvas.removeEventListener('mousedown', handleMouseDown);
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mouseup', handleMouseUp);
    canvas.removeEventListener('mouseleave', handleMouseUp);

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    canvas.removeEventListener('touchstart', handleTouchStart);
    canvas.removeEventListener('touchmove', handleTouchMove);
    canvas.removeEventListener('touchend', handleTouchEnd);

    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
}

function drawPlaceholderImage(name) {
    outlineCtx.strokeStyle = '#000000';
    outlineCtx.lineWidth = 3;
    outlineCtx.lineCap = 'round';
    outlineCtx.lineJoin = 'round';

    const cx = outlineCanvas.width / 2;
    const cy = outlineCanvas.height / 2;

    outlineCtx.beginPath();
    outlineCtx.arc(cx, cy, 100, 0, Math.PI * 2);
    outlineCtx.stroke();

    outlineCtx.beginPath();
    outlineCtx.arc(cx - 30, cy - 20, 15, 0, Math.PI * 2);
    outlineCtx.stroke();
    outlineCtx.beginPath();
    outlineCtx.arc(cx + 30, cy - 20, 15, 0, Math.PI * 2);
    outlineCtx.stroke();

    outlineCtx.beginPath();
    outlineCtx.arc(cx, cy + 20, 40, 0.2, Math.PI - 0.2);
    outlineCtx.stroke();

    outlineCtx.font = '20px Jua';
    outlineCtx.fillStyle = '#999';
    outlineCtx.textAlign = 'center';
    outlineCtx.fillText(name, cx, cy + 150);
}

function cacheOutlinePixels() {
    const width = outlineCanvas.width;
    const height = outlineCanvas.height;
    const outlineData = outlineCtx.getImageData(0, 0, width, height);
    outlinePixelData = outlineData.data;
    outlineBarrierMask = buildOutlineBarrierMask(width, height, outlinePixelData);
}

function isPointInCurrentRegion(x, y) {
    if (!currentRegionMask) return true;
    if (x < 0 || y < 0 || x >= currentRegionWidth || y >= currentRegionHeight) return false;
    return currentRegionMask[y * currentRegionWidth + x] === 1;
}

function isOutlinePixel(r, g, b, a) {
    if (a < OUTLINE_ALPHA_THRESHOLD) return false;
    return r < OUTLINE_THRESHOLD && g < OUTLINE_THRESHOLD && b < OUTLINE_THRESHOLD;
}

function buildOutlineBarrierMask(width, height, pixelData) {
    const size = width * height;
    const baseMask = new Uint8Array(size);
    const barrierMask = new Uint8Array(size);

    for (let i = 0; i < size; i++) {
        const pos = i * 4;
        if (isOutlinePixel(pixelData[pos], pixelData[pos + 1], pixelData[pos + 2], pixelData[pos + 3])) {
            baseMask[i] = 1;
            barrierMask[i] = 1;
        }
    }

    outlineHardMask = baseMask;
    return barrierMask;
}

function findNearestOpenIndex(startX, startY, width, height, barrierMask) {
    const maxRadius = 4;
    for (let radius = 1; radius <= maxRadius; radius++) {
        for (let dy = -radius; dy <= radius; dy++) {
            const y = startY + dy;
            if (y < 0 || y >= height) continue;

            for (let dx = -radius; dx <= radius; dx++) {
                const x = startX + dx;
                if (x < 0 || x >= width) continue;

                const idx = y * width + x;
                if (barrierMask[idx] === 0 && (!outlineHardMask || outlineHardMask[idx] === 0)) {
                    return idx;
                }
            }
        }
    }
    return -1;
}

function expandRegionMask(mask, width, height, passCount = 1) {
    let expanded = mask;

    for (let pass = 0; pass < passCount; pass++) {
        const next = expanded.slice();

        for (let y = 0; y < height; y++) {
            const row = y * width;
            for (let x = 0; x < width; x++) {
                const idx = row + x;
                if (expanded[idx] === 1) continue;
                if (outlineHardMask && outlineHardMask[idx] === 1) continue;
                if (outlineBarrierMask && outlineBarrierMask[idx] === 1) continue;

                const left = x > 0 && expanded[idx - 1] === 1;
                const right = x < width - 1 && expanded[idx + 1] === 1;
                const up = y > 0 && expanded[idx - width] === 1;
                const down = y < height - 1 && expanded[idx + width] === 1;
                const upLeft = x > 0 && y > 0 && expanded[idx - width - 1] === 1;
                const upRight = x < width - 1 && y > 0 && expanded[idx - width + 1] === 1;
                const downLeft = x > 0 && y < height - 1 && expanded[idx + width - 1] === 1;
                const downRight = x < width - 1 && y < height - 1 && expanded[idx + width + 1] === 1;

                if (left || right || up || down || upLeft || upRight || downLeft || downRight) {
                    next[idx] = 1;
                }
            }
        }

        expanded = next;
    }

    return expanded;
}

function clipRecentStrokeToRegion(x1, y1, x2, y2, extraPadding = 0) {
    if (!currentRegionMask) return;

    const padding = Math.ceil(brushSize / 2) + 2 + extraPadding;
    const minX = Math.max(0, Math.floor(Math.min(x1, x2) - padding));
    const maxX = Math.min(canvas.width - 1, Math.ceil(Math.max(x1, x2) + padding));
    const minY = Math.max(0, Math.floor(Math.min(y1, y2) - padding));
    const maxY = Math.min(canvas.height - 1, Math.ceil(Math.max(y1, y2) + padding));

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    if (width <= 0 || height <= 0) return;

    const imageData = ctx.getImageData(minX, minY, width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
        const globalY = minY + y;
        const maskRow = globalY * currentRegionWidth;
        const rowOffset = y * width * 4;

        for (let x = 0; x < width; x++) {
            const globalX = minX + x;
            if (currentRegionMask[maskRow + globalX] === 1) continue;

            const pos = rowOffset + x * 4;
            if (strokeBaseImageData) {
                const srcPos = (globalY * canvas.width + globalX) * 4;
                data[pos] = strokeBaseImageData.data[srcPos];
                data[pos + 1] = strokeBaseImageData.data[srcPos + 1];
                data[pos + 2] = strokeBaseImageData.data[srcPos + 2];
                data[pos + 3] = strokeBaseImageData.data[srcPos + 3];
            } else {
                data[pos] = 255;
                data[pos + 1] = 255;
                data[pos + 2] = 255;
                data[pos + 3] = 255;
            }
        }
    }

    ctx.putImageData(imageData, minX, minY);
}

function clearStrokeRuntimeState() {
    stopBlowPenLoop();
    isDrawing = false;
    currentRegionMask = null;
    currentRegionWidth = 0;
    currentRegionHeight = 0;
    strokeBaseImageData = null;
    rainbowProgress = 0;
    lastDrawX = null;
    lastDrawY = null;
    if (ctx) {
        ctx.beginPath();
    }
}

function stopBlowPenLoop() {
    if (blowAnimFrameId !== null) {
        cancelAnimationFrame(blowAnimFrameId);
        blowAnimFrameId = null;
    }
    blowHoldMs = 0;
    blowLastTimestamp = null;
}

function sprayBlowPen(centerX, centerY, deltaMs) {
    if (!isPointInCurrentRegion(Math.round(centerX), Math.round(centerY))) return;

    const { r, g, b } = hexToRgb(currentColor);
    const radius = Math.max(6, brushSize * 0.55);
    const baseDots = Math.max(4, Math.round(brushSize * 0.16));
    const growthDots = Math.min(34, Math.floor(blowHoldMs / 220));
    const dotsThisFrame = Math.max(1, Math.round((baseDots + growthDots) * (deltaMs / 16)));
    const alphaBase = Math.min(0.32, 0.10 + blowHoldMs / 3500);
    const minDotRadius = Math.max(1, brushSize * 0.03);
    const maxDotRadius = Math.max(2, brushSize * 0.12);

    for (let i = 0; i < dotsThisFrame; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.sqrt(Math.random()) * radius;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;

        const ix = Math.round(x);
        const iy = Math.round(y);
        if (!isPointInCurrentRegion(ix, iy)) continue;

        const dotRadius = minDotRadius + Math.random() * (maxDotRadius - minDotRadius);
        const dotAlpha = alphaBase * (0.55 + Math.random() * 0.9);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${dotAlpha})`;
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    const clipPad = Math.ceil(radius + maxDotRadius + 4);
    clipRecentStrokeToRegion(centerX, centerY, centerX, centerY, clipPad);
}

function startBlowPenLoop(startX, startY) {
    stopBlowPenLoop();
    blowPointerX = startX;
    blowPointerY = startY;
    blowHoldMs = 16;
    sprayBlowPen(startX, startY, 16);

    const tick = (ts) => {
        if (!isDrawing || currentTool !== 'blowpen') {
            stopBlowPenLoop();
            return;
        }

        if (blowLastTimestamp === null) {
            blowLastTimestamp = ts;
        }

        const deltaMs = Math.max(1, Math.min(64, ts - blowLastTimestamp));
        blowLastTimestamp = ts;
        blowHoldMs += deltaMs;
        sprayBlowPen(blowPointerX, blowPointerY, deltaMs);

        blowAnimFrameId = requestAnimationFrame(tick);
    };

    blowAnimFrameId = requestAnimationFrame(tick);
}

function drawEmojiStamp(centerX, centerY) {
    const stampSize = Math.max(24, Math.round(brushSize * 1.8));

    ctx.save();
    // Guard against style leakage from previous tools (e.g., paint bomb rgba).
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000000';
    ctx.font = `${stampSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(centerX, centerY);
    if (isCanvasImageRotated) {
        ctx.rotate(Math.PI / 2);
    }
    ctx.fillText(currentStampEmoji, 0, 0);
    ctx.restore();

    // Limit stamp effect to current region and keep neighbor cells intact.
    const pad = Math.ceil(stampSize * 0.7);
    clipRecentStrokeToRegion(centerX, centerY, centerX, centerY, pad);
}

function drawPaintBomb(centerX, centerY) {
    const { r, g, b } = hexToRgb(currentColor);
    const baseRadius = Math.min(125, Math.max(16, brushSize * 0.5));
    const outerMax = baseRadius * 3.3;
    ctx.save();

    // Core splash body (sharper falloff than before)
    const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius);
    coreGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
    coreGradient.addColorStop(0.16, `rgba(${r}, ${g}, ${b}, 0.96)`);
    coreGradient.addColorStop(0.40, `rgba(${r}, ${g}, ${b}, 0.72)`);
    coreGradient.addColorStop(0.68, `rgba(${r}, ${g}, ${b}, 0.26)`);
    coreGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.03)`);
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
    ctx.fill();

    // Opaque core to make bomb center feel dense and saturated.
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.max(4, baseRadius * 0.24), 0, Math.PI * 2);
    ctx.fill();

    // Irregular sharp droplets
    const splashCount = Math.max(18, Math.round(baseRadius * 0.7));
    for (let i = 0; i < splashCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.pow(Math.random(), 0.42) * (baseRadius * 2.0);
        const px = centerX + Math.cos(angle) * distance;
        const py = centerY + Math.sin(angle) * distance;
        const size = Math.max(1.2, (1 - distance / (baseRadius * 2.0)) * (baseRadius * 0.14) + Math.random() * (baseRadius * 0.05));
        const alpha = Math.min(0.92, 0.34 + (1 - distance / (baseRadius * 2.0)) * 0.42 + Math.random() * 0.12);

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
    }

    // Thin, long burst streaks for sharp splatter look
    const streakCount = Math.max(12, Math.round(baseRadius * 0.25));
    ctx.lineCap = 'round';
    for (let i = 0; i < streakCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const length = baseRadius * (1.0 + Math.random() * 2.25);
        const endX = centerX + Math.cos(angle) * length;
        const endY = centerY + Math.sin(angle) * length;
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.32 + Math.random() * 0.42})`;
        ctx.lineWidth = Math.max(0.9, baseRadius * (0.015 + Math.random() * 0.02));
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Add sharp micro-dot at streak tip
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.45 + Math.random() * 0.35})`;
        ctx.beginPath();
        ctx.arc(endX, endY, Math.max(0.9, baseRadius * (0.012 + Math.random() * 0.02)), 0, Math.PI * 2);
        ctx.fill();
    }

    // Outer fine droplets
    const dropletCount = Math.max(36, Math.round(baseRadius * 1.15));
    for (let i = 0; i < dropletCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = baseRadius * 1.1 + Math.random() * (outerMax - baseRadius * 1.1);
        const px = centerX + Math.cos(angle) * distance;
        const py = centerY + Math.sin(angle) * distance;
        const size = Math.max(0.8, Math.random() * (baseRadius * 0.055));
        const alpha = Math.max(0.10, 0.36 - (distance / outerMax) * 0.22 + Math.random() * 0.09);

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();

    const clipPad = Math.ceil(outerMax + baseRadius * 0.2 + 8);
    clipRecentStrokeToRegion(centerX, centerY, centerX, centerY, clipPad);
}

// ===== Event Handlers =====
function handleMouseDown(e) {
    if (currentTool === 'paintbomb') {
        const rect = canvas.getBoundingClientRect();
        const x = Math.max(0, Math.min(canvas.width - 1, Math.floor((e.clientX - rect.left) * (canvas.width / rect.width))));
        const y = Math.max(0, Math.min(canvas.height - 1, Math.floor((e.clientY - rect.top) * (canvas.height / rect.height))));

        currentRegionMask = detectRegion(x, y);
        if (!currentRegionMask) {
            clearStrokeRuntimeState();
            return;
        }

        strokeBaseImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        drawPaintBomb(x, y);
        clearStrokeRuntimeState();
        return;
    }

    if (currentTool === 'stamp') {
        const rect = canvas.getBoundingClientRect();
        const x = Math.max(0, Math.min(canvas.width - 1, Math.floor((e.clientX - rect.left) * (canvas.width / rect.width))));
        const y = Math.max(0, Math.min(canvas.height - 1, Math.floor((e.clientY - rect.top) * (canvas.height / rect.height))));

        currentRegionMask = detectRegion(x, y);
        if (!currentRegionMask) {
            clearStrokeRuntimeState();
            return;
        }

        strokeBaseImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        drawEmojiStamp(x, y);
        clearStrokeRuntimeState();
        return;
    }

    if (currentTool === 'brush' || currentTool === 'marker' || currentTool === 'blowpen' || currentTool === 'rainbow' || currentTool === 'eraser' || currentTool === 'glitter') {
        isDrawing = true;

        const rect = canvas.getBoundingClientRect();
        const x = Math.max(0, Math.min(canvas.width - 1, Math.floor((e.clientX - rect.left) * (canvas.width / rect.width))));
        const y = Math.max(0, Math.min(canvas.height - 1, Math.floor((e.clientY - rect.top) * (canvas.height / rect.height))));

        // Detect the region where user clicked and create mask
        currentRegionMask = detectRegion(x, y);
        if (!currentRegionMask) {
            // If click lands on boundary or region detection fails, skip this stroke.
            isDrawing = false;
            strokeBaseImageData = null;
            return;
        }
        strokeBaseImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (currentTool === 'rainbow') {
            rainbowProgress = 0;
        }
        lastDrawX = x;
        lastDrawY = y;
        blowPointerX = x;
        blowPointerY = y;

        // For brush and eraser, start path
        if (currentTool === 'blowpen') {
            startBlowPenLoop(x, y);
        } else if (currentTool !== 'glitter') {
            ctx.beginPath();
            ctx.moveTo(x, y);
        }
    }
}

function handleMouseMove(e) {
    if (isDrawing) {
        if (currentTool === 'blowpen') {
            const rect = canvas.getBoundingClientRect();
            blowPointerX = Math.max(0, Math.min(canvas.width - 1, Math.floor((e.clientX - rect.left) * (canvas.width / rect.width))));
            blowPointerY = Math.max(0, Math.min(canvas.height - 1, Math.floor((e.clientY - rect.top) * (canvas.height / rect.height))));
        }
        draw(e);
    }
}

function handleMouseUp() {
    clearStrokeRuntimeState();
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function handleTouchEnd(e) {
    e.preventDefault();
    canvas.dispatchEvent(new MouseEvent('mouseup'));
}

// ===== Drawing Function =====
function draw(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(canvas.width - 1, Math.floor((e.clientX - rect.left) * (canvas.width / rect.width))));
    const y = Math.max(0, Math.min(canvas.height - 1, Math.floor((e.clientY - rect.top) * (canvas.height / rect.height))));

    // Check if current position is within allowed region
    if (!isPointInCurrentRegion(x, y)) {
        // Outside allowed region, skip drawing but keep isDrawing active
        // so user can continue drawing when they come back inside
        // and do not connect long lines across boundary gaps.
        ctx.beginPath();
        ctx.moveTo(x, y);
        lastDrawX = x;
        lastDrawY = y;
        return;
    }

    if (currentTool === 'blowpen') {
        lastDrawX = x;
        lastDrawY = y;
        return;
    }

    // Use coloring canvas for drawing
    if (currentTool === 'glitter') {
        // Draw glitter effect instead of normal stroke
        drawGlitter(x, y);
        if (lastDrawX !== null && lastDrawY !== null) {
            clipRecentStrokeToRegion(lastDrawX, lastDrawY, x, y, 8);
        }
    } else if (currentTool === 'marker') {
        if (lastDrawX !== null && lastDrawY !== null) {
            drawMarkerSegment(lastDrawX, lastDrawY, x, y);
            clipRecentStrokeToRegion(lastDrawX, lastDrawY, x, y, 4);
        }
    } else if (currentTool === 'rainbow') {
        if (lastDrawX !== null && lastDrawY !== null) {
            drawRainbowSegment(lastDrawX, lastDrawY, x, y);
            clipRecentStrokeToRegion(lastDrawX, lastDrawY, x, y);
        }
    } else {
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (currentTool === 'eraser') {
            ctx.strokeStyle = 'white';
        } else {
            ctx.strokeStyle = currentColor;
        }

        ctx.lineTo(x, y);
        ctx.stroke();
        if (lastDrawX !== null && lastDrawY !== null) {
            clipRecentStrokeToRegion(lastDrawX, lastDrawY, x, y);
        }
        ctx.beginPath();
        ctx.moveTo(x, y);
    }

    lastDrawX = x;
    lastDrawY = y;
}

function hexToRgb(hex) {
    const normalized = (hex || '').replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
        return { r: 255, g: 107, b: 107 };
    }

    return {
        r: parseInt(normalized.slice(0, 2), 16),
        g: parseInt(normalized.slice(2, 4), 16),
        b: parseInt(normalized.slice(4, 6), 16)
    };
}

function drawMarkerDab(x, y) {
    const radius = Math.max(2, brushSize / 2);
    const { r, g, b } = hexToRgb(currentColor);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.92)`);
    gradient.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, 0.62)`);
    gradient.addColorStop(0.82, `rgba(${r}, ${g}, ${b}, 0.20)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.00)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}

function drawMarkerSegment(fromX, fromY, toX, toY) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.hypot(dx, dy);

    if (distance === 0) {
        drawMarkerDab(fromX, fromY);
        return;
    }

    const spacing = Math.max(2, brushSize * 0.22);
    const steps = Math.max(1, Math.ceil(distance / spacing));

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = fromX + dx * t;
        const y = fromY + dy * t;
        drawMarkerDab(x, y);
    }
}

function getRainbowColorByProgress(progress) {
    const cycleLength = 360;
    const t = (progress % cycleLength) / cycleLength;

    const stops = [
        [1.0, 0.0, 0.0],    // red
        [1.0, 0.5, 0.0],    // orange
        [1.0, 1.0, 0.0],    // yellow
        [0.0, 0.8, 0.0],    // green
        [0.0, 0.4, 1.0],    // blue
        [0.29, 0.0, 0.51],  // indigo
        [0.56, 0.0, 1.0]    // violet
    ];

    const segmentCount = stops.length - 1;
    const scaled = t * segmentCount;
    const index = Math.min(segmentCount - 1, Math.floor(scaled));
    const localT = scaled - index;

    const a = stops[index];
    const b = stops[index + 1];

    const r = Math.round((a[0] + (b[0] - a[0]) * localT) * 255);
    const g = Math.round((a[1] + (b[1] - a[1]) * localT) * 255);
    const bch = Math.round((a[2] + (b[2] - a[2]) * localT) * 255);
    return `rgb(${r}, ${g}, ${bch})`;
}

function drawRainbowSegment(fromX, fromY, toX, toY) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.hypot(dx, dy);
    if (distance === 0) return;

    const steps = Math.max(1, Math.ceil(distance / 4));
    let prevX = fromX;
    let prevY = fromY;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const x = fromX + dx * t;
        const y = fromY + dy * t;
        const segmentDistance = Math.hypot(x - prevX, y - prevY);

        ctx.strokeStyle = getRainbowColorByProgress(rainbowProgress);
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.stroke();

        rainbowProgress += segmentDistance;
        prevX = x;
        prevY = y;
    }
}

// Draw glitter particles at given position
function drawGlitter(centerX, centerY) {
    const numParticles = 8 + Math.floor(Math.random() * 5); // 8-12 particles
    const radius = brushSize / 2;

    for (let i = 0; i < numParticles; i++) {
        // Random position within brush radius
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;

        // Random size
        const size = 2 + Math.random() * 6;

        // Choose color randomly from base, light, or sparkle
        const colorChoice = Math.random();
        let color;
        if (colorChoice < 0.3) {
            color = currentGlitterColor.base;
        } else if (colorChoice < 0.7) {
            color = currentGlitterColor.light;
        } else {
            color = currentGlitterColor.sparkle;
        }

        // Draw particle (star or circle)
        if (Math.random() < 0.6) {
            // Draw star
            drawStar(x, y, size, color);
        } else {
            // Draw circle
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Draw a simple star shape
function drawStar(x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const radius = i % 2 === 0 ? size : size / 2;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.closePath();
    ctx.fill();
}

// ===== Region Detection =====
// Detect the region (outlined area) where user clicked using flood-fill
function detectRegion(startX, startY) {
    try {
        if (!outlinePixelData || !outlineBarrierMask || !outlineHardMask) return null;
        const width = outlineCanvas.width;
        const height = outlineCanvas.height;

        const startIndex = startY * width + startX;
        // Clicked on actual outline line.
        if (outlineHardMask[startIndex] === 1) {
            return null;
        }

        let seedIndex = startIndex;
        if (outlineBarrierMask[startIndex] === 1) {
            seedIndex = findNearestOpenIndex(startX, startY, width, height, outlineBarrierMask);
            if (seedIndex === -1) return null;
        }

        const mask = new Uint8Array(width * height);
        const visited = new Uint8Array(width * height);
        const stack = [seedIndex];

        while (stack.length > 0) {
            const index = stack.pop();
            if (visited[index] === 1) continue;
            visited[index] = 1;

            // Stop at barrier pixels.
            if (outlineBarrierMask[index] === 1) continue;

            mask[index] = 1;

            // Add neighbors (4-way connectivity) using index arithmetic
            const x = index % width;
            const y = (index - x) / width;
            if (x > 0) stack.push(index - 1);
            if (x < width - 1) stack.push(index + 1);
            if (y > 0) stack.push(index - width);
            if (y < height - 1) stack.push(index + width);
        }

        currentRegionWidth = width;
        currentRegionHeight = height;
        return expandRegionMask(mask, width, height, 1);
    } catch (error) {
        console.error('Error in detectRegion:', error);
        // Return null to allow drawing anywhere (fallback behavior)
        return null;
    }
}

// ===== Color Selection =====
function selectColor(color) {
    currentColor = color;
    const selectedIndex = colors.indexOf(color);
    if (selectedIndex >= 0) {
        currentColorPage = Math.floor(selectedIndex / COLORS_PER_PAGE);
    }
    renderColorPalettePage();
    markToolOptionCompleted('color');

    if (currentTool === 'eraser') {
        selectTool('brush');
    }
}

// ===== Tool Selection =====
function setToolSectionDisplay(sectionId, visible) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    section.style.display = visible ? 'block' : 'none';
    section.classList.toggle('active', visible);
}

function getToolOptionVisibility(tool) {
    return toolOptionConfig[tool] || toolOptionConfig.brush;
}

function setToolOptionsCollapsed(collapsed) {
    const drawer = document.getElementById('tool-options-drawer');
    const toggleBtn = document.getElementById('tool-options-toggle-btn');
    if (!drawer || !toggleBtn) return;

    isToolOptionsCollapsed = collapsed;
    drawer.classList.toggle('collapsed', collapsed);
    drawer.classList.toggle('open', !collapsed);
    toggleBtn.textContent = collapsed ? '?닿린' : '?リ린';
    toggleBtn.setAttribute('aria-expanded', (!collapsed).toString());
    updateToolOptionsTitle();
}

function toggleToolOptions() {
    if (isToolOptionsCollapsed) {
        startOptionSelectionSession();
        setToolOptionsCollapsed(false);
        return;
    }
    setToolOptionsCollapsed(true);
}

function updateToolOptionSections(shouldOpenDrawer = false) {
    const visibility = getToolOptionVisibility(currentTool);

    setToolSectionDisplay('color-section', visibility.color);
    setToolSectionDisplay('glitter-palette-section', visibility.glitter);
    setToolSectionDisplay('stamp-palette-section', visibility.stamp);
    setToolSectionDisplay('brush-size-section', visibility.size);

    updateToolOptionsTitle();

    if (shouldOpenDrawer) {
        startOptionSelectionSession();
        setToolOptionsCollapsed(false);
    }
}

function startOptionSelectionSession() {
    optionSelectionSessionId += 1;
    const visibility = getToolOptionVisibility(currentTool);
    pendingOptionSelections = new Set();

    if (visibility.color) pendingOptionSelections.add('color');
    if (visibility.size) pendingOptionSelections.add('size');
    if (visibility.stamp) pendingOptionSelections.add('stamp');
    if (visibility.glitter) pendingOptionSelections.add('glitter');
    updateToolOptionsTitle();
}

function markToolOptionCompleted(optionKey) {
    if (!pendingOptionSelections.has(optionKey)) {
        return;
    }

    pendingOptionSelections.delete(optionKey);
    updateToolOptionsTitle();

    if (pendingOptionSelections.size === 0) {
        const capturedSessionId = optionSelectionSessionId;
        window.setTimeout(() => {
            if (capturedSessionId === optionSelectionSessionId && pendingOptionSelections.size === 0) {
                setToolOptionsCollapsed(true);
            }
        }, 140);
    }
}

function updateToolOptionsTitle() {
    const title = document.getElementById('tool-options-title');
    if (!title) return;

    const toolName = toolDisplayNames[currentTool] || '?꾧뎄';
    if (pendingOptionSelections.size > 0 && !isToolOptionsCollapsed) {
        title.textContent = `${toolName} ?듭뀡 (${pendingOptionSelections.size})`;
        return;
    }
    title.textContent = `${toolName} ?듭뀡`;
}

function selectTool(tool, shouldOpenDrawer = true) {
    if (currentTool === 'blowpen' && tool !== 'blowpen') {
        stopBlowPenLoop();
    }
    currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    const selectedButton = document.getElementById(tool + '-tool');
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
    updateToolOptionSections(shouldOpenDrawer);

    if (canvas) {
        if (tool === 'eraser') {
            canvas.style.cursor = 'cell';
        } else if (tool === 'stamp') {
            canvas.style.cursor = 'copy';
        } else {
            canvas.style.cursor = 'crosshair';
        }
    }
}

function selectGlitterColor(glitter, btn) {
    currentGlitterColor = glitter;
    document.querySelectorAll('.glitter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    markToolOptionCompleted('glitter');
}

function selectStampEmoji(emoji) {
    currentStampEmoji = emoji;
    const selectedIndex = stampEmojis.indexOf(emoji);
    if (selectedIndex >= 0) {
        currentStampPage = Math.floor(selectedIndex / STAMPS_PER_PAGE);
    }
    renderStampPalettePage();
    markToolOptionCompleted('stamp');
}


// ===== Canvas Reset =====
function resetCanvas() {
    if (originalImage && confirm('泥섏쓬遺???ㅼ떆 ?됱튌?좉퉴??')) {
        ctx.putImageData(originalImage, 0, 0);
        strokeBaseImageData = null;
    }
}

// ===== Image Save =====
function saveImage() {
    const saveCanvas = document.createElement('canvas');
    saveCanvas.width = canvas.width;
    saveCanvas.height = canvas.height;
    const saveCtx = saveCanvas.getContext('2d');

    // Match on-screen compositing:
    // base color layer + outline layer blended with multiply.
    saveCtx.drawImage(canvas, 0, 0);
    saveCtx.globalCompositeOperation = 'multiply';
    saveCtx.drawImage(outlineCanvas, 0, 0);
    saveCtx.globalCompositeOperation = 'source-over';

    const link = document.createElement('a');
    const fallbackName = (currentImageIndex >= 0 && levelImages[currentLevel] && levelImages[currentLevel][currentImageIndex])
        ? levelImages[currentLevel][currentImageIndex].name
        : 'my_image';
    const imageName = currentColoringName || fallbackName;
    const safeImageName = (imageName || 'my_image').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'my_image';
    link.download = safeImageName + '_coloring.jpg';
    link.href = saveCanvas.toDataURL('image/jpeg', 0.95);
    link.click();

    showSaveModal();
}

function showSaveModal() {
    document.getElementById('save-modal').classList.add('active');
}

function closeSaveModal() {
    document.getElementById('save-modal').classList.remove('active');
}


