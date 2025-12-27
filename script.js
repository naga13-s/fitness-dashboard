// 1. Service Worker Registration for Installation
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('Service Worker registered!'))
            .catch(err => console.log('Service Worker failed: ', err));
    });
}

class FitnessApp {
    constructor() {
        // Load data from LocalStorage
        this.workouts = JSON.parse(localStorage.getItem('workouts')) || [];
        this.meals = JSON.parse(localStorage.getItem('meals')) || [];
        this.goals = JSON.parse(localStorage.getItem('goals')) || {
            dailyCalorieGoal: 2000,
            proteinGoal: 150,
            workoutGoal: 4,
            weightGoal: 0
        };
        this.charts = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDates();
        this.loadGoals();
        this.updateDashboard();
    }

    setupEventListeners() {
        // Tab Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Forms
        document.getElementById('workoutForm').addEventListener('submit', (e) => this.addWorkout(e));
        document.getElementById('nutritionForm').addEventListener('submit', (e) => this.addMeal(e));
        document.getElementById('goalsForm').addEventListener('submit', (e) => this.saveGoals(e));

        // History & Data Controls
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportData());

        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearAllData());
    }

    setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        const workoutDate = document.getElementById('workoutDate');
        const mealDate = document.getElementById('mealDate');
        
        if (workoutDate) workoutDate.value = today;
        if (mealDate) mealDate.value = today;
    }

    // Tab Switching Logic - Keeps the app fast
    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
            tab.classList.remove('active');
        });

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeTab = document.getElementById(tabName);
        if (activeTab) {
            activeTab.style.display = 'block';
            activeTab.classList.add('active');
        }

        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        // Refresh data based on tab
        if (tabName === 'dashboard') this.updateDashboard();
        if (tabName === 'workout') this.displayWorkouts();
        if (tabName === 'nutrition') this.displayMeals();
        if (tabName === 'goals') this.displayGoals();
        if (tabName === 'history') this.displayHistory();
    }

    addWorkout(e) {
        e.preventDefault();
        const workout = {
            id: Date.now(),
            date: document.getElementById('workoutDate').value,
            type: document.getElementById('workoutType').value,
            duration: parseInt(document.getElementById('workoutDuration').value),
            calories: parseInt(document.getElementById('workoutCalories').value),
            notes: document.getElementById('workoutNotes').value
        };

        this.workouts.unshift(workout);
        this.saveData();
        this.displayWorkouts();
        document.getElementById('workoutForm').reset();
        this.setDefaultDates();
        this.updateDashboard();
        this.showNotification('Workout logged!');
    }

    addMeal(e) {
        e.preventDefault();
        const meal = {
            id: Date.now(),
            date: document.getElementById('mealDate').value,
            type: document.getElementById('mealType').value,
            name: document.getElementById('mealName').value,
            calories: parseInt(document.getElementById('calories').value),
            protein: parseFloat(document.getElementById('protein').value) || 0,
            carbs: parseFloat(document.getElementById('carbs').value) || 0,
            fat: parseFloat(document.getElementById('fat').value) || 0
        };

        this.meals.unshift(meal);
        this.saveData();
        this.displayMeals();
        document.getElementById('nutritionForm').reset();
        this.setDefaultDates();
        this.updateDashboard();
        this.showNotification('Meal logged!');
    }

    // FIXED DELETE METHODS
    deleteWorkout(id) {
        if (confirm('Delete this workout?')) {
            this.workouts = this.workouts.filter(w => w.id !== id);
            this.saveData();
            this.displayWorkouts();
            this.updateDashboard();
        }
    }

    deleteMeal(id) {
        if (confirm('Delete this meal?')) {
            this.meals = this.meals.filter(m => m.id !== id);
            this.saveData();
            this.displayMeals();
            this.updateDashboard();
        }
    }

    displayWorkouts() {
        const container = document.getElementById('workoutList');
        if (!container) return;
        if (this.workouts.length === 0) {
            container.innerHTML = '<div class="empty-state">No workouts logged.</div>';
            return;
        }

        container.innerHTML = this.workouts.slice(0, 10).map(workout => `
            <div class="list-item">
                <div class="list-item-content">
                    <h4>${workout.type}</h4>
                    <p>${this.formatDate(workout.date)} | ${workout.duration} min</p>
                </div>
                <div class="list-item-value">${workout.calories} kcal</div>
                <button class="delete-btn" onclick="app.deleteWorkout(${workout.id})">Delete</button>
            </div>
        `).join('');
    }

    displayMeals() {
        const container = document.getElementById('mealList');
        if (!container) return;
        if (this.meals.length === 0) {
            container.innerHTML = '<div class="empty-state">No meals logged.</div>';
            return;
        }

        container.innerHTML = this.meals.slice(0, 10).map(meal => `
            <div class="list-item">
                <div class="list-item-content">
                    <h4>${meal.name}</h4>
                    <p>${this.formatDate(meal.date)} | P:${meal.protein}g</p>
                </div>
                <div class="list-item-value">${meal.calories} kcal</div>
                <button class="delete-btn" onclick="app.deleteMeal(${meal.id})">Delete</button>
            </div>
        `).join('');
    }

    updateDashboard() {
        const today = new Date().toISOString().split('T')[0];
        const todayWorkouts = this.workouts.filter(w => w.date === today);
        const todayMeals = this.meals.filter(m => m.date === today);

        const burned = todayWorkouts.reduce((sum, w) => sum + w.calories, 0);
        const consumed = todayMeals.reduce((sum, m) => sum + m.calories, 0);

        document.getElementById('caloriesBurned').textContent = burned;
        document.getElementById('caloriesConsumed').textContent = consumed;
        document.getElementById('netCalories').textContent = consumed - burned;
        document.getElementById('workoutCount').textContent = todayWorkouts.length;

        this.updateCharts();
    }

    updateCharts() {
        this.updateCaloriesChart();
        this.updateMacroChart();
    }

    updateCaloriesChart() {
        const ctx = document.getElementById('caloriesChart');
        if (!ctx) return;
        const last7Days = this.getLast7Days();
        
        const data = last7Days.map(date => {
            return {
                burned: this.workouts.filter(w => w.date === date).reduce((s, w) => s + w.calories, 0),
                consumed: this.meals.filter(m => m.date === date).reduce((s, m) => s + m.calories, 0)
            };
        });

        if (this.charts.calories) this.charts.calories.destroy();

        this.charts.calories = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last7Days.map(d => this.formatDate(d)),
                datasets: [
                    { label: 'Consumed', data: data.map(d => d.consumed), borderColor: '#ff6b6b', fill: true },
                    { label: 'Burned', data: data.map(d => d.burned), borderColor: '#4ecdc4', fill: true }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    updateMacroChart() {
        const ctx = document.getElementById('macroChart');
        if (!ctx) return;
        const today = new Date().toISOString().split('T')[0];
        const todayMeals = this.meals.filter(m => m.date === today);

        const p = todayMeals.reduce((sum, m) => sum + m.protein, 0);
        const c = todayMeals.reduce((sum, m) => sum + m.carbs, 0);
        const f = todayMeals.reduce((sum, m) => sum + m.fat, 0);

        if (this.charts.macro) this.charts.macro.destroy();
        this.charts.macro = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Protein', 'Carbs', 'Fat'],
                datasets: [{ data: [p, c, f], backgroundColor: ['#ff6b6b', '#4ecdc4', '#ffe66d'] }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    saveGoals(e) {
        e.preventDefault();
        this.goals = {
            dailyCalorieGoal: parseInt(document.getElementById('dailyCalorieGoal').value),
            proteinGoal: parseInt(document.getElementById('proteinGoal').value),
            workoutGoal: parseInt(document.getElementById('workoutGoal').value),
            weightGoal: parseFloat(document.getElementById('weightGoal').value)
        };
        localStorage.setItem('goals', JSON.stringify(this.goals));
        this.displayGoals();
        this.showNotification('Goals updated!');
    }

    loadGoals() {
        document.getElementById('dailyCalorieGoal').value = this.goals.dailyCalorieGoal;
        document.getElementById('proteinGoal').value = this.goals.proteinGoal;
        document.getElementById('workoutGoal').value = this.goals.workoutGoal;
        document.getElementById('weightGoal').value = this.goals.weightGoal;
    }

    displayGoals() {
        const container = document.getElementById('goalsDisplay');
        if (!container) return;
        const today = new Date().toISOString().split('T')[0];
        const consumed = this.meals.filter(m => m.date === today).reduce((s, m) => s + m.calories, 0);
        
        container.innerHTML = `
            <div class="goal-card">
                <h4>Calorie Goal</h4>
                <div class="goal-progress"><div class="goal-progress-bar" style="width: ${Math.min((consumed / this.goals.dailyCalorieGoal) * 100, 100)}%"></div></div>
                <p>${consumed} / ${this.goals.dailyCalorieGoal} kcal</p>
            </div>
        `;
    }

    getWeeklyWorkouts() {
        const weekAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
        return this.workouts.filter(w => new Date(w.date) >= weekAgo).length;
    }

    displayHistory() {
        const container = document.getElementById('historyContainer');
        const data = [...this.workouts, ...this.meals].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        container.innerHTML = data.slice(0, 20).map(item => `
            <div class="list-item">
                <p>${item.name || item.type} - ${this.formatDate(item.date)}</p>
                <button class="delete-btn" onclick="${item.name ? 'app.deleteMeal' : 'app.deleteWorkout'}(${item.id})">Delete</button>
            </div>
        `).join('');
    }

    exportData() {
        const blob = new Blob([JSON.stringify({workouts: this.workouts, meals: this.meals})], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fitness_data.json';
        a.click();
    }

    clearAllData() {
        if (confirm('Clear everything?')) {
            localStorage.clear();
            location.reload();
        }
    }

    saveData() {
        localStorage.setItem('workouts', JSON.stringify(this.workouts));
        localStorage.setItem('meals', JSON.stringify(this.meals));
    }

    getLast7Days() {
        return [...Array(7).keys()].map(i => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });
    }

    formatDate(s) {
        return new Date(s).toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
    }

    showNotification(msg) {
        const n = document.createElement('div');
        n.style.cssText = "position:fixed;top:20px;right:20px;background:#4ecdc4;color:white;padding:10px;border-radius:5px;z-index:999";
        n.textContent = msg;
        document.body.appendChild(n);
        setTimeout(() => n.remove(), 2000);
    }
}

// Global initialization
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new FitnessApp();
    window.app = app;
    app.switchTab('dashboard');
});