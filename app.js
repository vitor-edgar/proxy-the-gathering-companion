// State management
let balance = parseFloat(localStorage.getItem('ptg_balance')) || 0;
let transactions = JSON.parse(localStorage.getItem('ptg_transactions')) || [];
let tasks = JSON.parse(localStorage.getItem('ptg_tasks')) || [];
let tasksHistory = JSON.parse(localStorage.getItem('ptg_tasks_history')) || [];

const BASE_PRICE = 6.0;

const importanceMultipliers = {
    1: 0.5,
    2: 0.75,
    3: 1.0,
    4: 1.25,
    5: 1.5
};

const effortMultipliers = {
    1: 0.5,
    2: 0.75,
    3: 1.0,
    4: 1.5,
    5: 2.0
};

const timeMultipliers = {
    1: 0.25,
    2: 0.5,
    3: 1.0,
    4: 2.0,
    5: 3.0
};

// Initialize default tasks if none exist
if (tasks.length === 0) {
    tasks = [
        {id: 1, name: 'Escovar Dentes', indicators: { importance: 4, effort: 1, time: 1 }, createdAt: new Date().toLocaleString('pt-BR')},
        {id: 2, name: 'Arrumar Cama', indicators: { importance: 2, effort: 2, time: 1 }, createdAt: new Date().toLocaleString('pt-BR')},
        {id: 3, name: 'Refeição Saudável', indicators: { importance: 4, effort: 2, time: 2 }, createdAt: new Date().toLocaleString('pt-BR')},
        {id: 4, name: 'Task no Trabalho', indicators: { importance: 3, effort: 3, time: 3 }, createdAt: new Date().toLocaleString('pt-BR')},
        {id: 5, name: 'Potato Walk(30m)', indicators: { importance: 3, effort: 3, time: 2 }, createdAt: new Date().toLocaleString('pt-BR')},
        {id: 6, name: 'Malhar', indicators: { importance: 3, effort: 4, time: 2 }, createdAt: new Date().toLocaleString('pt-BR')}
    ];
    // Calculate initial values for default tasks
    tasks = tasks.map(t => {
        const importanceMult = importanceMultipliers[t.indicators.importance] || 1;
        const effortMult = effortMultipliers[t.indicators.effort] || 1;
        const timeMult = timeMultipliers[t.indicators.time] || 1;
        t.value = BASE_PRICE * importanceMult * effortMult * timeMult;
        return t;
    });
    localStorage.setItem('ptg_tasks', JSON.stringify(tasks));
}

// Migrate tasks to the new pricing formula (All indicators as Multipliers)
if (!localStorage.getItem('ptg_migration_all_multipliers')) {
    tasks = tasks.map(t => {
        if (t.indicators) {
            const importanceMult = importanceMultipliers[t.indicators.importance] || 1;
            const effortMult = effortMultipliers[t.indicators.effort] || 1;
            const timeMult = timeMultipliers[t.indicators.time] || 1;
            t.value = BASE_PRICE * importanceMult * effortMult * timeMult;
        }
        return t;
    });
    localStorage.setItem('ptg_tasks', JSON.stringify(tasks));
    localStorage.setItem('ptg_migration_all_multipliers', 'true');
}


// Migrate existing transactions to have IDs if they don't
let migrated = false;
transactions = transactions.map((t, i) => {
    if (!t.id) {
        t.id = Date.now() - i;
        migrated = true;
    }
    return t;
});
if (migrated) localStorage.setItem('ptg_transactions', JSON.stringify(transactions));

// Limit history to 50 items to save space and consolidate old balance
if (transactions.length > 50) {
    transactions = transactions.slice(-50);
    localStorage.setItem('ptg_transactions', JSON.stringify(transactions));
}


// DOM Elements
const balanceEl = document.getElementById('balance');
const balanceContainer = document.getElementById('balance-container');
// New Tracker Elements
const trackerMainActions = document.getElementById('tracker-main-actions');
const sectionRegisterTask = document.getElementById('section-register-task');
const sectionBuy = document.getElementById('section-buy');
const sectionSell = document.getElementById('section-sell');

const btnShowTasks = document.getElementById('btn-show-tasks');
const btnShowBuy = document.getElementById('btn-show-buy');
const btnShowSell = document.getElementById('btn-show-sell');

const taskSearchInput = document.getElementById('task-search-input');
const taskSearchResults = document.getElementById('task-search-results');
const sellInput = document.getElementById('sell-input');
const btnDoSell = document.getElementById('btn-do-sell');

// Modals
const confirmModal = document.getElementById('confirm-modal');
const confirmModalTitle = document.getElementById('confirm-modal-title');
const confirmModalBody = document.getElementById('confirm-modal-body');
const confirmModalOk = document.getElementById('confirm-modal-ok');
const confirmModalCancel = document.getElementById('confirm-modal-cancel');

const createTaskModal = document.getElementById('create-task-modal');
const newTaskName = document.getElementById('new-task-name');
const newTaskValueDisplay = document.getElementById('new-task-value-display');
const createTaskConfirm = document.getElementById('create-task-confirm');
const createTaskCancel = document.getElementById('create-task-cancel');


let currentIndicators = {
    importance: 1,
    effort: 1,
    time: 1
};


const buyModal = document.getElementById('buy-modal');
const buyModalTitle = document.getElementById('buy-modal-title');
const buyPriceInput = document.getElementById('buy-price-input');
const buyQuantityInput = document.getElementById('buy-quantity-input');
const buyTotalDisplay = document.getElementById('buy-total-display');
const buyModalConfirm = document.getElementById('buy-modal-confirm');
const buyModalCancel = document.getElementById('buy-modal-cancel');

const notification = document.getElementById('notification');
const tabBtns = document.querySelectorAll('.tab-btn');
const views = document.querySelectorAll('.view');
const historyList = document.getElementById('history-list');
const mtgRulesSearch = document.getElementById('mtg-rules-search');
const mtgRulesContent = document.getElementById('mtg-rules-content');

// Initialize
updateUI();
updateHistoryUI();

// Functions
function updateUI() {
    balanceEl.textContent = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(balance);

    localStorage.setItem('ptg_balance', balance.toString());

    if (balance < 0) {
        balanceContainer.classList.add('negative');
        notification.classList.remove('hidden');
    } else {
        balanceContainer.classList.remove('negative');
        notification.classList.add('hidden');
    }
}

function updateHistoryUI() {
    if (!historyList) return;
    
    if (transactions.length === 0) {
        historyList.innerHTML = '<p class="empty-msg">Nenhuma transação registrada.</p>';
        return;
    }

    historyList.innerHTML = transactions.slice().reverse().map(t => `
        <div class="history-item ${t.type}">
            <div class="history-info">
                <span class="history-name">${t.name}</span>
                <span class="history-date">${t.date}</span>
            </div>
            <div class="history-right">
                <span class="history-amount ${t.type}">
                    ${t.type === 'credit' ? '+' : '-'} ${new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                    }).format(t.amount)}
                </span>
                <button class="delete-btn" data-id="${t.id}" title="Excluir">×</button>
            </div>
        </div>
    `).join('');
}

function recordTransaction(type, amount, name) {
    const date = new Date().toLocaleString('pt-BR');
    const id = Date.now();
    
    if (type === 'credit') {
        balance += amount;
    } else {
        balance -= amount;
    }

    transactions.push({ id, type, amount, name, date });
    
    // Keep only last 10 transactions
    if (transactions.length > 10) {
        transactions.shift();
    }
    
    localStorage.setItem('ptg_transactions', JSON.stringify(transactions));
    updateUI();
    updateHistoryUI();
}


function deleteTransaction(id) {
    const index = transactions.findIndex(t => t.id == id);
    if (index !== -1) {
        const t = transactions[index];
        if (t.type === 'credit') {
            balance -= t.amount;
        } else {
            balance += t.amount;
        }
        transactions.splice(index, 1);
        localStorage.setItem('ptg_transactions', JSON.stringify(transactions));
        updateUI();
        updateHistoryUI();
    }
}

function completeTask(id) {
    const index = tasks.findIndex(t => t.id == id);
    if (index !== -1) {
        const task = tasks[index];
        const taskCopy = { ...task, completedAt: new Date().toLocaleString('pt-BR') };
        tasksHistory.push(taskCopy);
        
        // Record as a transaction
        recordTransaction('credit', task.value, `Tarefa: ${task.name}`);
        
        // Mark last completion but keep the task in the list for reuse
        task.lastCompleted = Date.now();
        
        saveTasks();
    }
}


function deleteTask(id) {
    const index = tasks.findIndex(t => t.id == id);
    if (index !== -1) {
        tasks.splice(index, 1);
        saveTasks();
        updateTaskSearchResults(taskSearchInput.value || '');
    }
}


function saveTasks() {
    // Limit tasks history to last 50 items
    if (tasksHistory.length > 50) {
        tasksHistory = tasksHistory.slice(-50);
    }
    localStorage.setItem('ptg_tasks', JSON.stringify(tasks));
    localStorage.setItem('ptg_tasks_history', JSON.stringify(tasksHistory));
}

function updateStarUI(indicator, value) {
    const container = document.querySelector(`.star-rating[data-indicator="${indicator}"]`);
    if (!container) return;
    
    const stars = container.querySelectorAll('.star');
    stars.forEach(s => {
        if (parseInt(s.dataset.value) <= value) {
            s.classList.add('active');
        } else {
            s.classList.remove('active');
        }
    });
    currentIndicators[indicator] = value;
    updateNewTaskValue();
}

function updateNewTaskValue() {
    if (!newTaskValueDisplay) return 0;

    const importanceMult = importanceMultipliers[currentIndicators.importance] || 1;
    const effortMult = effortMultipliers[currentIndicators.effort] || 1;
    const timeMult = timeMultipliers[currentIndicators.time] || 1;
    const total = BASE_PRICE * importanceMult * effortMult * timeMult;
    
    newTaskValueDisplay.textContent = `Recompensa: $ ${total.toFixed(2).replace('.', ',')}`;
    return total;
}

// Tracker Logic
function showTrackerSection(sectionId) {
    trackerMainActions.classList.add('hidden');
    sectionRegisterTask.classList.add('hidden');
    sectionBuy.classList.add('hidden');
    sectionSell.classList.add('hidden');
    
    document.getElementById(sectionId).classList.remove('hidden');
}

function resetTrackerView() {
    trackerMainActions.classList.remove('hidden');
    sectionRegisterTask.classList.add('hidden');
    sectionBuy.classList.add('hidden');
    sectionSell.classList.add('hidden');
    taskSearchInput.value = '';
}

// Task Search and Filtering
function updateTaskSearchResults(filter) {
    if (!taskSearchResults) return;
    const term = filter.toLowerCase();
    const filtered = tasks.filter(t => t.name.toLowerCase().includes(term));
    
    let html = filtered.map(t => {
        const indicators = t.indicators || { importance: 1, effort: 1, time: 1 };
        const avg = (indicators.importance + indicators.effort + indicators.time) / 3;
        const percentage = (avg / 5) * 100;
        return `
        <div class="dynamic-item" data-id="${t.id}">
            <div class="task-info">
                <span class="task-name">${t.name}</span>
                <div class="task-indicators-display">
                    <div class="stars-outer" title="Média: ${avg.toFixed(1)}">
                        <div class="stars-inner" style="width: ${percentage}%"></div>
                    </div>
                </div>
                <strong>${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(t.value)}</strong>
            </div>
            <button class="delete-task-btn" data-id="${t.id}" title="Excluir Tarefa">×</button>
        </div>
    `}).join('');
    
    html += `
        <div class="dynamic-item add-btn" id="btn-open-create-task">
            + Adicionar Nova Tarefa
        </div>
    `;
    
    taskSearchResults.innerHTML = html;
}

// Event Listeners
if (btnShowTasks) {
    btnShowTasks.addEventListener('click', () => {
        showTrackerSection('section-register-task');
        updateTaskSearchResults('');
        setTimeout(() => taskSearchInput.focus(), 100);
    });
}

if (btnShowBuy) {
    btnShowBuy.addEventListener('click', () => {
        showTrackerSection('section-buy');
    });
}

if (btnShowSell) {
    btnShowSell.addEventListener('click', () => {
        showTrackerSection('section-sell');
        setTimeout(() => sellInput.focus(), 100);
    });
}

document.querySelectorAll('.btn-back').forEach(btn => {
    btn.addEventListener('click', resetTrackerView);
});

if (taskSearchInput) {
    taskSearchInput.addEventListener('input', (e) => {
        updateTaskSearchResults(e.target.value);
    });
}

// Task Selection and Confirmation
let selectedTaskId = null;
if (taskSearchResults) {
    taskSearchResults.addEventListener('click', (e) => {
        const item = e.target.closest('.dynamic-item');
        if (!item) return;

        // Botão de deletar tarefa
        if (e.target.classList.contains('delete-task-btn')) {
            e.stopPropagation();
            const taskId = e.target.dataset.id;
            const task = tasks.find(t => t.id == taskId);
            if (task && confirm(`Deseja excluir permanentemente a tarefa "${task.name}"?`)) {
                deleteTask(taskId);
            }
            return;
        }
        
        if (item.id === 'btn-open-create-task') {
            createTaskModal.classList.remove('hidden');
            newTaskName.value = taskSearchInput.value;
            // Reset indicators to default level 1
            updateStarUI('importance', 1);
            updateStarUI('effort', 1);
            updateStarUI('time', 1);
            setTimeout(() => newTaskName.focus(), 100);
            return;
        }
        
        const taskId = item.dataset.id;
        const task = tasks.find(t => t.id == taskId);
        if (task) {
            selectedTaskId = taskId;
            confirmModalTitle.textContent = 'Registrar Tarefa';
            const formattedValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(task.value);
            confirmModalBody.textContent = `Deseja registrar a conclusão de "${task.name}" e ganhar ${formattedValue}?`;
            confirmModal.classList.remove('hidden');
        }
    });
}

if (confirmModalOk) {
    confirmModalOk.addEventListener('click', () => {
        if (selectedTaskId) {
            completeTask(selectedTaskId);
            selectedTaskId = null;
            confirmModal.classList.add('hidden');
            resetTrackerView();
        }
    });
}

if (confirmModalCancel) {
    confirmModalCancel.addEventListener('click', () => {
        selectedTaskId = null;
        confirmModal.classList.add('hidden');
    });
}

// Create New Task Logic
if (createTaskConfirm) {
    createTaskConfirm.addEventListener('click', () => {
        const name = newTaskName.value.trim();
        const value = updateNewTaskValue();
        
        if (name && !isNaN(value)) {
            const newTask = {
                id: Date.now(),
                name: name,
                value: value,
                indicators: { ...currentIndicators },
                createdAt: new Date().toLocaleString('pt-BR')
            };
            tasks.push(newTask);
            saveTasks();
            createTaskModal.classList.add('hidden');
            updateTaskSearchResults(taskSearchInput.value);
        }
    });
}

if (createTaskCancel) {
    createTaskCancel.addEventListener('click', () => {
        createTaskModal.classList.add('hidden');
    });
}

// Star Rating Interaction
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('star')) {
        const ratingContainer = e.target.closest('.star-rating');
        if (ratingContainer) {
            const indicator = ratingContainer.dataset.indicator;
            const value = parseInt(e.target.dataset.value);
            updateStarUI(indicator, value);
        }
    }
});

// Buy Logic
let selectedBuyItem = null;
const buyGrid = document.querySelector('.buy-grid');

function updateBuyTotal() {
    const price = parseFloat(buyPriceInput.value) || 0;
    const quantity = parseInt(buyQuantityInput.value) || 0;
    const total = price * quantity;
    buyTotalDisplay.textContent = `Total: ${new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(total)}`;
}

if (buyGrid) {
    buyGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.buy-option');
        if (!btn) return;
        
        const item = btn.dataset.item;
        const value = btn.dataset.value;
        
        selectedBuyItem = item;
        buyModalTitle.textContent = `Comprar: ${item}`;
        buyQuantityInput.value = 1;
        
        if (value) {
            buyPriceInput.value = value;
            buyPriceInput.readOnly = true;
        } else {
            buyPriceInput.value = '';
            buyPriceInput.readOnly = false;
        }
        
        updateBuyTotal();
        buyModal.classList.remove('hidden');
        
        if (!value) {
            setTimeout(() => buyPriceInput.focus(), 100);
        } else {
            setTimeout(() => buyQuantityInput.focus(), 100);
        }
    });
}

buyPriceInput.addEventListener('input', updateBuyTotal);
buyQuantityInput.addEventListener('input', updateBuyTotal);

if (buyModalConfirm) {
    buyModalConfirm.addEventListener('click', () => {
        const price = parseFloat(buyPriceInput.value);
        const quantity = parseInt(buyQuantityInput.value);
        
        if (!isNaN(price) && price > 0 && !isNaN(quantity) && quantity > 0) {
            const total = price * quantity;
            const name = quantity > 1 ? `${quantity}x ${selectedBuyItem}` : selectedBuyItem;
            recordTransaction('debit', total, `Compra: ${name}`);
            buyModal.classList.add('hidden');
            resetTrackerView();
        }
    });
}

if (buyModalCancel) {
    buyModalCancel.addEventListener('click', () => {
        buyModal.classList.add('hidden');
    });
}

// Sell Logic
if (btnDoSell) {
    btnDoSell.addEventListener('click', () => {
        const val = parseFloat(sellInput.value);
        if (!isNaN(val) && val > 0) {
            recordTransaction('credit', val, 'Venda de Cartas');
            sellInput.value = '';
            resetTrackerView();
        }
    });
}


// Navigation and Content Loading
const loadedViews = {
    'mtg-rules-view': false,
    'deck-guide-view': false
};

const viewFiles = {
    'mtg-rules-view': { file: 'mtg-rules.html', container: 'mtg-rules-content' },
    'deck-guide-view': { file: 'how_to_build_a_deck.html', container: 'deck-guide-content' }
};

async function loadViewContent(target) {
    if (viewFiles[target] && !loadedViews[target]) {
        const { file, container } = viewFiles[target];
        try {
            const response = await fetch(file);
            if (!response.ok) throw new Error(`Erro ao carregar ${file}`);
            const html = await response.text();
            document.getElementById(container).innerHTML = html;
            loadedViews[target] = true;

            // Trigger search if content is rules and there's a search term
            if (target === 'mtg-rules-view' && mtgRulesSearch && mtgRulesSearch.value) {
                mtgRulesSearch.dispatchEvent(new Event('input'));
            }
        } catch (error) {
            console.error(error);
            document.getElementById(container).innerHTML = `<p class="error-msg">Erro ao carregar conteúdo: ${error.message}</p>`;
        }
    }
}

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Load content if needed
        loadViewContent(target);

        views.forEach(v => {
            if (v.id === target) {
                v.classList.remove('hidden');
            } else {
                v.classList.add('hidden');
            }
        });
    });
});


// History Item Deletion
historyList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const id = e.target.dataset.id;
        if (confirm('Deseja excluir esta transação?')) {
            deleteTransaction(id);
        }
    }
});

// MTG Rules Search Logic
let mtgSearchTimeout;

if (mtgRulesSearch) {
    mtgRulesSearch.addEventListener('input', () => {
        clearTimeout(mtgSearchTimeout);
        mtgSearchTimeout = setTimeout(() => {
            const term = mtgRulesSearch.value.toLowerCase().trim();
            const elements = mtgRulesContent.querySelectorAll('p, h2, h3, div.example');
            
            elements.forEach(el => {
                if (!term) {
                    el.style.display = '';
                } else {
                    const text = el.textContent.toLowerCase();
                    el.style.display = text.includes(term) ? '' : 'none';
                }
            });
        }, 300);
    });
}
