const nodemailer = require('nodemailer');
const fs = require('fs');
const csvParser = require('csv-parser');

require('dotenv').config();

const GMAIL_USER = process.env.email_id;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});
const emailTemplate = (name, skills, jobLink) => `
Hi ${name},<br>
<br>
I hope you are doing great. I have 1.5 years of experience in software engineering (${skills || "a relevant role"}) at Tredence Inc., <b>a global leader in AI-driven analytics</b> serving <b>200+ Fortune 500 companies</b>. I was hoping you could refer me to ${
  jobLink
    ? `<a href="${jobLink}">a relevant role</a>`
    : "a relevant role" 
}.<br>
<br>
<u>My Key Achievements:</u>
<ul>
  <li><b>Saved $60k per project</b> by automating data migration workflows, reducing <b>70% manual effort</b>.</li>
  <li>Built a tool to process <b>7,000+ scripts weekly</b> with fast performance (<b>under 200ms</b> per request).</li>
  <li>Improved website speed by <b>40%</b> with performance optimization techniques like <b>code splitting</b> and <b>server-side rendering</b>.</li>
  <li>Built a testing framework to validate <b>SQL files automatically</b>, cutting <b>QA time by 80%</b>.</li>
  <li>Developed a <b>real-time machinery issue tracker</b> at Birla Textiles, reducing resolution time by 50%.</li>
</ul>

I believe my knowledge and skills would be a valuable addition to your team.<br>
<br>
I would really appreciate it if you could kindly refer me as I believe your referral can make a great difference. Please find my resume attached.<br>
<br>
<i>Best Regards,<br>
Ashim Gupta<br>
Software Engineer at Tredence Inc.<br>
+91-97797-97627<br>
<a href="https://linkedin.com/in/ashim~gupta">LinkedIn</a> | <a href="https://github.com/ashimgupta39">GitHub</a>
</i>
`;

const sendMail = async (email, name, skills, jobLink) => {
  try {
    const mailOptions = {
      from: GMAIL_USER,
      to: email,
      subject: `Need Your Help`,
      html: emailTemplate(name, skills, jobLink),
      attachments: [
        {
          filename: 'CV_Ashim_Gupta_SDE_2025.pdf',
          path: '/Users/ashimgupta/Documents/resumes/web/CV_Ashim_Gupta_SDE_2025.pdf',
        },
      ],
    };
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to: ${email}`);
  } catch (error) {
    console.error(`Failed to send email to ${email}:`, error.message);
  }
};


const parseAndSendEmails = (csvFilePath) => {
  fs.createReadStream(csvFilePath)
    .pipe(csvParser())
    .on('data', (row) => {
      const email = row.Email;
      const name = row.Name || 'there'; // Default to 'there' if no name is provided
      const skills = row['Relevant Skills'] || ''; // Empty string if no skills are provided
      const jobLink = row['Job Link'] || ''; // Optional job link
      if (email) {
        sendMail(email, name, skills, jobLink);
      }
    })
    .on('end', () => {
      console.log('CSV file processed.');
    })
    .on('error', (error) => {
      console.error('Error reading the CSV file:', error.message);
    });
};

// parseAndSendEmails("/Users/ashimgupta/Documents/webd_projects/linkedin-automation/email_list.csv")
sendMail("guptaashim29@gmail.com","Ashim","Next.js and React.js","https://jobs.natwestgroup.com/jobs/15480684-software-engineer?bid=370");
