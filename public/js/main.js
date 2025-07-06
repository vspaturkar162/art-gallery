// Fixed main.js with proper JSON handling

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Handle Registration Form
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.querySelector('#registerModal form');
    const loginForm = document.querySelector('#loginModal form');

    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const userData = {
                username: formData.get('username'),
                email: formData.get('email'),
                password: formData.get('password')
            };

            console.log('Submitting registration:', userData);

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData)
                });

                const result = await response.json();
                console.log('Registration response:', result);

                if (result.success) {
                    alert('Registration successful! You can now login.');
                    closeModal('registerModal');
                    this.reset(); // Clear the form
                } else {
                    alert('Registration failed: ' + result.message);
                }

            } catch (error) {
                console.error('Registration error:', error);
                alert('Registration failed. Please try again.');
            }
        });
    }

    // Handle Login Form
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const loginData = {
                email: formData.get('email'),
                password: formData.get('password')
            };

            console.log('Submitting login:', loginData);

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(loginData)
                });

                const result = await response.json();
                console.log('Login response:', result);

                if (result.success) {
                    alert('Login successful! Welcome back.');
                    closeModal('loginModal');
                    this.reset(); // Clear the form
                    // You can redirect or update UI here
                    // window.location.reload(); // Optional: reload page to show logged-in state
                    if (result.redirect) {
                        window.location.href = result.redirect;
                    } else {
                        window.location.href = '/dashboard'; // fallback redirect
                    }
                } else {
                    alert('Login failed: ' + result.message);
                }

            } catch (error) {
                console.error('Login error:', error);
                alert('Login failed. Please try again.');
            }
        });
    }
});