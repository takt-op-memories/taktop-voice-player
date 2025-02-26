const CONFIG = {
    API_BASE: 'https://takt-op-memories.up.railway.app',
    DB_BASE: 'https://takt-op-memories.github.io/taktop-voice-db-',
    ASSETS: {
        FILE_LIST: '/voice.json',
    }
};

const loadHeight = () => {
    const headerHeight = document.getElementsByTagName('header')[0].clientHeight;
    const authContainer = document.querySelector('#auth-container');
    const main = document.querySelector('#main');
    const footer = document.querySelector('footer');
    const windowHeight = window.innerHeight;
    const footerHeight = footer.clientHeight;

    // Get info/warn height
    const infoElements = authContainer.querySelectorAll('.info, .warn');
    const infoHeight = Array.from(infoElements).reduce((total, element) => {
        return total + element.clientHeight;
    }, 0);

    // Adjust margins to account for info/warn height
    const adjustedMargin = headerHeight - infoHeight;
    authContainer.style.marginTop = adjustedMargin + 'px';
    main.style.marginTop = headerHeight + 'px';

    // Adjust margins according to the element being displayed
    const visibleElement = main.style.display === 'none' ? authContainer : main;

    // Alignment of info/warn elements
    infoElements.forEach(element => {
        element.style.position = 'relative';
        element.style.zIndex = '1';
    });

    // Adjust footer position
    const visibleHeight = visibleElement.clientHeight;
    const totalContentHeight = headerHeight + visibleHeight + footerHeight;

    if (totalContentHeight < windowHeight) {
        const marginBottom = windowHeight - totalContentHeight;
        visibleElement.style.marginBottom = marginBottom + 'px';
    } else {
        visibleElement.style.marginBottom = '0px';
    }
}

const Lang = {
    current: 'en',
    data: null,

    async init() {
        try {
            const response = await fetch('./src/data/i18n.json');
            this.data = await response.json();

            const savedLang = localStorage.getItem('preferred_language');
            if (savedLang) {
                this.current = savedLang;
                this.updateLangButtons();
            }

            const warningsContainers = document.querySelectorAll('.warnings-container');
            warningsContainers.forEach(container => {
                container.insertAdjacentHTML('beforebegin', `
                <div class="lang-switch">
                    <button onclick="Lang.switch('ja')" class="lang-btn ${this.current === 'ja' ? 'active' : ''}">日本語</button>
                    <button onclick="Lang.switch('en')" class="lang-btn ${this.current === 'en' ? 'active' : ''}">English</button>
                </div>
            `);

                container.innerHTML = generateWarnings();
            });

            this.apply();

        } catch (error) {
            console.error('Failed to initialize language:', error);
        }
    },

    updateLangButtons() {
        document.querySelectorAll('.lang-switch .lang-btn').forEach(btn => {
            const lang = btn.textContent === '日本語' ? 'ja' : 'en';
            btn.classList.toggle('active', this.current === lang);
        });
    },

    switch(lang) {
        if (this.current === lang) {
            return;
        }

        this.current = lang;
        localStorage.setItem('preferred_language', lang);

        document.querySelectorAll('.lang-switch .lang-btn').forEach(btn => {
            const btnLang = btn.textContent === '日本語' ? 'ja' : 'en';
            btn.classList.toggle('active', btnLang === lang);
        });

        this.apply();

        document.querySelectorAll(".warnings-container").forEach(container => {
            container.innerHTML = generateWarnings();
        });

        const statusChecker = new AuthStatusChecker();
        statusChecker.checkStatus();
    },

    async apply() {
        if (!this.data) return;

        const strings = this.data[this.current];
        if (!strings) return;

        document.title = strings.title;
        document.querySelector('.site-name').textContent = strings.title;
        document.querySelector('.warn div').textContent = strings.warning;
        document.querySelector('#auth-container h2').textContent = strings.auth.title;
        document.querySelector('#password').placeholder = strings.auth.placeholder;
        document.querySelector('#auth-error').textContent = strings.auth.error;
        document.querySelector('#auth-form button').textContent = strings.auth.submit;
        document.querySelector('footer div').textContent = strings.footer.disclaimer;

        const characterSelect = document.getElementById('character-select');
        if (characterSelect) {
            const firstOption = characterSelect.querySelector('option[value=""]');
            if (firstOption) {
                firstOption.textContent = strings.selectors.character;
            }
        }

        const categorySelect = document.getElementById('category-select');
        if (categorySelect) {
            const firstOption = categorySelect.querySelector('option[value=""]');
            if (firstOption) {
                firstOption.textContent = strings.selectors.category;
            }
        }

        const displaySelectorsButton = document.getElementById('display-selectors');
        const elementSelectors = document.getElementById('element-selectors');
        if (displaySelectorsButton && elementSelectors) {
            displaySelectorsButton.textContent = elementSelectors.style.display === 'none' ?
                strings.selectors.toggleShow :
                strings.selectors.toggleHide;
        }

        const playAllBtn = document.querySelector('.play-all-btn');
        if (playAllBtn) {
            const textSpan = playAllBtn.querySelector('span:not(.material-icons)');
            if (textSpan) {
                textSpan.textContent = VoicePlayer.isPlayingAll ?
                    strings.controls.stop :
                    strings.controls.playAll;
            }
        }

        const downloadAllBtn = document.querySelector('.bulk-controls .download-btn');
        if (downloadAllBtn) {
            const textSpan = downloadAllBtn.querySelector('span:not(.material-icons)');
            if (textSpan) {
                textSpan.textContent = strings.controls.downloadAll;
            }
        }

        VoicePlayer.updateSelectorLabels();
        await VoicePlayer.updateSelectorsLanguage();
        VoicePlayer.updateRequiredSelectionMessage();
    }
};

window.addEventListener('load', async () => {
    await Lang.init();
    await VoicePlayer.init();
    VoicePlayer.updateURLParams();
    Lang.apply();

    const statusChecker = new AuthStatusChecker();
    statusChecker.checkStatus();
    setInterval(() => statusChecker.checkStatus(), 60000);

    const savedPassword = sessionStorage.getItem(STORAGE_KEY.PASSWORD);
    if (savedPassword) {
        await authenticate();
    }

    requestAnimationFrame(() => {
        loadHeight();
    });
});

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        loadHeight();
    }, 100);
});

function generateWarnings() {
    if (!Lang?.data?.[Lang.current]) return '';
    const strings = Lang.data[Lang.current];
    return `
        <div class="warn">
            <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                viewBox="0 0 24 24">
                <path d="M12 5.99L19.53 19H4.47L12 5.99M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z"
                    fill="rgb(255, 60, 60)">
                </path>
            </svg>
            <div style="text-align: center;">
                ${strings.warning}
            </div>
        </div>
    `;
}


const STORAGE_KEY = {
    PASSWORD: 'auth_password'
};

const Auth = {
    async verify(password) {
        try {
            const response = await fetch(`${CONFIG.API_BASE}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ password })
            });
            return response.ok;
        } catch (error) {
            console.error('Authentication error:', error);
            return false;
        }
    },

    handleAuthSuccess() {
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('auth-error').style.display = 'none';
        document.getElementById('main').style.display = 'block';
        loadHeight();
    },

    clearAndReload() {
        sessionStorage.removeItem(STORAGE_KEY.PASSWORD);
        window.location.reload();
    }
};

async function authenticate(event) {
    if (event) event.preventDefault();

    const password = event ?
        document.getElementById('password').value :
        sessionStorage.getItem(STORAGE_KEY.PASSWORD);

    if (!password) return;

    const isValid = await Auth.verify(password);

    if (isValid) {
        sessionStorage.setItem(STORAGE_KEY.PASSWORD, password);
        Auth.handleAuthSuccess();
    } else {
        document.getElementById('auth-error').style.display = 'block';
        Auth.clearAndReload();
    }
}

class AuthStatusChecker {
    constructor() {
        this.statusEndpoint = 'https://takt-op-memories.up.railway.app/api/v1/secure/status';
        this.statusElement = document.getElementById('password-status');
    }

    async checkStatus() {
        try {
            if (!Lang.data) {
                console.warn('Language data not initialized yet');
                return;
            }

            const response = await fetch(this.statusEndpoint);
            if (!response.ok) {
                throw new Error('Status acquisition error');
            }

            const data = await response.json();
            this.updateStatusDisplay(data);
        } catch (error) {
            console.error('status check error:', error);
            if (Lang.data) {
                this.showError();
            }
        }
    }

    updateStatusDisplay(data) {
        if (!Lang?.data?.[Lang.current]) return;
        const strings = Lang.data[Lang.current].status;
        const now = new Date();
        const nextChange = new Date(data.nextChange);
        const timeUntilChange = nextChange - now;

        if (timeUntilChange <= 0) {
            this.statusElement.innerHTML = `
                <div class="status-info">
                    <p>${strings.updating}</p>
                </div>
            `;
            return;
        }

        const hoursRemaining = Math.floor(timeUntilChange / (1000 * 60 * 60));
        const minutesRemaining = Math.floor((timeUntilChange % (1000 * 60 * 60)) / (1000 * 60));

        this.statusElement.innerHTML = `
            <div class="status-info">
                <p>${strings.until}</p>
                <p class="time-remaining">${hoursRemaining}h${minutesRemaining}m</p>
            </div>
        `;
    }

    showError() {
        if (!Lang?.data?.[Lang.current]) return;
        const strings = Lang.data[Lang.current].status;
        this.statusElement.innerHTML = `
            <div class="status-error">
                <p>${strings.error}</p>
            </div>
        `;
    }
}

const VoicePlayer = {
    characterId: null,
    selectedCategory: null,
    selectedTypes: new Set(),
    audioElement: null,
    currentPlayingItem: null,
    isPlayingAll: false,
    progressOverlay: null,

    async init() {
        await this.loadSelectors();
        this.setupEventListeners();
    },

    async loadSelectors() {
        const params = new URLSearchParams(window.location.search);
        this.characterId = params.get('char') || '';

        const characterSelector = document.createElement('select');
        characterSelector.id = 'character-select';
        const characterLabel = document.createElement('div');
        characterLabel.className = 'selector-label';
        characterLabel.textContent = Lang.current === 'en' ? 'Character' : 'キャラクター';
        document.querySelector('.element-selector:nth-child(1) div').append(characterLabel, characterSelector);

        const categorySelector = document.createElement('select');
        categorySelector.id = 'category-select';
        const categoryLabel = document.createElement('div');
        categoryLabel.className = 'selector-label';
        categoryLabel.textContent = Lang.current === 'en' ? 'Category' : 'カテゴリー';
        document.querySelector('.element-selector:nth-child(2) div').append(categoryLabel, categorySelector);

        const typeContainer = document.createElement('div');
        typeContainer.id = 'type-container';
        const typeLabel = document.createElement('div');
        typeLabel.className = 'selector-label';
        typeLabel.textContent = Lang.current === 'en' ? 'Type' : 'タイプ';
        document.querySelector('.element-selector:nth-child(3) div').append(typeLabel, typeContainer);

        const characters = await fetch('./src/data/character.json').then(r => r.json());
        const selectText = Lang.data[Lang.current].selectors.character;
        characterSelector.innerHTML = `
            <option value="">${selectText}</option>
            ${characters.map(char => `
                <option value="${char.id}">${char.name}</option>
            `).join('')}
        `;

        document.querySelector('.element-selector:nth-child(2)').style.display = 'none';
        const categoryText = Lang.data[Lang.current].selectors.category;
        categorySelector.innerHTML = `
            <option value="">${categoryText}</option>
        `;
        this.updateToggleButtonText();

        if (this.characterId) {
            characterSelector.value = this.characterId;
            await this.onCharacterChange({ target: characterSelector });
            this.selectedCategory = params.get('category') || '';
            if (this.selectedCategory) {
                await this.loadCategories();
                categorySelector.value = this.selectedCategory;
                await this.onCategoryChange({ target: categorySelector });
                const typeParam = params.get('types');
                if (typeParam) {
                    this.selectedTypes = new Set(typeParam.split(','));
                    typeContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                        cb.checked = this.selectedTypes.has(cb.value);
                    });
                    this.updateVoiceFilters();
                }
            }
        }
        this.updateSelectorLabels();
        this.updateRequiredSelectionMessage();
    },

    updateRequiredSelectionMessage() {
        const voiceList = document.getElementById('voice-list');
        const message = Lang.data[Lang.current].messages.requiredSelection;
        let messageElement = voiceList.querySelector('.required-selection-message');

        if (!this.characterId || !this.selectedCategory) {
            if (!messageElement) {
                messageElement = document.createElement('div');
                messageElement.className = 'required-selection-message';
                voiceList.appendChild(messageElement);
            }
            messageElement.textContent = message;
        } else if (messageElement) {
            messageElement.remove();
        }
    },

    async loadCategories() {
        const categories = await fetch('./src/data/category.json').then(r => r.json());
        const categorySelect = document.getElementById('category-select');
        const selectText = Lang.data[Lang.current].selectors.category;

        categorySelect.innerHTML = `
            <option value="">${selectText}</option>
            ${categories.map(cat => `
                <option value="${cat.nameEn}">
                    ${Lang.current === 'en' ? cat.nameEn : cat.name}
                </option>
            `).join('')}
        `;
        return categories;
    },

    updateSelectorLabels() {
        const labels = {
            character: Lang.current === 'en' ? 'Character' : 'キャラクター',
            category: Lang.current === 'en' ? 'Category' : 'カテゴリー',
            type: Lang.current === 'en' ? 'Type' : 'タイプ'
        };

        const characterLabel = document.querySelector('.element-selector:nth-child(1) .selector-label');
        const categoryLabel = document.querySelector('.element-selector:nth-child(2) .selector-label');
        const typeLabel = document.querySelector('.element-selector:nth-child(3) .selector-label');

        if (characterLabel) characterLabel.textContent = labels.character;
        if (categoryLabel) categoryLabel.textContent = labels.category;
        if (typeLabel) typeLabel.textContent = labels.type;
    },

    updateURLParams() {
        const params = new URLSearchParams(window.location.search);
        if (this.characterId) {
            params.set('char', this.characterId);
        } else {
            params.delete('char');
        }
        if (this.selectedCategory) {
            params.set('category', this.selectedCategory);
        } else {
            params.delete('category');
        }
        if (this.selectedTypes.size > 0) {
            params.set('types', [...this.selectedTypes].join(','));
        } else {
            params.delete('types');
        }

        history.replaceState({}, '', `${window.location.pathname}?${params}`);
    },

    updateToggleButtonText() {
        const button = document.getElementById('display-selectors');
        const selectors = document.getElementById('element-selectors');
        const strings = Lang.data[Lang.current].selectors;
        button.textContent = selectors.style.display === 'none' ? strings.toggleShow : strings.toggleHide;
    },

    setupEventListeners() {
        document.getElementById('character-select').addEventListener('change', this.onCharacterChange.bind(this));
        document.getElementById('category-select').addEventListener('change', this.onCategoryChange.bind(this));
    },

    async onCharacterChange(event) {
        this.characterId = event.target.value;
        const categorySelect = document.getElementById('category-select');
        const categorySelector = document.querySelector('.element-selector:nth-child(2)');
        const typeSelector = document.querySelector('.element-selector:nth-child(3)');

        if (!this.characterId) {
            this.selectedCategory = null;
            this.clearSelectors();
            this.clearTypes();
            categorySelector.style.display = 'none';
            typeSelector.style.display = 'none';
            this.updateRequiredSelectionMessage();
            this.updateURLParams();
            return;
        }

        categorySelector.style.display = 'block';
        await this.loadCategories();
        categorySelect.disabled = false;
        categorySelect.classList.add('enabled');

        const categories = await fetch('./src/data/category.json').then(r => r.json());
        categorySelect.innerHTML = `
            <option value="">カテゴリーを選択</option>
            ${categories.map(cat => `
                <option value="${cat.nameEn}">${cat.name}</option>
            `).join('')}
        `;

        document.querySelector('.element-selector:nth-child(3)').style.display = 'none';

        this.selectedCategory = null;
        this.updateRequiredSelectionMessage();
        this.updateURLParams();
        this.selectedTypes.clear();
        this.clearTypes();
    },

    async onCategoryChange(event) {
        this.selectedCategory = event.target.value;
        this.updateURLParams();

        await this.updateVoiceList();

        const typeSelector = document.querySelector('.element-selector:nth-child(3)');
        if (!this.selectedCategory) {
            this.clearTypes();
            this.updateRequiredSelectionMessage();
            typeSelector.style.display = 'none';
            return;
        }

        typeSelector.style.display = 'block';

        const types = await fetch('./src/data/type.json').then(r => r.json());
        const filteredTypes = types.filter(t => t.category === this.selectedCategory);

        const typeContainer = document.getElementById('type-container');
        typeContainer.innerHTML = filteredTypes.map(type => `
            <label class="type-checkbox">
                <input type="checkbox" value="${type.nameEn}">
                ${type.name}
            </label>
        `).join('');

        await this.updateTypeFilters();
        this.updateRequiredSelectionMessage();

        typeContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
                if (cb.checked) {
                    this.selectedTypes.add(cb.value);
                } else {
                    this.selectedTypes.delete(cb.value);
                }
                this.updateVoiceList();
            });
        });
    },

    async updateTypeFilters() {
        const types = await fetch('./src/data/type.json').then(r => r.json());
        const filteredTypes = types.filter(t => t.category === this.selectedCategory);
        const currentCheckedValues = new Set(
            Array.from(document.querySelectorAll('#type-container input:checked'))
                .map(cb => cb.value)
        );

        const typeContainer = document.getElementById('type-container');
        typeContainer.innerHTML = filteredTypes.map(type => `
            <label class="type-checkbox">
                <input type="checkbox" value="${type.nameEn}"
                    ${currentCheckedValues.has(type.nameEn) ? 'checked' : ''}>
                ${Lang.current === 'en' ? type.nameEn : type.name}
            </label>
        `).join('');

        typeContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
                if (cb.checked) {
                    this.selectedTypes.add(cb.value);
                } else {
                    this.selectedTypes.delete(cb.value);
                }
                this.updateVoiceFilters();
                this.updateURLParams();
            });
        });
    },

    updateVoiceFilters() {
        const checkedTypes = new Set(
            Array.from(document.querySelectorAll('#type-container input:checked'))
                .map(cb => cb.value)
        );

        document.querySelectorAll('.voice-item').forEach(item => {
            const title = item.querySelector('.voice-title').textContent;
            const shouldShow = checkedTypes.size === 0 || [...checkedTypes].some(type => title.includes(type));
            item.style.display = shouldShow ? '' : 'none';
        });
    },

    async updateSelectorsLanguage() {
        const characters = await fetch('./src/data/character.json').then(r => r.json());
        const characterSelect = document.getElementById('character-select');
        if (characterSelect) {
            const currentValue = characterSelect.value;
            characterSelect.innerHTML = `
                <option value="">${Lang.data[Lang.current].selectors.character}</option>
                ${characters.map(char => `
                    <option value="${char.id}">${Lang.current === 'en' ? char.nameEn : char.name}</option>
                `).join('')}
            `;
            characterSelect.value = currentValue;
        }

        const categories = await fetch('./src/data/category.json').then(r => r.json());
        const categorySelect = document.getElementById('category-select');
        if (categorySelect) {
            categorySelect.innerHTML = `
                    <option value="">${Lang.data[Lang.current].selectors.category}</option>
                    ${categories.map(cat => `
                        <option value="${cat.nameEn}">${Lang.current === 'en' ? cat.nameEn : cat.name}</option>
                    `).join('')}
                `;
            categorySelect.value = this.selectedCategory || "";
        }


        await this.updateTypeFilters();

    },

    async updateVoiceList() {
        if (!this.characterId || !this.selectedCategory) return;

        try {
            const response = await fetch(`${CONFIG.DB_BASE}${this.characterId}/voice.json`);
            const data = await response.json();

            const voiceList = document.getElementById('voice-list');
            const filteredVoices = data.voices.filter(v =>
                v.category === this.selectedCategory
            );

            const strings = Lang.data[Lang.current].controls;

            voiceList.innerHTML = `
                <div class="bulk-controls">
                    <button onclick="VoicePlayer.togglePlayAll()" class="play-btn play-all-btn">
                        <span class="material-icons">play_arrow</span>
                        <span>${strings.playAll}</span>
                    </button>
                    <button onclick="VoicePlayer.confirmDownloadAll()" class="download-btn">
                        <span class="material-icons">download</span>
                        <span>${strings.downloadAll}</span>
                    </button>
                </div>
                <div class="voice-items">
                    ${this.renderVoiceItems(filteredVoices)}
                </div>
            `;
        } catch (error) {
            console.error('Failed to load voice list:', error);
        }
    },

    renderVoiceItems(voices) {
        return voices.map(voice => voice.files.map(file => `
            <div class="voice-item">
                <span class="voice-title">${file.title}</span>
                <div class="voice-controls">
                    <button onclick="VoicePlayer.togglePlay('${file.name}', this)" class="play-btn">
                        <span class="material-icons">play_arrow</span>
                    </button>
                    <button onclick="VoicePlayer.downloadVoice('${file.name}', '${file.title}')" class="download-btn">
                        <span class="material-icons">download</span>
                    </button>
                </div>
            </div>
        `).join('')).join('');
    },

    setPlayingItem(item) {
        if (item) {
            const voiceItem = item.closest('.voice-item');
            if (voiceItem) voiceItem.classList.add('playing');
        }
    },

    resetPlayingItem(item) {
        if (item) {
            const voiceItem = item.closest('.voice-item');
            if (voiceItem) voiceItem.classList.remove('playing');
        }
    },

    createProgressOverlay() {
        const strings = Lang.data[Lang.current].controls;
        const overlay = document.createElement('div');
        overlay.className = 'progress-overlay';
        overlay.innerHTML = `
            <div class="progress-box">
                <p class="progress-text">${strings.downloading}</p>
                <div class="progress-bar">
                    <div class="progress-bar-fill"></div>
                </div>
                <p class="progress-status">0%</p>
            </div>
        `;
        document.body.appendChild(overlay);
        this.progressOverlay = overlay;
    },

    updateProgress(current, total) {
        if (!this.progressOverlay) return;
        const percentage = Math.round((current / total) * 100);
        const fill = this.progressOverlay.querySelector('.progress-bar-fill');
        const status = this.progressOverlay.querySelector('.progress-status');
        fill.style.width = `${percentage}%`;
        status.textContent = `${current}/${total} (${percentage}%)`;
    },

    removeProgressOverlay() {
        if (this.progressOverlay) {
            document.body.removeChild(this.progressOverlay);
            this.progressOverlay = null;
        }
    },

    async confirmDownloadAll() {
        const strings = Lang.data[Lang.current].controls;
        if (!confirm(strings.downloadConfirm)) {
            return;
        }
        await this.downloadAll();
    },

    async downloadVoice(fileName, title) {
        const url = `${CONFIG.DB_BASE}${this.characterId}/src/wav/${fileName}.wav`;
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `${title}.wav`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
        }
    },

    togglePlay(fileName, buttonElement) {
        if (this.isPlayingAll) {
            this.stopPlayAll();
            return;
        }

        if (this.currentPlayingItem === buttonElement) {
            this.audioElement?.pause();
            this.resetPlayButton(buttonElement);
            this.resetPlayingItem(buttonElement);
            this.currentPlayingItem = null;
            return;
        }

        if (this.currentPlayingItem) {
            this.resetPlayButton(this.currentPlayingItem);
            this.resetPlayingItem(this.currentPlayingItem);
        }
        this.audioElement?.pause();

        this.audioElement = new Audio(`${CONFIG.DB_BASE}${this.characterId}/src/mp3/${fileName}.mp3`);
        this.audioElement.play();
        this.setPlayingButton(buttonElement);
        this.setPlayingItem(buttonElement);
        this.currentPlayingItem = buttonElement;

        this.audioElement.onended = () => {
            this.resetPlayButton(buttonElement);
            this.resetPlayingItem(buttonElement);
            this.currentPlayingItem = null;
        };
    },

    async togglePlayAll() {
        const playAllBtn = document.querySelector('.play-all-btn');
        const strings = Lang.data[Lang.current].controls;

        if (this.isPlayingAll) {
            this.stopPlayAll();
            return;
        }

        this.isPlayingAll = true;
        playAllBtn.classList.add('playing');
        playAllBtn.querySelector('.material-icons').textContent = 'stop';
        playAllBtn.querySelector('span:not(.material-icons)').textContent = strings.stop;

        const voiceItems = document.querySelectorAll('.voice-item');
        for (const item of voiceItems) {
            if (!this.isPlayingAll) break;

            const playBtn = item.querySelector('.play-btn');
            const fileName = playBtn.getAttribute('onclick').match(/'([^']+)'/)[1];

            if (this.currentPlayingItem) {
                this.resetPlayButton(this.currentPlayingItem);
                this.resetPlayingItem(this.currentPlayingItem);
            }

            this.setPlayingButton(playBtn);
            this.setPlayingItem(playBtn);
            this.currentPlayingItem = playBtn;

            scrollIntoViewIfNeeded(this.currentPlayingItem);

            try {
                await new Promise((resolve, reject) => {
                    this.audioElement = new Audio(`${CONFIG.DB_BASE}${this.characterId}/src/mp3/${fileName}.mp3`);
                    this.audioElement.onended = resolve;
                    this.audioElement.onerror = reject;
                    this.audioElement.play();
                });
            } catch (error) {
                console.error('Playback error:', error);
                this.stopPlayAll();
                break;
            }
        }

        this.stopPlayAll();
    },

    stopPlayAll() {
        const strings = Lang.data[Lang.current].controls;
        const playAllBtn = document.querySelector('.play-all-btn');

        this.isPlayingAll = false;
        this.audioElement?.pause();
        playAllBtn.classList.remove('playing');
        playAllBtn.querySelector('.material-icons').textContent = 'play_arrow';
        playAllBtn.querySelector('span:not(.material-icons)').textContent = strings.playAll;

        if (this.currentPlayingItem) {
            this.resetPlayButton(this.currentPlayingItem);
            this.resetPlayingItem(this.currentPlayingItem);
            this.currentPlayingItem = null;
        }
    },

    async downloadAll() {
        this.createProgressOverlay();
        const voiceItems = document.querySelectorAll('.voice-item:not([style*="display: none"])');
        const totalItems = voiceItems.length;
        const zip = new JSZip();
        let completed = 0;

        const selectedTypes = [...this.selectedTypes].join(',');

        try {
            for (const item of voiceItems) {
                const downloadBtn = item.querySelector('.download-btn');
                const [fileName, title] = downloadBtn.getAttribute('onclick').match(/'([^']+)'/g)
                    .map(str => str.replace(/'/g, ''));

                try {
                    const response = await fetch(`${CONFIG.DB_BASE}${this.characterId}/src/wav/${fileName}.wav`);
                    const blob = await response.blob();
                    zip.file(`${title}.wav`, blob);
                    completed++;
                    this.updateProgress(completed, totalItems);
                } catch (error) {
                    console.error(`Failed to download: ${title}`, error);
                }
            }

            const content = await zip.generateAsync({ type: "blob" });
            const blobUrl = window.URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = blobUrl;
            const typeSuffix = selectedTypes ? `_${selectedTypes.split(',').slice(0, 5).join(',')}` : '';
            a.download = `voice_${this.characterId}_${this.selectedCategory}${typeSuffix}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
        } finally {
            this.removeProgressOverlay();
        }
    },

    setPlayingButton(button) {
        const icon = button.querySelector('.material-icons');
        button.classList.add('playing');
        icon.textContent = 'stop';
    },

    resetPlayButton(button) {
        const icon = button.querySelector('.material-icons');
        button.classList.remove('playing');
        icon.textContent = 'play_arrow';
    },

    clearSelectors() {
        const categorySelect = document.getElementById('category-select');
        const strings = Lang.data[Lang.current].selectors;
        categorySelect.innerHTML = `<option value="">${strings.category}</option>`;
        categorySelect.disabled = true;
        this.clearTypes();
    },

    clearTypes() {
        document.getElementById('type-container').innerHTML = '';
        this.selectedTypes.clear();
        document.getElementById('voice-list').innerHTML = '';
    }
};

function toggleElementSelectors() {
    const strings = Lang.data[Lang.current].selectors;
    const selectors = document.getElementById('element-selectors');
    const button = document.getElementById('display-selectors');
    if (selectors.style.display === 'none') {
        selectors.style.display = 'block';
        button.textContent = strings.toggleHide;
    } else {
        selectors.style.display = 'none';
        button.textContent = strings.toggleShow;
    }
}

const scrollTopBtn = document.createElement('button');
scrollTopBtn.className = 'scroll-top';
scrollTopBtn.innerHTML = '<span class="material-icons">arrow_upward</span>';
document.body.appendChild(scrollTopBtn);

window.addEventListener('scroll', () => {
    scrollTopBtn.classList.toggle('visible', window.scrollY > 200);
});

scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

function scrollIntoViewIfNeeded(element) {
    element.classList.add('scrolled-into-view');
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}