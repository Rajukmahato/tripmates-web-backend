require('dotenv').config({ path: '.env.test' });
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
console.log('JWT_SECRET:', JWT_SECRET);

const adminUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'admin@test.com',
    phoneNumber: '1234567890',
    role: 'admin'
};

const payload = {
    id: adminUser._id,
    email: adminUser.email,
    phoneNumber: adminUser.phoneNumber,
    role: adminUser.role
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
console.log('Generated token:', token);

const decoded = jwt.verify(token, JWT_SECRET);
console.log('Decoded token:', decoded);
console.log('Role in decoded token:', decoded.role);
