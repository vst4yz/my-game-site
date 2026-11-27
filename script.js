// 1. Находим ВСЕ кнопки с классом "details-btn"
const allButtons = document.querySelectorAll('.details-btn');

// 2. Для КАЖДОЙ кнопки добавляем обработчик
for (let i = 0; i < allButtons.length; i++) {
    const button = allButtons[i];

    // 3. Событие "клик"
    button.addEventListener('click', function () {
        // Ищем родительскую карточку, а в ней — блок .details
        const card = button.closest('.game-card');
        const detailsBlock = card.querySelector('.details');

        if (!detailsBlock) return; // защита от ошибок

        // Переключаем видимость
        if (detailsBlock.style.display === 'none' || detailsBlock.style.display === '') {
            detailsBlock.style.display = 'block';
            button.textContent = 'Скрыть';
        } else {
            detailsBlock.style.display = 'none';
            button.textContent = 'Подробнее';
        }
    });

    // 4. Наведение мыши
    button.addEventListener('mouseover', function () {
        button.style.backgroundColor = 'orange';
    });

    // 5. Уход мыши
    button.addEventListener('mouseout', function () {
        button.style.backgroundColor = '#ff0752'; // ← вернул ваш фирменный цвет
    });
}

console.log('✅ Скрипт работает!');

let allGames = [];

// =============================================
// ЛАБОРАТОРНАЯ РАБОТА №5
// Чтение данных из Firestore и вывод списка игр
// =============================================

// Ждем загрузки страницы
document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Страница загружена');

    // Ждем, пока Firebase инициализируется
    // (в index.html мы установили window.firebaseReady = true)
    // Список игр есть не на каждой странице — ждем Firebase только там, где он нужен
    if (document.getElementById('games-container')) {
        waitForFirebase();
    }
});

// Функция ожидания Firebase
function waitForFirebase() {
    if (window.firebaseReady && window.db) {
        console.log('✅ Firebase готов, начинаем загрузку игр');
        loadAllGames();
    } else {
        // Проверяем каждые 100 мс
        setTimeout(waitForFirebase, 100);
    }
}

// =============================================
// ЗАГРУЗКА ИГР ИЗ FIRESTORE
// =============================================

function showSkeletons(count = 3) {
    const container = document.getElementById('games-container');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-card';
        skeleton.innerHTML = `
            <div class="skeleton skeleton-image"></div>
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
        `;
        container.appendChild(skeleton);
    }
}

async function loadAllGames() {
    try {
        showSkeletons(3);

        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js');

        const querySnapshot = await getDocs(collection(window.db, 'games'));
        console.log('📦 Получено документов:', querySnapshot.size);

        allGames = [];
        querySnapshot.forEach(function (doc) {
            allGames.push({
                id: doc.id,
                ...doc.data()
            });
        });

        console.log('✅ Загружено игр:', allGames.length);
        applyFilters();

    } catch (error) {
        console.error('❌ Ошибка при загрузке игр:', error);
        showError();
    }
}

// =============================================
// ОТРИСОВКА КАРТОЧЕК ИГР
// =============================================

function renderGames(games) {
    // 1. Находим контейнер для карточек
    const container = document.getElementById('games-container');

    // На страницах без списка игр ничего не делаем
    if (!container) return;

    // 2. Очищаем контейнер от старого содержимого
    container.innerHTML = '';

    // 3. Если игр нет — показываем сообщение
    if (games.length === 0) {
        container.innerHTML = '<p>Пока нет игр в базе данных</p>';
        return;
    }

    // 4. Для каждой игры создаем карточку
    games.forEach(function (game) {
        // Создаем HTML-элемент карточки
        const card = document.createElement('div');
        card.className = 'game-card';
        card.setAttribute('data-id', game.id); // сохраняем ID для удаления/редактирования

        // Заполняем карточку данными из Firestore
        card.innerHTML = `
            <img src="${game.imageUrl || 'https://via.placeholder.com/280x150'}" 
                 alt="${game.title}" 
                 class="game-image">
            <h3 class="game-title">${game.title}</h3>
            <p class="game-short">Жанр: ${game.genre}</p>
            <p class="game-rating">⭐ Рейтинг: ${game.rating}/10</p>

            <!-- КНОПКИ УПРАВЛЕНИЯ -->
            <div class="card-actions">
                <button type="button" class="edit-btn" data-id="${game.id}">✏️ Изменить</button>
                <button type="button" class="delete-btn" data-id="${game.id}">🗑️ Удалить</button>
            </div>
        `;

        // Добавляем карточку в контейнер
        container.appendChild(card);
    });

    // 5. Навешиваем обработчики на кнопки
    attachCardHandlers();

    console.log('✅ Отрисовано карточек:', games.length);
}

// =============================================
// СООБЩЕНИЕ ОБ ОШИБКЕ
// =============================================

function showError() {
    const container = document.getElementById('games-container');
    if (!container) return;
    container.innerHTML = `
        <p style="color: red;">
            ❌ Ошибка загрузки игр. Проверь консоль (F12).
        </p>
    `;
}
// =============================================
// ЛАБОРАТОРНАЯ №6: Добавление игр через форму
// =============================================

// Ждём загрузки страницы
document.addEventListener('DOMContentLoaded', function () {
    // Находим форму
    const form = document.getElementById('add-game-form');
    
    if (form) {
        console.log('✅ Форма найдена');
        
        // Добавляем обработчик отправки формы
        form.addEventListener('submit', async function (event) {
            // 1. Отменяем перезагрузку страницы
            event.preventDefault();
            console.log('📝 Форма отправлена');
            
            // 2. Собираем данные из полей
            const title = document.getElementById('title').value.trim();
            const genre = document.getElementById('genre').value.trim();
            const rating = parseFloat(document.getElementById('rating').value);
            const imageUrl = document.getElementById('imageUrl').value.trim();
            
            // 3. Проверяем данные
            if (!title || !genre || isNaN(rating)) {
                alert('❌ Заполните все обязательные поля!');
                return;
            }
            
            console.log('📦 Данные:', { title, genre, rating, imageUrl });
            
            // 4. Отправляем в Firestore
            try {
                // Импортируем addDoc
                const { collection, addDoc } = await import(
                    'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
                );
                
                // Добавляем документ
                const docRef = await addDoc(collection(window.db, 'games'), {
                    title: title,
                    genre: genre,
                    rating: rating,
                    imageUrl: imageUrl || 'https://via.placeholder.com/280x150'
                });
                
                console.log('✅ Игра добавлена! ID:', docRef.id);
                
                // 5. Очищаем форму
                form.reset();
                
                // 6. Показываем уведомление
                alert('✅ Игра успешно добавлена!');
                
                // 7. Обновляем список игр
                if (typeof loadAllGames === 'function') {
                    loadAllGames();
                }
            } catch (error) {
                console.error('❌ Ошибка:', error);
                alert('❌ Ошибка при добавлении: ' + error.message);
            }
        });
    }
});

// =============================================
// ЛАБОРАТОРНАЯ №7: Удаление и редактирование
// =============================================

// ==========================================
// ФУНКЦИЯ УДАЛЕНИЯ
// ==========================================

async function deleteGame(id) {
    console.log('🗑️ Удаляем игру с ID:', id);

    // Спрашиваем подтверждение
    const confirmed = confirm('Вы уверены, что хотите удалить эту игру?');
    if (!confirmed) {
        console.log('❌ Удаление отменено');
        return;
    }

    try {
        const { doc, deleteDoc } = await import(
            'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
        );

        // Удаляем документ по ID
        await deleteDoc(doc(window.db, 'games', id));

        console.log('✅ Игра удалена!');
        alert('✅ Игра успешно удалена!');

        // Плавное исчезновение карточки (ЛР12)
        const cardToRemove = document.querySelector(`.game-card[data-id="${id}"]`);
        if (cardToRemove) {
            cardToRemove.classList.add('removing');
            setTimeout(function () {
                loadAllGames();
            }, 300);
        } else {
            loadAllGames();
        }

    } catch (error) {
        console.error('❌ Ошибка удаления:', error);
        alert('❌ Ошибка при удалении: ' + error.message);
    }
}

// ==========================================
// ФУНКЦИЯ ОТКРЫТИЯ МОДАЛЬНОГО ОКНА
// ==========================================

async function openEditModal(id) {
    console.log('✏️ Открываем редактирование для ID:', id);

    try {
        const { doc, getDoc } = await import(
            'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
        );

        // Получаем текущие данные документа
        const docSnap = await getDoc(doc(window.db, 'games', id));

        if (!docSnap.exists()) {
            alert('❌ Игра не найдена');
            return;
        }

        const game = docSnap.data();
        console.log('📦 Текущие данные:', game);

        // Заполняем форму текущими данными
        document.getElementById('edit-id').value = id;
        document.getElementById('edit-title').value = game.title || '';
        document.getElementById('edit-genre').value = game.genre || '';
        document.getElementById('edit-rating').value = game.rating || 0;
        document.getElementById('edit-imageUrl').value = game.imageUrl || '';

        // Показываем модальное окно
        document.getElementById('edit-modal').classList.add('active');

    } catch (error) {
        console.error('❌ Ошибка:', error);
        alert('❌ Ошибка загрузки данных: ' + error.message);
    }
}

// ==========================================
// НАВЕШИВАЕМ ОБРАБОТЧИКИ НА КНОПКИ КАРТОЧЕК
// ==========================================

function attachCardHandlers() {
    // Кнопки «Удалить»
    document.querySelectorAll('.delete-btn').forEach(function (button) {
        button.addEventListener('click', function (event) {
            event.stopPropagation();
            deleteGame(button.getAttribute('data-id'));
        });
    });

    // Кнопки «Изменить»
    document.querySelectorAll('.edit-btn').forEach(function (button) {
        button.addEventListener('click', function (event) {
            event.stopPropagation();
            openEditModal(button.getAttribute('data-id'));
        });
    });
}

// ==========================================
// ОБРАБОТКА МОДАЛЬНОГО ОКНА РЕДАКТИРОВАНИЯ
// ==========================================

document.addEventListener('DOMContentLoaded', function () {
    const editForm = document.getElementById('edit-form');
    const modal = document.getElementById('edit-modal');
    const cancelBtn = document.getElementById('cancel-edit');

    // Страница без модального окна — выходим
    if (!editForm || !modal) return;

    const closeModal = function () {
        modal.classList.remove('active');
        editForm.reset();
    };

    // Отправка формы редактирования
    editForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        // Собираем данные из формы
        const id = document.getElementById('edit-id').value;
        const title = document.getElementById('edit-title').value.trim();
        const genre = document.getElementById('edit-genre').value.trim();
        const rating = parseFloat(document.getElementById('edit-rating').value);
        const imageUrl = document.getElementById('edit-imageUrl').value.trim();

        // Проверка
        if (!title || !genre || isNaN(rating)) {
            alert('❌ Заполните все обязательные поля!');
            return;
        }

        try {
            const { doc, updateDoc } = await import(
                'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
            );

            // Обновляем документ
            await updateDoc(doc(window.db, 'games', id), {
                title: title,
                genre: genre,
                rating: rating,
                imageUrl: imageUrl
            });

            console.log('✅ Игра обновлена!');
            alert('✅ Игра успешно обновлена!');

            // Закрываем модальное окно
            closeModal();

            // Обновляем список
            loadAllGames();

        } catch (error) {
            console.error('❌ Ошибка обновления:', error);
            alert('❌ Ошибка при обновлении: ' + error.message);
        }
    });

    // Кнопка «Отмена»
    cancelBtn.addEventListener('click', closeModal);

    // Клик по фону — закрыть модальное окно
    modal.addEventListener('click', function (event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Esc — закрыть модальное окно
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
});
// =============================================
// ЛАБОРАТОРНАЯ №8: Аутентификация (модальное окно)
// =============================================
document.addEventListener('DOMContentLoaded', function () {
    // ==========================================
    // ЭЛЕМЕНТЫ
    // ==========================================
    const loginBtn = document.getElementById('login-btn');
    const authModal = document.getElementById('auth-modal');
    const modalClose = document.getElementById('modal-close');
    const userMenu = document.getElementById('user-menu');

    // ==========================================
    // ОТКРЫТИЕ МОДАЛЬНОГО ОКНА
    // ==========================================
    if (loginBtn) {
        loginBtn.addEventListener('click', function () {
            authModal.classList.add('active');
            console.log('🔐 Открыто модальное окно аутентификации');
        });
    }

    // ==========================================
    // ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА
    // ==========================================
    // Кнопка ✕
    if (modalClose) {
        modalClose.addEventListener('click', function () {
            authModal.classList.remove('active');
        });
    }
    // Клик по фону
    if (authModal) {
        authModal.addEventListener('click', function (event) {
            if (event.target === authModal) {
                authModal.classList.remove('active');
            }
        });
    }
    // Esc
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && authModal.classList.contains('active')) {
            authModal.classList.remove('active');
        }
    });

    // ==========================================
    // ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
    // ==========================================
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const tabName = tab.getAttribute('data-tab');
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            document.getElementById(tabName + '-form').classList.add('active');
        });
    });

    // ==========================================
    // РЕГИСТРАЦИЯ
    // ==========================================
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const name = document.getElementById('register-name').value.trim();
            const email = document.getElementById('register-email').value.trim();
            const password = document.getElementById('register-password').value;

            try {
                const { createUserWithEmailAndPassword, updateProfile } = await import(
                    'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js'
                );
                const userCredential = await createUserWithEmailAndPassword(
                    window.auth, email, password
                );
                // Сохраняем имя в профиле
                await updateProfile(userCredential.user, {
                    displayName: name
                });
                console.log('✅ Регистрация успешна:', userCredential.user.email);
                alert('✅ Вы успешно зарегистрированы!');
                registerForm.reset();
                authModal.classList.remove('active');
            } catch (error) {
                console.error('❌ Ошибка регистрации:', error);
                handleAuthError(error);
            }
        });
    }

    // ==========================================
    // ВХОД
    // ==========================================
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            try {
                const { signInWithEmailAndPassword } = await import(
                    'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js'
                );
                const userCredential = await signInWithEmailAndPassword(
                    window.auth, email, password
                );
                console.log('✅ Вход выполнен:', userCredential.user.email);
                alert('✅ Вы успешно вошли!');
                loginForm.reset();
                authModal.classList.remove('active');
            } catch (error) {
                console.error('❌ Ошибка входа:', error);
                handleAuthError(error);
            }
        });
    }

    // ==========================================
    // ВЫХОД
    // ==========================================
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function () {
            try {
                const { signOut } = await import(
                    'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js'
                );
                await signOut(window.auth);
                console.log('✅ Выход выполнен');
                alert('Вы вышли из аккаунта');
            } catch (error) {
                console.error('❌ Ошибка выхода:', error);
            }
        });
    }

    // ==========================================
    // ОТСЛЕЖИВАНИЕ СОСТОЯНИЯ
    // ==========================================
    waitForAuthForModal();
});

// ==========================================
// ОЖИДАНИЕ FIREBASE AUTH
// ==========================================
function waitForAuthForModal() {
    if (window.firebaseReady && window.auth) {
        trackAuthStateForModal();
    } else {
        setTimeout(waitForAuthForModal, 100);
    }
}

// ==========================================
// ОТСЛЕЖИВАНИЕ ВХОДА/ВЫХОДА
// ==========================================
async function trackAuthStateForModal() {
    const { onAuthStateChanged } = await import(
        'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js'
    );
    onAuthStateChanged(window.auth, function (user) {
        const loginBtn = document.getElementById('login-btn');
        const userMenu = document.getElementById('user-menu');
        const addGameWrapper = document.getElementById('add-game-wrapper');

        if (user) {
            // Пользователь вошёл
            console.log('👤 Пользователь авторизован:', user.email);
            loginBtn.style.display = 'none';
            userMenu.style.display = 'flex';
            document.getElementById('user-display-name').textContent =
                user.displayName || user.email.split('@')[0];
            // Показываем форму добавления игры
            if (addGameWrapper) {
                addGameWrapper.style.display = 'block';
            }
        } else {
            // Пользователь вышел
            console.log('👤 Пользователь не авторизован');
            loginBtn.style.display = 'block';
            userMenu.style.display = 'none';
            // Скрываем форму добавления игры
            if (addGameWrapper) {
                addGameWrapper.style.display = 'none';
            }
        }
    });
}

// ==========================================
// ОБРАБОТКА ОШИБОК АУТЕНТИФИКАЦИИ
// ==========================================
function handleAuthError(error) {
    switch (error.code) {
        case 'auth/email-already-in-use':
            alert('❌ Этот email уже используется');
            break;
        case 'auth/invalid-email':
            alert('❌ Неверный формат email');
            break;
        case 'auth/weak-password':
            alert('❌ Пароль слишком простой (мин. 6 символов)');
            break;
        case 'auth/user-not-found':
            alert('❌ Пользователь не найден');
            break;
        case 'auth/wrong-password':
            alert('❌ Неверный пароль');
            break;
        case 'auth/invalid-credential':
            alert('❌ Неверный email или пароль');
            break;
        default:
            alert('❌ Ошибка: ' + error.message);
    }
}
// =============================================
// ЛАБОРАТОРНАЯ №9: Лидерборд
// =============================================

// ==========================================
// ЗАГРУЗКА ТОП-10 РЕКОРДОВ
// ==========================================
async function loadLeaderboard(gameFilter) {
    const tbody = document.getElementById('leaderboard-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Загрузка...</td></tr>';
    try {
        const { collection, query, orderBy, limit, where, getDocs } = await import(
            'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
        );
        let q;
        if (gameFilter) {
            q = query(
                collection(window.db, 'scores'),
                where('gameTitle', '==', gameFilter),
                orderBy('score', 'desc'),
                limit(10)
            );
        } else {
            q = query(
                collection(window.db, 'scores'),
                orderBy('score', 'desc'),
                limit(10)
            );
        }
        const querySnapshot = await getDocs(q);
        const scores = [];
        querySnapshot.forEach(function (doc) {
            scores.push(doc.data());
        });
        console.log('🏆 Загружено рекордов:', scores.length);
        renderLeaderboard(scores);
    } catch (error) {
        console.error('❌ Ошибка загрузки лидерборда:', error);
        if (error.message && error.message.includes('index')) {
            tbody.innerHTML = `
                <tr><td colspan="4" style="text-align: center; color: #e74c3c;">
                    ⚠️ Требуется создать индекс в Firestore.<br>
                    Проверь консоль (F12) и перейди по ссылке.
                </td></tr>
            `;
        } else {
            tbody.innerHTML = `
                <tr><td colspan="4" style="text-align: center; color: #e74c3c;">
                    ❌ Ошибка загрузки: ${error.message}
                </td></tr>
            `;
        }
    }
}

// ==========================================
// ОТРИСОВКА ТАБЛИЦЫ
// ==========================================
function renderLeaderboard(scores) {
    const tbody = document.getElementById('leaderboard-body');
    if (!tbody) return;
    if (scores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Пока нет рекордов</td></tr>';
        return;
    }
    const medals = ['🥇', '🥈', '🥉'];
    tbody.innerHTML = '';
    scores.forEach(function (score, index) {
        const tr = document.createElement('tr');
        const place = index < 3 ? medals[index] + ' ' + (index + 1) : index + 1;
        tr.innerHTML = `
            <td><strong>${place}</strong></td>
            <td>${escapeHtml(score.playerName)}</td>
            <td><strong>${Number(score.score).toLocaleString()}</strong></td>
            <td>${escapeHtml(score.gameTitle)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Безопасный вывод текста (защита от XSS)
function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
}

// ==========================================
// ДОБАВЛЕНИЕ НОВОГО РЕКОРДА И ФИЛЬТР
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    const scoreForm = document.getElementById('score-form');
    if (scoreForm) {
        scoreForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const playerName = document.getElementById('player-name').value.trim();
            const score = parseInt(document.getElementById('player-score').value, 10);
            const gameTitle = document.getElementById('game-title').value;
            if (!playerName || isNaN(score) || !gameTitle) {
                alert('❌ Заполните все поля!');
                return;
            }
            try {
                const { collection, addDoc } = await import(
                    'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
                );
                await addDoc(collection(window.db, 'scores'), {
                    playerName: playerName,
                    score: score,
                    gameTitle: gameTitle,
                    createdAt: new Date()
                });
                console.log('✅ Рекорд добавлен!');
                alert('✅ Рекорд успешно добавлен!');
                scoreForm.reset();
                const filter = document.getElementById('leaderboard-game-filter').value;
                loadLeaderboard(filter);
            } catch (error) {
                console.error('❌ Ошибка:', error);
                alert('❌ Ошибка: ' + error.message);
            }
        });
    }

    const gameFilter = document.getElementById('leaderboard-game-filter');
    if (gameFilter) {
        gameFilter.addEventListener('change', function () {
            loadLeaderboard(this.value);
        });
    }

    const leaderboardBody = document.getElementById('leaderboard-body');
    if (leaderboardBody) {
        if (window.firebaseReady && window.db) {
            loadLeaderboard('');
        } else {
            const onReady = function () {
                loadLeaderboard('');
                document.removeEventListener('firebase-ready', onReady);
            };
            document.addEventListener('firebase-ready', onReady);
        }
    }
});

// =============================================
// ЛР12: Бургер-меню
// =============================================
document.addEventListener('DOMContentLoaded', function () {
    const burgerToggle = document.getElementById('burger-toggle');
    const navItems = document.querySelectorAll('.main-nav a, .main-nav button');
    if (!burgerToggle) return;
    navItems.forEach(function (item) {
        item.addEventListener('click', function () {
            burgerToggle.checked = false;
        });
    });
});

// =============================================
// ЛАБОРАТОРНАЯ №11: Поиск и фильтрация
// =============================================

function applyFilters() {
    const searchInput = document.getElementById('search-input');
    const genreFilter = document.getElementById('genre-filter');
    const ratingFilter = document.getElementById('rating-filter');
    const sortFilter = document.getElementById('sort-filter');
    const resultsCount = document.getElementById('results-count');

    const searchText = (searchInput?.value || '').toLowerCase().trim();
    const genreValue = genreFilter?.value || '';
    const ratingRaw = parseFloat(ratingFilter?.value);
    const ratingValue = isNaN(ratingRaw) ? 0 : ratingRaw;
    const sortValue = sortFilter?.value || 'default';

    let filtered = [...allGames];

    // Поиск по названию и жанру одновременно (самостоятельная работа)
    if (searchText) {
        filtered = filtered.filter(function (game) {
            const title = String(game.title || '').toLowerCase();
            const genre = String(game.genre || '').toLowerCase();
            return title.includes(searchText) || genre.includes(searchText);
        });
    }

    // Фильтр по жанру
    if (genreValue) {
        filtered = filtered.filter(function (game) {
            return game.genre === genreValue;
        });
    }

    // Фильтр по рейтингу
    if (ratingValue > 0) {
        filtered = filtered.filter(function (game) {
            return parseFloat(game.rating) >= ratingValue;
        });
    }

    // Сортировка
    switch (sortValue) {
        case 'rating-desc':
            filtered.sort(function (a, b) { return parseFloat(b.rating) - parseFloat(a.rating); });
            break;
        case 'rating-asc':
            filtered.sort(function (a, b) { return parseFloat(a.rating) - parseFloat(b.rating); });
            break;
        case 'title-asc':
            filtered.sort(function (a, b) { return String(a.title).localeCompare(String(b.title)); });
            break;
        case 'title-desc':
            filtered.sort(function (a, b) { return String(b.title).localeCompare(String(a.title)); });
            break;
    }

    if (resultsCount) {
        resultsCount.textContent = 'Найдено: ' + filtered.length;
    }

    renderGames(filtered);
}

document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('search-input');
    const genreFilter = document.getElementById('genre-filter');
    const ratingFilter = document.getElementById('rating-filter');
    const sortFilter = document.getElementById('sort-filter');
    const resetBtn = document.getElementById('reset-filters');

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (genreFilter) genreFilter.addEventListener('change', applyFilters);
    if (ratingFilter) ratingFilter.addEventListener('input', applyFilters);
    if (sortFilter) sortFilter.addEventListener('change', applyFilters);

    if (resetBtn) {
        resetBtn.addEventListener('click', function () {
            if (searchInput) searchInput.value = '';
            if (genreFilter) genreFilter.value = '';
            if (ratingFilter) ratingFilter.value = '';
            if (sortFilter) sortFilter.value = 'default';
            applyFilters();
        });
    }
});
