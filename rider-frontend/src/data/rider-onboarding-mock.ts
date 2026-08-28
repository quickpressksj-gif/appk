/**
 * Rider onboarding static content + form model. UI only — no Firebase, MongoDB
 * or Cloudinary. Uploads are local placeholders holding a file name.
 */

export type UploadSlot = { id: string; label: string; hint: string };

export type RiderOnboardingForm = {
  // Step 1 — Mobile
  mobile: string;
  mobileVerified: boolean;
  // Step 2 — Personal Profile
  fullName: string;
  email: string;
  dob: string;
  gender: string;
  emergencyContact: string;
  // Step 3 — Address
  address: string;
  street: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  // Step 4 — Aadhaar
  aadhaar: string;
  aadhaarFront: string;
  aadhaarBack: string;
  aadhaarVerified: boolean;
  // Step 5 — PAN
  pan: string;
  panCard: string;
  panVerified: boolean;
  // Step 6 — Live Selfie
  selfieUrl: string;
  selfieVerified: boolean;
  // Step 7 — Driving Licence
  license: string;
  dlExpiry: string;
  dlFront: string;
  dlBack: string;
  dlVerified: boolean;
  // Step 8 — Vehicle Details
  vehicleType: string;
  vehicleBrand: string;
  vehicleModel: string;
  fuelType: string;
  regYear: string;
  // Step 9 — RC Verification
  rcNumber: string;
  rcFront: string;
  rcBack: string;
  rcVerified: boolean;
  // Step 10 — Insurance
  insuranceNumber: string;
  insuranceProvider: string;
  insuranceValidTill: string;
  insuranceDoc: string;
  insuranceVerified: boolean;
  // Step 11 — Bank / Payout
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifsc: string;
  branch: string;
  upiId: string;
  bankVerified: boolean;
  // Step 12 — Working Preferences & Declaration
  preferredCity: string;
  preferredArea: string;
  employmentType: string;
  shift: string;
  termsAccepted: boolean;
};

export const emptyRiderForm: RiderOnboardingForm = {
  mobile: "",
  mobileVerified: false,
  fullName: "",
  email: "",
  dob: "",
  gender: "Male",
  emergencyContact: "",
  address: "",
  street: "",
  landmark: "",
  city: "",
  state: "Uttar Pradesh",
  pincode: "",
  aadhaar: "",
  aadhaarFront: "",
  aadhaarBack: "",
  aadhaarVerified: false,
  pan: "",
  panCard: "",
  panVerified: false,
  selfieUrl: "",
  selfieVerified: false,
  license: "",
  dlExpiry: "",
  dlFront: "",
  dlBack: "",
  dlVerified: false,
  vehicleType: "bike",
  vehicleBrand: "Hero",
  vehicleModel: "Splendor Plus",
  fuelType: "Petrol",
  regYear: "2022",
  rcNumber: "",
  rcFront: "",
  rcBack: "",
  rcVerified: false,
  insuranceNumber: "",
  insuranceProvider: "ICICI Lombard",
  insuranceValidTill: "",
  insuranceDoc: "",
  insuranceVerified: false,
  accountHolder: "",
  bankName: "",
  accountNumber: "",
  confirmAccountNumber: "",
  ifsc: "",
  branch: "",
  upiId: "",
  bankVerified: false,
  preferredCity: "",
  preferredArea: "",
  employmentType: "Full Time",
  shift: "Morning",
  termsAccepted: false,
};

export const ONBOARDING_STEPS = [
  { id: 1, key: "mobile", title: "Mobile Verification", caption: "Phone & OTP" },
  { id: 2, key: "personal", title: "Basic Profile", caption: "Personal details" },
  { id: 3, key: "address", title: "Address", caption: "Current location" },
  { id: 4, key: "aadhaar", title: "Aadhaar Verification", caption: "12-digit Aadhaar & document" },
  { id: 5, key: "pan", title: "PAN Verification", caption: "10-digit PAN card" },
  { id: 6, key: "selfie", title: "Live Selfie + Liveness", caption: "Face verification" },
  { id: 7, key: "driving", title: "Driving Licence", caption: "DL number & photo" },
  { id: 8, key: "vehicle", title: "Vehicle Details", caption: "Type, model & fuel" },
  { id: 9, key: "rc", title: "RC Verification", caption: "Vehicle registration" },
  { id: 10, key: "insurance", title: "Insurance", caption: "Vehicle policy" },
  { id: 11, key: "bank", title: "Bank & Payouts", caption: "Account & IFSC" },
  { id: 12, key: "review", title: "Final Review", caption: "Summary & submit" },
] as const;

export const GENDERS = ["Male", "Female", "Other"] as const;

export const STATES = [
  "Maharashtra",
  "Karnataka",
  "Delhi",
  "Telangana",
  "Gujarat",
  "Tamil Nadu",
  "West Bengal",
  "Rajasthan",
] as const;

export const RIDER_CITIES = [
  "Mumbai",
  "Pune",
  "Bengaluru",
  "Delhi NCR",
  "Hyderabad",
  "Ahmedabad",
  "Chennai",
  "Kolkata",
] as const;

export const VEHICLE_OPTIONS = [
  { id: "bike", label: "Bike", hint: "Motorcycle up to 350cc" },
  { id: "scooter", label: "Scooter", hint: "Petrol or electric scooter" },
  { id: "bicycle", label: "Bicycle", hint: "Short-distance deliveries" },
] as const;

export const EMPLOYMENT_TYPES = ["Full Time", "Part Time"] as const;

export const SHIFTS = ["Morning", "Afternoon", "Evening", "Night", "Flexible"] as const;

export const IDENTITY_UPLOADS: UploadSlot[] = [
  { id: "aadhaarFront", label: "Aadhaar Front", hint: "JPG or PNG, under 5 MB" },
  { id: "aadhaarBack", label: "Aadhaar Back", hint: "JPG or PNG, under 5 MB" },
  { id: "panCard", label: "PAN Card", hint: "Clear photo of the card" },
];

export const LICENSE_UPLOADS: UploadSlot[] = [
  { id: "licenseFront", label: "Driving License Front", hint: "All corners visible" },
  { id: "licenseBack", label: "Driving License Back", hint: "All corners visible" },
];

export const VEHICLE_UPLOADS: UploadSlot[] = [
  { id: "rcDoc", label: "RC Document", hint: "Registration certificate" },
  { id: "insuranceDoc", label: "Insurance", hint: "Valid policy copy" },
  { id: "vehiclePhoto", label: "Vehicle Photo", hint: "Number plate visible" },
];

export const BANKS = [
  "HDFC Bank",
  "ICICI Bank",
  "State Bank of India",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Punjab National Bank",
] as const;
