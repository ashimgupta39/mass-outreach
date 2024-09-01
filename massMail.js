const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter using your SMTP credentials
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use your email provider's SMTP details
  auth: {
    user: process.env.mail,// Your email
    pass: process.env.mailPaswd,// Your password or app-specific password
  },
});

// Function to send an email
function sendEmail(toEmail, subject, htmlContent) {
  const mailOptions = {
    from: process.env.mail,  // Your email
    to: toEmail,
    subject: subject,
    html: htmlContent,            // Sending HTML content
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

// Email template with placeholders
const emailTemplate = `
  <p>Hello {{name}},</p>
  <p>We are pleased to inform you about your role as {{role}}.</p>
  <p>We look forward to working with you.</p>
  <p>Best Regards,<br>Your Company</p>
`;

// List of emails and corresponding data
const emailList = [
  { email: 'person1@example.com', name: 'John', role: 'Manager' },
  { email: 'person2@example.com', name: 'Jane', role: 'Developer' },
];

// Send personalized emails
emailList.forEach(person => {
  let personalizedEmail = emailTemplate
    .replace('{{name}}', person.name)
    .replace('{{role}}', person.role);
  
  sendEmail(person.email, 'Your Role Information', personalizedEmail);
});

console.log('Emails sent!');
