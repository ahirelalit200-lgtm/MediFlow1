// backend/controllers/chatbotController.js

/**
 * Medical Chatbot Controller
 * Handles chat queries with medical knowledge base
 * Supports English and Marathi languages
 */

// Marathi knowledge base
const marathiKnowledgeBase = {
  symptoms: {
    fever: {
      info: "ताप म्हणजे शरीराच्या तापमानात तात्पुरती वाढ, जी सहसा आजारपणामुळे होते. सामान्य शरीराचे तापमान सुमारे 98.6°F (37°C) असते.",
      advice: "विश्रांती घ्या, भरपूर पाणी प्या आणि आवश्यक असल्यास ताप कमी करणारी औषधे घ्या. जर ताप 3 दिवसांपेक्षा जास्त काळ राहिला किंवा 103°F (39.4°C) पेक्षा जास्त झाला तर डॉक्टरांचा सल्ला घ्या.",
      keywords: ["ताप", "तापमान", "गरम", "ज्वर"]
    },
    headache: {
      info: "डोकेदुखी तणाव, पाण्याची कमतरता, झोपेची कमतरता किंवा इतर कारणांमुळे होऊ शकते.",
      advice: "शांत, अंधारी खोलीत विश्रांती घ्या. भरपूर पाणी प्या. वेदनाशामक औषधे मदत करू शकतात. जर डोकेदुखी तीव्र किंवा सतत असेल तर डॉक्टरांना भेटा.",
      keywords: ["डोकेदुखी", "डोके दुखणे", "माथा दुखणे", "मायग्रेन"]
    },
    cough: {
      info: "खोकला हा श्वासनलिका साफ करण्यासाठी एक नैसर्गिक प्रतिक्रिया आहे. तो कोरडा किंवा कफयुक्त असू शकतो.",
      advice: "भरपूर पाणी प्या, मध किंवा खोकल्याच्या गोळ्या वापरा. जर खोकला 3 आठवड्यांपेक्षा जास्त काळ राहिला किंवा रक्त, ताप किंवा श्वास घेण्यात अडचण आली तर डॉक्टरांना भेटा.",
      keywords: ["खोकला", "खोकणे", "घसा खवखवणे"]
    },
    cold: {
      info: "सामान्य सर्दी ही वरच्या श्वसनमार्गाची विषाणूजन्य संसर्ग आहे.",
      advice: "विश्रांती घ्या, भरपूर द्रवपदार्थ प्या, नाकात सलाईन थेंब वापरा. लक्षणे सहसा 7-10 दिवसांत कमी होतात. जर लक्षणे वाढली तर डॉक्टरांचा सल्ला घ्या.",
      keywords: ["सर्दी", "नाक वाहणे", "शिंका", "नाक बंद"]
    },
    stomachache: {
      info: "पोटदुखी अपचन, गॅस, संसर्ग किंवा इतर पाचक समस्यांमुळे होऊ शकते.",
      advice: "जड जेवण टाळा, भरपूर पाणी प्या. आवश्यक असल्यास अँटॅसिड वापरा. जर वेदना तीव्र किंवा सतत असेल तर वैद्यकीय मदत घ्या.",
      keywords: ["पोटदुखी", "पोट दुखणे", "ओटीपोटात दुखणे"]
    }
  },
  
  medications: {
    paracetamol: {
      info: "पॅरासिटामॉल (अॅसिटामिनोफेन) हे वेदनाशामक आणि तापनाशक औषध आहे.",
      usage: "प्रौढांसाठी: दर 4-6 तासांनी 500-1000mg. दिवसातून जास्तीत जास्त 4000mg. जेवणासोबत किंवा जेवणाशिवाय घ्या.",
      warnings: "शिफारस केलेल्या डोसपेक्षा जास्त घेऊ नका. दारू टाळा. यकृताच्या समस्या असल्यास डॉक्टरांचा सल्ला घ्या.",
      keywords: ["पॅरासिटामॉल", "क्रोसिन", "डोलो", "तापाचे औषध"]
    },
    ibuprofen: {
      info: "आयब्युप्रोफेन हे वेदना आणि जळजळ कमी करणारे औषध (NSAID) आहे.",
      usage: "प्रौढांसाठी: दर 4-6 तासांनी 200-400mg. डॉक्टरांच्या सल्ल्याशिवाय दिवसातून जास्तीत जास्त 1200mg. जेवणासोबत घ्या.",
      warnings: "पोटात त्रास होऊ शकतो. अल्सर किंवा मूत्रपिंडाच्या समस्या असल्यास टाळा. गर्भधारणेदरम्यान शिफारस केलेले नाही.",
      keywords: ["आयब्युप्रोफेन", "ब्रुफेन", "वेदनाशामक"]
    },
    aspirin: {
      info: "अॅस्पिरिन वेदना कमी करण्यासाठी, ताप कमी करण्यासाठी आणि रक्त पातळ करण्यासाठी वापरले जाते.",
      usage: "प्रौढांसाठी: वेदनेसाठी दर 4 तासांनी 325-650mg. हृदयाच्या संरक्षणासाठी कमी डोस (डॉक्टरांचा सल्ला घ्या).",
      warnings: "12 वर्षांखालील मुलांसाठी नाही. पोटातून रक्तस्त्राव होऊ शकतो. रक्त पातळ करणारी औषधे घेत असल्यास डॉक्टरांचा सल्ला घ्या.",
      keywords: ["अॅस्पिरिन", "डिस्प्रिन", "रक्त पातळ करणारे"]
    }
  },
  
  general: {
    prescription: {
      info: "ही प्रणाली डॉक्टरांना रुग्णांसाठी डिजिटल प्रिस्क्रिप्शन तयार करण्यास अनुमती देते.",
      advice: "**पायरीयांनी:**\n1. नेव्हिगेशन मेनूमध्ये 'Prescriptions' वर क्लिक करा\n2. रुग्णाची माहिती भरा (नाव, वय, संपर्क, ईमेल)\n3. ड्रॉपडाउनमधून उपचार प्रकार निवडा\n4. औषध कोड वापरून किंवा मॅन्युअल एंट्री करून औषधे जोडा\n5. उपचार नोट्स आणि सूचना प्रविष्ट करा\n6. आवश्यक असल्यास फॉलो-अप तारीख सेट करा\n7. एक्स-रे अपलोड करा (पर्यायी)\n8. 'Save Prescription' वर क्लिक करा\n9. PDF तयार करण्यासाठी 'Print' वर क्लिक करा\n10. रुग्णाला आपोआप ईमेल पाठवला जातो",
      keywords: ["प्रिस्क्रिप्शन", "औषधपत्रक", "औषध यादी", "प्रिस्क्रिप्शन कसे बनवावे"]
    },
    xray: {
      info: "AI द्वारे शक्तिशाली शोध सह एक्स-रे प्रतिमा अपलोड आणि विश्लेषण करा.",
      advice: "**पायरीयांनी:**\n1. नेव्हिगेशनमधून 'X-Ray' पृष्ठावर जा\n2. रुग्णाचे नाव आणि मोबाईल नंबर प्रविष्ट करा\n3. 'Select X-ray Image' बटणावर क्लिक करा\n4. इमेज फाइल निवडा (JPG, PNG)\n5. पूर्वावलोकन आपोआप दिसते\n6. अपलोड करण्यासाठी 'Save X-ray' वर क्लिक करा\n7. स्वयंचलित विश्लेषणासाठी 'Analyze X-ray with AI' वर क्लिक करा\n8. AI निष्कर्ष पहा (पोकळी, फ्रॅक्चर इ.)\n9. परिणाम प्रिस्क्रिप्शनसह जतन केले जातात\n10. एक्स-रे रुग्णाला ईमेल केला जातो",
      keywords: ["एक्सरे", "एक्स-रे", "स्कॅन", "एक्सरे अपलोड", "एआय विश्लेषण"]
    },
    chatbot: {
      info: "त्वरित मदत आणि वैद्यकीय माहितीसाठी AI चॅटबॉट वापरा.",
      advice: "**कसे वापरावे:**\n1. जांभळा चॅट बबल क्लिक करा (खाली-उजवीकडे)\n2. तुमचा प्रश्न टाइप करा किंवा सूचनांवर क्लिक करा\n3. **व्हॉइस इनपुट:** मायक्रोफोन आयकॉनवर क्लिक करा आणि बोला\n4. **व्हॉइस आउटपुट:** ऑडिओसाठी स्पीकर आयकॉन टॉगल करा\n5. लक्षणे, औषधे किंवा वैशिष्ट्यांबद्दल विचारा\n6. सूचनांसह त्वरित प्रतिसाद मिळवा\n7. आपत्कालीन कीवर्ड तातडीच्या सूचना ट्रिगर करतात\n8. चॅटबॉट बंद करण्यासाठी X वर क्लिक करा\n9. सर्व पृष्ठांवर उपलब्ध",
      keywords: ["चॅटबॉट", "चॅट", "मदत", "सहाय्यक", "आवाज", "बोला", "प्रश्न विचारा"]
    }
  }
};

// Predefined Marathi responses
const marathiResponses = {
  greeting: [
    "नमस्कार! मी तुमचा वैद्यकीय सहाय्यक आहे. आज मी तुम्हाला कशी मदत करू शकतो?",
    "नमस्ते! मी वैद्यकीय प्रश्न आणि सिस्टम नेव्हिगेशनसाठी मदत करण्यासाठी येथे आहे.",
    "स्वागत आहे! लक्षणे, औषधे किंवा या प्रणालीचा वापर कसा करावा याबद्दल विचारा."
  ],
  thanks: [
    "तुमचे स्वागत आहे! अधिक मदतीची आवश्यकता असल्यास विचारण्यास मोकळ्या मनाने विचारा.",
    "मदत करण्यात आनंद झाला! तुम्हाला इतर प्रश्न असल्यास मला कळवा.",
    "मदत करू शकलो याचा आनंद! निरोगी रहा!"
  ],
  goodbye: [
    "काळजी घ्या! कधीही परत येण्यास मोकळ्या मनाने या.",
    "निरोप! तुम्हाला चांगल्या आरोग्याच्या शुभेच्छा.",
    "नंतर भेटू! सुरक्षित आणि निरोगी रहा."
  ],
  emergency: [
    "⚠️ वैद्यकीय आपत्कालीन परिस्थितीसाठी, कृपया ताबडतोब आपत्कालीन सेवांना कॉल करा (108 किंवा तुमचा स्थानिक आपत्कालीन नंबर).",
    "🚨 ही वैद्यकीय आपत्कालीन परिस्थिती आहे! कृपया ताबडतोब वैद्यकीय मदत घ्या किंवा आपत्कालीन सेवांना कॉल करा.",
    "⚠️ कृपया जवळच्या आपत्कालीन कक्षात जा किंवा आपत्कालीन सेवांना ताबडतोब कॉल करा!"
  ],
  help: [
    "**मी तुम्हाला मदत करू शकतो:**\n\n**📋 सिस्टम वैशिष्ट्ये:**\n• प्रिस्क्रिप्शन तयार करा\n• एक्स-रे अपलोड आणि विश्लेषण करा\n• प्रिस्क्रिप्शन इतिहास पहा\n• अॅनालिटिक्स डॅशबोर्ड\n• औषध व्यवस्थापन\n• प्रोफाइल सेटिंग्ज\n• प्रिस्क्रिप्शन प्रिंट करा\n• ईमेल सिस्टम\n• फॉलो-अप स्मरणपत्रे\n\n**💊 वैद्यकीय माहिती:**\n• लक्षणे (ताप, डोकेदुखी, खोकला, सर्दी, पोटदुखी)\n• औषधे (पॅरासिटामॉल, आयब्युप्रोफेन, अॅस्पिरिन)\n\n**🎤 व्हॉइस वैशिष्ट्ये:**\n• व्हॉइस इनपुट (तुमचे प्रश्न बोला)\n• व्हॉइस आउटपुट (प्रतिसाद ऐका)\n\n**फक्त विचारा:** \"[वैशिष्ट्य नाव] कसे करावे?\" पायरी-दर-पायरी मार्गदर्शनासाठी!"
  ]
};

// Medical knowledge base for common queries (English)
const medicalKnowledgeBase = {
  // Dental Problems & Treatments
  dentalProblems: {
    toothache: {
      info: "Toothache is pain in or around a tooth, usually caused by tooth decay, infection, or gum disease.",
      causes: "Tooth decay (cavity), abscess, gum disease, cracked tooth, exposed tooth root, impacted wisdom tooth",
      symptoms: "Sharp or throbbing pain, sensitivity to hot/cold, swelling around tooth, fever, bad taste in mouth",
      treatment: "**Immediate:** Rinse with warm salt water, use dental floss to remove food particles, take pain reliever.\n**Professional:** Filling, root canal, extraction, or antibiotics depending on cause.",
      prevention: "Brush twice daily, floss daily, limit sugary foods, regular dental checkups every 6 months",
      keywords: ["toothache", "tooth pain", "dental pain", "teeth hurt", "tooth hurts"]
    },
    cavity: {
      info: "Cavities (dental caries) are permanently damaged areas in teeth that develop into tiny holes.",
      causes: "Bacteria + sugar = acid that destroys tooth enamel. Poor oral hygiene, frequent snacking, sugary drinks",
      symptoms: "Tooth sensitivity, visible holes or pits, brown/black stains, pain when eating sweets",
      treatment: "**Steps:**\n1. Dental examination and X-ray\n2. Remove decayed portion\n3. Clean the cavity\n4. Fill with composite/amalgam\n5. Shape and polish filling\n6. Check bite alignment",
      prevention: "Brush with fluoride toothpaste, floss daily, reduce sugar intake, dental sealants, fluoride treatments",
      keywords: ["cavity", "tooth decay", "dental caries", "hole in tooth", "tooth filling"]
    },
    gumDisease: {
      info: "Gum disease (periodontal disease) is infection of tissues that hold teeth in place.",
      stages: "**Gingivitis:** Early stage, reversible. **Periodontitis:** Advanced, can cause tooth loss.",
      symptoms: "Red, swollen, bleeding gums, bad breath, receding gums, loose teeth, painful chewing",
      treatment: "**Steps:**\n1. Professional cleaning (scaling)\n2. Deep cleaning (root planing)\n3. Antibiotics if needed\n4. Surgery for advanced cases\n5. Regular maintenance cleanings",
      prevention: "Brush twice daily, floss daily, use antiseptic mouthwash, quit smoking, regular dental visits",
      keywords: ["gum disease", "bleeding gums", "gingivitis", "periodontitis", "gum infection", "swollen gums"]
    },
    sensitivity: {
      info: "Tooth sensitivity is sharp pain when teeth are exposed to hot, cold, sweet, or acidic foods.",
      causes: "Worn enamel, exposed tooth roots, cavities, cracked teeth, gum recession, teeth grinding",
      symptoms: "Sharp, sudden pain when eating/drinking hot, cold, sweet, or acidic items",
      treatment: "**Steps:**\n1. Use desensitizing toothpaste\n2. Fluoride gel application\n3. Dental bonding for exposed roots\n4. Gum graft for severe recession\n5. Root canal if severe",
      prevention: "Use soft-bristled brush, avoid acidic foods, don't brush too hard, use fluoride mouthwash",
      keywords: ["sensitive teeth", "tooth sensitivity", "teeth hurt cold", "teeth hurt hot", "sensitive tooth"]
    },
    wisdomTooth: {
      info: "Wisdom teeth are the last molars that usually emerge between ages 17-25.",
      problems: "Impaction (trapped), crowding, infection, cysts, damage to adjacent teeth",
      symptoms: "Pain at back of mouth, swollen gums, jaw pain, difficulty opening mouth, bad breath",
      treatment: "**Extraction Steps:**\n1. X-ray examination\n2. Local anesthesia/sedation\n3. Incision in gum if needed\n4. Remove tooth (may need sectioning)\n5. Clean socket\n6. Stitches if needed\n7. Gauze for bleeding\n**Recovery:** 3-7 days",
      aftercare: "Ice packs, soft foods, salt water rinses, avoid straws, take prescribed medications",
      keywords: ["wisdom tooth", "wisdom teeth", "impacted tooth", "third molar", "wisdom tooth pain"]
    },
    abscess: {
      info: "Dental abscess is a pocket of pus caused by bacterial infection in the tooth or gums.",
      types: "**Periapical:** At tooth root tip. **Periodontal:** In gums beside tooth root.",
      symptoms: "Severe throbbing pain, swelling, fever, bad taste, difficulty swallowing, swollen lymph nodes",
      treatment: "**Emergency Steps:**\n1. Drain the abscess\n2. Root canal treatment\n3. Tooth extraction if unsavable\n4. Antibiotics\n5. Pain management\n**Important:** Seek immediate dental care!",
      prevention: "Good oral hygiene, treat cavities promptly, avoid tooth trauma",
      keywords: ["abscess", "tooth abscess", "dental abscess", "pus in tooth", "tooth infection"]
    }
  },

  // Dental Treatments
  dentalTreatments: {
    rootCanal: {
      info: "Root canal treatment removes infected pulp from inside the tooth to save it.",
      when: "Needed for deep decay, cracked tooth, repeated dental procedures, or trauma",
      procedure: "**Steps:**\n1. X-ray to see infection extent\n2. Local anesthesia\n3. Rubber dam placement\n4. Access hole in tooth crown\n5. Remove infected pulp\n6. Clean and shape canals\n7. Fill canals with gutta-percha\n8. Temporary filling\n9. Crown placement (later visit)\n**Duration:** 1-2 hours",
      aftercare: "Avoid chewing on treated side, take prescribed medications, maintain oral hygiene, return for crown",
      keywords: ["root canal", "rct", "root canal treatment", "endodontic treatment", "pulp treatment"]
    },
    extraction: {
      info: "Tooth extraction is removal of a tooth from its socket in the bone.",
      reasons: "Severe decay, advanced gum disease, crowding, infection, impacted wisdom teeth",
      procedure: "**Steps:**\n1. X-ray examination\n2. Local anesthesia\n3. Loosen tooth with elevator\n4. Remove with forceps\n5. Clean socket\n6. Stitches if needed\n7. Gauze for bleeding\n**Duration:** 20-40 minutes",
      aftercare: "Bite gauze for 30 min, ice packs, soft foods, no smoking/straws, salt water rinses after 24 hours",
      keywords: ["tooth extraction", "tooth removal", "pull tooth", "extract tooth", "tooth pulling"]
    },
    filling: {
      info: "Dental filling restores a tooth damaged by decay back to normal function and shape.",
      types: "Composite (tooth-colored), Amalgam (silver), Gold, Porcelain, Glass ionomer",
      procedure: "**Steps:**\n1. Numb the area\n2. Remove decay with drill\n3. Clean the cavity\n4. Apply filling material\n5. Shape the filling\n6. Polish and adjust bite\n**Duration:** 30-60 minutes",
      aftercare: "Avoid hard foods for 24 hours, sensitivity is normal for few days, maintain oral hygiene",
      keywords: ["filling", "tooth filling", "dental filling", "cavity filling", "composite filling"]
    },
    cleaning: {
      info: "Professional teeth cleaning removes plaque, tartar, and stains from teeth.",
      importance: "Prevents cavities, gum disease, bad breath, and tooth loss",
      procedure: "**Steps:**\n1. Physical examination\n2. Remove tartar (scaling)\n3. Gritty toothpaste cleaning\n4. Expert flossing\n5. Rinsing\n6. Fluoride treatment\n**Duration:** 30-60 minutes\n**Frequency:** Every 6 months",
      benefits: "Prevents gum disease, removes stains, freshens breath, early problem detection",
      keywords: ["teeth cleaning", "dental cleaning", "scaling", "prophylaxis", "tartar removal"]
    },
    whitening: {
      info: "Teeth whitening lightens teeth and removes stains and discoloration.",
      methods: "In-office bleaching, at-home trays, whitening strips, whitening toothpaste",
      procedure: "**In-Office Steps:**\n1. Clean teeth\n2. Apply protective gel to gums\n3. Apply whitening agent\n4. Activate with special light\n5. Rinse and check results\n6. Repeat if needed\n**Duration:** 60-90 minutes\n**Results:** 3-8 shades lighter",
      aftercare: "Avoid staining foods/drinks for 48 hours, use whitening toothpaste, maintain good hygiene",
      keywords: ["teeth whitening", "bleaching", "white teeth", "tooth whitening", "brighten teeth"]
    },
    braces: {
      info: "Braces straighten teeth and correct bite problems using brackets and wires.",
      types: "Metal braces, ceramic braces, lingual braces, clear aligners (Invisalign)",
      procedure: "**Steps:**\n1. Consultation and X-rays\n2. Teeth cleaning\n3. Bonding brackets to teeth\n4. Connecting with archwire\n5. Monthly adjustments\n6. Removal after 1-3 years\n7. Retainer placement",
      care: "Brush after every meal, use special floss, avoid hard/sticky foods, wear rubber bands as directed",
      keywords: ["braces", "orthodontics", "teeth straightening", "dental braces", "aligners", "invisalign"]
    },
    crown: {
      info: "Dental crown is a tooth-shaped cap placed over a damaged tooth to restore its shape, size, and strength.",
      when: "Large cavity, after root canal, cracked tooth, cosmetic improvement, dental implant",
      procedure: "**Steps:**\n1. Numb the tooth\n2. File down tooth\n3. Take impression\n4. Temporary crown placement\n5. Lab creates permanent crown\n6. Remove temporary\n7. Cement permanent crown\n**Visits:** 2 (2-3 weeks apart)",
      types: "Porcelain, ceramic, metal, porcelain-fused-to-metal, resin",
      keywords: ["crown", "dental crown", "tooth cap", "cap on tooth", "crown procedure"]
    },
    implant: {
      info: "Dental implant is an artificial tooth root placed into jaw to hold a replacement tooth.",
      benefits: "Looks natural, permanent solution, preserves bone, doesn't affect adjacent teeth",
      procedure: "**Steps:**\n1. Consultation and CT scan\n2. Tooth extraction (if needed)\n3. Bone graft (if needed)\n4. Implant placement surgery\n5. Healing period (3-6 months)\n6. Abutment placement\n7. Crown attachment\n**Total time:** 3-9 months",
      care: "Brush and floss regularly, avoid hard foods initially, regular dental checkups",
      keywords: ["dental implant", "tooth implant", "implant", "artificial tooth", "tooth replacement"]
    }
  },

  // Dental Precautions & Care
  dentalCare: {
    brushing: {
      info: "Proper brushing technique is essential for maintaining oral health.",
      technique: "**Steps:**\n1. Use soft-bristled brush\n2. Apply pea-sized fluoride toothpaste\n3. Hold brush at 45° angle to gums\n4. Gentle circular motions\n5. Brush outer, inner, and chewing surfaces\n6. Brush tongue\n7. Rinse thoroughly\n**Duration:** 2 minutes\n**Frequency:** Twice daily",
      tips: "Replace brush every 3 months, don't brush too hard, use fluoride toothpaste, brush after meals if possible",
      keywords: ["brushing", "how to brush", "brush teeth", "brushing technique", "tooth brushing"]
    },
    flossing: {
      info: "Flossing removes plaque and food particles between teeth where brush can't reach.",
      technique: "**Steps:**\n1. Use 18 inches of floss\n2. Wind around middle fingers\n3. Hold tight between thumbs and forefingers\n4. Gently slide between teeth\n5. Curve around each tooth in C-shape\n6. Move up and down\n7. Use clean section for each tooth\n**Frequency:** Once daily (preferably before bed)",
      importance: "Prevents cavities between teeth, reduces gum disease, removes 40% more plaque than brushing alone",
      keywords: ["flossing", "dental floss", "how to floss", "floss teeth", "flossing technique"]
    },
    diet: {
      info: "Diet plays crucial role in dental health.",
      goodFoods: "**Tooth-Friendly Foods:**\n• Dairy (calcium for strong teeth)\n• Crunchy fruits/vegetables (natural cleaning)\n• Nuts and seeds (minerals)\n• Green/black tea (polyphenols)\n• Sugar-free gum (stimulates saliva)\n• Water (rinses mouth)",
      avoidFoods: "**Harmful Foods:**\n• Sugary candies and sodas\n• Acidic foods (citrus, pickles)\n• Sticky foods (caramel, dried fruits)\n• Hard foods (ice, hard candy)\n• Starchy foods (chips, bread)",
      tips: "Drink water after meals, limit snacking, eat cheese after meals (neutralizes acid), chew sugar-free gum",
      keywords: ["dental diet", "foods for teeth", "tooth-friendly foods", "diet for teeth", "what to eat"]
    },
    prevention: {
      info: "Preventive dental care helps avoid serious dental problems.",
      dailyCare: "**Daily Routine:**\n1. Brush twice daily (2 min each)\n2. Floss once daily\n3. Use fluoride toothpaste\n4. Rinse with mouthwash\n5. Drink plenty of water\n6. Limit sugary foods/drinks\n7. Chew sugar-free gum",
      regularVisits: "**Professional Care:**\n• Dental checkup every 6 months\n• Professional cleaning every 6 months\n• X-rays annually or as needed\n• Fluoride treatments (for children)\n• Dental sealants (for molars)",
      lifestyle: "Don't smoke, limit alcohol, wear mouthguard for sports, don't use teeth as tools",
      keywords: ["dental prevention", "prevent cavities", "oral care", "dental hygiene", "tooth care"]
    },
    emergency: {
      info: "Dental emergencies require immediate attention.",
      situations: "**Emergencies:**\n• Knocked-out tooth\n• Severe toothache\n• Broken/cracked tooth\n• Abscess\n• Uncontrolled bleeding\n• Jaw injury\n• Object stuck between teeth",
      firstAid: "**Knocked-out tooth:**\n1. Hold by crown, not root\n2. Rinse gently if dirty\n3. Try to reinsert in socket\n4. If not possible, keep in milk\n5. See dentist within 30 minutes\n\n**Severe pain:**\n1. Rinse with warm salt water\n2. Floss to remove debris\n3. Take pain reliever\n4. Cold compress outside\n5. Call dentist immediately",
      keywords: ["dental emergency", "tooth knocked out", "broken tooth", "dental first aid", "tooth trauma"]
    }
  },

  symptoms: {
    fever: {
      info: "Fever is a temporary increase in body temperature, often due to an illness. Normal body temperature is around 98.6°F (37°C).",
      advice: "Rest, stay hydrated, and take fever-reducing medication if needed. Consult a doctor if fever persists for more than 3 days or exceeds 103°F (39.4°C).",
      keywords: ["fever", "temperature", "hot", "burning"]
    },
    headache: {
      info: "Headaches can be caused by stress, dehydration, lack of sleep, or underlying conditions.",
      advice: "Rest in a quiet, dark room. Stay hydrated. Over-the-counter pain relievers may help. See a doctor if headaches are severe or persistent.",
      keywords: ["headache", "head pain", "migraine", "head ache"]
    },
    cough: {
      info: "Cough is a reflex action to clear airways. Can be dry or productive (with mucus).",
      advice: "Stay hydrated, use honey or cough drops. See a doctor if cough persists beyond 3 weeks or is accompanied by blood, fever, or breathing difficulty.",
      keywords: ["cough", "coughing", "throat irritation"]
    },
    cold: {
      info: "Common cold is a viral infection of the upper respiratory tract.",
      advice: "Rest, drink plenty of fluids, use saline nasal drops. Symptoms usually resolve in 7-10 days. Consult a doctor if symptoms worsen.",
      keywords: ["cold", "runny nose", "sneezing", "congestion"]
    },
    stomachache: {
      info: "Stomach pain can result from indigestion, gas, infection, or other digestive issues.",
      advice: "Avoid heavy meals, stay hydrated. Use over-the-counter antacids if needed. Seek medical attention if pain is severe or persistent.",
      keywords: ["stomach", "abdominal pain", "belly ache", "tummy"]
    }
  },
  
  medications: {
    paracetamol: {
      info: "Paracetamol (Acetaminophen) is a pain reliever and fever reducer.",
      usage: "Adults: 500-1000mg every 4-6 hours. Maximum 4000mg per day. Take with or without food.",
      warnings: "Do not exceed recommended dose. Avoid alcohol. Consult doctor if you have liver problems.",
      keywords: ["paracetamol", "acetaminophen", "tylenol", "fever reducer"]
    },
    ibuprofen: {
      info: "Ibuprofen is a non-steroidal anti-inflammatory drug (NSAID) used for pain and inflammation.",
      usage: "Adults: 200-400mg every 4-6 hours. Maximum 1200mg per day without doctor supervision. Take with food.",
      warnings: "May cause stomach upset. Avoid if you have ulcers or kidney problems. Not recommended during pregnancy.",
      keywords: ["ibuprofen", "advil", "motrin", "anti-inflammatory"]
    },
    aspirin: {
      info: "Aspirin is used for pain relief, fever reduction, and blood thinning.",
      usage: "Adults: 325-650mg every 4 hours for pain. Lower doses for heart protection (consult doctor).",
      warnings: "Not for children under 12. May cause stomach bleeding. Consult doctor if on blood thinners.",
      keywords: ["aspirin", "blood thinner", "pain relief"]
    }
  },
  
  general: {
    prescription: {
      info: "Create professional digital prescriptions with automatic email delivery and comprehensive patient management.",
      advice: "**📋 Complete Prescription Guide:**\n\n**Step 1: Navigate to Prescriptions**\n• Click 'Prescriptions' in navigation menu\n• Or click 'Create Prescription' button on homepage\n\n**Step 2: Patient Information**\n• **Patient Name:** Enter full name\n• **Age:** Patient age\n• **Sex:** Select Male/Female/Other\n• **Mobile:** 10-digit mobile number\n• **Email:** Patient email (enables auto-email)\n• **Address:** Patient address\n\n**Step 3: Treatment Selection**\n• Choose from **15+ treatment types:**\n  - Root Canal Treatment\n  - Tooth Extraction\n  - Dental Filling\n  - Braces/Orthodontics\n  - Professional Teeth Cleaning\n  - Crown & Bridge Work\n  - Dental Implant\n  - Wisdom Tooth Removal\n  - Gum Disease Treatment\n  - Teeth Whitening\n  - Cavity Treatment\n  - Denture Fitting\n  - Oral Surgery\n  - Emergency Treatment\n  - Regular Checkup\n\n**Step 4: Add Medicines**\n• **Method A - Medicine Codes (Faster):**\n  1. Enter medicine code (e.g., M001, M002)\n  2. Click 'Fetch Medicine' button\n  3. All details auto-populate from database\n• **Method B - Manual Entry:**\n  1. Medicine name (e.g., Paracetamol)\n  2. Dosage amount (e.g., 500mg)\n  3. Timing: Morning/Afternoon/Night checkboxes\n  4. Duration (e.g., 5 days, 1 week)\n  5. Instructions (Before food/After food)\n• **Add Multiple:** Click 'Add Medicine' for more rows\n\n**Step 5: Treatment Notes**\n• Add detailed treatment notes\n• Include special care instructions\n• Add dietary recommendations\n• Include warning signs to watch for\n\n**Step 6: Follow-up Management**\n• Set next appointment date\n• System tracks follow-up reminders\n• Email reminders sent automatically\n\n**Step 7: X-ray Integration (Optional)**\n• Upload X-ray images directly\n• AI analysis provides insights\n• X-rays attached to prescription\n\n**Step 8: Save & Actions**\n• Click 'Save Prescription'\n• **Automatic Actions:**\n  - Saves to database\n  - Generates professional PDF\n  - Emails prescription to patient\n  - Adds to prescription history\n  - Sets follow-up reminders\n\n**💡 Pro Tips:**\n• Use medicine codes for 10x faster entry\n• Enable patient email for automatic delivery\n• Add detailed notes for better care\n• Set follow-up dates for tracking\n• Use print preview before final print",
      keywords: ["prescription", "prescribe", "medicine list", "create prescription", "how to prescribe", "digital prescription", "patient prescription", "medical prescription", "prescription system"]
    },
    xray: {
      info: "Advanced X-ray management with AI-powered analysis for dental diagnosis and treatment planning.",
      advice: "**🔬 Complete X-Ray Guide:**\n\n**Step 1: Navigate to X-Ray**\n• Click 'X-Ray' in navigation menu\n• Access X-ray management dashboard\n\n**Step 2: Patient Information**\n• **Patient Name:** Enter full patient name\n• **Mobile Number:** 10-digit contact number\n• **Treatment Context:** Optional notes about why X-ray is needed\n\n**Step 3: Upload X-Ray Image**\n• Click 'Select X-ray Image' button\n• **Supported formats:** JPG, PNG, JPEG\n• **File size:** Up to 10MB\n• **Auto-compression:** System compresses to 4 levels for optimal storage\n• **Preview:** Image preview appears immediately\n\n**Step 4: AI Analysis**\n• Click 'Analyze X-ray with AI' button\n• **AI detects:**\n  - Cavities and decay\n  - Bone fractures\n  - Bone loss/density issues\n  - Infections and abscesses\n  - Impacted teeth\n  - Root canal needs\n  - Periodontal disease\n• **Confidence scores** provided for each finding\n• **Treatment recommendations** suggested\n\n**Step 5: Review Results**\n• **AI Findings Panel:**\n  - Detailed analysis report\n  - Confidence percentages\n  - Highlighted problem areas\n  - Treatment suggestions\n• **Manual Notes:** Add your own observations\n• **Treatment Plan:** Create based on findings\n\n**Step 6: Save & Integration**\n• Click 'Save X-ray' to store\n• **Automatic actions:**\n  - Saves to database with patient record\n  - Links to prescription system\n  - Generates analysis report\n  - Prepares for email attachment\n\n**Step 7: Prescription Integration**\n• X-ray automatically available in prescription form\n• AI analysis included in treatment notes\n• Treatment recommendations pre-filled\n• Professional formatting for patient\n\n**Step 8: Patient Communication**\n• X-ray emailed to patient automatically\n• AI analysis report included\n• Treatment plan attached\n• Follow-up recommendations sent\n\n**💡 Advanced Features:**\n• **4-Level Compression:** Optimizes storage without quality loss\n• **Base64 Encoding:** Secure image storage\n• **Email Integration:** Automatic patient delivery\n• **History Tracking:** All X-rays stored with patient records\n• **Print Support:** High-quality printouts\n• **Mobile Responsive:** Works on all devices\n\n**🔍 AI Analysis Capabilities:**\n• **Cavity Detection:** Identifies decay patterns\n• **Fracture Analysis:** Detects bone breaks\n• **Density Assessment:** Measures bone health\n• **Infection Identification:** Spots problem areas\n• **Impaction Detection:** Finds blocked teeth\n• **Treatment Recommendations:** Suggests next steps",
      keywords: ["xray", "x-ray", "scan", "imaging", "radiology", "upload xray", "ai analysis", "dental xray", "x ray analysis", "artificial intelligence", "dental imaging", "radiography"]
    },
    history: {
      info: "Comprehensive prescription history management with advanced search, filtering, and bulk operations.",
      advice: "**📚 Complete History Guide:**\n\n**Step 1: Access History**\n• Click 'History' in navigation menu\n• View all past prescriptions in organized cards\n\n**Step 2: Search & Filter**\n• **Search by Patient:** Type patient name in search box\n• **Search by Mobile:** Enter mobile number\n• **Date Range Filter:** Select start and end dates\n• **Treatment Type Filter:** Choose specific treatments\n• **Reset Filters:** Clear all filters to show all records\n\n**Step 3: View Prescription Details**\n• Click on any prescription card to expand\n• **Detailed View Shows:**\n  - Complete patient information\n  - All prescribed medicines with dosages\n  - Treatment notes and instructions\n  - X-ray images (if attached)\n  - AI analysis results\n  - Follow-up dates\n  - Email delivery status\n\n**Step 4: Print & Export**\n• **Print Individual:** Click 'Print' button on specific prescription\n• **Professional Format:** Generates clinic-branded PDF\n• **Export Options:** CSV, PDF, Excel formats\n• **Bulk Export:** Select multiple prescriptions\n\n**Step 5: Management Actions**\n• **Delete Mode:** Toggle delete mode for bulk operations\n• **Select Multiple:** Check prescriptions for bulk actions\n• **Delete Selected:** Remove multiple prescriptions at once\n• **Delete All:** Clear complete history (with confirmation)\n\n**Step 6: Patient Communication**\n• **Re-send Email:** Send prescription again to patient\n• **Update Contact:** Modify patient contact information\n• **Add Notes:** Include additional treatment notes\n\n**💡 Advanced Features:**\n• **Smart Search:** Searches across all fields\n• **Auto-complete:** Patient names auto-suggest\n• **Grouping:** Prescriptions grouped by patient\n• **Sorting:** Sort by date, patient name, treatment type\n• **Pagination:** Efficient loading for large histories\n• **Mobile Responsive:** Full functionality on mobile devices\n\n**📊 History Analytics:**\n• **Patient Count:** Total unique patients treated\n• **Prescription Count:** Total prescriptions created\n• **Treatment Distribution:** Most common treatments\n• **Follow-up Tracking:** Pending appointments\n• **Email Status:** Delivery success rates",
      keywords: ["history", "past prescriptions", "view history", "prescription history", "records", "search prescriptions", "filter history", "patient records", "prescription search"]
    },
    analytics: {
      info: "Comprehensive practice analytics with visual charts, trends, and business insights for data-driven decisions.",
      advice: "**📊 Complete Analytics Guide:**\n\n**Step 1: Access Analytics Dashboard**\n• Click 'Analytics' in navigation menu\n• View comprehensive practice overview\n\n**Step 2: Treatment Distribution Analysis**\n• **Pie Chart:** Visual breakdown of treatment types\n• **Most Popular Treatments:** Ranked list with percentages\n• **Treatment Trends:** Growth/decline patterns\n• **Revenue by Treatment:** Financial analysis per treatment type\n\n**Step 3: Patient Demographics**\n• **Age Distribution:** Patient age groups analysis\n• **Gender Distribution:** Male/Female/Other breakdown\n• **Geographic Analysis:** Patient location patterns\n• **New vs Returning:** Patient retention metrics\n\n**Step 4: Prescription Trends**\n• **Daily Prescriptions:** Day-by-day prescription volume\n• **Monthly Trends:** Long-term practice growth\n• **Peak Hours:** Busiest times of day\n• **Seasonal Patterns:** Monthly/yearly variations\n\n**Step 5: X-Ray Usage Statistics**\n• **X-Ray Volume:** Total X-rays taken\n• **AI Analysis Usage:** AI utilization rates\n• **Common Findings:** Most detected conditions\n• **Treatment Correlation:** X-ray to treatment conversion\n\n**Step 6: Medicine Analytics**\n• **Most Prescribed:** Top medicines by frequency\n• **Dosage Patterns:** Common dosage combinations\n• **Treatment Effectiveness:** Follow-up success rates\n• **Medicine Categories:** Drug type distribution\n\n**Step 7: Business Insights**\n• **Patient Growth:** New patient acquisition rates\n• **Follow-up Compliance:** Appointment adherence\n• **Email Delivery:** Communication success rates\n• **System Usage:** Feature utilization statistics\n\n**Step 8: Export & Reporting**\n• **PDF Reports:** Professional analytics reports\n• **CSV Export:** Raw data for external analysis\n• **Custom Date Ranges:** Flexible time period selection\n• **Scheduled Reports:** Automatic weekly/monthly reports\n\n**💡 Advanced Analytics Features:**\n• **Real-time Updates:** Live data refreshing\n• **Interactive Charts:** Click to drill down\n• **Comparison Views:** Year-over-year comparisons\n• **Predictive Insights:** Trend forecasting\n• **Performance Metrics:** KPI tracking\n• **Mobile Dashboard:** Full analytics on mobile\n\n**🎯 Key Performance Indicators:**\n• **Patient Satisfaction:** Based on follow-up data\n• **Treatment Success Rate:** Outcome tracking\n• **Practice Efficiency:** Time per prescription\n• **Revenue Trends:** Financial growth patterns\n• **Technology Adoption:** AI and digital tool usage",
      keywords: ["analytics", "dashboard", "statistics", "reports", "insights", "charts", "practice analytics", "business intelligence", "data analysis", "performance metrics", "trends"]
    },
    medicine: {
      info: "Comprehensive medicine database management with codes, dosages, and intelligent auto-population features.",
      advice: "**💊 Complete Medicine Management Guide:**\n\n**Step 1: Access Medicine Database**\n• Click 'Add Medicine' in navigation menu\n• View your personal medicine library\n\n**Step 2: Add New Medicine**\n• **Medicine Name:** Enter complete medicine name\n• **Medicine Code:** Create unique code (e.g., M001, PAR01)\n• **Generic Name:** Add generic equivalent\n• **Brand Names:** Include popular brand names\n\n**Step 3: Dosage Configuration**\n• **Morning Dose:** Amount for morning (e.g., 1 tablet)\n• **Afternoon Dose:** Midday dosage\n• **Night Dose:** Evening dosage\n• **Dosage Unit:** mg, tablets, ml, etc.\n• **Total Daily Dose:** Automatic calculation\n\n**Step 4: Administration Details**\n• **Before/After Food:** Specify timing\n• **Duration Options:** Common treatment lengths\n• **Special Instructions:** Warnings, side effects\n• **Contraindications:** When not to prescribe\n\n**Step 5: Save & Organize**\n• Click 'Save Medicine' to add to database\n• **Auto-sync:** Saves locally and to server\n• **Categories:** Organize by medicine type\n• **Search Tags:** Add searchable keywords\n\n**Step 6: Quick Prescription Use**\n• **In Prescription Form:**\n  1. Enter medicine code (e.g., M001)\n  2. Click 'Fetch Medicine'\n  3. All details auto-populate instantly\n• **10x Faster** than manual entry\n\n**Step 7: Medicine Library Management**\n• **Search:** Find medicines by name or code\n• **Edit:** Update existing medicine details\n• **Delete:** Remove outdated medicines\n• **Export:** Backup medicine database\n• **Import:** Restore from backup\n\n**💡 Pro Tips:**\n• **Use Short Codes:** PAR for Paracetamol, IBU for Ibuprofen\n• **Standard Dosages:** Set most common doses as default\n• **Include Generics:** Add both brand and generic names\n• **Regular Updates:** Keep database current\n• **Backup Regularly:** Export medicine list monthly\n\n**🔍 Smart Features:**\n• **Auto-complete:** Medicine names suggest as you type\n• **Duplicate Detection:** Prevents duplicate entries\n• **Dosage Validation:** Checks for safe dosage ranges\n• **Interaction Warnings:** Alerts for drug interactions\n• **Marathi Support:** Medicine names in regional language",
      keywords: ["medicine", "add medicine", "medicine database", "medicine codes", "dosage", "drug database", "pharmacy", "medication management", "medicine list", "prescribe medicine"]
    },
    profile: {
      info: "Complete doctor profile management with clinic information, credentials, and system preferences.",
      advice: "**👨‍⚕️ Complete Profile Management Guide:**\n\n**Step 1: Access Profile**\n• Click 'Profile' in navigation menu\n• View/edit your doctor information\n\n**Step 2: Personal Information**\n• **Full Name:** Your complete professional name\n• **Specialization:** Medical specialty (e.g., Dentist, Orthodontist)\n• **Registration Number:** Medical council registration\n• **Qualification:** Degrees and certifications\n• **Experience:** Years of practice\n\n**Step 3: Clinic Information**\n• **Clinic Name:** Your practice name\n• **Address:** Complete clinic address\n• **Phone Numbers:** Clinic and mobile contacts\n• **Email:** Professional email address\n• **Website:** Clinic website URL\n• **Operating Hours:** Clinic timings\n\n**Step 4: Prescription Settings**\n• **Prescription Header:** Custom clinic letterhead\n• **Signature:** Digital signature setup\n• **Logo Upload:** Clinic logo for prescriptions\n• **Footer Information:** Additional clinic details\n• **Default Instructions:** Standard patient instructions\n\n**Step 5: System Preferences**\n• **Language Settings:** English/Marathi preference\n• **Date Format:** DD/MM/YYYY or MM/DD/YYYY\n• **Time Zone:** Local time zone setting\n• **Auto-email:** Enable/disable automatic patient emails\n• **Notification Settings:** System alerts preferences\n\n**Step 6: Security Settings**\n• **Change Password:** Update login password\n• **Two-Factor Authentication:** Enhanced security\n• **Session Timeout:** Auto-logout settings\n• **Login History:** Recent access logs\n\n**Step 7: Integration Settings**\n• **Email Configuration:** SMTP settings for patient emails\n• **Backup Settings:** Automatic data backup preferences\n• **API Access:** Third-party integrations\n• **Export Preferences:** Default export formats\n\n**💡 Profile Optimization Tips:**\n• **Complete All Fields:** Better prescription appearance\n• **Professional Photo:** Builds patient trust\n• **Updated Credentials:** Keep qualifications current\n• **Accurate Contact Info:** Ensures patient communication\n• **Regular Updates:** Review profile monthly",
      keywords: ["profile", "doctor profile", "clinic information", "settings", "account settings", "personal information", "clinic details", "profile setup", "doctor information"]
    },
    chatbot: {
      info: "AI-powered medical assistant with voice support, bilingual capabilities, and comprehensive medical knowledge.",
      advice: "**🤖 Complete Chatbot Guide:**\n\n**Step 1: Access Chatbot**\n• **Floating Button:** Purple chat bubble (bottom-right corner)\n• **Always Available:** On every page of the system\n• **Click to Open:** Instant chat interface\n\n**Step 2: Text Communication**\n• **Type Questions:** Ask anything about medical topics or system features\n• **Suggestion Chips:** Click quick suggestions for common queries\n• **Smart Responses:** Get detailed, contextual answers\n• **Follow-up Questions:** Continue conversations naturally\n\n**Step 3: Voice Features**\n• **Voice Input:** Click microphone icon and speak your question\n• **Voice Output:** Toggle speaker icon for audio responses\n• **Language Support:** Works in English and Marathi\n• **Clear Audio:** High-quality speech recognition\n\n**Step 4: Medical Knowledge**\n• **Dental Problems:** Toothache, cavities, gum disease, sensitivity\n• **Dental Treatments:** Root canal, extraction, filling, braces\n• **Medications:** Paracetamol, ibuprofen, antibiotics\n• **Symptoms:** Fever, headache, cough, cold\n• **Emergency Guidance:** Immediate help for urgent situations\n\n**Step 5: System Help**\n• **Feature Guidance:** How to use prescription system\n• **Step-by-step Instructions:** Detailed walkthroughs\n• **Troubleshooting:** Solve common issues\n• **Tips & Tricks:** Optimize system usage\n\n**Step 6: Bilingual Support**\n• **English:** Full medical and system knowledge\n• **Marathi:** Complete translation and local language support\n• **Auto-detection:** Recognizes language automatically\n• **Mixed Conversations:** Switch between languages freely\n\n**💡 Chatbot Capabilities:**\n• **24/7 Availability:** Always ready to help\n• **Instant Responses:** Immediate answers\n• **Context Awareness:** Remembers conversation flow\n• **Learning System:** Improves with usage\n• **Emergency Detection:** Recognizes urgent situations\n\n**🎤 Voice Commands:**\n• \"How do I create a prescription?\"\n• \"What is toothache?\"\n• \"Show me X-ray features\"\n• \"मदत\" (Marathi for help)\n• \"Tell me about analytics\"\n\n**Sample Questions to Try:**\n• \"How do I add medicines to prescription?\"\n• \"What should I do for severe toothache?\"\n• \"How does AI X-ray analysis work?\"\n• \"Show me all system features\"\n• \"How to view prescription history?\"",
      keywords: ["chatbot", "chat", "help", "assistant", "voice", "speak", "ask questions", "medical assistant", "ai helper", "system help", "voice input", "voice output", "marathi", "english"]
    },
    login: {
      info: "Secure authentication system with JWT tokens and cross-tab logout synchronization.",
      advice: "**🔐 Complete Login Guide:**\n\n**For New Users (Sign Up):**\n1. Click 'Login' button on homepage\n2. Click 'Sign Up' tab\n3. **Fill Registration Form:**\n   • Full Name (professional name)\n   • Email Address (will be your username)\n   • Password (minimum 6 characters)\n   • Specialization (e.g., Dentist, General Physician)\n   • Clinic Name\n4. Click 'Sign Up' button\n5. Account created automatically\n6. Redirected to dashboard\n\n**For Existing Users (Sign In):**\n1. Click 'Login' button on homepage\n2. Enter your registered email\n3. Enter your password\n4. Click 'Sign In'\n5. JWT token generated for security\n6. Redirected to your dashboard\n\n**Security Features:**\n• **JWT Authentication:** Secure token-based login\n• **Password Encryption:** bcrypt hashing\n• **Session Management:** Auto-logout on inactivity\n• **Cross-tab Sync:** Logout from all tabs simultaneously\n• **Secure Storage:** Tokens stored securely\n\n**Forgot Password:**\n• Password reset functionality available\n• Email-based recovery system\n• Secure token verification\n\n**💡 Login Tips:**\n• Use professional email address\n• Choose strong password\n• Remember to logout on shared computers\n• Update profile after first login",
      keywords: ["login", "sign in", "sign up", "register", "account", "authentication", "password", "security", "jwt", "logout"]
    },
    email: {
      info: "Automatic email system that sends prescriptions, X-rays, and follow-up reminders to patients.",
      advice: "**📧 Complete Email System Guide:**\n\n**Automatic Email Features:**\n• **Prescription Emails:** Sent automatically when prescription is saved\n• **X-ray Emails:** X-ray images attached to patient emails\n• **AI Analysis:** X-ray analysis results included\n• **Follow-up Reminders:** Automatic appointment reminders\n• **Professional Format:** Clinic-branded email templates\n\n**Email Content Includes:**\n• **Prescription PDF:** Professional prescription document\n• **Patient Information:** Name, treatment details\n• **Medicine List:** Complete medication instructions\n• **X-ray Images:** High-quality X-ray attachments\n• **AI Findings:** Analysis results and recommendations\n• **Follow-up Info:** Next appointment details\n• **Clinic Contact:** Your clinic information\n\n**Email Configuration:**\n• **SMTP Settings:** Configure in profile settings\n• **Custom Templates:** Personalize email format\n• **Signature:** Add doctor signature to emails\n• **Logo:** Include clinic logo in emails\n\n**Patient Benefits:**\n• **Instant Delivery:** Immediate prescription access\n• **Digital Records:** Patients keep digital copies\n• **X-ray Access:** Patients receive their X-rays\n• **Treatment Tracking:** Follow-up reminders\n• **Professional Communication:** Branded clinic emails\n\n**Email Status Tracking:**\n• **Delivery Confirmation:** Track email delivery\n• **Open Rates:** Monitor patient engagement\n• **Bounce Handling:** Manage failed deliveries\n• **Resend Options:** Send emails again if needed\n\n**💡 Email Best Practices:**\n• Always get patient email consent\n• Use professional email templates\n• Include clear contact information\n• Test email delivery regularly\n• Keep patient data secure",
      keywords: ["email", "send email", "patient email", "prescription email", "automatic email", "email system", "patient communication", "follow up", "email delivery"]
    },
    printing: {
      info: "Professional prescription printing with clinic branding and standardized medical formatting.",
      advice: "**🖨️ Complete Printing Guide:**\n\n**Print Prescription:**\n• **From Prescription Form:** Click 'Print' after saving\n• **From History:** Click 'Print' on any past prescription\n• **Professional Format:** Clinic letterhead and branding\n• **Standard Layout:** Medical prescription format\n• **Multiple Copies:** Print as many copies as needed\n\n**Print Features:**\n• **Clinic Header:** Your clinic name and details\n• **Doctor Information:** Name, qualification, registration\n• **Patient Details:** Complete patient information\n• **Medicine Table:** Organized medicine list with dosages\n• **Treatment Notes:** Special instructions included\n• **X-ray Integration:** X-ray images included if attached\n• **Digital Signature:** Your signature on prescription\n• **Date & Time:** Prescription timestamp\n\n**Print Quality:**\n• **High Resolution:** Clear, professional printing\n• **Standard Paper:** A4 size compatibility\n• **Proper Margins:** Optimized for all printers\n• **Font Standards:** Medical prescription fonts\n• **Logo Support:** Clinic logo integration\n\n**Print Options:**\n• **Preview:** See before printing\n• **Page Setup:** Adjust margins and orientation\n• **Multiple Copies:** Print several copies\n• **Save as PDF:** Digital copy option\n\n**💡 Printing Tips:**\n• Use quality paper for professional appearance\n• Check printer settings before printing\n• Keep digital backups of all prescriptions\n• Test print setup with sample prescription",
      keywords: ["print", "printing", "print prescription", "pdf", "paper", "professional printing", "clinic letterhead", "prescription format"]
    }
  }
};

// Predefined responses for common greetings and queries
const predefinedResponses = {
  greeting: [
    "Hello! I'm your medical assistant. How can I help you today?",
    "Hi there! I'm here to assist with medical queries and system navigation.",
    "Welcome! Ask me about symptoms, medications, or how to use this system."
  ],
  thanks: [
    "You're welcome! Feel free to ask if you need more help.",
    "Happy to help! Let me know if you have other questions.",
    "Glad I could assist! Stay healthy!"
  ],
  goodbye: [
    "Take care! Feel free to return anytime.",
    "Goodbye! Wishing you good health.",
    "See you later! Stay safe and healthy."
  ],
  emergency: [
    "⚠️ For medical emergencies, please call emergency services immediately (911 or your local emergency number).",
    "🚨 This is a medical emergency! Please seek immediate medical attention or call emergency services.",
    "⚠️ Please go to the nearest emergency room or call emergency services right away!"
  ]
};

// Emergency keywords that require immediate attention (English and Marathi)
const emergencyKeywords = [
  "chest pain", "heart attack", "stroke", "can't breathe", "cannot breathe",
  "severe bleeding", "unconscious", "suicide", "overdose", "poisoning",
  "severe burn", "choking", "seizure",
  // Marathi emergency keywords
  "छातीत दुखी", "हृदयविकाराचा झटका", "पक्षाघात", "श्वास घेता येत नाही",
  "गंभीर रक्तस्त्राव", "बेशुद्ध", "आत्महत्या", "जास्त डोस", "विषबाधा",
  "गंभीर भाजणे", "गुदमरणे", "फेफरे"
];

/**
 * Detect if message is in Marathi
 */
function isMarathi(message) {
  // Check for Devanagari script (Marathi uses Devanagari)
  const devanagariPattern = /[\u0900-\u097F]/;
  return devanagariPattern.test(message);
}

/**
 * Analyze message in Marathi
 */
function analyzeMarathiMessage(message) {
  const lowerMessage = message.toLowerCase().trim().replace(/[।.!?]/g, ''); // Remove punctuation
  
  console.log('🔍 Analyzing Marathi message:', message);
  console.log('   Lower & cleaned:', lowerMessage);
  
  // Check for emergency keywords
  for (const keyword of emergencyKeywords) {
    if (lowerMessage.includes(keyword)) {
      return {
        type: "emergency",
        response: marathiResponses.emergency[0]
      };
    }
  }
  
  // Check for help/features request
  if (/(मदत|वैशिष्ट्ये|तुम्ही काय करू शकता|वैशिष्ट्ये दाखवा)/i.test(lowerMessage)) {
    return {
      type: "help",
      response: marathiResponses.help[0]
    };
  }
  
  // Check for greetings
  console.log('   Testing greeting pattern...');
  const greetingTest = /(नमस्कार|नमस्ते|हाय|हॅलो)/i.test(lowerMessage);
  console.log('   Greeting test result:', greetingTest);
  
  if (greetingTest) {
    const greetingResponse = marathiResponses.greeting[Math.floor(Math.random() * marathiResponses.greeting.length)];
    console.log('   ✅ Matched greeting! Returning:', greetingResponse.substring(0, 30));
    return {
      type: "greeting",
      response: greetingResponse
    };
  }
  
  // Check for thanks
  if (/(धन्यवाद|आभार)/i.test(lowerMessage)) {
    return {
      type: "thanks",
      response: marathiResponses.thanks[Math.floor(Math.random() * marathiResponses.thanks.length)]
    };
  }
  
  // Check for goodbye
  if (/(निरोप|बाय|भेटू)/i.test(lowerMessage)) {
    return {
      type: "goodbye",
      response: marathiResponses.goodbye[Math.floor(Math.random() * marathiResponses.goodbye.length)]
    };
  }
  
  // Search in Marathi knowledge base
  let bestMatch = null;
  let bestScore = 0;
  
  // Search symptoms
  for (const [key, data] of Object.entries(marathiKnowledgeBase.symptoms)) {
    for (const keyword of data.keywords) {
      if (lowerMessage.includes(keyword)) {
        const score = keyword.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            type: "symptom",
            category: key,
            data: data
          };
        }
      }
    }
  }
  
  // Search medications
  for (const [key, data] of Object.entries(marathiKnowledgeBase.medications)) {
    for (const keyword of data.keywords) {
      if (lowerMessage.includes(keyword)) {
        const score = keyword.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            type: "medication",
            category: key,
            data: data
          };
        }
      }
    }
  }
  
  // Search general topics
  for (const [key, data] of Object.entries(marathiKnowledgeBase.general)) {
    for (const keyword of data.keywords) {
      if (lowerMessage.includes(keyword)) {
        const score = keyword.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            type: "general",
            category: key,
            data: data
          };
        }
      }
    }
  }
  
  console.log('Marathi analysis result:', bestMatch);
  return bestMatch;
}

/**
 * Analyze user message and find relevant information
 */
function analyzeMessage(message) {
  const lowerMessage = message.toLowerCase().trim();
  
  // Check for emergency keywords
  for (const keyword of emergencyKeywords) {
    if (lowerMessage.includes(keyword)) {
      return {
        type: "emergency",
        response: predefinedResponses.emergency[0]
      };
    }
  }
  
  // Check for navigation requests
  const navigationPatterns = [
    { pattern: /(open|go to|navigate to|show|take me to).*(analytics|dashboard|stats|reports)/i, page: 'analytics', name: 'Analytics Dashboard' },
    { pattern: /(open|go to|navigate to|show|take me to).*(prescription|prescriptions|create prescription)/i, page: 'prescription', name: 'Prescription Form' },
    { pattern: /(open|go to|navigate to|show|take me to).*(history|past|records|prescription history)/i, page: 'history', name: 'Prescription History' },
    { pattern: /(open|go to|navigate to|show|take me to).*(x-ray|xray|x ray|imaging)/i, page: 'xray', name: 'X-Ray Upload' },
    { pattern: /(open|go to|navigate to|show|take me to).*(profile|settings|account)/i, page: 'profile', name: 'Doctor Profile' },
    { pattern: /(open|go to|navigate to|show|take me to).*(medicine|medicines|add medicine|medicine database)/i, page: 'medicine', name: 'Medicine Database' },
    { pattern: /(open|go to|navigate to|show|take me to).*(home|dashboard|main)/i, page: 'index', name: 'Home Dashboard' },
    // Simple patterns without action words
    { pattern: /^(analytics|dashboard|stats|reports)$/i, page: 'analytics', name: 'Analytics Dashboard' },
    { pattern: /^(prescription|prescriptions)$/i, page: 'prescription', name: 'Prescription Form' },
    { pattern: /^(history|past|records)$/i, page: 'history', name: 'Prescription History' },
    { pattern: /^(x-ray|xray|imaging)$/i, page: 'xray', name: 'X-Ray Upload' },
    { pattern: /^(profile|settings|account)$/i, page: 'profile', name: 'Doctor Profile' },
    { pattern: /^(medicine|medicines)$/i, page: 'medicine', name: 'Medicine Database' }
  ];

  for (const nav of navigationPatterns) {
    if (nav.pattern.test(lowerMessage)) {
      return {
        type: "navigation",
        action: "navigate",
        page: nav.page,
        response: `🚀 **Opening ${nav.name}...**\n\nI'll take you to the ${nav.name} page right now!\n\n💡 **Quick Tip:** You can also ask me:\n• "How to use ${nav.name.toLowerCase()}"\n• "Tell me about ${nav.name.toLowerCase()} features"\n• "Show me ${nav.name.toLowerCase()} guide"`,
        suggestions: [`How to use ${nav.name.toLowerCase()}`, `Tell me about ${nav.name.toLowerCase()} features`, "Show me other pages", "Go back to help"]
      };
    }
  }

  // Check for help/features request
  if (/^(help|features|what can you do|show features|list features|capabilities)/i.test(lowerMessage)) {
    return {
      type: "help",
      response: "**🏥 I can help you with everything about SmileCare Prescription System:**\n\n**📋 SYSTEM FEATURES & HOW TO USE:**\n\n**1. 💊 Prescription Management**\n• Create digital prescriptions (15+ treatment types)\n• Add medicines with codes or manual entry\n• Patient information management\n• Professional PDF generation\n• Automatic email to patients\n\n**2. 🔬 X-Ray & AI Analysis**\n• Upload X-ray images (JPG, PNG)\n• AI-powered analysis (cavities, fractures, infections)\n• 4-level auto-compression\n• Treatment recommendations\n• Email X-rays to patients\n\n**3. 📚 History & Analytics**\n• View all past prescriptions\n• Advanced search & filtering\n• Patient records management\n• Practice analytics & insights\n• Export & reporting\n\n**4. 💊 Medicine Database**\n• Add medicines with codes\n• Dosage management\n• Auto-populate prescriptions\n• Search by code or name\n• Marathi language support\n\n**5. 👨‍⚕️ Profile & Settings**\n• Doctor profile management\n• Clinic information setup\n• Prescription customization\n• Security settings\n• System preferences\n\n**6. 📧 Email System**\n• Automatic prescription emails\n• X-ray attachments\n• Follow-up reminders\n• Professional templates\n• Delivery tracking\n\n**7. 🖨️ Professional Printing**\n• Clinic-branded prescriptions\n• High-quality PDF generation\n• Multiple copy support\n• Standard medical formatting\n\n**8. 🤖 AI Chatbot (Me!)**\n• 24/7 medical assistance\n• Voice input/output\n• Bilingual support (English/Marathi)\n• System guidance\n• Emergency detection\n• **Page Navigation** - I can open pages for you!\n\n**🦷 MEDICAL KNOWLEDGE:**\n• **Dental Problems:** Toothache, Cavities, Gum Disease, Sensitivity, Wisdom Teeth\n• **Dental Treatments:** Root Canal, Extraction, Filling, Braces, Cleaning, Crowns, Implants\n• **Medications:** Paracetamol, Ibuprofen, Antibiotics with dosages\n• **Symptoms:** Fever, Headache, Cough, Cold with treatment advice\n• **Emergency Care:** Immediate help for urgent situations\n\n**🎤 VOICE FEATURES:**\n• **Voice Input:** Click 🎤 and speak your questions\n• **Voice Output:** Toggle 🔊 to hear responses\n• **Hands-free:** Complete voice interaction\n• **Multi-language:** English and Marathi support\n\n**🚀 NAVIGATION COMMANDS (NEW!):**\n• \"Open analytics\" - Opens Analytics Dashboard\n• \"Go to prescription\" - Opens Prescription Form\n• \"Show history\" - Opens Prescription History\n• \"Take me to X-ray\" - Opens X-Ray Upload\n• \"Navigate to profile\" - Opens Doctor Profile\n• \"Open medicine database\" - Opens Medicine Management\n• \"Go to home\" - Opens Home Dashboard\n\n**💡 SAMPLE QUESTIONS TO TRY:**\n• \"Open analytics dashboard\"\n• \"Go to prescription form\"\n• \"What should I do for severe toothache?\"\n• \"How does AI X-ray analysis work?\"\n• \"Take me to medicine database\"\n• \"Show me profile settings\"\n• \"What is root canal treatment?\"\n• \"मदत\" (for Marathi help)\n\n**🚀 QUICK START:**\n1. **New User:** Ask \"How to sign up?\"\n2. **Create Prescription:** Say \"Open prescription\"\n3. **Upload X-ray:** Say \"Go to X-ray\"\n4. **View History:** Say \"Show history\"\n5. **Add Medicines:** Say \"Open medicine database\"\n\n**Just ask me anything!** I can provide information AND take you where you need to go! 🌟"
    };
  }
  
  // Check for greetings
  if (/^(hi|hello|hey|good morning|good afternoon|good evening)/i.test(lowerMessage)) {
    return {
      type: "greeting",
      response: predefinedResponses.greeting[Math.floor(Math.random() * predefinedResponses.greeting.length)]
    };
  }
  
  // Check for thanks
  if (/thank|thanks|appreciate/i.test(lowerMessage)) {
    return {
      type: "thanks",
      response: predefinedResponses.thanks[Math.floor(Math.random() * predefinedResponses.thanks.length)]
    };
  }
  
  // Check for goodbye
  if (/bye|goodbye|see you|exit/i.test(lowerMessage)) {
    return {
      type: "goodbye",
      response: predefinedResponses.goodbye[Math.floor(Math.random() * predefinedResponses.goodbye.length)]
    };
  }
  
  // Search in knowledge base
  let bestMatch = null;
  let bestScore = 0;
  
  // Search dental problems
  for (const [key, data] of Object.entries(medicalKnowledgeBase.dentalProblems)) {
    for (const keyword of data.keywords) {
      if (lowerMessage.includes(keyword)) {
        const score = keyword.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            type: "dentalProblem",
            category: key,
            data: data
          };
        }
      }
    }
  }
  
  // Search dental treatments
  for (const [key, data] of Object.entries(medicalKnowledgeBase.dentalTreatments)) {
    for (const keyword of data.keywords) {
      if (lowerMessage.includes(keyword)) {
        const score = keyword.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            type: "dentalTreatment",
            category: key,
            data: data
          };
        }
      }
    }
  }
  
  // Search dental care
  for (const [key, data] of Object.entries(medicalKnowledgeBase.dentalCare)) {
    for (const keyword of data.keywords) {
      if (lowerMessage.includes(keyword)) {
        const score = keyword.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            type: "dentalCare",
            category: key,
            data: data
          };
        }
      }
    }
  }
  
  // Search symptoms
  for (const [key, data] of Object.entries(medicalKnowledgeBase.symptoms)) {
    for (const keyword of data.keywords) {
      if (lowerMessage.includes(keyword)) {
        const score = keyword.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            type: "symptom",
            category: key,
            data: data
          };
        }
      }
    }
  }
  
  // Search medications
  for (const [key, data] of Object.entries(medicalKnowledgeBase.medications)) {
    for (const keyword of data.keywords) {
      if (lowerMessage.includes(keyword)) {
        const score = keyword.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            type: "medication",
            category: key,
            data: data
          };
        }
      }
    }
  }
  
  // Search general topics
  for (const [key, data] of Object.entries(medicalKnowledgeBase.general)) {
    for (const keyword of data.keywords) {
      if (lowerMessage.includes(keyword)) {
        const score = keyword.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            type: "general",
            category: key,
            data: data
          };
        }
      }
    }
  }
  
  return bestMatch;
}

/**
 * Format response based on match type
 */
function formatResponse(match, isMarathiMessage = false) {
  if (!match) {
    if (isMarathiMessage) {
      return {
        message: "मला त्याबद्दल खात्री नाही. तुम्ही तुमचा प्रश्न पुन्हा सांगू शकता का? मी मदत करू शकतो:\n\n" +
                 "• सामान्य लक्षणे (ताप, डोकेदुखी, खोकला, सर्दी, पोटदुखी)\n• औषधे (पॅरासिटामॉल, आयब्युप्रोफेन, अॅस्पिरिन)\n• सिस्टम वैशिष्ट्ये (प्रिस्क्रिप्शन, एक्स-रे, चॅटबॉट)\n\n" +
                 "⚠️ **अस्वीकरण:** ही केवळ माहितीसाठी आहे. योग्य निदान आणि उपचारांसाठी नेहमी डॉक्टरांचा सल्ला घ्या.",
        suggestions: [
          "ताप काय आहे?",
          "पॅरासिटामॉल कसे वापरावे?",
          "प्रिस्क्रिप्शन कसे बनवावे?",
          "एक्स-रे वैशिष्ट्याबद्दल सांगा"
        ]
      };
    }
    return {
      message: "I'm not sure about that. Could you rephrase your question? I can help with:\n\n" +
               "🦷 **Dental Topics:**\n• Toothache, Cavities, Gum Disease\n• Root Canal, Extraction, Filling\n• Brushing, Flossing, Prevention\n\n" +
               "💊 **Medical Info:**\n• Fever, Headache, Cough\n• Paracetamol, Ibuprofen\n\n" +
               "📋 **System Features:**\n• Create Prescription\n• Upload X-ray\n• View History\n\n" +
               "Type 'Help' to see all topics!",
      suggestions: [
        "What is toothache?",
        "How to brush teeth?",
        "Tell me about root canal",
        "Help"
      ]
    };
  }
  
  let message = "";
  let suggestions = [];
  
  if (match.type === "symptom") {
    if (isMarathiMessage) {
      message = `**${match.category.toUpperCase()}**\n\n` +
                `ℹ️ ${match.data.info}\n\n` +
                `💡 **सल्ला:** ${match.data.advice}\n\n` +
                `⚠️ **अस्वीकरण:** ही सामान्य माहिती आहे. योग्य निदान आणि उपचारांसाठी कृपया डॉक्टरांचा सल्ला घ्या.`;
      
      suggestions = [
        "कोणती औषधे मदत करू शकतात?",
        "डॉक्टरांना कधी भेटावे?",
        "उपचारांबद्दल अधिक सांगा"
      ];
    } else {
      message = `**${match.category.toUpperCase()}**\n\n` +
                `ℹ️ ${match.data.info}\n\n` +
                `💡 **Advice:** ${match.data.advice}\n\n` +
                `⚠️ **Disclaimer:** This is general information. Please consult a doctor for proper diagnosis and treatment.`;
      
      suggestions = [
        "What medications can help?",
        "When should I see a doctor?",
        "Tell me more about treatments"
      ];
    }
  } else if (match.type === "medication") {
    if (isMarathiMessage) {
      message = `**${match.category.toUpperCase()}**\n\n` +
                `ℹ️ ${match.data.info}\n\n` +
                `💊 **वापर:** ${match.data.usage}\n\n` +
                `⚠️ **चेतावणी:** ${match.data.warnings}\n\n` +
                `**महत्त्वाचे:** नेहमी तुमच्या डॉक्टरांच्या प्रिस्क्रिप्शनचे पालन करा आणि औषधाचे लेबल वाचा.`;
      
      suggestions = [
        "दुष्परिणाम काय आहेत?",
        "इतर औषधांसोबत घेऊ शकतो का?",
        "डोस चुकला तर काय करावे?"
      ];
    } else {
      message = `**${match.category.toUpperCase()}**\n\n` +
                `ℹ️ ${match.data.info}\n\n` +
                `💊 **Usage:** ${match.data.usage}\n\n` +
                `⚠️ **Warnings:** ${match.data.warnings}\n\n` +
                `**Important:** Always follow your doctor's prescription and read the medication label.`;
      
      suggestions = [
        "What are the side effects?",
        "Can I take this with other medicines?",
        "What if I miss a dose?"
      ];
    }
  } else if (match.type === "dentalProblem") {
    // Format dental problem response
    message = `**🦷 ${match.category.toUpperCase()}**\n\n`;
    message += `ℹ️ **What is it?**\n${match.data.info}\n\n`;
    
    if (match.data.causes) message += `🔍 **Causes:** ${match.data.causes}\n\n`;
    if (match.data.symptoms) message += `📋 **Symptoms:** ${match.data.symptoms}\n\n`;
    if (match.data.treatment) message += `💊 **Treatment:**\n${match.data.treatment}\n\n`;
    if (match.data.prevention) message += `🛡️ **Prevention:** ${match.data.prevention}\n\n`;
    if (match.data.aftercare) message += `🏥 **Aftercare:** ${match.data.aftercare}\n\n`;
    
    message += `⚠️ **Disclaimer:** This is general information. Please consult a dentist for proper diagnosis and treatment.`;
    
    suggestions = [
      "What treatments are available?",
      "How to prevent this?",
      "When should I see a dentist?"
    ];
  } else if (match.type === "dentalTreatment") {
    // Format dental treatment response
    message = `**🦷 ${match.category.toUpperCase()}**\n\n`;
    message += `ℹ️ **About:** ${match.data.info}\n\n`;
    
    if (match.data.when) message += `📌 **When needed:** ${match.data.when}\n\n`;
    if (match.data.reasons) message += `📌 **Reasons:** ${match.data.reasons}\n\n`;
    if (match.data.types) message += `📋 **Types:** ${match.data.types}\n\n`;
    if (match.data.procedure) message += `🔧 **Procedure:**\n${match.data.procedure}\n\n`;
    if (match.data.aftercare) message += `🏥 **Aftercare:** ${match.data.aftercare}\n\n`;
    if (match.data.benefits) message += `✅ **Benefits:** ${match.data.benefits}\n\n`;
    if (match.data.care) message += `🏥 **Care:** ${match.data.care}\n\n`;
    
    message += `⚠️ **Note:** Always consult with a qualified dentist for personalized treatment.`;
    
    suggestions = [
      "How long does it take?",
      "What is the cost?",
      "Is it painful?"
    ];
  } else if (match.type === "dentalCare") {
    // Format dental care response
    message = `**🦷 ${match.category.toUpperCase()}**\n\n`;
    message += `ℹ️ **About:** ${match.data.info}\n\n`;
    
    if (match.data.technique) message += `📋 **Technique:**\n${match.data.technique}\n\n`;
    if (match.data.importance) message += `⭐ **Why important:** ${match.data.importance}\n\n`;
    if (match.data.tips) message += `💡 **Tips:** ${match.data.tips}\n\n`;
    if (match.data.goodFoods) message += `✅ ${match.data.goodFoods}\n\n`;
    if (match.data.avoidFoods) message += `❌ ${match.data.avoidFoods}\n\n`;
    if (match.data.dailyCare) message += `📅 ${match.data.dailyCare}\n\n`;
    if (match.data.regularVisits) message += `🏥 ${match.data.regularVisits}\n\n`;
    if (match.data.lifestyle) message += `🌟 **Lifestyle:** ${match.data.lifestyle}\n\n`;
    if (match.data.situations) message += `🚨 ${match.data.situations}\n\n`;
    if (match.data.firstAid) message += `🆘 **First Aid:**\n${match.data.firstAid}\n\n`;
    
    message += `💚 **Remember:** Good dental care prevents most dental problems!`;
    
    suggestions = [
      "Tell me more about dental care",
      "What foods are good for teeth?",
      "How often should I visit dentist?"
    ];
  } else if (match.type === "general") {
    message = `**${match.category.toUpperCase()}**\n\n` +
              `ℹ️ ${match.data.info}\n\n` +
              `💡 ${match.data.advice}`;
    
    if (isMarathiMessage) {
      suggestions = [
        "इतर वैशिष्ट्ये दाखवा",
        "मी कसे सुरुवात करू?",
        "अॅनालिटिक्सबद्दल सांगा"
      ];
    } else {
      suggestions = [
        "Show me other features",
        "How do I get started?",
        "Tell me about analytics"
      ];
    }
  }
  
  return { message, suggestions };
}

/**
 * Main chat handler
 */
exports.chat = async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        error: "Message is required"
      });
    }
    
    // Detect language and analyze message
    let match;
    const isMarathiMessage = isMarathi(message);
    
    if (isMarathiMessage) {
      // Analyze in Marathi
      match = analyzeMarathiMessage(message);
    } else {
      // Analyze in English
      match = analyzeMessage(message);
    }
    
    // Handle emergency
    if (match && match.type === "emergency") {
      return res.json({
        success: true,
        response: match.response,
        type: "emergency",
        suggestions: isMarathiMessage 
          ? ["आपत्कालीन सेवा कॉल करा", "जवळच्या हॉस्पिटलमध्ये जा"]
          : ["Call emergency services", "Go to nearest hospital"]
      });
    }
    
    // Handle navigation requests
    if (match && match.type === "navigation") {
      return res.json({
        success: true,
        response: match.response,
        type: match.type,
        action: match.action,
        page: match.page,
        suggestions: match.suggestions,
        conversationId: conversationId
      });
    }
    
    // Handle predefined responses
    console.log('Checking predefined responses. Match:', match);
    console.log('Match type:', match ? match.type : 'null');
    console.log('Is greeting/thanks/goodbye/help?', match && ["greeting", "thanks", "goodbye", "help"].includes(match.type));
    
    if (match && ["greeting", "thanks", "goodbye", "help"].includes(match.type)) {
      console.log('✅ Returning predefined response:', match.response.substring(0, 50));
      return res.json({
        success: true,
        response: match.response,
        type: match.type,
        suggestions: isMarathiMessage
          ? [
              "तुम्ही कोणत्या लक्षणांसाठी मदत करू शकता?",
              "औषधांबद्दल सांगा",
              "ही प्रणाली कशी वापरावी?"
            ]
          : [
              "What symptoms can you help with?",
              "Tell me about medications",
              "How to use this system?"
            ]
      });
    }
    
    // Format and return response
    const formattedResponse = formatResponse(match, isMarathiMessage);
    
    res.json({
      success: true,
      response: formattedResponse.message,
      suggestions: formattedResponse.suggestions,
      conversationId: conversationId || Date.now().toString(),
      language: isMarathiMessage ? "marathi" : "english"
    });
    
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process chat message"
    });
  }
};

/**
 * Get chatbot capabilities/help
 */
exports.getHelp = async (req, res) => {
  try {
    res.json({
      success: true,
      capabilities: {
        symptoms: Object.keys(medicalKnowledgeBase.symptoms),
        medications: Object.keys(medicalKnowledgeBase.medications),
        general: Object.keys(medicalKnowledgeBase.general)
      },
      examples: [
        "What should I do for fever?",
        "How to take paracetamol?",
        "How do I create a prescription?",
        "Tell me about the X-ray feature"
      ],
      disclaimer: "This chatbot provides general information only. Always consult a healthcare professional for medical advice."
    });
  } catch (error) {
    console.error("Chatbot help error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get help information"
    });
  }
};
