document.addEventListener('DOMContentLoaded', () => {
    const currentUser = DB.getCurrentUser();
    if (!currentUser || currentUser.role !== 'warden') return;

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
    }

    // Tab Navigation
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const tabs = {
        'dashboard': document.getElementById('dashboardTab'),
        'complaints': document.getElementById('complaintsTab'),
        'food': document.getElementById('foodTab')
    };

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            if (!tabId || !tabs[tabId]) return;

            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            Object.values(tabs).forEach(tab => tab.classList.add('hidden'));
            tabs[tabId].classList.remove('hidden');

            if (window.innerWidth <= 768) {
                sidebar.classList.remove('show');
            }

            if (tabId === 'dashboard') renderRequests();
            if (tabId === 'complaints') renderComplaints();
            if (tabId === 'food') loadWardenFoodMenu();
        });
    });

    // --- Gatepass Logic ---
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');

    if (searchInput && statusFilter) {
        searchInput.addEventListener('input', renderRequests);
        statusFilter.addEventListener('change', renderRequests);
    }

    let currentPassIdToReview = null;

    function renderRequests() {
        const tbody = document.querySelector('#allRequestsTable tbody');
        const noDataMsg = document.getElementById('noRequestsMsg');
        if (!tbody) return;
        
        let passes = DB.getPasses();
        passes.sort((a, b) => new Date(b.applyDate) - new Date(a.applyDate));

        const searchVal = searchInput.value.toLowerCase().trim();
        const filterVal = statusFilter.value;

        passes = passes.filter(p => {
            const matchesSearch = p.id.toLowerCase().includes(searchVal) || 
                                  p.studentName.toLowerCase().includes(searchVal) ||
                                  p.room.toLowerCase().includes(searchVal);
            const matchesStatus = filterVal === 'all' || p.status === filterVal;
            return matchesSearch && matchesStatus;
        });

        tbody.innerHTML = '';
        
        if (passes.length === 0) {
            noDataMsg.style.display = 'block';
            document.getElementById('allRequestsTable').style.display = 'none';
            return;
        }

        noDataMsg.style.display = 'none';
        document.getElementById('allRequestsTable').style.display = 'table';

        passes.forEach(pass => {
            const tr = document.createElement('tr');
            let badgeClass = pass.status === 'approved' ? 'badge-approved' : (pass.status === 'rejected' ? 'badge-rejected' : 'badge-pending');

            tr.innerHTML = `
                <td><strong>${pass.id}</strong></td>
                <td>
                    <div style="font-weight: 500;">${pass.studentName}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">Room: ${pass.room}</div>
                </td>
                <td>${Utils.formatDate(pass.outDate)}</td>
                <td>${Utils.formatDate(pass.inDate)}</td>
                <td><span class="badge ${badgeClass}">${pass.status}</span></td>
                <td>
                    <button class="btn btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="reviewPass('${pass.id}')">
                        ${pass.status === 'pending' ? 'Review' : 'View'}
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.reviewPass = (id) => {
        const pass = DB.getPassById(id);
        if (!pass) return;

        currentPassIdToReview = id;
        const modalBody = document.getElementById('modalBody');
        let badgeClass = pass.status === 'approved' ? 'badge-approved' : (pass.status === 'rejected' ? 'badge-rejected' : 'badge-pending');

        let actionHtml = '';
        if (pass.status === 'pending') {
            actionHtml = `
                <div class="form-group" style="margin-top: 1.5rem;">
                    <label for="remarks">Warden Remarks</label>
                    <textarea id="remarks" class="form-control" rows="3" placeholder="Add optional remarks..."></textarea>
                </div>
                <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                    <button class="btn btn-success" onclick="updatePassStatus('approved')"><i class="ri-check-line"></i> Approve</button>
                    <button class="btn btn-danger" onclick="updatePassStatus('rejected')"><i class="ri-close-line"></i> Reject</button>
                </div>
            `;
        } else {
            actionHtml = `
                <div style="margin-top: 1.5rem;">
                    <strong style="display:block; margin-bottom:0.5rem; color:var(--warning);">Warden Remarks:</strong>
                    <p style="background:var(--bg-main); padding:0.75rem; border-radius:var(--radius); margin:0;">${pass.remarks || 'No remarks added.'}</p>
                </div>
            `;
        }

        modalBody.innerHTML = `
            <div style="display:grid; gap: 1rem;">
                <div style="display:flex; justify-content: space-between;">
                    <div><strong>Pass ID:</strong> <span>${pass.id}</span></div>
                    <span class="badge ${badgeClass}">${pass.status}</span>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: var(--bg-main); padding: 1rem; border-radius: var(--radius);">
                    <div><div style="color: var(--text-secondary); font-size: 0.75rem;">Student Name</div><strong>${pass.studentName}</strong></div>
                    <div><div style="color: var(--text-secondary); font-size: 0.75rem;">Room No.</div><strong>${pass.room}</strong></div>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div><div style="color: var(--text-secondary); font-size: 0.75rem;">Out Date</div><strong>${Utils.formatDate(pass.outDate)}</strong></div>
                    <div><div style="color: var(--text-secondary); font-size: 0.75rem;">In Date</div><strong>${Utils.formatDate(pass.inDate)}</strong></div>
                </div>
                <div><div style="color: var(--text-secondary); font-size: 0.75rem; margin-bottom: 0.25rem;">Destination</div><div>${pass.destination}</div></div>
                <div><div style="color: var(--text-secondary); font-size: 0.75rem; margin-bottom: 0.25rem;">Reason</div><p style="margin:0;">${pass.reason}</p></div>
                ${actionHtml}
            </div>
        `;
        document.getElementById('reviewModal').classList.add('show');
    };

    window.updatePassStatus = (status) => {
        if (!currentPassIdToReview) return;
        const pass = DB.getPassById(currentPassIdToReview);
        if (!pass) return;

        const remarksInput = document.getElementById('remarks');
        pass.status = status;
        pass.remarks = remarksInput ? remarksInput.value.trim() : '';

        DB.updatePass(pass);
        Utils.showToast(`Pass request ${status}!`, status === 'approved' ? 'success' : 'error');
        closeModal('reviewModal');
        renderRequests();
    };

    // --- Complaints Logic ---
    let currentComplaintIdToReview = null;

    function renderComplaints() {
        const tbody = document.querySelector('#wardenComplaintsTable tbody');
        const noDataMsg = document.getElementById('noWardenComplaintsMsg');
        if (!tbody) return;

        let complaints = DB.getComplaints();
        complaints.sort((a, b) => new Date(b.date) - new Date(a.date));

        tbody.innerHTML = '';
        if (complaints.length === 0) {
            noDataMsg.style.display = 'block';
            document.getElementById('wardenComplaintsTable').style.display = 'none';
            return;
        }

        noDataMsg.style.display = 'none';
        document.getElementById('wardenComplaintsTable').style.display = 'table';

        complaints.forEach(cmp => {
            const tr = document.createElement('tr');
            let badgeClass = cmp.status === 'Resolved' ? 'badge-approved' : 'badge-pending';
            
            tr.innerHTML = `
                <td>${Utils.formatDate(cmp.date)}</td>
                <td>
                    <div style="font-weight: 500;">${cmp.studentName}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">Room: ${cmp.room}</div>
                </td>
                <td><strong>${cmp.type}</strong></td>
                <td>${cmp.title}</td>
                <td><span class="badge ${badgeClass}">${cmp.status}</span></td>
                <td>
                    <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="reviewComplaint('${cmp.id}')">
                        ${cmp.status === 'Pending' ? 'Resolve' : 'View'}
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.reviewComplaint = (id) => {
        const complaints = DB.getComplaints();
        const cmp = complaints.find(c => c.id === id);
        if (!cmp) return;

        currentComplaintIdToReview = id;
        const modalBody = document.getElementById('complaintModalBody');
        let badgeClass = cmp.status === 'Resolved' ? 'badge-approved' : 'badge-pending';

        let actionHtml = '';
        if (cmp.status === 'Pending') {
            actionHtml = `
                <div class="form-group" style="margin-top: 1.5rem;">
                    <label for="cmpRemarks">Resolution Remarks</label>
                    <textarea id="cmpRemarks" class="form-control" rows="3" placeholder="How was this resolved?"></textarea>
                </div>
                <div style="margin-top: 1rem;">
                    <button class="btn btn-success btn-block" onclick="resolveComplaint()"><i class="ri-check-double-line"></i> Mark as Resolved</button>
                </div>
            `;
        } else {
            actionHtml = `
                <div style="margin-top: 1.5rem;">
                    <strong style="display:block; margin-bottom:0.5rem; color:var(--success);">Resolution Details:</strong>
                    <p style="background:var(--bg-main); padding:0.75rem; border-radius:var(--radius); margin:0;">${cmp.remarks || 'No remarks provided.'}</p>
                </div>
            `;
        }

        modalBody.innerHTML = `
            <div style="display:grid; gap: 1rem;">
                <div style="display:flex; justify-content: space-between;">
                    <div><strong>Type:</strong> <span>${cmp.type}</span></div>
                    <span class="badge ${badgeClass}">${cmp.status}</span>
                </div>
                <div><strong style="display:block;">${cmp.title}</strong><div style="color:var(--text-secondary); font-size:0.875rem;">By ${cmp.studentName} (${cmp.room}) on ${Utils.formatDate(cmp.date)}</div></div>
                <div><p style="background:var(--bg-main); padding:0.75rem; border-radius:var(--radius); margin:0;">${cmp.description}</p></div>
                ${actionHtml}
            </div>
        `;
        document.getElementById('reviewComplaintModal').classList.add('show');
    };

    window.resolveComplaint = () => {
        if (!currentComplaintIdToReview) return;
        const remarksInput = document.getElementById('cmpRemarks');
        
        const complaints = DB.getComplaints();
        const cmp = complaints.find(c => c.id === currentComplaintIdToReview);
        if (cmp) {
            cmp.status = 'Resolved';
            cmp.remarks = remarksInput ? remarksInput.value.trim() : '';
            DB.updateComplaint(cmp);
            Utils.showToast('Complaint resolved!', 'success');
        }
        
        closeModal('reviewComplaintModal');
        renderComplaints();
    };

    // --- Modal Shared Logic ---
    window.closeModal = (modalId) => {
        document.getElementById(modalId).classList.remove('show');
    };

    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // --- Food Menu Logic ---
    function loadWardenFoodMenu() {
        const tbody = document.getElementById('wardenFoodTableBody');
        if (!tbody) return;

        const menu = DB.getFoodMenu();
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        tbody.innerHTML = '';
        days.forEach(day => {
            const data = menu[day] || { breakfast: '', lunch: '', dinner: '' };
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-transform: capitalize; vertical-align: middle;"><strong>${day}</strong></td>
                <td><input type="text" class="form-control" id="food_${day}_breakfast" value="${data.breakfast}"></td>
                <td><input type="text" class="form-control" id="food_${day}_lunch" value="${data.lunch}"></td>
                <td><input type="text" class="form-control" id="food_${day}_dinner" value="${data.dinner}"></td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.saveWardenFoodMenu = () => {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const newMenu = {};
        
        days.forEach(day => {
            const breakfast = document.getElementById(`food_${day}_breakfast`)?.value.trim() || '';
            const lunch = document.getElementById(`food_${day}_lunch`)?.value.trim() || '';
            const dinner = document.getElementById(`food_${day}_dinner`)?.value.trim() || '';
            newMenu[day] = { breakfast, lunch, dinner };
        });

        DB.saveFoodMenu(newMenu);
        Utils.showToast('Food Menu updated successfully!', 'success');
    };

    // Initial render
    renderRequests();
});
