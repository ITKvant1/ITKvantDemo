// Основной скрипт для сайта по физике
document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    
    // ==============================================
    // 0. ГЛОБАЛЬНЫЕ ДАННЫЕ И КОНФИГУРАЦИЯ
    // ==============================================
    
    // Структура тем
    const TOPICS = {
        '7': ['7-1', '7-2', '7-3', '7-4', '7-5'],
        '8': ['8-1', '8-2', '8-3', '8-4', '8-5']
    };
    
    // Названия тем
    const TOPIC_NAMES = {
        '7-1': 'Введение в физику',
        '7-2': 'Строение вещества',
        '7-3': 'Взаимодействие тел',
        '7-4': 'Давление и Архимедова сила',
        '7-5': 'Работа и энергия',
        '8-1': 'Тепловые явления',
        '8-2': 'Изменение агрегатных состояний',
        '8-3': 'Электрические явления',
        '8-4': 'Электромагнитные явления',
        '8-5': 'Световые явления'
    };
    
    // ==============================================
    // 1. СИСТЕМА ПОЛЬЗОВАТЕЛЕЙ (АККАУНТЫ)
    // ==============================================
    
    // Текущий пользователь
    let currentUser = null;
    
    // База пользователей
    let users = {};
    
    // Загрузка пользователей из localStorage
    function loadUsers() {
        try {
            const savedUsers = localStorage.getItem('physicsUsers');
            if (savedUsers) {
                users = JSON.parse(savedUsers);
            } else {
                // Создаем демо-пользователя
                users = {
                    'demo@example.com': {
                        id: '1',
                        name: 'Демо Пользователь',
                        email: 'demo@example.com',
                        password: hashPassword('demo'),
                        avatar: 'https://via.placeholder.com/150x150/6C3BFF/FFFFFF?text=Demo',
                        registered: new Date().toISOString(),
                        progress: {
                            topics: {
                                '7-1': false, '7-2': false, '7-3': false, '7-4': false, '7-5': false,
                                '8-1': false, '8-2': false, '8-3': false, '8-4': false, '8-5': false
                            },
                            tests: []
                        }
                    }
                };
                saveUsers();
            }
        } catch (e) {
            console.log('Ошибка загрузки пользователей:', e);
            users = {};
        }
    }
    
    // Сохранение пользователей в localStorage
    function saveUsers() {
        try {
            localStorage.setItem('physicsUsers', JSON.stringify(users));
        } catch (e) {
            console.log('Ошибка сохранения пользователей:', e);
        }
    }
    
    // Простое хеширование пароля (для демо, в реальном проекте использовать bcrypt)
    function hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
    
    // Регистрация нового пользователя
    function registerUser(name, email, password) {
        if (users[email]) {
            return { success: false, message: 'Пользователь с таким email уже существует' };
        }
        
        const newUser = {
            id: Date.now().toString(),
            name: name,
            email: email,
            password: hashPassword(password),
            avatar: `https://via.placeholder.com/150x150/6C3BFF/FFFFFF?text=${encodeURIComponent(name.charAt(0))}`,
            registered: new Date().toISOString(),
            progress: {
                topics: {
                    '7-1': false, '7-2': false, '7-3': false, '7-4': false, '7-5': false,
                    '8-1': false, '8-2': false, '8-3': false, '8-4': false, '8-5': false
                },
                tests: []
            }
        };
        
        users[email] = newUser;
        saveUsers();
        return { success: true, user: newUser };
    }
    
    // Вход пользователя
    function loginUser(email, password) {
        const user = users[email];
        if (!user || user.password !== hashPassword(password)) {
            return { success: false, message: 'Неверный email или пароль' };
        }
        return { success: true, user: user };
    }
    
    // Выход пользователя
    function logoutUser() {
        currentUser = null;
        localStorage.removeItem('currentUser');
        updateUIBasedOnAuth();
        switchSection('home');
        showNotification('Вы вышли из системы', 'info');
    }
    
    // Сохранение текущего пользователя
    function setCurrentUser(user) {
        currentUser = user;
        try {
            localStorage.setItem('currentUser', JSON.stringify(user));
        } catch (e) {
            console.log('Ошибка сохранения сессии:', e);
        }
        updateUIBasedOnAuth();
    }
    
    // Загрузка текущего пользователя из сессии
    function loadCurrentUser() {
        try {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                currentUser = JSON.parse(savedUser);
                // Обновляем данные из базы
                if (users[currentUser.email]) {
                    currentUser = users[currentUser.email];
                }
            }
        } catch (e) {
            console.log('Ошибка загрузки сессии:', e);
        }
        updateUIBasedOnAuth();
    }
    
    // ==============================================
    // 2. ОБНОВЛЕНИЕ ПРОГРЕССА ПОЛЬЗОВАТЕЛЯ
    // ==============================================
    
    // Обновление темы
    function updateTopicProgress(topicId, completed) {
        if (!currentUser) return false;
        
        currentUser.progress.topics[topicId] = completed;
        users[currentUser.email] = currentUser;
        saveUsers();
        setCurrentUser(currentUser);
        updateAllProgress();
        return true;
    }
    
    // Добавление результата теста
    function addTestResult(testId, testTitle, score, total) {
        if (!currentUser) return false;
        
        const result = {
            testId: testId,
            testTitle: testTitle,
            score: score,
            total: total,
            percentage: Math.round((score / total) * 100),
            date: new Date().toISOString()
        };
        
        currentUser.progress.tests.push(result);
        users[currentUser.email] = currentUser;
        saveUsers();
        setCurrentUser(currentUser);
        updateAllProgress();
        return true;
    }
    
    // Сброс прогресса пользователя
    function resetUserProgress() {
        if (!currentUser) return false;
        
        currentUser.progress = {
            topics: {
                '7-1': false, '7-2': false, '7-3': false, '7-4': false, '7-5': false,
                '8-1': false, '8-2': false, '8-3': false, '8-4': false, '8-5': false
            },
            tests: []
        };
        
        users[currentUser.email] = currentUser;
        saveUsers();
        setCurrentUser(currentUser);
        updateAllProgress();
        return true;
    }
    
    // Обновление данных пользователя
    function updateUserProfile(name, email, avatar) {
        if (!currentUser) return false;
        
        const oldEmail = currentUser.email;
        
        // Если email меняется, нужно обновить ключ в объекте users
        if (oldEmail !== email) {
            if (users[email]) {
                return { success: false, message: 'Пользователь с таким email уже существует' };
            }
            delete users[oldEmail];
        }
        
        currentUser.name = name;
        currentUser.email = email;
        if (avatar) currentUser.avatar = avatar;
        
        users[email] = currentUser;
        saveUsers();
        setCurrentUser(currentUser);
        return { success: true };
    }
    
    // Расчет рейтинга пользователя
    function calculateUserRating() {
        if (!currentUser) return 0;
        
        const topics = Object.values(currentUser.progress.topics);
        const completedTopics = topics.filter(t => t).length;
        const totalTopics = topics.length;
        const topicProgress = completedTopics / totalTopics;
        
        const tests = currentUser.progress.tests || [];
        let testScore = 0;
        if (tests.length > 0) {
            testScore = tests.reduce((sum, t) => sum + t.percentage, 0) / tests.length / 100;
        }
        
        // Рейтинг от 0 до 5
        const rating = (topicProgress * 0.6 + testScore * 0.4) * 5;
        return Math.min(5, Math.round(rating * 10) / 10);
    }
    
    // Расчет уровня пользователя
    function calculateUserLevel() {
        if (!currentUser) return { level: 'Новичок', progress: 0, nextLevel: 'Любознательный' };
        
        const topics = Object.values(currentUser.progress.topics);
        const completedTopics = topics.filter(t => t).length;
        const tests = currentUser.progress.tests || [];
        const testsTaken = tests.length;
        
        const totalPoints = completedTopics * 10 + testsTaken * 5;
        
        if (totalPoints < 20) return { level: 'Новичок', progress: totalPoints / 20 * 100, nextLevel: 'Любознательный' };
        if (totalPoints < 50) return { level: 'Любознательный', progress: (totalPoints - 20) / 30 * 100, nextLevel: 'Исследователь' };
        if (totalPoints < 100) return { level: 'Исследователь', progress: (totalPoints - 50) / 50 * 100, nextLevel: 'Эксперт' };
        return { level: 'Эксперт', progress: 100, nextLevel: 'Мастер' };
    }
    
    // ==============================================
    // 3. ОБНОВЛЕНИЕ ИНТЕРФЕЙСА
    // ==============================================
    
    // Обновление UI в зависимости от авторизации
    function updateUIBasedOnAuth() {
        const loginBtn = document.getElementById('login-btn');
        const userMenuDropdown = document.getElementById('user-menu-dropdown');
        
        if (currentUser) {
            if (loginBtn) loginBtn.classList.add('hidden');
            if (userMenuDropdown) {
                userMenuDropdown.classList.remove('hidden');
                
                const userNameDisplay = document.getElementById('user-name-display');
                const userAvatarSmall = document.getElementById('user-avatar-small');
                const userRatingDisplay = document.getElementById('user-rating-display');
                
                if (userNameDisplay) userNameDisplay.textContent = currentUser.name;
                if (userAvatarSmall) userAvatarSmall.src = currentUser.avatar || 'https://via.placeholder.com/40x40/6C3BFF/FFFFFF?text=User';
                
                const rating = calculateUserRating();
                if (userRatingDisplay) userRatingDisplay.innerHTML = `<i class="fas fa-star"></i> ${rating}`;
            }
            
            // Обновляем страницу профиля
            updateProfilePage();
        } else {
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (userMenuDropdown) userMenuDropdown.classList.add('hidden');
        }
        
        // Обновляем прогресс на главной
        updateAllProgress();
    }
    
    // Обновление страницы профиля
    function updateProfilePage() {
        if (!currentUser) return;
        
        // Основная информация
        document.getElementById('profile-name').textContent = currentUser.name;
        document.getElementById('profile-email').textContent = currentUser.email;
        document.getElementById('profile-avatar').src = currentUser.avatar || 'https://via.placeholder.com/150x150/6C3BFF/FFFFFF?text=User';
        
        // Статистика
        const topics = Object.values(currentUser.progress.topics);
        const completedTopics = topics.filter(t => t).length;
        const totalTopics = topics.length;
        
        const tests = currentUser.progress.tests || [];
        const testsTaken = tests.length;
        
        document.getElementById('profile-topics').textContent = completedTopics;
        document.getElementById('profile-tests').textContent = testsTaken;
        
        const avgScore = tests.length > 0 
            ? Math.round(tests.reduce((sum, t) => sum + t.percentage, 0) / tests.length) 
            : 0;
        document.getElementById('profile-score').textContent = avgScore;
        
        // Рейтинг
        const rating = calculateUserRating();
        const ratingStars = document.getElementById('profile-rating-stars').children;
        for (let i = 0; i < 5; i++) {
            const star = ratingStars[i];
            if (i < Math.floor(rating)) {
                star.className = 'fas fa-star';
            } else if (i < Math.ceil(rating) && rating % 1 !== 0) {
                star.className = 'fas fa-star-half-alt';
            } else {
                star.className = 'far fa-star';
            }
        }
        document.getElementById('profile-rating-value').textContent = `${rating} из 5`;
        
        // Уровень
        const level = calculateUserLevel();
        document.getElementById('profile-level-name').textContent = level.level;
        document.getElementById('profile-level-progress').style.width = `${level.progress}%`;
        document.getElementById('profile-next-level').textContent = `Следующий уровень: ${level.nextLevel}`;
        
        // Прогресс по классам
        const topics7 = currentUser.progress.topics;
        const completed7 = TOPICS['7'].filter(id => topics7[id]).length;
        const percent7 = Math.round((completed7 / 5) * 100);
        document.getElementById('stats-7-fill').style.width = `${percent7}%`;
        document.getElementById('stats-7-percent').textContent = `${percent7}%`;
        document.getElementById('stats-7-text').textContent = `${completed7} из 5 тем`;
        
        const completed8 = TOPICS['8'].filter(id => topics7[id]).length;
        const percent8 = Math.round((completed8 / 5) * 100);
        document.getElementById('stats-8-fill').style.width = `${percent8}%`;
        document.getElementById('stats-8-percent').textContent = `${percent8}%`;
        document.getElementById('stats-8-text').textContent = `${completed8} из 5 тем`;
        
        // Успеваемость по тестам
        document.getElementById('stats-tests-taken').textContent = testsTaken;
        document.getElementById('stats-average-score').textContent = `${avgScore}%`;
        
        const bestScore = tests.length > 0 ? Math.max(...tests.map(t => t.percentage)) : 0;
        const worstScore = tests.length > 0 ? Math.min(...tests.map(t => t.percentage)) : 0;
        document.getElementById('stats-best-score').textContent = `${bestScore}%`;
        document.getElementById('stats-worst-score').textContent = `${worstScore}%`;
        
        // История тестов
        updateTestHistory();
        
        // Список тем
        updateTopicsList();
        
        // Настройки
        document.getElementById('settings-name').value = currentUser.name;
        document.getElementById('settings-email').value = currentUser.email;
        document.getElementById('settings-avatar').value = currentUser.avatar || '';
    }
    
    // Обновление истории тестов
    function updateTestHistory() {
        const tbody = document.getElementById('test-history-body');
        if (!tbody) return;
        
        const tests = currentUser.progress.tests || [];
        
        if (tests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Вы еще не прошли ни одного теста</td></tr>';
            return;
        }
        
        tbody.innerHTML = tests
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(test => {
                const date = new Date(test.date).toLocaleDateString('ru-RU');
                return `
                    <tr>
                        <td>${test.testTitle}</td>
                        <td>${test.score} / ${test.total} (${test.percentage}%)</td>
                        <td><span class="test-result-badge ${test.percentage >= 60 ? 'success' : 'danger'}">${test.percentage >= 60 ? 'Сдано' : 'Не сдано'}</span></td>
                        <td>${date}</td>
                    </tr>
                `;
            })
            .join('');
    }
    
    // Обновление списка тем
    function updateTopicsList(filter = 'all') {
        const container = document.getElementById('topics-list-container');
        if (!container) return;
        
        const topics = Object.entries(currentUser.progress.topics).map(([id, completed]) => ({
            id,
            grade: id.split('-')[0],
            name: TOPIC_NAMES[id] || id,
            completed
        }));
        
        let filteredTopics = topics;
        if (filter === '7') filteredTopics = topics.filter(t => t.grade === '7');
        if (filter === '8') filteredTopics = topics.filter(t => t.grade === '8');
        if (filter === 'completed') filteredTopics = topics.filter(t => t.completed);
        if (filter === 'not-completed') filteredTopics = topics.filter(t => !t.completed);
        
        container.innerHTML = filteredTopics.map(topic => `
            <div class="topic-list-item ${topic.completed ? 'completed' : ''}">
                <div class="topic-list-info">
                    <span class="topic-list-grade">${topic.grade} класс</span>
                    <span class="topic-list-name">${topic.name}</span>
                </div>
                <div class="topic-list-status">
                    <span class="topic-status-badge ${topic.completed ? 'completed' : 'not-completed'}">
                        ${topic.completed ? 'Изучено' : 'Не изучено'}
                    </span>
                </div>
            </div>
        `).join('');
    }
    
    // Обновление прогресса на главной
    function updateAllProgress() {
        if (!currentUser) {
            // Если пользователь не авторизован, показываем нули
            document.getElementById('topics-progress').style.width = '0%';
            document.getElementById('topics-text').textContent = '0 из 10';
            document.getElementById('tests-progress').style.width = '0%';
            document.getElementById('tests-text').textContent = '0 из 5';
            
            const ratingStars = document.getElementById('user-rating-stars').children;
            for (let i = 0; i < 5; i++) ratingStars[i].className = 'far fa-star';
            document.getElementById('user-rating-text').textContent = '0 из 5';
            
            document.getElementById('progress-7-fill').style.width = '0%';
            document.getElementById('progress-7-percent').textContent = '0%';
            document.getElementById('progress-7-text').textContent = 'Изучено 0 из 5 тем';
            
            document.getElementById('progress-8-fill').style.width = '0%';
            document.getElementById('progress-8-percent').textContent = '0%';
            document.getElementById('progress-8-text').textContent = 'Изучено 0 из 5 тем';
            
            return;
        }
        
        const topics = currentUser.progress.topics;
        const tests = currentUser.progress.tests || [];
        
        // Общий прогресс тем
        const allTopics = Object.keys(topics);
        const completedTopics = allTopics.filter(id => topics[id]).length;
        const totalTopics = allTopics.length;
        const totalPercent = Math.round((completedTopics / totalTopics) * 100);
        
        document.getElementById('topics-progress').style.width = `${totalPercent}%`;
        document.getElementById('topics-text').textContent = `${completedTopics} из ${totalTopics}`;
        
        // Прогресс тестов
        const testsTaken = tests.length;
        const testsPercent = Math.round((testsTaken / 5) * 100);
        document.getElementById('tests-progress').style.width = `${testsPercent}%`;
        document.getElementById('tests-text').textContent = `${testsTaken} из 5`;
        
        // Рейтинг
        const rating = calculateUserRating();
        const ratingStars = document.getElementById('user-rating-stars').children;
        for (let i = 0; i < 5; i++) {
            const star = ratingStars[i];
            if (i < Math.floor(rating)) {
                star.className = 'fas fa-star';
            } else if (i < Math.ceil(rating) && rating % 1 !== 0) {
                star.className = 'fas fa-star-half-alt';
            } else {
                star.className = 'far fa-star';
            }
        }
        document.getElementById('user-rating-text').textContent = `${rating} из 5`;
        
        // Прогресс 7 класса
        const topics7 = TOPICS['7'];
        const completed7 = topics7.filter(id => topics[id]).length;
        const percent7 = Math.round((completed7 / 5) * 100);
        document.getElementById('progress-7-fill').style.width = `${percent7}%`;
        document.getElementById('progress-7-percent').textContent = `${percent7}%`;
        document.getElementById('progress-7-text').textContent = `Изучено ${completed7} из 5 тем`;
        
        // Прогресс 8 класса
        const topics8 = TOPICS['8'];
        const completed8 = topics8.filter(id => topics[id]).length;
        const percent8 = Math.round((completed8 / 5) * 100);
        document.getElementById('progress-8-fill').style.width = `${percent8}%`;
        document.getElementById('progress-8-percent').textContent = `${percent8}%`;
        document.getElementById('progress-8-text').textContent = `Изучено ${completed8} из 5 тем`;
        
        // Обновляем состояние кнопок тем
        document.querySelectorAll('.btn-study-complete').forEach(btn => {
            const topicId = btn.getAttribute('data-topic');
            if (topicId && topics[topicId]) {
                btn.classList.add('completed');
                btn.innerHTML = '<i class="fas fa-check-circle"></i> Изучено ✓';
            } else {
                btn.classList.remove('completed');
                btn.innerHTML = '<i class="fas fa-check-circle"></i> Отметить как изученное';
            }
        });
    }
    
    // ==============================================
    // 4. УВЕДОМЛЕНИЯ
    // ==============================================
    
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'success' ? 'linear-gradient(135deg, #4CAF50, #45a049)' : 
                       type === 'error' ? 'linear-gradient(135deg, #f44336, #d32f2f)' : 
                       'linear-gradient(135deg, #2196F3, #1976D2)'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 9999;
            animation: slideIn 0.3s ease;
            font-weight: 500;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // ==============================================
    // 5. НАВИГАЦИЯ
    // ==============================================
    
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    
    function switchSection(sectionId, tab = null) {
        contentSections.forEach(section => section.classList.remove('active'));
        const activeSection = document.getElementById(sectionId);
        if (activeSection) activeSection.classList.add('active');
        
        navLinks.forEach(link => {
            if (link.getAttribute('data-section') === sectionId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        // Если нужно переключить таб в профиле
        if (sectionId === 'profile' && tab) {
            const tabBtn = document.querySelector(`.profile-tab[data-tab="${tab}"]`);
            if (tabBtn) tabBtn.click();
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Обработчики для всех ссылок с data-section
    document.querySelectorAll('[data-section]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            
            // Проверяем доступ к профилю
            if (sectionId === 'profile' && !currentUser) {
                openLoginModal();
                return;
            }
            
            switchSection(sectionId);
        });
    });
        
    // ==============================================
    // 6. МОДАЛЬНЫЕ ОКНА
    // ==============================================
    
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    
    function openLoginModal() {
        if (loginModal) loginModal.classList.remove('hidden');
    }
    
    function openRegisterModal() {
        if (registerModal) registerModal.classList.remove('hidden');
    }
    
    function closeAllModals() {
        if (loginModal) loginModal.classList.add('hidden');
        if (registerModal) registerModal.classList.add('hidden');
    }
    
    // Обработчики модальных окон
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
    
    document.getElementById('show-register-link')?.addEventListener('click', function(e) {
        e.preventDefault();
        closeAllModals();
        openRegisterModal();
    });
    
    document.getElementById('show-login-link')?.addEventListener('click', function(e) {
        e.preventDefault();
        closeAllModals();
        openLoginModal();
    });
    
    document.getElementById('login-btn')?.addEventListener('click', function(e) {
        e.preventDefault();
        openLoginModal();
    });
    
    // Форма входа
    document.getElementById('login-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        const result = loginUser(email, password);
        
        if (result.success) {
            closeAllModals();
            setCurrentUser(result.user);
            showNotification('Вы успешно вошли в систему', 'success');
        } else {
            showNotification(result.message, 'error');
        }
    });
    
    // Форма регистрации
    document.getElementById('register-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        
        if (password !== confirmPassword) {
            showNotification('Пароли не совпадают', 'error');
            return;
        }
        
        const result = registerUser(name, email, password);
        
        if (result.success) {
            closeAllModals();
            setCurrentUser(result.user);
            showNotification('Регистрация прошла успешно', 'success');
        } else {
            showNotification(result.message, 'error');
        }
    });
    
    // Выход
    document.getElementById('logout-btn')?.addEventListener('click', function(e) {
        e.preventDefault();
        logoutUser();
    });
    
    // ==============================================
    // 7. ТЕМЫ
    // ==============================================
    
    document.querySelectorAll('.btn-study-complete').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (!currentUser) {
                openLoginModal();
                return;
            }
            
            const topicId = this.getAttribute('data-topic');
            if (topicId) {
                const currentStatus = currentUser.progress.topics[topicId];
                const isCompleted = updateTopicProgress(topicId, !currentStatus);
                
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 200);
                
                showNotification(
                    !currentStatus ? 'Тема отмечена как изученная! 🎉' : 'Тема отмечена как не изученная',
                    !currentStatus ? 'success' : 'info'
                );
            }
        });
    });
    
    // ==============================================
    // 8. ТЕСТЫ
    // ==============================================
    
    const tests = {
        '7-grade-test1': {
            title: '7 класс: Механика',
            grade: '7',
            questions: [
                {
                    text: 'Что такое скорость?',
                    answers: [
                        'Физическая величина, характеризующая быстроту движения',
                        'Расстояние, пройденное телом за единицу времени',
                        'Изменение положения тела относительно других тел',
                        'Все перечисленные ответы верны'
                    ],
                    correct: 3,
                    explanation: 'Скорость - это физическая величина, которая характеризует быстроту движения и равна отношению пути ко времени. Формула: v = s/t.'
                },
                {
                    text: 'Какова единица измерения силы в системе СИ?',
                    answers: [
                        'Джоуль',
                        'Ньютон',
                        'Паскаль',
                        'Ватт'
                    ],
                    correct: 1,
                    explanation: 'Единица измерения силы в системе СИ - Ньютон (Н). 1 Н - это сила, которая телу массой 1 кг сообщает ускорение 1 м/с².'
                },
                {
                    text: 'Что характеризует плотность вещества?',
                    answers: [
                        'Массу единицы объема',
                        'Вес тела',
                        'Объем тела',
                        'Силу притяжения'
                    ],
                    correct: 0,
                    explanation: 'Плотность - это физическая величина, равная отношению массы тела к его объему. Формула: ρ = m/V.'
                },
                {
                    text: 'Кто открыл закон всемирного тяготения?',
                    answers: [
                        'Архимед',
                        'Исаак Ньютон',
                        'Галилео Галилей',
                        'Альберт Эйнштейн'
                    ],
                    correct: 1,
                    explanation: 'Закон всемирного тяготения был открыт Исааком Ньютоном в 1687 году.'
                },
                {
                    text: 'Что такое сила трения?',
                    answers: [
                        'Сила, возникающая при движении одного тела по поверхности другого',
                        'Сила, с которой Земля притягивает тело',
                        'Сила, возникающая при деформации тела',
                        'Сила, выталкивающая тело из жидкости'
                    ],
                    correct: 0,
                    explanation: 'Сила трения - это сила, возникающая при движении одного тела по поверхности другого и направленная против движения.'
                }
            ]
        },
        '7-grade-test2': {
            title: '7 класс: Давление и Архимедова сила',
            grade: '7',
            questions: [
                {
                    text: 'По какой формуле рассчитывается давление твердого тела?',
                    answers: [
                        'p = F/S',
                        'p = ρgh',
                        'p = mg',
                        'p = F·S'
                    ],
                    correct: 0,
                    explanation: 'Давление твердого тела рассчитывается по формуле p = F/S, где F - сила, S - площадь поверхности.'
                },
                {
                    text: 'Как формулируется закон Паскаля?',
                    answers: [
                        'Давление, производимое на жидкость или газ, передается в любую точку без изменений во всех направлениях',
                        'Давление в жидкости зависит от глубины',
                        'На тело, погруженное в жидкость, действует выталкивающая сила',
                        'Давление газа тем больше, чем выше температура'
                    ],
                    correct: 0,
                    explanation: 'Закон Паскаля: давление, производимое на жидкость или газ, передается в любую точку одинаково во всех направлениях.'
                },
                {
                    text: 'Чему равна Архимедова сила?',
                    answers: [
                        'F = ρgV',
                        'F = mg',
                        'F = ρgh',
                        'F = kx'
                    ],
                    correct: 0,
                    explanation: 'Архимедова сила равна весу жидкости в объеме погруженной части тела: F = ρgV.'
                },
                {
                    text: 'В какой воде легче плавать?',
                    answers: [
                        'В морской, потому что она соленая и более плотная',
                        'В пресной, потому что она легче',
                        'Одинаково в любой воде',
                        'Зависит от температуры воды'
                    ],
                    correct: 0,
                    explanation: 'В морской воде легче плавать, так как ее плотность выше из-за растворенной соли, и Архимедова сила больше.'
                },
                {
                    text: 'Что такое сообщающиеся сосуды?',
                    answers: [
                        'Сосуды, соединенные между собой ниже уровня жидкости',
                        'Сосуды, имеющие общее дно',
                        'Сосуды, стоящие рядом',
                        'Сосуды разной формы'
                    ],
                    correct: 0,
                    explanation: 'Сообщающиеся сосуды - это сосуды, соединенные между собой ниже уровня жидкости. В них однородная жидкость устанавливается на одном уровне.'
                }
            ]
        },
        '8-grade-test1': {
            title: '8 класс: Тепловые явления',
            grade: '8',
            questions: [
                {
                    text: 'Что такое внутренняя энергия?',
                    answers: [
                        'Сумма кинетической и потенциальной энергии всех молекул тела',
                        'Энергия движения тела',
                        'Энергия взаимодействия тела с Землей',
                        'Кинетическая энергия тела'
                    ],
                    correct: 0,
                    explanation: 'Внутренняя энергия - это сумма кинетической энергии движения молекул и потенциальной энергии их взаимодействия.'
                },
                {
                    text: 'Какой буквой обозначается удельная теплоемкость?',
                    answers: [
                        'c',
                        'Q',
                        'λ',
                        'L'
                    ],
                    correct: 0,
                    explanation: 'Удельная теплоемкость обозначается буквой c (цэ). Единица измерения: Дж/(кг·°C).'
                },
                {
                    text: 'Каким способом можно изменить внутреннюю энергию тела?',
                    answers: [
                        'Совершением работы и теплопередачей',
                        'Только нагреванием',
                        'Только охлаждением',
                        'Изменением скорости тела'
                    ],
                    correct: 0,
                    explanation: 'Внутреннюю энергию можно изменить двумя способами: совершением механической работы и теплопередачей.'
                },
                {
                    text: 'Что такое конвекция?',
                    answers: [
                        'Перенос энергии потоками жидкости или газа',
                        'Перенос энергии от более нагретых частей тела к менее нагретым',
                        'Перенос энергии с помощью электромагнитных волн',
                        'Перенос энергии при непосредственном контакте тел'
                    ],
                    correct: 0,
                    explanation: 'Конвекция - это вид теплопередачи, при котором энергия переносится потоками жидкости или газа.'
                },
                {
                    text: 'По какой формуле рассчитывается количество теплоты при нагревании?',
                    answers: [
                        'Q = cm(t₂ - t₁)',
                        'Q = λm',
                        'Q = Lm',
                        'Q = qm'
                    ],
                    correct: 0,
                    explanation: 'Количество теплоты при нагревании рассчитывается по формуле Q = cm(t₂ - t₁), где c - удельная теплоемкость, m - масса, Δt - изменение температуры.'
                }
            ]
        },
        '8-grade-test2': {
            title: '8 класс: Электричество',
            grade: '8',
            questions: [
                {
                    text: 'Как формулируется закон Ома?',
                    answers: [
                        'Сила тока в участке цепи прямо пропорциональна напряжению и обратно пропорциональна сопротивлению',
                        'Сила тока прямо пропорциональна сопротивлению',
                        'Напряжение прямо пропорционально сопротивлению',
                        'Сопротивление прямо пропорционально напряжению'
                    ],
                    correct: 0,
                    explanation: 'Закон Ома: сила тока в участке цепи прямо пропорциональна напряжению на концах этого участка и обратно пропорциональна его сопротивлению.'
                },
                {
                    text: 'В каких единицах измеряется электрическое сопротивление?',
                    answers: [
                        'Ом',
                        'Вольт',
                        'Ампер',
                        'Ватт'
                    ],
                    correct: 0,
                    explanation: 'Электрическое сопротивление измеряется в Омах (Ом). 1 Ом = 1 В/А.'
                },
                {
                    text: 'Как соединяются приборы в электрической цепи для измерения силы тока?',
                    answers: [
                        'Амперметр включается последовательно',
                        'Амперметр включается параллельно',
                        'Вольтметр включается последовательно',
                        'Можно включать любым способом'
                    ],
                    correct: 0,
                    explanation: 'Амперметр для измерения силы тока включается в цепь последовательно с тем прибором, силу тока в котором измеряют.'
                },
                {
                    text: 'Чему равно общее сопротивление при последовательном соединении проводников?',
                    answers: [
                        'R = R₁ + R₂',
                        '1/R = 1/R₁ + 1/R₂',
                        'R = R₁ = R₂',
                        'R = (R₁ + R₂)/2'
                    ],
                    correct: 0,
                    explanation: 'При последовательном соединении общее сопротивление равно сумме сопротивлений отдельных проводников: R = R₁ + R₂.'
                },
                {
                    text: 'Какая формула выражает закон Джоуля-Ленца?',
                    answers: [
                        'Q = I²Rt',
                        'Q = UIt',
                        'Q = cmΔt',
                        'Q = λm'
                    ],
                    correct: 0,
                    explanation: 'Закон Джоуля-Ленца: количество теплоты, выделяемое проводником с током, равно произведению квадрата силы тока, сопротивления проводника и времени: Q = I²Rt.'
                }
            ]
        }
    };
    
    // Состояние теста
    let currentTest = null;
    let currentQuestion = 0;
    let userAnswers = [];
    
    window.startTest = function(testId) {
        if (!tests[testId]) {
            console.error('Тест не найден:', testId);
            return;
        }
        
        if (!currentUser) {
            openLoginModal();
            return;
        }
        
        currentTest = tests[testId];
        currentQuestion = 0;
        userAnswers = new Array(currentTest.questions.length).fill(null);
        
        switchSection('tests');
        
        setTimeout(() => {
            document.getElementById('test-start').classList.add('hidden');
            document.getElementById('test-content').classList.remove('hidden');
            document.getElementById('test-results').classList.add('hidden');
            
            document.getElementById('test-title').textContent = currentTest.title;
            document.getElementById('total-questions').textContent = currentTest.questions.length;
            
            showQuestion(currentQuestion);
        }, 300);
    };
    
    function showQuestion(index) {
        if (!currentTest || !currentTest.questions || !currentTest.questions[index]) return;
        
        const question = currentTest.questions[index];
        
        document.getElementById('current-question').textContent = index + 1;
        document.getElementById('question-text').textContent = question.text;
        
        const testAnswers = document.getElementById('test-answers');
        testAnswers.innerHTML = '';
        
        question.answers.forEach((answer, i) => {
            const answerElem = document.createElement('button');
            answerElem.className = 'test-answer';
            if (userAnswers[index] === i) {
                answerElem.classList.add('selected');
            }
            answerElem.textContent = answer;
            answerElem.addEventListener('click', function() {
                selectAnswer(i);
            });
            testAnswers.appendChild(answerElem);
        });
        
        document.getElementById('prev-question').disabled = index === 0;
        document.getElementById('next-question').disabled = index === currentTest.questions.length - 1;
    }
    
    function selectAnswer(answerIndex) {
        userAnswers[currentQuestion] = answerIndex;
        showQuestion(currentQuestion);
    }
    
    document.getElementById('prev-question').addEventListener('click', function() {
        if (currentQuestion > 0) {
            currentQuestion--;
            showQuestion(currentQuestion);
        }
    });
    
    document.getElementById('next-question').addEventListener('click', function() {
        if (currentQuestion < currentTest.questions.length - 1) {
            currentQuestion++;
            showQuestion(currentQuestion);
        }
    });
    
    document.getElementById('finish-test').addEventListener('click', finishTest);
    
    function finishTest() {
        if (!currentTest) return;
        
        let correctAnswers = 0;
        userAnswers.forEach((answer, index) => {
            if (answer === currentTest.questions[index].correct) {
                correctAnswers++;
            }
        });
        
        const percentage = Math.round((correctAnswers / currentTest.questions.length) * 100);
        
        // Сохраняем результат
        addTestResult(currentTest.title, currentTest.title, correctAnswers, currentTest.questions.length);
        
        document.getElementById('test-content').classList.add('hidden');
        document.getElementById('test-results').classList.remove('hidden');
        
        document.getElementById('score-value').textContent = correctAnswers;
        document.getElementById('total-score').textContent = currentTest.questions.length;
        document.getElementById('score-percent').textContent = percentage;
        
        let message = '';
        if (percentage >= 80) {
            message = '🏆 Отличный результат! Вы хорошо усвоили материал.';
        } else if (percentage >= 60) {
            message = '👍 Хороший результат! Есть некоторые пробелы, но в целом вы знаете тему.';
        } else if (percentage >= 40) {
            message = '📚 Удовлетворительный результат. Рекомендуем повторить материал.';
        } else {
            message = '⚠️ Результат ниже среднего. Необходимо серьезно заняться изучением темы.';
        }
        
        message += '<br><br><strong style="font-size: 1.1rem; color: #4169E1;">Правильные ответы с пояснениями:</strong><br>';
        currentTest.questions.forEach((question, index) => {
            const isCorrect = userAnswers[index] === question.correct;
            const userAnswer = userAnswers[index] !== null ? question.answers[userAnswers[index]] : 'Не выбран';
            const correctAnswer = question.answers[question.correct];
            message += `<div class="answer-explanation" style="margin: 15px 0; padding: 15px; background: ${isCorrect ? 'rgba(127, 255, 212, 0.1)' : 'rgba(255, 99, 71, 0.05)'}; border-left: 5px solid ${isCorrect ? '#7FFFD4' : '#FF6B6B'}; border-radius: 8px;">
                <strong style="font-size: 1rem;">${index + 1}. ${isCorrect ? '✅' : '❌'} ${question.text}</strong><br>
                <span style="color: ${isCorrect ? '#2E8B57' : '#CD5C5C'}; font-weight: 600;">Ваш ответ: ${userAnswer}</span><br>
                <span style="color: #4169E1; font-weight: 600;">Правильный ответ: ${correctAnswer}</span><br>
                <span style="color: #666; font-style: italic;">📘 ${question.explanation}</span>
            </div>`;
        });
        
        document.getElementById('result-message').innerHTML = message;
    }
    
    document.getElementById('retry-test').addEventListener('click', function() {
        if (currentTest) {
            const testId = Object.keys(tests).find(key => tests[key] === currentTest);
            if (testId) {
                window.startTest(testId);
            }
        }
    });
    
    document.getElementById('choose-another-test').addEventListener('click', function() {
        document.getElementById('test-results').classList.add('hidden');
        document.getElementById('test-start').classList.remove('hidden');
    });
    
    document.querySelectorAll('.start-test-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const testCard = this.closest('.test-option-card');
            if (testCard) {
                const testId = testCard.getAttribute('data-test');
                if (testId) {
                    window.startTest(testId);
                }
            }
        });
    });
    
    // ==============================================
    // 9. ПРОФИЛЬ - ТАБЫ И ФИЛЬТРЫ
    // ==============================================
    
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.profile-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });
    
    document.querySelectorAll('.topics-list-header .filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            document.querySelectorAll('.topics-list-header .filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            updateTopicsList(filter);
        });
    });
    
    // ==============================================
    // 10. НАСТРОЙКИ ПРОФИЛЯ
    // ==============================================
    
    document.getElementById('profile-settings-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('settings-name').value;
        const email = document.getElementById('settings-email').value;
        const avatar = document.getElementById('settings-avatar').value;
        
        const result = updateUserProfile(name, email, avatar);
        
        if (result.success) {
            showNotification('Профиль успешно обновлен', 'success');
            updateProfilePage();
        } else {
            showNotification(result.message, 'error');
        }
    });
    
    document.getElementById('reset-progress-btn')?.addEventListener('click', function() {
        if (confirm('Вы уверены, что хотите сбросить весь прогресс? Это действие нельзя отменить.')) {
            resetUserProgress();
            showNotification('Прогресс сброшен', 'info');
            updateProfilePage();
        }
    });
    
    // ==============================================
    // 11. ФАКТЫ ДНЯ
    // ==============================================
    
    const physicsFacts = [
        "Скорость звука в воздухе при 20°C составляет примерно 343 м/с.",
        "Плотность воды максимальна при температуре 4°C.",
        "Сила Архимеда равна весу вытесненной жидкости.",
        "Закон Ома: I = U/R",
        "Ускорение свободного падения на Земле - 9,8 м/с²",
        "Температура кипения воды - 100°C",
        "Скорость света - 300 000 км/с",
        "1 Ньютон - сила, сообщающая телу массой 1 кг ускорение 1 м/с²",
        "Давление передается во все стороны одинаково (закон Паскаля)",
        "КПД любого двигателя всегда меньше 100%"
    ];
    
    const dailyFact = document.getElementById('daily-fact');
    if (dailyFact) {
        dailyFact.textContent = physicsFacts[Math.floor(Math.random() * physicsFacts.length)];
    }
    
    document.getElementById('new-fact-btn')?.addEventListener('click', function() {
        const fact = document.getElementById('daily-fact');
        if (fact) {
            fact.style.opacity = '0';
            setTimeout(() => {
                fact.textContent = physicsFacts[Math.floor(Math.random() * physicsFacts.length)];
                fact.style.opacity = '1';
            }, 200);
        }
    });
    
    // ==============================================
    // 12. ЭКСПЕРИМЕНТЫ
    // ==============================================
    
    // Эксперимент с плотностью
    const densityMass = document.getElementById('mass');
    const massValue = document.getElementById('mass-value');
    if (densityMass && massValue) {
        densityMass.addEventListener('input', function() {
            massValue.textContent = `${this.value} кг`;
        });
    }
    
    document.getElementById('calculate-density')?.addEventListener('click', function() {
        const substance = document.getElementById('substance')?.value || 'water';
        const mass = parseFloat(document.getElementById('mass')?.value || 1);
        
        const densities = { water: 1000, ice: 900, iron: 7870, aluminum: 2700, wood: 600 };
        const names = { water: "Воды", ice: "Льда", iron: "Железа", aluminum: "Алюминия", wood: "Дерева" };
        
        const volume = mass / densities[substance];
        document.getElementById('density-result').innerHTML = `
            <strong>Результат:</strong><br>
            Масса: ${mass} кг<br>
            Плотность ${names[substance]}: ${densities[substance]} кг/м³<br>
            <strong>Объем: ${volume.toFixed(4)} м³ (${(volume * 1000).toFixed(1)} л)</strong>
        `;
    });
    
    // Закон Ома
    const ohmVoltage = document.getElementById('voltage');
    const voltageValue = document.getElementById('voltage-value');
    if (ohmVoltage && voltageValue) {
        ohmVoltage.addEventListener('input', function() {
            voltageValue.textContent = `${this.value} В`;
        });
    }
    
    const ohmResistance = document.getElementById('resistance');
    const resistanceValue = document.getElementById('resistance-value');
    if (ohmResistance && resistanceValue) {
        ohmResistance.addEventListener('input', function() {
            resistanceValue.textContent = `${this.value} Ом`;
        });
    }
    
    document.getElementById('calculate-ohm')?.addEventListener('click', function() {
        const voltage = parseFloat(document.getElementById('voltage')?.value || 6);
        const resistance = parseFloat(document.getElementById('resistance')?.value || 5);
        const current = voltage / resistance;
        
        document.getElementById('ohm-result').innerHTML = `
            <strong>Результат:</strong><br>
            Напряжение: ${voltage} В<br>
            Сопротивление: ${resistance} Ом<br>
            <strong>Сила тока: ${current.toFixed(2)} А</strong><br>
            Мощность: ${(voltage * current).toFixed(2)} Вт
        `;
    });
    
    // ==============================================
    // 13. КНОПКА НАВЕРХ
    // ==============================================
    
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', function() {
            backToTop.classList.toggle('visible', window.pageYOffset > 300);
        });
        
        backToTop.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // ==============================================
    // 14. ИНИЦИАЛИЗАЦИЯ
    // ==============================================
    
    loadUsers();
    loadCurrentUser();
    
    // Запускаем эксперименты
    setTimeout(() => {
        document.getElementById('calculate-density')?.click();
        document.getElementById('calculate-ohm')?.click();
    }, 200);
    
    console.log('Сайт физики успешно загружен!');
});