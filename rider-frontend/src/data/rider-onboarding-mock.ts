/**
 * Rider onboarding static content + form model. UI only — no Firebase, MongoDB
 * or Cloudinary. Uploads are local placeholders holding a file name.
 */

export type UploadSlot = { id: string; label: string; hint: string };

export type RiderOnboardingForm = {
  // Step 1 — personal
  fullName: string;
  mobile: string;
  email: string;
  dob: string;
  gender: string;
  // Step 2 — address
  address: string;
  city: string;
  state: string;
  pincode: string;
  // Step 3 — identity
  aadhaar: string;
  pan: string;
  // Step 4 — driving
  license: string;
  // Step 5 — vehicle
  vehicleType: string;
  vehicleNumber: string;
  rcNumber: string;
  insuranceNumber: string;
  // Step 6 — bank
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  // Step 7 — preferences
  preferredCity: string;
  preferredArea: string;
  employmentType: string;
  shift: string;
};

export const emptyRiderForm: RiderOnboardingForm = {
  fullName: "",
  mobile: "",
  email: "",
  dob: "",
  gender: "Male",
  address: "",
  city: "",
  state: "",
  pincode: "",
  aadhaar: "",
  pan: "",
  license: "",
  vehicleType: "bike",
  vehicleNumber: "",
  rcNumber: "",
  insuranceNumber: "",
  accountHolder: "",
  bankName: "",
  accountNumber: "",
  ifsc: "",
  preferredCity: "",
  preferredArea: "",
  employmentType: "Full Time",
  shift: "Morning",
};

export const ONBOARDING_STEPS = [
  { id: 1, key: "personal", title: "Personal Details", caption: "Tell us about you" },
  { id: 2, key: "address", title: "Address", caption: "Where do you stay?" },
  { id: 3, key: "identity", title: "Identity Verification", caption: "Aadhaar & PAN" },
  { id: 4, key: "driving", title: "Driving Details", caption: "License information" },
  { id: 5, key: "vehicle", title: "Vehicle Details", caption: "Your delivery vehicle" },
  { id: 6, key: "bank", title: "Bank Details", caption: "For daily payouts" },
  { id: 7, key: "preferences", title: "Working Preferences", caption: "City, area & shift" },
  { id: 8, key: "review", title: "Review & Submit", caption: "Check before you submit" },
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
