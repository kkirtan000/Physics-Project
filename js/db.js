const DB_KEYS = {
    USERS: 'gatepass_users',
    PASSES: 'gatepass_requests',
    SESSION: 'gatepass_current_user',
    THEME: 'gatepass_theme',
    COMPLAINTS: 'hostel_complaints',
    FEES: 'hostel_fees',
    LAUNDRY: 'hostel_laundry'
};

// Initial Dummy Data
const DUMMY_USERS = [
    { id: 'S001', name: 'John Doe', role: 'student', password: 'password', room: 'A-101', phone: '1234567890' },
    { id: 'S002', name: 'Jane Smith', role: 'student', password: 'password', room: 'B-205', phone: '0987654321' },
    { id: 'W001', name: 'Warden Smith', role: 'warden', password: 'password' },
    { id: 'G001', name: 'Guard Mike', role: 'guard', password: 'password' }
];

const DB = {
    init: () => {
        if (!localStorage.getItem(DB_KEYS.USERS)) {
            localStorage.setItem(DB_KEYS.USERS, JSON.stringify(DUMMY_USERS));
        }
        if (!localStorage.getItem(DB_KEYS.PASSES)) {
            localStorage.setItem(DB_KEYS.PASSES, JSON.stringify([]));
        }
        if (!localStorage.getItem(DB_KEYS.THEME)) {
            localStorage.setItem(DB_KEYS.THEME, 'light');
        }
        if (!localStorage.getItem(DB_KEYS.COMPLAINTS)) {
            localStorage.setItem(DB_KEYS.COMPLAINTS, JSON.stringify([]));
        }
        if (!localStorage.getItem(DB_KEYS.FEES)) {
            // Mock fees data for students
            const dummyFees = [
                { studentId: 'S001', totalDue: 5000, paid: 2000, history: [{ date: new Date().toISOString(), amount: 2000, method: 'Card' }] },
                { studentId: 'S002', totalDue: 5000, paid: 5000, history: [{ date: new Date().toISOString(), amount: 5000, method: 'UPI' }] }
            ];
            localStorage.setItem(DB_KEYS.FEES, JSON.stringify(dummyFees));
        }
        if (!localStorage.getItem(DB_KEYS.LAUNDRY)) {
            const dummyLaundry = [
                { id: 'L-123', studentId: 'S001', date: new Date().toISOString(), items: 5, weight: '2.5kg', status: 'Ready' },
                { id: 'L-124', studentId: 'S001', date: new Date(Date.now() - 86400000).toISOString(), items: 3, weight: '1kg', status: 'Delivered' }
            ];
            localStorage.setItem(DB_KEYS.LAUNDRY, JSON.stringify(dummyLaundry));
        }
    },
    
    getUsers: () => JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]'),
    
    getUserById: (id) => {
        const users = DB.getUsers();
        return users.find(u => u.id === id);
    },
    
    addUser: (user) => {
        const users = DB.getUsers();
        if (users.find(u => u.id === user.id)) {
            return false;
        }
        users.push(user);
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
        return true;
    },
    
    getPasses: () => JSON.parse(localStorage.getItem(DB_KEYS.PASSES) || '[]'),
    
    savePasses: (passes) => {
        localStorage.setItem(DB_KEYS.PASSES, JSON.stringify(passes));
    },
    
    addPass: (pass) => {
        const passes = DB.getPasses();
        passes.push(pass);
        DB.savePasses(passes);
    },
    
    updatePass: (updatedPass) => {
        const passes = DB.getPasses();
        const index = passes.findIndex(p => p.id === updatedPass.id);
        if (index !== -1) {
            passes[index] = updatedPass;
            DB.savePasses(passes);
        }
    },
    
    getPassById: (id) => {
        const passes = DB.getPasses();
        return passes.find(p => p.id === id);
    },

    // Complaints
    getComplaints: () => JSON.parse(localStorage.getItem(DB_KEYS.COMPLAINTS) || '[]'),
    saveComplaints: (complaints) => localStorage.setItem(DB_KEYS.COMPLAINTS, JSON.stringify(complaints)),
    addComplaint: (complaint) => {
        const complaints = DB.getComplaints();
        complaints.push(complaint);
        DB.saveComplaints(complaints);
    },
    updateComplaint: (updated) => {
        const complaints = DB.getComplaints();
        const index = complaints.findIndex(c => c.id === updated.id);
        if (index !== -1) {
            complaints[index] = updated;
            DB.saveComplaints(complaints);
        }
    },

    // Fees
    getFees: () => JSON.parse(localStorage.getItem(DB_KEYS.FEES) || '[]'),
    saveFees: (fees) => localStorage.setItem(DB_KEYS.FEES, JSON.stringify(fees)),
    updateStudentFee: (studentId, amount, method) => {
        const fees = DB.getFees();
        const feeData = fees.find(f => f.studentId === studentId);
        if (feeData) {
            feeData.paid += amount;
            feeData.history.push({ date: new Date().toISOString(), amount, method });
            DB.saveFees(fees);
        }
    },

    // Laundry
    getLaundry: () => JSON.parse(localStorage.getItem(DB_KEYS.LAUNDRY) || '[]'),

    getCurrentUser: () => {
        const userStr = localStorage.getItem(DB_KEYS.SESSION);
        return userStr ? JSON.parse(userStr) : null;
    },

    setCurrentUser: (user) => {
        localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(user));
    },

    clearSession: () => {
        localStorage.removeItem(DB_KEYS.SESSION);
    }
};

// Initialize DB on script load
DB.init();
