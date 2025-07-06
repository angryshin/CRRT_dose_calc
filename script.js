// CRRT 계산기 JavaScript

// 데이터 모델
class CRRTData {
    constructor() {
        this.patientData = {
            weight: 0,
            hematocrit: 0
        };
        this.prescriptionData = {
            bloodFlowRate: 0,
            preDilution: 0,
            postDilution: 0,
            dialysate: 0,
            ultraFiltration: 0,
            actualRuntime: 0,
            prescribedTime: 0
        };
        this.results = {
            plasmaFlow: 0,
            effluentDose: 0,
            filtrationFraction: 0,
            dilutionFactor: 0,
            actualDeliveredDose: 0
        };
        this.calculationSteps = {
            plasmaFlow: { formula: '', values: '', result: 0, unit: '', note: null },
            effluentDose: { formula: '', values: '', result: 0, unit: '', note: null },
            filtrationFraction: { formula: '', values: '', result: 0, unit: '', note: null },
            dilutionFactor: { formula: '', values: '', result: 0, unit: '', note: null },
            actualDeliveredDose: { formula: '', values: '', result: 0, unit: '', note: null }
        };
        this.warnings = [];
    }
}

// 전역 변수
let crrtData = new CRRTData();

// 입력 필드 ID 목록
const inputFields = [
    'weight', 'hematocrit', 'bloodFlowRate', 'preDilution', 
    'postDilution', 'dialysate', 'ultraFiltration', 'actualRuntime', 'prescribedTime'
];

// 유효성 검사 규칙
const validationRules = {
    weight: { min: 0.1, max: 500, errorMessage: '체중은 0.1~500kg 범위여야 합니다' },
    hematocrit: { min: 0, max: 100, errorMessage: '헤마토크릿은 0~100% 범위여야 합니다' },
    bloodFlowRate: { min: 1, max: 500, errorMessage: '혈류량은 1~500 mL/min 범위여야 합니다' },
    preDilution: { min: 0, max: 5000, errorMessage: 'Pre-dilution은 0~5000 mL/hr 범위여야 합니다' },
    postDilution: { min: 0, max: 5000, errorMessage: 'Post-dilution은 0~5000 mL/hr 범위여야 합니다' },
    dialysate: { min: 0, max: 5000, errorMessage: 'Dialysate는 0~5000 mL/hr 범위여야 합니다' },
    ultraFiltration: { min: 0, max: 2000, errorMessage: 'UF는 0~2000 mL/hr 범위여야 합니다' },
    actualRuntime: { min: 0, max: 168, errorMessage: '실제 가동시간은 0~168hr 범위여야 합니다' },
    prescribedTime: { min: 1, max: 168, errorMessage: '처방 시간은 1~168hr 범위여야 합니다' }
};

// 유틸리티 함수
function isFiniteNumber(value) {
    return !isNaN(value) && isFinite(value);
}

function formatNumber(value, decimals = 1) {
    if (!isFiniteNumber(value)) return '0';
    return value.toFixed(decimals);
}

// 입력 검증
function validateInput(fieldId, value) {
    const rule = validationRules[fieldId];
    if (!rule) return true;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return true; // 빈 값은 허용
    
    return numValue >= rule.min && numValue <= rule.max;
}

function showError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    const inputElement = document.getElementById(fieldId);
    
    if (errorElement) {
        errorElement.textContent = message;
    }
    if (inputElement) {
        inputElement.classList.add('error');
    }
}

function clearError(fieldId) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    const inputElement = document.getElementById(fieldId);
    
    if (errorElement) {
        errorElement.textContent = '';
    }
    if (inputElement) {
        inputElement.classList.remove('error');
    }
}

// 계산 함수들
function calculatePlasmaFlow() {
    const bloodFlowRate = crrtData.prescriptionData.bloodFlowRate;
    const hematocrit = crrtData.patientData.hematocrit;
    
    const result = bloodFlowRate * 60 * (1 - hematocrit / 100);
    
    crrtData.calculationSteps.plasmaFlow = {
        formula: '혈장 유량 = 혈류량 × 60 × (1 - 헤마토크릿/100)',
        values: `혈장 유량 = ${bloodFlowRate} × 60 × (1 - ${hematocrit}/100)`,
        result: isFiniteNumber(result) ? result : 0,
        unit: 'mL/hr',
        note: null
    };
    
    return isFiniteNumber(result) ? result : 0;
}

function calculateEffluentDose() {
    const weight = crrtData.patientData.weight;
    const preDilution = crrtData.prescriptionData.preDilution;
    const postDilution = crrtData.prescriptionData.postDilution;
    const dialysate = crrtData.prescriptionData.dialysate;
    const ultraFiltration = crrtData.prescriptionData.ultraFiltration;
    
    if (weight <= 0) {
        crrtData.calculationSteps.effluentDose = {
            formula: '처방 용량 = (Pre-dilution + Post-dilution + Dialysate + UF) / 체중',
            values: `처방 용량 = (${preDilution} + ${postDilution} + ${dialysate} + ${ultraFiltration}) / ${weight}`,
            result: 0,
            unit: 'mL/kg/hr',
            note: '체중이 0 이하입니다'
        };
        return 0;
    }
    
    const totalEffluent = preDilution + postDilution + dialysate + ultraFiltration;
    const result = totalEffluent / weight;
    
    crrtData.calculationSteps.effluentDose = {
        formula: '처방 용량 = (Pre-dilution + Post-dilution + Dialysate + UF) / 체중',
        values: `처방 용량 = (${preDilution} + ${postDilution} + ${dialysate} + ${ultraFiltration}) / ${weight}`,
        result: isFiniteNumber(result) ? result : 0,
        unit: 'mL/kg/hr',
        note: null
    };
    
    return isFiniteNumber(result) ? result : 0;
}

function calculateFiltrationFraction() {
    const plasmaFlow = calculatePlasmaFlow();
    const preDilution = crrtData.prescriptionData.preDilution;
    const postDilution = crrtData.prescriptionData.postDilution;
    const ultraFiltration = crrtData.prescriptionData.ultraFiltration;
    
    const convectiveFlow = preDilution + postDilution + ultraFiltration;
    const denominator = plasmaFlow + preDilution;
    
    if (denominator <= 0) {
        crrtData.calculationSteps.filtrationFraction = {
            formula: '여과분율 = (Pre-dilution + Post-dilution + UF) / (Plasma flow + Pre-dilution)',
            values: `여과분율 = (${preDilution} + ${postDilution} + ${ultraFiltration}) / (${plasmaFlow} + ${preDilution})`,
            result: 0,
            unit: '%',
            note: '분모가 0 이하입니다'
        };
        return 0;
    }
    
    const result = (convectiveFlow / denominator) * 100;
    
    crrtData.calculationSteps.filtrationFraction = {
        formula: '여과분율 = (Pre-dilution + Post-dilution + UF) / (Plasma flow + Pre-dilution)',
        values: `여과분율 = (${preDilution} + ${postDilution} + ${ultraFiltration}) / (${plasmaFlow} + ${preDilution})`,
        result: isFiniteNumber(result) ? result : 0,
        unit: '%',
        note: null
    };
    
    return isFiniteNumber(result) ? result : 0;
}

function calculateDilutionFactor() {
    const plasmaFlow = calculatePlasmaFlow();
    const preDilution = crrtData.prescriptionData.preDilution;
    
    const denominator = plasmaFlow + preDilution;
    
    if (denominator <= 0) {
        crrtData.calculationSteps.dilutionFactor = {
            formula: '희석인자 = Plasma Flow / (Plasma Flow + Pre-dilution)',
            values: `희석인자 = ${plasmaFlow} / (${plasmaFlow} + ${preDilution})`,
            result: 0,
            unit: '',
            note: '분모가 0 이하입니다'
        };
        return 0;
    }
    
    const result = plasmaFlow / denominator;
    
    crrtData.calculationSteps.dilutionFactor = {
        formula: '희석인자 = Plasma Flow / (Plasma Flow + Pre-dilution)',
        values: `희석인자 = ${plasmaFlow} / (${plasmaFlow} + ${preDilution})`,
        result: isFiniteNumber(result) ? result : 0,
        unit: '',
        note: null
    };
    
    return isFiniteNumber(result) ? result : 0;
}

function calculateActualDeliveredDose() {
    const prescribedTime = crrtData.prescriptionData.prescribedTime;
    const effluentDose = calculateEffluentDose();
    const actualRuntime = crrtData.prescriptionData.actualRuntime;
    
    if (prescribedTime <= 0) {
        crrtData.calculationSteps.actualDeliveredDose = {
            formula: '실제 전달 용량 = 처방 용량 × (실제 가동시간 / 처방 시간)',
            values: `실제 전달 용량 = ${effluentDose} × (${actualRuntime} / ${prescribedTime})`,
            result: 0,
            unit: 'mL/kg/hr',
            note: '처방 시간이 0 이하입니다'
        };
        return 0;
    }
    
    const result = effluentDose * (actualRuntime / prescribedTime);
    
    crrtData.calculationSteps.actualDeliveredDose = {
        formula: '실제 전달 용량 = 처방 용량 × (실제 가동시간 / 처방 시간)',
        values: `실제 전달 용량 = ${effluentDose} × (${actualRuntime} / ${prescribedTime})`,
        result: isFiniteNumber(result) ? result : 0,
        unit: 'mL/kg/hr',
        note: null
    };
    
    return isFiniteNumber(result) ? result : 0;
}

// 경고 검사
function checkWarnings() {
    const warnings = [];
    
    // 기본 입력 검증
    if (crrtData.patientData.weight <= 0) {
        warnings.push({
            type: 'error',
            message: '체중은 0보다 커야 합니다',
            solution: '유효한 체중을 입력하세요'
        });
        crrtData.warnings = warnings;
        return;
    }
    
    if (crrtData.prescriptionData.prescribedTime <= 0) {
        warnings.push({
            type: 'error',
            message: '처방 시간은 0보다 커야 합니다',
            solution: '유효한 처방 시간을 입력하세요'
        });
        crrtData.warnings = warnings;
        return;
    }
    
    const effluentDose = calculateEffluentDose();
    const filtrationFraction = calculateFiltrationFraction();
    const actualDose = calculateActualDeliveredDose();
    const dilutionFactor = calculateDilutionFactor();
    
    if (effluentDose < 20) {
        warnings.push({
            type: 'warning',
            message: `처방 용량이 권장 범위(20-25 mL/kg/hr)보다 낮습니다: ${formatNumber(effluentDose)} mL/kg/hr`
        });
    }
    
    // 처방용량이 권장 범위를 초과하는 경우, 가이드라인에 따라 10~20% 높게 설정된 경우는 허용
    if (effluentDose > 25) {
        // 가이드라인에 따라 처방 시 10~20% 높게 설정하는 것을 고려하여 30 mL/kg/hr까지는 허용
        if (effluentDose > 30) {
            warnings.push({
                type: 'warning',
                message: `처방 용량이 가이드라인 권장 범위를 초과합니다: ${formatNumber(effluentDose)} mL/kg/hr`,
                solution: '처방 용량을 25-30 mL/kg/hr 범위로 조정하는 것을 고려하세요'
            });
        }
        // 25-30 mL/kg/hr 범위는 가이드라인에 따라 허용되므로 알림 표시하지 않음
    }
    
    if (filtrationFraction > 25) {
        warnings.push({
            type: 'error',
            message: `여과분율이 권장 한계(25%)를 초과합니다: ${formatNumber(filtrationFraction)}%`
        });
    }
    
    if (actualDose < 20) {
        warnings.push({
            type: 'warning',
            message: `실제 전달 용량이 부족합니다: ${formatNumber(actualDose)} mL/kg/hr`
        });
    }
    
    if (crrtData.prescriptionData.bloodFlowRate < 100) {
        warnings.push({
            type: 'warning',
            message: '혈류량이 낮을 수 있습니다 (< 100 mL/min)'
        });
    }
    
    // 희석인자 관련 경고
    if (dilutionFactor < 0.7) {
        warnings.push({
            type: 'error',
            message: `희석인자가 너무 낮습니다 (${formatNumber(dilutionFactor, 3)}): 청소 효율 저하 우려`,
            solution: 'Pre-dilution 감소 또는 혈류량 증가를 고려하세요'
        });
    } else if (dilutionFactor < 0.75) {
        warnings.push({
            type: 'warning',
            message: `희석인자가 다소 낮습니다 (${formatNumber(dilutionFactor, 3)}): 청소 효율 감소 가능성`,
            solution: 'Pre-dilution 감소 또는 혈류량 증가를 검토하세요'
        });
    } else if (dilutionFactor > 0.9) {
        warnings.push({
            type: 'warning',
            message: `희석인자가 너무 높습니다 (${formatNumber(dilutionFactor, 3)}): 필터 막힘 위험 증가`,
            solution: 'Pre-dilution 증가 또는 혈류량 감소를 고려하세요'
        });
    }
    
    crrtData.warnings = warnings;
}

// 계산 업데이트
function updateCalculations() {
    crrtData.results = {
        plasmaFlow: calculatePlasmaFlow(),
        effluentDose: calculateEffluentDose(),
        filtrationFraction: calculateFiltrationFraction(),
        dilutionFactor: calculateDilutionFactor(),
        actualDeliveredDose: calculateActualDeliveredDose()
    };
    checkWarnings();
    updateUI();
}

// UI 업데이트
function updateUI() {
    // 결과 업데이트
    document.getElementById('plasmaFlow').textContent = `${Math.round(crrtData.results.plasmaFlow)} mL/hr`;
    document.getElementById('effluentDose').textContent = `${formatNumber(crrtData.results.effluentDose)} mL/kg/hr`;
    document.getElementById('filtrationFraction').textContent = `${formatNumber(crrtData.results.filtrationFraction)}%`;
    document.getElementById('dilutionFactor').textContent = formatNumber(crrtData.results.dilutionFactor, 3);
    document.getElementById('actualDeliveredDose').textContent = `${formatNumber(crrtData.results.actualDeliveredDose)} mL/kg/hr`;
    
    // 경고 업데이트
    updateWarnings();
    
    // 계산 과정 업데이트
    updateCalculationSteps();
}

function updateWarnings() {
    const warningsCard = document.getElementById('warningsCard');
    const warningsContainer = document.getElementById('warningsContainer');
    
    if (crrtData.warnings.length === 0) {
        warningsCard.style.display = 'none';
        return;
    }
    
    warningsCard.style.display = 'block';
    warningsContainer.innerHTML = '';
    
    crrtData.warnings.forEach(warning => {
        const warningElement = document.createElement('div');
        warningElement.className = `warning-item ${warning.type}`;
        
        const iconElement = document.createElement('span');
        iconElement.className = 'material-icons warning-icon';
        iconElement.textContent = 'warning';
        
        const contentElement = document.createElement('div');
        contentElement.className = 'warning-content';
        
        const titleElement = document.createElement('h4');
        titleElement.textContent = warning.message;
        
        contentElement.appendChild(titleElement);
        
        if (warning.solution) {
            const solutionElement = document.createElement('p');
            solutionElement.textContent = `해결방안: ${warning.solution}`;
            contentElement.appendChild(solutionElement);
        }
        
        warningElement.appendChild(iconElement);
        warningElement.appendChild(contentElement);
        warningsContainer.appendChild(warningElement);
    });
}

function updateCalculationSteps() {
    const container = document.getElementById('calculationStepsContainer');
    container.innerHTML = '';
    
    const steps = [
        { title: '혈장 유량 (Plasma flow rate)', step: crrtData.calculationSteps.plasmaFlow },
        { title: '처방 용량 (Effluent dose)', step: crrtData.calculationSteps.effluentDose },
        { title: '여과분율 (Filtration fraction)', step: crrtData.calculationSteps.filtrationFraction },
        { title: '희석인자 (Dilution factor)', step: crrtData.calculationSteps.dilutionFactor },
        { title: '실제 전달 용량 (Delivered dose)', step: crrtData.calculationSteps.actualDeliveredDose }
    ];
    
    steps.forEach(({ title, step }) => {
        const stepElement = document.createElement('div');
        stepElement.className = 'calculation-step';
        
        stepElement.innerHTML = `
            <h4>${title}</h4>
            <p>공식: ${step.formula}</p>
            <div class="values">계산: ${step.values}</div>
            <div class="result">
                <span>결과:</span>
                <span class="result-value">${formatNumber(step.result, 3)} ${step.unit}</span>
            </div>
            ${step.note ? `<div class="note">참고: ${step.note}</div>` : ''}
        `;
        
        container.appendChild(stepElement);
    });
}

// 입력 핸들러
function handleInput(fieldId) {
    const inputElement = document.getElementById(fieldId);
    const value = inputElement.value;
    
    // 유효성 검사
    if (value === '') {
        clearError(fieldId);
        updateDataFromInputs();
        return;
    }
    
    const isValid = validateInput(fieldId, value);
    if (!isValid) {
        showError(fieldId, validationRules[fieldId].errorMessage);
    } else {
        clearError(fieldId);
    }
    
    updateDataFromInputs();
}

function updateDataFromInputs() {
    // 환자 데이터 업데이트
    crrtData.patientData.weight = parseFloat(document.getElementById('weight').value) || 0;
    crrtData.patientData.hematocrit = parseFloat(document.getElementById('hematocrit').value) || 0;
    
    // 처방 데이터 업데이트
    crrtData.prescriptionData.bloodFlowRate = parseFloat(document.getElementById('bloodFlowRate').value) || 0;
    crrtData.prescriptionData.preDilution = parseFloat(document.getElementById('preDilution').value) || 0;
    crrtData.prescriptionData.postDilution = parseFloat(document.getElementById('postDilution').value) || 0;
    crrtData.prescriptionData.dialysate = parseFloat(document.getElementById('dialysate').value) || 0;
    crrtData.prescriptionData.ultraFiltration = parseFloat(document.getElementById('ultraFiltration').value) || 0;
    crrtData.prescriptionData.actualRuntime = parseFloat(document.getElementById('actualRuntime').value) || 0;
    crrtData.prescriptionData.prescribedTime = parseFloat(document.getElementById('prescribedTime').value) || 0;
    
    updateCalculations();
}

// 지우기 기능
function clearAllData() {
    showConfirmDialog(
        '전체 데이터 지우기',
        '모든 입력 데이터와 계산 결과가 지워집니다.\n정말 지우시겠습니까?',
        '지우기',
        () => {
            inputFields.forEach(fieldId => {
                document.getElementById(fieldId).value = '';
                clearError(fieldId);
            });
            crrtData = new CRRTData();
            updateUI();
            showToast('모든 데이터가 지워졌습니다');
        }
    );
}

function clearPatientData() {
    showConfirmDialog(
        '환자 정보 지우기',
        '환자 정보(체중, 헤마토크릿)가 지워집니다.\n정말 지우시겠습니까?',
        '지우기',
        () => {
            document.getElementById('weight').value = '';
            document.getElementById('hematocrit').value = '';
            clearError('weight');
            clearError('hematocrit');
            crrtData.patientData = { weight: 0, hematocrit: 0 };
            updateCalculations();
            showToast('환자 정보가 지워졌습니다');
        }
    );
}

function clearPrescriptionData() {
    showConfirmDialog(
        '처방 정보 지우기',
        '처방 파라미터가 모두 지워집니다.\n정말 지우시겠습니까?',
        '지우기',
        () => {
            ['bloodFlowRate', 'preDilution', 'postDilution', 'dialysate', 'ultraFiltration', 'actualRuntime', 'prescribedTime'].forEach(fieldId => {
                document.getElementById(fieldId).value = '';
                clearError(fieldId);
            });
            crrtData.prescriptionData = {
                bloodFlowRate: 0, preDilution: 0, postDilution: 0,
                dialysate: 0, ultraFiltration: 0, actualRuntime: 0, prescribedTime: 0
            };
            updateCalculations();
            showToast('처방 정보가 지워졌습니다');
        }
    );
}

// 복사 기능
function copyPrescription() {
    const prescriptionText = getPrescriptionText();
    navigator.clipboard.writeText(prescriptionText).then(() => {
        showToast('처방 값이 클립보드에 복사되었습니다');
    }).catch(() => {
        // 폴백: 텍스트 영역 사용
        const textArea = document.createElement('textarea');
        textArea.value = prescriptionText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('처방 값이 클립보드에 복사되었습니다');
    });
}

function getPrescriptionText() {
    const fields = [
        { id: 'bloodFlowRate', label: '혈류량' },
        { id: 'preDilution', label: '전희석' },
        { id: 'postDilution', label: '후희석' },
        { id: 'dialysate', label: '투석액' },
        { id: 'ultraFiltration', label: '순수 수분 제거' },
        { id: 'prescribedTime', label: '처방 시간' },
        { id: 'actualRuntime', label: '실제 가동시간' },
        { id: 'weight', label: '체중' },
        { id: 'hematocrit', label: '헤마토크릿' }
    ];
    
    const units = {
        bloodFlowRate: ' mL/min',
        preDilution: ' mL/hr',
        postDilution: ' mL/hr',
        dialysate: ' mL/hr',
        ultraFiltration: ' mL/hr',
        prescribedTime: ' hr',
        actualRuntime: ' hr',
        weight: ' kg',
        hematocrit: '%'
    };
    
    return fields.map(field => {
        const value = document.getElementById(field.id).value || '';
        return `${field.label}: ${value}${units[field.id]}`;
    }).join(', ');
}

// 다이얼로그 기능
function showConfirmDialog(title, message, confirmText, onConfirm) {
    document.getElementById('dialogTitle').textContent = title;
    document.getElementById('dialogMessage').textContent = message;
    document.getElementById('confirmBtn').textContent = confirmText;
    document.getElementById('confirmBtn').onclick = () => {
        closeDialog();
        onConfirm();
    };
    document.getElementById('confirmDialog').style.display = 'flex';
}

function closeDialog() {
    document.getElementById('confirmDialog').style.display = 'none';
}

// 토스트 메시지
function showToast(message) {
    // 간단한 토스트 구현
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #333;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 3000);
}

// 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', function() {
    // 입력 필드에 이벤트 리스너 추가
    inputFields.forEach(fieldId => {
        const inputElement = document.getElementById(fieldId);
        if (inputElement) {
            inputElement.addEventListener('input', () => handleInput(fieldId));
            inputElement.addEventListener('blur', () => handleInput(fieldId));
        }
    });
    
    // 모달 외부 클릭 시 닫기
    document.getElementById('confirmDialog').addEventListener('click', function(e) {
        if (e.target === this) {
            closeDialog();
        }
    });
    
    // 초기 UI 업데이트
    updateUI();
}); 