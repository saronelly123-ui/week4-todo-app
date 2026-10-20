
import './style.css'

// Keep the complete task list and selected filter in one application state.
const STORAGE_KEY = 'taskflow-data'
const THEME_KEY = 'taskflow-theme'
const VALID_PRIORITIES = ['Low', 'Medium', 'High']
let tasks = []
let currentFilter = 'all'

// Read saved tasks and filter safely from localStorage.
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    tasks = Array.isArray(saved.tasks)
      ? saved.tasks.filter(isValidTask)
      : []
    currentFilter = ['all', 'active', 'completed'].includes(saved.filter)
      ? saved.filter
      : 'all'
  } catch {
    tasks = []
    currentFilter = 'all'
  }
}

// Check that a saved task has the expected data types.
function isValidTask(task) {
  return Boolean(
    task &&
    typeof task.id === 'string' &&
    typeof task.text === 'string' &&
    task.text.trim() &&
    task.text.length <= 100 &&
    typeof task.completed === 'boolean' &&
    VALID_PRIORITIES.includes(task.priority)
  )
}

// Save the task list and filter whenever application state changes.
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    tasks,
    filter: currentFilter,
  }))
}

// Find an element by its ID to keep the event handlers readable.
function byId(id) {
  return document.getElementById(id)
}

const taskForm = byId('taskForm')
const taskInput = byId('taskInput')
const priorityInput = byId('priorityInput')
const formError = byId('formError')
const taskList = byId('taskList')
const emptyState = byId('emptyState')
const emptyTitle = byId('emptyTitle')
const emptyMessage = byId('emptyMessage')
const searchInput = byId('searchInput')
const filterGroup = byId('filterGroup')

// Display validation errors without using browser alert dialogs.
function showError(message) {
  formError.textContent = message
}

// Add a task after validating its name and priority.
function addTask(event) {
  event.preventDefault()
  const text = taskInput.value.trim()

  if (!text) {
    showError('Please enter a task name.')
    taskInput.focus()
    return
  }
  if (text.length > 100) {
    showError('Task names must be 100 characters or fewer.')
    taskInput.focus()
    return
  }

  tasks.unshift({
    id: crypto.randomUUID(),
    text,
    completed: false,
    priority: VALID_PRIORITIES.includes(priorityInput.value)
      ? priorityInput.value
      : 'Medium',
  })
  taskInput.value = ''
  showError('')
  saveState()
  render()
  taskInput.focus()
}

// Build a safe task row using DOM methods and textContent.
function createTaskElement(task) {
  const item = document.createElement('li')
  item.className = 'task-item flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center'
  item.dataset.id = task.id

  const main = document.createElement('div')
  main.className = 'flex min-w-0 flex-1 items-start gap-3'

  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.checked = task.completed
  checkbox.className = 'mt-1 size-5 shrink-0 accent-indigo-600'
  checkbox.dataset.action = 'toggle'
  checkbox.setAttribute('aria-label', `Mark "${task.text}" completed`)

  const content = document.createElement('div')
  content.className = 'min-w-0 flex-1'

  const name = document.createElement('p')
  name.className = task.completed
    ? 'break-words font-medium text-slate-400 line-through'
    : 'break-words font-medium text-slate-800'
  name.textContent = task.text

  const priority = document.createElement('span')
  priority.className = `priority-badge priority-${task.priority.toLowerCase()}`
  priority.textContent = `${task.priority} priority`

  content.append(name, priority)
  main.append(checkbox, content)

  const actions = document.createElement('div')
  actions.className = 'flex flex-wrap gap-2 pl-8 sm:pl-0'

  const editButton = createActionButton('Edit', 'edit', 'Edit task')
  const deleteButton = createActionButton('Delete', 'delete', 'Delete task')
  actions.append(editButton, deleteButton)
  item.append(main, actions)
  return item
}

// Create a labeled button for a task action.
function createActionButton(label, action, description) {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = label
  button.dataset.action = action
  button.setAttribute('aria-label', description)
  button.className = action === 'delete'
    ? 'rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-500'
    : 'rounded-lg px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-500'
  return button
}

// Show an inline editor and support Enter to save and Escape to cancel.
function startEditing(item, task) {
  const content = item.querySelector('.min-w-0.flex-1')
  const oldName = content.querySelector('p')
  const editor = document.createElement('input')
  editor.type = 'text'
  editor.maxLength = 100
  editor.value = task.text
  editor.setAttribute('aria-label', 'Edit task name')
  editor.className = 'w-full rounded-lg border border-indigo-400 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200'

  oldName.replaceWith(editor)
  const priority = content.querySelector('span')
  if (priority) priority.remove()

  const actions = item.querySelector('.pl-8')
  actions.replaceChildren(
    createActionButton('Save', 'save-edit', 'Save task changes'),
    createActionButton('Cancel', 'cancel-edit', 'Cancel task editing'),
  )
  editor.focus()
  editor.select()
}

// Save the inline editor only when the new name is valid.
function saveEdit(item) {
  const editor = item.querySelector('input[aria-label="Edit task name"]')
  if (!editor) return

  const text = editor.value.trim()
  if (!text || text.length > 100) {
    editor.setCustomValidity(!text
      ? 'Task name cannot be empty.'
      : 'Task names must be 100 characters or fewer.')
    editor.reportValidity()
    return
  }

  const task = tasks.find((entry) => entry.id === item.dataset.id)
  if (!task) return
  task.text = text
  saveState()
  render()
}

// Toggle completion for the selected task.
function toggleTask(item) {
  const task = tasks.find((entry) => entry.id === item.dataset.id)
  if (!task) return
  task.completed = !task.completed
  saveState()
  render()
}

// Delete a task only after the user confirms the action.
function deleteTask(item) {
  const task = tasks.find((entry) => entry.id === item.dataset.id)
  if (!task) return
  if (!window.confirm(`Delete "${task.text}"?`)) return
  tasks = tasks.filter((entry) => entry.id !== task.id)
  saveState()
  render()
}

// Handle task actions through one delegated listener on the list.
function handleListClick(event) {
  const button = event.target.closest('button[data-action]')
  if (!button) return

  const item = button.closest('li[data-id]')
  if (!item) return

  const action = button.dataset.action
  if (action === 'edit') startEditing(item, findTask(item))
  if (action === 'save-edit') saveEdit(item)
  if (action === 'cancel-edit') render()
  if (action === 'delete') deleteTask(item)
}

// Return the task associated with a rendered row.
function findTask(item) {
  return tasks.find((task) => task.id === item.dataset.id)
}

// Handle checkbox changes using event delegation.
function handleListChange(event) {
  if (event.target.dataset.action !== 'toggle') return
  toggleTask(event.target.closest('li[data-id]'))
}

// Support Enter to save and Escape to cancel inline editing.
function handleListKeydown(event) {
  if (event.target.getAttribute('aria-label') !== 'Edit task name') return
  if (event.key === 'Enter') {
    event.preventDefault()
    saveEdit(event.target.closest('li[data-id]'))
  }
  if (event.key === 'Escape') render()
}

// Return tasks matching the selected filter and search query.
function getVisibleTasks() {
  const query = searchInput.value.trim().toLowerCase()
  return tasks.filter((task) => {
    const matchesFilter = currentFilter === 'all' ||
      (currentFilter === 'active' && !task.completed) ||
      (currentFilter === 'completed' && task.completed)
    return matchesFilter && task.text.toLowerCase().includes(query)
  })
}

// Update counters and the progress bar from the current state.
function renderSummary() {
  const completed = tasks.filter((task) => task.completed).length
  const remaining = tasks.length - completed
  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0

  byId('totalCount').textContent = String(tasks.length)
  byId('remainingCount').textContent = String(remaining)
  byId('taskSummary').textContent =
    `${remaining} task${remaining === 1 ? '' : 's'} left`
  byId('progressLabel').textContent = `${progress}%`
  byId('progressBar').style.width = `${progress}%`
}

// Update the selected filter button's appearance and accessibility state.
function renderFilters() {
  filterGroup.querySelectorAll('[data-filter]').forEach((button) => {
    const selected = button.dataset.filter === currentFilter
    button.setAttribute('aria-pressed', String(selected))
    button.className = selected
      ? 'filter-button rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white'
      : 'filter-button rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200'
  })
}

// Render the task list and the appropriate empty-state message.
function render() {
  taskList.replaceChildren()
  const visibleTasks = getVisibleTasks()
  visibleTasks.forEach((task) => taskList.append(createTaskElement(task)))
  emptyState.classList.toggle('hidden', visibleTasks.length > 0)

  const messages = {
    all: ['No tasks yet', 'Add your first task to get started.'],
    active: ['All caught up!', 'You have no active tasks.'],
    completed: ['Nothing completed yet', 'Finished tasks will appear here.'],
  }
  const [title, message] = messages[currentFilter]
  emptyTitle.textContent = searchInput.value.trim()
    ? 'No matching tasks'
    : title
  emptyMessage.textContent = searchInput.value.trim()
    ? 'Try another search or change the filter.'
    : message

  renderSummary()
  renderFilters()
}

// Remove all completed tasks after confirmation.
function clearCompleted() {
  const completedCount = tasks.filter((task) => task.completed).length
  if (!completedCount) {
    showError('There are no completed tasks to clear.')
    return
  }
  if (!window.confirm(`Clear ${completedCount} completed task(s)?`)) return
  tasks = tasks.filter((task) => !task.completed)
  showError('')
  saveState()
  render()
}

// Apply the saved theme or switch between light and dark modes.
function applyTheme(theme) {
  const dark = theme === 'dark'
  document.documentElement.classList.toggle('dark', dark)
  const button = byId('themeToggle')
  button.textContent = dark ? '☀️ Light mode' : '🌙 Dark mode'
  button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode')
  localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
}

// Start the app, restore saved state, and register event listeners.
function init() {
  loadState()
  applyTheme(localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light')

  taskForm.addEventListener('submit', addTask)
  taskInput.addEventListener('input', () => showError(''))
  searchInput.addEventListener('input', render)
  filterGroup.addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]')
    if (!button) return
    currentFilter = button.dataset.filter
    saveState()
    render()
  })
  taskList.addEventListener('click', handleListClick)
  taskList.addEventListener('change', handleListChange)
  taskList.addEventListener('keydown', handleListKeydown)
  byId('clearCompleted').addEventListener('click', clearCompleted)
  byId('themeToggle').addEventListener('click', () => {
    applyTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark')
  })

  render()
}

init()
