/* ============================================
   DI Tools - Main Application Script
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM References ---
    const navButtons = document.querySelectorAll('.nav-btn');
    const pages = document.querySelectorAll('.page');
    const currentDateEl = document.getElementById('current-date');
    const tourismCurrentDateEl = document.getElementById('tourism-current-date');
    const reactionCurrentDateEl = document.getElementById('reaction-current-date');

    // --- State ---

    // --- Navigation ---
    function navigateTo(pageName) {
        // Update buttons
        navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === pageName);
        });

        // Update pages with animation
        pages.forEach(page => {
            const isTarget = page.id === `page-${pageName}`;
            if (isTarget) {
                page.classList.add('active');
                // Trigger reflow for animation
                page.offsetHeight;
                page.classList.add('fade-in');
                // Remove animation class after it completes
                setTimeout(() => page.classList.remove('fade-in'), 500);
            } else {
                page.classList.remove('active', 'fade-in');
            }
        });

        // Update URL hash
        history.replaceState(null, '', `#${pageName}`);

        // Load forms if navigated to pages
        if (pageName === 'attendance') {
            initAttendanceChecklist();
        } else if (pageName === 'tourism') {
            initTourismChecklist();
        } else if (pageName === 'reaction') {
            initReactionChecklist();
        }
    }

    // Attach click listeners to nav buttons
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navigateTo(btn.dataset.page);
        });
    });

    // Handle initial hash on page load
    function handleInitialRoute() {
        const hash = window.location.hash.replace('#', '');
        const validPages = ['attendance', 'tourism', 'reaction', 'members'];
        if (hash && validPages.includes(hash)) {
            navigateTo(hash);
        }
    }

    // Listen for hash changes (browser back/forward)
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.replace('#', '');
        if (hash) navigateTo(hash);
    });

    // --- Date Display ---
    function updateDate() {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;

        if (currentDateEl) {
            currentDateEl.textContent = formattedDate;
        }
        if (tourismCurrentDateEl) {
            tourismCurrentDateEl.textContent = formattedDate;
        }
        if (reactionCurrentDateEl) {
            reactionCurrentDateEl.textContent = formattedDate;
        }
    }

    // ============================================
    // Reaction Page - Checklist & Report Builder
    // ============================================

    const reactionChecklistContainer = document.getElementById('reaction-checklist-container');
    const btnSubmitReaction = document.getElementById('btn-submit-reaction');
    const cardReactionResult = document.getElementById('card-reaction-result');
    const reactionReportText = document.getElementById('reaction-report-text');
    const btnCopyReactionReport = document.getElementById('btn-copy-reaction-report');
    const copyReactionBtnText = document.getElementById('copy-reaction-btn-text');
    const inputReactionTopicCount = document.getElementById('input-reaction-topic-count');
    const reactionTopicsInputsContainer = document.getElementById('reaction-topics-inputs-container');

    function renderReactionTopicInputs() {
        if (!reactionTopicsInputsContainer || !inputReactionTopicCount) return;
        const count = parseInt(inputReactionTopicCount.value) || 1;
        
        // Save existing input values to restore them
        const existingValues = [];
        const currentInputs = reactionTopicsInputsContainer.querySelectorAll('input');
        currentInputs.forEach(input => {
            existingValues.push(input.value);
        });

        reactionTopicsInputsContainer.innerHTML = '';
        for (let i = 1; i <= count; i++) {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.flexDirection = 'column';
            div.style.gap = '6px';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'form-input';
            input.id = `reaction-topic-name-${i}`;
            input.placeholder = `ប្រធានបទទី ${i} (ឈ្មោះប្រធានបទ)`;
            input.value = existingValues[i - 1] !== undefined ? existingValues[i - 1] : '';
            input.style.padding = '10px 14px';
            input.style.fontSize = '0.95rem';
            
            input.addEventListener('input', () => {
                const linkInputs = document.querySelectorAll(`.reaction-link-input-field[data-topic-index="${i}"]`);
                linkInputs.forEach(linkInput => {
                    linkInput.placeholder = input.value.trim() || `Topic ${i} :`;
                });
            });

            div.appendChild(input);
            reactionTopicsInputsContainer.appendChild(div);
        }
    }

    if (inputReactionTopicCount) {
        const handleTopicCountChange = () => {
            renderReactionTopicInputs();
            initReactionChecklist();
        };
        inputReactionTopicCount.addEventListener('change', handleTopicCountChange);
        inputReactionTopicCount.addEventListener('input', handleTopicCountChange);
    }

    function initReactionChecklist() {
        if (!reactionChecklistContainer) return;

        const currentData = loadData();

        if (!currentData.classes || currentData.classes.length === 0) {
            reactionChecklistContainer.innerHTML = `
                <div class="empty-state" style="padding: 40px 20px; border: 1px dashed var(--border-color); background: var(--gray-50); border-radius: var(--radius-lg); text-align: center;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48" style="color: var(--gray-300); margin-bottom: 12px;"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                    <p style="margin: 0; font-size: 0.95rem; color: var(--gray-500); font-family: var(--font-khmer);">មិនទាន់មានថ្នាក់ ឬសមាជិកនៅឡើយទេ</p>
                    <span class="empty-hint" style="font-size: 0.82rem; color: var(--gray-400); font-family: var(--font-khmer);">សូមចូលទៅកាន់ទំព័រ "សមាជិក" ដើម្បីបន្ថែមថ្នាក់ និងសមាជិកជាមុនសិន។</span>
                </div>
            `;
            if (btnSubmitReaction) btnSubmitReaction.style.display = 'none';
            return;
        }

        if (btnSubmitReaction) btnSubmitReaction.style.display = 'flex';

        let savedStatuses = {};
        let savedLinks = {};
        let savedReasons = {};

        const existingMemberRows = reactionChecklistContainer.querySelectorAll('.attendance-member-row');
        if (existingMemberRows.length > 0) {
            existingMemberRows.forEach(row => {
                const memberId = row.dataset.memberId;
                const classCard = row.closest('.class-attendance-card');
                if (!classCard) return;
                const classId = classCard.dataset.classId;
                const key = `${classId}-${memberId}`;
                
                const statusEl = row.querySelector(`input[name^="reaction-member-status-"]:checked`);
                if (statusEl) savedStatuses[key] = statusEl.value;

                const linkInputs = row.querySelectorAll('.reaction-link-input-field');
                linkInputs.forEach(input => {
                    const topicIndex = input.dataset.topicIndex;
                    savedLinks[`${key}-topic-${topicIndex}`] = input.value;
                });

                const reasonInput = row.querySelector(`input[id^="reaction-reason-input-"]`);
                if (reasonInput) savedReasons[key] = reasonInput.value;
            });
        } else {
            try {
                const stateStr = localStorage.getItem('di_tools_reaction_state');
                if (stateStr) {
                    const parsedState = JSON.parse(stateStr);
                    savedStatuses = parsedState.statuses || {};
                    savedLinks = parsedState.links || {};
                    savedReasons = parsedState.reasons || {};
                    
                    if (inputReactionTopicCount && parsedState.topicCount) {
                        inputReactionTopicCount.value = parsedState.topicCount;
                        if (parsedState.topicNames && reactionTopicsInputsContainer) {
                            renderReactionTopicInputs();
                            parsedState.topicNames.forEach((name, idx) => {
                                const tInput = document.getElementById(`reaction-topic-name-${idx + 1}`);
                                if (tInput) tInput.value = name;
                            });
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to load reaction state:', err);
            }
        }

        reactionChecklistContainer.innerHTML = '';

        currentData.classes.forEach((cls) => {
            const card = document.createElement('div');
            card.className = 'class-attendance-card';
            card.dataset.classId = cls.id;

            let membersHtml = '';
            const members = cls.members || [];

            if (members.length === 0) {
                membersHtml = `
                    <div style="padding: 16px 20px; text-align: center; color: var(--gray-400); font-size: 0.85rem; font-family: var(--font-khmer);">
                        មិនទាន់មានសមាជិកក្នុងថ្នាក់នេះនៅឡើយទេ
                    </div>
                `;
            } else {
                const topicCount = parseInt(inputReactionTopicCount.value) || 1;
                members.forEach(member => {
                    let topicInputsHtml = '';
                    for (let i = 1; i <= topicCount; i++) {
                        const topicInputEl = document.getElementById(`reaction-topic-name-${i}`);
                        const topicDisplayName = (topicInputEl && topicInputEl.value.trim()) || `ប្រធានបទទី ${i} : Link`;
                        topicInputsHtml += `
                            <div style="margin-bottom: 8px;">
                                <input type="text" class="absent-reason-input reaction-link-input-field" 
                                    data-topic-index="${i}"
                                    id="reaction-link-input-${cls.id}-${member.id}-topic-${i}" 
                                    placeholder="${escapeHtml(topicDisplayName)}">
                            </div>
                        `;
                    }

                    membersHtml += `
                        <div class="attendance-member-row" data-member-id="${member.id}">
                            <div class="attendance-member-row-top">
                                <span class="attendance-member-name">${escapeHtml(member.name)}</span>
                                <div class="toggle-radio-group member-status-group">
                                    <label class="toggle-radio-label">
                                        <input type="radio" name="reaction-member-status-${cls.id}-${member.id}" value="done" checked>
                                        <span>ធ្វើ</span>
                                    </label>
                                    <label class="toggle-radio-label">
                                        <input type="radio" name="reaction-member-status-${cls.id}-${member.id}" value="notdone">
                                        <span>មិនធ្វើ</span>
                                    </label>
                                </div>
                            </div>
                            <!-- Slide down link input container -->
                            <div class="absent-reason-container" id="reaction-link-container-${cls.id}-${member.id}">
                                ${topicInputsHtml}
                            </div>
                            <!-- Slide down reason input container -->
                            <div class="absent-reason-container" id="reaction-reason-container-${cls.id}-${member.id}" style="display: none;">
                                <input type="text" class="absent-reason-input" id="reaction-reason-input-${cls.id}-${member.id}" placeholder="បញ្ជាក់មូលហេតុ (លំនាំដើម៖ មិនបានធ្វើ)...">
                            </div>
                        </div>
                    `;
                });
            }

            card.innerHTML = `
                <div class="class-attendance-header">
                    <h3 class="class-attendance-title">📘 ${escapeHtml(cls.name)}</h3>
                </div>
                <div class="attendance-member-list">
                    ${membersHtml}
                </div>
            `;

            reactionChecklistContainer.appendChild(card);

            // Restore status, reason, and links
            members.forEach(member => {
                const key = `${cls.id}-${member.id}`;
                
                if (savedStatuses[key]) {
                    const statusRadio = card.querySelector(`input[name="reaction-member-status-${cls.id}-${member.id}"][value="${savedStatuses[key]}"]`);
                    if (statusRadio) {
                        statusRadio.checked = true;
                        
                        const linkContainer = card.querySelector(`#reaction-link-container-${cls.id}-${member.id}`);
                        const reasonContainer = card.querySelector(`#reaction-reason-container-${cls.id}-${member.id}`);
                        if (linkContainer && reasonContainer) {
                            if (savedStatuses[key] === 'done') {
                                linkContainer.style.display = 'block';
                                reasonContainer.style.display = 'none';
                            } else {
                                linkContainer.style.display = 'none';
                                reasonContainer.style.display = 'block';
                            }
                        }
                    }
                }

                const topicCount = parseInt(inputReactionTopicCount.value) || 1;
                for (let i = 1; i <= topicCount; i++) {
                    const linkVal = savedLinks[`${key}-topic-${i}`];
                    if (linkVal !== undefined) {
                        const inputEl = card.querySelector(`#reaction-link-input-${cls.id}-${member.id}-topic-${i}`);
                        if (inputEl) inputEl.value = linkVal;
                    }
                }

                if (savedReasons[key] !== undefined) {
                    const reasonEl = card.querySelector(`#reaction-reason-input-${cls.id}-${member.id}`);
                    if (reasonEl) reasonEl.value = savedReasons[key];
                }
            });

            // Bind show/hide events for link and reason fields
            members.forEach(member => {
                const doneRadio = card.querySelector(`input[name="reaction-member-status-${cls.id}-${member.id}"][value="done"]`);
                const notdoneRadio = card.querySelector(`input[name="reaction-member-status-${cls.id}-${member.id}"][value="notdone"]`);
                const linkContainer = card.querySelector(`#reaction-link-container-${cls.id}-${member.id}`);
                const reasonContainer = card.querySelector(`#reaction-reason-container-${cls.id}-${member.id}`);

                if (doneRadio && notdoneRadio && linkContainer && reasonContainer) {
                    doneRadio.addEventListener('change', () => {
                        if (doneRadio.checked) {
                            linkContainer.style.display = 'block';
                            reasonContainer.style.display = 'none';
                        }
                    });
                    notdoneRadio.addEventListener('change', () => {
                        if (notdoneRadio.checked) {
                            linkContainer.style.display = 'none';
                            reasonContainer.style.display = 'block';
                        }
                    });
                }
            });
        });

        try {
            const stateStr = localStorage.getItem('di_tools_reaction_state');
            if (stateStr) {
                const parsedState = JSON.parse(stateStr);
                if (parsedState.report) {
                    if (reactionReportText) reactionReportText.value = parsedState.report;
                    if (cardReactionResult) cardReactionResult.style.display = 'block';
                }
            }
        } catch (err) {
            console.error('Failed to load saved report:', err);
        }
    }

    if (btnSubmitReaction) {
        btnSubmitReaction.addEventListener('click', () => {
            const currentData = loadData();
            if (!currentData.classes || currentData.classes.length === 0) return;

            // Format dates
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            const dateStr = `${day}/${month}/${year}`;

            let totalMembers = 0;
            const doneMembers = [];
            const notDoneMembers = [];

            // Get class names to list them
            const classNamesList = currentData.classes.map(cls => cls.name).join(' + ');
            const topicCount = parseInt(inputReactionTopicCount.value) || 1;

            currentData.classes.forEach(cls => {
                const members = cls.members || [];
                members.forEach(member => {
                    totalMembers++;
                    const statusEl = document.querySelector(`input[name="reaction-member-status-${cls.id}-${member.id}"]:checked`);
                    const status = statusEl ? statusEl.value : 'done';

                    const usernameSuffix = member.username ? ` ${member.username}` : '';
                    const memberFullName = `${member.name}${usernameSuffix}`;

                    if (status === 'done') {
                        const links = [];
                        for (let i = 1; i <= topicCount; i++) {
                            const linkEl = document.getElementById(`reaction-link-input-${cls.id}-${member.id}-topic-${i}`);
                            const linkVal = linkEl && linkEl.value.trim() ? linkEl.value.trim() : '';
                            if (linkVal) {
                                links.push({ topicIndex: i, link: linkVal });
                            }
                        }
                        
                        // Count as done if status is done, even if they forgot to input links
                        doneMembers.push({
                            name: member.name, 
                            links: links
                        });
                    } else {
                        const reasonEl = document.getElementById(`reaction-reason-input-${cls.id}-${member.id}`);
                        const reasonVal = reasonEl && reasonEl.value.trim() ? reasonEl.value.trim() : 'មិនបានធ្វើ';
                        notDoneMembers.push({
                            fullName: memberFullName, 
                            reason: reasonVal
                        });
                    }
                });
            });

            // Generate report text matching user's requested template
            let report = '';
            report += `${dateStr} សូមគោរពរាយការណ៍ជូនមេ 🙏🏻🙏🏻\n`;
            report += `ក្រុម រីអេកសិនថែរទាំ DUC\n`;
            
            const groupName = currentData.groupName || '';
            report += `ក្រុម​ ${groupName} ថ្នាក់ ${classNamesList} \nសមាជិកក្រុមចំនួន ${totalMembers} នាក់ (ទាំងមេក្រុម)\n`;
            
            // Render topic names header
            for (let i = 1; i <= topicCount; i++) {
                const topicInputEl = document.getElementById(`reaction-topic-name-${i}`);
                const topicNameVal = topicInputEl ? topicInputEl.value.trim() : '';
                report += `topic ${i} : ${topicNameVal}\n`;
            }

            report += `- បានធ្វើរីអេកសិន ${doneMembers.length} នាក់ \n`;
            doneMembers.forEach((item, index) => {
                report += `${index + 1}. ${item.name} \n`;
                item.links.forEach(l => {
                    report += `topic ${l.topicIndex}\n${l.link}\n`;
                });
            });

            report += `- មិនបានធ្វើរីអេកសិន ${notDoneMembers.length} នាក់\n`;
            notDoneMembers.forEach((item, index) => {
                report += `${index + 1}. ${item.fullName} (${item.reason})\n`;
            });

            report += `\nសូមគោរពអរគុណមេ🙏`;

            // Set report output
            if (reactionReportText) {
                reactionReportText.value = report;
            }

            // Collect form state to save persistently
            const savedStatuses = {};
            const savedLinks = {};
            const savedReasons = {};
            const topicNames = [];

            for (let i = 1; i <= topicCount; i++) {
                const topicInputEl = document.getElementById(`reaction-topic-name-${i}`);
                topicNames.push(topicInputEl ? topicInputEl.value.trim() : '');
            }

            currentData.classes.forEach(cls => {
                const members = cls.members || [];
                members.forEach(member => {
                    const key = `${cls.id}-${member.id}`;
                    const statusEl = document.querySelector(`input[name="reaction-member-status-${cls.id}-${member.id}"]:checked`);
                    const status = statusEl ? statusEl.value : 'done';
                    savedStatuses[key] = status;

                    for (let i = 1; i <= topicCount; i++) {
                        const linkEl = document.getElementById(`reaction-link-input-${cls.id}-${member.id}-topic-${i}`);
                        if (linkEl) savedLinks[`${key}-topic-${i}`] = linkEl.value;
                    }

                    const reasonEl = document.getElementById(`reaction-reason-input-${cls.id}-${member.id}`);
                    if (reasonEl) savedReasons[key] = reasonEl.value;
                });
            });

            try {
                const stateToSave = {
                    statuses: savedStatuses,
                    links: savedLinks,
                    reasons: savedReasons,
                    topicCount: topicCount,
                    topicNames: topicNames,
                    report: report
                };
                localStorage.setItem('di_tools_reaction_state', JSON.stringify(stateToSave));
            } catch (err) {
                console.error('Failed to save reaction state:', err);
            }

            // Show Grid 2
            if (cardReactionResult) {
                cardReactionResult.style.display = 'block';
                cardReactionResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    if (btnCopyReactionReport) {
        btnCopyReactionReport.addEventListener('click', () => {
            if (!reactionReportText) return;

            reactionReportText.select();
            reactionReportText.setSelectionRange(0, 99999);

            navigator.clipboard.writeText(reactionReportText.value)
                .then(() => {
                    btnCopyReactionReport.classList.add('success');
                    const originalSvg = btnCopyReactionReport.innerHTML;
                    btnCopyReactionReport.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    `;

                    setTimeout(() => {
                        btnCopyReactionReport.classList.remove('success');
                        btnCopyReactionReport.innerHTML = originalSvg;
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy: ', err);
                });
        });
    }

    // --- Utility ---
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // --- Navbar scroll effect ---
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        const scrollY = window.scrollY;

        if (scrollY > 20) {
            navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.08)';
        } else {
            navbar.style.boxShadow = 'none';
        }

        lastScroll = scrollY;
    }, { passive: true });

    // ============================================
    // Attendance Page - Checklist & Report Builder
    // ============================================

    const attendanceChecklistContainer = document.getElementById('attendance-checklist-container');
    const btnSubmitAttendance = document.getElementById('btn-submit-attendance');
    const cardAttendanceResult = document.getElementById('card-attendance-result');
    const attendanceReportText = document.getElementById('attendance-report-text');
    const btnCopyReport = document.getElementById('btn-copy-report');
    const copyBtnText = document.getElementById('copy-btn-text');

    function initAttendanceChecklist() {
        if (!attendanceChecklistContainer) return;

        // Freshly load data from localStorage to ensure it is synchronized
        const currentData = loadData();

        if (!currentData.classes || currentData.classes.length === 0) {
            attendanceChecklistContainer.innerHTML = `
                <div class="empty-state" style="padding: 40px 20px; border: 1px dashed var(--border-color); background: var(--gray-50); border-radius: var(--radius-lg); text-align: center;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48" style="color: var(--gray-300); margin-bottom: 12px;"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                    <p style="margin: 0; font-size: 0.95rem; color: var(--gray-500); font-family: var(--font-khmer);">មិនទាន់មានថ្នាក់ ឬសមាជិកនៅឡើយទេ</p>
                    <span class="empty-hint" style="font-size: 0.82rem; color: var(--gray-400); font-family: var(--font-khmer);">សូមចូលទៅកាន់ទំព័រ "សមាជិក" ដើម្បីបន្ថែមថ្នាក់ និងសមាជិកជាមុនសិន។</span>
                </div>
            `;
            if (btnSubmitAttendance) btnSubmitAttendance.style.display = 'none';
            return;
        }

        if (btnSubmitAttendance) btnSubmitAttendance.style.display = 'flex';

        let savedShift = 'M';
        let savedClassStatuses = {};
        let savedMemberStatuses = {};
        let savedReasons = {};

        const existingMemberRows = attendanceChecklistContainer.querySelectorAll('.attendance-member-row');
        if (existingMemberRows.length > 0) {
            const selectedShiftEl = document.querySelector('input[name="shift-select"]:checked');
            if (selectedShiftEl) savedShift = selectedShiftEl.value;

            currentData.classes.forEach(cls => {
                const classStatusEl = document.querySelector(`input[name="class-status-${cls.id}"]:checked`);
                if (classStatusEl) savedClassStatuses[cls.id] = classStatusEl.value;

                const members = cls.members || [];
                members.forEach(member => {
                    const memberStatusEl = document.querySelector(`input[name="member-status-${cls.id}-${member.id}"]:checked`);
                    if (memberStatusEl) savedMemberStatuses[`${cls.id}-${member.id}`] = memberStatusEl.value;

                    const reasonEl = document.getElementById(`reason-input-${cls.id}-${member.id}`);
                    if (reasonEl) savedReasons[`${cls.id}-${member.id}`] = reasonEl.value;
                });
            });
        } else {
            try {
                const stateStr = localStorage.getItem('di_tools_attendance_state');
                if (stateStr) {
                    const parsedState = JSON.parse(stateStr);
                    savedShift = parsedState.shift || 'M';
                    savedClassStatuses = parsedState.classStatuses || {};
                    savedMemberStatuses = parsedState.memberStatuses || {};
                    savedReasons = parsedState.reasons || {};
                    
                    const shiftRadio = document.querySelector(`input[name="shift-select"][value="${savedShift}"]`);
                    if (shiftRadio) shiftRadio.checked = true;
                }
            } catch (err) {
                console.error('Failed to load attendance state:', err);
            }
        }

        // Clear and rebuild
        attendanceChecklistContainer.innerHTML = '';

        currentData.classes.forEach((cls, classIndex) => {
            const card = document.createElement('div');
            card.className = 'class-attendance-card';
            card.dataset.classId = cls.id;

            let membersHtml = '';
            const members = cls.members || [];

            const restoredClassStatus = savedClassStatuses[cls.id] || 'work';

            if (members.length === 0) {
                membersHtml = `
                    <div style="padding: 16px 20px; text-align: center; color: var(--gray-400); font-size: 0.85rem; font-family: var(--font-khmer);">
                        មិនទាន់មានសមាជិកក្នុងថ្នាក់នេះនៅឡើយទេ
                    </div>
                `;
            } else {
                members.forEach(member => {
                    const restoredMemberStatus = savedMemberStatuses[`${cls.id}-${member.id}`] || 'present';
                    const restoredReason = savedReasons[`${cls.id}-${member.id}`] || '';
                    membersHtml += `
                        <div class="attendance-member-row" data-member-id="${member.id}">
                            <div class="attendance-member-row-top">
                                <span class="attendance-member-name">${escapeHtml(member.name)}</span>
                                <div class="toggle-radio-group member-status-group">
                                    <label class="toggle-radio-label">
                                        <input type="radio" name="member-status-${cls.id}-${member.id}" value="present" ${restoredMemberStatus === 'present' ? 'checked' : ''}>
                                        <span>មក</span>
                                    </label>
                                    <label class="toggle-radio-label">
                                        <input type="radio" name="member-status-${cls.id}-${member.id}" value="absent" ${restoredMemberStatus === 'absent' ? 'checked' : ''}>
                                        <span>មិនមក</span>
                                    </label>
                                </div>
                            </div>
                            <!-- Slide down reason input (hidden by default) -->
                            <div class="absent-reason-container" id="reason-container-${cls.id}-${member.id}" style="display: ${restoredMemberStatus === 'absent' ? 'block' : 'none'};">
                                <input type="text" class="absent-reason-input" id="reason-input-${cls.id}-${member.id}" placeholder="បញ្ជាក់មូលហេតុ (លំនាំដើម៖ គ្មានមូលហេតុ)..." value="${escapeHtml(restoredReason)}">
                            </div>
                        </div>
                    `;
                });
            }

            card.innerHTML = `
                <div class="class-attendance-header">
                    <h3 class="class-attendance-title">📘 ${escapeHtml(cls.name)}</h3>
                    <div class="toggle-radio-group class-status-group">
                        <label class="toggle-radio-label">
                            <input type="radio" name="class-status-${cls.id}" value="work" ${restoredClassStatus === 'work' ? 'checked' : ''}>
                            <span>ធ្វើការ</span>
                        </label>
                        <label class="toggle-radio-label">
                            <input type="radio" name="class-status-${cls.id}" value="learn" ${restoredClassStatus === 'learn' ? 'checked' : ''}>
                            <span>រៀន</span>
                        </label>
                    </div>
                </div>
                <div class="attendance-member-list">
                    ${membersHtml}
                </div>
            `;

            attendanceChecklistContainer.appendChild(card);

            // Bind show/hide events for reason fields
            members.forEach(member => {
                const presentRadio = card.querySelector(`input[name="member-status-${cls.id}-${member.id}"][value="present"]`);
                const absentRadio = card.querySelector(`input[name="member-status-${cls.id}-${member.id}"][value="absent"]`);
                const reasonContainer = card.querySelector(`#reason-container-${cls.id}-${member.id}`);

                if (presentRadio && absentRadio && reasonContainer) {
                    presentRadio.addEventListener('change', () => {
                        if (presentRadio.checked) {
                            reasonContainer.style.display = 'none';
                        }
                    });
                    absentRadio.addEventListener('change', () => {
                        if (absentRadio.checked) {
                            reasonContainer.style.display = 'block';
                        }
                    });
                }
            });
        });

        // Load saved report from localStorage if it exists
        try {
            const stateStr = localStorage.getItem('di_tools_attendance_state');
            if (stateStr) {
                const parsedState = JSON.parse(stateStr);
                if (parsedState.report) {
                    if (attendanceReportText) attendanceReportText.value = parsedState.report;
                    if (cardAttendanceResult) cardAttendanceResult.style.display = 'block';
                }
            }
        } catch (err) {
            console.error('Failed to load saved attendance report:', err);
        }
    }

    if (btnSubmitAttendance) {
        btnSubmitAttendance.addEventListener('click', () => {
            const currentData = loadData();
            if (!currentData.classes || currentData.classes.length === 0) return;

            // Get selected shift
            const selectedShiftEl = document.querySelector('input[name="shift-select"]:checked');
            const shiftVal = selectedShiftEl ? selectedShiftEl.value : 'M';

            // Format dates
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            const dateStr = `${day}/${month}/${year}`;

            // Shift mapping
            const shiftCodes = { 'M': 'M', 'A': 'A', 'N': 'N' };
            const shiftTexts = { 'M': '(ពេលព្រឹក)', 'A': '(ពេលរសៀល)', 'N': '(ពេលយប់)' };

            const shiftCode = shiftCodes[shiftVal] || 'M';
            const shiftText = shiftTexts[shiftVal] || '(ពេលព្រឹក)';

            // Group classes by status (ធ្វើការ or រៀន)
            const workClasses = [];
            const learnClasses = [];

            let totalMembers = 0;
            const presentWorkMembers = [];
            const presentLearnMembers = [];
            const absentMembersList = [];

            currentData.classes.forEach(cls => {
                const classStatusEl = document.querySelector(`input[name="class-status-${cls.id}"]:checked`);
                const classStatus = classStatusEl ? classStatusEl.value : 'work';

                if (classStatus === 'work') {
                    workClasses.push(cls.name);
                } else {
                    learnClasses.push(cls.name);
                }

                const members = cls.members || [];
                members.forEach(member => {
                    totalMembers++;
                    const memberStatusEl = document.querySelector(`input[name="member-status-${cls.id}-${member.id}"]:checked`);
                    const status = memberStatusEl ? memberStatusEl.value : 'present';

                    const usernameSuffix = member.username ? ` ${member.username}` : '';
                    const memberFullName = `${member.name}${usernameSuffix}`;

                    if (status === 'present') {
                        if (classStatus === 'work') {
                            presentWorkMembers.push(memberFullName);
                        } else {
                            presentLearnMembers.push(memberFullName);
                        }
                    } else {
                        const reasonEl = document.getElementById(`reason-input-${cls.id}-${member.id}`);
                        const reason = reasonEl && reasonEl.value.trim() ? reasonEl.value.trim() : 'គ្មានមូលហេតុ';
                        absentMembersList.push({ name: memberFullName, reason: reason });
                    }
                });
            });

            // Generate report text
            let report = '';
            report += `${dateStr}${shiftCode} សូមគោរពរបាយការណ៍ជម្រាបជូនមេ និងលោកគ្រូអ្នកគ្រូ អំពីទិន្នន័យវត្តមានសម្រាប់ក្រុម${currentData.groupName ? ' ' + currentData.groupName : ''}\n`;

            const workPart = workClasses.join(' + ');
            const learnPart = learnClasses.length > 0 ? `+ ${learnClasses.join(' ')}` : '';
            let headerClassesText = '';
            if (workPart && learnPart) {
                headerClassesText = `${workPart} ${learnPart}`;
            } else if (workPart) {
                headerClassesText = workPart;
            } else if (learnPart) {
                headerClassesText = learnPart;
            }

            report += `ថ្នាក់ ${headerClassesText} វេនធ្វើការ${shiftText}\n`;
            report += `+មានសមាជិកសរុប ${totalMembers} នាក់ (ទាំងមេក្រុម)\n`;

            // 1. Present Work members section
            if (workClasses.length > 0) {
                report += `+អ្នកមកធ្វើការDI ${presentWorkMembers.length} នាក់\n`;
                presentWorkMembers.forEach(name => {
                    report += `- ${name}\n`;
                });
            }

            // 2. Present Learn members section (សមាជិកជាប់រៀន)
            if (learnClasses.length > 0) {
                report += `+សមាជិកជាប់រៀន ${presentLearnMembers.length} នាក់\n`;
                presentLearnMembers.forEach(name => {
                    report += `- ${name}\n`;
                });
            }

            // 3. Absent members section
            report += `+អវត្តមាន ${absentMembersList.length} នាក់\n`;
            absentMembersList.forEach(item => {
                report += `- ${item.name} (${item.reason})\n`;
            });

            report += `\nសូមគោរពអគុណ🙏🏻🙏🏻`;

            // Set report output
            if (attendanceReportText) {
                attendanceReportText.value = report;
            }

            // Collect form state to save persistently
            const savedClassStatuses = {};
            const savedMemberStatuses = {};
            const savedReasons = {};
            
            currentData.classes.forEach(cls => {
                const classStatusEl = document.querySelector(`input[name="class-status-${cls.id}"]:checked`);
                if (classStatusEl) savedClassStatuses[cls.id] = classStatusEl.value;

                const members = cls.members || [];
                members.forEach(member => {
                    const statusEl = document.querySelector(`input[name="member-status-${cls.id}-${member.id}"]:checked`);
                    if (statusEl) savedMemberStatuses[`${cls.id}-${member.id}`] = statusEl.value;

                    const reasonEl = document.getElementById(`reason-input-${cls.id}-${member.id}`);
                    if (reasonEl) savedReasons[`${cls.id}-${member.id}`] = reasonEl.value;
                });
            });

            try {
                const stateToSave = {
                    shift: shiftVal,
                    classStatuses: savedClassStatuses,
                    memberStatuses: savedMemberStatuses,
                    reasons: savedReasons,
                    report: report
                };
                localStorage.setItem('di_tools_attendance_state', JSON.stringify(stateToSave));
            } catch (err) {
                console.error('Failed to save attendance state:', err);
            }

            // Show Grid 2
            if (cardAttendanceResult) {
                cardAttendanceResult.style.display = 'block';
                cardAttendanceResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    if (btnCopyReport) {
        btnCopyReport.addEventListener('click', () => {
            if (!attendanceReportText) return;

            attendanceReportText.select();
            attendanceReportText.setSelectionRange(0, 99999);

            navigator.clipboard.writeText(attendanceReportText.value)
                .then(() => {
                    btnCopyReport.classList.add('success');
                    const originalSvg = btnCopyReport.innerHTML;
                    btnCopyReport.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    `;

                    setTimeout(() => {
                        btnCopyReport.classList.remove('success');
                        btnCopyReport.innerHTML = originalSvg;
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy: ', err);
                });
        });
    }

    // ============================================
    // Tourism Page - Checklist & Report Builder
    // ============================================

    const tourismChecklistContainer = document.getElementById('tourism-checklist-container');
    const btnSubmitTourism = document.getElementById('btn-submit-tourism');
    const cardTourismResult = document.getElementById('card-tourism-result');
    const tourismReportText = document.getElementById('tourism-report-text');
    const btnCopyTourismReport = document.getElementById('btn-copy-tourism-report');
    const copyTourismBtnText = document.getElementById('copy-tourism-btn-text');

    function initTourismChecklist() {
        if (!tourismChecklistContainer) return;

        // Freshly load data from localStorage to ensure it is synchronized
        const currentData = loadData();

        if (!currentData.classes || currentData.classes.length === 0) {
            tourismChecklistContainer.innerHTML = `
                <div class="empty-state" style="padding: 40px 20px; border: 1px dashed var(--border-color); background: var(--gray-50); border-radius: var(--radius-lg); text-align: center;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48" style="color: var(--gray-300); margin-bottom: 12px;"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                    <p style="margin: 0; font-size: 0.95rem; color: var(--gray-500); font-family: var(--font-khmer);">មិនទាន់មានថ្នាក់ ឬសមាជិកនៅឡើយទេ</p>
                    <span class="empty-hint" style="font-size: 0.82rem; color: var(--gray-400); font-family: var(--font-khmer);">សូមចូលទៅកាន់ទំព័រ "សមាជិក" ដើម្បីបន្ថែមថ្នាក់ និងសមាជិកជាមុនសិន។</span>
                </div>
            `;
            if (btnSubmitTourism) btnSubmitTourism.style.display = 'none';
            return;
        }

        if (btnSubmitTourism) btnSubmitTourism.style.display = 'flex';

        let savedMemberStatuses = {};
        let savedReasons = {};

        const existingMemberRows = tourismChecklistContainer.querySelectorAll('.attendance-member-row');
        if (existingMemberRows.length > 0) {
            currentData.classes.forEach(cls => {
                const members = cls.members || [];
                members.forEach(member => {
                    const statusEl = document.querySelector(`input[name="tourism-member-status-${cls.id}-${member.id}"]:checked`);
                    if (statusEl) savedMemberStatuses[`${cls.id}-${member.id}`] = statusEl.value;

                    const reasonEl = document.getElementById(`tourism-reason-input-${cls.id}-${member.id}`);
                    if (reasonEl) savedReasons[`${cls.id}-${member.id}`] = reasonEl.value;
                });
            });
        } else {
            try {
                const stateStr = localStorage.getItem('di_tools_tourism_state');
                if (stateStr) {
                    const parsedState = JSON.parse(stateStr);
                    savedMemberStatuses = parsedState.memberStatuses || {};
                    savedReasons = parsedState.reasons || {};
                }
            } catch (err) {
                console.error('Failed to load tourism state:', err);
            }
        }

        // Clear and rebuild
        tourismChecklistContainer.innerHTML = '';

        currentData.classes.forEach((cls, classIndex) => {
            const card = document.createElement('div');
            card.className = 'class-attendance-card';
            card.dataset.classId = cls.id;

            let membersHtml = '';
            const members = cls.members || [];

            if (members.length === 0) {
                membersHtml = `
                    <div style="padding: 16px 20px; text-align: center; color: var(--gray-400); font-size: 0.85rem; font-family: var(--font-khmer);">
                        មិនទាន់មានសមាជិកក្នុងថ្នាក់នេះនៅឡើយទេ
                    </div>
                `;
            } else {
                members.forEach(member => {
                    const restoredStatus = savedMemberStatuses[`${cls.id}-${member.id}`] || 'done';
                    const restoredReason = savedReasons[`${cls.id}-${member.id}`] || '';
                    membersHtml += `
                        <div class="attendance-member-row" data-member-id="${member.id}">
                            <div class="attendance-member-row-top">
                                <span class="attendance-member-name">${escapeHtml(member.name)}</span>
                                <div class="toggle-radio-group member-status-group">
                                    <label class="toggle-radio-label">
                                        <input type="radio" name="tourism-member-status-${cls.id}-${member.id}" value="done" ${restoredStatus === 'done' ? 'checked' : ''}>
                                        <span>ធ្វើ</span>
                                    </label>
                                    <label class="toggle-radio-label">
                                        <input type="radio" name="tourism-member-status-${cls.id}-${member.id}" value="notdone" ${restoredStatus === 'notdone' ? 'checked' : ''}>
                                        <span>មិនធ្វើ</span>
                                    </label>
                                </div>
                            </div>
                            <!-- Slide down reason input (hidden by default) -->
                            <div class="absent-reason-container" id="tourism-reason-container-${cls.id}-${member.id}" style="display: ${restoredStatus === 'notdone' ? 'block' : 'none'};">
                                <input type="text" class="absent-reason-input" id="tourism-reason-input-${cls.id}-${member.id}" placeholder="បញ្ជាក់មូលហេតុ (លំនាំដើម៖ មិនបានធ្វើ)..." value="${escapeHtml(restoredReason)}">
                            </div>
                        </div>
                    `;
                });
            }

            card.innerHTML = `
                <div class="class-attendance-header">
                    <h3 class="class-attendance-title">📘 ${escapeHtml(cls.name)}</h3>
                </div>
                <div class="attendance-member-list">
                    ${membersHtml}
                </div>
            `;

            tourismChecklistContainer.appendChild(card);

            // Bind show/hide events for reason fields
            members.forEach(member => {
                const doneRadio = card.querySelector(`input[name="tourism-member-status-${cls.id}-${member.id}"][value="done"]`);
                const notdoneRadio = card.querySelector(`input[name="tourism-member-status-${cls.id}-${member.id}"][value="notdone"]`);
                const reasonContainer = card.querySelector(`#tourism-reason-container-${cls.id}-${member.id}`);

                if (doneRadio && notdoneRadio && reasonContainer) {
                    doneRadio.addEventListener('change', () => {
                        if (doneRadio.checked) {
                            reasonContainer.style.display = 'none';
                        }
                    });
                    notdoneRadio.addEventListener('change', () => {
                        if (notdoneRadio.checked) {
                            reasonContainer.style.display = 'block';
                        }
                    });
                }
            });
        });

        // Load saved report from localStorage if it exists
        try {
            const stateStr = localStorage.getItem('di_tools_tourism_state');
            if (stateStr) {
                const parsedState = JSON.parse(stateStr);
                if (parsedState.report) {
                    if (tourismReportText) tourismReportText.value = parsedState.report;
                    if (cardTourismResult) cardTourismResult.style.display = 'block';
                }
            }
        } catch (err) {
            console.error('Failed to load saved tourism report:', err);
        }
    }

    if (btnSubmitTourism) {
        btnSubmitTourism.addEventListener('click', () => {
            const currentData = loadData();
            if (!currentData.classes || currentData.classes.length === 0) return;

            // Format dates
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            const dateStr = `${day}-${month}-${year}`;

            let totalMembers = 0;
            const doneMembers = [];
            const notDoneMembers = [];

            currentData.classes.forEach(cls => {
                const members = cls.members || [];
                members.forEach(member => {
                    totalMembers++;
                    const statusEl = document.querySelector(`input[name="tourism-member-status-${cls.id}-${member.id}"]:checked`);
                    const status = statusEl ? statusEl.value : 'done';

                    const usernameSuffix = member.username ? ` ${member.username}` : '';
                    const memberFullName = `${member.name}${usernameSuffix}`;

                    if (status === 'done') {
                        doneMembers.push(member.name); // only name, no username
                    } else {
                        const reasonEl = document.getElementById(`tourism-reason-input-${cls.id}-${member.id}`);
                        const reasonVal = reasonEl && reasonEl.value.trim() ? reasonEl.value.trim() : 'មិនបានធ្វើ';
                        notDoneMembers.push({
                            fullName: memberFullName, // show username
                            reason: reasonVal
                        });
                    }
                });
            });

            // Get class names to list them
            const classNamesList = currentData.classes.map(cls => cls.name).join(' + ');

            // Generate report text
            let report = '';
            report += `${dateStr} វីដេអូទេសចរណ៍\n`;
            
            const groupName = currentData.groupName || '';
            report += `ក្រុម​​ ${groupName} ថ្នាក់ ${classNamesList} \nសមាជិកធ្វើការ  ${totalMembers} នាក់ ទាំងមេក្រុម\n`;
            report += `+ ផុសបាន ${doneMembers.length} នាក់\n`;
            doneMembers.forEach((name, index) => {
                report += `${index + 1}. ${name}\n`;
            });

            report += `+ មិនបានផុស ${notDoneMembers.length} នាក់\n`;
            notDoneMembers.forEach((item, index) => {
                report += `${index + 1}. ${item.fullName} (${item.reason})\n`;
            });

            // Set report output
            if (tourismReportText) {
                tourismReportText.value = report;
            }

            // Collect form state to save persistently
            const savedMemberStatuses = {};
            const savedReasons = {};
            
            currentData.classes.forEach(cls => {
                const members = cls.members || [];
                members.forEach(member => {
                    const statusEl = document.querySelector(`input[name="tourism-member-status-${cls.id}-${member.id}"]:checked`);
                    if (statusEl) savedMemberStatuses[`${cls.id}-${member.id}`] = statusEl.value;

                    const reasonEl = document.getElementById(`tourism-reason-input-${cls.id}-${member.id}`);
                    if (reasonEl) savedReasons[`${cls.id}-${member.id}`] = reasonEl.value;
                });
            });

            try {
                const stateToSave = {
                    memberStatuses: savedMemberStatuses,
                    reasons: savedReasons,
                    report: report
                };
                localStorage.setItem('di_tools_tourism_state', JSON.stringify(stateToSave));
            } catch (err) {
                console.error('Failed to save tourism state:', err);
            }

            // Show Grid 2
            if (cardTourismResult) {
                cardTourismResult.style.display = 'block';
                cardTourismResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    if (btnCopyTourismReport) {
        btnCopyTourismReport.addEventListener('click', () => {
            if (!tourismReportText) return;

            tourismReportText.select();
            tourismReportText.setSelectionRange(0, 99999);

            navigator.clipboard.writeText(tourismReportText.value)
                .then(() => {
                    btnCopyTourismReport.classList.add('success');
                    const originalSvg = btnCopyTourismReport.innerHTML;
                    btnCopyTourismReport.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    `;

                    setTimeout(() => {
                        btnCopyTourismReport.classList.remove('success');
                        btnCopyTourismReport.innerHTML = originalSvg;
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy: ', err);
                });
        });
    }

    // ============================================
    // Members Page - Class & Member Management
    // ============================================

    // Color palette for classes and members
    const CLASS_COLORS = [
        'linear-gradient(135deg, #ec4899, #f472b6)',
        'linear-gradient(135deg, #8b5cf6, #a78bfa)',
        'linear-gradient(135deg, #3b82f6, #60a5fa)',
        'linear-gradient(135deg, #06b6d4, #22d3ee)',
        'linear-gradient(135deg, #22c55e, #4ade80)',
        'linear-gradient(135deg, #f97316, #fb923c)',
        'linear-gradient(135deg, #ef4444, #f87171)',
        'linear-gradient(135deg, #eab308, #facc15)',
    ];

    const CLASS_EMOJIS = ['📘', '📗', '📕', '📙', '📓', '📔', '📒', '📚'];

    const AVATAR_COLORS = [
        '#ec4899', '#8b5cf6', '#3b82f6', '#06b6d4',
        '#22c55e', '#f97316', '#ef4444', '#eab308',
        '#14b8a6', '#6366f1', '#d946ef', '#f43f5e'
    ];

    // --- Data Storage ---
    function loadData() {
        try {
            const data = localStorage.getItem('di_tools_members');
            const parsed = data ? JSON.parse(data) : { classes: [], groupName: '' };
            if (!parsed.groupName) parsed.groupName = '';
            return parsed;
        } catch {
            return { classes: [], groupName: '' };
        }
    }

    function saveData(data) {
        localStorage.setItem('di_tools_members', JSON.stringify(data));
    }

    // --- State ---
    let appData = loadData();

    // --- DOM References (Members) ---
    const inputGroupName = document.getElementById('input-group-name');
    const btnSaveGroup = document.getElementById('btn-save-group');

    const btnAddClass = document.getElementById('btn-add-class');
    const formAddClass = document.getElementById('form-add-class');
    const inputClassName = document.getElementById('input-class-name');
    const btnSaveClass = document.getElementById('btn-save-class');
    const btnCancelClass = document.getElementById('btn-cancel-class');
    const classesContainer = document.getElementById('classes-container');

    const countClassesEl = document.getElementById('count-classes');
    const countMembersEl = document.getElementById('count-members');

    // Populate Group Name on load
    if (inputGroupName && appData.groupName) {
        inputGroupName.value = appData.groupName;
    }

    // Bind Group Name Save Click
    if (btnSaveGroup && inputGroupName) {
        btnSaveGroup.addEventListener('click', () => {
            const newGroupName = inputGroupName.value.trim();
            appData.groupName = newGroupName;
            saveData(appData);

            // Visual feedback
            const originalText = btnSaveGroup.textContent;
            btnSaveGroup.textContent = 'រក្សាទុកជោគជ័យ (Saved!)';
            btnSaveGroup.style.background = 'linear-gradient(135deg, #22c55e, #4ade80)'; // green
            btnSaveGroup.style.boxShadow = '0 2px 8px rgba(34,197,94,0.25)';

            setTimeout(() => {
                btnSaveGroup.textContent = originalText;
                btnSaveGroup.style.background = 'linear-gradient(135deg, #3b82f6, #60a5fa)'; // blue
                btnSaveGroup.style.boxShadow = '0 2px 8px rgba(59,130,246,0.25)';
            }, 2000);
        });

        // Press Enter to save group name
        inputGroupName.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                btnSaveGroup.click();
            }
        });
    }

    // --- Custom Confirm Modal ---
    let deleteConfirmCallback = null;

    function showConfirmModal(message, onConfirm) {
        const modal = document.getElementById('confirm-delete-modal');
        const messageEl = document.getElementById('confirm-delete-message');
        if (!modal || !messageEl) return;

        messageEl.textContent = message;
        modal.style.display = 'flex';
        deleteConfirmCallback = onConfirm;
    }

    function hideConfirmModal() {
        const modal = document.getElementById('confirm-delete-modal');
        if (modal) modal.style.display = 'none';
        deleteConfirmCallback = null;
    }

    // Modal bindings
    const okBtn = document.getElementById('btn-confirm-delete-ok');
    const cancelBtn = document.getElementById('btn-confirm-delete-cancel');
    const modalOverlay = document.getElementById('confirm-delete-modal');

    if (okBtn) {
        okBtn.addEventListener('click', () => {
            if (deleteConfirmCallback) {
                deleteConfirmCallback();
            }
            hideConfirmModal();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideConfirmModal);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                hideConfirmModal();
            }
        });
    }

    // --- Class & Member Rendering ---
    function renderClasses() {
        const emptyEl = document.getElementById('classes-empty');

        // Remove existing class cards
        classesContainer.querySelectorAll('.class-card').forEach(el => el.remove());

        if (appData.classes.length === 0) {
            if (emptyEl) emptyEl.style.display = 'block';
        } else {
            if (emptyEl) emptyEl.style.display = 'none';

            appData.classes.forEach((cls, classIndex) => {
                const colorIndex = classIndex % CLASS_COLORS.length;
                const emojiIndex = classIndex % CLASS_EMOJIS.length;
                const memberCount = cls.members ? cls.members.length : 0;

                const card = document.createElement('div');
                card.className = 'content-card class-card';
                card.dataset.classId = cls.id;
                card.style.marginBottom = '24px';
                card.style.padding = '24px';
                card.style.borderRadius = 'var(--radius-lg)';
                card.style.background = '#fff';
                card.style.boxShadow = 'var(--shadow-md)';

                card.innerHTML = `
                    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 14px; margin-bottom: 18px;">
                        <div class="class-header-view" id="class-header-view-${cls.id}" style="display: flex; align-items: center; gap: 14px; flex-grow: 1;">
                            <div class="class-color" style="background: ${CLASS_COLORS[colorIndex]}; width: 42px; height: 42px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: #fff; flex-shrink: 0; box-shadow: var(--shadow-sm);">
                                ${CLASS_EMOJIS[emojiIndex]}
                            </div>
                            <div style="display: flex; flex-direction: column;">
                                <h3 style="margin: 0; font-family: var(--font-khmer); font-size: 1.15rem; font-weight: 700; color: var(--gray-800);">${escapeHtml(cls.name)}</h3>
                                <span class="class-item-count" style="font-size: 0.8rem; color: var(--gray-400); font-weight: 500;">${memberCount} សមាជិក</span>
                            </div>
                        </div>

                        <div class="class-header-edit" id="class-header-edit-${cls.id}" style="display: none; align-items: center; gap: 10px; flex-grow: 1;">
                            <input type="text" class="form-input" id="edit-class-name-${cls.id}" value="${escapeHtml(cls.name)}" style="padding: 10px 14px; font-size: 0.95rem; width: auto; flex-grow: 1; max-width: 300px;" placeholder="ឈ្មោះថ្នាក់">
                            <button class="btn-save" id="btn-save-class-edit-${cls.id}" style="padding: 9px 18px; font-size: 0.85rem; white-space: nowrap;">រក្សាទុក</button>
                            <button class="btn-cancel" id="btn-cancel-class-edit-${cls.id}" style="padding: 9px 18px; font-size: 0.85rem; white-space: nowrap;">បោះបង់</button>
                        </div>

                        <div class="class-actions" id="class-actions-${cls.id}" style="display: flex; gap: 8px;">
                            <button class="action-btn edit" id="btn-edit-class-${cls.id}" title="កែប្រែ">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"/></svg>
                            </button>
                            <button class="action-btn delete" id="btn-delete-class-${cls.id}" title="លុប">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </div>

                    <div class="member-list" id="member-list-${cls.id}" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
                        <!-- Members rendered dynamically -->
                    </div>

                    <div class="add-member-section" style="border-top: 1px solid var(--border-color); padding-top: 16px; display: flex; flex-direction: column; gap: 12px;">
                        <button class="add-btn member-add" id="btn-show-add-member-${cls.id}" style="align-self: flex-start; padding: 8px 16px; font-size: 0.85rem; display: flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #3b82f6, #60a5fa); color: white; border: none; border-radius: var(--radius-full); cursor: pointer; font-family: var(--font-khmer); font-weight: 600; box-shadow: 0 2px 8px rgba(59,130,246,0.25); transition: 0.2s;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            បន្ថែមសមាជិក
                        </button>

                        <div class="inline-form" id="form-add-member-${cls.id}" style="display: none; padding: 16px 20px; background: var(--gray-50); border-radius: var(--radius-md); border: 1px solid var(--border-color); animation: slideDown 0.2s ease-out; flex-direction: column; gap: 12px;">
                            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                                <input type="text" class="form-input" id="input-member-name-${cls.id}" placeholder="ឈ្មោះសមាជិក (Name)" style="flex: 1; min-width: 140px; padding: 10px 14px; font-size: 0.9rem;">
                                <input type="text" class="form-input" id="input-member-username-${cls.id}" placeholder="Username (ឧ. @username)" style="flex: 1; min-width: 140px; padding: 10px 14px; font-size: 0.9rem;">
                            </div>
                            <div class="form-actions" style="display: flex; gap: 8px; justify-content: flex-end;">
                                <button class="btn-save member-save" id="btn-save-member-${cls.id}" style="padding: 8px 18px; font-size: 0.85rem; background: linear-gradient(135deg, #3b82f6, #60a5fa); color: white; border: none; border-radius: var(--radius-full); cursor: pointer; font-family: var(--font-khmer); font-weight: 600; box-shadow: 0 2px 8px rgba(59,130,246,0.25); white-space: nowrap;">រក្សាទុក</button>
                                <button class="btn-cancel" id="btn-cancel-member-${cls.id}" style="padding: 8px 16px; font-size: 0.85rem; border: 1px solid var(--border-color); border-radius: var(--radius-full); background: transparent; cursor: pointer; font-family: var(--font-khmer); color: var(--gray-500); white-space: nowrap;">បោះបង់</button>
                            </div>
                        </div>
                    </div>
                `;

                classesContainer.appendChild(card);

                // Class edit/delete buttons UI and event binding
                const editBtn = card.querySelector(`#btn-edit-class-${cls.id}`);
                const deleteBtn = card.querySelector(`#btn-delete-class-${cls.id}`);
                const viewEl = card.querySelector(`#class-header-view-${cls.id}`);
                const editEl = card.querySelector(`#class-header-edit-${cls.id}`);
                const actionsEl = card.querySelector(`#class-actions-${cls.id}`);
                const editInput = card.querySelector(`#edit-class-name-${cls.id}`);
                const saveEditBtn = card.querySelector(`#btn-save-class-edit-${cls.id}`);
                const cancelEditBtn = card.querySelector(`#btn-cancel-class-edit-${cls.id}`);

                editBtn.addEventListener('click', () => {
                    viewEl.style.display = 'none';
                    actionsEl.style.display = 'none';
                    editEl.style.display = 'flex';
                    editInput.focus();
                });

                cancelEditBtn.addEventListener('click', () => {
                    viewEl.style.display = 'flex';
                    actionsEl.style.display = 'flex';
                    editEl.style.display = 'none';
                    editInput.value = cls.name;
                });

                saveEditBtn.addEventListener('click', () => {
                    const newName = editInput.value.trim();
                    if (!newName) return;
                    cls.name = newName;
                    saveData(appData);
                    renderClasses();
                });

                editInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') saveEditBtn.click();
                    if (e.key === 'Escape') cancelEditBtn.click();
                });

                deleteBtn.addEventListener('click', () => {
                    showConfirmModal(`លុបថ្នាក់ "${cls.name}" និងសមាជិកទាំងអស់?`, () => {
                        appData.classes = appData.classes.filter(c => c.id !== cls.id);
                        saveData(appData);
                        renderClasses();
                    });
                });

                // Render members of this class
                const membersListContainer = card.querySelector(`#member-list-${cls.id}`);
                const classMembers = cls.members || [];

                if (classMembers.length === 0) {
                    membersListContainer.innerHTML = `
                        <div class="empty-state" style="padding: 16px; border: 1px dashed var(--border-color); background: var(--gray-50); border-radius: var(--radius-md); text-align: center;">
                            <p style="margin: 0; font-size: 0.85rem; color: var(--gray-400); font-family: var(--font-khmer);">មិនទាន់មានសមាជិកទេ</p>
                        </div>
                    `;
                } else {
                    classMembers.forEach((member, memberIndex) => {
                        const avatarColorIndex = memberIndex % AVATAR_COLORS.length;
                        const initial = member.name.charAt(0).toUpperCase();

                        const memberItem = document.createElement('div');
                        memberItem.className = 'member-item';
                        memberItem.id = `member-item-${cls.id}-${member.id}`;
                        memberItem.style.display = 'flex';
                        memberItem.style.alignItems = 'center';
                        memberItem.style.justifyContent = 'space-between';
                        memberItem.style.padding = '10px 16px';
                        memberItem.style.borderRadius = 'var(--radius-md)';
                        memberItem.style.background = '#fff';
                        memberItem.style.border = '1px solid var(--border-color)';
                        memberItem.style.marginBottom = '6px';

                        memberItem.innerHTML = `
                            <div class="member-view" id="member-view-${cls.id}-${member.id}" style="display: flex; align-items: center; gap: 12px; flex: 1;">
                                <div class="member-avatar" style="background: ${AVATAR_COLORS[avatarColorIndex]}; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.9rem; flex-shrink: 0; box-shadow: var(--shadow-sm);">
                                    ${initial}
                                </div>
                                <div class="member-item-info" style="display: flex; flex-direction: column;">
                                    <span class="member-item-name" style="font-family: var(--font-khmer); font-size: 0.92rem; font-weight: 600; color: var(--gray-800);">${escapeHtml(member.name)}</span>
                                    ${member.username ? `<span class="member-item-username" style="color: var(--primary-500); font-weight: 500; font-size: 0.85rem; margin-top: 2px;">@${escapeHtml(member.username.replace('@', '').trim())}</span>` : ''}
                                </div>
                            </div>

                            <div class="member-edit" id="member-edit-${cls.id}-${member.id}" style="display: none; flex-direction: column; gap: 8px; flex: 1;">
                                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                    <input type="text" class="form-input" id="edit-member-name-${cls.id}-${member.id}" value="${escapeHtml(member.name)}" style="padding: 8px 12px; font-size: 0.88rem; flex: 1; min-width: 120px;" placeholder="ឈ្មោះសមាជិក">
                                    <input type="text" class="form-input" id="edit-member-username-${cls.id}-${member.id}" value="${escapeHtml(member.username || '')}" style="padding: 8px 12px; font-size: 0.88rem; flex: 1; min-width: 120px;" placeholder="Username (ឧ. @username)">
                                </div>
                                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                                    <button class="btn-save member-save" id="btn-save-member-edit-${cls.id}-${member.id}" style="padding: 8px 14px; font-size: 0.8rem; white-space: nowrap;">រក្សាទុក</button>
                                    <button class="btn-cancel" id="btn-cancel-member-edit-${cls.id}-${member.id}" style="padding: 8px 12px; font-size: 0.8rem; white-space: nowrap;">បោះបង់</button>
                                </div>
                            </div>

                            <div class="member-actions" id="member-actions-${cls.id}-${member.id}" style="display: flex; gap: 6px;">
                                <button class="action-btn edit" id="btn-edit-member-${cls.id}-${member.id}" title="កែប្រែ">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"/></svg>
                                </button>
                                <button class="action-btn delete" id="btn-delete-member-${cls.id}-${member.id}" title="លុប">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </button>
                            </div>
                        `;

                        membersListContainer.appendChild(memberItem);

                        // Attach member editing listeners
                        const memberEditBtn = memberItem.querySelector(`#btn-edit-member-${cls.id}-${member.id}`);
                        const memberDeleteBtn = memberItem.querySelector(`#btn-delete-member-${cls.id}-${member.id}`);
                        const memberViewEl = memberItem.querySelector(`#member-view-${cls.id}-${member.id}`);
                        const memberEditEl = memberItem.querySelector(`#member-edit-${cls.id}-${member.id}`);
                        const memberActionsEl = memberItem.querySelector(`#member-actions-${cls.id}-${member.id}`);
                        const editMemNameInput = memberItem.querySelector(`#edit-member-name-${cls.id}-${member.id}`);
                        const editMemUsernameInput = memberItem.querySelector(`#edit-member-username-${cls.id}-${member.id}`);
                        const saveMemEditBtn = memberItem.querySelector(`#btn-save-member-edit-${cls.id}-${member.id}`);
                        const cancelMemEditBtn = memberItem.querySelector(`#btn-cancel-member-edit-${cls.id}-${member.id}`);

                        memberEditBtn.addEventListener('click', () => {
                            memberViewEl.style.display = 'none';
                            memberActionsEl.style.display = 'none';
                            memberEditEl.style.display = 'flex';
                            editMemNameInput.focus();
                        });

                        cancelMemEditBtn.addEventListener('click', () => {
                            memberViewEl.style.display = 'flex';
                            memberActionsEl.style.display = 'flex';
                            memberEditEl.style.display = 'none';
                            editMemNameInput.value = member.name;
                            if (editMemUsernameInput) editMemUsernameInput.value = member.username || '';
                        });

                        saveMemEditBtn.addEventListener('click', () => {
                            const newMemName = editMemNameInput.value.trim();
                            if (!newMemName) return;

                            let newUsername = editMemUsernameInput ? editMemUsernameInput.value.trim() : '';
                            if (newUsername && !newUsername.startsWith('@')) {
                                newUsername = '@' + newUsername;
                            }

                            member.name = newMemName;
                            member.username = newUsername;
                            saveData(appData);
                            renderClasses();
                        });

                        editMemNameInput.addEventListener('keydown', (e) => {
                            if (e.key === 'Enter') saveMemEditBtn.click();
                            if (e.key === 'Escape') cancelMemEditBtn.click();
                        });

                        if (editMemUsernameInput) {
                            editMemUsernameInput.addEventListener('keydown', (e) => {
                                if (e.key === 'Enter') saveMemEditBtn.click();
                                if (e.key === 'Escape') cancelMemEditBtn.click();
                            });
                        }

                        memberDeleteBtn.addEventListener('click', () => {
                            showConfirmModal(`លុបសមាជិក "${member.name}"?`, () => {
                                cls.members = cls.members.filter(m => m.id !== member.id);
                                saveData(appData);
                                renderClasses();
                            });
                        });
                    });
                }

                // Add member form event listeners
                const showAddMemberBtn = card.querySelector(`#btn-show-add-member-${cls.id}`);
                const addMemberForm = card.querySelector(`#form-add-member-${cls.id}`);
                const memberNameInput = card.querySelector(`#input-member-name-${cls.id}`);
                const memberUsernameInput = card.querySelector(`#input-member-username-${cls.id}`);
                const saveMemberBtn = card.querySelector(`#btn-save-member-${cls.id}`);
                const cancelMemberBtn = card.querySelector(`#btn-cancel-member-${cls.id}`);

                showAddMemberBtn.addEventListener('click', () => {
                    addMemberForm.style.display = 'flex';
                    showAddMemberBtn.style.display = 'none';
                    memberNameInput.value = '';
                    if (memberUsernameInput) memberUsernameInput.value = '';
                    memberNameInput.focus();
                });

                cancelMemberBtn.addEventListener('click', () => {
                    addMemberForm.style.display = 'none';
                    showAddMemberBtn.style.display = 'flex';
                });

                saveMemberBtn.addEventListener('click', () => {
                    const name = memberNameInput.value.trim();
                    if (!name) return;

                    let username = memberUsernameInput ? memberUsernameInput.value.trim() : '';
                    if (username && !username.startsWith('@')) {
                        username = '@' + username;
                    }

                    const newMember = {
                        id: Date.now().toString(),
                        name: name,
                        username: username,
                        createdAt: new Date().toISOString()
                    };

                    cls.members.push(newMember);
                    saveData(appData);
                    renderClasses();
                });

                memberNameInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') saveMemberBtn.click();
                    if (e.key === 'Escape') cancelMemberBtn.click();
                });

                if (memberUsernameInput) {
                    memberUsernameInput.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') saveMemberBtn.click();
                        if (e.key === 'Escape') cancelMemberBtn.click();
                    });
                }
            });
        }

        updateStats();
    }

    // Add Class Form event listeners
    if (btnAddClass) {
        btnAddClass.addEventListener('click', () => {
            formAddClass.style.display = 'block';
            inputClassName.value = '';
            inputClassName.focus();
        });
    }

    if (btnCancelClass) {
        btnCancelClass.addEventListener('click', () => {
            formAddClass.style.display = 'none';
        });
    }

    if (btnSaveClass) {
        btnSaveClass.addEventListener('click', () => {
            const name = inputClassName.value.trim();
            if (!name) return;

            const newClass = {
                id: Date.now().toString(),
                name: name,
                members: [],
                createdAt: new Date().toISOString()
            };

            appData.classes.push(newClass);
            saveData(appData);
            formAddClass.style.display = 'none';
            renderClasses();
        });
    }

    if (inputClassName) {
        inputClassName.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') btnSaveClass.click();
            if (e.key === 'Escape') btnCancelClass.click();
        });
    }

    // --- Stats Update ---
    function updateStats() {
        const totalClasses = appData.classes.length;
        let totalMembers = 0;
        appData.classes.forEach(cls => {
            totalMembers += cls.members ? cls.members.length : 0;
        });

        if (countClassesEl) countClassesEl.textContent = totalClasses;
        if (countMembersEl) countMembersEl.textContent = totalMembers;
    }

    // --- Refresh Form Actions ---
    const btnRefreshAttendance = document.getElementById('btn-refresh-attendance');
    if (btnRefreshAttendance) {
        btnRefreshAttendance.addEventListener('click', () => {
            const shiftRadio = document.querySelector('input[name="shift-select"][value="M"]');
            if (shiftRadio) shiftRadio.checked = true;

            const classRadios = document.querySelectorAll('input[name^="class-status-"][value="work"]');
            classRadios.forEach(radio => radio.checked = true);

            const memberRadios = document.querySelectorAll('input[name^="member-status-"][value="present"]');
            memberRadios.forEach(radio => radio.checked = true);

            const reasonContainers = document.querySelectorAll('div[id^="reason-container-"]');
            reasonContainers.forEach(container => container.style.display = 'none');

            const reasonInputs = document.querySelectorAll('input[id^="reason-input-"]');
            reasonInputs.forEach(input => input.value = '');

            try {
                const stateStr = localStorage.getItem('di_tools_attendance_state');
                const parsed = stateStr ? JSON.parse(stateStr) : {};
                parsed.shift = 'M';
                parsed.classStatuses = {};
                parsed.memberStatuses = {};
                parsed.reasons = {};
                localStorage.setItem('di_tools_attendance_state', JSON.stringify(parsed));
            } catch (err) {
                console.error(err);
            }
        });
    }

    const btnRefreshTourism = document.getElementById('btn-refresh-tourism');
    if (btnRefreshTourism) {
        btnRefreshTourism.addEventListener('click', () => {
            const memberRadios = document.querySelectorAll('input[name^="tourism-member-status-"][value="done"]');
            memberRadios.forEach(radio => radio.checked = true);

            const reasonContainers = document.querySelectorAll('div[id^="tourism-reason-container-"]');
            reasonContainers.forEach(container => container.style.display = 'none');

            const reasonInputs = document.querySelectorAll('input[id^="tourism-reason-input-"]');
            reasonInputs.forEach(input => input.value = '');

            try {
                const stateStr = localStorage.getItem('di_tools_tourism_state');
                const parsed = stateStr ? JSON.parse(stateStr) : {};
                parsed.memberStatuses = {};
                parsed.reasons = {};
                localStorage.setItem('di_tools_tourism_state', JSON.stringify(parsed));
            } catch (err) {
                console.error(err);
            }
        });
    }

    const btnRefreshReaction = document.getElementById('btn-refresh-reaction');
    if (btnRefreshReaction) {
        btnRefreshReaction.addEventListener('click', () => {
            const memberRadios = document.querySelectorAll('input[name^="reaction-member-status-"][value="done"]');
            memberRadios.forEach(radio => radio.checked = true);

            const linkContainers = document.querySelectorAll('div[id^="reaction-link-container-"]');
            linkContainers.forEach(container => container.style.display = 'block');

            const reasonContainers = document.querySelectorAll('div[id^="reaction-reason-container-"]');
            reasonContainers.forEach(container => container.style.display = 'none');

            const linkInputs = document.querySelectorAll('.reaction-link-input-field');
            linkInputs.forEach(input => input.value = '');

            const reasonInputs = document.querySelectorAll('input[id^="reaction-reason-input-"]');
            reasonInputs.forEach(input => input.value = '');

            try {
                const stateStr = localStorage.getItem('di_tools_reaction_state');
                const parsed = stateStr ? JSON.parse(stateStr) : {};
                parsed.statuses = {};
                parsed.links = {};
                parsed.reasons = {};
                localStorage.setItem('di_tools_reaction_state', JSON.stringify(parsed));
            } catch (err) {
                console.error(err);
            }
        });
    }

    // --- Profile Modal Logic ---
    const profileBtn = document.getElementById('profile-btn');
    const profileModal = document.getElementById('profile-modal');
    const btnCloseProfileModal = document.getElementById('btn-close-profile-modal');

    if (profileBtn && profileModal) {
        profileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            profileModal.style.display = 'flex';
        });
    }

    if (btnCloseProfileModal && profileModal) {
        btnCloseProfileModal.addEventListener('click', () => {
            profileModal.style.display = 'none';
        });
    }

    if (profileModal) {
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) {
                profileModal.style.display = 'none';
            }
        });
    }

    // --- Donate Modal Logic ---
    const btnOpenDonateModal = document.getElementById('btn-open-donate-modal');
    const donateModal = document.getElementById('donate-modal');
    const btnCloseDonateModal = document.getElementById('btn-close-donate-modal');

    if (btnOpenDonateModal && donateModal) {
        btnOpenDonateModal.addEventListener('click', (e) => {
            e.preventDefault();
            if (profileModal) profileModal.style.display = 'none';
            donateModal.style.display = 'flex';
        });
    }

    if (btnCloseDonateModal && donateModal) {
        btnCloseDonateModal.addEventListener('click', () => {
            donateModal.style.display = 'none';
        });
    }

    if (donateModal) {
        donateModal.addEventListener('click', (e) => {
            if (e.target === donateModal) {
                donateModal.style.display = 'none';
            }
        });
    }

    const btnCopyPayment = document.getElementById('btn-copy-payment');
    const paymentNumberText = document.getElementById('payment-number-text');

    if (btnCopyPayment && paymentNumberText) {
        btnCopyPayment.addEventListener('click', () => {
            const number = paymentNumberText.textContent.trim();
            navigator.clipboard.writeText(number)
                .then(() => {
                    btnCopyPayment.classList.add('success');
                    const originalSvg = btnCopyPayment.innerHTML;
                    btnCopyPayment.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    `;
                    setTimeout(() => {
                        btnCopyPayment.classList.remove('success');
                        btnCopyPayment.innerHTML = originalSvg;
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy: ', err);
                });
        });
    }

    // --- Service Worker Registration for PWA ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then((reg) => console.log('Service Worker registered successfully!', reg.scope))
                .catch((err) => console.error('Service Worker registration failed:', err));
        });
    }

    // --- PWA Installation Logic ---
    let deferredPrompt = null;
    const btnInstallApp = document.getElementById('btn-install-app');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (btnInstallApp) {
            btnInstallApp.style.display = 'flex';
        }
    });

    if (btnInstallApp) {
        btnInstallApp.addEventListener('click', (e) => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the PWA install prompt');
                } else {
                    console.log('User dismissed the PWA install prompt');
                }
                deferredPrompt = null;
                btnInstallApp.style.display = 'none';
            });
        });
    }

    window.addEventListener('appinstalled', (evt) => {
        console.log('DI Tools was installed successfully!');
        if (btnInstallApp) {
            btnInstallApp.style.display = 'none';
        }
    });

    // --- Initialize ---
    updateDate();
    handleInitialRoute();
    renderClasses();
    renderReactionTopicInputs();
});
