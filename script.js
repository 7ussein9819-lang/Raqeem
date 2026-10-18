// ================= كود حماية الموقع =================
document.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('keydown', function(e) {
    if(e.key === 'F12' || e.keyCode === 123) { e.preventDefault(); return false; }
    if(e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) { e.preventDefault(); return false; }
    if(e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) { e.preventDefault(); return false; }
    if(e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) { e.preventDefault(); return false; }
    if(e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) { e.preventDefault(); return false; }
});

const LOCAL_STORAGE_KEY = 'raqeem_pro_v16_final'; 
const MAXIMUM_ALLOWED_ROWS = 250; 

let appColumns = ["ت", "الاسم", "الوظيفة", "القسم"]; 
let appColumnWidths = [50, 180, 120, 120]; 
let appDataRows = [
    ["1", "أحمد محمد", "مبرمج", "IT"], 
    ["2", "سارة خالد", "إدارة", "HR"], 
    ["3", "علي حسين", "محاسب", "المالية"]
];

let appCellColors = [
    ["", "", "", ""],
    ["", "", "", ""],
    ["", "", "", ""]
];

let appHistoryStates = []; 
let currentHistoryIndex = -1; 
let activeFocusRow = -1; 
let activeFocusCol = -1;
let globalLogoImageBase64 = ''; 
let globalPaperSizeMode = 'a4'; 
let globalPaperOrientationMode = 'portrait';
let isEditingLocked = false; 
let activeSortColumnIndex = -1; 
let isSortOrderAscending = true;

let settingPadding = 8;
let settingRowHeight = 12;
let settingMargin = 15;
let settingRowAdjust = 0;

function closeWelcomeModal() {
    let modal = document.getElementById('welcomeModal');
    if(modal) {
        modal.classList.remove('show');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    }
    localStorage.setItem('raqeem_welcome_msg_v16', 'true');
}

function checkWelcomeModal() {
    if(!localStorage.getItem('raqeem_welcome_msg_v16')) {
        let modal = document.getElementById('welcomeModal');
        if(modal) {
            modal.style.display = 'flex';
            setTimeout(() => { modal.classList.add('show'); }, 50);
        }
    } else {
        let modal = document.getElementById('welcomeModal');
        if(modal) modal.style.display = 'none';
    }
}

function escapeDangerousHtml(text) { 
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); 
}

function setGlobalCssVariable(name, value) { 
    document.documentElement.style.setProperty(name, value); 
}

function updateCellFocusPosition(rowIndex, colIndex) { 
    activeFocusRow = rowIndex; 
    activeFocusCol = colIndex; 
}

function toggleExportMenu() { 
    let dropdownElement = document.getElementById("exportDropdown");
    if(dropdownElement) dropdownElement.classList.toggle("show"); 
}

window.onclick = function(event) { 
    if (!event.target.closest('.dropdown')) { 
        document.querySelectorAll(".dropdown-content").forEach(dropdown => {
            dropdown.classList.remove('show');
        }); 
    } 
};

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode'); 
    let isDarkModeActive = document.body.classList.contains('dark-mode'); 
    localStorage.setItem('sajil_dark_mode_preference', isDarkModeActive);
}

function toggleDataLock() {
    isEditingLocked = !isEditingLocked; 
    let lockDropBtn = document.getElementById('dropLockBtn');
    
    if(isEditingLocked) { 
        if(lockDropBtn) {
            lockDropBtn.style.color = '#e11d48';
            lockDropBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> فك قفل السجل';
        }
        document.body.classList.add('locked-mode'); 
        document.querySelectorAll('.control-panel input, .control-panel select, .control-panel button').forEach(el => {
            if(!el.classList.contains('tab-btn')) {
                el.disabled = true; el.style.opacity = '0.5'; el.style.pointerEvents = 'none';
            }
        });
        alert("تم قفل السجل بالكامل."); 
    } else { 
        if(lockDropBtn) {
            lockDropBtn.style.color = 'var(--app-text)';
            lockDropBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> قفل السجل';
        }
        document.body.classList.remove('locked-mode'); 
        document.querySelectorAll('.control-panel input, .control-panel select, .control-panel button').forEach(el => {
            el.disabled = false; el.style.opacity = '1'; el.style.pointerEvents = 'auto';
        });
        alert("تم فك القفل."); 
    }
    renderPaperPages();
}

let searchDebounceTimeout;
function executeSearch() {
    clearTimeout(searchDebounceTimeout);
    searchDebounceTimeout = setTimeout(() => {
        let searchInputElement = document.getElementById('searchInput');
        if(!searchInputElement) return;
        
        let searchValue = searchInputElement.value.toLowerCase();
        document.querySelectorAll('.t-print tbody').forEach(tbodyElement => {
            let tableRows = tbodyElement.rows;
            for(let i = 0; i < tableRows.length; i++) {
                let rowTextContent = tableRows[i].innerText.toLowerCase();
                tableRows[i].style.display = rowTextContent.includes(searchValue) ? '' : 'none';
            }
        });
    }, 150);
}

function sortDataByColumn(columnIndex) {
    if(isEditingLocked) return; 
    if(activeSortColumnIndex === columnIndex) {
        isSortOrderAscending = !isSortOrderAscending; 
    } else { 
        activeSortColumnIndex = columnIndex; 
        isSortOrderAscending = true; 
    }
    
    let zippedArray = appDataRows.map((row, idx) => ({ 
        row: row, 
        colors: appCellColors[idx] || Array(appColumns.length).fill("") 
    }));

    zippedArray.sort((a, b) => {
        let valueA = a.row[columnIndex], valueB = b.row[columnIndex]; 
        if(valueA === 'المجموع الكلي:' || valueB === 'المجموع الكلي:') return 1; 
        
        let numberA = parseFloat(valueA), numberB = parseFloat(valueB);
        if (!isNaN(numberA) && !isNaN(numberB)) {
            return isSortOrderAscending ? numberA - numberB : numberB - numberA;
        }
        return isSortOrderAscending ? String(valueA).localeCompare(String(valueB),'ar') : String(valueB).localeCompare(String(valueA),'ar');
    });
    
    appDataRows = zippedArray.map(item => item.row);
    appCellColors = zippedArray.map(item => item.colors);

    recalculateRowNumbers(); 
    saveCurrentStateToHistory(); 
    renderPaperPages();
}

function switchControlTab(tabId, buttonElement) { 
    document.querySelectorAll('.tab-content, .tab-btn').forEach(element => {
        element.classList.remove('active');
    }); 
    let targetTab = document.getElementById(tabId);
    if(targetTab) targetTab.classList.add('active'); 
    if(buttonElement) buttonElement.classList.add('active'); 
}

function toggleMobileInterface(viewMode) {
    if(viewMode === 'preview') { 
        document.body.classList.remove('show-controls'); 
        let btnPrev = document.getElementById('btnMobilePreview');
        let btnEdit = document.getElementById('btnMobileEdit');
        if(btnPrev) btnPrev.classList.add('active'); 
        if(btnEdit) btnEdit.classList.remove('active'); 
    } else { 
        document.body.classList.add('show-controls'); 
        let btnPrev = document.getElementById('btnMobilePreview');
        let btnEdit = document.getElementById('btnMobileEdit');
        if(btnEdit) btnEdit.classList.add('active'); 
        if(btnPrev) btnPrev.classList.remove('active'); 
    }
}

function executePrint() { 
    saveAllDataToLocalStorage(); 
    setTimeout(() => { window.print(); }, 400); 
}

function changeNumberSetting(settingName, stepValue) {
    if(settingName === 'pad') { 
        settingPadding += stepValue; 
        if(settingPadding < 2) settingPadding = 2; 
        if(settingPadding > 30) settingPadding = 30; 
        setGlobalCssVariable('--tbl-padding', settingPadding + 'px'); 
        let lbl = document.getElementById('labelPadding');
        if(lbl) lbl.innerText = settingPadding + 'px'; 
    }
    if(settingName === 'row') { 
        settingRowHeight += stepValue; 
        if(settingRowHeight < 8) settingRowHeight = 8; 
        if(settingRowHeight > 150) settingRowHeight = 150; 
        setGlobalCssVariable('--tbl-row-height', settingRowHeight + 'mm'); 
        let lbl = document.getElementById('labelRowHeight');
        if(lbl) lbl.innerText = settingRowHeight + 'mm'; 
    }
    if(settingName === 'marg') { 
        settingMargin += stepValue; 
        if(settingMargin < 0) settingMargin = 0; 
        if(settingMargin > 50) settingMargin = 50; 
        setGlobalCssVariable('--a4-margin', settingMargin + 'mm'); 
        let lbl = document.getElementById('labelMarginValue');
        if(lbl) lbl.innerText = settingMargin + 'mm'; 
    }
    if(settingName === 'adj') { 
        settingRowAdjust += stepValue; 
        if(settingRowAdjust < -10) settingRowAdjust = -10; 
        if(settingRowAdjust > 20) settingRowAdjust = 20; 
        let lbl = document.getElementById('labelRowAdjustment');
        if(lbl) lbl.innerText = settingRowAdjust === 0 ? 'تلقائي' : (settingRowAdjust > 0 ? '+' + settingRowAdjust : settingRowAdjust); 
    }
    renderPaperPages();
}

function setTableAlignment(alignmentValue) { 
    document.querySelectorAll('#btnAlignRight, #btnAlignCenter, #btnAlignLeft').forEach(element => {
        element.classList.remove('active');
    }); 
    
    if(alignmentValue === 'right') {
        setGlobalCssVariable('--tbl-align', 'right');
        setGlobalCssVariable('--tbl-flex-align', 'flex-start');
        let btn = document.getElementById('btnAlignRight');
        if(btn) btn.classList.add('active');
    }
    if(alignmentValue === 'center') {
        setGlobalCssVariable('--tbl-align', 'center');
        setGlobalCssVariable('--tbl-flex-align', 'center');
        let btn = document.getElementById('btnAlignCenter');
        if(btn) btn.classList.add('active');
    }
    if(alignmentValue === 'left') {
        setGlobalCssVariable('--tbl-align', 'left');
        setGlobalCssVariable('--tbl-flex-align', 'flex-end');
        let btn = document.getElementById('btnAlignLeft');
        if(btn) btn.classList.add('active');
    }
    renderPaperPages(); 
}

function updatePaperPrintSettings() { 
    let sizeSelect = document.getElementById('inputPaperSize');
    let orientationSelect = document.getElementById('inputPaperOrientation');
    
    globalPaperSizeMode = sizeSelect ? sizeSelect.value : 'a4'; 
    globalPaperOrientationMode = orientationSelect ? orientationSelect.value : 'portrait'; 
    
    let printStyleElem = document.getElementById('printStyle');
    if(printStyleElem) {
        if (globalPaperSizeMode === 'a4' && globalPaperOrientationMode === 'portrait') {
            printStyleElem.innerHTML = `@media print { @page { size: 210mm 297mm; margin: 0; } }`;
        } else if (globalPaperSizeMode === 'a4' && globalPaperOrientationMode === 'landscape') {
            printStyleElem.innerHTML = `@media print { @page { size: 297mm 210mm; margin: 0; } }`;
        } else if (globalPaperSizeMode === 'a3' && globalPaperOrientationMode === 'portrait') {
            printStyleElem.innerHTML = `@media print { @page { size: 297mm 420mm; margin: 0; } }`;
        } else if (globalPaperSizeMode === 'a3' && globalPaperOrientationMode === 'landscape') {
            printStyleElem.innerHTML = `@media print { @page { size: 420mm 297mm; margin: 0; } }`;
        }
    }
    renderPaperPages(); 
}

let logoUploadInput = document.getElementById('inputLogoUpload');
if(logoUploadInput) {
    logoUploadInput.onchange = function(event) { 
        if(event.target.files && event.target.files[0]) { 
            let fileReader = new FileReader(); 
            fileReader.onload = function(readerEvent) { 
                globalLogoImageBase64 = readerEvent.target.result; 
                renderPaperPages(); 
            }; 
            fileReader.readAsDataURL(event.target.files[0]); 
        } 
    };
}

const systemColorThemes = [
    { name:"احترافي", thGradient:"linear-gradient(135deg, #4f46e5, #312e81)", idxGradient:"linear-gradient(135deg, #f1f5f9, #e2e8f0)", tdBackground:"#ffffff", tdAltBackground:"#f8fafc", thTextColor:"#ffffff", tdTextColor:"#0f172a" },
    { name:"بحري", thGradient:"linear-gradient(135deg, #0ea5e9, #0369a1)", idxGradient:"linear-gradient(135deg, #e0f2fe, #bae6fd)", tdBackground:"#ffffff", tdAltBackground:"#f0f9ff", thTextColor:"#ffffff", tdTextColor:"#082f49" },
    { name:"أخضر كلاسيك", thGradient:"linear-gradient(135deg, #10b981, #047857)", idxGradient:"linear-gradient(135deg, #d1fae5, #a7f3d0)", tdBackground:"#ffffff", tdAltBackground:"#ecfdf5", thTextColor:"#ffffff", tdTextColor:"#022c22" },
    { name:"ذهبي ملكي", thGradient:"linear-gradient(135deg, #f59e0b, #b45309)", idxGradient:"linear-gradient(135deg, #fef3c7, #fde68a)", tdBackground:"#ffffff", tdAltBackground:"#fffbeb", thTextColor:"#ffffff", tdTextColor:"#451a03" },
    { name:"رمادي فاخر", thGradient:"linear-gradient(135deg, #475569, #1e293b)", idxGradient:"linear-gradient(135deg, #f1f5f9, #e2e8f0)", tdBackground:"#ffffff", tdAltBackground:"#f8fafc", thTextColor:"#ffffff", tdTextColor:"#0f172a" },
    { name:"وردي ناعم", thGradient:"linear-gradient(135deg, #ec4899, #be185d)", idxGradient:"linear-gradient(135deg, #fce7f3, #fbcfe8)", tdBackground:"#ffffff", tdAltBackground:"#fdf2f8", thTextColor:"#ffffff", tdTextColor:"#500724" },
    { name:"غروب", thGradient:"linear-gradient(135deg, #f43f5e, #be123c)", idxGradient:"linear-gradient(135deg, #ffe4e6, #fecdd3)", tdBackground:"#ffffff", tdAltBackground:"#fff1f2", thTextColor:"#ffffff", tdTextColor:"#4c0519" },
    { name:"ليلي", thGradient:"linear-gradient(135deg, #0f172a, #000000)", idxGradient:"linear-gradient(135deg, #334155, #1e293b)", tdBackground:"#1e293b", tdAltBackground:"#0f172a", thTextColor:"#f8fafc", tdTextColor:"#f1f5f9" },
    { name:"قهوة", thGradient:"linear-gradient(135deg, #78350f, #451a03)", idxGradient:"linear-gradient(135deg, #fef3c7, #fde68a)", tdBackground:"#ffffff", tdAltBackground:"#fffbeb", thTextColor:"#ffffff", tdTextColor:"#451a03" },
    { name:"بنفسجي", thGradient:"linear-gradient(135deg, #8b5cf6, #5b21b6)", idxGradient:"linear-gradient(135deg, #ede9fe, #ddd6fe)", tdBackground:"#ffffff", tdAltBackground:"#f5f3ff", thTextColor:"#ffffff", tdTextColor:"#2e1065" },
    { name:"فيروزي", thGradient:"linear-gradient(135deg, #14b8a6, #0f766e)", idxGradient:"linear-gradient(135deg, #ccfbf1, #99f6e4)", tdBackground:"#ffffff", tdAltBackground:"#f0fdfa", thTextColor:"#ffffff", tdTextColor:"#042f2e" },
    { name:"ورقة رسمية", thGradient:"#ffffff", idxGradient:"#f8fafc", tdBackground:"#ffffff", tdAltBackground:"#ffffff", thTextColor:"#000000", tdTextColor:"#000000" }
];

function initializeColorThemesUI() {
    let themesContainer = document.getElementById('themesContainerDiv'); 
    if(!themesContainer) return;
    
    systemColorThemes.forEach(themeObject => {
        let themeCardDiv = document.createElement('div'); 
        themeCardDiv.className = 'theme-card'; 
        themeCardDiv.style.background = themeObject.thGradient; 
        themeCardDiv.innerText = themeObject.name;
        
        if(themeObject.name === 'ورقة رسمية') { 
            themeCardDiv.style.color = '#000'; 
            themeCardDiv.style.border = '1px solid var(--app-border)'; 
        }
        
        themeCardDiv.onclick = function() { applyColorTheme(themeObject, themeCardDiv); }; 
        themesContainer.appendChild(themeCardDiv);
    });
}

function applyColorTheme(themeObject, clickedElement) {
    document.querySelectorAll('.theme-card').forEach(card => card.classList.remove('active')); 
    if(clickedElement) clickedElement.classList.add('active');
    
    setGlobalCssVariable('--th-bg', themeObject.thGradient); 
    setGlobalCssVariable('--idx-bg', themeObject.idxGradient); 
    setGlobalCssVariable('--td-bg', themeObject.tdBackground); 
    setGlobalCssVariable('--td-alt-bg', themeObject.tdAltBackground); 
    setGlobalCssVariable('--th-color', themeObject.thTextColor); 
    setGlobalCssVariable('--td-color', themeObject.tdTextColor);
    
    renderPaperPages();
}

function clearAllSystemData() { 
    if(confirm("هل أنت متأكد من مسح جميع السجلات والبيانات نهائياً؟")) { 
        localStorage.removeItem(LOCAL_STORAGE_KEY); 
        location.reload(); 
    } 
}

function saveAllDataToLocalStorage() { 
    try { 
        while(appCellColors.length < appDataRows.length) appCellColors.push(Array(appColumns.length).fill(""));
        
        const systemStateObject = { 
            savedColumns: appColumns, 
            savedWidths: appColumnWidths, 
            savedData: appDataRows, 
            savedCellColors: appCellColors, 
            savedLogo: globalLogoImageBase64, 
            savedTitle: document.getElementById('inputMainTitle') ? document.getElementById('inputMainTitle').value : '', 
            savedDirectorate: document.getElementById('inputDirectorate') ? document.getElementById('inputDirectorate').value : '', 
            savedSchool: document.getElementById('inputSchoolName') ? document.getElementById('inputSchoolName').value : '', 
            savedDocNum: document.getElementById('inputDocumentNumber') ? document.getElementById('inputDocumentNumber').value : '', 
            savedDocDate: document.getElementById('inputDocumentDate') ? document.getElementById('inputDocumentDate').value : '', 
            savedPaperSize: globalPaperSizeMode, 
            savedPaperOri: globalPaperOrientationMode, 
            savedPadding: settingPadding, 
            savedRowHeight: settingRowHeight, 
            savedMargin: settingMargin, 
            savedAdjustment: settingRowAdjust,
            
            savedChecks: {
                cond: document.getElementById('checkConditionalFormat')?.checked || false,
                strip: document.getElementById('checkStripedRows')?.checked || false,
                wm: document.getElementById('checkShowWatermark')?.checked || false,
                s1: document.getElementById('checkSignature1')?.checked || false,
                s2: document.getElementById('checkSignature2')?.checked || false,
                s3: document.getElementById('checkSignature3')?.checked || false,
                page: document.getElementById('checkShowPageNumber')?.checked || false
            }
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(systemStateObject)); 
    } catch(error) {
        console.error("Save Error:", error);
    } 
}

function loadAllDataFromLocalStorage() {
    try {
        if(localStorage.getItem('sajil_dark_mode_preference') === 'true') { 
            document.body.classList.add('dark-mode'); 
        }
        
        let savedDataString = localStorage.getItem(LOCAL_STORAGE_KEY);
        if(savedDataString) {
            let parsedState = JSON.parse(savedDataString); 
            
            if(parsedState.savedColumns) appColumns = parsedState.savedColumns; 
            if(parsedState.savedWidths) appColumnWidths = parsedState.savedWidths; 
            if(parsedState.savedData) {
                appDataRows = parsedState.savedData; 
                if(appDataRows.length > MAXIMUM_ALLOWED_ROWS) {
                    appDataRows = appDataRows.slice(0, MAXIMUM_ALLOWED_ROWS);
                }
            }
            
            if(parsedState.savedCellColors) {
                appCellColors = parsedState.savedCellColors;
            } else {
                appCellColors = [];
                for(let r=0; r<appDataRows.length; r++) appCellColors.push(Array(appColumns.length).fill(""));
            }
            
            if(parsedState.savedLogo) globalLogoImageBase64 = parsedState.savedLogo; 
            
            let elTitle = document.getElementById('inputMainTitle');
            if(parsedState.savedTitle && elTitle) elTitle.value = parsedState.savedTitle; 
            
            let elDir = document.getElementById('inputDirectorate');
            if(parsedState.savedDirectorate && elDir) elDir.value = parsedState.savedDirectorate;
            
            let elSchool = document.getElementById('inputSchoolName');
            if(parsedState.savedSchool && elSchool) elSchool.value = parsedState.savedSchool; 
            
            let elDocNum = document.getElementById('inputDocumentNumber');
            if(parsedState.savedDocNum && elDocNum) elDocNum.value = parsedState.savedDocNum; 
            
            let elDocDate = document.getElementById('inputDocumentDate');
            if(parsedState.savedDocDate && elDocDate) elDocDate.value = parsedState.savedDocDate;
            
            let elPaperSize = document.getElementById('inputPaperSize');
            if(parsedState.savedPaperSize && elPaperSize) { 
                elPaperSize.value = parsedState.savedPaperSize; 
                globalPaperSizeMode = parsedState.savedPaperSize; 
            } 
            
            let elOrientation = document.getElementById('inputPaperOrientation');
            if(parsedState.savedPaperOri && elOrientation) { 
                elOrientation.value = parsedState.savedPaperOri; 
                globalPaperOrientationMode = parsedState.savedPaperOri; 
            }
            
            if(parsedState.savedPadding !== undefined) { 
                settingPadding = parsedState.savedPadding; 
                setGlobalCssVariable('--tbl-padding', settingPadding + 'px'); 
                let lblPad = document.getElementById('labelPadding');
                if(lblPad) lblPad.innerText = settingPadding + 'px'; 
            } 
            
            if(parsedState.savedRowHeight !== undefined) { 
                settingRowHeight = parsedState.savedRowHeight; 
                setGlobalCssVariable('--tbl-row-height', settingRowHeight + 'mm'); 
                let lblRow = document.getElementById('labelRowHeight');
                if(lblRow) lblRow.innerText = settingRowHeight + 'mm'; 
            }
            
            if(parsedState.savedMargin !== undefined) { 
                settingMargin = parsedState.savedMargin; 
                setGlobalCssVariable('--a4-margin', settingMargin + 'mm'); 
                let lblMarg = document.getElementById('labelMarginValue');
                if(lblMarg) lblMarg.innerText = settingMargin + 'mm'; 
            } 
            
            if(parsedState.savedAdjustment !== undefined) { 
                settingRowAdjust = parsedState.savedAdjustment; 
                let lblAdj = document.getElementById('labelRowAdjustment');
                if(lblAdj) {
                    lblAdj.innerText = settingRowAdjust === 0 ? 'تلقائي' : (settingRowAdjust > 0 ? '+' + settingRowAdjust : settingRowAdjust); 
                }
            }

            if(parsedState.savedChecks) {
                let cCond = document.getElementById('checkConditionalFormat'); if(cCond) cCond.checked = parsedState.savedChecks.cond;
                let cStrp = document.getElementById('checkStripedRows'); if(cStrp) cStrp.checked = parsedState.savedChecks.strip;
                let cWm = document.getElementById('checkShowWatermark'); if(cWm) cWm.checked = parsedState.savedChecks.wm;
                let cS1 = document.getElementById('checkSignature1'); if(cS1) cS1.checked = parsedState.savedChecks.s1;
                let cS2 = document.getElementById('checkSignature2'); if(cS2) cS2.checked = parsedState.savedChecks.s2;
                let cS3 = document.getElementById('checkSignature3'); if(cS3) cS3.checked = parsedState.savedChecks.s3;
                let cPage = document.getElementById('checkShowPageNumber'); if(cPage) cPage.checked = parsedState.savedChecks.page;
            }
        }
    } catch(error) {
        console.error("Load Error:", error);
    } 
    
    setTableAlignment('center');
    updatePaperPrintSettings(); 
}

function exportToExcelFile() {
    if (typeof XLSX === 'undefined') {
        alert('مكتبة الإكسل لم يتم تحميلها بعد، يرجى التأكد من اتصالك بالإنترنت.');
        return;
    }
    try {
        let excelData = [];
        let titleElement = document.getElementById('inputMainTitle');
        let documentTitle = titleElement ? titleElement.value : 'سجل البيانات';
        
        excelData.push([documentTitle]);
        excelData.push([]); 
        excelData.push(appColumns);
        
        appDataRows.forEach(row => {
            excelData.push(row);
        });
        
        let worksheet = XLSX.utils.aoa_to_sheet(excelData);
        
        if(!worksheet['!views']) worksheet['!views'] = [];
        worksheet['!views'].push({ rightToLeft: true });
        
        let wscols = appColumnWidths.map(w => ({ wpx: w }));
        worksheet['!cols'] = wscols;

        let workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "البيانات");
        
        XLSX.writeFile(workbook, 'رقيـم_بيانات.xlsx');
    } catch(error) {
        alert('حدث خطأ أثناء تصدير الإكسل: ' + error.message);
    }
}

// دالة التصدير الاحتياطية للوورد
function exportToWordFallback(documentTitle) {
    let isLandscapeFallback = (globalPaperOrientationMode === 'landscape');
    let cssPageRule = isLandscapeFallback ? 
        "@page WordSection1 { size: 841.9pt 595.3pt; mso-page-orientation: landscape; margin: 36.0pt 36.0pt 36.0pt 36.0pt; }" : 
        "@page WordSection1 { size: 595.3pt 841.9pt; margin: 36.0pt 36.0pt 36.0pt 36.0pt; }";

    let htmlDocString = `
    <html xmlns:v="urn:schemas-microsoft-com:vml"
          xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns:m="http://schemas-microsoft.com/office/2004/12/omml"
          xmlns="http://www.w3.org/TR/REC-html40" dir="rtl">
    <head>
        <meta charset="utf-8">
        <title>${escapeDangerousHtml(documentTitle)}</title>
        <!--[if gte mso 9]>
        <xml>
            <w:WordDocument>
                <w:View>Print</w:View>
                <w:Zoom>100</w:Zoom>
                <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
            ${cssPageRule}
            div.WordSection1 { page: WordSection1; }
            body { font-family: 'Arial', sans-serif; direction: rtl; text-align: right; }
            table { border-collapse: collapse; width: 100%; direction: rtl; }
            th, td { border: 1px solid #000000; padding: 8px; text-align: center; vertical-align: middle; }
            th { background-color: #e0e7ff; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="WordSection1">
            <h2 style="text-align:center; margin-bottom:20px;">${escapeDangerousHtml(documentTitle)}</h2>
            <table><thead><tr>`; 
    
    appColumns.forEach(col => { htmlDocString += `<th>${escapeDangerousHtml(col)}</th>`; }); 
    htmlDocString += "</tr></thead><tbody>"; 
    
    appDataRows.forEach(row => { 
        htmlDocString += "<tr>"; 
        row.forEach(cell => { htmlDocString += `<td>${escapeDangerousHtml(cell)}</td>`; }); 
        htmlDocString += "</tr>"; 
    }); 
    htmlDocString += "</tbody></table></div></body></html>"; 
    
    let blobObject = new Blob(['\ufeff', htmlDocString], { type: 'application/msword' }); 
    let downloadLink = URL.createObjectURL(blobObject); 
    let anchorElement = document.createElement('a'); 
    anchorElement.href = downloadLink; 
    anchorElement.download = 'رقيـم_بيانات.doc'; 
    document.body.appendChild(anchorElement); 
    anchorElement.click(); 
    document.body.removeChild(anchorElement); 
    URL.revokeObjectURL(downloadLink); 
}

function exportToWordFile() {
    let titleElement = document.getElementById('inputMainTitle');
    let documentTitle = titleElement ? titleElement.value : 'السجل';
    
    if (typeof docx !== 'undefined') {
        try {
            let docRows = [];
            
            let headerCells = appColumns.map(col => {
                let textValue = col ? String(col) : "-";
                return new docx.TableCell({
                    children: [new docx.Paragraph({
                        children: [new docx.TextRun({ text: textValue, bold: true, rightToLeft: true, font: "Arial" })],
                        alignment: docx.AlignmentType.CENTER,
                        bidirectional: true
                    })],
                    shading: { fill: "e0e7ff" },
                    margins: { top: 100, bottom: 100, left: 100, right: 100 }
                });
            });
            docRows.push(new docx.TableRow({ children: headerCells, tableHeader: true }));

            appDataRows.forEach(row => {
                let cells = row.map(cell => {
                    let textValue = cell ? String(cell) : " "; 
                    return new docx.TableCell({
                        children: [new docx.Paragraph({
                            children: [new docx.TextRun({ text: textValue, rightToLeft: true, font: "Arial" })],
                            alignment: docx.AlignmentType.CENTER,
                            bidirectional: true
                        })],
                        margins: { top: 100, bottom: 100, left: 100, right: 100 }
                    });
                });
                docRows.push(new docx.TableRow({ children: cells }));
            });

            const table = new docx.Table({
                rows: docRows,
                width: { size: 100, type: docx.WidthType.PERCENTAGE },
            });

            let isLandscape = (globalPaperOrientationMode === 'landscape');

            const doc = new docx.Document({
                creator: "Raqeem Pro",
                title: documentTitle,
                sections: [{
                    properties: {
                        page: {
                            size: {
                                orientation: isLandscape ? docx.PageOrientation.LANDSCAPE : docx.PageOrientation.PORTRAIT,
                            },
                            margin: { top: 720, right: 720, bottom: 720, left: 720 }
                        }
                    },
                    children: [
                        new docx.Paragraph({
                            children: [new docx.TextRun({ text: documentTitle, bold: true, size: 32, rightToLeft: true, font: "Arial" })],
                            alignment: docx.AlignmentType.CENTER,
                            bidirectional: true,
                            spacing: { after: 400 }
                        }),
                        table
                    ],
                }],
            });

            docx.Packer.toBlob(doc).then(blob => {
                let downloadLink = URL.createObjectURL(blob);
                let anchorElement = document.createElement('a');
                anchorElement.href = downloadLink;
                anchorElement.download = 'رقيـم_بيانات.docx';
                document.body.appendChild(anchorElement);
                anchorElement.click();
                document.body.removeChild(anchorElement);
                URL.revokeObjectURL(downloadLink);
            }).catch(err => {
                console.error("Packer error:", err);
                exportToWordFallback(documentTitle);
            });
            
            return; 
        } catch(error) {
            console.error("Native docx Error:", error);
            exportToWordFallback(documentTitle);
        }
    } else {
        exportToWordFallback(documentTitle);
    }
}

function downloadJsonBackup() { 
    saveAllDataToLocalStorage(); 
    let savedStr = localStorage.getItem(LOCAL_STORAGE_KEY);
    let fileBlob = new Blob([savedStr], {type: "application/json"}); 
    let downloadUrl = URL.createObjectURL(fileBlob); 
    let anchorTag = document.createElement('a'); 
    anchorTag.href = downloadUrl; 
    anchorTag.download = "backup_raqeem.json"; 
    document.body.appendChild(anchorTag); 
    anchorTag.click(); 
    document.body.removeChild(anchorTag); 
    URL.revokeObjectURL(downloadUrl); 
}

function processUploadedBackup(event) { 
    let uploadedFile = event.target.files[0]; 
    if(!uploadedFile) return; 
    let fileReader = new FileReader(); 
    fileReader.onload = function(e) { 
        try { 
            let parsedJson = JSON.parse(e.target.result); 
            if(parsedJson.savedColumns && parsedJson.savedData) { 
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsedJson)); 
                alert("تم رفع النسخة واسترجاع البيانات بنجاح!"); 
                location.reload(); 
            } else { 
                alert("عذراً، هذا الملف غير متوافق مع النظام!"); 
            } 
        } catch(err) { 
            alert("حدث خطأ أثناء قراءة الملف."); 
        } 
    }; 
    fileReader.readAsText(uploadedFile); 
}

function processExcelImport(event) {
    if(isEditingLocked) { alert("تم قفل السجل."); return; }
    let file = event.target.files[0];
    if(!file) return;
    
    let reader = new FileReader();
    reader.onload = function(e) {
        try {
            let data = new Uint8Array(e.target.result);
            let workbook = XLSX.read(data, {type: 'array'});
            let firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            let excelRows = XLSX.utils.sheet_to_json(firstSheet, {header: 1});
            
            if(excelRows.length > 0) {
                excelRows.forEach(rowArray => {
                    if(rowArray.length === 0) return;
                    if(appDataRows.length >= MAXIMUM_ALLOWED_ROWS) return;
                    
                    const newRowInsertion = Array(appColumns.length).fill("");
                    for(let i=0; i<appColumns.length; i++) {
                        if(i > 0) {
                            newRowInsertion[i] = rowArray[i-1] ? String(rowArray[i-1]) : "";
                        }
                    }
                    appDataRows.push(newRowInsertion);
                    appCellColors.push(Array(appColumns.length).fill("")); 
                });
                
                recalculateRowNumbers();
                saveCurrentStateToHistory();
                renderPaperPages();
            }
        } catch(err) {
            alert("حدث خطأ أثناء قراءة ملف الإكسل. يرجى التأكد من أن الملف سليم.");
        }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = null;
}

function setHighlightColorForActiveCell(bgColor, txtColor) {
    if(isEditingLocked) { alert("تم قفل السجل."); return; }
    if(activeFocusRow < 0 || activeFocusRow >= appDataRows.length || activeFocusCol < 0 || activeFocusCol >= appColumns.length) {
        alert("يرجى النقر داخل الخلية (المربع) الذي تريد تلوينه أولاً!");
        return;
    }
    if(appDataRows[activeFocusRow][1] === 'المجموع الكلي:') return;
    
    if(!appCellColors[activeFocusRow]) {
        appCellColors[activeFocusRow] = Array(appColumns.length).fill("");
    }
    
    let combinedColorString = bgColor ? `${bgColor}|${txtColor}` : "";
    appCellColors[activeFocusRow][activeFocusCol] = combinedColorString;
    
    saveCurrentStateToHistory();
    renderPaperPages();
}

function updateMemoryValue(updateType, rowIndex, colIndex, newValue) {
    if(['title', 'dir', 'school', 'num', 'date', 's1', 's1n', 's2', 's2n', 's3', 's3n'].includes(updateType)) {
        let printElement = document.getElementById(`print_${updateType}`);
        if(printElement) {
            if(updateType === 'title') {
                let el = document.getElementById('inputMainTitle');
                printElement.innerText = el ? el.value : '';
            }
            if(updateType === 'dir') {
                let el = document.getElementById('inputDirectorate');
                printElement.innerText = el ? el.value : '';
            }
            if(updateType === 'school') {
                let el = document.getElementById('inputSchoolName');
                printElement.innerText = el ? el.value : '';
            }
            if(updateType === 'num') {
                let el = document.getElementById('inputDocumentNumber');
                printElement.innerText = (el && el.value) ? 'العدد: ' + el.value : '';
            }
            if(updateType === 'date') {
                let el = document.getElementById('inputDocumentDate');
                printElement.innerText = (el && el.value) ? 'التاريخ: ' + el.value : '';
            }
            
            if(updateType === 's1') { let el = document.getElementById('inputSigTitle1'); printElement.innerText = el ? el.value : ''; }
            if(updateType === 's1n') { let el = document.getElementById('inputSigName1'); printElement.innerText = el ? el.value : ''; }
            if(updateType === 's2') { let el = document.getElementById('inputSigTitle2'); printElement.innerText = el ? el.value : ''; }
            if(updateType === 's2n') { let el = document.getElementById('inputSigName2'); printElement.innerText = el ? el.value : ''; }
            if(updateType === 's3') { let el = document.getElementById('inputSigTitle3'); printElement.innerText = el ? el.value : ''; }
            if(updateType === 's3n') { let el = document.getElementById('inputSigName3'); printElement.innerText = el ? el.value : ''; }
        }
        saveAllDataToLocalStorage();
        return;
    }

    if(updateType === 'header') {
        if(appColumns[colIndex] !== newValue.trim()) {
            appColumns[colIndex] = newValue.trim();
            saveCurrentStateToHistory();
            saveAllDataToLocalStorage();
        }
        return;
    }

    if(updateType === 'cell') {
        let formattedValue = newValue.trim();
        if(appDataRows[rowIndex] && appDataRows[rowIndex][colIndex] !== formattedValue) { 
            appDataRows[rowIndex][colIndex] = formattedValue; 
            saveCurrentStateToHistory(); 
            saveAllDataToLocalStorage(); 
            
            let cellElementId = `cell_${rowIndex}_${colIndex}`;
            let cellElement = document.getElementById(cellElementId); 
            
            if(cellElement) {
                cellElement.classList.remove('cond-fail', 'cond-warn');
                
                let checkConditional = document.getElementById('checkConditionalFormat');
                if (checkConditional && checkConditional.checked && colIndex > 1 && appDataRows[rowIndex][1] !== 'المجموع الكلي:') { 
                    let parsedNumber = parseFloat(formattedValue); 
                    if(!isNaN(parsedNumber) && parsedNumber < 50 && formattedValue !== "") {
                        cellElement.classList.add('cond-fail'); 
                    } else if(formattedValue.includes("غائب") || formattedValue.includes("اجازة") || formattedValue.includes("إجازة")) {
                        cellElement.classList.add('cond-warn'); 
                    }
                }
            }
        } 
    }
}

document.addEventListener('paste', function(event) { 
    if(event.target.classList.contains('e-cell')) { 
        event.preventDefault(); 
        let clipboardData = (event.originalEvent || event).clipboardData.getData('text/plain');
        document.execCommand('insertText', false, clipboardData.trim()); 
    } 
});

function renderColumnWidthSliders() {
    while(appColumnWidths.length < appColumns.length) {
        appColumnWidths.push(100);
    }
    if(appColumnWidths.length > appColumns.length) {
        appColumnWidths = appColumnWidths.slice(0, appColumns.length);
    }

    let containerWrap = document.getElementById('columnSlidersContainer'); 
    if(!containerWrap) return; 
    
    let slidersHtmlString = '';
    appColumns.forEach((colName, index) => { 
        slidersHtmlString += `
        <div class="stepper">
            <span class="step-label" title="${escapeDangerousHtml(colName)}">${escapeDangerousHtml(colName) || 'عمود'}</span>
            <div class="step-actions">
                <span id="labelWidth${index}" class="step-val">${appColumnWidths[index]}px</span>
                <div class="step-btn-group">
                    <button class="step-btn" onclick="updateColWidthViaStepper(${index}, 1)">▲</button>
                    <button class="step-btn" onclick="updateColWidthViaStepper(${index}, -1)">▼</button>
                </div>
            </div>
        </div>`; 
    });
    containerWrap.innerHTML = slidersHtmlString;
}

function updateColWidthViaStepper(colIndex, changeAmount) { 
    let newWidthValue = appColumnWidths[colIndex] + changeAmount; 
    
    if(newWidthValue < 10) { newWidthValue = 10; }
    if(newWidthValue > 600) newWidthValue = 600; 
    
    appColumnWidths[colIndex] = newWidthValue; 
    
    let labelElement = document.getElementById(`labelWidth${colIndex}`);
    if(labelElement) {
        labelElement.innerText = newWidthValue + 'px'; 
    }
    
    document.querySelectorAll(`.header-col-${colIndex}`).forEach(thElement => { 
        thElement.style.width = newWidthValue + 'px'; 
        thElement.style.minWidth = newWidthValue + 'px'; 
        thElement.style.maxWidth = newWidthValue + 'px'; 
    }); 
    saveAllDataToLocalStorage(); 
}

function saveCurrentStateToHistory() { 
    if (currentHistoryIndex < appHistoryStates.length - 1) {
        appHistoryStates = appHistoryStates.slice(0, currentHistoryIndex + 1);
    }
    
    while(appCellColors.length < appDataRows.length) {
        appCellColors.push(Array(appColumns.length).fill(""));
    }
    appCellColors.forEach(rowColors => {
        while(rowColors.length < appColumns.length) rowColors.push("");
    });

    appHistoryStates.push({ 
        cols: [...appColumns], 
        colWidths: [...appColumnWidths], 
        data: JSON.parse(JSON.stringify(appDataRows)),
        cellColors: JSON.parse(JSON.stringify(appCellColors))
    }); 
    if(appHistoryStates.length > 30) {
        appHistoryStates.shift(); 
    } else {
        currentHistoryIndex++; 
    }
    saveAllDataToLocalStorage(); 
}

function performUndo() { 
    if(currentHistoryIndex > 0) { 
        currentHistoryIndex--; 
        let restoredState = appHistoryStates[currentHistoryIndex]; 
        appColumns = [...restoredState.cols]; 
        appColumnWidths = [...restoredState.colWidths]; 
        appDataRows = JSON.parse(JSON.stringify(restoredState.data)); 
        if(restoredState.cellColors) appCellColors = JSON.parse(JSON.stringify(restoredState.cellColors));
        renderColumnWidthSliders(); 
        renderPaperPages(); 
    } 
}

function performRedo() { 
    if(currentHistoryIndex < appHistoryStates.length - 1) { 
        currentHistoryIndex++; 
        let restoredState = appHistoryStates[currentHistoryIndex]; 
        appColumns = [...restoredState.cols]; 
        appColumnWidths = [...restoredState.colWidths]; 
        appDataRows = JSON.parse(JSON.stringify(restoredState.data)); 
        if(restoredState.cellColors) appCellColors = JSON.parse(JSON.stringify(restoredState.cellColors));
        renderColumnWidthSliders(); 
        renderPaperPages(); 
    } 
}

function recalculateRowNumbers() { 
    let rowIndexCounter = 1; 
    appDataRows.forEach(rowArr => { 
        if(rowArr[1] !== 'المجموع الكلي:') { 
            rowArr[0] = rowIndexCounter.toString(); 
            rowIndexCounter++; 
        } else { 
            rowArr[0] = ''; 
        } 
    }); 
}

function addNewRowToTable() { 
    if(isEditingLocked) { alert("تم قفل السجل."); return; }
    if(appDataRows.length >= MAXIMUM_ALLOWED_ROWS) return; 
    
    const newEmptyRow = Array(appColumns.length).fill(""); 
    const newColorRow = Array(appColumns.length).fill("");
    
    if(activeFocusRow > -1 && activeFocusRow < appDataRows.length) { 
        appDataRows.splice(activeFocusRow + 1, 0, newEmptyRow); 
        appCellColors.splice(activeFocusRow + 1, 0, newColorRow); 
        activeFocusRow++; 
    } else { 
        appDataRows.push(newEmptyRow); 
        appCellColors.push(newColorRow);
    } 
    recalculateRowNumbers(); 
    saveCurrentStateToHistory(); 
    renderPaperPages(); 
}

function addNewColumnToTable() { 
    if(isEditingLocked) { alert("تم قفل السجل."); return; }
    let targetInsertIndex = (activeFocusCol > -1) ? activeFocusCol + 1 : appColumns.length; 
    appColumns.splice(targetInsertIndex, 0, "عمود جديد"); 
    appColumnWidths.splice(targetInsertIndex, 0, 100); 
    appDataRows.forEach(rowArr => rowArr.splice(targetInsertIndex, 0, "")); 
    appCellColors.forEach(rowColors => rowColors.splice(targetInsertIndex, 0, ""));
    
    if(activeFocusCol > -1) activeFocusCol++; 
    saveCurrentStateToHistory(); 
    renderColumnWidthSliders(); 
    renderPaperPages(); 
}

function deleteActiveRow() { 
    if(isEditingLocked) { alert("تم قفل السجل."); return; }
    if(appDataRows.length === 0) return; 
    if(activeFocusRow > -1 && activeFocusRow < appDataRows.length) { 
        appDataRows.splice(activeFocusRow, 1); 
        appCellColors.splice(activeFocusRow, 1); 
        activeFocusRow = -1; 
    } else { 
        appDataRows.pop(); 
        appCellColors.pop();
    } 
    recalculateRowNumbers(); 
    saveCurrentStateToHistory(); 
    renderPaperPages(); 
}

function deleteActiveColumn() { 
    if(isEditingLocked) { alert("تم قفل السجل."); return; }
    if(appColumns.length <= 1) return; 
    let targetDeleteIndex = (activeFocusCol > -1 && activeFocusCol < appColumns.length) ? activeFocusCol : appColumns.length - 1; 
    if(targetDeleteIndex === 0) { alert("لا يمكن حذف التسلسل"); return; }
    
    appColumns.splice(targetDeleteIndex, 1); 
    appColumnWidths.splice(targetDeleteIndex, 1); 
    appDataRows.forEach(rowArr => rowArr.splice(targetDeleteIndex, 1)); 
    appCellColors.forEach(rowColors => rowColors.splice(targetDeleteIndex, 1));
    
    activeFocusCol = -1; 
    saveCurrentStateToHistory(); 
    renderColumnWidthSliders(); 
    renderPaperPages(); 
}

function moveActiveRowBy(directionStep) { 
    if(isEditingLocked) return;
    if(activeFocusRow < 0 || activeFocusRow >= appDataRows.length) return; 
    let targetSwapIndex = activeFocusRow + directionStep; 
    if(targetSwapIndex < 0 || targetSwapIndex >= appDataRows.length) return; 
    
    let tempRowData = appDataRows[activeFocusRow]; 
    appDataRows[activeFocusRow] = appDataRows[targetSwapIndex]; 
    appDataRows[targetSwapIndex] = tempRowData; 
    
    let tempColorRow = appCellColors[activeFocusRow];
    appCellColors[activeFocusRow] = appCellColors[targetSwapIndex];
    appCellColors[targetSwapIndex] = tempColorRow;

    activeFocusRow = targetSwapIndex; 
    
    recalculateRowNumbers(); 
    saveCurrentStateToHistory(); 
    renderPaperPages(); 
}

function calculateAutomaticSum() {
    if(appDataRows.length === 0 || appDataRows.length >= MAXIMUM_ALLOWED_ROWS) return; 
    let sumRowData = Array(appColumns.length).fill(""); 
    sumRowData[0] = ""; 
    sumRowData[1] = "المجموع الكلي:"; 
    let hasValidNumbers = false;
    
    for(let colIdx = 2; colIdx < appColumns.length; colIdx++) { 
        let columnSumValue = 0; 
        let columnHasData = false; 
        for(let rowIdx = 0; rowIdx < appDataRows.length; rowIdx++) { 
            if(appDataRows[rowIdx][1] === 'المجموع الكلي:') continue; 
            let parsedCellValue = parseFloat(appDataRows[rowIdx][colIdx]); 
            if(!isNaN(parsedCellValue)) { 
                columnSumValue += parsedCellValue; 
                columnHasData = true; 
                hasValidNumbers = true; 
            } 
        } 
        if(columnHasData) {
            sumRowData[colIdx] = columnSumValue.toString(); 
        }
    }
    if(!hasValidNumbers) { alert("لم يتم العثور على أرقام لجمعها!"); return; }
    appDataRows.push(sumRowData); 
    appCellColors.push(Array(appColumns.length).fill("")); 
    saveCurrentStateToHistory(); 
    renderPaperPages(); 
}

async function pasteDataFromExcel() {
    if(isEditingLocked) { alert("تم قفل السجل."); return; }
    try {
        if (!navigator.clipboard || !navigator.clipboard.readText) { 
            alert('متصفحك يمنع اللصق المباشر. قم بلصق البيانات يدوياً داخل أي مربع باستخدام لوحة المفاتيح.'); 
            return; 
        }
        const clipboardContent = await navigator.clipboard.readText(); 
        if(!clipboardContent.trim()) return;
        
        const splitLinesArray = clipboardContent.split(/\r?\n/);
        splitLinesArray.forEach(lineString => { 
            if(!lineString.trim() || appDataRows.length >= MAXIMUM_ALLOWED_ROWS) return; 
            const parsedTabularData = lineString.split('\t'); 
            const newRowInsertion = Array(appColumns.length).fill(""); 
            for(let i=1; i<appColumns.length; i++) { 
                newRowInsertion[i] = parsedTabularData[i-1] || ""; 
            } 
            appDataRows.push(newRowInsertion); 
            appCellColors.push(Array(appColumns.length).fill(""));
        });
        
        recalculateRowNumbers(); 
        saveCurrentStateToHistory(); 
        renderPaperPages(); 
    } catch (error) { 
        alert('يرجى النقر داخل المربع ولصق البيانات يدوياً (Paste).'); 
    }
}

function formatPageNumLocal(numberValue, languageType) { 
    if(languageType === 'en') return String(numberValue); 
    const arabicNumbersMap = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩']; 
    return String(numberValue).split('').map(digit => arabicNumbersMap[digit] || digit).join(''); 
}

let renderDelayTimeout;
function renderPaperPages() {
    clearTimeout(renderDelayTimeout);
    renderDelayTimeout = setTimeout(() => {
        saveAllDataToLocalStorage(); 
        const mainContainer = document.getElementById('previewAreaContainer'); 
        if(!mainContainer) return;
        
        let maxPaperHeightMm = 297; 
        if (globalPaperSizeMode === 'a4' && globalPaperOrientationMode === 'landscape') maxPaperHeightMm = 210; 
        if (globalPaperSizeMode === 'a3' && globalPaperOrientationMode === 'portrait') maxPaperHeightMm = 420; 
        if (globalPaperSizeMode === 'a3' && globalPaperOrientationMode === 'landscape') maxPaperHeightMm = 297;
        
        let checkPageNumBox = document.getElementById('checkShowPageNumber');
        let isPageNumActive = (checkPageNumBox && checkPageNumBox.checked);
        
        let rowsAllowedPerPage = Math.floor((maxPaperHeightMm - (settingMargin * 2) - 45 - (isPageNumActive ? 10 : 0) - (settingRowHeight + 2)) / settingRowHeight) + settingRowAdjust; 
        if(isNaN(rowsAllowedPerPage) || rowsAllowedPerPage < 2) rowsAllowedPerPage = 5; 
        
        let checkStripedBox = document.getElementById('checkStripedRows');
        let stripedClassString = (checkStripedBox && checkStripedBox.checked) ? 'striped' : ''; 
        
        let sig1Box = document.getElementById('checkSignature1');
        let sig2Box = document.getElementById('checkSignature2');
        let sig3Box = document.getElementById('checkSignature3');
        let displaySig1 = (sig1Box && sig1Box.checked) ? 'block' : 'none'; 
        let displaySig2 = (sig2Box && sig2Box.checked) ? 'block' : 'none'; 
        let displaySig3 = (sig3Box && sig3Box.checked) ? 'block' : 'none';
        
        let docNumInput = document.getElementById('inputDocumentNumber');
        let docDateInput = document.getElementById('inputDocumentDate');
        let metaHeaderHtml = ''; 
        if((docNumInput && docNumInput.value) || (docDateInput && docDateInput.value)) { 
            metaHeaderHtml = `<div class="ph-meta"><span id="print_num">${docNumInput.value ? 'العدد: ' + escapeDangerousHtml(docNumInput.value) + '<br>' : ''}</span><span id="print_date">${docDateInput.value ? 'التاريخ: ' + escapeDangerousHtml(docDateInput.value) : ''}</span></div>`; 
        }
        
        let checkWmBox = document.getElementById('checkShowWatermark');
        let showWatermarkFlag = (checkWmBox && checkWmBox.checked && globalLogoImageBase64);
        
        let checkCondBox = document.getElementById('checkConditionalFormat');
        let useCondFormatting = (checkCondBox && checkCondBox.checked);

        let docFragmentObj = document.createDocumentFragment(); 
        let calculatedTotalPages = Math.ceil(appDataRows.length / rowsAllowedPerPage); 
        if(calculatedTotalPages === 0) calculatedTotalPages = 1;

        let titleMainInput = document.getElementById('inputMainTitle');
        let dirMainInput = document.getElementById('inputDirectorate');
        let schoolMainInput = document.getElementById('inputSchoolName');
        
        let safeTitle = titleMainInput ? escapeDangerousHtml(titleMainInput.value) : '';
        let safeDir = dirMainInput ? escapeDangerousHtml(dirMainInput.value) : '';
        let safeSchool = schoolMainInput ? escapeDangerousHtml(schoolMainInput.value) : '';

        for (let pageIdx = 0; pageIdx < calculatedTotalPages; pageIdx++) {
            let dataStartIndex = pageIdx * rowsAllowedPerPage; 
            let pageDataSliceArray = appDataRows.slice(dataStartIndex, dataStartIndex + rowsAllowedPerPage);

            let paperDivElement = document.createElement('div'); 
            paperDivElement.className = `paper size-${globalPaperSizeMode} ${globalPaperOrientationMode}`;

            let watermarkHtml = showWatermarkFlag ? `<div class="watermark" style="background-image: url('${globalLogoImageBase64}')"></div>` : '';

            let headerCompleteHtml = `
            <div class="p-header">
                <div class="ph-right">
                    <h3 id="print_dir">${safeDir}</h3>
                    <h2 id="print_school">${safeSchool}</h2>
                </div>
                <div class="ph-center">
                    <h1 id="print_title">${safeTitle}</h1>
                </div>
                <div class="ph-left">
                    ${metaHeaderHtml}
                    <img src="${globalLogoImageBase64}" style="display:${globalLogoImageBase64 ? 'block':'none'};">
                </div>
            </div>`;

            let tableHeadHtmlString = '<tr>';
            appColumns.forEach((cName, colIndex) => { 
                let editableAttribute = isEditingLocked ? 'contenteditable="false"' : 'contenteditable="true"';
                tableHeadHtmlString += `<th class="header-col-${colIndex}" style="width:${appColumnWidths[colIndex]}px; min-width:${appColumnWidths[colIndex]}px; max-width:${appColumnWidths[colIndex]}px;">
                    <div style="display:flex; align-items:center; width:100%; height:100%;">
                        <div ${editableAttribute} class="e-cell" id="head_${colIndex}" onfocus="updateCellFocusPosition(-1, ${colIndex})" onblur="updateMemoryValue('header', -1, ${colIndex}, this.innerText)">${escapeDangerousHtml(cName)}</div>
                        <span style="cursor:pointer; opacity:0.5; font-size:1.1rem; user-select:none; flex-shrink: 0; padding-left: 5px;" onclick="sortDataByColumn(${colIndex})" title="فرز عمود">⇅</span>
                    </div>
                </th>`; 
            }); 
            tableHeadHtmlString += '</tr>';

            let tableBodyHtmlString = '';
            pageDataSliceArray.forEach((rowArray, rowRelativeIndex) => {
                let globalRowIndexId = dataStartIndex + rowRelativeIndex; 
                let isRowSummary = (rowArray[1] === 'المجموع الكلي:');
                
                let customCellColorStr = (appCellColors[globalRowIndexId] && appCellColors[globalRowIndexId][0]) ? appCellColors[globalRowIndexId][0] : "";
                let rowStyleCss = "";
                if (isRowSummary) {
                    rowStyleCss = 'font-weight:bold; background:var(--app-primary-light) !important;';
                }
                
                tableBodyHtmlString += `<tr style="${rowStyleCss}">`;
                
                rowArray.forEach((cellStringValue, cellColIndex) => { 
                    let editableAttributeRow = (isEditingLocked || isRowSummary) ? 'contenteditable="false"' : 'contenteditable="true"';
                    
                    let conditionCssClasses = ""; 
                    if(useCondFormatting && !isRowSummary && cellColIndex > 1) { 
                        let parsedNumberValue = parseFloat(cellStringValue); 
                        if (!isNaN(parsedNumberValue) && parsedNumberValue < 50 && cellStringValue !== "") {
                            conditionCssClasses = "cond-fail"; 
                        } else if (cellStringValue.includes("غائب") || cellStringValue.includes("اجازة") || cellStringValue.includes("إجازة")) {
                            conditionCssClasses = "cond-warn";
                        }
                    }

                    let customCellColorStr = (appCellColors[globalRowIndexId] && appCellColors[globalRowIndexId][cellColIndex]) ? appCellColors[globalRowIndexId][cellColIndex] : "";
                    let cellInlineStyle = "";
                    if (customCellColorStr !== "" && !isRowSummary) {
                        let colorParts = customCellColorStr.split('|');
                        cellInlineStyle = `background-color: ${colorParts[0]} !important; color: ${colorParts[1]} !important; font-weight: 900 !important; border-radius: 4px; box-shadow: inset 0 0 0 2px ${colorParts[1]};`;
                    }

                    tableBodyHtmlString += `<td><div ${editableAttributeRow} class="e-cell ${conditionCssClasses}" style="${cellInlineStyle}" id="cell_${globalRowIndexId}_${cellColIndex}" onfocus="updateCellFocusPosition(${globalRowIndexId}, ${cellColIndex})" onblur="updateMemoryValue('cell', ${globalRowIndexId}, ${cellColIndex}, this.innerText)">${escapeDangerousHtml(cellStringValue)}</div></td>`; 
                }); 
                tableBodyHtmlString += '</tr>';
            });

            let paginationHtmlString = '';
            if(isPageNumActive) {
                let langInput = document.getElementById('inputPageNumberLanguage');
                let languageSelection = langInput ? langInput.value : 'ar';
                paginationHtmlString = `<div class="page-num">${formatPageNumLocal(pageIdx + 1, languageSelection)}</div>`;
            }

            let sigT1Input = document.getElementById('inputSigTitle1'); let safeSigT1 = sigT1Input ? escapeDangerousHtml(sigT1Input.value) : '';
            let sigN1Input = document.getElementById('inputSigName1'); let safeSigN1 = sigN1Input ? escapeDangerousHtml(sigN1Input.value) : '';
            let sigT2Input = document.getElementById('inputSigTitle2'); let safeSigT2 = sigT2Input ? escapeDangerousHtml(sigT2Input.value) : '';
            let sigN2Input = document.getElementById('inputSigName2'); let safeSigN2 = sigN2Input ? escapeDangerousHtml(sigN2Input.value) : '';
            let sigT3Input = document.getElementById('inputSigTitle3'); let safeSigT3 = sigT3Input ? escapeDangerousHtml(sigT3Input.value) : '';
            let sigN3Input = document.getElementById('inputSigName3'); let safeSigN3 = sigN3Input ? escapeDangerousHtml(sigN3Input.value) : '';

            paperDivElement.innerHTML = `
                ${watermarkHtml}
                <div class="paper-wrap">
                    ${headerCompleteHtml}
                    <table class="t-print ${stripedClassString}">
                        <thead>${tableHeadHtmlString}</thead>
                        <tbody>${tableBodyHtmlString}</tbody>
                    </table>
                </div>
                <div class="p-sigs">
                    <div class="sig-box" style="display:${displaySig1}"><h4 id="print_s1">${safeSigT1}</h4><p id="print_s1n">${safeSigN1}</p></div>
                    <div class="sig-box" style="display:${displaySig2}"><h4 id="print_s2">${safeSigT2}</h4><p id="print_s2n">${safeSigN2}</p></div>
                    <div class="sig-box" style="display:${displaySig3}"><h4 id="print_s3">${safeSigT3}</h4><p id="print_s3n">${safeSigN3}</p></div>
                </div>
                ${paginationHtmlString}
            `;
            docFragmentObj.appendChild(paperDivElement);
        } 
        
        mainContainer.innerHTML = ''; 
        mainContainer.appendChild(docFragmentObj); 
        executeSearch(); 
    }, 100);
}

function loadReadyTemplate(templateType) {
    let titleInput = document.getElementById('inputMainTitle');
    if(templateType === 'attendance') { 
        appColumns = ["ت", "الطالب", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"]; 
        appColumnWidths = [50, 150, 80, 80, 80, 80, 80]; 
        if(titleInput) { titleInput.value = "سجل غيابات وحضور الطلاب"; updateMemoryValue('title'); }
        setTableAlignment('center'); 
    } else if(templateType === 'grades') { 
        appColumns = ["ت", "اسم الطالب", "السعي", "النهائي", "الملاحظات"]; 
        appColumnWidths = [50, 180, 80, 80, 150]; 
        if(titleInput) { titleInput.value = "سجل درجات الطلاب"; updateMemoryValue('title'); }
        setTableAlignment('center'); 
    } else if(templateType === 'employees') { 
        appColumns = ["ت", "اسم الموظف", "العنوان الوظيفي", "القسم التابع له"]; 
        appColumnWidths = [50, 180, 120, 120]; 
        if(titleInput) { titleInput.value = "سجل الملاك والموظفين"; updateMemoryValue('title'); }
        setTableAlignment('right'); 
    } else if(templateType === 'inventory') { 
        appColumns = ["ت", "اسم المادة", "الكمية", "السعر", "ملاحظات وتفاصيل"]; 
        appColumnWidths = [50, 150, 100, 100, 150]; 
        if(titleInput) { titleInput.value = "سجل الجرد والمخزون المالي"; updateMemoryValue('title'); }
        setTableAlignment('center'); 
    } else if(templateType === 'daily') { 
        appColumns = ["ت", "البيان", "الرقم", "الوصف", "الملاحظات"]; 
        appColumnWidths = [50, 150, 100, 200, 150]; 
        if(titleInput) { titleInput.value = "سجل اليومية العامة"; updateMemoryValue('title'); }
        setTableAlignment('center'); 
    } else if(templateType === 'expenses') { 
        appColumns = ["ت", "الجهة المستفيدة", "المبلغ", "التاريخ", "التوقيع"]; 
        appColumnWidths = [50, 180, 100, 100, 120]; 
        if(titleInput) { titleInput.value = "سجل النفقات والمصروفات"; updateMemoryValue('title'); }
        setTableAlignment('center'); 
    } else if(templateType === 'library') { 
        appColumns = ["ت", "اسم الكتاب", "المستعير", "تاريخ الإعارة", "تاريخ الإرجاع"]; 
        appColumnWidths = [50, 200, 150, 100, 100]; 
        if(titleInput) { titleInput.value = "سجل إعارة الكتب المدرسية"; updateMemoryValue('title'); }
        setTableAlignment('center'); 
    } else if(templateType === 'visits') { 
        appColumns = ["ت", "اسم الزائر", "الجهة", "سبب الزيارة", "الوقت"]; 
        appColumnWidths = [50, 180, 120, 150, 80]; 
        if(titleInput) { titleInput.value = "سجل زيارات المدرسة"; updateMemoryValue('title'); }
        setTableAlignment('center'); 
    } else if(templateType === 'tasks') { 
        appColumns = ["ت", "المهمة المطلوبة", "المسؤول", "الحالة", "ملاحظات"]; 
        appColumnWidths = [50, 200, 120, 80, 150]; 
        if(titleInput) { titleInput.value = "سجل متابعة المهام"; updateMemoryValue('title'); }
        setTableAlignment('center'); 
    } else if(templateType === 'clinic') { 
        appColumns = ["ت", "اسم الطالب", "الصف", "الشكوى", "الإجراء المتخذ"]; 
        appColumnWidths = [50, 150, 80, 150, 200]; 
        if(titleInput) { titleInput.value = "سجل الإحالات الصحية"; updateMemoryValue('title'); }
        setTableAlignment('center'); 
    } else if(templateType === 'maintenance') { 
        appColumns = ["ت", "العطل أو الخلل", "الموقع", "تاريخ التبليغ", "تاريخ الإنجاز"]; 
        appColumnWidths = [50, 200, 100, 100, 100]; 
        if(titleInput) { titleInput.value = "سجل الصيانة المدرسية"; updateMemoryValue('title'); }
        setTableAlignment('center'); 
    } else if(templateType === 'empty') { 
        appColumns = ["ت", "العمود الأول", "العمود الثاني", "العمود الثالث"]; 
        appColumnWidths = [50, 150, 150, 150]; 
        if(titleInput) { titleInput.value = "سجل فارغ"; updateMemoryValue('title'); }
        setTableAlignment('center'); 
    }
    
    appDataRows = []; 
    appCellColors = [];
    for(let idx = 0; idx < 3; idx++) { 
        const emptyRowTemplate = Array(appColumns.length).fill(""); 
        emptyRowTemplate[0] = idx + 1; 
        appDataRows.push(emptyRowTemplate); 
        appCellColors.push(Array(appColumns.length).fill(""));
    }
    
    saveCurrentStateToHistory(); 
    renderColumnWidthSliders(); 
    renderPaperPages(); 
    
    let btnTab1 = document.querySelector('.tab-btn');
    if(btnTab1) switchControlTab('tab1', btnTab1);
    
    if(window.innerWidth <= 900) {
        toggleMobileInterface('controls');
    }
}

window.onload = function() { 
    initializeColorThemesUI(); 
    loadAllDataFromLocalStorage(); 
    renderColumnWidthSliders(); 
    if(appHistoryStates.length === 0) {
        saveCurrentStateToHistory(); 
    }
    renderPaperPages(); 
    checkWelcomeModal();
};
