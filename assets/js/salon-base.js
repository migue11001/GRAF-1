class VoiceWallApp {
    constructor(config) {
        this.config = config;
        this.notes = [];
        
        this.voiceWallDia = document.getElementById('voice-wall-dia');
        this.voiceWallSemana = document.getElementById('voice-wall-semana');
        this.voiceWallMes = document.getElementById('voice-wall-mes');
        this.headerButtons = document.querySelectorAll('.header-button');
        
        this.init();
    }

    init() {
        this.headerButtons.forEach(button => {
            button.addEventListener('click', (e) => this.scrollToPeriod(e.target.dataset.period));
        });
        
        this.loadNotes();
        
        // Clean expired notes periodically
        setInterval(() => {
            this.cleanExpiredNotes();
            this.renderNotes();
        }, 60000); // Check every minute
        
        // Initial cleanup
        this.cleanExpiredNotes();
    }

    scrollToPeriod(period) {
        this.headerButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-period="${period}"]`).classList.add('active');
        
        const sectionId = period === 'dia' ? 'voice-wall-dia' : 
                         period === 'semana' ? 'voice-wall-semana' : 'voice-wall-mes';
        const section = document.getElementById(sectionId).parentElement;
        section.scrollIntoView({ behavior: 'smooth' });
        
        console.log(`Scrolled to ${period} section`);
    }

    getFilteredNotesByPeriod(period) {
        const now = new Date();
        
        const filtered = this.notes.filter(note => {
            const noteDate = new Date(note.timestamp);
            const expirationDate = new Date(note.expirationDate);
            
            if (now > expirationDate) {
                return false;
            }
            
            const timeDiff = now - noteDate;
            switch(period) {
                case 'dia':
                    return note.publishPeriod === 'day' || timeDiff <= 24 * 60 * 60 * 1000;
                case 'semana':
                    return note.publishPeriod === 'week' || timeDiff <= 7 * 24 * 60 * 60 * 1000;
                case 'mes':
                    return note.publishPeriod === 'month' || timeDiff <= 30 * 24 * 60 * 60 * 1000;
                default:
                    return true;
            }
        });
        
        filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        const maxSlots = 20;
        const slots = [];
        
        for (let i = 0; i < maxSlots; i++) {
            const slotNumber = this.generateSlotNumber(period, i + 1);
            const noteForSlot = filtered[i];
            
            if (noteForSlot) {
                noteForSlot.slotNumber = slotNumber;
                noteForSlot.vacio = false;
                noteForSlot.publicado = true;
                slots.push(noteForSlot);
            } else {
                slots.push({
                    id: `empty-${period}-${i}`,
                    slotNumber: slotNumber,
                    vacio: true,
                    publicado: false,
                    isEmpty: true,
                    period: period,
                    slotIndex: i
                });
            }
        }
        
        return slots;
    }

    cleanExpiredNotes() {
        const now = new Date();
        const originalLength = this.notes.length;
        const expiredNotes = [];
        
        this.notes = this.notes.filter(note => {
            const expirationDate = new Date(note.expirationDate);
            const isExpired = now > expirationDate;
            const isCancelled = note.cancelled;
            
            if (isExpired || isCancelled) {
                expiredNotes.push(note);
                if (note.slotNumber) {
                    this.logSlotLiberation(note.slotNumber, isExpired ? 'expired' : 'cancelled');
                }
                return false;
            }
            
            return true;
        });
        
        if (this.notes.length !== originalLength) {
            this.saveNotes();
            console.log(`🧹 LIMPIEZA: ${originalLength - this.notes.length} notas eliminadas (${expiredNotes.length} expiradas/canceladas)`);
        }
    }

    calculateExpirationDate(publishPeriod, timestamp) {
        const startDate = new Date(timestamp);
        const expirationDate = new Date(startDate);
        
        switch(publishPeriod) {
            case 'day':
                expirationDate.setHours(expirationDate.getHours() + 24);
                break;
            case 'week':
                expirationDate.setDate(expirationDate.getDate() + 7);
                break;
            case 'month':
                expirationDate.setDate(expirationDate.getDate() + 30);
                break;
            default:
                expirationDate.setHours(expirationDate.getHours() + 24);
        }
        
        return expirationDate;
    }

    generateSlotNumber(period, position) {
        const periodMap = { 'dia': 'dia', 'semana': 'semana', 'mes': 'mes' };
        const formattedPosition = position.toString().padStart(2, '0');
        return `${this.config.slotPrefix}_${periodMap[period]}_${formattedPosition}`;
    }

    generateUserID() {
        let userID = localStorage.getItem('grafiter_userID');
        if (!userID) {
            userID = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('grafiter_userID', userID);
        }
        return userID;
    }

    logSlotOccupation(slotNumber, note) {
        const userID = this.generateUserID();
        const logEntry = {
            slotNumber: slotNumber,
            userID: userID,
            language: this.config.lang,
            timestamp: new Date().toISOString(),
            noteType: note.type || 'voice_recording',
            noteID: note.id
        };
        
        console.log(`🎯 SLOT OCUPADO: ${slotNumber} | UserID: ${userID} | Idioma: ${this.config.lang} | ${logEntry.timestamp}`);
        
        let slotHistory = JSON.parse(localStorage.getItem('slot_occupation_history') || '[]');
        slotHistory.push(logEntry);
        if (slotHistory.length > 1000) slotHistory = slotHistory.slice(-1000);
        localStorage.setItem('slot_occupation_history', JSON.stringify(slotHistory));
        
        return logEntry;
    }

    logSlotLiberation(slotNumber, reason = 'expired') {
        const logEntry = {
            slotNumber: slotNumber,
            reason: reason,
            language: this.config.lang,
            timestamp: new Date().toISOString()
        };
        
        console.log(`🔄 SLOT LIBERADO: ${slotNumber} | Razón: ${reason} | Idioma: ${this.config.lang} | ${logEntry.timestamp}`);
        
        let liberationHistory = JSON.parse(localStorage.getItem('slot_liberation_history') || '[]');
        liberationHistory.push(logEntry);
        if (liberationHistory.length > 1000) liberationHistory = liberationHistory.slice(-1000);
        localStorage.setItem('slot_liberation_history', JSON.stringify(liberationHistory));
        
        return logEntry;
    }

    renderNotes() {
        this.renderNotesForPeriod('dia', this.voiceWallDia);
        this.renderNotesForPeriod('semana', this.voiceWallSemana);
        this.renderNotesForPeriod('mes', this.voiceWallMes);
    }

    renderNotesForPeriod(period, container) {
        container.innerHTML = '';
        const slots = this.getFilteredNotesByPeriod(period);
        
        slots.forEach((slot, index) => {
            const postElement = document.createElement('div');
            
            if (slot.isEmpty) {
                postElement.className = 'voice-post empty-slot';
                postElement.dataset.slotId = slot.id;
                postElement.dataset.slotNumber = slot.slotNumber;
                postElement.innerHTML = `<div class="grafiter-watermark">GRAFITER</div>`;
            } else {
                const note = slot;
                postElement.className = 'voice-post';
                postElement.dataset.noteId = note.id;
                postElement.dataset.slotNumber = note.slotNumber;
                postElement.dataset.userId = note.userID;

                if (note.slotNumber && !note.logged) {
                    this.logSlotOccupation(note.slotNumber, note);
                    note.logged = true;
                }

                const country = note.country || this.config.country;
                const now = new Date();
                const expirationDate = new Date(note.expirationDate);
                const timeLeft = expirationDate - now;
                
                const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                
                let timeLeftText = this.config.strings.expired;
                if (timeLeft > 0) {
                    if (daysLeft > 0) timeLeftText = `${daysLeft}${this.config.strings.daysRemaining}`;
                    else if (hoursLeft > 0) timeLeftText = `${hoursLeft}${this.config.strings.hoursRemaining}`;
                    else timeLeftText = this.config.strings.expiresSoon;
                }
                
                const formattedDate = note.timestamp.toLocaleDateString(this.config.locale, { year: 'numeric', month: 'short', day: 'numeric' });
                const formattedTime = note.timestamp.toLocaleTimeString(this.config.locale, { hour: '2-digit', minute: '2-digit' });

                const contentTypeIcon = this.getContentTypeIcon(note.type);
                const contentHtml = this.generateNoteContent(note, index);

                postElement.innerHTML = `
                    <div class="post-header">
                        <div class="user-avatar">${contentTypeIcon}</div>
                        <div class="post-user-info">
                            <div class="post-username">${this.config.strings.userLabel} ${country}</div>
                            <div class="post-timestamp">${formattedDate} • ${formattedTime}</div>
                        </div>
                        <div class="post-controls">
                            <div class="time-left">${timeLeftText}</div>
                            <button class="cancel-button" data-note-id="${note.id}" title="Cancelar publicación">❌</button>
                        </div>
                    </div>
                    ${contentHtml}
                    <div class="post-actions">
                        <div class="play-control">
                            <button class="play-button">${note.audioUrl ? '▶' : '🔒'}</button>
                            <div class="wave-indicator">
                                <div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div>
                            </div>
                            ${!note.audioUrl ? `<span class="unavailable-text">${this.config.strings.audioUnavailable}</span>` : ''}
                        </div>
                    </div>
                `;
                
                postElement.querySelector('.play-button')?.addEventListener('click', (e) => { e.stopPropagation(); this.playNote(note, postElement); });
                postElement.querySelector('.cancel-button')?.addEventListener('click', (e) => { e.stopPropagation(); this.cancelPublication(note.id); });
            }
            container.appendChild(postElement);
        });
    }

    getContentTypeIcon(type) {
        const icons = { 'audio_upload': '🎵', 'image': '🖼️', 'text': '📝', 'url': '🔗', 'voice_recording': '🎤' };
        return icons[type] || '🎤';
    }

    generateNoteContent(note, index) {
        const s = this.config.strings;
        switch (note.type) {
            case 'text':
                return `<div class="post-content"><div class="post-title">${note.title || s.textNote}</div><div class="post-description">${note.content || s.textContent}</div></div>`;
            case 'url':
                return `<div class="post-content"><div class="post-title">${note.title || s.sharedLink}</div><div class="post-url-preview">${note.url || ''}</div>${note.description ? `<div class="post-description">${note.description}</div>` : ''}</div>`;
            default:
                const country = note.country || this.config.country;
                const formattedDate = note.timestamp.toLocaleDateString(this.config.locale, { year: 'numeric', month: 'short', day: 'numeric' });
                const formattedTime = note.timestamp.toLocaleTimeString(this.config.locale, { hour: '2-digit', minute: '2-digit' });
                return `<div class="post-content"><div class="post-title">${s.voiceNote} ${country} #${index + 1}</div><div class="post-description">Grabación desde VoiceBox • ${formattedDate} ${formattedTime}</div></div>`;
        }
    }

    cancelPublication(noteId) {
        if (confirm(this.config.strings.cancelConfirm)) {
            const noteIndex = this.notes.findIndex(note => note.id == noteId);
            if (noteIndex !== -1) {
                const note = this.notes[noteIndex];
                if (note.slotNumber) {
                    this.logSlotLiberation(note.slotNumber, 'cancelled');
                }
                this.notes[noteIndex].cancelled = true;
                this.saveNotes();
                this.renderNotes();
                console.log(`Publication ${noteId} cancelled and slot freed`);
                this.showMessage(this.config.strings.cancelSuccess, 'success');
            }
        }
    }

    showMessage(text, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `position: fixed; top: 100px; right: 20px; background: ${type === 'success' ? 'rgba(30, 215, 96, 0.9)' : 'rgba(255, 165, 0, 0.9)'}; color: white; padding: 1rem 2rem; border-radius: 8px; z-index: 1000; animation: slideInRight 0.3s ease;`;
        messageDiv.textContent = text;
        document.body.appendChild(messageDiv);
        setTimeout(() => messageDiv.remove(), 4000);
    }

    playNote(note, postElement) {
        const playButton = postElement.querySelector('.play-button');
        if (!note.audioUrl) {
            playButton.textContent = '❌';
            setTimeout(() => { playButton.textContent = '🔒'; }, 1000);
            alert(this.config.strings.audioNotAvailableAlert);
            return;
        }

        document.querySelectorAll('.voice-post.playing').forEach(el => {
            el.classList.remove('playing');
            el.querySelector('.play-button').textContent = '▶';
            el.querySelector('.play-button').classList.remove('playing');
        });

        const audio = new Audio(note.audioUrl);
        postElement.classList.add('playing');
        playButton.classList.add('playing');
        playButton.textContent = '⏸️';
        audio.play();
        
        audio.onended = () => {
            postElement.classList.remove('playing');
            playButton.classList.remove('playing');
            playButton.textContent = '▶';
        };

        playButton.onclick = (e) => {
            e.stopPropagation();
            if (audio.paused) {
                audio.play();
                playButton.textContent = '⏸️';
                postElement.classList.add('playing');
                playButton.classList.add('playing');
            } else {
                audio.pause();
                playButton.textContent = '▶';
                postElement.classList.remove('playing');
                playButton.classList.remove('playing');
            }
        };
    }

    loadNotes() {
        try {
            const savedNotes = localStorage.getItem(this.config.storageKey);
            if (savedNotes) {
                const noteMetadata = JSON.parse(savedNotes);
                this.notes = noteMetadata.map(meta => {
                    const note = { ...meta, timestamp: new Date(meta.timestamp), audioUrl: null };
                    if (!note.expirationDate) {
                        note.expirationDate = this.calculateExpirationDate(note.publishPeriod || 'day', note.timestamp);
                    } else {
                        note.expirationDate = new Date(note.expirationDate);
                    }
                    if (!note.userID) note.userID = this.generateUserID();
                    return note;
                });
                console.log(`Publicaciones de ${this.config.lang} cargadas:`, this.notes.length);
            } else {
                this.notes = [];
            }
        } catch (error) {
            console.error('Error cargando publicaciones:', error);
            this.notes = [];
        }
        this.renderNotes();
    }

    saveNotes() {
        const noteMetadata = this.notes.map(note => ({
            id: note.id,
            timestamp: note.timestamp,
            language: note.language,
            country: note.country || this.config.country,
            type: note.type,
            title: note.title,
            content: note.content,
            url: note.url,
            description: note.description,
            publishPeriod: note.publishPeriod,
            expirationDate: note.expirationDate,
            slotNumber: note.slotNumber,
            userID: note.userID,
            cancelled: note.cancelled
        }));
        localStorage.setItem(this.config.storageKey, JSON.stringify(noteMetadata));
        console.log(`Publicaciones de ${this.config.lang} guardadas:`, noteMetadata.length);
    }
}
