// Data structure and initial setup
const defaultSubjects = [
    { "id": 1, "nome": "Cardiologia", "especialidade": "Clínica", "assuntos": ["Arritmias", "Insuficiência Cardíaca", "Coronariopatias", "Hipertensão", "Valvopatias"], "custom": false },
    { "id": 2, "nome": "Pneumologia", "especialidade": "Clínica", "assuntos": ["Asma", "DPOC", "Pneumonias", "Derrame Pleural", "Embolia Pulmonar"], "custom": false },
    { "id": 3, "nome": "Gastroenterologia", "especialidade": "Clínica", "assuntos": ["DRGE", "Úlcera Péptica", "Hepatites", "Cirrose", "Pancreatite"], "custom": false },
    { "id": 4, "nome": "Neurologia", "especialidade": "Clínica", "assuntos": ["AVC", "Epilepsia", "Cefaléias", "Demências", "Parkinson"], "custom": false },
    { "id": 5, "nome": "Endocrinologia", "especialidade": "Clínica", "assuntos": ["Diabetes", "Tireoidopatias", "Obesidade", "Osteoporose", "Adrenal"], "custom": false },
    { "id": 6, "nome": "Ortopedia", "especialidade": "Cirúrgica", "assuntos": ["Fraturas", "Artrose", "Meniscopatias", "Luxações", "Tendinites"], "custom": false },
    { "id": 7, "nome": "Cirurgia Geral", "especialidade": "Cirúrgica", "assuntos": ["Apendicite", "Hérnias", "Vesícula", "Trauma", "Abdome Agudo"], "custom": false },
    { "id": 8, "nome": "Ginecologia", "especialidade": "Cirúrgica", "assuntos": ["Miomas", "Cistos", "Endometriose", "Câncer Ginecológico", "Gravidez"], "custom": false },
    { "id": 9, "nome": "Urologia", "especialidade": "Cirúrgica", "assuntos": ["Cálculos", "ITU", "Câncer Urológico", "Disfunções", "Próstata"], "custom": false },
    { "id": 10, "nome": "Pediatria", "especialidade": "Clínica", "assuntos": ["Crescimento", "Vacinação", "Infecções", "Alergias", "Desenvolvimento"], "custom": false }
];

// Storage utilities
class Storage {
    static getStudies() {
        const studies = localStorage.getItem('enare_studies');
        return studies ? JSON.parse(studies) : [];
    }

    static saveStudies(studies) {
        localStorage.setItem('enare_studies', JSON.stringify(studies));
    }

    static addStudy(study) {
        const studies = this.getStudies();
        studies.push(study);
        this.saveStudies(studies);
    }

    static getCustomSubjects() {
        const customSubjects = localStorage.getItem('enare_custom_subjects');
        return customSubjects ? JSON.parse(customSubjects) : [];
    }

    static saveCustomSubjects(subjects) {
        localStorage.setItem('enare_custom_subjects', JSON.stringify(subjects));
    }

    static addCustomSubject(subject) {
        const customSubjects = this.getCustomSubjects();
        const newId = Math.max(...defaultSubjects.map(s => s.id), ...customSubjects.map(s => s.id), 0) + 1;
        const newSubject = { ...subject, id: newId, custom: true };
        customSubjects.push(newSubject);
        this.saveCustomSubjects(customSubjects);
        return newSubject;
    }

    static deleteCustomSubject(id) {
        const customSubjects = this.getCustomSubjects();
        const filtered = customSubjects.filter(s => s.id !== id);
        this.saveCustomSubjects(filtered);
    }
}

// Get all subjects (default + custom)
function getAllSubjects() {
    return [...defaultSubjects, ...Storage.getCustomSubjects()];
}

// App state
let currentTab = 'inicio';
let performanceChart = null;
let evolutionChart = null;

// DOM elements
const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
const studyForm = document.getElementById('studyForm');

// Navigation system
function initNavigation() {
    bottomNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = e.currentTarget.getAttribute('data-tab');
            if (tab) {
                switchTab(tab);
            }
        });
    });
}

function switchTab(tabName) {
    // Update navigation
    bottomNavItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-tab') === tabName) {
            item.classList.add('active');
        }
    });

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');

    currentTab = tabName;

    // Load tab-specific content
    switch (tabName) {
        case 'inicio':
            updateDashboard();
            break;
        case 'estudar':
            initStudyForm();
            break;
        case 'cronograma':
            updateSchedule();
            break;
        case 'historico':
            updateHistory();
            break;
        case 'configuracoes':
            initSettings();
            break;
    }
}

// Study form functionality
function initStudyForm() {
    const subjectSelect = document.getElementById('subject');
    const topicSelect = document.getElementById('topic');
    const customTopicGroup = document.getElementById('customTopicGroup');
    const dateInput = document.getElementById('date');
    const subjects = getAllSubjects();

    if (!subjectSelect) return;

    // Clear and populate subjects
    subjectSelect.innerHTML = '<option value="">Selecione uma disciplina</option>';
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.id;
        option.textContent = `${subject.nome} (${subject.especialidade})`;
        subjectSelect.appendChild(option);
    });

    // Reset topic select
    if (topicSelect) {
        topicSelect.innerHTML = '<option value="">Selecione primeiro uma disciplina</option>';
    }

    // Set today's date as default
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    // Remove existing event listeners to prevent duplicates
    const newSubjectSelect = subjectSelect.cloneNode(true);
    subjectSelect.parentNode.replaceChild(newSubjectSelect, subjectSelect);

    const newTopicSelect = document.getElementById('topic');
    const newTopicClone = newTopicSelect.cloneNode(true);
    newTopicSelect.parentNode.replaceChild(newTopicClone, newTopicSelect);

    // Add event listeners
    document.getElementById('subject').addEventListener('change', handleSubjectChange);
    document.getElementById('topic').addEventListener('change', handleTopicChange);

    // Remove existing form listener and add new one
    const newForm = studyForm.cloneNode(true);
    studyForm.parentNode.replaceChild(newForm, studyForm);
    document.getElementById('studyForm').addEventListener('submit', handleStudySubmit);
}

function handleSubjectChange(e) {
    const subjectId = parseInt(e.target.value);
    const subjects = getAllSubjects();
    const subject = subjects.find(s => s.id === subjectId);
    const topicSelect = document.getElementById('topic');
    
    topicSelect.innerHTML = '<option value="">Selecione um assunto</option>';
    
    if (subject) {
        subject.assuntos.forEach(assunto => {
            const option = document.createElement('option');
            option.value = assunto;
            option.textContent = assunto;
            topicSelect.appendChild(option);
        });
        
        // Add "Outros" option as requested
        const otherOption = document.createElement('option');
        otherOption.value = 'outros';
        otherOption.textContent = 'Outros (especificar)';
        topicSelect.appendChild(otherOption);
    }
}

function handleTopicChange(e) {
    const customTopicGroup = document.getElementById('customTopicGroup');
    const customTopicInput = document.getElementById('customTopic');
    
    if (e.target.value === 'outros') {
        customTopicGroup.style.display = 'block';
        customTopicInput.required = true;
    } else {
        customTopicGroup.style.display = 'none';
        customTopicInput.required = false;
        customTopicInput.value = '';
    }
}

function handleStudySubmit(e) {
    e.preventDefault();
    
    const subjectId = parseInt(document.getElementById('subject').value);
    const correct = parseInt(document.getElementById('correct').value);
    const total = parseInt(document.getElementById('total').value);
    const topicValue = document.getElementById('topic').value;
    const customTopic = document.getElementById('customTopic').value;
    const date = document.getElementById('date').value;
    const observations = document.getElementById('observations').value.trim();

    // Validation
    if (!subjectId) {
        showToast('Por favor, selecione uma disciplina', 'error');
        return;
    }

    if (!topicValue) {
        showToast('Por favor, selecione um assunto', 'error');
        return;
    }

    if (topicValue === 'outros' && !customTopic.trim()) {
        showToast('Por favor, especifique o assunto personalizado', 'error');
        return;
    }

    if (isNaN(correct) || isNaN(total) || correct < 0 || total < 1) {
        showToast('Por favor, preencha valores válidos para as questões', 'error');
        return;
    }

    if (correct > total) {
        showToast('Questões certas não podem ser maior que o total', 'error');
        return;
    }

    if (!date) {
        showToast('Por favor, selecione uma data', 'error');
        return;
    }

    const subjects = getAllSubjects();
    const subject = subjects.find(s => s.id === subjectId);
    const topic = topicValue === 'outros' ? customTopic.trim() : topicValue;
    const percentage = Math.round((correct / total) * 100);
    const performance = getPerformance(percentage);

    const study = {
        id: Date.now(),
        subjectId,
        subjectName: subject.nome,
        topic,
        correct,
        total,
        percentage,
        date,
        performance,
        observations,
        nextReview: calculateNextReview(date, performance)
    };

    Storage.addStudy(study);
    showToast('Estudo registrado com sucesso!', 'success');
    
    // Reset form
    document.getElementById('studyForm').reset();
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
    document.getElementById('customTopicGroup').style.display = 'none';
    document.getElementById('topic').innerHTML = '<option value="">Selecione primeiro uma disciplina</option>';
}

function getPerformance(percentage) {
    if (percentage >= 90) return 'excelente';
    if (percentage >= 75) return 'bom';
    if (percentage >= 60) return 'regular';
    return 'fraco';
}

function calculateNextReview(date, performance) {
    const reviewDate = new Date(date);
    const daysToAdd = {
        'excelente': 14,
        'bom': 7,
        'regular': 3,
        'fraco': 1
    };
    
    reviewDate.setDate(reviewDate.getDate() + daysToAdd[performance]);
    return reviewDate.toISOString().split('T')[0];
}

// Dashboard functionality
function updateDashboard() {
    const studies = Storage.getStudies();
    
    // Update stats
    updateStats(studies);
    
    // Update charts
    updateCharts(studies);
}

function updateStats(studies) {
    const totalStudies = studies.length;
    const totalQuestions = studies.reduce((sum, study) => sum + study.total, 0);
    const totalCorrect = studies.reduce((sum, study) => sum + study.correct, 0);
    const averageScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    
    // Find best subject
    const subjectScores = {};
    studies.forEach(study => {
        if (!subjectScores[study.subjectName]) {
            subjectScores[study.subjectName] = { correct: 0, total: 0 };
        }
        subjectScores[study.subjectName].correct += study.correct;
        subjectScores[study.subjectName].total += study.total;
    });
    
    let bestSubject = '-';
    let bestScore = 0;
    Object.keys(subjectScores).forEach(subject => {
        const score = (subjectScores[subject].correct / subjectScores[subject].total) * 100;
        if (score > bestScore) {
            bestScore = score;
            bestSubject = subject;
        }
    });

    document.getElementById('totalStudies').textContent = totalStudies;
    document.getElementById('averageScore').textContent = `${averageScore}%`;
    document.getElementById('bestSubject').textContent = bestSubject;
    document.getElementById('totalQuestions').textContent = totalQuestions;
}

function updateCharts(studies) {
    updatePerformanceChart(studies);
    updateEvolutionChart(studies);
}

function updatePerformanceChart(studies) {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    
    if (performanceChart) {
        performanceChart.destroy();
    }

    const subjectData = {};
    studies.forEach(study => {
        if (!subjectData[study.subjectName]) {
            subjectData[study.subjectName] = { correct: 0, total: 0 };
        }
        subjectData[study.subjectName].correct += study.correct;
        subjectData[study.subjectName].total += study.total;
    });

    const labels = Object.keys(subjectData);
    const data = labels.map(subject => {
        return Math.round((subjectData[subject].correct / subjectData[subject].total) * 100);
    });

    performanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Aproveitamento (%)',
                data,
                backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function updateEvolutionChart(studies) {
    const ctx = document.getElementById('evolutionChart').getContext('2d');
    
    if (evolutionChart) {
        evolutionChart.destroy();
    }

    const sortedStudies = [...studies].sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = sortedStudies.map(study => formatDate(study.date));
    const data = sortedStudies.map(study => study.percentage);

    evolutionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Aproveitamento (%)',
                data,
                borderColor: '#1FB8CD',
                backgroundColor: 'rgba(31, 184, 205, 0.1)',
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// History functionality
function updateHistory() {
    initHistoryFilters();
    renderHistory();
}

function initHistoryFilters() {
    const studies = Storage.getStudies();
    const filterSubject = document.getElementById('filterSubject');
    const filterTopic = document.getElementById('filterTopic');

    // Populate subject filter
    const subjects = [...new Set(studies.map(s => s.subjectName))];
    filterSubject.innerHTML = '<option value="">Todas as disciplinas</option>';
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        filterSubject.appendChild(option);
    });

    // Populate topic filter
    const topics = [...new Set(studies.map(s => s.topic))];
    filterTopic.innerHTML = '<option value="">Todos os assuntos</option>';
    topics.forEach(topic => {
        const option = document.createElement('option');
        option.value = topic;
        option.textContent = topic;
        filterTopic.appendChild(option);
    });

    // Add event listeners
    filterSubject.addEventListener('change', renderHistory);
    filterTopic.addEventListener('change', renderHistory);
    document.getElementById('clearFilters').addEventListener('click', () => {
        filterSubject.value = '';
        filterTopic.value = '';
        renderHistory();
    });
}

function renderHistory() {
    const studies = Storage.getStudies();
    const filterSubject = document.getElementById('filterSubject').value;
    const filterTopic = document.getElementById('filterTopic').value;

    let filteredStudies = studies;

    if (filterSubject) {
        filteredStudies = filteredStudies.filter(s => s.subjectName === filterSubject);
    }

    if (filterTopic) {
        filteredStudies = filteredStudies.filter(s => s.topic === filterTopic);
    }

    // Sort by date (newest first)
    filteredStudies.sort((a, b) => new Date(b.date) - new Date(a.date));

    const historyList = document.getElementById('historyList');

    if (filteredStudies.length === 0) {
        historyList.innerHTML = `
            <div class="empty-state">
                <h3>Nenhum estudo encontrado</h3>
                <p>Registre seus primeiros estudos na aba Estudar</p>
            </div>
        `;
        return;
    }

    historyList.innerHTML = filteredStudies.map(study => `
        <div class="history-item">
            <div class="history-header">
                <div class="history-info">
                    <h4>
                        ${study.subjectName} - ${study.topic}
                        <span class="performance-badge performance-${study.performance}">
                            ${study.performance}
                        </span>
                    </h4>
                    <p>${study.correct}/${study.total} questões</p>
                </div>
                <div class="history-meta">
                    <div class="history-date">${formatDate(study.date)}</div>
                    <div class="score-display">${study.percentage}%</div>
                </div>
            </div>
            ${study.observations ? `
                <div class="history-observations">
                    ${study.observations}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Schedule functionality
function updateSchedule() {
    const studies = Storage.getStudies();
    const today = new Date().toISOString().split('T')[0];
    
    const reviewItems = studies.map(study => ({
        ...study,
        reviewDate: study.nextReview,
        status: getReviewStatus(study.nextReview, today)
    }));

    reviewItems.sort((a, b) => new Date(a.reviewDate) - new Date(b.reviewDate));

    const scheduleList = document.getElementById('scheduleList');

    if (reviewItems.length === 0) {
        scheduleList.innerHTML = `
            <div class="empty-state">
                <h3>Nenhuma revisão agendada</h3>
                <p>Registre estudos para gerar cronograma de revisões</p>
            </div>
        `;
        return;
    }

    scheduleList.innerHTML = reviewItems.map(item => `
        <div class="schedule-item ${item.status}">
            <div class="schedule-info">
                <h4>${item.subjectName} - ${item.topic}</h4>
                <p>Última sessão: ${formatDate(item.date)} (${item.percentage}%)</p>
            </div>
            <div class="schedule-date">
                ${formatDate(item.reviewDate)}
            </div>
        </div>
    `).join('');

    // Add update schedule button functionality
    document.getElementById('updateSchedule').onclick = () => {
        showToast('Cronograma atualizado!', 'info');
        updateSchedule();
    };
}

function getReviewStatus(reviewDate, today) {
    if (reviewDate < today) return 'overdue';
    if (reviewDate === today) return 'today';
    return 'upcoming';
}

// Settings functionality
function initSettings() {
    initImportExport();
    initDisciplineManager();
    renderDisciplines();
}

function initImportExport() {
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', importData);
}

function initDisciplineManager() {
    const addBtn = document.getElementById('addDisciplineBtn');
    const modal = document.getElementById('disciplineModal');
    const overlay = document.getElementById('disciplineModalOverlay');
    const cancelBtn = document.getElementById('cancelDisciplineBtn');
    const form = document.getElementById('disciplineForm');

    addBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
    });

    overlay.addEventListener('click', () => {
        modal.classList.add('hidden');
        form.reset();
    });

    cancelBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        form.reset();
    });

    form.addEventListener('submit', handleDisciplineSubmit);
}

function handleDisciplineSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('disciplineName').value.trim();
    const specialty = document.getElementById('disciplineSpecialty').value;
    const topicsStr = document.getElementById('disciplineTopics').value.trim();

    if (!name || !specialty || !topicsStr) {
        showToast('Por favor, preencha todos os campos', 'error');
        return;
    }

    const topics = topicsStr.split(',').map(t => t.trim()).filter(t => t.length > 0);

    if (topics.length === 0) {
        showToast('Por favor, adicione pelo menos um assunto', 'error');
        return;
    }

    // Check if discipline already exists
    const allSubjects = getAllSubjects();
    if (allSubjects.some(s => s.nome.toLowerCase() === name.toLowerCase())) {
        showToast('Disciplina já existe', 'error');
        return;
    }

    const newSubject = {
        nome: name,
        especialidade: specialty,
        assuntos: topics
    };

    Storage.addCustomSubject(newSubject);
    showToast('Disciplina adicionada com sucesso!', 'success');
    
    // Close modal and reset form
    document.getElementById('disciplineModal').classList.add('hidden');
    document.getElementById('disciplineForm').reset();
    
    // Refresh disciplines list
    renderDisciplines();
}

function renderDisciplines() {
    const allSubjects = getAllSubjects();
    const disciplinesList = document.getElementById('disciplinesList');

    disciplinesList.innerHTML = allSubjects.map(subject => `
        <div class="discipline-item">
            <div class="discipline-info">
                <h4>${subject.nome} (${subject.especialidade})</h4>
                <p>${subject.assuntos.length} assuntos</p>
                <div class="discipline-topics">
                    ${subject.assuntos.map(topic => `<span class="topic-tag">${topic}</span>`).join('')}
                </div>
            </div>
            <div class="discipline-actions">
                ${subject.custom ? `
                    <button class="btn btn--outline btn--sm" onclick="deleteCustomDiscipline(${subject.id})">
                        Excluir
                    </button>
                ` : '<span class="topic-tag">Padrão</span>'}
            </div>
        </div>
    `).join('');
}

function deleteCustomDiscipline(id) {
    if (confirm('Tem certeza que deseja excluir esta disciplina?')) {
        Storage.deleteCustomSubject(id);
        showToast('Disciplina removida com sucesso!', 'success');
        renderDisciplines();
    }
}

function exportData() {
    const studies = Storage.getStudies();
    const customSubjects = Storage.getCustomSubjects();
    const exportData = {
        studies,
        customSubjects,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `enare_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showToast('Dados exportados com sucesso!', 'success');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Handle both old format (array) and new format (object)
            if (Array.isArray(importedData)) {
                Storage.saveStudies(importedData);
            } else if (importedData.studies) {
                Storage.saveStudies(importedData.studies);
                if (importedData.customSubjects) {
                    Storage.saveCustomSubjects(importedData.customSubjects);
                }
            } else {
                showToast('Formato de arquivo inválido', 'error');
                return;
            }
            
            showToast('Dados importados com sucesso!', 'success');
            updateDashboard();
            updateHistory();
            updateSchedule();
            renderDisciplines();
        } catch (error) {
            showToast('Erro ao importar arquivo', 'error');
        }
    };
    reader.readAsText(file);
}

// Toast notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    document.getElementById('toastContainer').appendChild(toast);

    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);

    // Hide and remove toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    
    // Initialize with sample data if no data exists
    const existingStudies = Storage.getStudies();
    if (existingStudies.length === 0) {
        const sampleData = [
            {
                "id": 1640995200000,
                "subjectId": 1,
                "subjectName": "Cardiologia",
                "topic": "Arritmias",
                "correct": 8,
                "total": 10,
                "percentage": 80,
                "date": "2024-01-01",
                "performance": "bom",
                "nextReview": "2024-01-08",
                "observations": "Tive dificuldade com os casos de FA com RVR, preciso revisar os critérios de anticoagulação."
            },
            {
                "id": 1641081600000,
                "subjectId": 2,
                "subjectName": "Pneumologia",
                "topic": "Pneumonias",
                "correct": 9,
                "total": 10,
                "percentage": 90,
                "date": "2024-01-02",
                "performance": "excelente",
                "nextReview": "2024-01-16",
                "observations": ""
            }
        ];
        Storage.saveStudies(sampleData);
    }
    
    // Load initial tab
    switchTab('inicio');
});

// Expose function to global scope for onclick handlers
window.deleteCustomDiscipline = deleteCustomDiscipline;