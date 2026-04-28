const Utils = {
    generateId: () => {
        return 'PASS-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    },

    formatDate: (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    },

    showToast: (message, type = 'info') => {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'ri-information-line';
        if (type === 'success') icon = 'ri-check-line';
        if (type === 'error') icon = 'ri-error-warning-line';

        toast.innerHTML = `
            <i class="${icon} text-lg"></i>
            <div>${message}</div>
        `;

        container.appendChild(toast);

        // Trigger reflow
        toast.offsetHeight;
        
        // Show
        toast.classList.add('show');

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
};
