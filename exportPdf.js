const fs = require('fs');
const PDFDocument = require('pdfkit');

const usersPath = 'D:/smartcare-v3/data/db/users.json';
const docsPath = 'D:/smartcare-v3/data/db/doctors.json';

const users = JSON.parse(fs.readFileSync(usersPath));
const docs = JSON.parse(fs.readFileSync(docsPath));

const doc = new PDFDocument({ margin: 50 });
doc.pipe(fs.createWriteStream('D:/smartcare-v3/SmartCare_Doctors_Directory.pdf'));

doc.fontSize(24).text('SmartCare Doctors Directory', { align: 'center' });
doc.moveDown(2);

docs.forEach((d, i) => {
  const u = users.find(x => x._id === d.userId);
  if(u) {
    doc.fontSize(14).font('Helvetica-Bold').text(`${i+1}. ${d.name}`);
    doc.fontSize(10).font('Helvetica').text(`Email: ${u.email}`);
    doc.fontSize(10).font('Helvetica').text(`Password: password123`);
    doc.fontSize(10).font('Helvetica').text(`Department: ${d.department}`);
    doc.fontSize(10).font('Helvetica').text(`Hospital: ${d.hospital || 'N/A'}`);
    doc.fontSize(10).font('Helvetica').text(`Cabin: ${d.cabin || d.room || 'N/A'}`);
    doc.moveDown(1);
  }
});

doc.end();
console.log("PDF generated successfully at D:/smartcare-v3/SmartCare_Doctors_Directory.pdf");
