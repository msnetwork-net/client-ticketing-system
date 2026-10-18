const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'tickets.json');
const USERS_FILE = path.join(__dirname, 'users.json');

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));

// Configure Nodemailer (Gmail notifications)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'genztest@gmail.com',        // 👈 Ningalude Gmail ID ivide kodukkuka
        pass: 'wnhwhmtywljvuwrg'   // 👈 Gmail App Password ivide kodukkuka
    }
});

// Helper Functions
function readData(filePath) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([]));
    }
    return JSON.parse(fs.readFileSync(filePath));
}

function writeData(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// 1. User Register API
app.post('/api/register', (req, res) => {
    const { name, email, phone, password } = req.body;
    let users = readData(USERS_FILE);

    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'Email already registered!' });
    }

    const newUser = { id: 'USER-' + Date.now(), name, email, phone, password };
    users.push(newUser);
    writeData(USERS_FILE, users);

    res.status(201).json({ message: 'Registration successful!', user: { name, email, phone } });
});

// 2. User Login API
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    let users = readData(USERS_FILE);

    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(400).json({ error: 'Invalid email or password!' });
    }

    res.json({ message: 'Login successful!', user: { name: user.name, email: user.email, phone: user.phone } });
});

// 3. Get Tickets API
app.get('/api/tickets', (req, res) => {
    res.json(readData(DATA_FILE));
});

// 4. Create Ticket API & Instant Fast Response (Background Email)
app.post('/api/tickets', (req, res) => {
    const { clientName, phone, email, category, priority, issue } = req.body;

    if (!clientName || !phone || !category || !issue) {
        return res.status(400).json({ error: 'Please fill all required fields' });
    }

    let tickets = readData(DATA_FILE);
    const newTicket = {
        id: 'TICK-' + Math.floor(100000 + Math.random() * 900000),
        clientName,
        phone,
        email: email || 'N/A',
        category,
        priority: priority || 'Medium',
        issue,
        status: 'Open',
        createdAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    };

    tickets.unshift(newTicket);
    writeData(DATA_FILE, tickets);

    // ⚡ 1. Client-inu okamthanne response ayakkunnu (No Delay!)
    res.status(201).json({ message: 'Ticket Created Successfully', ticket: newTicket });

    // 📩 2. Email background-il ayakkunnu (Client wait cheyyenda)
    const mailOptions = {
        from: 'YOUR_GMAIL@gmail.com',
        to: 'YOUR_GMAIL@gmail.com',
        subject: `🚨 New Support Ticket: ${newTicket.id} (${category})`,
        text: `New ticket raised!\n\nID: ${newTicket.id}\nClient: ${clientName}\nPhone: ${phone}\nCategory: ${category}\nPriority: ${priority}\nIssue: ${issue}`
    };

    transporter.sendMail(mailOptions).catch(err => console.error('Email background error:', err));
});

// 5. Update Status API
app.put('/api/tickets/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    let tickets = readData(DATA_FILE);
    const index = tickets.findIndex(t => t.id === id);

    if (index !== -1) {
        tickets[index].status = status;
        writeData(DATA_FILE, tickets);
        res.json({ message: 'Status Updated', ticket: tickets[index] });
    } else {
        res.status(404).json({ error: 'Ticket Not Found' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
