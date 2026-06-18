const DEPARTMENT_FEES = {
  "Cardiology": 500,
  "Neurology": 600,
  "Pediatrics": 400,
  "Orthopedics": 450,
  "Dermatology": 350,
  "Ophthalmology": 300,
  "ENT": 300,
  "Gastroenterology": 500,
  "Oncology": 700,
  "Endocrinology": 450,
  "Dentistry": 200,
  "Emergency": 800,
  "General": 300
};

const LAB_TEST_PRICES = {
  // Hematology & Coagulation
  "Complete Blood Count (CBC)": 300,
  "Erythrocyte Sedimentation Rate (ESR)": 150,
  "Prothrombin Time (PT/INR)": 400,
  "Activated Partial Thromboplastin Time (aPTT)": 450,
  "Peripheral Blood Smear": 250,
  "Hemoglobin Electrophoresis": 1200,
  "Reticulocyte Count": 200,
  "D-Dimer": 1000,
  "Blood Grouping & Rh Typing": 200,

  // Biochemistry (Metabolic & Organ Function)
  "Fasting Blood Sugar (FBS)": 150,
  "Post Prandial Blood Sugar (PPBS)": 150,
  "Random Blood Sugar (RBS)": 150,
  "HbA1c": 400,
  "Lipid Profile": 600,
  "Liver Function Test (LFT)": 700,
  "Kidney Function Test (KFT)": 650,
  "Serum Creatinine": 200,
  "Blood Urea Nitrogen (BUN)": 200,
  "Serum Electrolytes (Sodium, Potassium, Chloride)": 450,
  "Serum Calcium": 250,
  "Serum Uric Acid": 200,
  "Serum Amylase & Lipase": 800,
  "CRP (C-Reactive Protein)": 450,
  "High-Sensitivity CRP (hs-CRP)": 600,

  // Endocrinology & Hormones
  "Thyroid Profile (T3, T4, TSH)": 500,
  "Free T3, Free T4": 650,
  "Vitamin D3": 1200,
  "Vitamin B12": 1000,
  "Testosterone": 600,
  "Luteinizing Hormone (LH)": 500,
  "Follicle Stimulating Hormone (FSH)": 500,
  "Prolactin": 450,
  "Estradiol": 550,
  "Insulin Fasting": 450,
  "Serum Cortisol": 700,

  // Immunology & Serology
  "Widal Test (Typhoid)": 300,
  "Dengue NS1 Antigen": 600,
  "Malaria Parasite (MP)": 200,
  "Rheumatoid Factor (RA)": 400,
  "Anti-Nuclear Antibody (ANA)": 850,
  "HIV I & II Antibodies": 500,
  "HBsAg (Hepatitis B)": 450,
  "Anti-HCV (Hepatitis C)": 600,
  "Syphilis (VDRL/RPR)": 300,
  "COVID-19 RT-PCR": 800,

  // Microbiology & Clinical Pathology
  "Urine Routine Examination": 200,
  "Urine Culture": 450,
  "Stool Routine": 250,
  "Stool Occult Blood": 200,
  "Sputum AFB (Tuberculosis)": 350,
  "Sputum Culture": 500,
  "Blood Culture": 800,
  "Semen Analysis": 600,

  // Tumor Markers (Oncology)
  "Prostate Specific Antigen (PSA)": 700,
  "CA 125 (Ovarian)": 900,
  "CA 15-3 (Breast)": 950,
  "CA 19-9 (Pancreatic)": 1000,
  "Carcinoembryonic Antigen (CEA)": 850,
  "Alpha-Fetoprotein (AFP)": 800,

  // Cardiology & Pulmonology
  "ECG / Electrocardiogram": 300,
  "2D Echo": 1500,
  "TMT (Treadmill Test)": 1200,
  "Holter Monitoring": 2500,
  "Pulmonary Function Test (PFT)": 800,
  "Troponin I & T": 1200,

  // Imaging & Radiology
  "Chest X-Ray": 400,
  "X-Ray Knee": 400,
  "X-Ray Spine": 500,
  "Ultrasound Abdomen & Pelvis": 1200,
  "Ultrasound KUB": 900,
  "Ultrasound Thyroid": 1000,
  "CT Scan Head": 3000,
  "CT Scan Chest (HRCT)": 4500,
  "CT Scan Abdomen": 5000,
  "MRI Brain Scan": 6500,
  "MRI Cervical Spine": 7000,
  "MRI Lumbar Spine": 7000,
  "Mammography": 2000,
  "DEXA Scan (Bone Density)": 2500
};

const getMedicinePrice = (medicineName) => {
  const commonMedicines = {
    "Paracetamol": 50,
    "Amoxicillin": 120,
    "Azithromycin": 150,
    "Cetirizine": 40,
    "Pantoprazole": 80,
    "Ibuprofen": 60,
    "Aspirin": 30,
    "Metformin": 90,
    "Atorvastatin": 140,
    "Losartan": 110,
    "Amlodipine": 70,
    "Levothyroxine": 100,
    "Ciprofloxacin": 130,
    "Omeprazole": 75,
    "Dolo 650": 60,
    "Crocin": 40,
    "Vitamin C": 50,
    "B-Complex": 60,
    "Cough Syrup": 85,
    "Diclofenac Gel": 90,
    "Ondansetron": 55,
    "Montelukast": 110
  };
  
  const exactPrice = commonMedicines[medicineName.trim()];
  if (exactPrice) return exactPrice;

  for (const [key, price] of Object.entries(commonMedicines)) {
    if (medicineName.toLowerCase().includes(key.toLowerCase())) {
      return price;
    }
  }
  return 100;
};

module.exports = {
  DEPARTMENT_FEES,
  LAB_TEST_PRICES,
  getMedicinePrice
};
