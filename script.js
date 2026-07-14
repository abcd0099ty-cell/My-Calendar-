// --- DOM Elements ---
const printBtn = document.getElementById('printCalendar');
const exportICSBtn = document.getElementById('exportICS');

const calendar = document.getElementById('calendar');
const monthDisplay = document.getElementById('monthDisplay');
const yearDisplay = document.getElementById('yearDisplay');

const monthPopup = document.getElementById('monthPopup');
const yearPopup = document.getElementById('yearPopup');
const monthGrid = document.getElementById('monthGrid');
const yearGrid = document.getElementById('yearGrid');
const prevYearRangeBtn = document.getElementById('prevYearRange');
const nextYearRangeBtn = document.getElementById('nextYearRange');

let yearRangeStart = new Date().getFullYear() - 4; 

const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const todayBtn = document.getElementById('todayBtn');
const themeBtn = document.getElementById('themeBtn');

// Event Popup Elements
const popup = document.getElementById('popup');
const closePopupBtn = document.getElementById('closePopup');
const saveEventBtn = document.getElementById('saveEvent');
const deleteEventBtn = document.getElementById('deleteEvent');
const newEventBtn = document.getElementById('newEvent');

const eventTitleInput = document.getElementById('eventTitle');
const eventDescInput = document.getElementById('eventDescription');
const eventTimeInput = document.getElementById('eventTime');
const selectedDateDisplay = document.getElementById('selectedDate');
const eventCategoryInput = document.getElementById('eventCategory');
const eventRepeatInput = document.getElementById('eventRepeat');

// Custom Category Manager Elements
const categoryPopup = document.getElementById('categoryPopup');
const manageCategoriesBtn = document.getElementById('manageCategoriesBtn');
const closeCategoryPopupBtn = document.getElementById('closeCategoryPopup');
const customCategoryList = document.getElementById('customCategoryList');
const newCatName = document.getElementById('newCatName');
const newCatColor = document.getElementById('newCatColor');
const addCatBtn = document.getElementById('addCatBtn');

// Sidebar & Top Navigation Elements
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const topNotifyBtn = document.getElementById('topNotifyBtn');
const bellBadge = document.getElementById('bellBadge');
const toastContainer = document.getElementById('toastContainer');
const eventList = document.getElementById('eventList');
const searchEvent = document.getElementById('searchEvent');

// --- State Variables ---
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let clickedDate = null;
let draggedDateKey = null;
let unseenNotifications = false;

// Load Saved Events & Categories
let events = JSON.parse(localStorage.getItem('calendarEvents')) || {};
let categories = JSON.parse(localStorage.getItem('calendarCategories')) || {
    "work": { name: "Work", color: "#ef4444" },
    "personal": { name: "Personal", color: "#22c55e" },
    "birthday": { name: "Birthday", color: "#eab308" },
    "holiday": { name: "Holiday", color: "#3b82f6" }
};

// Indian Holidays List
const holidaysList = {
    "01-26": "Republic Day",
    "08-15": "Independence Day",
    "10-02": "Gandhi Jayanti",
    "12-25": "Christmas Day",
    "03-14": "Holi Festival",
    "10-20": "Diwali Festival"
};

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// --- Initialization ---
function init() {
    renderCategoryDropdown();
    renderCalendar();
    renderEventList();
    loadTheme();
    scheduleMidnightUpdate(); 
    startNotificationCheck(); 
}

// --- Toggle Sidebar (Hamburger) ---
menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.toggle('active');
});

document.addEventListener('click', (e) => {
    if (sidebar.classList.contains('active') && !sidebar.contains(e.target) && e.target !== menuToggle) {
        sidebar.classList.remove('active');
    }
});

// --- Category Manager Dropdowns & Setup ---
function renderCategoryDropdown() {
    eventCategoryInput.innerHTML = '';
    Object.keys(categories).forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.innerText = categories[key].name;
        eventCategoryInput.appendChild(option);
    });
}

// Manage Category Button Actions
manageCategoriesBtn.addEventListener('click', () => {
    renderCategoryManagerList();
    categoryPopup.style.display = 'flex';
});

closeCategoryPopupBtn.addEventListener('click', () => {
    categoryPopup.style.display = 'none';
    renderCategoryDropdown();
});

// Add New Category Action
addCatBtn.addEventListener('click', () => {
    const name = newCatName.value.trim();
    const color = newCatColor.value;
    
    if (name === '') {
        newCatName.style.borderColor = '#ef4444';
        return;
    }
    
    const key = name.toLowerCase().replace(/\s+/g, '-');
    if (categories[key]) {
        showCustomAlert("Error", "Category already exists!", "work");
        return;
    }
    
    categories[key] = { name: name, color: color };
    localStorage.setItem('calendarCategories', JSON.stringify(categories));
    
    newCatName.value = '';
    newCatName.style.borderColor = '';
    renderCategoryManagerList();
    showCustomAlert("Category Added", `Created: ${name}`, "personal");
});

// Render List inside Category Manager Popup
function renderCategoryManagerList() {
    customCategoryList.innerHTML = '';
    Object.keys(categories).forEach(key => {
        const cat = categories[key];
        const li = document.createElement('li');
        
        // Prevents deleting system default categories
        const systemDefaults = ["work", "personal", "birthday", "holiday"];
        const canDelete = !systemDefaults.includes(key);
        
        li.innerHTML = `
            <div class="cat-item-left">
                <span class="cat-color-preview" style="background-color: ${cat.color}"></span>
                <span>${cat.name}</span>
            </div>
            ${canDelete ? `<button class="delete-cat-btn" data-key="${key}"><i class="fa-solid fa-trash-can"></i></button>` : `<small style="color:gray;">Default</small>`}
        `;
        
        if (canDelete) {
            li.querySelector('.delete-cat-btn').addEventListener('click', (e) => {
                delete categories[key];
                localStorage.setItem('calendarCategories', JSON.stringify(categories));
                renderCategoryManagerList();
            });
        }
        
        customCategoryList.appendChild(li);
    });
}

// --- Custom Alert Toast ---
function showCustomAlert(title, message, category = 'work') {
    const toast = document.createElement('div');
    toast.className = 'toast-card';
    
    const color = (categories[category] && categories[category].color) || '#ef4444';
    toast.style.borderLeft = `5px solid ${color}`;
    
    toast.innerHTML = `
        <div style="font-size:20px; margin-right:5px;">🔔</div>
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transform = 'translateY(-20px)';
        toast.style.opacity = '0';
        toast.style.transition = '0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// --- Recurring Events Check Engine ---
// returns {title, description, time, category, repeat} or null
function getActiveEventForDate(dateString) {
    // 1. Direct single once-event match check
    if (events[dateString]) {
        return events[dateString];
    }
    
    // 2. Scan for matching recurring events from memory database
    const targetDate = new Date(dateString + 'T00:00:00');
    let matchedEvent = null;
    
    Object.keys(events).forEach(origDateStr => {
        const event = events[origDateStr];
        const origDate = new Date(origDateStr + 'T00:00:00');
        
        // Skip check if the evaluated date is earlier than original event setup creation
        if (targetDate < origDate) return;
        
        if (event.repeat === 'daily') {
            matchedEvent = event;
        } else if (event.repeat === 'weekly') {
            if (targetDate.getDay() === origDate.getDay()) {
                matchedEvent = event;
            }
        } else if (event.repeat === 'monthly') {
            if (targetDate.getDate() === origDate.getDate()) {
                matchedEvent = event;
            }
        } else if (event.repeat === 'yearly') {
            if (targetDate.getDate() === origDate.getDate() && targetDate.getMonth() === origDate.getMonth()) {
                matchedEvent = event;
            }
        }
    });
    
    return matchedEvent;
}

// --- Render Calendar ---
function renderCalendar() {
    calendar.classList.remove('animate-calendar');
    void calendar.offsetWidth; 
    calendar.classList.add('animate-calendar');
    
    calendar.innerHTML = '';
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const paddingDays = firstDay.getDay();
    
    monthDisplay.innerText = months[currentMonth];
    yearDisplay.innerText = currentYear;

    for (let i = 1; i <= paddingDays + daysInMonth; i++) {
        const daySquare = document.createElement('div');
        
        if (i > paddingDays) {
            daySquare.classList.add('date');
            const dayNumber = i - paddingDays;
            daySquare.innerText = dayNumber;
            
            const dayString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
            
            const today = new Date();
            if (dayNumber === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
                daySquare.classList.add('today');
            }
            
            if (clickedDate === dayString) {
                daySquare.classList.add('selected');
            }
            
            // Render Dots for standard or Recurring Events
            const dotsContainer = document.createElement('div');
            dotsContainer.classList.add('category-dots');
            let hasDot = false;

            const activeEvent = getActiveEventForDate(dayString);
            if (activeEvent) {
                const categoryKey = activeEvent.category || 'work';
                const catDetails = categories[categoryKey] || { color: '#ef4444' };
                
                const dot = document.createElement('span');
                dot.className = `dot`;
                dot.style.backgroundColor = catDetails.color;
                dotsContainer.appendChild(dot);
                hasDot = true;
            }

            const monthDayKey = `${String(currentMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
            if (holidaysList[monthDayKey]) {
                const holidayDot = document.createElement('span');
                holidayDot.className = 'dot';
                holidayDot.style.backgroundColor = '#3b82f6';
                dotsContainer.appendChild(holidayDot);
                hasDot = true;
                
                daySquare.title = holidaysList[monthDayKey];
                daySquare.style.borderBottom = "2px dashed #3b82f6"; 
            }

            if (hasDot) {
                daySquare.appendChild(dotsContainer);
            }
            
            daySquare.addEventListener('click', () => openPopup(dayString));

            // Drag & Drop
            daySquare.addEventListener('dragover', (e) => {
                e.preventDefault();
                daySquare.classList.add('drag-over');
            });

            daySquare.addEventListener('dragleave', () => {
                daySquare.classList.remove('drag-over');
            });

            daySquare.addEventListener('drop', () => {
                daySquare.classList.remove('drag-over');
                if (draggedDateKey && draggedDateKey !== dayString) {
                    if (events[draggedDateKey]) {
                        events[dayString] = { ...events[draggedDateKey] };
                        delete events[draggedDateKey]; 
                        localStorage.setItem('calendarEvents', JSON.stringify(events));
                    }
                    draggedDateKey = null;
                    renderCalendar();
                    renderEventList();
                }
            });

        } else {
            daySquare.classList.add('empty');
        }
        
        calendar.appendChild(daySquare);
    }
}

// --- Popup Opening and Actions ---
function openPopup(date) {
    clickedDate = date;
    const dateObj = new Date(date + 'T00:00:00'); 
    selectedDateDisplay.innerText = dateObj.toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    
    // Check if there is an exact or recurring event matching
    const event = events[date]; 
    
    if (event) {
        eventTitleInput.value = event.title;
        eventDescInput.value = event.description;
        eventTimeInput.value = event.time;
        eventCategoryInput.value = event.category || 'work';
        eventRepeatInput.value = event.repeat || 'none';
        deleteEventBtn.style.display = 'block';
    } else {
        eventTitleInput.value = '';
        eventDescInput.value = '';
        eventTimeInput.value = '';
        eventCategoryInput.value = Object.keys(categories)[0]; 
        eventRepeatInput.value = 'none';
        deleteEventBtn.style.display = 'none';
    }
    
    popup.style.display = 'flex';
}

function closePopup() {
    popup.style.display = 'none';
    clickedDate = null;
    eventTitleInput.style.borderColor = '#e2e8f0';
}

function saveEvent() {
    if (eventTitleInput.value.trim() === '') {
        eventTitleInput.style.borderColor = '#ef4444';
        return;
    }
    
    events[clickedDate] = {
        title: eventTitleInput.value.trim(),
        description: eventDescInput.value.trim(),
        time: eventTimeInput.value,
        category: eventCategoryInput.value,
        repeat: eventRepeatInput.value,
        notified: false 
    };
    
    localStorage.setItem('calendarEvents', JSON.stringify(events));
    closePopup();
    renderCalendar();
    renderEventList();
}

function deleteEvent() {
    delete events[clickedDate];
    localStorage.setItem('calendarEvents', JSON.stringify(events));
    closePopup();
    renderCalendar();
    renderEventList();
}

// --- Sidebar Upcoming Event List ---
function renderEventList(filterText = '') {
    eventList.innerHTML = '';
    
    // We display original events explicitly
    const sortedDates = Object.keys(events).sort((a, b) => new Date(a) - new Date(b));
    let hasEvents = false;
    
    sortedDates.forEach(date => {
        const event = events[date];
        if (event.title.toLowerCase().includes(filterText.toLowerCase()) || 
            event.description.toLowerCase().includes(filterText.toLowerCase())) {
            
            hasEvents = true;
            const li = document.createElement('li');
            li.setAttribute('draggable', true);
            
            const dateObj = new Date(date + 'T00:00:00');
            const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            const catColor = (categories[event.category] && categories[event.category].color) || '#ef4444';
            
            li.style.borderLeft = `5px solid ${catColor}`;
            
            // Add symbol icon indicators for recurring status
            let repeatIcon = '';
            if (event.repeat === 'daily') repeatIcon = ' 🔁 (Daily)';
            else if (event.repeat === 'weekly') repeatIcon = ' 🔁 (Weekly)';
            else if (event.repeat === 'monthly') repeatIcon = ' 🔁 (Monthly)';
            else if (event.repeat === 'yearly') repeatIcon = ' 🔁 (Yearly)';
            
            li.innerHTML = `<strong>${event.title}</strong>${repeatIcon}<br><small>${formattedDate} ${event.time ? 'at ' + event.time : ''}</small>`;
            
            li.addEventListener('click', () => {
                currentYear = dateObj.getFullYear();
                currentMonth = dateObj.getMonth();
                renderCalendar();
                openPopup(date);
            });

            li.addEventListener('dragstart', () => { draggedDateKey = date; });
            li.addEventListener('dragend', () => { draggedDateKey = null; });
            
            eventList.appendChild(li);
        }
    });
    
    if (!hasEvents) {
        eventList.innerHTML = '<li>No events found.</li>';
    }
}

// --- Real-time Notification Engine ---
function startNotificationCheck() {
    setInterval(() => {
        const now = new Date();
        const currentDateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const currentTimeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const activeEvent = getActiveEventForDate(currentDateString);
        
        if (activeEvent && activeEvent.time === currentTimeString) {
            // Because recurring alerts evaluate dynamically, avoid spamming within the same minute
            const notificationId = `${currentDateString}-${activeEvent.time}`;
            let sentNotifications = JSON.parse(sessionStorage.getItem('sentNotifications')) || [];
            
            if (!sentNotifications.includes(notificationId)) {
                sentNotifications.push(notificationId);
                sessionStorage.setItem('sentNotifications', JSON.stringify(sentNotifications));
                
                // Active top red badge
                unseenNotifications = true;
                bellBadge.classList.add('active');

                // Custom slide notification display
                showCustomAlert(`📅 Reminder: ${activeEvent.title}`, `Due right now! ${activeEvent.description || ''}`, activeEvent.category);
            }
        }
    }, 15000); 
}

// --- Navigation ---
prevBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
});

nextBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar();
});

todayBtn.addEventListener('click', () => {
    currentMonth = new Date().getMonth();
    currentYear = new Date().getFullYear();
    renderCalendar();
});

// Top bar bell listener
topNotifyBtn.addEventListener('click', () => {
    if (unseenNotifications) {
        unseenNotifications = false;
        bellBadge.classList.remove('active');
        showCustomAlert("Inbox Cleaned", "Unread alarms checked.", "personal");
    } else {
        showCustomAlert("Notifications", "No unread alarms.", "holiday");
    }
});

// Theme Setup
function loadTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
        themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
}

themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    if (document.body.classList.contains('dark')) {
        localStorage.setItem('theme', 'dark');
        themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        localStorage.setItem('theme', 'light');
        themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
});

saveEventBtn.addEventListener('click', saveEvent);
deleteEventBtn.addEventListener('click', deleteEvent);
