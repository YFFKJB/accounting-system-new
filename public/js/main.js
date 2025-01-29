document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // 保存token
            localStorage.setItem('token', data.token);
            // 跳转到主页
            window.location.href = '/dashboard.html';
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('登录失败，请重试');
    }
});
