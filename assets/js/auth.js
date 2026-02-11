class RegistrationForm {
    constructor() {
        this.formSection = document.getElementById('register-form-section');
        this.grafiterBtn = document.getElementById('grafiter-btn');
        this.sidebarRegisterBtn = document.getElementById('sidebar-register-btn');
        this.sidebarLoginBtn = document.getElementById('sidebar-login-btn');
        this.cancelBtns = document.querySelectorAll('.cancel-btn');
        this.registerForm = document.getElementById('register-form');
        this.loginForm = document.getElementById('login-form');
        this.isFormVisible = false;
        this.isRegisterExpanded = false;
        this.isLoginExpanded = false;
        
        this.init();
    }

    init() {
        this.grafiterBtn.addEventListener('click', () => this.toggleForm());
        this.sidebarRegisterBtn.addEventListener('click', () => this.toggleRegisterForm());
        if (this.sidebarLoginBtn) {
            this.sidebarLoginBtn.addEventListener('click', () => this.toggleLoginForm());
        }
        this.cancelBtns.forEach(btn => {
            btn.addEventListener('click', () => this.hideForm());
        });
        
        this.registerForm.addEventListener('submit', (e) => this.handleRegisterSubmit(e));
        this.loginForm.addEventListener('submit', (e) => this.handleLoginSubmit(e));
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isFormVisible) {
                this.hideForm();
            }
        });
    }

    toggleForm() {
        this.isFormVisible ? this.hideForm() : this.showForm();
    }

    showForm() {
        this.formSection.style.display = 'block';
        document.querySelector('.main-content').classList.add('with-sidebar');
        this.isFormVisible = true;
    }

    hideForm() {
        this.formSection.style.display = 'none';
        document.querySelector('.main-content').classList.remove('with-sidebar');
        this.isFormVisible = false;
        
        this.registerForm.reset();
        this.loginForm.reset();
        this.registerForm.style.display = 'none';
        this.loginForm.style.display = 'none';
        
        this.isRegisterExpanded = false;
        this.isLoginExpanded = false;
        this.sidebarRegisterBtn.style.background = 'none';
        if(this.sidebarLoginBtn) this.sidebarLoginBtn.style.background = 'none';
    }

    toggleRegisterForm() {
        if (this.isRegisterExpanded) {
            this.isRegisterExpanded = false;
            this.registerForm.style.display = 'none';
            this.sidebarRegisterBtn.style.background = 'none';
        } else {
            if (this.isLoginExpanded) {
                this.isLoginExpanded = false;
                this.loginForm.style.display = 'none';
                this.sidebarLoginBtn.style.background = 'none';
            }
            this.isRegisterExpanded = true;
            this.registerForm.style.display = 'flex';
            this.sidebarRegisterBtn.style.background = 'linear-gradient(135deg, #00bfff, #8a2be2)';
        }
    }

    toggleLoginForm() {
        if (this.isLoginExpanded) {
            this.isLoginExpanded = false;
            this.loginForm.style.display = 'none';
            this.sidebarLoginBtn.style.background = 'none';
        } else {
            if (this.isRegisterExpanded) {
                this.isRegisterExpanded = false;
                this.registerForm.style.display = 'none';
                this.sidebarRegisterBtn.style.background = 'none';
            }
            this.isLoginExpanded = true;
            this.loginForm.style.display = 'flex';
            this.sidebarLoginBtn.style.background = 'linear-gradient(135deg, #00bfff, #8a2be2)';
        }
    }

    handleRegisterSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.registerForm);
        const username = formData.get('username');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirm-password');

        if (password !== confirmPassword) {
            alert('Las contraseñas no coinciden.');
            return;
        }
        if (password.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        const users = JSON.parse(localStorage.getItem('grafiter_users') || '[]');
        if (users.some(user => user.email === email)) {
            alert('Este correo electrónico ya está registrado.');
            return;
        }

        // NOTA: Esto no es seguro para producción. Es un placeholder para la Fase 2.
        // En un backend real, usaríamos un algoritmo de hashing como bcrypt.
        const hashedPassword = btoa(password);

        users.push({ username, email, password: hashedPassword });
        localStorage.setItem('grafiter_users', JSON.stringify(users));

        alert(`¡Usuario ${username} registrado con éxito! Ahora puedes iniciar sesión.`);
        this.hideForm();
    }

    handleLoginSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.loginForm);
        const email = formData.get('login-email');
        const password = formData.get('login-password');

        if (!email || !password) {
            alert('Por favor, completa todos los campos.');
            return;
        }

        const users = JSON.parse(localStorage.getItem('grafiter_users') || '[]');
        const user = users.find(u => u.email === email);

        // Comparamos la contraseña "hasheada"
        if (!user || user.password !== btoa(password)) {
            alert('Credenciales incorrectas.');
            return;
        }
        
        const submitBtn = this.loginForm.querySelector('.submit-btn');
        submitBtn.textContent = 'Iniciando sesión...';
        submitBtn.disabled = true;
        
        // Guardar sesión
        const session = {
            email: user.email,
            username: user.username,
            loggedInAt: new Date().toISOString()
        };
        localStorage.setItem('grafiter_session', JSON.stringify(session));

        setTimeout(() => {
            window.location.href = 'USUARIOS/voicebox.html';
        }, 1000);
    }
}
