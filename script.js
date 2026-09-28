
const $ = s => document.querySelector(s);
const today = () => new Date().toLocaleDateString('en-CA');

const defaultTasks = [
  {
    id: 1,
    title: 'Finish project proposal',
    description: 'Complete the proposal for the client by end of day.',
    category: 'Work',
    priority: 'high',
    due: today(),
    done: false,
    important: true,
    created: Date.now()
  },
  {
    id: 2,
    title: 'Buy groceries',
    description: 'Milk, eggs, bread, and vegetables.',
    category: 'Personal',
    priority: 'medium',
    due: today(),
    done: false,
    important: false,
    created: Date.now()
  },
  {
    id: 3,
    title: 'Go for a run',
    description: '30 minutes. Stay consistent!',
    category: 'Fitness',
    priority: 'low',
    due: '',
    done: false,
    important: false,
    created: Date.now()
  },
  {
    id: 4,
    title: 'Read a book',
    description: 'Finish at least 1 chapter.',
    category: 'Personal',
    priority: 'low',
    due: '',
    done: true,
    important: false,
    created: Date.now()
  },
  {
    id: 5,
    title: 'Update website',
    description: 'Fix the header and footer issues.',
    category: 'Work',
    priority: 'medium',
    due: '',
    done: true,
    important: true,
    created: Date.now()
  }
];

let tasks;

try {
  tasks = JSON.parse(localStorage.getItem('taskflow-tasks')) || defaultTasks;
} catch {
  tasks = defaultTasks;
}

let categories = JSON.parse(
  localStorage.getItem('taskflow-categories') ||
  '["Work","Personal","Shopping","Fitness"]'
);

let view = 'all';
let filter = 'all';
let editing = null;

const save = () => {
  localStorage.setItem('taskflow-tasks', JSON.stringify(tasks));
  localStorage.setItem('taskflow-categories', JSON.stringify(categories));
};

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function toast(s) {
  let t = $('#toast');
  t.textContent = s;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1800);
}

function color(c) {
  return ({
    Work: '#347df5',
    Personal: '#20bd89',
    Shopping: '#f6b544',
    Fitness: '#a76af5'
  })[c] || '#5f91e8';
}

function renderCategories() {
  let sel = $('#category');

  sel.innerHTML = categories.map(c =>
    `<option>${esc(c)}</option>`
  ).join('');

  $('#categoryList').innerHTML = categories.map(c => `
    <button class="list-item" data-category="${esc(c)}">
      <i class="dot" style="background:${color(c)}"></i>
      <span>${esc(c)}</span>
      <span class="count">
        ${tasks.filter(t => t.category === c && !t.done).length}
      </span>
    </button>
  `).join('');
}

function visible(t) {
  let q = $('#search').value.trim().toLowerCase();

  if (
    q &&
    !`${t.title} ${t.description} ${t.category}`
      .toLowerCase()
      .includes(q)
  ) {
    return false;
  }

  if (view === 'today' && t.due !== today()) return false;

  if (
    view === 'upcoming' &&
    (!t.due || t.due <= today() || t.done)
  ) {
    return false;
  }

  if (view === 'completed' && !t.done) return false;
  if (view === 'important' && !t.important) return false;

  if (categories.includes(view) && t.category !== view) {
    return false;
  }

  if (filter === 'active' && t.done) return false;
  if (filter === 'completed' && !t.done) return false;
  if (filter === 'important' && !t.important) return false;

  return true;
}

function taskHTML(t) {
  let overdue = !t.done && t.due && t.due < today();

  return `
    <article class="task ${t.done ? 'done' : ''}"
      style="--accent:${color(t.category)}">

      <button class="check"
        data-action="toggle"
        data-id="${t.id}"
        aria-label="Toggle complete">
      </button>

      <div class="task-content">
        <div class="task-title">${esc(t.title)}</div>

        ${t.description
          ? `<div class="desc">${esc(t.description)}</div>`
          : ''}

        <div class="meta">
          <span class="pill"
            style="background:${color(t.category)}22;color:${color(t.category)}">
            ${esc(t.category)}
          </span>

          <span class="pill ${t.priority}">
            ${t.priority[0].toUpperCase() + t.priority.slice(1)} priority
          </span>

          ${t.due ? `
            <span class="pill date"
              style="${overdue ? 'color:#ff7d89' : ''}">
              ▣ ${overdue ? 'Overdue · ' : ''}${esc(t.due)}
            </span>
          ` : ''}
        </div>
      </div>

      <div class="task-actions">
        <button class="icon-btn"
          data-action="star"
          data-id="${t.id}"
          title="Toggle important"
          style="${t.important ? 'color:#f6b544' : ''}">★</button>

        <button class="icon-btn"
          data-action="edit"
          data-id="${t.id}"
          title="Edit task">✎</button>

        <button class="icon-btn"
          data-action="delete"
          data-id="${t.id}"
          title="Delete task">⋮</button>
      </div>
    </article>
  `;
}

function render() {
  renderCategories();

  let list = tasks.filter(visible).sort((a, b) =>
    (a.done - b.done) ||
    ((a.due || '9999').localeCompare(b.due || '9999')) ||
    (
      { high: 0, medium: 1, low: 2 }[a.priority] -
      { high: 0, medium: 1, low: 2 }[b.priority]
    )
  );

  let active = list.filter(t => !t.done);
  let done = list.filter(t => t.done);

  $('#tasks').innerHTML =
    (active.length
      ? `<div class="task-list">${active.map(taskHTML).join('')}</div>`
      : '') +
    (done.length
      ? `<div class="section-label">✓ Completed <span>${done.length}</span></div>
         <div class="task-list">${done.map(taskHTML).join('')}</div>`
      : '') +
    (!list.length
      ? '<div class="empty"><strong>No tasks here</strong>Add a task or change your filters.</div>'
      : '');

  let total = tasks.length;
  let completed = tasks.filter(t => t.done).length;
  let todayTasks = tasks.filter(t => t.due === today());
  let todayDone = todayTasks.filter(t => t.done).length;

  let pct = todayTasks.length
    ? Math.round(todayDone / todayTasks.length * 100)
    : 0;

  $('#total').textContent = total;
  $('#done').textContent = completed;
  $('#active').textContent = total - completed;

  $('#overdue').textContent = tasks.filter(
    t => !t.done && t.due && t.due < today()
  ).length;

  $('#todayDone').textContent = todayDone;
  $('#todayRemaining').textContent =
    todayTasks.length - todayDone;

  $('#progressText').textContent =
    `${todayDone}/${todayTasks.length}`;

  $('#ring').style.setProperty('--progress', pct + '%');

  $('#summary').textContent =
    `${total} tasks · ${total - completed} active · ${completed} completed`;

  $('#nav-all').textContent = total;

  $('#nav-today').textContent = tasks.filter(
    t => t.due === today() && !t.done
  ).length;

  $('#nav-upcoming').textContent = tasks.filter(
    t => t.due > today() && !t.done
  ).length;

  $('#nav-completed').textContent = completed;

  $('#nav-important').textContent = tasks.filter(
    t => t.important && !t.done
  ).length;
}

// Create and update tasks
$('#taskForm').addEventListener('submit', e => {
  e.preventDefault();

  let title = $('#taskTitle').value.trim();
  if (!title) return;

  let data = {
    title,
    description: '',
    category: $('#category').value,
    priority: $('#priority').value,
    due: $('#dueDate').value,
    done: false,
    important: false
  };

  if (editing) {
    Object.assign(tasks.find(t => t.id === editing), data);
    editing = null;
    $('#submitBtn').textContent = '＋ Add Task';
    toast('Task updated');
  } else {
    tasks.unshift({
      id: Date.now(),
      ...data,
      created: Date.now()
    });
    toast('Task added');
  }

  e.target.reset();
  save();
  render();
});

// Complete, edit, star and delete tasks
$('#tasks').addEventListener('click', e => {
  let b = e.target.closest('[data-action]');
  if (!b) return;

  let t = tasks.find(x => x.id == b.dataset.id);
  if (!t) return;

  switch (b.dataset.action) {
    case 'toggle':
      t.done = !t.done;
      toast(t.done ? 'Task completed' : 'Task reopened');
      break;

    case 'star':
      t.important = !t.important;
      break;

    case 'delete':
      if (confirm(`Delete "${t.title}"?`)) {
        tasks = tasks.filter(x => x.id !== t.id);
      } else {
        return;
      }
      toast('Task deleted');
      break;

    case 'edit':
      editing = t.id;
      $('#taskTitle').value = t.title;
      $('#category').value = t.category;
      $('#priority').value = t.priority;
      $('#dueDate').value = t.due || '';
      $('#submitBtn').textContent = 'Save changes';
      $('#taskTitle').focus();
      return;
  }

  save();
  render();
});

// Sidebar navigation
$('#nav').addEventListener('click', e => {
  let b = e.target.closest('[data-view]');
  if (!b) return;

  view = b.dataset.view;
  filter = 'all';

  $('#pageTitle').textContent =
    b.querySelector('span').textContent;

  document.querySelectorAll('#nav button').forEach(x =>
    x.classList.toggle('active', x === b)
  );

  document.querySelectorAll('#tabs button').forEach(x =>
    x.classList.toggle('active', x.dataset.filter === 'all')
  );

  render();
});

// Category navigation
$('#categoryList').addEventListener('click', e => {
  let b = e.target.closest('[data-category]');
  if (!b) return;

  view = b.dataset.category;
  filter = 'all';
  $('#pageTitle').textContent = view;

  document.querySelectorAll('#nav button').forEach(
    x => x.classList.remove('active')
  );

  render();
});

// Task filters
$('#tabs').addEventListener('click', e => {
  let b = e.target.closest('[data-filter]');
  if (!b) return;

  filter = b.dataset.filter;

  document.querySelectorAll('#tabs button').forEach(x =>
    x.classList.toggle('active', x === b)
  );

  render();
});

// Search
$('#search').addEventListener('input', render);

// Dark/light theme
$('#theme').addEventListener('click', () => {
  document.body.classList.toggle('light');

  $('#theme').textContent =
    document.body.classList.contains('light') ? '☾' : '☼';
});

// Add custom category
$('#addList').addEventListener('click', () => {
  let c = prompt('Name your new list:');

  if (
    c && c.trim() &&
    !categories.some(
      x => x.toLowerCase() === c.trim().toLowerCase()
    )
  ) {
    categories.push(c.trim());
    save();
    render();
  }
});

// Delete completed tasks
$('#clearDone').addEventListener('click', () => {
  let n = tasks.filter(t => t.done).length;

  if (n && confirm(`Delete all ${n} completed tasks?`)) {
    tasks = tasks.filter(t => !t.done);
    save();
    render();
    toast('Completed tasks cleared');
  }
});

// Initial rendering
render();