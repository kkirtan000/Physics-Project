document.addEventListener('DOMContentLoaded', () => {
    // Determine which page we are on
    const path = window.location.pathname;
    const isLoginPage = path.endsWith('index.html') || path === '/' || !path.includes('.html');

    // Check Authentication
    const currentUser = DB.getCurrentUser();
    
    if (!isLoginPage && !currentUser) {
        window.location.href = 'index.html';
        return;
    }

    if (isLoginPage && currentUser) {
        // Redirect to respective dashboard if already logged in
        window.location.href = `${currentUser.role}.html`;
        return;
    }

    // Login Page Logic
    if (isLoginPage) {
        const loginForm = document.getElementById('loginForm');
        const roleBtns = document.querySelectorAll('.role-btn');
        let selectedRole = 'student';

        roleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                roleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedRole = btn.getAttribute('data-role');
            });
        });

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const userId = document.getElementById('userId').value.trim();
            const password = document.getElementById('password').value;

            const user = DB.getUserById(userId);

            if (!user) {
                Utils.showToast('User not found!', 'error');
                return;
            }

            if (user.password !== password) {
                Utils.showToast('Invalid password!', 'error');
                return;
            }

            if (user.role !== selectedRole) {
                Utils.showToast(`User is not a ${selectedRole}!`, 'error');
                return;
            }

            // Success
            DB.setCurrentUser({ id: user.id, name: user.name, role: user.role, room: user.room });
            Utils.showToast('Login successful!', 'success');
            
            setTimeout(() => {
                window.location.href = `${user.role}.html`;
            }, 1000);
        });
    }

    // Global Logout handler setup
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            DB.clearSession();
            window.location.href = 'index.html';
        });
    }

    // Setup user name in header if element exists
    const userNameDisplay = document.getElementById('userNameDisplay');
    if (userNameDisplay && currentUser) {
        userNameDisplay.textContent = currentUser.name;
    }
});
