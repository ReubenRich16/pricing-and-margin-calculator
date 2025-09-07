// src/config/sortConfig.js
<<<<<<< Updated upstream
=======

// CATEGORY ORDER: Used for global grouping and sorting
>>>>>>> Stashed changes
export const categoryOrder = [
  "Bulk Insulation", "Specialty Insulation", "Retrofit Insulation", "Fire Protection", 
  "Subfloor", "Wall Wrap", "Acoustic Pipe Lagging", "Consumables", 
  "Rigid Wall/Soffit", "XPS", "Labour Add Ons/Other"
];

export const brandOrder = [
  "Ecowool", "Earthwool", "Polyester", "Bradford", "Pink Batts", "Autex",
  "James Hardie", "Rockwool", "Kingspan", "Metecno", "Foamex", "ISOMAX", "Other"
];

<<<<<<< Updated upstream
export const productNameSortOrder = [
  "Thermal Ceiling & Floor Batt", "Thermal Wall Batt", "Acoustic Floor & Wall Batt",
  "Acoustic Partition Batt", "Acoustic Partition Rolls", "Hardiefire 80kg/m²",
  "Rockwool Slab", "Floor Block", "GreenLag", "Thermotec", "Brane VHP",
  "Brane Vapourtech", "Ametalin Quick Tape", "Reinforced Silver Tape",
  "Dampcourse 300", "Dampcourse 380", "Dampcourse 450", "Staples 3/8''",
  "Strapping", "Kooltherm K10 G2", "Kooltherm K12", "MetecnoTherm",
  "Kooltherm K3", "Sytroboard", "ISOMAX X300"
=======
// PRODUCT SORT ORDER: Global order for all products (used for dropdowns and tables)
export const productNameSortOrder = [
  "Thermal Ceiling & Floor Batt",
  "Thermal Wall Batt",
  "Acoustic Floor & Wall Batt",
  "Acoustic Partition Batt",
  "Acoustic Partition Rolls",
  "Hardiefire 80kg/m²",
  "Rockwool Slab",
  "Floor Block",
  "GreenLag",
  "Thermotec", // <-- FIX: Added missing comma here!
  "Brane VHP",
  "Brane Vapourtech",
  "Ametalin Quick Tape",
  "Reinforced Silver Tape",
  "Dampcourse 300",
  "Dampcourse 380",
  "Dampcourse 450",
  "Staples 3/8''",
  "Strapping",
  "Kooltherm K10 G2",
  "Kooltherm K12",
  "MetecnoTherm",
  "Kooltherm K3",
  "Sytroboard",
  "ISOMAX X300"
>>>>>>> Stashed changes
];

export const materialColumns = [
<<<<<<< Updated upstream
  { key: 'supplier', label: 'Supplier' }, { key: 'brand', label: 'Brand Name' },
  { key: 'materialName', label: 'Product Name' }, { key: 'category', label: 'Application' },
  { key: 'rValue', label: 'R-Value' }, { key: 'thickness', label: 'Thickness (mm)', suffix: 'mm' },
  { key: 'length', label: 'Length (mm)', suffix: 'mm' }, { key: 'width', label: 'Width (mm)', suffix: 'mm' },
  { key: 'coverage', label: 'Coverage' }, { key: 'coverageUnit', label: 'Coverage Unit' },
  { key: 'unitOfMeasure', label: 'Sale Unit' }, { key: 'density', label: 'Density (kg/m³)', suffix: 'kg/m³' },
  { key: 'costPrice', label: 'Cost/Unit', prefix: '$' }, { key: 'sCostUnit', label: 'S Cost/Unit', prefix: '$' },
  { key: 's_i_timber', label: 'S+I Timber/Coverage Unit', prefix: '$' },
  { key: 's_i_steel', label: 'S+I Steel/Coverage Unit', prefix: '$' },
  { key: 'retrofit_ceiling_rate', label: 'Retrofit S+I/Unit', prefix: '$' },
  { key: 'subfloor_rate', label: 'Subfloor S+I/Unit', prefix: '$' },
  { key: 'retrofit_subfloor_rate', label: 'Retrofit Subfloor S+I/Unit', prefix: '$' },
  { key: 'notes', label: 'Notes' }, { key: 'keywords', label: 'Keywords' }
=======
  { key: 'supplier', label: 'Supplier' },
  { key: 'brand', label: 'Brand Name' },
  { key: 'materialName', label: 'Product Name' },
  { key: 'category', label: 'Application' },
  { key: 'rValue', label: 'R-Value' },
  { key: 'thickness', label: 'Thickness (mm)', suffix: 'mm' },
  { key: 'length', label: 'Length (mm)', suffix: 'mm' },
  { key: 'width', label: 'Width (mm)', suffix: 'mm' },
  { key: 'coverage', label: 'Coverage/Unit' },
  { key: 'coverageUnit', label: 'Coverage Unit' },
  { key: 'unit', label: 'Unit' }, // <-- Use 'unit' everywhere, not unitOfMeasure
  { key: 'density', label: 'Density (kg/m³)', suffix: 'kg/m³' },
  { key: 'costPrice', label: 'Cost/Unit', prefix: '$' },
  { key: 'sCostUnit', label: 'S Cost/Unit', prefix: '$' },
  { key: 's_i_timber', label: 'S+I Timber', prefix: '$' },
  { key: 's_i_steel', label: 'S+I Steel', prefix: '$' },
  { key: 'retrofit_ceiling_rate', label: 'Retrofit (existing ceiling) S+I/Coverage Unit', prefix: '$' },
  { key: 'subfloor_rate', label: 'Subfloor S+I/Coverage Unit', prefix: '$' },
  { key: 'retrofit_subfloor_rate', label: 'Retrofit (Subfloor) S+I/Coverage Unit', prefix: '$' },
  { key: 'notes', label: 'Notes' },
  { key: 'keywords', label: 'Keywords' }
>>>>>>> Stashed changes
];

export const consumablesGroupRule = {
  category: "Consumables",
  groupBy: ["supplier", "materialName"] // Used for UI grouping in MaterialsManager
};

/*
  Usage in src/pages/MaterialsManager.js:
  - For standard categories: group by category > brand > productName
  - For Consumables: group by category > supplier > productName

  Example pseudocode:
  if (category === consumablesGroupRule.category) {
    groupBy = consumablesGroupRule.groupBy;
  } else {
    groupBy = ['brand', 'materialName'];
  }
*/