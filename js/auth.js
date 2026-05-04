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

        // Toggle Login / Signup
        const showSignupBtn = document.getElementById('showSignup');
        const showLoginBtn = document.getElementById('showLogin');
        const signupForm = document.getElementById('signupForm');
        const roleSelector = document.getElementById('roleSelector');
        
        if (showSignupBtn && showLoginBtn && signupForm) {
            showSignupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                loginForm.style.display = 'none';
                roleSelector.style.display = 'none';
                signupForm.style.display = 'block';
            });
            showLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                signupForm.style.display = 'none';
                loginForm.style.display = 'block';
                roleSelector.style.display = 'flex';
            });
        }

        // Signup form logic
        const signupRole = document.getElementById('signupRole');
        const studentFields = document.getElementById('studentFields');
        const staffFields = document.getElementById('staffFields');
        
        if (signupRole && studentFields) {
            signupRole.addEventListener('change', (e) => {
                if (e.target.value === 'student') {
                    studentFields.style.display = 'block';
                    if (staffFields) staffFields.style.display = 'none';
                } else {
                    studentFields.style.display = 'none';
                    if (staffFields) staffFields.style.display = 'block';
                }
            });
        }

        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('signupName').value.trim();
                const id = document.getElementById('signupId').value.trim();
                const password = document.getElementById('signupPassword').value;
                const role = document.getElementById('signupRole').value;
                const room = document.getElementById('signupRoom') ? document.getElementById('signupRoom').value.trim() : '';
                const phone = document.getElementById('signupPhone') ? document.getElementById('signupPhone').value.trim() : '';

                if (!name || !id || !password || !role) {
                    Utils.showToast('Please fill all required fields', 'error');
                    return;
                }

                // Security check for Warden and Guard
                if (role !== 'student') {
                    const secretCode = document.getElementById('signupSecretCode') ? document.getElementById('signupSecretCode').value.trim() : '';
                    if (secretCode !== 'ADMIN123') {
                        Utils.showToast('Invalid Admin Secret Code!', 'error');
                        return;
                    }
                }

                const newUser = { id, name, password, role };
                if (role === 'student') {
                    newUser.room = room;
                    newUser.phone = phone;
                }

                const success = DB.addUser(newUser);
                if (success) {
                    Utils.showToast('Account created successfully! Please log in.', 'success');
                    signupForm.reset();
                    showLoginBtn.click(); // Back to login view
                } else {
                    Utils.showToast('User ID already exists!', 'error');
                }
            });
        }
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
