const fs = require('fs');
const path = require('path');

const usersPath = path.join(__dirname, 'data', 'db', 'users.json');
const docsPath = path.join(__dirname, 'data', 'db', 'doctors.json');

let users = JSON.parse(fs.readFileSync(usersPath));
let docs = JSON.parse(fs.readFileSync(docsPath));

const firstNames = ["Amit", "Priya", "Rahul", "Sneha", "Vikram", "Anjali", "Ravi", "Kavita", "Sanjay", "Pooja", "Rajesh", "Neha", "Arun", "Meera", "Sunil", "Anita", "Karan", "Divya", "Vivek", "Roshni"];
const lastNames = ["Sharma", "Patel", "Reddy", "Singh", "Kumar", "Gupta", "Desai", "Rao", "Iyer", "Menon", "Jain", "Bose", "Nair", "Verma", "Choudhury", "Pillai", "Joshi", "Kapoor", "Chatterjee", "Bhatt"];
const departments = ["Cardiology", "Neurology", "Pediatrics", "Orthopedics", "Dermatology", "Gastroenterology", "Oncology", "Endocrinology", "Ophthalmology", "ENT"];
const hospitals = ["Apollo Hospitals", "Fortis Healthcare", "Manipal Hospitals", "Max Super Speciality", "Narayana Health", "Medanta", "Aster CMI", "AIIMS", "Christian Medical College", "KIMS"];

const passHash = "$2b$10$W.Jgqm1LlcPXT0IEhni84ON1meRXWnPRHtbkU0BbvRZTQCf.dIdKi"; // password123
const now = new Date().toISOString();

const generateId = () => Math.random().toString(36).substr(2, 9);

for (let i = 0; i < 2500; i++) {
  const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const name = `Dr. ${fName} ${lName}`;
  const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@smartcare.com`;
  const department = departments[Math.floor(Math.random() * departments.length)];
  const hospital = hospitals[Math.floor(Math.random() * hospitals.length)];
  const cabin = Math.floor(Math.random() * 900) + 100; // 100-999

  const uId = generateId();
  const dId = generateId();

  users.push({
    _id: uId,
    createdAt: now,
    updatedAt: now,
    name: name,
    email: email,
    password: passHash,
    role: "doctor"
  });

  docs.push({
    _id: dId,
    createdAt: now,
    updatedAt: now,
    userId: uId,
    name: name,
    email: email,
    department: department,
    cabin: cabin.toString(),
    hospital: hospital,
    status: "active",
    currentToken: 0
  });
}

fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
fs.writeFileSync(docsPath, JSON.stringify(docs, null, 2));

console.log('Successfully generated 50 Indian doctors!');
