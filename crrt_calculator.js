// CRRT Calculator JavaScript
// Continuous Renal Replacement Therapy Dose Calculator

class CRRTCalculator {
    constructor() {
        this.inputFields = {};
        this.results = {};
        this.calculationSteps = {};
        this.isAutoSaveEnabled = true;
        this.initializeApp();
    }

    initializeApp() {
        this.initializeInputFields();
        this.initializeEventListeners();
        this.loadSavedData();
        this.populateGuideTable();
        this.setupSidebar();
    }

    initializeInputFields() {
        // 입력 필드 초기화
        const fieldIds = [
            'weight', 'hematocrit', 'bloodFlowRate', 'preDilution', 
            'postDilution', 'dialysate', 'ultraFiltration', 
            'prescribedTime', 'actualRuntime'
        ];

        fieldIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.inputFields[id] = element;
                // 입력값 변경 시 자동 저장
                element.addEventListener('input', () => {
                    if (this.isAutoSaveEnabled) {
                        this.saveData();
                    }
                });
            }
        });
    }

    initializeEventListeners() {
        // 계산 버튼
        const calculateBtn = document.getElementById('calculateBtn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.calculate());
        }

        // 초기화 버튼
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAll());
        }

        // 저장 버튼
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveData());
        }

        // 가이드 버튼
        const guideBtn = document.getElementById('guideBtn');
        if (guideBtn) {
            guideBtn.addEventListener('click', () => this.showGuideModal());
        }

        // 사이드바 메뉴 이벤트
        this.setupSidebarMenuEvents();
    }

    setupSidebar() {
        const menuBtn = document.getElementById('menuBtn');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        const closeSidebar = document.getElementById('closeSidebar');

        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                sidebar.classList.add('open');
                sidebarOverlay.classList.add('show');
            });
        }

        if (closeSidebar) {
            closeSidebar.addEventListener('click', () => {
                sidebar.classList.remove('open');
                sidebarOverlay.classList.remove('show');
            });
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                sidebarOverlay.classList.remove('show');
            });
        }
    }

    setupSidebarMenuEvents() {
        // 가이드 메뉴
        const guideMenuItem = document.getElementById('guideMenuItem');
        if (guideMenuItem) {
            guideMenuItem.addEventListener('click', () => {
                this.closeSidebar();
                this.showGuideModal();
            });
        }

        // 설정 메뉴
        const settingsMenuItem = document.getElementById('settingsMenuItem');
        if (settingsMenuItem) {
            settingsMenuItem.addEventListener('click', () => {
                this.closeSidebar();
                this.showSettingsModal();
            });
        }

        // 데이터 로드 메뉴
        const loadDataMenuItem = document.getElementById('loadDataMenuItem');
        if (loadDataMenuItem) {
            loadDataMenuItem.addEventListener('click', () => {
                this.closeSidebar();
                this.showLoadDataModal();
            });
        }

        // 데이터 초기화 메뉴
        const clearDataMenuItem = document.getElementById('clearDataMenuItem');
        if (clearDataMenuItem) {
            clearDataMenuItem.addEventListener('click', () => {
                this.closeSidebar();
                this.showClearDataConfirm();
            });
        }
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('show');
    }

    // 입력값 가져오기
    getInputValue(fieldId) {
        const element = this.inputFields[fieldId];
        if (!element) return 0;
        
        const value = parseFloat(element.value);
        return isNaN(value) ? 0 : value;
    }

    // 입력값 설정
    setInputValue(fieldId, value) {
        const element = this.inputFields[fieldId];
        if (element) {
            element.value = value;
        }
    }

    // 계산 실행
    calculate() {
        try {
            // 입력값 검증
            const weight = this.getInputValue('weight');
            if (weight <= 0) {
                this.showAlert('체중을 입력해주세요.', 'warning');
                return;
            }

            // 계산 실행
            this.calculatePlasmaFlow();
            this.calculateEffluentDose();
            this.calculateFiltrationFraction();
            this.calculateDilutionFactor();
            this.calculateActualDeliveredDose();

            // 결과 표시
            this.displayResults();
            this.displayCalculationSteps();

            // 자동 저장
            if (this.isAutoSaveEnabled) {
                this.saveData();
            }

        } catch (error) {
            console.error('계산 오류:', error);
            this.showAlert('계산 중 오류가 발생했습니다.', 'error');
        }
    }

    // 혈장 유량 계산
    calculatePlasmaFlow() {
        const bloodFlowRate = this.getInputValue('bloodFlowRate');
        const hematocrit = this.getInputValue('hematocrit');
        
        const plasmaFlow = bloodFlowRate * 60 * (1 - hematocrit / 100);
        
        this.results.plasmaFlow = plasmaFlow;
        this.calculationSteps.plasmaFlow = {
            formula: '혈장 유량 = 혈류량 × 60 × (1 - 헤마토크릿/100)',
            values: `혈장 유량 = ${bloodFlowRate} × 60 × (1 - ${hematocrit}/100)`,
            result: plasmaFlow.toFixed(2),
            unit: 'mL/hr'
        };
    }

    // 처방 용량 계산
    calculateEffluentDose() {
        const weight = this.getInputValue('weight');
        const preDilution = this.getInputValue('preDilution');
        const postDilution = this.getInputValue('postDilution');
        const dialysate = this.getInputValue('dialysate');
        const ultraFiltration = this.getInputValue('ultraFiltration');
        
        if (weight <= 0) {
            this.results.effluentDose = 0;
            this.calculationSteps.effluentDose = {
                formula: '처방 용량 = (Pre-dilution + Post-dilution + Dialysate + UF) / 체중',
                values: `처방 용량 = (${preDilution} + ${postDilution} + ${dialysate} + ${ultraFiltration}) / ${weight}`,
                result: '0',
                unit: 'mL/kg/hr',
                note: '체중이 0 이하입니다'
            };
            return;
        }
        
        const totalEffluent = preDilution + postDilution + dialysate + ultraFiltration;
        const effluentDose = totalEffluent / weight;
        
        this.results.effluentDose = effluentDose;
        this.calculationSteps.effluentDose = {
            formula: '처방 용량 = (Pre-dilution + Post-dilution + Dialysate + UF) / 체중',
            values: `처방 용량 = (${preDilution} + ${postDilution} + ${dialysate} + ${ultraFiltration}) / ${weight}`,
            result: effluentDose.toFixed(2),
            unit: 'mL/kg/hr'
        };
    }

    // 여과분율 계산
    calculateFiltrationFraction() {
        const plasmaFlow = this.results.plasmaFlow;
        const preDilution = this.getInputValue('preDilution');
        const postDilution = this.getInputValue('postDilution');
        const ultraFiltration = this.getInputValue('ultraFiltration');
        
        const convectiveFlow = preDilution + postDilution + ultraFiltration;
        const denominator = plasmaFlow + preDilution;
        
        if (denominator <= 0) {
            this.results.filtrationFraction = 0;
            this.calculationSteps.filtrationFraction = {
                formula: '여과분율 = (Pre-dilution + Post-dilution + UF) / (Plasma flow + Pre-dilution)',
                values: `여과분율 = (${preDilution} + ${postDilution} + ${ultraFiltration}) / (${plasmaFlow.toFixed(2)} + ${preDilution})`,
                result: '0',
                unit: '%',
                note: '분모가 0 이하입니다'
            };
            return;
        }
        
        const filtrationFraction = (convectiveFlow / denominator) * 100;
        
        this.results.filtrationFraction = filtrationFraction;
        this.calculationSteps.filtrationFraction = {
            formula: '여과분율 = (Pre-dilution + Post-dilution + UF) / (Plasma flow + Pre-dilution)',
            values: `여과분율 = (${preDilution} + ${postDilution} + ${ultraFiltration}) / (${plasmaFlow.toFixed(2)} + ${preDilution})`,
            result: filtrationFraction.toFixed(2),
            unit: '%'
        };
    }

    // 희석인자 계산
    calculateDilutionFactor() {
        const plasmaFlow = this.results.plasmaFlow;
        const preDilution = this.getInputValue('preDilution');
        
        const denominator = plasmaFlow + preDilution;
        
        if (denominator <= 0) {
            this.results.dilutionFactor = 0;
            this.calculationSteps.dilutionFactor = {
                formula: '희석인자 = Plasma Flow / (Plasma Flow + Pre-dilution)',
                values: `희석인자 = ${plasmaFlow.toFixed(2)} / (${plasmaFlow.toFixed(2)} + ${preDilution})`,
                result: '0',
                unit: '',
                note: '분모가 0 이하입니다'
            };
            return;
        }
        
        const dilutionFactor = plasmaFlow / denominator;
        
        this.results.dilutionFactor = dilutionFactor;
        this.calculationSteps.dilutionFactor = {
            formula: '희석인자 = Plasma Flow / (Plasma Flow + Pre-dilution)',
            values: `희석인자 = ${plasmaFlow.toFixed(2)} / (${plasmaFlow.toFixed(2)} + ${preDilution})`,
            result: dilutionFactor.toFixed(3),
            unit: ''
        };
    }

    // 실제 전달 용량 계산
    calculateActualDeliveredDose() {
        const effluentDose = this.results.effluentDose;
        const prescribedTime = this.getInputValue('prescribedTime');
        const actualRuntime = this.getInputValue('actualRuntime');
        
        if (prescribedTime <= 0) {
            this.results.actualDeliveredDose = 0;
            this.calculationSteps.actualDeliveredDose = {
                formula: '실제 전달 용량 = 처방 용량 × (실제 운행시간 / 처방시간)',
                values: `실제 전달 용량 = ${effluentDose.toFixed(2)} × (${actualRuntime} / ${prescribedTime})`,
                result: '0',
                unit: 'mL/kg/hr',
                note: '처방시간이 0 이하입니다'
            };
            return;
        }
        
        const actualDeliveredDose = effluentDose * (actualRuntime / prescribedTime);
        
        this.results.actualDeliveredDose = actualDeliveredDose;
        this.calculationSteps.actualDeliveredDose = {
            formula: '실제 전달 용량 = 처방 용량 × (실제 운행시간 / 처방시간)',
            values: `실제 전달 용량 = ${effluentDose.toFixed(2)} × (${actualRuntime} / ${prescribedTime})`,
            result: actualDeliveredDose.toFixed(2),
            unit: 'mL/kg/hr'
        };
    }

    // 결과 표시
    displayResults() {
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'block';
            resultsSection.classList.add('fade-in');
        }

        // 각 결과값 표시
        if (this.results.plasmaFlow !== undefined) {
            const element = document.getElementById('plasmaFlowResult');
            if (element) element.textContent = this.results.plasmaFlow.toFixed(2);
        }

        if (this.results.effluentDose !== undefined) {
            const element = document.getElementById('effluentDoseResult');
            if (element) element.textContent = this.results.effluentDose.toFixed(2);
        }

        if (this.results.filtrationFraction !== undefined) {
            const element = document.getElementById('filtrationFractionResult');
            if (element) element.textContent = this.results.filtrationFraction.toFixed(2);
        }

        if (this.results.dilutionFactor !== undefined) {
            const element = document.getElementById('dilutionFactorResult');
            if (element) element.textContent = this.results.dilutionFactor.toFixed(3);
        }

        if (this.results.actualDeliveredDose !== undefined) {
            const element = document.getElementById('actualDeliveredDoseResult');
            if (element) element.textContent = this.results.actualDeliveredDose.toFixed(2);
        }
    }

    // 계산 과정 표시
    displayCalculationSteps() {
        const stepsSection = document.getElementById('calculationStepsSection');
        const stepsContent = document.getElementById('calculationStepsContent');
        
        if (stepsSection && stepsContent) {
            stepsSection.style.display = 'block';
            stepsSection.classList.add('fade-in');
            
            let stepsHTML = '';
            
            Object.values(this.calculationSteps).forEach(step => {
                if (step.formula) {
                    stepsHTML += `
                        <div class="calculation-step">
                            <div class="step-formula">${step.formula}</div>
                            <div class="step-values">${step.values}</div>
                            <div class="step-result">결과: ${step.result} ${step.unit}</div>
                            ${step.note ? `<div class="step-note">${step.note}</div>` : ''}
                        </div>
                    `;
                }
            });
            
            stepsContent.innerHTML = stepsHTML;
        }
    }

    // 가이드 테이블 생성
    populateGuideTable() {
        const guideTable = document.getElementById('guideTable');
        if (!guideTable) return;

        const tbody = guideTable.querySelector('tbody');
        if (!tbody) return;

        // 가이드 데이터 (체중별 권장값)
        const guideData = [
            { weightRange: '40-49', weight: 44.5, bloodFlow: 120, pre: 600, post: 200, dialysate: 800 },
            { weightRange: '50-59', weight: 54.5, bloodFlow: 120, pre: 800, post: 200, dialysate: 1000 },
            { weightRange: '60-69', weight: 64.5, bloodFlow: 120, pre: 1000, post: 200, dialysate: 1200 },
            { weightRange: '70-79', weight: 74.5, bloodFlow: 140, pre: 1100, post: 300, dialysate: 1400 },
            { weightRange: '80-89', weight: 84.5, bloodFlow: 140, pre: 1300, post: 300, dialysate: 1600 },
            { weightRange: '90-99', weight: 94.5, bloodFlow: 160, pre: 1400, post: 400, dialysate: 1800 },
            { weightRange: '100이상', weight: 105, bloodFlow: 160, pre: 1600, post: 400, dialysate: 2000 }
        ];

        tbody.innerHTML = '';
        guideData.forEach((data, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${data.weightRange}</td>
                <td>${data.bloodFlow}</td>
                <td>${data.pre}</td>
                <td>${data.post}</td>
                <td>${data.dialysate}</td>
                <td>
                    <button class="select-btn" onclick="crrtCalculator.applyGuideData(${index})">
                        선택 (Select)
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // 가이드 데이터 적용
    applyGuideData(index) {
        const guideData = [
            { weight: 44.5, bloodFlow: 120, pre: 600, post: 200, dialysate: 800 },
            { weight: 54.5, bloodFlow: 120, pre: 800, post: 200, dialysate: 1000 },
            { weight: 64.5, bloodFlow: 120, pre: 1000, post: 200, dialysate: 1200 },
            { weight: 74.5, bloodFlow: 140, pre: 1100, post: 300, dialysate: 1400 },
            { weight: 84.5, bloodFlow: 140, pre: 1300, post: 300, dialysate: 1600 },
            { weight: 94.5, bloodFlow: 160, pre: 1400, post: 400, dialysate: 1800 },
            { weight: 105, bloodFlow: 160, pre: 1600, post: 400, dialysate: 2000 }
        ];

        const data = guideData[index];
        if (data) {
            this.setInputValue('weight', data.weight);
            this.setInputValue('bloodFlowRate', data.bloodFlow);
            this.setInputValue('preDilution', data.pre);
            this.setInputValue('postDilution', data.post);
            this.setInputValue('dialysate', data.dialysate);
            
            // 기본값 자동 설정
            this.setInputValue('hematocrit', 30);
            this.setInputValue('ultraFiltration', 50);
            this.setInputValue('prescribedTime', 24);
            this.setInputValue('actualRuntime', 20);

            // 가이드 모달 닫기
            const guideModal = bootstrap.Modal.getInstance(document.getElementById('guideModal'));
            if (guideModal) {
                guideModal.hide();
            }

            this.showAlert('가이드 데이터가 적용되었습니다.', 'success');
            
            // 자동 계산 실행
            setTimeout(() => this.calculate(), 500);
        }
    }

    // 데이터 저장
    saveData() {
        try {
            const data = {
                timestamp: new Date().toISOString(),
                inputs: {},
                results: this.results
            };

            // 입력값 저장
            Object.keys(this.inputFields).forEach(fieldId => {
                data.inputs[fieldId] = this.getInputValue(fieldId);
            });

            localStorage.setItem('crrt_calculator_data', JSON.stringify(data));
            this.showAlert('데이터가 저장되었습니다.', 'success');
        } catch (error) {
            console.error('데이터 저장 오류:', error);
            this.showAlert('데이터 저장에 실패했습니다.', 'error');
        }
    }

    // 저장된 데이터 로드
    loadSavedData() {
        try {
            const savedData = localStorage.getItem('crrt_calculator_data');
            if (savedData) {
                const data = JSON.parse(savedData);
                
                // 입력값 복원
                if (data.inputs) {
                    Object.keys(data.inputs).forEach(fieldId => {
                        this.setInputValue(fieldId, data.inputs[fieldId]);
                    });
                }

                // 결과 복원
                if (data.results) {
                    this.results = data.results;
                    this.displayResults();
                }

                this.showAlert('저장된 데이터를 불러왔습니다.', 'info');
            }
        } catch (error) {
            console.error('데이터 로드 오류:', error);
        }
    }

    // 모든 데이터 초기화
    clearAll() {
        if (confirm('모든 입력값과 결과를 초기화하시겠습니까?')) {
            Object.keys(this.inputFields).forEach(fieldId => {
                this.setInputValue(fieldId, '');
            });

            this.results = {};
            this.calculationSteps = {};

            // 결과 섹션 숨기기
            const resultsSection = document.getElementById('resultsSection');
            const stepsSection = document.getElementById('calculationStepsSection');
            
            if (resultsSection) resultsSection.style.display = 'none';
            if (stepsSection) stepsSection.style.display = 'none';

            // 로컬 스토리지 클리어
            localStorage.removeItem('crrt_calculator_data');

            this.showAlert('모든 데이터가 초기화되었습니다.', 'info');
        }
    }

    // 모달 표시 함수들
    showGuideModal() {
        const guideModal = new bootstrap.Modal(document.getElementById('guideModal'));
        guideModal.show();
    }

    showSettingsModal() {
        const settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'));
        settingsModal.show();
    }

    showLoadDataModal() {
        const loadDataModal = new bootstrap.Modal(document.getElementById('loadDataModal'));
        this.updateSavedDataContent();
        loadDataModal.show();
    }

    updateSavedDataContent() {
        const savedDataContent = document.getElementById('savedDataContent');
        if (!savedDataContent) return;

        try {
            const savedData = localStorage.getItem('crrt_calculator_data');
            if (savedData) {
                const data = JSON.parse(savedData);
                const timestamp = new Date(data.timestamp).toLocaleString('ko-KR');
                
                savedDataContent.innerHTML = `
                    <div class="alert alert-info">
                        <h6>저장된 데이터 (Saved Data)</h6>
                        <p class="mb-2"><strong>저장 시간:</strong> ${timestamp}</p>
                        <p class="mb-0">입력값과 계산 결과가 저장되어 있습니다.</p>
                    </div>
                `;
            } else {
                savedDataContent.innerHTML = `
                    <div class="alert alert-warning">
                        <h6>저장된 데이터 없음 (No Saved Data)</h6>
                        <p class="mb-0">저장된 데이터가 없습니다.</p>
                    </div>
                `;
            }
        } catch (error) {
            savedDataContent.innerHTML = `
                <div class="alert alert-danger">
                    <h6>오류 (Error)</h6>
                    <p class="mb-0">데이터를 불러오는 중 오류가 발생했습니다.</p>
                </div>
            `;
        }
    }

    showClearDataConfirm() {
        if (confirm('정말로 모든 저장된 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            localStorage.removeItem('crrt_calculator_data');
            this.showAlert('모든 저장된 데이터가 삭제되었습니다.', 'success');
        }
    }

    // 알림 표시
    showAlert(message, type = 'info') {
        // Bootstrap 알림 또는 간단한 alert 사용
        if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
            // Bootstrap Toast 사용
            this.showBootstrapToast(message, type);
        } else {
            // 기본 alert 사용
            alert(message);
        }
    }

    showBootstrapToast(message, type) {
        // 간단한 토스트 알림 구현
        const toastContainer = document.getElementById('toastContainer') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        // 자동 제거
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        return container;
    }
}

// 앱 초기화
let crrtCalculator;

document.addEventListener('DOMContentLoaded', function() {
    crrtCalculator = new CRRTCalculator();
    
    // 자동 저장 설정 로드
    const autoSaveSwitch = document.getElementById('autoSaveSwitch');
    if (autoSaveSwitch) {
        const savedAutoSave = localStorage.getItem('crrt_auto_save');
        autoSaveSwitch.checked = savedAutoSave !== 'false';
        
        autoSaveSwitch.addEventListener('change', function() {
            crrtCalculator.isAutoSaveEnabled = this.checked;
            localStorage.setItem('crrt_auto_save', this.checked);
        });
    }
    
    // 데이터 로드 버튼 이벤트
    const loadDataBtn = document.getElementById('loadDataBtn');
    if (loadDataBtn) {
        loadDataBtn.addEventListener('click', function() {
            crrtCalculator.loadSavedData();
            const loadDataModal = bootstrap.Modal.getInstance(document.getElementById('loadDataModal'));
            if (loadDataModal) {
                loadDataModal.hide();
            }
        });
    }
});

// 전역 함수로 노출 (HTML에서 직접 호출하기 위해)
window.crrtCalculator = crrtCalculator;
