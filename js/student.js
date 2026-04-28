document.addEventListener('DOMContentLoaded', () => {
    const currentUser = DB.getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') return;

    // Tab Navigation
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const tabs = {
        'dashboard': document.getElementById('dashboardTab'),
        'food': document.getElementById('foodTab'),
        'laundry': document.getElementById('laundryTab'),
        'fees': document.getElementById('feesTab'),
        'complaints': document.getElementById('complaintsTab')
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
                document.getElementById('sidebar').classList.remove('show');
            }

            // Load data for specific tabs
            if (tabId === 'dashboard') loadRequests();
            if (tabId === 'laundry') loadLaundry();
            if (tabId === 'fees') loadFees();
            if (tabId === 'complaints') loadComplaints();
        });
    });

    // --- Gatepass Logic ---
    const applyForm = document.getElementById('applyForm');
    if (applyForm) {
        applyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const outDateStr = document.getElementById('outDate').value;
            const inDateStr = document.getElementById('inDate').value;
            
            if (new Date(inDateStr) <= new Date(outDateStr)) {
                Utils.showToast('In Date must be after Out Date', 'error');
                return;
            }

            const newPass = {
                id: Utils.generateId(),
                studentId: currentUser.id,
                studentName: currentUser.name,
                room: currentUser.room,
                applyDate: new Date().toISOString(),
                outDate: outDateStr,
                inDate: inDateStr,
                destination: document.getElementById('destination').value,
                reason: document.getElementById('reason').value,
                status: 'pending',
                remarks: '',
                guardOutTime: null,
                guardInTime: null
            };

            DB.addPass(newPass);
            Utils.showToast('Gatepass request submitted!', 'success');
            applyForm.reset();
            document.getElementById('applyPassModal').classList.remove('show');
            loadRequests();
        });
    }

    function loadRequests() {
        const tbody = document.querySelector('#requestsTable tbody');
        const noDataMsg = document.getElementById('noRequestsMsg');
        const passes = DB.getPasses().filter(p => p.studentId === currentUser.id);

        tbody.innerHTML = '';
        if (passes.length === 0) {
            noDataMsg.style.display = 'block';
            document.getElementById('requestsTable').style.display = 'none';
            return;
        }

        noDataMsg.style.display = 'none';
        document.getElementById('requestsTable').style.display = 'table';
        passes.sort((a, b) => new Date(b.applyDate) - new Date(a.applyDate));

        passes.forEach(pass => {
            const tr = document.createElement('tr');
            let badgeClass = pass.status === 'approved' ? 'badge-approved' : (pass.status === 'rejected' ? 'badge-rejected' : 'badge-pending');

            let actionBtn = `<button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="viewPassDetails('${pass.id}')">View</button>`;
            if (pass.status === 'approved') {
                actionBtn += ` <a href="gatepass.html?id=${pass.id}" class="btn btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" target="_blank">Digital Pass</a>`;
            }

            tr.innerHTML = `
                <td>${Utils.formatDate(pass.applyDate)}</td>
                <td>${Utils.formatDate(pass.outDate)}</td>
                <td style="max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${pass.reason}</td>
                <td><span class="badge ${badgeClass}">${pass.status}</span></td>
                <td>${actionBtn}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.viewPassDetails = (id) => {
        const pass = DB.getPassById(id);
        if (!pass) return;
        const modalBody = document.getElementById('modalBody');
        let badgeClass = pass.status === 'approved' ? 'badge-approved' : (pass.status === 'rejected' ? 'badge-rejected' : 'badge-pending');

        modalBody.innerHTML = `
            <div style="display:grid; gap: 1rem;">
                <div style="display:flex; justify-content: space-between;"><strong>Pass ID:</strong> <span>${pass.id}</span></div>
                <div style="display:flex; justify-content: space-between;"><strong>Status:</strong> <span class="badge ${badgeClass}">${pass.status}</span></div>
                <hr style="border-top: 1px solid var(--border-color);">
                <div style="display:flex; justify-content: space-between;"><strong>Out:</strong> <span>${Utils.formatDate(pass.outDate)}</span></div>
                <div style="display:flex; justify-content: space-between;"><strong>In:</strong> <span>${Utils.formatDate(pass.inDate)}</span></div>
                <div style="display:flex; justify-content: space-between;"><strong>Destination:</strong> <span>${pass.destination}</span></div>
                <div><strong style="display:block;">Reason:</strong><p style="background:var(--bg-main); padding:0.75rem; border-radius:var(--radius); margin-top:0.5rem;">${pass.reason}</p></div>
                ${pass.remarks ? `<div><strong style="display:block; color:var(--warning);">Warden Remarks:</strong><p style="background:var(--bg-main); padding:0.75rem; border-radius:var(--radius); margin-top:0.5rem;">${pass.remarks}</p></div>` : ''}
            </div>
        `;
        document.getElementById('passModal').classList.add('show');
    };

    // --- Laundry Logic ---
    function loadLaundry() {
        const tbody = document.querySelector('#laundryTable tbody');
        const laundry = DB.getLaundry().filter(l => l.studentId === currentUser.id);
        tbody.innerHTML = '';
        laundry.forEach(item => {
            const tr = document.createElement('tr');
            let badgeClass = item.status === 'Ready' || item.status === 'Delivered' ? 'badge-approved' : 'badge-pending';
            tr.innerHTML = `
                <td>${item.id}</td>
                <td>${Utils.formatDate(item.date)}</td>
                <td>${item.items}</td>
                <td>${item.weight}</td>
                <td><span class="badge ${badgeClass}">${item.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
        if (laundry.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No laundry history.</td></tr>';
        }
    }

    // --- Fees Logic ---
    function loadFees() {
        const allFees = DB.getFees();
        let myFees = allFees.find(f => f.studentId === currentUser.id);
        
        if (!myFees) {
            // Initialize mock fees if missing
            myFees = { studentId: currentUser.id, totalDue: 5000, paid: 0, history: [] };
            allFees.push(myFees);
            DB.saveFees(allFees);
        }

        const balance = myFees.totalDue - myFees.paid;
        document.getElementById('totalFeeDisplay').textContent = `₹${myFees.totalDue}`;
        document.getElementById('paidFeeDisplay').textContent = `₹${myFees.paid}`;
        document.getElementById('dueFeeDisplay').textContent = `₹${balance}`;

        const tbody = document.querySelector('#feeHistoryTable tbody');
        tbody.innerHTML = '';
        const history = [...myFees.history].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        history.forEach(h => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${Utils.formatDate(h.date)}</td><td>₹${h.amount}</td><td>${h.method}</td>`;
            tbody.appendChild(tr);
        });
        if (history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No payments made yet.</td></tr>';
        }
    }

    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseInt(document.getElementById('payAmount').value, 10);
            const method = document.getElementById('payMethod').value;
            
            const allFees = DB.getFees();
            let myFees = allFees.find(f => f.studentId === currentUser.id);
            const balance = myFees.totalDue - myFees.paid;

            if (amount > balance) {
                Utils.showToast(`Cannot pay more than balance due (₹${balance})`, 'error');
                return;
            }

            DB.updateStudentFee(currentUser.id, amount, method);
            Utils.showToast('Payment successful!', 'success');
            paymentForm.reset();
            loadFees();
        });
    }

    // --- Complaints Logic ---
    const complaintForm = document.getElementById('complaintForm');
    if (complaintForm) {
        complaintForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newComplaint = {
                id: 'CMP-' + Math.floor(Math.random() * 100000),
                studentId: currentUser.id,
                studentName: currentUser.name,
                room: currentUser.room,
                date: new Date().toISOString(),
                type: document.getElementById('compType').value,
                title: document.getElementById('compTitle').value,
                description: document.getElementById('compDesc').value,
                status: 'Pending',
                remarks: ''
            };
            DB.addComplaint(newComplaint);
            Utils.showToast('Complaint submitted successfully.', 'success');
            complaintForm.reset();
            document.getElementById('complaintModal').classList.remove('show');
            loadComplaints();
        });
    }

    function loadComplaints() {
        const tbody = document.querySelector('#complaintsTable tbody');
        const noDataMsg = document.getElementById('noComplaintsMsg');
        const complaints = DB.getComplaints().filter(c => c.studentId === currentUser.id);

        tbody.innerHTML = '';
        if (complaints.length === 0) {
            noDataMsg.style.display = 'block';
            document.getElementById('complaintsTable').style.display = 'none';
            return;
        }

        noDataMsg.style.display = 'none';
        document.getElementById('complaintsTable').style.display = 'table';
        complaints.sort((a, b) => new Date(b.date) - new Date(a.date));

        complaints.forEach(cmp => {
            const tr = document.createElement('tr');
            let badgeClass = cmp.status === 'Resolved' ? 'badge-approved' : 'badge-pending';
            
            tr.innerHTML = `
                <td>${Utils.formatDate(cmp.date)}</td>
                <td><strong>${cmp.type}</strong></td>
                <td>${cmp.title}</td>
                <td><span class="badge ${badgeClass}">${cmp.status}</span></td>
                <td>${cmp.remarks || '-'}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Initial load
    loadRequests();
});
