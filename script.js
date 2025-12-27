// Fitness Dashboard Application

class FitnessApp {
    constructor() {
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

        // Workout Form
        document.getElementById('workoutForm').addEventListener('submit', (e) => this.addWorkout(e));

        // Nutrition Form
        document.getElementById('nutritionForm').addEventListener('submit', (e) => this.addMeal(e));

        // Goals Form
        document.getElementById('goalsForm').addEventListener('submit', (e) => this.saveGoals(e));

        // History Controls
        document.getElementById('filterBtn').addEventListener('click', () => this.filterHistory());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetHistoryFilter());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAllData());
    }

    setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('workoutDate').value = today;
        document.getElementById('mealDate').value = today;
        document.getElementById('historyDate').value = today;
    }

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Remove active class from all buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(tabName).classList.add('active');
        event.target.classList.add('active');

        // Update content based on tab
        if (tabName === 'dashboard') {
            this.updateDashboard();
        } else if (tabName === 'workout') {
            this.displayWorkouts();
        } else if (tabName === 'nutrition') {
            this.displayMeals();
        } else if (tabName === 'goals') {
            this.displayGoals();
        } else if (tabName === 'history') {
            this.displayHistory();
        }
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
        this.showNotification('Workout logged successfully!');
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
        this.showNotification('Meal logged successfully!');
    }

    deleteWorkout(id) {
        this.workouts = this.workouts.filter(w => w.id !== id);
        this.saveData();
        this.displayWorkouts();
        this.updateDashboard();
    }

    deleteMeal(id) {
        this.meals = this.meals.filter(m => m.id !== id);
        this.saveData();
        this.displayMeals();
        this.updateDashboard();
    }

    displayWorkouts() {
        const container = document.getElementById('workoutList');
        if (this.workouts.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No workouts logged yet. Start by logging your first workout!</p></div>';
            return;
        }

        container.innerHTML = this.workouts.slice(0, 10).map(workout => `
            <div class="list-item">
                <div class="list-item-content">
                    <h4>${workout.type}</h4>
                    <p class="list-item-meta">${this.formatDate(workout.date)} | ${workout.duration} min</p>
                </div>
                <div class="list-item-value">${workout.calories} kcal</div>
                <div class="list-item-actions">
                    <button class="delete-btn" onclick="app.deleteWorkout(${workout.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }

    displayMeals() {
        const container = document.getElementById('mealList');
        if (this.meals.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No meals logged yet. Start tracking your nutrition!</p></div>';
            return;
        }

        container.innerHTML = this.meals.slice(0, 10).map(meal => `
            <div class="list-item">
                <div class="list-item-content">
                    <h4>${meal.name}</h4>
                    <p class="list-item-meta">${this.formatDate(meal.date)} | ${meal.type} | P: ${meal.protein}g C: ${meal.carbs}g F: ${meal.fat}g</p>
                </div>
                <div class="list-item-value">${meal.calories} kcal</div>
                <div class="list-item-actions">
                    <button class="delete-btn" onclick="app.deleteMeal(${meal.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }

    updateDashboard() {
        const today = new Date().toISOString().split('T')[0];
        const todayWorkouts = this.workouts.filter(w => w.date === today);
        const todayMeals = this.meals.filter(m => m.date === today);

        // Update summary cards
        const caloriesBurned = todayWorkouts.reduce((sum, w) => sum + w.calories, 0);
        const caloriesConsumed = todayMeals.reduce((sum, m) => sum + m.calories, 0);
        const netCalories = caloriesConsumed - caloriesBurned;

        document.getElementById('caloriesBurned').textContent = caloriesBurned;
        document.getElementById('caloriesConsumed').textContent = caloriesConsumed;
        document.getElementById('netCalories').textContent = netCalories;
        document.getElementById('workoutCount').textContent = todayWorkouts.length;

        // Update charts
        this.updateCharts();
    }

    updateCharts() {
        this.updateCaloriesChart();
        this.updateMacroChart();
    }

    updateCaloriesChart() {
        const ctx = document.getElementById('caloriesChart').getContext('2d');
        const last7Days = this.getLast7Days();
        
        const data = last7Days.map(date => {
            const workouts = this.workouts.filter(w => w.date === date);
            const meals = this.meals.filter(m => m.date === date);
            return {
                burned: workouts.reduce((sum, w) => sum + w.calories, 0),
                consumed: meals.reduce((sum, m) => sum + m.calories, 0)
            };
        });

        if (this.charts.calories) {
            this.charts.calories.destroy();
        }

        this.charts.calories = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last7Days.map(d => this.formatDate(d)),
                datasets: [
                    {
                        label: 'Calories Consumed',
                        data: data.map(d => d.consumed),
                        borderColor: '#ff6b6b',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Calories Burned',
                        data: data.map(d => d.burned),
                        borderColor: '#4ecdc4',
                        backgroundColor: 'rgba(78, 205, 196, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Calories'
                        }
                    }
                }
            }
        });
    }

    updateMacroChart() {
        const ctx = document.getElementById('macroChart').getContext('2d');
        const today = new Date().toISOString().split('T')[0];
        const todayMeals = this.meals.filter(m => m.date === today);

        const protein = todayMeals.reduce((sum, m) => sum + m.protein, 0);
        const carbs = todayMeals.reduce((sum, m) => sum + m.carbs, 0);
        const fat = todayMeals.reduce((sum, m) => sum + m.fat, 0);

        if (this.charts.macro) {
            this.charts.macro.destroy();
        }

        this.charts.macro = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Protein', 'Carbohydrates', 'Fat'],
                datasets: [{
                    data: [protein, carbs, fat],
                    backgroundColor: [
                        '#ff6b6b',
                        '#4ecdc4',
                        '#ffe66d'
                    ],
                    borderColor: [
                        '#ff5252',
                        '#45b8ad',
                        '#ffc93d'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                }
            }
        });
    }

    saveGoals(e) {
        e.preventDefault();
        this.goals = {
            dailyCalorieGoal: parseInt(document.getElementById('dailyCalorieGoal').value) || 2000,
            proteinGoal: parseInt(document.getElementById('proteinGoal').value) || 150,
            workoutGoal: parseInt(document.getElementById('workoutGoal').value) || 4,
            weightGoal: parseFloat(document.getElementById('weightGoal').value) || 0
        };

        localStorage.setItem('goals', JSON.stringify(this.goals));
        this.displayGoals();
        this.showNotification('Goals saved successfully!');
    }

    loadGoals() {
        document.getElementById('dailyCalorieGoal').value = this.goals.dailyCalorieGoal;
        document.getElementById('proteinGoal').value = this.goals.proteinGoal;
        document.getElementById('workoutGoal').value = this.goals.workoutGoal;
        document.getElementById('weightGoal').value = this.goals.weightGoal;
    }

    displayGoals() {
        const container = document.getElementById('goalsDisplay');
        const today = new Date().toISOString().split('T')[0];
        const todayWorkouts = this.workouts.filter(w => w.date === today);
        const todayMeals = this.meals.filter(m => m.date === today);
        const todayProtein = todayMeals.reduce((sum, m) => sum + m.protein, 0);

        const weeklyWorkouts = this.getWeeklyWorkouts();

        container.innerHTML = `
            <div class="goal-card">
                <h4>Daily Calorie Goal</h4>
                <p>Goal: ${this.goals.dailyCalorieGoal} kcal</p>
                <div class="goal-progress">
                    <div class="goal-progress-bar" style="width: ${Math.min((todayMeals.reduce((s, m) => s + m.calories, 0) / this.goals.dailyCalorieGoal) * 100, 100)}%"></div>
                </div>
                <p>${todayMeals.reduce((s, m) => s + m.calories, 0)} / ${this.goals.dailyCalorieGoal} kcal</p>
            </div>

            <div class="goal-card">
                <h4>Daily Protein Goal</h4>
                <p>Goal: ${this.goals.proteinGoal}g</p>
                <div class="goal-progress">
                    <div class="goal-progress-bar" style="width: ${Math.min((todayProtein / this.goals.proteinGoal) * 100, 100)}%"></div>
                </div>
                <p>${todayProtein.toFixed(1)} / ${this.goals.proteinGoal}g</p>
            </div>

            <div class="goal-card">
                <h4>Weekly Workout Goal</h4>
                <p>Goal: ${this.goals.workoutGoal} sessions/week</p>
                <div class="goal-progress">
                    <div class="goal-progress-bar" style="width: ${Math.min((weeklyWorkouts / this.goals.workoutGoal) * 100, 100)}%"></div>
                </div>
                <p>${weeklyWorkouts} / ${this.goals.workoutGoal} sessions</p>
            </div>
        `;
    }

    getWeeklyWorkouts() {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return this.workouts.filter(w => new Date(w.date) >= weekAgo).length;
    }

    displayHistory() {
        this.displayHistoryFiltered(null);
    }

    displayHistoryFiltered(filterDate) {
        const container = document.getElementById('historyContainer');
        let filteredData = [];

        if (filterDate) {
            filteredData = [
                ...this.workouts.filter(w => w.date === filterDate),
                ...this.meals.filter(m => m.date === filterDate)
            ];
        } else {
            filteredData = [...this.workouts, ...this.meals];
        }

        filteredData.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (filteredData.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No data found for the selected date.</p></div>';
            return;
        }

        container.innerHTML = filteredData.slice(0, 50).map(item => {
            if (item.type === 'Breakfast' || item.type === 'Lunch' || item.type === 'Dinner' || item.type === 'Snack') {
                // It's a meal
                return `
                    <div class="list-item">
                        <div class="list-item-content">
                            <h4>🍽️ ${item.name}</h4>
                            <p class="list-item-meta">${this.formatDate(item.date)} | ${item.type} | P: ${item.protein}g C: ${item.carbs}g F: ${item.fat}g</p>
                        </div>
                        <div class="list-item-value">${item.calories} kcal</div>
                        <div class="list-item-actions">
                            <button class="delete-btn" onclick="app.deleteMeal(${item.id})">Delete</button>
                        </div>
                    </div>
                `;
            } else {
                // It's a workout
                return `
                    <div class="list-item">
                        <div class="list-item-content">
                            <h4>💪 ${item.type}</h4>
                            <p class="list-item-meta">${this.formatDate(item.date)} | ${item.duration} min | ${item.notes}</p>
                        </div>
                        <div class="list-item-value">${item.calories} kcal</div>
                        <div class="list-item-actions">
                            <button class="delete-btn" onclick="app.deleteWorkout(${item.id})">Delete</button>
                        </div>
                    </div>
                `;
            }
        }).join('');
    }

    filterHistory() {
        const date = document.getElementById('historyDate').value;
        if (date) {
            this.displayHistoryFiltered(date);
        }
    }

    resetHistoryFilter() {
        document.getElementById('historyDate').value = '';
        this.displayHistory();
    }

    exportData() {
        const data = {
            workouts: this.workouts,
            meals: this.meals,
            goals: this.goals,
            exportDate: new Date().toISOString()
        };

        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `fitness-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.showNotification('Data exported successfully!');
    }

    clearAllData() {
        if (confirm('Are you sure you want to delete all data? This cannot be undone.')) {
            this.workouts = [];
            this.meals = [];
            this.goals = {
                dailyCalorieGoal: 2000,
                proteinGoal: 150,
                workoutGoal: 4,
                weightGoal: 0
            };
            this.saveData();
            this.loadGoals();
            this.updateDashboard();
            this.displayHistory();
            this.showNotification('All data cleared successfully!');
        }
    }

    saveData() {
        localStorage.setItem('workouts', JSON.stringify(this.workouts));
        localStorage.setItem('meals', JSON.stringify(this.meals));
    }

    getLast7Days() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toISOString().split('T')[0]);
        }
        return days;
    }

    formatDate(dateString) {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    showNotification(message) {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4ecdc4;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FitnessApp();
});

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

