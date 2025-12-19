/**
 * CyberShield Backend Server
 * Express server for handling API requests and serving static files
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Data file path
const DATA_DIR = path.join(__dirname, 'data');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
    
    try {
        await fs.access(CONTACTS_FILE);
    } catch {
        await fs.writeFile(CONTACTS_FILE, JSON.stringify([]), 'utf8');
    }
}

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'operational',
        service: 'CyberShield API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Services endpoint
app.get('/api/services', (req, res) => {
    const services = [
        {
            id: 1,
            name: 'Penetration Testing',
            description: 'Simulated cyber attacks to identify vulnerabilities',
            icon: 'bug',
            features: [
                'Web Application Testing',
                'Network Penetration Testing',
                'Mobile Application Security',
                'Wireless Network Assessment'
            ]
        },
        {
            id: 2,
            name: 'Vulnerability Assessment',
            description: 'Comprehensive analysis of security posture',
            icon: 'search',
            features: [
                'Automated Vulnerability Scanning',
                'Manual Security Review',
                'Risk Assessment & Prioritization',
                'Remediation Guidance'
            ]
        },
        {
            id: 3,
            name: 'Social Engineering',
            description: 'Test organization\'s human firewall',
            icon: 'user-secret',
            features: [
                'Phishing Simulation',
                'Physical Penetration Testing',
                'Security Awareness Training',
                'Vishing Tests'
            ]
        },
        {
            id: 4,
            name: 'Security Auditing',
            description: 'Independent evaluation of security controls',
            icon: 'file-contract',
            features: [
                'ISO 27001 Compliance',
                'PCI DSS Assessment',
                'GDPR Compliance Check',
                'HIPAA Security Review'
            ]
        },
        {
            id: 5,
            name: 'Security Consulting',
            description: 'Expert guidance on security architecture',
            icon: 'headset',
            features: [
                'Security Architecture Review',
                'Incident Response Planning',
                'Security Policy Development',
                'Cloud Security Assessment'
            ]
        },
        {
            id: 6,
            name: 'Managed Security',
            description: 'Ongoing monitoring and threat detection',
            icon: 'shield-alt',
            features: [
                '24/7 Security Monitoring',
                'Threat Intelligence',
                'Incident Response',
                'Vulnerability Management'
            ]
        }
    ];
    
    res.json(services);
});

// Contact form submission endpoint
app.post('/api/contact', async (req, res) => {
    try {
        await ensureDataDir();
        
        const { name, email, company, service, message, nda } = req.body;
        
        // Validation
        if (!name || !email || !message) {
            return res.status(400).json({ 
                error: 'Missing required fields: name, email, and message are required' 
            });
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }
        
        // Read existing contacts
        const contactsData = await fs.readFile(CONTACTS_FILE, 'utf8');
        const contacts = JSON.parse(contactsData);
        
        // Create new contact object
        const newContact = {
            id: contacts.length + 1,
            name,
            email,
            company: company || 'Not specified',
            service: service || 'Not specified',
            message,
            nda: nda || false,
            timestamp: new Date().toISOString(),
            ip: req.ip,
            userAgent: req.get('User-Agent')
        };
        
        // Add to contacts array
        contacts.push(newContact);
        
        // Write back to file
        await fs.writeFile(CONTACTS_FILE, JSON.stringify(contacts, null, 2), 'utf8');
        
        // Log submission (in production, you might want to use a proper logger)
        console.log(`New contact form submission: ${name} <${email}>`);
        
        // Send email notification (simulated)
        // In a real application, you would integrate with an email service
        console.log(`[EMAIL NOTIFICATION] New contact from ${name} regarding ${service}`);
        
        res.json({ 
            success: true, 
            message: 'Message received securely. We\'ll respond within 24 hours.',
            contactId: newContact.id
        });
        
    } catch (error) {
        console.error('Error processing contact form:', error);
        res.status(500).json({ 
            error: 'Internal server error. Please try again later.' 
        });
    }
});

// Get contacts (admin endpoint - in production, add authentication)
app.get('/api/admin/contacts', async (req, res) => {
    try {
        await ensureDataDir();
        
        const contactsData = await fs.readFile(CONTACTS_FILE, 'utf8');
        const contacts = JSON.parse(contactsData);
        
        // Return contacts without sensitive IP/userAgent data for demo
        const safeContacts = contacts.map(contact => ({
            id: contact.id,
            name: contact.name,
            email: contact.email,
            company: contact.company,
            service: contact.service,
            message: contact.message.substring(0, 100) + '...',
            nda: contact.nda,
            timestamp: contact.timestamp
        }));
        
        res.json(safeContacts);
    } catch (error) {
        console.error('Error reading contacts:', error);
        res.status(500).json({ error: 'Failed to retrieve contacts' });
    }
});

// Serve frontend HTML files
app.get('*', (req, res) => {
    // Check if it's an API request
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Serve the frontend HTML file
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
async function startServer() {
    await ensureDataDir();
    
    app.listen(PORT, () => {
        console.log(`
        🚀 CyberShield Server Started!
        
        🔗 Local: http://localhost:${PORT}
        🔒 API Base: http://localhost:${PORT}/api
        
        📁 Serving from: ${path.join(__dirname, '../frontend')}
        💾 Data directory: ${DATA_DIR}
        
        ⚡ Server running in ${process.env.NODE_ENV || 'development'} mode
        `);
        
        // Print available routes
        console.log('\n📡 Available API Routes:');
        console.log('  GET  /api/health          - Health check');
        console.log('  GET  /api/services        - List all services');
        console.log('  POST /api/contact         - Submit contact form');
        console.log('  GET  /api/admin/contacts  - View submissions (demo)');
    });
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start the server
startServer().catch(console.error);