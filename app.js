// State management
let balance = parseFloat(localStorage.getItem('ptg_balance')) || 0;
let transactions = JSON.parse(localStorage.getItem('ptg_transactions')) || [];
let tasks = JSON.parse(localStorage.getItem('ptg_tasks')) || [];
let tasksHistory = JSON.parse(localStorage.getItem('ptg_tasks_history')) || [];

// Initialize default tasks if none exist
if (tasks.length === 0) {
    tasks = [
        { id: 1, name: 'Escovar Dentes', value: 2.5, isRecurring: true },
        { id: 2, name: 'Arrumar Cama', value: 5, isRecurring: true },
        { id: 3, name: 'Café Matinal Saudável', value: 5, isRecurring: true },
        { id: 4, name: 'Code Review', value: 10, isRecurring: true },
        { id: 5, name: 'Potato Walk (30m)', value: 12.5, isRecurring: true },
        { id: 6, name: 'Almoço Saudável', value: 10, isRecurring: true },
        { id: 7, name: 'Lavar Louça', value: 5, isRecurring: true },
        { id: 8, name: 'Completar Task Trabalho', value: 20, isRecurring: true },
        { id: 9, name: 'Lanche Tarde Saudável', value: 5, isRecurring: true },
        { id: 10, name: 'Jantar Saudável', value: 10, isRecurring: true },
        { id: 11, name: 'Malhar', value: 15, isRecurring: true },
        { id: 12, name: 'Corrida (1km)', value: 10, isRecurring: true }
    ];
    localStorage.setItem('ptg_tasks', JSON.stringify(tasks));
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

// Limit history to 10 items to save space and consolidate old balance
if (transactions.length > 10) {
    transactions = transactions.slice(-10);
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
const newTaskValue = document.getElementById('new-task-value');
const createTaskConfirm = document.getElementById('create-task-confirm');
const createTaskCancel = document.getElementById('create-task-cancel');

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

// Initialize
updateUI();
updateHistoryUI();

// Functions
function updateUI() {
    balanceEl.textContent = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
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
                    ${t.type === 'credit' ? '+' : '-'} ${new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
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


function saveTasks() {
    // Limit tasks history to last 50 items
    if (tasksHistory.length > 50) {
        tasksHistory = tasksHistory.slice(-50);
    }
    localStorage.setItem('ptg_tasks', JSON.stringify(tasks));
    localStorage.setItem('ptg_tasks_history', JSON.stringify(tasksHistory));
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
    
    let html = filtered.map(t => `
        <div class="dynamic-item" data-id="${t.id}">
            <span>${t.name}</span>
            <strong>R$ ${t.value}</strong>
        </div>
    `).join('');
    
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
        
        if (item.id === 'btn-open-create-task') {
            createTaskModal.classList.remove('hidden');
            newTaskName.value = taskSearchInput.value;
            newTaskValue.value = '';
            setTimeout(() => newTaskName.focus(), 100);
            return;
        }
        
        const taskId = item.dataset.id;
        const task = tasks.find(t => t.id == taskId);
        if (task) {
            selectedTaskId = taskId;
            confirmModalTitle.textContent = 'Registrar Tarefa';
            confirmModalBody.textContent = `Deseja registrar a conclusão de "${task.name}" e ganhar R$ ${task.value}?`;
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
        const value = parseFloat(newTaskValue.value);
        
        if (name && !isNaN(value)) {
            const newTask = {
                id: Date.now(),
                name: name,
                value: value,
                createdAt: new Date().toLocaleString('pt-BR'),
                isRecurring: false,
                interval: null
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

// Buy Logic
let selectedBuyItem = null;
const buyGrid = document.querySelector('.buy-grid');

function updateBuyTotal() {
    const price = parseFloat(buyPriceInput.value) || 0;
    const quantity = parseInt(buyQuantityInput.value) || 0;
    const total = price * quantity;
    buyTotalDisplay.textContent = `Total: ${new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
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
    'regulations-view': false,
    'deck-guide-view': false
};

const viewFiles = {
    'regulations-view': { file: 'regulamento.html', container: 'regulations-content' },
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
