const { getCollection } = require('./jsonDb');

async function isSameClass(drugName, allergy) {
  const masterDb = getCollection('drug_master');
  
  // Find the drug in the master database
  const drug = await masterDb.findOne(d => d.generic_name.toLowerCase() === drugName.toLowerCase());
  if (!drug) return false;

  // Find if allergy is a class
  const allergyLower = allergy.toLowerCase();
  if (drug.drug_class.toLowerCase() === allergyLower) return true;

  // Alternatively, the patient might be allergic to a specific generic, 
  // check if the generic belongs to the same class as another drug they are allergic to
  const allergicDrug = await masterDb.findOne(d => d.generic_name.toLowerCase() === allergyLower);
  if (allergicDrug && allergicDrug.drug_class === drug.drug_class) {
    return true;
  }

  return false;
}

async function checkInteractions(drugs, patientAllergies = [], currentMeds = []) {
  const interactionsDb = getCollection('drug_interactions');
  
  for (let drug of drugs) {
    drug.allergyConflict = false;
    drug.conflictReason = null;

    // 1. Allergy check
    for (let allergy of patientAllergies) {
      if (drug.name.toLowerCase().includes(allergy.toLowerCase()) || await isSameClass(drug.name, allergy)) {
        drug.allergyConflict = true;
        drug.conflictReason = `Patient is allergic to ${allergy} (or its class).`;
        break; // stop checking allergies for this drug
      }
    }

    // 2. Drug-drug interaction check against current meds
    for (let existing of currentMeds) {
      // Look for a recorded interaction pair
      const interaction = await interactionsDb.findOne(i => 
        (i.drug_a.toLowerCase() === drug.name.toLowerCase() && i.drug_b.toLowerCase() === existing.toLowerCase()) ||
        (i.drug_a.toLowerCase() === existing.toLowerCase() && i.drug_b.toLowerCase() === drug.name.toLowerCase())
      );

      if (interaction) {
        drug.allergyConflict = true; // reusing allergy conflict UI flag for severe interactions
        drug.conflictReason = `Interaction with ${existing}: [${interaction.severity.toUpperCase()}] ${interaction.description}`;
        break;
      }
    }
  }

  return drugs;
}

module.exports = {
  checkInteractions
};
