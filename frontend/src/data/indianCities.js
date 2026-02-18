// Comprehensive list of major Indian cities for dropdown selections
const INDIAN_CITIES = [
    // Andhra Pradesh
    "Amaravati", "Anantapur", "Eluru", "Guntur", "Kadapa", "Kakinada",
    "Kurnool", "Nellore", "Ongole", "Rajahmundry", "Srikakulam",
    "Tirupati", "Vijayawada", "Visakhapatnam", "Vizianagaram",

    // Arunachal Pradesh
    "Itanagar", "Naharlagun", "Pasighat", "Tawang",

    // Assam
    "Dibrugarh", "Guwahati", "Jorhat", "Nagaon", "Silchar", "Tezpur", "Tinsukia",

    // Bihar
    "Arrah", "Begusarai", "Bhagalpur", "Bihar Sharif", "Darbhanga",
    "Gaya", "Hajipur", "Muzaffarpur", "Patna", "Purnia", "Saharsa",

    // Chhattisgarh
    "Bhilai", "Bilaspur", "Durg", "Jagdalpur", "Korba", "Raigarh", "Raipur",

    // Goa
    "Margao", "Mapusa", "Panaji", "Ponda", "Vasco da Gama",

    // Gujarat
    "Ahmedabad", "Anand", "Bhavnagar", "Bhuj", "Gandhinagar", "Jamnagar",
    "Junagadh", "Mehsana", "Morbi", "Nadiad", "Navsari", "Rajkot",
    "Surat", "Vadodara", "Valsad", "Vapi",

    // Haryana
    "Ambala", "Bhiwani", "Faridabad", "Gurugram", "Hisar", "Karnal",
    "Kurukshetra", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar",

    // Himachal Pradesh
    "Dharamshala", "Hamirpur", "Kangra", "Kullu", "Manali", "Mandi", "Shimla", "Solan",

    // Jharkhand
    "Bokaro", "Deoghar", "Dhanbad", "Dumka", "Giridih", "Hazaribagh",
    "Jamshedpur", "Ranchi",

    // Karnataka
    "Bagalkot", "Ballari", "Belagavi", "Bengaluru", "Bidar", "Davanagere",
    "Dharwad", "Gadag", "Gulbarga", "Hassan", "Hubli", "Mangaluru",
    "Mysuru", "Raichur", "Shivamogga", "Tumakuru", "Udupi",

    // Kerala
    "Alappuzha", "Ernakulam", "Kannur", "Kasaragod", "Kochi", "Kollam",
    "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta",
    "Thiruvananthapuram", "Thrissur", "Wayanad",

    // Madhya Pradesh
    "Bhopal", "Dewas", "Gwalior", "Indore", "Jabalpur", "Katni",
    "Morena", "Ratlam", "Rewa", "Sagar", "Satna", "Ujjain",

    // Maharashtra
    "Ahmednagar", "Akola", "Amravati", "Aurangabad", "Chandrapur", "Dhule",
    "Jalgaon", "Kolhapur", "Latur", "Mumbai", "Nagpur", "Nanded",
    "Nashik", "Navi Mumbai", "Palghar", "Panvel", "Pune", "Ratnagiri",
    "Sangli", "Satara", "Solapur", "Thane", "Vasai-Virar",

    // Manipur
    "Imphal", "Thoubal",

    // Meghalaya
    "Shillong", "Tura",

    // Mizoram
    "Aizawl", "Lunglei",

    // Nagaland
    "Dimapur", "Kohima",

    // Odisha
    "Balasore", "Berhampur", "Bhubaneswar", "Cuttack", "Puri",
    "Rourkela", "Sambalpur",

    // Punjab
    "Amritsar", "Bathinda", "Hoshiarpur", "Jalandhar", "Ludhiana",
    "Mohali", "Moga", "Pathankot", "Patiala", "Phagwara",

    // Rajasthan
    "Ajmer", "Alwar", "Bharatpur", "Bhilwara", "Bikaner",
    "Jaipur", "Jodhpur", "Kota", "Pali", "Sikar", "Tonk", "Udaipur",

    // Sikkim
    "Gangtok", "Namchi",

    // Tamil Nadu
    "Chennai", "Coimbatore", "Dindigul", "Erode", "Hosur", "Kancheepuram",
    "Karur", "Madurai", "Nagercoil", "Namakkal", "Salem", "Thanjavur",
    "Tiruchirappalli", "Tirunelveli", "Tiruppur", "Tuticorin", "Vellore",

    // Telangana
    "Hyderabad", "Karimnagar", "Khammam", "Mahbubnagar", "Nalgonda",
    "Nizamabad", "Ramagundam", "Secunderabad", "Warangal",

    // Tripura
    "Agartala", "Udaipur (Tripura)",

    // Uttar Pradesh
    "Agra", "Aligarh", "Allahabad (Prayagraj)", "Ayodhya", "Bareilly",
    "Firozabad", "Ghaziabad", "Gorakhpur", "Jhansi", "Kanpur",
    "Lucknow", "Mathura", "Meerut", "Moradabad", "Muzaffarnagar",
    "Noida", "Saharanpur", "Varanasi",

    // Uttarakhand
    "Dehradun", "Haldwani", "Haridwar", "Kashipur", "Nainital",
    "Rishikesh", "Roorkee", "Rudrapur",

    // West Bengal
    "Asansol", "Bardhaman", "Darjeeling", "Durgapur", "Haldia",
    "Howrah", "Kalyani", "Kharagpur", "Kolkata", "Siliguri",

    // Union Territories
    "Chandigarh",
    "Daman", "Diu", "Silvassa",
    "Leh", "Srinagar", "Jammu",
    "Kavaratti",
    "Port Blair",
    "Puducherry",
    "New Delhi"
];

// Sort alphabetically for dropdown display
INDIAN_CITIES.sort((a, b) => a.localeCompare(b));

export default INDIAN_CITIES;
