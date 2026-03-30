// Bangladesh administrative hierarchy: Division → District → Thana/Upazila

export const DIVISIONS = [
  "Dhaka", "Chittagong", "Rajshahi", "Khulna",
  "Barisal", "Sylhet", "Rangpur", "Mymensingh",
];

export const DIVISIONS_BN: Record<string, string> = {
  Dhaka: "ঢাকা",
  Chittagong: "চট্টগ্রাম",
  Rajshahi: "রাজশাহী",
  Khulna: "খুলনা",
  Barisal: "বরিশাল",
  Sylhet: "সিলেট",
  Rangpur: "রংপুর",
  Mymensingh: "ময়মনসিংহ",
};

export const DISTRICTS: Record<string, string[]> = {
  Dhaka: ["Dhaka", "Faridpur", "Gazipur", "Gopalganj", "Kishoreganj", "Madaripur", "Manikganj", "Munshiganj", "Narayanganj", "Narsingdi", "Rajbari", "Shariatpur", "Tangail"],
  Chittagong: ["Chittagong", "Bandarban", "Brahmanbaria", "Chandpur", "Comilla", "Cox's Bazar", "Feni", "Khagrachhari", "Lakshmipur", "Noakhali", "Rangamati"],
  Rajshahi: ["Rajshahi", "Bogra", "Chapainawabganj", "Joypurhat", "Naogaon", "Natore", "Nawabganj", "Pabna", "Sirajganj"],
  Khulna: ["Khulna", "Bagerhat", "Chuadanga", "Jessore", "Jhenaidah", "Kushtia", "Magura", "Meherpur", "Narail", "Satkhira"],
  Barisal: ["Barisal", "Barguna", "Bhola", "Jhalokati", "Patuakhali", "Pirojpur"],
  Sylhet: ["Sylhet", "Habiganj", "Moulvibazar", "Sunamganj"],
  Rangpur: ["Rangpur", "Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Thakurgaon"],
  Mymensingh: ["Mymensingh", "Jamalpur", "Netrokona", "Sherpur"],
};

export const DISTRICTS_BN: Record<string, string> = {
  // Dhaka Division
  Dhaka: "ঢাকা",
  Faridpur: "ফরিদপুর",
  Gazipur: "গাজীপুর",
  Gopalganj: "গোপালগঞ্জ",
  Kishoreganj: "কিশোরগঞ্জ",
  Madaripur: "মাদারীপুর",
  Manikganj: "মানিকগঞ্জ",
  Munshiganj: "মুন্সীগঞ্জ",
  Narayanganj: "নারায়ণগঞ্জ",
  Narsingdi: "নরসিংদী",
  Rajbari: "রাজবাড়ী",
  Shariatpur: "শরীয়তপুর",
  Tangail: "টাঙ্গাইল",
  // Chittagong Division
  Chittagong: "চট্টগ্রাম",
  Bandarban: "বান্দরবান",
  Brahmanbaria: "ব্রাহ্মণবাড়িয়া",
  Chandpur: "চাঁদপুর",
  Comilla: "কুমিল্লা",
  "Cox's Bazar": "কক্সবাজার",
  Feni: "ফেনী",
  Khagrachhari: "খাগড়াছড়ি",
  Lakshmipur: "লক্ষ্মীপুর",
  Noakhali: "নোয়াখালী",
  Rangamati: "রাঙামাটি",
  // Rajshahi Division
  Rajshahi: "রাজশাহী",
  Bogra: "বগুড়া",
  Chapainawabganj: "চাঁপাইনবাবগঞ্জ",
  Joypurhat: "জয়পুরহাট",
  Naogaon: "নওগাঁ",
  Natore: "নাটোর",
  Nawabganj: "নবাবগঞ্জ",
  Pabna: "পাবনা",
  Sirajganj: "সিরাজগঞ্জ",
  // Khulna Division
  Khulna: "খুলনা",
  Bagerhat: "বাগেরহাট",
  Chuadanga: "চুয়াডাঙ্গা",
  Jessore: "যশোর",
  Jhenaidah: "ঝিনাইদহ",
  Kushtia: "কুষ্টিয়া",
  Magura: "মাগুরা",
  Meherpur: "মেহেরপুর",
  Narail: "নড়াইল",
  Satkhira: "সাতক্ষীরা",
  // Barisal Division
  Barisal: "বরিশাল",
  Barguna: "বরগুনা",
  Bhola: "ভোলা",
  Jhalokati: "ঝালকাঠি",
  Patuakhali: "পটুয়াখালী",
  Pirojpur: "পিরোজপুর",
  // Sylhet Division
  Sylhet: "সিলেট",
  Habiganj: "হবিগঞ্জ",
  Moulvibazar: "মৌলভীবাজার",
  Sunamganj: "সুনামগঞ্জ",
  // Rangpur Division
  Rangpur: "রংপুর",
  Dinajpur: "দিনাজপুর",
  Gaibandha: "গাইবান্ধা",
  Kurigram: "কুড়িগ্রাম",
  Lalmonirhat: "লালমনিরহাট",
  Nilphamari: "নীলফামারী",
  Panchagarh: "পঞ্চগড়",
  Thakurgaon: "ঠাকুরগাঁও",
  // Mymensingh Division
  Mymensingh: "ময়মনসিংহ",
  Jamalpur: "জামালপুর",
  Netrokona: "নেত্রকোনা",
  Sherpur: "শেরপুর",
};

export const THANAS_BN: Record<string, string> = {
  // Dhaka district thanas
  Adabor: "আদাবর", Badda: "বাড্ডা", Bangshal: "বংশাল", Cantonment: "ক্যান্টনমেন্ট",
  Dhanmondi: "ধানমন্ডি", Demra: "ডেমরা", Gulshan: "গুলশান", Hazaribagh: "হাজারীবাগ",
  Jatrabari: "যাত্রাবাড়ী", Kadamtali: "কদমতলী", Kafrul: "কাফরুল", Kalabagan: "কলাবাগান",
  Kamrangirchar: "কামরাঙ্গীরচর", Keraniganj: "কেরানীগঞ্জ", Khilgaon: "খিলগাঁও", Khilkhet: "খিলক্ষেত",
  Lalbagh: "লালবাগ", Mirpur: "মিরপুর", Mohammadpur: "মোহাম্মদপুর", Motijheel: "মতিঝিল",
  "New Market": "নিউমার্কেট", Pallabi: "পল্লবী", Paltan: "পল্টন", Ramna: "রমনা",
  Rampura: "রামপুরা", Sabujbagh: "সবুজবাগ", "Shah Ali": "শাহ আলী", Shahbagh: "শাহবাগ",
  "Sher-e-Bangla Nagar": "শের-ই-বাংলা নগর", Shyampur: "শ্যামপুর", Sutrapur: "সূত্রাপুর",
  Tejgaon: "তেজগাঁও", Turag: "তুরাগ", Uttara: "উত্তরা", Uttarkhan: "উত্তরখান", Wari: "ওয়ারী",

  // Gazipur
  "Gazipur Sadar": "গাজীপুর সদর", Kaliakair: "কালিয়াকৈর", Kaliganj: "কালীগঞ্জ",
  Kapasia: "কাপাসিয়া", Sreepur: "শ্রীপুর", Tongi: "টঙ্গী",

  // Narayanganj
  Araihazar: "আড়াইহাজার", Bandar: "বন্দর", "Narayanganj Sadar": "নারায়ণগঞ্জ সদর",
  Rupganj: "রূপগঞ্জ", Sonargaon: "সোনারগাঁও",

  // Narsingdi
  Belabo: "বেলাবো", Monohardi: "মনোহরদী", "Narsingdi Sadar": "নরসিংদী সদর",
  Palash: "পলাশ", Raipura: "রায়পুরা", Shibpur: "শিবপুর",

  // Tangail
  Basail: "বাসাইল", Bhuapur: "ভুয়াপুর", Delduar: "দেলদুয়ার", Dhanbari: "ধনবাড়ী",
  Ghatail: "ঘাটাইল", Gopalpur: "গোপালপুর", Kalihati: "কালিহাতী", Madhupur: "মধুপুর",
  Mirzapur: "মির্জাপুর", Nagarpur: "নাগরপুর", Sakhipur: "সখিপুর", "Tangail Sadar": "টাঙ্গাইল সদর",

  // Kishoreganj
  Austagram: "অষ্টগ্রাম", Bajitpur: "বাজিতপুর", Bhairab: "ভৈরব", Hossainpur: "হোসেনপুর",
  Itna: "ইটনা", Karimganj: "করিমগঞ্জ", Katiadi: "কটিয়াদী", "Kishoreganj Sadar": "কিশোরগঞ্জ সদর",
  Kuliarchar: "কুলিয়ারচর", Mithamain: "মিঠামইন", Nikli: "নিকলী", Pakundia: "পাকুন্দিয়া", Tarail: "তাড়াইল",

  // Manikganj
  Daulatpur: "দৌলতপুর", Ghior: "ঘিওর", Harirampur: "হরিরামপুর", "Manikganj Sadar": "মানিকগঞ্জ সদর",
  Saturia: "সাটুরিয়া", Shivalaya: "শিবালয়", Singair: "সিংগাইর",

  // Munshiganj
  Gazaria: "গজারিয়া", Lohajang: "লৌহজং", "Munshiganj Sadar": "মুন্সীগঞ্জ সদর",
  Sirajdikhan: "সিরাজদিখান", Sreenagar: "শ্রীনগর", Tongibari: "টঙ্গীবাড়ী",

  // Faridpur
  Alfadanga: "আলফাডাঙ্গা", Bhanga: "ভাঙ্গা", Boalmari: "বোয়ালমারী", "Char Bhadrasan": "চরভদ্রাসন",
  "Faridpur Sadar": "ফরিদপুর সদর", Madhukhali: "মধুখালী", Nagarkanda: "নগরকান্দা",
  Sadarpur: "সদরপুর", Saltha: "সালথা",

  // Gopalganj
  "Gopalganj Sadar": "গোপালগঞ্জ সদর", Kashiani: "কাশিয়ানী", Kotalipara: "কোটালীপাড়া",
  Muksudpur: "মুকসুদপুর", Tungipara: "টুঙ্গিপাড়া",

  // Madaripur
  Kalkini: "কালকিনি", "Madaripur Sadar": "মাদারীপুর সদর", Rajoir: "রাজৈর", Shibchar: "শিবচর",

  // Rajbari
  Baliakandi: "বালিয়াকান্দি", Goalanda: "গোয়ালন্দ", Kalukhali: "কালুখালী",
  Pangsha: "পাংশা", "Rajbari Sadar": "রাজবাড়ী সদর",

  // Shariatpur
  Bhedarganj: "ভেদরগঞ্জ", Damudya: "ডামুড্যা", Gosairhat: "গোসাইরহাট",
  Naria: "নড়িয়া", "Shariatpur Sadar": "শরীয়তপুর সদর", Zajira: "জাজিরা",

  // ---- Chittagong Division ----
  Anwara: "আনোয়ারা", Banshkhali: "বাঁশখালী", Boalkhali: "বোয়ালখালী", Chandanaish: "চন্দনাইশ",
  "Chittagong Port": "চট্টগ্রাম বন্দর", "Double Mooring": "ডবলমুরিং", Fatikchhari: "ফটিকছড়ি",
  Hathazari: "হাটহাজারী", Kotwali: "কোতোয়ালী", Lohagara: "লোহাগাড়া", Mirsharai: "মীরসরাই",
  Pahartali: "পাহাড়তলী", Panchlaish: "পাঁচলাইশ", Patiya: "পটিয়া", Rangunia: "রাঙ্গুনিয়া",
  Raozan: "রাউজান", Sandwip: "সন্দ্বীপ", Satkania: "সাতকানিয়া", Sitakunda: "সীতাকুণ্ড",

  // Comilla
  Barura: "বরুড়া", Brahmanpara: "ব্রাহ্মণপাড়া", Burichang: "বুড়িচং", Chandina: "চান্দিনা",
  Chauddagram: "চৌদ্দগ্রাম", "Comilla Adarsha Sadar": "কুমিল্লা আদর্শ সদর",
  "Comilla Sadar Dakshin": "কুমিল্লা সদর দক্ষিণ", Daudkandi: "দাউদকান্দি",
  Debidwar: "দেবিদ্বার", Homna: "হোমনা", Laksam: "লাকসাম", Meghna: "মেঘনা",
  Monohargonj: "মনোহরগঞ্জ", Muradnagar: "মুরাদনগর", Nangalkot: "নাঙ্গলকোট", Titas: "তিতাস",

  // Cox's Bazar
  Chakaria: "চকরিয়া", "Cox's Bazar Sadar": "কক্সবাজার সদর", Kutubdia: "কুতুবদিয়া",
  Maheshkhali: "মহেশখালী", Pekua: "পেকুয়া", Ramu: "রামু", Teknaf: "টেকনাফ", Ukhia: "উখিয়া",

  // Brahmanbaria
  Akhaura: "আখাউড়া", Bancharampur: "বাঞ্ছারামপুর", "Brahmanbaria Sadar": "ব্রাহ্মণবাড়িয়া সদর",
  Kasba: "কসবা", Nabinagar: "নবীনগর", Nasirnagar: "নাসিরনগর", Sarail: "সরাইল",
  Ashuganj: "আশুগঞ্জ", Bijoynagar: "বিজয়নগর",

  // Chandpur
  "Chandpur Sadar": "চাঁদপুর সদর", Faridganj: "ফরিদগঞ্জ", Haimchar: "হাইমচর",
  Hajiganj: "হাজীগঞ্জ", Kachua: "কচুয়া", "Matlab Dakshin": "মতলব দক্ষিণ",
  "Matlab Uttar": "মতলব উত্তর", Shahrasti: "শাহরাস্তি",

  // Feni
  Chhagalnaiya: "ছাগলনাইয়া", Daganbhuiyan: "দাগনভূঞা", "Feni Sadar": "ফেনী সদর",
  Fulgazi: "ফুলগাজী", Parshuram: "পরশুরাম", Sonagazi: "সোনাগাজী",

  // Lakshmipur
  Kamalnagar: "কমলনগর", "Lakshmipur Sadar": "লক্ষ্মীপুর সদর", Raipur: "রায়পুর",
  Ramganj: "রামগঞ্জ", Ramgati: "রামগতি",

  // Noakhali
  Begumganj: "বেগমগঞ্জ", Chatkhil: "চাটখিল", Companiganj: "কোম্পানীগঞ্জ",
  Hatiya: "হাতিয়া", Kabirhat: "কবিরহাট", "Noakhali Sadar": "নোয়াখালী সদর",
  Senbagh: "সেনবাগ", Sonaimuri: "সোনাইমুড়ী", Subarnachar: "সুবর্ণচর",

  // Rangamati
  Bagaichhari: "বাঘাইছড়ি", Barkal: "বরকল", Belaichhari: "বিলাইছড়ি",
  Juraichhari: "জুরাছড়ি", Kaptai: "কাপ্তাই", Kawkhali: "কাউখালী",
  Langadu: "লংগদু", Naniarchar: "নানিয়ারচর", Rajasthali: "রাজস্থলী",
  "Rangamati Sadar": "রাঙামাটি সদর",

  // Khagrachhari
  Dighinala: "দীঘিনালা", Guimara: "গুইমারা", "Khagrachhari Sadar": "খাগড়াছড়ি সদর",
  Lakshmichhari: "লক্ষ্মীছড়ি", Mahalchhari: "মহালছড়ি", Manikchhari: "মানিকছড়ি",
  Matiranga: "মাটিরাঙ্গা", Panchhari: "পানছড়ি", Ramgarh: "রামগড়",

  // Bandarban
  "Ali Kadam": "আলীকদম", "Bandarban Sadar": "বান্দরবান সদর", Lama: "লামা",
  Naikhongchhari: "নাইক্ষ্যংছড়ি", Rowangchhari: "রোয়াংছড়ি", Ruma: "রুমা", Thanchi: "থানচি",

  // ---- Rajshahi Division ----
  Bagha: "বাঘা", Bagmara: "বাগমারা", Boalia: "বোয়ালিয়া", Charghat: "চারঘাট",
  Durgapur: "দুর্গাপুর", Godagari: "গোদাগাড়ী", Matihar: "মতিহার", Mohanpur: "মোহনপুর",
  Paba: "পবা", Puthia: "পুঠিয়া", Rajpara: "রাজপাড়া", "Shah Makhdum": "শাহ মখদুম", Tanore: "তানোর",

  // Bogra
  Adamdighi: "আদমদীঘি", "Bogra Sadar": "বগুড়া সদর", Dhunat: "ধুনট", Dhupchanchia: "দুপচাঁচিয়া",
  Gabtali: "গাবতলী", Kahaloo: "কাহালু", Nandigram: "নন্দীগ্রাম", Sariakandi: "সারিয়াকান্দি",
  Shajahanpur: "শাজাহানপুর", Shibganj: "শিবগঞ্জ", Sonatala: "সোনাতলা",

  // Pabna
  Atgharia: "আটঘরিয়া", Bera: "বেড়া", Bhangura: "ভাঙ্গুড়া", Chatmohar: "চাটমোহর",
  Ishwardi: "ঈশ্বরদী", "Pabna Sadar": "পাবনা সদর", Santhia: "সাঁথিয়া", Sujanagar: "সুজানগর",

  // Sirajganj
  Belkuchi: "বেলকুচি", Chauhali: "চৌহালী", Kamarkhanda: "কামারখন্দ", Kazipur: "কাজীপুর",
  Raiganj: "রায়গঞ্জ", Shahjadpur: "শাহজাদপুর", "Sirajganj Sadar": "সিরাজগঞ্জ সদর",
  Tarash: "তাড়াশ", Ullahpara: "উল্লাপাড়া",

  // Naogaon
  Atrai: "আত্রাই", Badalgachhi: "বদলগাছী", Dhamoirhat: "ধামইরহাট", Mahadebpur: "মহাদেবপুর",
  Manda: "মান্দা", "Naogaon Sadar": "নওগাঁ সদর", Niamatpur: "নিয়ামতপুর",
  Patnitala: "পত্নীতলা", Porsha: "পোরশা", Raninagar: "রাণীনগর", Sapahar: "সাপাহার",

  // Natore
  Bagatipara: "বাগাতিপাড়া", Baraigram: "বড়াইগ্রাম", Gurudaspur: "গুরুদাসপুর",
  Lalpur: "লালপুর", "Natore Sadar": "নাটোর সদর", Singra: "সিংড়া",

  // Nawabganj / Chapainawabganj
  Bholahat: "ভোলাহাট", Gomastapur: "গোমস্তাপুর", Nachole: "নাচোল",
  "Nawabganj Sadar": "নবাবগঞ্জ সদর", "Chapainawabganj Sadar": "চাঁপাইনবাবগঞ্জ সদর",

  // Joypurhat
  Akkelpur: "আক্কেলপুর", "Joypurhat Sadar": "জয়পুরহাট সদর", Kalai: "কালাই",
  Khetlal: "ক্ষেতলাল", Panchbibi: "পাঁচবিবি",

  // ---- Khulna Division ----
  Batiaghata: "বটিয়াঘাটা", Dacope: "দাকোপ", Dighalia: "দিঘলিয়া",
  Dumuria: "ডুমুরিয়া", Khalishpur: "খালিশপুর", "Khan Jahan Ali": "খান জাহান আলী",
  Koyra: "কয়রা", Paikgachha: "পাইকগাছা", Phultala: "ফুলতলা", Rupsa: "রূপসা",
  Sonadanga: "সোনাডাঙ্গা", Terokhada: "তেরখাদা",

  // Jessore
  Abhaynagar: "অভয়নগর", Bagherpara: "বাঘারপাড়া", Chaugachha: "চৌগাছা",
  Jhikargachha: "ঝিকরগাছা", "Jessore Sadar": "যশোর সদর", Keshabpur: "কেশবপুর",
  Manirampur: "মণিরামপুর", Sharsha: "শার্শা",

  // Satkhira
  Assasuni: "আশাশুনি", Debhata: "দেবহাটা", Kalaroa: "কলারোয়া",
  "Satkhira Sadar": "সাতক্ষীরা সদর", Shyamnagar: "শ্যামনগর", Tala: "তালা",

  // Kushtia
  Bheramara: "ভেড়ামারা", Khoksa: "খোকসা", Kumarkhali: "কুমারখালী",
  "Kushtia Sadar": "কুষ্টিয়া সদর",

  // Bagerhat
  "Bagerhat Sadar": "বাগেরহাট সদর", Chitalmari: "চিতলমারী", Fakirhat: "ফকিরহাট",
  Mollahat: "মোল্লাহাট", Mongla: "মংলা", Morrelganj: "মোড়েলগঞ্জ",
  Rampal: "রামপাল", Sarankhola: "শরণখোলা",

  // Jhenaidah
  Harinakunda: "হরিণাকুণ্ডু", "Jhenaidah Sadar": "ঝিনাইদহ সদর",
  Kotchandpur: "কোটচাঁদপুর", Maheshpur: "মহেশপুর", Shailkupa: "শৈলকুপা",

  // Magura
  "Magura Sadar": "মাগুরা সদর", Shalikha: "শালিখা",

  // Narail
  Kalia: "কালিয়া", "Narail Sadar": "নড়াইল সদর",

  // Chuadanga
  Alamdanga: "আলমডাঙ্গা", "Chuadanga Sadar": "চুয়াডাঙ্গা সদর",
  Damurhuda: "দামুড়হুদা", Jibannagar: "জীবননগর",

  // Meherpur
  Gangni: "গাংনী", "Meherpur Sadar": "মেহেরপুর সদর", Mujibnagar: "মুজিবনগর",

  // ---- Barisal Division ----
  Agailjhara: "আগৈলঝাড়া", Babuganj: "বাবুগঞ্জ", Bakerganj: "বাকেরগঞ্জ",
  Banaripara: "বানারীপাড়া", "Barisal Sadar": "বরিশাল সদর", Gournadi: "গৌরনদী",
  Hizla: "হিজলা", Mehendiganj: "মেহেন্দিগঞ্জ", Muladi: "মুলাদী", Wazirpur: "উজিরপুর",

  // Barguna
  Amtali: "আমতলী", Bamna: "বামনা", "Barguna Sadar": "বরগুনা সদর",
  Betagi: "বেতাগী", Patharghata: "পাথরঘাটা", Taltali: "তালতলী",

  // Bhola
  "Bhola Sadar": "ভোলা সদর", Borhanuddin: "বোরহানউদ্দিন", "Char Fasson": "চরফ্যাশন",
  Daulatkhan: "দৌলতখান", Lalmohan: "লালমোহন", Manpura: "মনপুরা", Tazumuddin: "তজুমদ্দিন",

  // Jhalokati
  "Jhalokati Sadar": "ঝালকাঠি সদর", Kathalia: "কাঠালিয়া",
  Nalchity: "নলছিটি", Rajapur: "রাজাপুর",

  // Patuakhali
  Bauphal: "বাউফল", Dashmina: "দশমিনা", Dumki: "দুমকি", Galachipa: "গলাচিপা",
  Kalapara: "কলাপাড়া", Mirzaganj: "মির্জাগঞ্জ", "Patuakhali Sadar": "পটুয়াখালী সদর",
  Rangabali: "রাঙ্গাবালী",

  // Pirojpur
  Bhandaria: "ভাণ্ডারিয়া", Mathbaria: "মঠবাড়িয়া", Nazirpur: "নাজিরপুর",
  Nesarabad: "নেছারাবাদ", "Pirojpur Sadar": "পিরোজপুর সদর", Zianagar: "জিয়ানগর",

  // ---- Sylhet Division ----
  Balaganj: "বালাগঞ্জ", Beanibazar: "বিয়ানীবাজার", Bishwanath: "বিশ্বনাথ",
  "Dakshin Surma": "দক্ষিণ সুরমা", Fenchuganj: "ফেঞ্চুগঞ্জ", Golapganj: "গোলাপগঞ্জ",
  Gowainghat: "গোয়াইনঘাট", Jaintiapur: "জৈন্তাপুর", Kanaighat: "কানাইঘাট",
  "Osmani Nagar": "ওসমানী নগর", "South Surma": "দক্ষিণ সুরমা", "Sylhet Sadar": "সিলেট সদর",
  Zakiganj: "জকিগঞ্জ",

  // Habiganj
  Ajmiriganj: "আজমিরীগঞ্জ", Bahubal: "বাহুবল", Baniachang: "বানিয়াচং",
  Chunarughat: "চুনারুঘাট", "Habiganj Sadar": "হবিগঞ্জ সদর", Lakhai: "লাখাই",
  Madhabpur: "মাধবপুর", Nabiganj: "নবীগঞ্জ", Sayestaganj: "শায়েস্তাগঞ্জ",

  // Moulvibazar
  Barlekha: "বড়লেখা", Juri: "জুড়ী", Kamalganj: "কমলগঞ্জ", Kulaura: "কুলাউড়া",
  "Moulvibazar Sadar": "মৌলভীবাজার সদর", Rajnagar: "রাজনগর", Sreemangal: "শ্রীমঙ্গল",

  // Sunamganj
  Bishwamvarpur: "বিশ্বম্ভরপুর", Chhatak: "ছাতক", Derai: "দিরাই", Dharampasha: "ধর্মপাশা",
  Dowarabazar: "দোয়ারাবাজার", Jagannathpur: "জগন্নাথপুর", Jamalganj: "জামালগঞ্জ",
  Shalla: "শাল্লা", "South Sunamganj": "দক্ষিণ সুনামগঞ্জ", "Sunamganj Sadar": "সুনামগঞ্জ সদর",
  Tahirpur: "তাহিরপুর",

  // ---- Rangpur Division ----
  Badarganj: "বদরগঞ্জ", Gangachara: "গঙ্গাচড়া", Kaunia: "কাউনিয়া",
  Mithapukur: "মিঠাপুকুর", Pirgachha: "পীরগাছা", Pirganj: "পীরগঞ্জ",
  "Rangpur Sadar": "রংপুর সদর", Taraganj: "তারাগঞ্জ",

  // Dinajpur
  Biral: "বিরল", Birampur: "বিরামপুর", Birganj: "বীরগঞ্জ", Bochaganj: "বোচাগঞ্জ",
  Chirirbandar: "চিরিরবন্দর", "Dinajpur Sadar": "দিনাজপুর সদর", Fulbari: "ফুলবাড়ী",
  Ghoraghat: "ঘোড়াঘাট", Hakimpur: "হাকিমপুর", Kaharole: "কাহারোল",
  Khansama: "খানসামা", Parbatipur: "পার্বতীপুর",

  // Gaibandha
  Fulchhari: "ফুলছড়ি", "Gaibandha Sadar": "গাইবান্ধা সদর", Gobindaganj: "গোবিন্দগঞ্জ",
  Palashbari: "পলাশবাড়ী", Sadullapur: "সাদুল্লাপুর", Saghata: "সাঘাটা", Sundarganj: "সুন্দরগঞ্জ",

  // Kurigram
  Bhurungamari: "ভুরুঙ্গামারী", "Char Rajibpur": "চর রাজিবপুর", Chilmari: "চিলমারী",
  "Kurigram Sadar": "কুড়িগ্রাম সদর", Nageshwari: "নাগেশ্বরী", Phulbari: "ফুলবাড়ী",
  Rajarhat: "রাজারহাট", Rajibpur: "রাজিবপুর", Ulipur: "উলিপুর",

  // Lalmonirhat
  Aditmari: "আদিতমারী", Hatibandha: "হাতীবান্ধা",
  "Lalmonirhat Sadar": "লালমনিরহাট সদর", Patgram: "পাটগ্রাম",

  // Nilphamari
  Dimla: "ডিমলা", Domar: "ডোমার", Jaldhaka: "জলঢাকা",
  "Nilphamari Sadar": "নীলফামারী সদর", Saidpur: "সৈয়দপুর",

  // Panchagarh
  Atwari: "আটোয়ারী", Boda: "বোদা", Debiganj: "দেবীগঞ্জ",
  "Panchagarh Sadar": "পঞ্চগড় সদর", Tetulia: "তেতুলিয়া",

  // Thakurgaon
  Baliadangi: "বালিয়াডাঙ্গী", Haripur: "হরিপুর", Ranisankail: "রাণীশংকৈল",
  "Thakurgaon Sadar": "ঠাকুরগাঁও সদর",

  // ---- Mymensingh Division ----
  Bhaluka: "ভালুকা", Dhobaura: "ধোবাউড়া", Fulbaria: "ফুলবাড়িয়া",
  Gaffargaon: "গফরগাঁও", Gauripur: "গৌরীপুর", Haluaghat: "হালুয়াঘাট",
  Ishwarganj: "ঈশ্বরগঞ্জ", Muktagachha: "মুক্তাগাছা", "Mymensingh Sadar": "ময়মনসিংহ সদর",
  Nandail: "নান্দাইল", Phulpur: "ফুলপুর", Trishal: "ত্রিশাল",

  // Jamalpur
  Bakshiganj: "বকশীগঞ্জ", Dewanganj: "দেওয়ানগঞ্জ", Islampur: "ইসলামপুর",
  "Jamalpur Sadar": "জামালপুর সদর", Madarganj: "মাদারগঞ্জ", Melandaha: "মেলান্দহ",
  Sarishabari: "সরিষাবাড়ী",

  // Netrokona
  Atpara: "আটপাড়া", Barhatta: "বারহাট্টা", Kalmakanda: "কলমাকান্দা",
  Kendua: "কেন্দুয়া", Khaliajuri: "খালিয়াজুড়ী", Madan: "মদন",
  Mohanganj: "মোহনগঞ্জ", "Netrokona Sadar": "নেত্রকোনা সদর", Purbadhala: "পূর্বধলা",

  // Sherpur
  Jhenaigati: "ঝিনাইগাতী", Nakla: "নকলা", Nalitabari: "নালিতাবাড়ী",
  "Sherpur Sadar": "শেরপুর সদর", Sreebardi: "শ্রীবর্দী",
};

export const THANAS: Record<string, string[]> = {
  // Dhaka Division
  Dhaka: ["Adabor", "Badda", "Bangshal", "Cantonment", "Dhanmondi", "Demra", "Gulshan", "Hazaribagh", "Jatrabari", "Kadamtali", "Kafrul", "Kalabagan", "Kamrangirchar", "Keraniganj", "Khilgaon", "Khilkhet", "Lalbagh", "Mirpur", "Mohammadpur", "Motijheel", "New Market", "Pallabi", "Paltan", "Ramna", "Rampura", "Sabujbagh", "Shah Ali", "Shahbagh", "Sher-e-Bangla Nagar", "Shyampur", "Sutrapur", "Tejgaon", "Turag", "Uttara", "Uttarkhan", "Wari"],
  Gazipur: ["Gazipur Sadar", "Kaliakair", "Kaliganj", "Kapasia", "Sreepur", "Tongi"],
  Narayanganj: ["Araihazar", "Bandar", "Narayanganj Sadar", "Rupganj", "Sonargaon"],
  Narsingdi: ["Belabo", "Monohardi", "Narsingdi Sadar", "Palash", "Raipura", "Shibpur"],
  Tangail: ["Basail", "Bhuapur", "Delduar", "Dhanbari", "Ghatail", "Gopalpur", "Kalihati", "Madhupur", "Mirzapur", "Nagarpur", "Sakhipur", "Tangail Sadar"],
  Kishoreganj: ["Austagram", "Bajitpur", "Bhairab", "Hossainpur", "Itna", "Karimganj", "Katiadi", "Kishoreganj Sadar", "Kuliarchar", "Mithamain", "Nikli", "Pakundia", "Tarail"],
  Manikganj: ["Daulatpur", "Ghior", "Harirampur", "Manikganj Sadar", "Saturia", "Shivalaya", "Singair"],
  Munshiganj: ["Gazaria", "Lohajang", "Munshiganj Sadar", "Sirajdikhan", "Sreenagar", "Tongibari"],
  Faridpur: ["Alfadanga", "Bhanga", "Boalmari", "Char Bhadrasan", "Faridpur Sadar", "Madhukhali", "Nagarkanda", "Sadarpur", "Saltha"],
  Gopalganj: ["Gopalganj Sadar", "Kashiani", "Kotalipara", "Muksudpur", "Tungipara"],
  Madaripur: ["Kalkini", "Madaripur Sadar", "Rajoir", "Shibchar"],
  Rajbari: ["Baliakandi", "Goalanda", "Kalukhali", "Pangsha", "Rajbari Sadar"],
  Shariatpur: ["Bhedarganj", "Damudya", "Gosairhat", "Naria", "Shariatpur Sadar", "Zajira"],

  // Chittagong Division
  Chittagong: ["Anwara", "Banshkhali", "Boalkhali", "Chandanaish", "Chittagong Port", "Double Mooring", "Fatikchhari", "Hathazari", "Kotwali", "Lohagara", "Mirsharai", "Pahartali", "Panchlaish", "Patiya", "Rangunia", "Raozan", "Sandwip", "Satkania", "Sitakunda"],
  Comilla: ["Barura", "Brahmanpara", "Burichang", "Chandina", "Chauddagram", "Comilla Adarsha Sadar", "Comilla Sadar Dakshin", "Daudkandi", "Debidwar", "Homna", "Laksam", "Meghna", "Monohargonj", "Muradnagar", "Nangalkot", "Titas"],
  "Cox's Bazar": ["Chakaria", "Cox's Bazar Sadar", "Kutubdia", "Maheshkhali", "Pekua", "Ramu", "Teknaf", "Ukhia"],
  Brahmanbaria: ["Akhaura", "Bancharampur", "Brahmanbaria Sadar", "Kasba", "Nabinagar", "Nasirnagar", "Sarail", "Ashuganj", "Bijoynagar"],
  Chandpur: ["Chandpur Sadar", "Faridganj", "Haimchar", "Hajiganj", "Kachua", "Matlab Dakshin", "Matlab Uttar", "Shahrasti"],
  Feni: ["Chhagalnaiya", "Daganbhuiyan", "Feni Sadar", "Fulgazi", "Parshuram", "Sonagazi"],
  Lakshmipur: ["Kamalnagar", "Lakshmipur Sadar", "Raipur", "Ramganj", "Ramgati"],
  Noakhali: ["Begumganj", "Chatkhil", "Companiganj", "Hatiya", "Kabirhat", "Noakhali Sadar", "Senbagh", "Sonaimuri", "Subarnachar"],
  Rangamati: ["Bagaichhari", "Barkal", "Belaichhari", "Juraichhari", "Kaptai", "Kawkhali", "Langadu", "Naniarchar", "Rajasthali", "Rangamati Sadar"],
  Khagrachhari: ["Dighinala", "Guimara", "Khagrachhari Sadar", "Lakshmichhari", "Mahalchhari", "Manikchhari", "Matiranga", "Panchhari", "Ramgarh"],
  Bandarban: ["Ali Kadam", "Bandarban Sadar", "Lama", "Naikhongchhari", "Rowangchhari", "Ruma", "Thanchi"],

  // Rajshahi Division
  Rajshahi: ["Bagha", "Bagmara", "Boalia", "Charghat", "Durgapur", "Godagari", "Matihar", "Mohanpur", "Paba", "Puthia", "Rajpara", "Shah Makhdum", "Tanore"],
  Bogra: ["Adamdighi", "Bogra Sadar", "Dhunat", "Dhupchanchia", "Gabtali", "Kahaloo", "Nandigram", "Sariakandi", "Shajahanpur", "Sherpur", "Shibganj", "Sonatala"],
  Pabna: ["Atgharia", "Bera", "Bhangura", "Chatmohar", "Faridpur", "Ishwardi", "Pabna Sadar", "Santhia", "Sujanagar"],
  Sirajganj: ["Belkuchi", "Chauhali", "Kamarkhanda", "Kazipur", "Raiganj", "Shahjadpur", "Sirajganj Sadar", "Tarash", "Ullahpara"],
  Naogaon: ["Atrai", "Badalgachhi", "Dhamoirhat", "Mahadebpur", "Manda", "Naogaon Sadar", "Niamatpur", "Patnitala", "Porsha", "Raninagar", "Sapahar"],
  Natore: ["Bagatipara", "Baraigram", "Gurudaspur", "Lalpur", "Natore Sadar", "Singra"],
  Nawabganj: ["Bholahat", "Gomastapur", "Nachole", "Nawabganj Sadar", "Shibganj"],
  Chapainawabganj: ["Bholahat", "Gomastapur", "Nachole", "Chapainawabganj Sadar", "Shibganj"],
  Joypurhat: ["Akkelpur", "Joypurhat Sadar", "Kalai", "Khetlal", "Panchbibi"],

  // Khulna Division
  Khulna: ["Batiaghata", "Dacope", "Daulatpur", "Dighalia", "Dumuria", "Khalishpur", "Khan Jahan Ali", "Koyra", "Paikgachha", "Phultala", "Rupsa", "Sonadanga", "Terokhada"],
  Jessore: ["Abhaynagar", "Bagherpara", "Chaugachha", "Jhikargachha", "Jessore Sadar", "Keshabpur", "Manirampur", "Sharsha"],
  Satkhira: ["Assasuni", "Debhata", "Kalaroa", "Kaliganj", "Satkhira Sadar", "Shyamnagar", "Tala"],
  Kushtia: ["Bheramara", "Daulatpur", "Khoksa", "Kumarkhali", "Kushtia Sadar", "Mirpur"],
  Bagerhat: ["Bagerhat Sadar", "Chitalmari", "Fakirhat", "Kachua", "Mollahat", "Mongla", "Morrelganj", "Rampal", "Sarankhola"],
  Jhenaidah: ["Harinakunda", "Jhenaidah Sadar", "Kaliganj", "Kotchandpur", "Maheshpur", "Shailkupa"],
  Magura: ["Magura Sadar", "Mohammadpur", "Shalikha", "Sreepur"],
  Narail: ["Kalia", "Lohagara", "Narail Sadar"],
  Chuadanga: ["Alamdanga", "Chuadanga Sadar", "Damurhuda", "Jibannagar"],
  Meherpur: ["Gangni", "Meherpur Sadar", "Mujibnagar"],

  // Barisal Division
  Barisal: ["Agailjhara", "Babuganj", "Bakerganj", "Banaripara", "Barisal Sadar", "Gournadi", "Hizla", "Mehendiganj", "Muladi", "Wazirpur"],
  Barguna: ["Amtali", "Bamna", "Barguna Sadar", "Betagi", "Patharghata", "Taltali"],
  Bhola: ["Bhola Sadar", "Borhanuddin", "Char Fasson", "Daulatkhan", "Lalmohan", "Manpura", "Tazumuddin"],
  Jhalokati: ["Jhalokati Sadar", "Kathalia", "Nalchity", "Rajapur"],
  Patuakhali: ["Bauphal", "Dashmina", "Dumki", "Galachipa", "Kalapara", "Mirzaganj", "Patuakhali Sadar", "Rangabali"],
  Pirojpur: ["Bhandaria", "Kawkhali", "Mathbaria", "Nazirpur", "Nesarabad", "Pirojpur Sadar", "Zianagar"],

  // Sylhet Division
  Sylhet: ["Balaganj", "Beanibazar", "Bishwanath", "Companiganj", "Dakshin Surma", "Fenchuganj", "Golapganj", "Gowainghat", "Jaintiapur", "Kanaighat", "Osmani Nagar", "South Surma", "Sylhet Sadar", "Zakiganj"],
  Habiganj: ["Ajmiriganj", "Bahubal", "Baniachang", "Chunarughat", "Habiganj Sadar", "Lakhai", "Madhabpur", "Nabiganj", "Sayestaganj"],
  Moulvibazar: ["Barlekha", "Juri", "Kamalganj", "Kulaura", "Moulvibazar Sadar", "Rajnagar", "Sreemangal"],
  Sunamganj: ["Bishwamvarpur", "Chhatak", "Derai", "Dharampasha", "Dowarabazar", "Jagannathpur", "Jamalganj", "Shalla", "South Sunamganj", "Sunamganj Sadar", "Tahirpur"],

  // Rangpur Division
  Rangpur: ["Badarganj", "Gangachara", "Kaunia", "Mithapukur", "Pirgachha", "Pirganj", "Rangpur Sadar", "Taraganj"],
  Dinajpur: ["Biral", "Birampur", "Birganj", "Bochaganj", "Chirirbandar", "Dinajpur Sadar", "Fulbari", "Ghoraghat", "Hakimpur", "Kaharole", "Khansama", "Nawabganj", "Parbatipur"],
  Gaibandha: ["Fulchhari", "Gaibandha Sadar", "Gobindaganj", "Palashbari", "Sadullapur", "Saghata", "Sundarganj"],
  Kurigram: ["Bhurungamari", "Char Rajibpur", "Chilmari", "Kurigram Sadar", "Nageshwari", "Phulbari", "Rajarhat", "Rajibpur", "Ulipur"],
  Lalmonirhat: ["Aditmari", "Hatibandha", "Kaliganj", "Lalmonirhat Sadar", "Patgram"],
  Nilphamari: ["Dimla", "Domar", "Jaldhaka", "Kishoreganj", "Nilphamari Sadar", "Saidpur"],
  Panchagarh: ["Atwari", "Boda", "Debiganj", "Panchagarh Sadar", "Tetulia"],
  Thakurgaon: ["Baliadangi", "Haripur", "Pirganj", "Ranisankail", "Thakurgaon Sadar"],

  // Mymensingh Division
  Mymensingh: ["Bhaluka", "Dhobaura", "Fulbaria", "Gaffargaon", "Gauripur", "Haluaghat", "Ishwarganj", "Muktagachha", "Mymensingh Sadar", "Nandail", "Phulpur", "Trishal"],
  Jamalpur: ["Bakshiganj", "Dewanganj", "Islampur", "Jamalpur Sadar", "Madarganj", "Melandaha", "Sarishabari"],
  Netrokona: ["Atpara", "Barhatta", "Durgapur", "Kalmakanda", "Kendua", "Khaliajuri", "Madan", "Mohanganj", "Netrokona Sadar", "Purbadhala"],
  Sherpur: ["Jhenaigati", "Nakla", "Nalitabari", "Sherpur Sadar", "Sreebardi"],
};

/** Helper: returns Bangla label when language is "bn", otherwise returns English key */
export const getBnLabel = (
  map: Record<string, string>,
  key: string,
  language: string
): string => (language === "bn" ? map[key] || key : key);
