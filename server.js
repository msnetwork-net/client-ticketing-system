const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'tickets.json');

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));

// Ticket-ukal JSON file-il save cheyan ullath
function readTickets() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([]));
    }
    const data = fs.readFileSync(DATA_FILE);
    return JSON.parse(data);
}

function writeTickets(tickets) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(tickets, null, 2));
}

// Client tickets list get cheyyan
app.get('/api/tickets', (req, res) => {
    const tickets = readTickets();
    res.json(tickets);
});

// New Ticket register cheyyan
app.post('/api/tickets', (req, res) => {
    const { clientName, phone, email, category, priority, issue } = req.body;

    if (!clientName || !phone || !category || !issue) {
        return res.status(400).json({ error: 'Please fill all required fields' });
    }

    const tickets = readTickets();
    const newTicket = {
        id: 'TICK-' + Math.floor(100000 + Math.random() * 900000),
        clientName,
        phone,
        email: email || 'N/A',
        category, // Network, Camera, or Telecom
        priority: priority || 'Medium',
        issue,
        status: 'Open',
        createdAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    };

    tickets.unshift(newTicket);
    writeTickets(tickets);

    res.status(201).json({ message: 'Ticket Created Successfully', ticket: newTicket });
});

// Status update cheyyan (Resolved / In Progress)
app.put('/api/tickets/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    let tickets = readTickets();
    const index = tickets.findIndex(t => t.id === id);

    if (index !== -1) {
        tickets[index].status = status;
        writeTickets(tickets);
        res.json({ message: 'Status Updated', ticket: tickets[index] });
    } else {
        res.status(404).json({ error: 'Ticket Not Found' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});